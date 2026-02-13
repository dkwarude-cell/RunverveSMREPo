import { useState, useCallback, useEffect } from 'react';
import { startListening, stopListening, isListening } from '../services/voice/speechRecognition';
import { parseCommand, VoiceCommand } from '../services/voice/commandParser';
import { speak } from '../services/voice/textToSpeech';

export function useVoiceControl(onCommand?: (cmd: VoiceCommand) => void) {
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);

  const start = useCallback(async () => {
    await startListening();
    setListening(true);
  }, []);

  const stop = useCallback(async () => {
    await stopListening();
    setListening(false);
  }, []);

  const handleTranscript = useCallback(
    (text: string) => {
      const cmd = parseCommand(text);
      if (cmd) {
        setLastCommand(cmd);
        onCommand?.(cmd);
      }
    },
    [onCommand],
  );

  const giveFeedback = useCallback(async (text: string) => {
    await speak(text);
  }, []);

  return { listening, lastCommand, start, stop, handleTranscript, giveFeedback };
}
