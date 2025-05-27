// ─────────────────────────────────────────────────────────────────────────────
// src/screens/CartScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons as Icon, Feather } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItem,
  clearCart,
  updateItemQuantity,
} from "../store/slices/cart.slice";
import {
  clearCurrentOrder,
  setCurrentOrder,
} from "../store/slices/order.slice";
import axios from "react-native-axios";
import { API_URL, DELIVERY_API_URL } from "@env";

export default function CartScreen({ navigation }) {
  /* ───────── Redux ───────── */
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.cart);

  const token  = useSelector((s) => s.user.token);
  const user   = useSelector((s) => s.user.userInfo);

  /* Shop actual (lo guardamos en order.currentOrder.shop_id) */
  const shopId = useSelector((s) => s.order.currentOrder.shop_id);

  const { addresses = [], currentAddress } = useSelector((s) => s.user);
  const selectedAddress =
    currentAddress ?? addresses.find((a) => a.isDefault) ?? null;

  /* ───────── Propina ───────── */
  const TIP_OPTIONS = [0, 5, 10, 15];
  const [tipPct, setTipPct] = useState(0);

  /* ───────── Totales ───────── */
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.pricePerUnit * it.quantity, 0),
    [items]
  );
  const deliveryFee = selectedAddress ? 2.99 : 0;
  const tipAmount   = useMemo(() => subtotal * (tipPct / 100), [subtotal, tipPct]);
  const total       = useMemo(
    () => subtotal + deliveryFee + tipAmount,
    [subtotal, deliveryFee, tipAmount]
  );

  /* ───────── Modal ───────── */
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);

  console.log(selectedAddress, "addres")

  /* ───────────────────── PLACE ORDER ───────────────────── */
  const placeOrder = async () => {
    console.log("🟡 [Cart] placeOrder started");
    setSaving(true);

    try {
      /* 1. Crear orden en backend */
      const orderPayload = {
        user_id   : user.id,
        shop_id   : shopId,
        address: selectedAddress?.id,
        deliveryAddress: selectedAddress.street,
        subtotal,
        deliveryFee,
        tip       : tipAmount,
        total,
        price: subtotal,
        finalPrice: total.toFixed(),
        plus_21   : true,
        status    : "aceptada",
        items     : items.map((it) => ({
          product_id: it.id,
          quantity  : it.quantity,
        })),
      };

      const { data: order } = await axios.post(`${API_URL}/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
     

    

      dispatch(setCurrentOrder(order))

      /* 2. Payload para servicio de delivery usando order.shop */
      const shop = order.shop;

      const deliveryPayload = {
        platform: {
          name : "Bodega",
          image: "https://iili.io/3IgQ6jn.png",
        },
        local: {
          name       : shop.name,
          address    : "calle 39 n 459",
          description: shop.description,
          lat_lng    : { latitude: shop.latitude, longitude: shop.longitude },
          image      : shop.logo,
        },
        user: {
          name       : user.name,
          address    : selectedAddress.street,
          description: selectedAddress.comments ?? "",
          lat_lng    : {
            latitude : -34.651800,
            longitude: -59.430300,
          },
          image:
            "https://img.freepik.com/vector-gratis/mensajero-que-entrega-pedido-puerta-cliente-hombre-recibiendo-paquete-caja-paquete-plano-ilustracion-vectorial-cartero-envio-servicio_74855-8309.jpg",
        },
        order: {
          id            : order.id,
          description   : items.map((it) => it.name).join(", "),
          delivery_code : order.deliveryCode,
          pickup_code   : order.pickupCode,
          total_price   : total,
          subtotal,
          tax           : 0,
          tip           : tipAmount,
          delivery_price: deliveryFee,
          plus_21       : true,
        },
      };

   /*    await axios.post(`https://1b2d-143-105-136-149.ngrok-free.app/drivers/orders/new`, deliveryPayload);
      console.log("🟢 [Cart] delivery task created"); */

      /* 3. Limpiar estados y navegar */
      dispatch(clearCart());

      setShowModal(false);
      navigation.replace("OrderTracking", { orderId: order.id });
    } catch (err) {
      console.error("🔴 [Cart] placeOrder error:", err);
      alert("Hubo un problema al procesar tu pedido.");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Render ítem ───────── */
  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.img || "https://via.placeholder.com/100" }}
        style={styles.itemImg}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              item.quantity > 1 &&
              dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity - 1 }))
            }
          >
            <Feather name="minus" size={14} color="#4CAF50" />
          </TouchableOpacity>

          <Text style={styles.qtyTxt}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity + 1 }))
            }
          >
            <Feather name="plus" size={14} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemPrice}>
          ${(item.pricePerUnit * item.quantity).toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity onPress={() => dispatch(removeItem(item.id))}>
        <Feather name="trash-2" size={18} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );

  /* ───────── JSX ───────── */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header dirección */}
      <View style={styles.addrHeader}>
        <TouchableOpacity
          style={styles.addrContent}
          onPress={() => navigation.navigate("Addresses")}
        >
          <Icon name="map-marker" size={22} color="#4CAF50" style={{ marginRight: 10 }} />
          {selectedAddress ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.addrTitle} numberOfLines={1}>
                {selectedAddress.street}
              </Text>
              <Text style={styles.addrSubtitle} numberOfLines={1}>
                {selectedAddress.city}, {selectedAddress.state}
              </Text>
            </View>
          ) : (
            <Text style={styles.addAddrTxt}>Add delivery address</Text>
          )}
          <Icon name="chevron-right" size={24} color="#9E9E9E" />
        </TouchableOpacity>
      </View>

      {/* Lista o vacío */}
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="cart-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyTxt}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(it) => it.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Resumen */}
          <View style={styles.summaryBox}>
            <Row label="Subtotal" value={subtotal} />
            <Row label="Delivery" value={deliveryFee} muted={!selectedAddress} />

            {/* Propina */}
            <View style={styles.tipRow}>
              <Text style={styles.tipLabel}>Tip</Text>
              <View style={styles.tipOptions}>
                {TIP_OPTIONS.map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.tipBtn, pct === tipPct && styles.tipBtnActive]}
                    onPress={() => setTipPct(pct)}
                  >
                    <Text style={[styles.tipTxt, pct === tipPct && styles.tipTxtActive]}>
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.tipAmount}>${tipAmount.toFixed(2)}</Text>
            </View>

            <Row label="Total" value={total} bold />
            <TouchableOpacity
              style={[styles.checkoutBtn, !selectedAddress && { opacity: 0.5 }]}
              disabled={!selectedAddress}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm checkout</Text>
            <Text style={styles.modalText}>Credit / Debit card</Text>

            {saving ? (
              <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.modalConfirm} onPress={placeOrder}>
                  <Text style={styles.modalConfirmTxt}>Pay ${total.toFixed(2)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
                  <Text style={styles.modalCancelTxt}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ───────── Row helper ───────── */
const Row = ({ label, value, muted, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, muted && { color: "#9E9E9E" }, bold && { fontWeight: "700" }]}>{label}</Text>
    <Text style={[styles.rowVal, muted && { color: "#9E9E9E" }, bold && { fontWeight: "700" }]}>
      ${value.toFixed(2)}
    </Text>
  </View>
);

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  addrHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios     : { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3 },
      android : { elevation: 2 },
    }),
  },
  addrContent: { flexDirection: "row", alignItems: "center" },
  addrTitle: { fontSize: 15, fontWeight: "600", color: "#212121" },
  addrSubtitle: { fontSize: 12, color: "#757575" },
  addAddrTxt: { fontSize: 15, color: "#9E9E9E", flex: 1 },

  list: { padding: 16, paddingBottom: 100 },

  itemCard: {
    flexDirection : "row",
    backgroundColor: "#fff",
    borderRadius  : 12,
    padding       : 12,
    marginBottom  : 12,
    alignItems    : "center",
  },
  itemImg : { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#212121" },

  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#4CAF50",
    justifyContent: "center", alignItems: "center",
  },
  qtyTxt  : { marginHorizontal: 8, fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 13, color: "#757575", marginTop: 4 },

  summaryBox: {
    backgroundColor  : "#fff",
    borderTopLeftRadius : 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: { fontSize: 14, color: "#424242" },
  rowVal  : { fontSize: 14, color: "#424242" },

  tipRow: {
    flexDirection: "row",
    alignItems   : "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tipLabel  : { fontSize: 14, color: "#424242" },
  tipOptions: { flexDirection: "row", gap: 6 },
  tipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  tipBtnActive: { backgroundColor: "#4CAF50" },
  tipTxt      : { fontSize: 13, color: "#4CAF50", fontWeight: "600" },
  tipTxtActive: { color: "#fff" },
  tipAmount   : { fontSize: 14, color: "#424242" },

  checkoutBtn: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },

  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { color: "#BDBDBD", marginTop: 12, fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#212121" },
  modalText : { fontSize: 14, color: "#757575", marginBottom: 24 },
  modalConfirm: {
    width: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalConfirmTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },
  modalCancel: { marginTop: 12 },
  modalCancelTxt: { color: "#D32F2F", fontSize: 14, fontWeight: "600" },
});
