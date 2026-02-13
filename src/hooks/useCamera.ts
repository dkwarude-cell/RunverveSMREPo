import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, CameraView } from 'expo-camera';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = useCallback(async () => {
    if (cameraRef.current && cameraReady) {
      return cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
    }
    return null;
  }, [cameraReady]);

  return { hasPermission, cameraReady, cameraRef, setCameraReady, takePicture };
}
