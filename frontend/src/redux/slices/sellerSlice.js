import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const registerSeller = createAsyncThunk(
  'seller/register',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/seller/register/', formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: 'Registration failed' });
    }
  }
);

export const applyToBecomeSeller = createAsyncThunk(
  'seller/apply',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/seller/apply/', formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: 'Application failed' });
    }
  }
);

export const fetchSellerStore = createAsyncThunk(
  'seller/fetchStore',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/seller/store/');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchSellerDashboard = createAsyncThunk(
  'seller/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/seller/dashboard/');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchSellerProducts = createAsyncThunk(
  'seller/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/seller/products/');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchSellerOrders = createAsyncThunk(
  'seller/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/seller/orders/');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// ── Admin thunks ──────────────────────────────────────────────────────────────

export const fetchAdminStores = createAsyncThunk(
  'seller/fetchAdminStores',
  async (statusFilter = '', { rejectWithValue }) => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/sellers/${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const approveStore = createAsyncThunk(
  'seller/approve',
  async (storeId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/sellers/${storeId}/approve/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const rejectStore = createAsyncThunk(
  'seller/reject',
  async ({ storeId, reason }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/sellers/${storeId}/reject/`, { reason });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const sellerSlice = createSlice({
  name: 'seller',
  initialState: {
    store:      null,
    dashboard:  null,
    products:   [],
    orders:     [],
    adminStores: [],
    loading:    false,
    error:      null,
  },
  reducers: {
    clearSellerState: (state) => {
      state.store = null;
      state.dashboard = null;
      state.products = [];
      state.orders = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchSellerStore.pending,    pending)
      .addCase(fetchSellerStore.rejected,   rejected)
      .addCase(fetchSellerStore.fulfilled,  (state, action) => { state.loading = false; state.store = action.payload; })

      .addCase(fetchSellerDashboard.pending,    pending)
      .addCase(fetchSellerDashboard.rejected,   rejected)
      .addCase(fetchSellerDashboard.fulfilled,  (state, action) => { state.loading = false; state.dashboard = action.payload; })

      .addCase(fetchSellerProducts.pending,    pending)
      .addCase(fetchSellerProducts.rejected,   rejected)
      .addCase(fetchSellerProducts.fulfilled,  (state, action) => { state.loading = false; state.products = action.payload; })

      .addCase(fetchSellerOrders.pending,    pending)
      .addCase(fetchSellerOrders.rejected,   rejected)
      .addCase(fetchSellerOrders.fulfilled,  (state, action) => { state.loading = false; state.orders = action.payload; })

      .addCase(fetchAdminStores.pending,    pending)
      .addCase(fetchAdminStores.rejected,   rejected)
      .addCase(fetchAdminStores.fulfilled,  (state, action) => { state.loading = false; state.adminStores = action.payload; })

      .addCase(approveStore.fulfilled, (state, action) => {
        const idx = state.adminStores.findIndex(s => s.id === action.payload.id);
        if (idx !== -1) state.adminStores[idx] = action.payload;
      })
      .addCase(rejectStore.fulfilled, (state, action) => {
        const idx = state.adminStores.findIndex(s => s.id === action.payload.id);
        if (idx !== -1) state.adminStores[idx] = action.payload;
      });
  },
});

export const { clearSellerState } = sellerSlice.actions;
export default sellerSlice.reducer;
