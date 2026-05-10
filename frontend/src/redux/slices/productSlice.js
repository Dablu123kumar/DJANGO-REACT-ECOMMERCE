import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetch', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchFeaturedProducts = createAsyncThunk('products/featured', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/featured/');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchProductDetail = createAsyncThunk('products/detail', async (slug, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${slug}/`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchCategories = createAsyncThunk('products/categories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/categories/');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    featured: [],
    categories: [],
    currentProduct: null,
    count: 0,
    next: null,
    previous: null,
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => { state.currentProduct = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.results || a.payload;
        s.count = a.payload.count || 0;
        s.next = a.payload.next || null;
        s.previous = a.payload.previous || null;
      })
      .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchFeaturedProducts.fulfilled, (s, a) => { s.featured = a.payload.results || a.payload; })
      .addCase(fetchProductDetail.pending, (s) => { s.detailLoading = true; s.currentProduct = null; })
      .addCase(fetchProductDetail.fulfilled, (s, a) => { s.detailLoading = false; s.currentProduct = a.payload; })
      .addCase(fetchProductDetail.rejected, (s) => { s.detailLoading = false; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload.results || a.payload; });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
