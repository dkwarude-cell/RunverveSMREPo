import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from "firebase-admin/auth";
import { Firestore, FieldValue, type Firestore as FirestoreType} from 'firebase-admin/firestore';

//const serviceAccount = require("../../service-account.json");
import serviceAccountJson from "../../service-account.json" with {
  type: "json",
};

const serviceAccount = {
  projectId: serviceAccountJson.project_id,
  clientEmail: serviceAccountJson.client_email,
  privateKey: serviceAccountJson.private_key,
};

const app: App = initializeApp({
  credential: cert(serviceAccount),
});

export const auth: Auth = getAuth(app);
export const db = new Firestore({
  projectId: serviceAccount.projectId,
  credentials: {
    client_email: serviceAccount.clientEmail,
    private_key: serviceAccount.privateKey,
  },
  databaseId: 'smartheal',
  ignoreUndefinedProperties: true,
});
export { FieldValue };

console.log('Firebase Admin initialized');

export default app;