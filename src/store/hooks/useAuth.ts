import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '..';
import { loginAsync, signupAsync, logoutSuccess, clearError } from '../slices/authSlice';
import { logout as firebaseLogout } from '../../services/auth/authService';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error } = useSelector((s: RootState) => s.auth);

  const login = useCallback(
    (email: string, password: string) => dispatch(loginAsync({ email, password })),
    [dispatch],
  );

  const signup = useCallback(
    (email: string, password: string, name: string) =>
      dispatch(signupAsync({ email, password, name })),
    [dispatch],
  );

  const logout = useCallback(async () => {
    await firebaseLogout();
    dispatch(logoutSuccess());
  }, [dispatch]);

  const dismissError = useCallback(() => dispatch(clearError()), [dispatch]);

  return { user, isAuthenticated, loading, error, login, signup, logout, dismissError };
}
