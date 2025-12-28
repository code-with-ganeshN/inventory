import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCart: (state, action) => {
      state.items = action.payload.items;
      state.subtotal = action.payload.subtotal;
      state.tax = action.payload.tax;
      state.total = action.payload.total;
      state.loading = false;
    },
    addItem: (state, action) => {
      const existingItem = state.items.find(i => i.product_id === action.payload.product_id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      calculateTotals(state);
    },
    updateItem: (state, action) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      calculateTotals(state);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

function calculateTotals(state) {
  state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  state.tax = state.subtotal * 0.1;
  state.total = state.subtotal + state.tax;
}

export const { setLoading, setCart, addItem, updateItem, removeItem, clearCart, setError, clearError } = cartSlice.actions;
export default cartSlice.reducer;
