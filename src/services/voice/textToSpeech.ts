import * as Speech from 'expo-speech';

export async function speak(text: string): Promise<void> {
  return new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: resolve,
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
