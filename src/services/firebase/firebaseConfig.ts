import { initializeApp, getApps, getApp } from 'firebase/app';
import ENV from '../../config/env';

export function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(ENV.firebase);
  }
  return getApp();
}
