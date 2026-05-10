import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login/', credentials);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' });
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register/', data);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Registration failed' });
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/profile/');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.patch('/auth/profile/', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const refresh = localStorage.getItem('refresh_token');
  try {
    await api.post('/auth/logout/', { refresh });
  } catch {}
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
});

// Load user from localStorage on app start
const storedUser = (() => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('access_token'); return null; }
    return null; // Will be loaded via fetchProfile
  } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => { state.user = action.payload; state.isAuthenticated = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchProfile.pending, (s) => { s.loading = true; })
      .addCase(fetchProfile.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.isAuthenticated = true; })
      .addCase(fetchProfile.rejected, (s) => { s.loading = false; s.user = null; s.isAuthenticated = false; localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
