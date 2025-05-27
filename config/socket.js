// ─────────────────────────────────────────────────────────────
// hooks/useSocket.js  — FRONTEND COMPLETO (React-Native / Expo)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef }        from "react";
import { io }                       from "socket.io-client";
import axios                        from "react-native-axios";
import { useSelector, useDispatch } from "react-redux";
import {
  updateOrderState,
  addHistoricOrder,
} from "../store/slices/order.slice";
import { API_URL }                  from "@env";

import { navigationRef } from "../components/NavigationRef";
import { store }         from "../store/store";

/* ---- URL del socket ---------------------------------------------------- */
const DEV_SOCKET = "http://192.168.0.251:3000";          // ← IP local
const SOCKET_URL =
  process.env.NODE_ENV === "development"
    ? DEV_SOCKET
    : process.env.SOCKET_URL || API_URL.replace(/\/+$/, "");

export default function useSocket() {
  const dispatch  = useDispatch();
  const { id: userId } = useSelector((s) => s.user.userInfo) || {};
  const token     = useSelector((s) => s.user.token);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId || socketRef.current) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],     // sólo WebSocket, sin polling
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    /* ---------- Conexión base ---------- */
    socketRef.current.on("connect", () => {
      console.log("[socket] connected:", socketRef.current.id);
      socketRef.current.emit("joinRoom", String(userId));
    });

    socketRef.current.on("disconnect", (reason) =>
      console.log("[socket] disconnected:", reason),
    );

    socketRef.current.on("connect_error", (err) =>
      console.error("[socket] connect_error:", err.message),
    );

    /* ---------- Evento principal ---------- */
    socketRef.current.on(
      "order_state_changed",
      async ({ orderId, status }) => {
        console.log("[socket] order_state_changed:", orderId, status);

        // 1️⃣  Actualizar Redux
        dispatch(updateOrderState({ orderId, newStatus: status }));

        // 2️⃣  Si la orden aún no está en store, fetch completo
        const {
          order: { activeOrders, historicOrders },
        } = store.getState();

        const known =
          activeOrders.some((o) => o.id === orderId) ||
          historicOrders.some((o) => o.id === orderId);

        if (!known) {
          try {
            const { data: fullOrder } = await axios.get(
              `${API_URL}/order/${orderId}`,
            );
            dispatch(addHistoricOrder(fullOrder));
          } catch (e) {
            console.error("[socket] error fetching order", e.message);
          }
        }

        // 3️⃣  Navegar al tracking
        if (navigationRef.isReady()) {
          navigationRef.navigate("OrderTracking", { orderId });
        }
      },
    );

    /* ---------- Limpieza ---------- */
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, dispatch]);

  return socketRef.current;
}
