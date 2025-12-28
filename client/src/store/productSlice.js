import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addProduct: (state, action) => {
      state.products.unshift(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeProduct: (state, action) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setTotal: (state, action) => {
      state.total = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLoading, setProducts, setCurrentProduct, setError, addProduct, updateProduct, removeProduct, setPage, setTotal, clearError } = productSlice.actions;
export default productSlice.reducer;
