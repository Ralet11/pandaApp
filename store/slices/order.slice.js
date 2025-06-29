// ─────────────────────────────────────────────────────────────────────────────
// redux/slices/order.slice.js   (completo – tracking + shop_id + ubicación)
// ─────────────────────────────────────────────────────────────────────────────
import { createSlice } from "@reduxjs/toolkit";

/* ───────────────────────── Initial State ───────────────────────── */
const initialState = {
  currentOrder: {
    id:             null,
    user_id:        null,
    shop_id:        null,   // ← id del comercio
    partner_id:     null,
    price:          0,
    finalPrice:     0,
    deliveryFee:    0,
    deliveryAddress:"",
    deliveryLat:    null,   // ← coordenadas del repartidor
    deliveryLng:    null,
    deliveryName:   "",
    items:          [],
    status:         "pendiente",
  },
  historicOrders: [],
  activeOrders:   [],
};

/* ────────────────────────── Slice ──────────────────────────────── */
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    /* ------- Orden actual ------- */
    setCurrentOrder: (state, { payload }) => {
      state.currentOrder = { ...state.currentOrder, ...payload };
    },
    setOrderItems: (state, { payload }) => { state.currentOrder.items = payload },
    clearCurrentOrder: (state) => { state.currentOrder = initialState.currentOrder },

    /* ------- Tracking en vivo (nueva acción) ------- */
    updateOrderLocation: (state, { payload }) => {
      const { deliveryLat, deliveryLng, deliveryName } = payload;
      if (!state.currentOrder) return;
      state.currentOrder.deliveryLat  = deliveryLat;
      state.currentOrder.deliveryLng  = deliveryLng;
      state.currentOrder.deliveryName = deliveryName;
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
  updateOrderLocation,        // ← exportamos la nueva acción
  addCurrentOrderToActiveOrders,
  addHistoricOrder,
  updateOrderState,
  removeHistoricOrder,
  setHistoricOrders,
  setCurrentOrderById,
} = orderSlice.actions;

export default orderSlice.reducer;
