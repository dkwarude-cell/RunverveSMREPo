export interface VoiceCommand {
  category: 'session' | 'intensity' | 'info';
  action: string;
  value?: number;
}

const COMMAND_MAP: Record<string, VoiceCommand> = {
  'start session': { category: 'session', action: 'start' },
  'begin session': { category: 'session', action: 'start' },
  'start treatment': { category: 'session', action: 'start' },
  'stop session': { category: 'session', action: 'stop' },
  'end session': { category: 'session', action: 'stop' },
  'stop treatment': { category: 'session', action: 'stop' },
  'pause session': { category: 'session', action: 'pause' },
  'pause treatment': { category: 'session', action: 'pause' },
  'resume session': { category: 'session', action: 'resume' },
  'continue session': { category: 'session', action: 'resume' },
  'increase intensity': { category: 'intensity', action: 'increase' },
  'turn it up': { category: 'intensity', action: 'increase' },
  higher: { category: 'intensity', action: 'increase' },
  'decrease intensity': { category: 'intensity', action: 'decrease' },
  'turn it down': { category: 'intensity', action: 'decrease' },
  lower: { category: 'intensity', action: 'decrease' },
  'battery level': { category: 'info', action: 'battery' },
  'battery status': { category: 'info', action: 'battery' },
  'time remaining': { category: 'info', action: 'time' },
  'time left': { category: 'info', action: 'time' },
};

export function parseCommand(text: string): VoiceCommand | null {
  const lower = text.toLowerCase().trim();

  // Check for "set intensity to X"
  const setMatch = lower.match(/set intensity to (\d+)/);
  if (setMatch) {
    return { category: 'intensity', action: 'set', value: parseInt(setMatch[1], 10) };
  }

  for (const [phrase, command] of Object.entries(COMMAND_MAP)) {
    if (lower.includes(phrase)) return command;
  }

  return null;
}
