import { useCallback } from 'react';
import { useDevice } from '../store/hooks/useDevice';

export function useBLE() {
  const device = useDevice();
  return device;
}
