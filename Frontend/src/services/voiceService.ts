/**
 * voiceService.ts - voice for the Assistant chat.
 *
 *   Voice (speech-to-text): English - react-native-speech-recognition-kit (inline, live text in the box)
 *                           Hindi / Marathi - Google's voice-typing popup via the app's native module (dictate)
 *   Tts   (text-to-speech):  the app's own native module (android/.../voice/SmartHealVoiceModule.kt)
 *
 * Both expose the same simple API to AssistantScreen. Speech-to-text keeps a "session" number per mic tap
 * and only passes on the first final result / error of each session (Android sometimes sends them twice).
 */
import { DeviceEventEmitter, EmitterSubscription, NativeModules, Platform } from 'react-native';
import * as Kit from 'react-native-speech-recognition-kit';

type NativeVoice = {
  dictate(language: string | null, prompt: string | null): Promise<string | null>;
  speak(text: string, utteranceId: string): Promise<string>;
  stopSpeaking(): Promise<null>;
  openTtsSettings(): void;
};

const Native: NativeVoice | undefined = NativeModules.SmartHealVoice;

/** false if the native module isn't in this build (e.g. the app wasn't rebuilt after adding it) */
export const voiceAvailable = Platform.OS === 'android' && !!Native;

const NOT_BUILT = 'Voice features need a fresh build of the app (npx react-native run-android).';

export type VoiceEvent = { session: number; text?: string; code?: number; message?: string; level?: number };
export type TtsEvent = { id: string };

const on = <T>(name: string, fn: (e: T) => void): EmitterSubscription => DeviceEventEmitter.addListener(name, fn);

// ─────────── speech-to-text ───────────
const E = Kit.speechRecogntionEvents;
let session = 0; // current mic tap
let finished = true; // current session already got its final result / error
let heard = false; // speech detected in this session
let retried = false; // already retried this session after a start-up error

