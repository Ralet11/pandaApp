// src/store/slices/websocketSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  connection: null,
  isConnected: false,
  isConnecting: false,
  userId: null,
  error: null,
  reconnectAttempts: 0,
  lastMessage: null,
};

const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    connectWebSocket: (s, a) => {
      s.isConnecting = true;
      s.userId = a.payload;
      s.error = null;
    },
    connectionEstablished: (s, a) => {
      s.connection = a.payload;
      s.isConnected = true;
      s.isConnecting = false;
      s.reconnectAttempts = 0;
      s.error = null;
    },
    connectionFailed: (s, a) => {
      s.isConnected = false;
      s.isConnecting = false;
      s.error = a.payload;
      s.reconnectAttempts += 1;
    },
    connectionClosed: (s) => {
      s.isConnected = false;
      s.connection = null;
    },
    messageReceived: (s, a) => {
      s.lastMessage = a.payload;
    },
    disconnect: (s) => {
      Object.assign(s, initialState);
    },
    clearWebSocketError: (s) => {
      s.error = null;
    },
  },
});

export const {
  connectWebSocket,
  connectionEstablished,
  connectionFailed,
  connectionClosed,
  messageReceived,
  disconnect,
  clearWebSocketError,
} = websocketSlice.actions;
export default websocketSlice.reducer;
