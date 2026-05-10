import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchOrders = createAsyncThunk('orders/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/orders/');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchOrderDetail = createAsyncThunk('orders/detail', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}/`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const placeOrder = createAsyncThunk('orders/place', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders/place/', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const cancelOrder = createAsyncThunk('orders/cancel', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/orders/${id}/cancel/`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const validateCoupon = createAsyncThunk('orders/validateCoupon', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/coupons/validate/', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [],
    currentOrder: null,
    coupon: null,
    loading: false,
    detailLoading: false,
    placing: false,
    error: null,
  },
  reducers: {
    clearCoupon: (state) => { state.coupon = null; },
    clearCurrentOrder: (state) => { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchOrders.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.results || a.payload; })
      .addCase(fetchOrders.rejected, (s) => { s.loading = false; })
      .addCase(fetchOrderDetail.pending, (s) => { s.detailLoading = true; })
      .addCase(fetchOrderDetail.fulfilled, (s, a) => { s.detailLoading = false; s.currentOrder = a.payload; })
      .addCase(fetchOrderDetail.rejected, (s) => { s.detailLoading = false; })
      .addCase(placeOrder.pending, (s) => { s.placing = true; })
      .addCase(placeOrder.fulfilled, (s, a) => { s.placing = false; s.list = [a.payload, ...s.list]; })
      .addCase(placeOrder.rejected, (s) => { s.placing = false; })
      .addCase(cancelOrder.fulfilled, (s, a) => {
        s.list = s.list.map(o => o.id === a.payload.id ? a.payload : o);
        if (s.currentOrder?.id === a.payload.id) s.currentOrder = a.payload;
      })
      .addCase(validateCoupon.fulfilled, (s, a) => { s.coupon = a.payload; });
  },
});

export const { clearCoupon, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
