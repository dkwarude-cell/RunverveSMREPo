import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import ENV from './env';

let app: FirebaseApp;

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(ENV.firebase);
  } else {
    app = getApp();
  }
  return app;
}
