import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart/');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ product_id, quantity = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/', { product_id, quantity });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ item_id, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/items/${item_id}/`, { quantity });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const removeCartItem = createAsyncThunk('cart/remove', async (item_id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/items/${item_id}/`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart/');
    return { items: [], total_items: 0, subtotal: 0 };
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total_items: 0,
    subtotal: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.items = action.payload.items || [];
      state.total_items = action.payload.total_items || 0;
      state.subtotal = parseFloat(action.payload.subtotal || 0);
      state.loading = false;
    };
    builder
      .addCase(fetchCart.pending, (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (s) => { s.loading = false; })
      .addCase(addToCart.pending, (state, action) => {
        // Optimistic UI update for Add to Cart so the navbar badge updates instantly
        const { quantity = 1 } = action.meta.arg;
        state.total_items += quantity;
      })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartItem.pending, (state, action) => {
        // Optimistic UI update for quantity change
        const { item_id, quantity } = action.meta.arg;
        const item = state.items.find(i => i.id === item_id);
        if (item) {
          item.quantity = quantity;
          item.total_price = parseFloat(item.unit_price) * quantity;
          state.subtotal = state.items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);
          state.total_items = state.items.reduce((sum, i) => sum + i.quantity, 0);
        }
      })
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeCartItem.pending, (state, action) => {
        // Optimistic UI update for removal
        const item_id = action.meta.arg;
        state.items = state.items.filter(i => i.id !== item_id);
        state.subtotal = state.items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);
        state.total_items = state.items.reduce((sum, i) => sum + i.quantity, 0);
      })
      .addCase(removeCartItem.fulfilled, setCart)
      .addCase(clearCart.fulfilled, setCart);
  },
});

export default cartSlice.reducer;
