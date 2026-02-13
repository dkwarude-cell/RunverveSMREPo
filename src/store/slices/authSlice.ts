import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../models/User';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Delegate to authService – imported at call-site to avoid circular deps
      const { login } = await import('../../services/auth/authService');
      return await login(email, password);
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Login failed');
    }
  },
);

export const signupAsync = createAsyncThunk(
  'auth/signup',
  async (
    { email, password, name }: { email: string; password: string; name: string },
    { rejectWithValue },
  ) => {
    try {
      const { signup } = await import('../../services/auth/authService');
      return await signup(email, password, name);
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Signup failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    clearError(state) {
      state.error = null;
    },
    logoutSuccess(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // signup
      .addCase(signupAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearError, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