/** Errors that happen when the phone's speech service isn't connected yet (first tap) - retried silently once. */
const STARTUP_ERRORS = [5, 8, 11]; // client error / busy / server disconnected

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Languages for voice input ('' = the phone's default language, inline mic).
 * Other languages use Google's voice-typing popup. Replies follow whatever language you speak.
 */
export const VOICE_LANGUAGES = [
  { tag: '', label: 'English', short: 'EN', prompt: '' },
  { tag: 'hi-IN', label: 'हिंदी', short: 'हिं', prompt: 'बोलिए…' },
  { tag: 'mr-IN', label: 'मराठी', short: 'मरा', prompt: 'बोला…' },
];
let voiceLanguage = ''; // kept here so it survives switching tabs

// error handling is shared so a silent retry can still report a real failure
type ErrorFn = (e: VoiceEvent) => void;
const errorFns = new Set<ErrorFn>();
let errorSub: { remove(): void } | null = null;

const reportError = (code: number, message: string) => {
  if (finished) return;
  finished = true;
  errorFns.forEach(fn => fn({ session, code, message }));
};

function ensureErrorSub() {
  if (errorSub) return;
  errorSub = Kit.addEventListener(E.ERROR, (e: any) => {
    if (finished) return; // errors after a result are normal on Android - ignore
    const code = Number(e?.code);
    const message = typeof e?.message === 'string' ? e.message : 'Voice input failed';
    if (STARTUP_ERRORS.includes(code) && !heard && !retried) {
      // first tap after opening the app: the speech service wasn't connected yet - try again quietly
      retried = true;
      const mine = session;
      wait(350)
        .then(() => (mine === session && !finished ? Kit.startListening() : null))
        .catch(() => reportError(code, 'Voice input is not available right now. Please try again.'));
      return;
    }
    reportError(code, message);
  });
}

export const Voice = {
  getLanguage: () => voiceLanguage,
  setLanguage(tag: string) {
    voiceLanguage = tag;
  },
  /** Google's "Speak now" popup in a given language. Resolves with the text, or null if the user closed it. */
  dictate(language: string, prompt?: string): Promise<string | null> {
    if (!Native) return Promise.reject(new Error(NOT_BUILT));
    return Native.dictate(language || null, prompt || null);
  },
  /** Starts listening in the chosen language; resolves with the session number of this mic tap. */
  async start(_language?: string): Promise<number> {
    session += 1;
    finished = false;
    heard = false;
    retried = false;
    const mine = session;
    try {
      await Kit.startListening();
    } catch (e: any) {
      const code = String(e?.code ?? e?.message ?? '');
      if (!code.includes('ALREADY_LISTENING')) {
        finished = true;
        throw new Error(code.includes('PERMISSION') ? 'Microphone permission needed.' : 'Voice input is not available right now. Make sure the Google app is installed and updated.');
      }
      // a previous round was still open: stop it and start again
      await Kit.stopListening().catch(() => null);
      await wait(400);
      await Kit.startListening();
    }
    return mine;
  },
  /** Stops listening; the final result of what was said still arrives. */
  stop(): Promise<unknown> {
    return Kit.stopListening().catch(() => null);
  },
  /** Cancels without a result. Never calls the library's destroy() - that disables the mic until restart. */
  cancel(): Promise<unknown> {
    finished = true;
    session += 1;
    return Kit.stopListening().catch(() => null);
  },
  onReady: (fn: (e: VoiceEvent) => void) =>
    Kit.addEventListener(E.START, () => {
      if (!finished) fn({ session });
    }),
  onPartial: (fn: (e: VoiceEvent) => void) =>
    Kit.addEventListener(E.PARTIAL_RESULTS, (e: any) => {
      if (finished || !e?.value) return;
      heard = true;
      fn({ session, text: String(e.value) });
    }),
  onResult: (fn: (e: VoiceEvent) => void) =>
    Kit.addEventListener(E.RESULTS, (e: any) => {
      if (finished) return; // duplicate result - ignore
      finished = true;
      fn({ session, text: String(e?.value ?? '') });
    }),
  onError: (fn: ErrorFn) => {
    ensureErrorSub();
    errorFns.add(fn);
    return { remove: () => errorFns.delete(fn) };
  },
  onEnd: (fn: (e: VoiceEvent) => void) =>
    Kit.addEventListener(E.END, () => {
      if (!finished) fn({ session });
    }),
  onLevel: (fn: (e: VoiceEvent) => void) =>
    Kit.addEventListener(E.VOLUME_CHANGED, (e: any) => {
      if (!finished) fn({ session, level: Number(e?.value ?? 0) });
    }),
};

// mark speech as heard as soon as the user starts talking (so later errors are reported, not retried)
Kit.addEventListener(E.BEGIN, () => {
  if (!finished) heard = true;
});

// Android SpeechRecognizer error codes
export const STT_NOTHING_HEARD = [6, 7]; // speech timeout / no match

// ─────────── text-to-speech ───────────
export const Tts = {
  /** Android's limit is 4000 characters per piece; we stay below it. */
  maxLength: 3500,
  speak(text: string, utteranceId: string): Promise<string> {
    if (!Native) return Promise.reject(new Error(NOT_BUILT));
    return Native.speak(text, utteranceId);
  },
  stop(): Promise<unknown> {
    return Native ? Native.stopSpeaking().catch(() => null) : Promise.resolve(null);
  },
  openSettings() {
    Native?.openTtsSettings();
  },
  onStart: (fn: (e: TtsEvent) => void) => on('SmartHealTts_start', fn),
  onDone: (fn: (e: TtsEvent) => void) => on('SmartHealTts_done', fn),
  onError: (fn: (e: TtsEvent) => void) => on('SmartHealTts_error', fn),
  onStopped: (fn: (e: TtsEvent) => void) => on('SmartHealTts_stopped', fn),
};