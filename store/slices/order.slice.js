// ─────────────────────────────────────────────────────────────────────────────
// redux/slices/order.slice.js        (completo – incluye shop_id)
// ─────────────────────────────────────────────────────────────────────────────
import { createSlice } from "@reduxjs/toolkit";

/* ───────────────────────── Initial State ───────────────────────── */
const initialState = {
  currentOrder: {
    id          : null,
    user_id     : null,
    shop_id     : null,      // ←── NUEVO  ⚠️  (id del comercio)
    partner_id  : null,
    price       : 0,
    finalPrice  : 0,
    deliveryFee : 0,
    deliveryAddress: "",
    items       : [],
    status      : "pendiente",
  },
  historicOrders: [],
  activeOrders  : [],
};

/* ────────────────────────── Slice ──────────────────────────────── */
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    /* ------- Current order ------- */
    setCurrentOrder: (state, { payload }) => {
      state.currentOrder = { ...state.currentOrder, ...payload };
    },
    setOrderItems: (state, { payload }) => {
      state.currentOrder.items = payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = initialState.currentOrder;
    },

    /* ------- Activas + históricas ------- */
    addCurrentOrderToActiveOrders: (state, { payload }) => {
      const { order, items } = payload;
      const entry = { ...order, items: items || [], status: "pendiente" };

      if (!state.activeOrders.find((o) => o.id === entry.id)) {
        state.activeOrders.push(entry);
      }
      if (!state.historicOrders.find((o) => o.id === entry.id)) {
        state.historicOrders.push(entry);
      }
      state.currentOrder = { ...entry };
    },

    /* ------- Históricas desde backend ------- */
    addHistoricOrder: (state, { payload }) => {
      const found = state.historicOrders.find((o) => o.id === payload.id);
      found ? Object.assign(found, payload) : state.historicOrders.push(payload);
    },
    setHistoricOrders: (state, { payload }) => { state.historicOrders = payload },

    /* ------- Actualizar estados ------- */
    updateOrderState: (state, { payload }) => {
      const { orderId, newStatus } = payload;
      const apply = (arr) => {
        const o = arr.find((x) => x.id === orderId);
        if (o) o.status = newStatus;
      };
      apply(state.historicOrders);
      apply(state.activeOrders);
      if (state.currentOrder.id === orderId) state.currentOrder.status = newStatus;
    },

    /* ------- Utilidades ------- */
    removeHistoricOrder: (state, { payload }) => {
      state.historicOrders = state.historicOrders.filter((o) => o.id !== payload);
    },
    setCurrentOrderById: (state, { payload }) => {
      const found = state.historicOrders.find((o) => o.id === payload);
      if (found) state.currentOrder = { ...found };
    },
  },
});

export const {
  setCurrentOrder,
  setOrderItems,
  clearCurrentOrder,
  addCurrentOrderToActiveOrders,
  addHistoricOrder,
  updateOrderState,
  removeHistoricOrder,
  setHistoricOrders,
  setCurrentOrderById,
} = orderSlice.actions;

export default orderSlice.reducer;
