import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseApp } from '../../config/firebase.config';

function storage() {
  return getStorage(getFirebaseApp());
}

export async function uploadProfileImage(userId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage(), `avatars/${userId}.jpg`);
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}

export async function uploadFile(path: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileRef = ref(storage(), path);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}
