/**
 * fix-speech-kit.js - runs after every `npm install` (see "postinstall" in package.json).
 * Fixes react-native-speech-recognition-kit so the language chosen in the app (English / Hindi / Marathi)
 * is kept when the recognizer is recreated. Safe to run many times.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname, '..', 'node_modules', 'react-native-speech-recognition-kit',
  'android', 'src', 'main', 'java', 'com', 'speechrecognition', 'SpeechRecognitionModule.kt',
);

if (!fs.existsSync(file)) {
  console.log('[fix-speech-kit] library not installed - skipped');
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (src.includes('SmartHeal patch')) {
  console.log('[fix-speech-kit] already applied');
  process.exit(0);
}

const edits = [
  [
    '  private var recognitionListener: RecognitionListener? = null\n',
    '  private var recognitionListener: RecognitionListener? = null\n' +
      '  private var selectedLanguage: String? = null // SmartHeal patch: language chosen in the app (null = phone default)\n',
  ],
  [
    '      putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())\n',
    '      val lang = selectedLanguage // SmartHeal patch: keep the chosen language when the recognizer is recreated\n' +
      '      if (lang != null) {\n' +
      '        putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)\n' +
      '        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)\n' +
      '      } else {\n' +
      '        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())\n' +
      '      }\n',
  ],
  [
    '        try {\n          recognizerIntent?.putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)\n',
    '        try {\n' +
      '          selectedLanguage = if (languageTag.isBlank()) null else languageTag // SmartHeal patch\n' +
      '          recognizerIntent?.putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)\n',
  ],
];

for (const [from, to] of edits) {
  if (!src.includes(from)) {
    console.warn('[fix-speech-kit] could not find expected code - library version changed? Language switching may not work.');
    process.exit(0);
  }
  src = src.replace(from, to);
}

fs.writeFileSync(file, src);
console.log('[fix-speech-kit] applied');