/**
 * Link to the SmartHeal device simulator through Runverve's WebSocket relay.
 *
 * The simulator runs the real firmware (v0.2.0) in the browser, so the payloads are the
 * same device lines the USB serial monitor shows - see ./protocol. The relay wraps each
 * one in a small JSON envelope:
 *
 *   {"t":"connected"}
 *   {"t":"notify","d":"I:SmartHeal-Integrated v0.2.0 proto=2 heat=off ..."}
 *   {"t":"notify","d":"S:e=484,g=1677,ax=-33,...,vb=0000,tm=1,tl=0,tq=0"}
 *
 * The envelope the relay expects for app -> device writes is not published, so instead of
 * guessing it this link negotiates it on connect: it sends `?` (a status query, which
 * drives no outputs and so is safe on a therapy device) in each candidate form and keeps
 * the one that comes back with a fresh `I:` status line. Commands issued before that
 * finishes are queued, not dropped.
 *
 * The pairing code is shown on the simulator page and changes on every page load, so it
 * is entered at runtime; the partner key comes from Runverve.
 */
import {
  DeviceCommands,
  DeviceTelemetry,
  emptyTelemetry,
  parseDeviceLine,
  readTelemetry,
} from './protocol';

export const RELAY_URL = 'wss://smartheal.runverve.in/devsim/ws';

/** Candidate write envelopes, most likely first. */
const ENVELOPES: { name: string; wrap: (command: string) => string }[] = [
  { name: 'json:write', wrap: c => JSON.stringify({ t: 'write', d: c }) },
  { name: 'json:cmd', wrap: c => JSON.stringify({ t: 'cmd', d: c }) },
  { name: 'json:rx', wrap: c => JSON.stringify({ t: 'rx', d: c }) },
  { name: 'json:send', wrap: c => JSON.stringify({ t: 'send', d: c }) },
  { name: 'json:data', wrap: c => JSON.stringify({ t: 'data', d: c }) },
  { name: 'json:bare', wrap: c => JSON.stringify({ d: c }) },
  { name: 'text', wrap: c => `${c}\n` },
];

/** The device streams `S:` lines unprompted, so settle first and only count a new `I:`. */
const SETTLE_MS = 1500;
const REPLY_WAIT_MS = 900;

export type SimulatorStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

export type SimulatorEvents = {
  onStatus?: (status: SimulatorStatus, detail?: string) => void;
  onTelemetry?: (telemetry: DeviceTelemetry) => void;
  /** Every device line, for the on-screen log. */
  onLine?: (line: string) => void;
};

export type SimulatorCredentials = { code: string; key: string };

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export class SimulatorLink {
  private socket: WebSocket | null = null;
  private telemetry: DeviceTelemetry = emptyTelemetry();
  private envelope: ((command: string) => string) | null = null;
  private envelopeName = '';
  private queue: string[] = [];
  private sawStatusLine = false;

  constructor(private readonly events: SimulatorEvents = {}) {}

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  get lastTelemetry() {
    return this.telemetry;
  }

  /** Which write envelope was negotiated, for diagnostics. */
  get writeFormat() {
    return this.envelopeName;
  }

  connect({ code, key }: SimulatorCredentials) {
    this.disconnect();
    const url =
      `${RELAY_URL}?role=app` +
      `&code=${encodeURIComponent(code.trim())}` +
      `&key=${encodeURIComponent(key.trim())}`;
    this.events.onStatus?.('connecting');

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.events.onStatus?.('connected');
      void this.negotiate(socket);
    };
    socket.onmessage = event => this.receive(String(event.data));
    socket.onerror = () => this.events.onStatus?.('error', 'Relay connection failed');
    socket.onclose = event => {
      if (this.socket === socket) this.socket = null;
      this.envelope = null;
      this.envelopeName = '';
      this.events.onStatus?.('closed', event.reason || undefined);
    };
  }

  disconnect() {
    const socket = this.socket;
    this.socket = null;
    this.envelope = null;
    this.envelopeName = '';
    this.queue = [];
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      try {
        socket.close();
      } catch {
        // already closing
      }
    }
  }

  /**
   * Sends one command line. Returns false only when nothing is connected; while the write
   * envelope is still being negotiated the command is queued and sent straight after.
   */
  send(command: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    if (!this.envelope) {
      this.queue.push(command);
      return true;
    }
    this.socket.send(this.envelope(command));
    return true;
  }

  /** Tries each envelope with a harmless `?` until one answers with a fresh `I:` line. */
  private async negotiate(socket: WebSocket) {
    await delay(SETTLE_MS); // let the relay's own opening burst pass
    if (this.socket !== socket || socket.readyState !== WebSocket.OPEN) return;

    for (const candidate of ENVELOPES) {
      this.sawStatusLine = false;
      try {
        socket.send(candidate.wrap(DeviceCommands.status()));
      } catch {
        continue;
      }

      await delay(REPLY_WAIT_MS);
      if (this.socket !== socket) return;

      if (this.sawStatusLine) {
        this.envelope = candidate.wrap;
        this.envelopeName = candidate.name;
        const queued = this.queue.splice(0);
        for (const command of queued) socket.send(candidate.wrap(command));
        this.events.onStatus?.('connected', `commands: ${candidate.name}`);
        return;
      }
    }

    // Telemetry keeps flowing, so the link stays "connected"; only commands are unavailable.
    this.queue = [];
    this.events.onStatus?.('connected', 'telemetry only - no command format accepted');
  }

  private receive(raw: string) {
    let line = raw;
    try {
      const envelope = JSON.parse(raw);
      if (envelope && typeof envelope === 'object') {
        if (typeof envelope.d !== 'string') return; // {"t":"connected"} and friends
        line = envelope.d;
      }
    } catch {
      // Not JSON: treat the payload as a bare device line.
    }

    if (!line.trim()) return;
    if (line.startsWith('I:')) this.sawStatusLine = true;
    this.events.onLine?.(line);

    const parsed = parseDeviceLine(line);
    if (!parsed) return;
    this.telemetry = readTelemetry(parsed.fields, this.telemetry);
    this.events.onTelemetry?.(this.telemetry);
  }
}
