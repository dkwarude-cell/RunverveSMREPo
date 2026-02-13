import { useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Offline-first sync hook – watches network state and triggers
 * a sync callback when the device comes back online.
 * Full implementation would queue writes to AsyncStorage when
 * offline and flush them to Firebase on reconnect.
 */
export function useOfflineSync(syncFn: () => Promise<void>) {
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && wasOffline.current) {
        syncFn();
      }
      wasOffline.current = !state.isConnected;
    });
    return () => unsubscribe();
  }, [syncFn]);
}
