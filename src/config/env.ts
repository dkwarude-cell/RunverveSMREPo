/** Environment configuration – replace values with real credentials before deployment */
const ENV = {
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
  ble: {
    serviceUUID: '0000FFF0-0000-1000-8000-00805F9B34FB',
    commandCharUUID: '0000FFF1-0000-1000-8000-00805F9B34FB',
    statusCharUUID: '0000FFF2-0000-1000-8000-00805F9B34FB',
  },
  ai: {
    modelPath: 'movenet_lightning.tflite',
    inputSize: 192,
    confidenceThreshold: 0.3,
  },
} as const;

export default ENV;
