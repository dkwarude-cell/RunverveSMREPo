/**
 * apiClient.ts - axios instance for the SmartHeal Express backend (Backend/ folder).
 *
 * The phone / emulator reaches the backend on your PC through:
 *   adb reverse tcp:3001 tcp:3001
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error(
      '[API] Request failed:',
      error.response?.status ? `${error.response.status} ${error.config?.url ?? ''}` : error.message,
    );
    return Promise.reject(error);
  },
);

/** Turns any axios / network error into a short readable message. */
export function apiErrorMessage(error: any, fallback: string): string {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message === 'Network Error') {
    return 'Cannot reach the SmartHeal server. Make sure the backend is running and try again.';
  }
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  return error?.message || fallback;
}

export default apiClient;
