/**
 * Speech-to-text recognition service using expo-speech and native APIs.
 * Full implementation requires @react-native-voice/voice or expo-speech.
 * This provides the typed interface.
 */

let listening = false;

export async function startListening(): Promise<void> {
  listening = true;
  // Voice.start('en-US');
}

export async function stopListening(): Promise<void> {
  listening = false;
  // Voice.stop();
}

export function isListening(): boolean {
  return listening;
}
