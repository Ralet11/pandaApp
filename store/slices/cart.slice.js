// store/slices/cart.slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;

      // Verificar si ya existe un ítem con esa misma ID (que incluye la config de ingredientes)
      const existingIndex = state.items.findIndex(
        (item) => item.id === newItem.id
      );

      if (existingIndex >= 0) {
        // Si existe, simplemente aumenta la cantidad
        state.items[existingIndex].quantity += newItem.quantity;
      } else {
        // Si no existe, se agrega como nuevo ítem al array
        state.items.push(newItem);
      }
    },
    removeItem: (state, action) => {
      const idToRemove = action.payload;
      state.items = state.items.filter((item) => item.id !== idToRemove);
    },
    // Renombramos esta acción para que coincida con la llamada en CartScreen
    updateItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const index = state.items.findIndex((item) => item.id === id);
      if (index >= 0 && quantity > 0) {
        state.items[index].quantity = quantity;
        // También podrías recalcular el totalPrice si dependiera de la cantidad
        state.items[index].totalPrice =
          state.items[index].pricePerUnit * quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
