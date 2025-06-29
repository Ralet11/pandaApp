"use client"

import { useMemo, useState } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialCommunityIcons as Icon, Feather } from "@expo/vector-icons"
import { useDispatch, useSelector } from "react-redux"
import { removeItem, clearCart, updateItemQuantity } from "../store/slices/cart.slice"
import { clearCurrentOrder, setCurrentOrder } from "../store/slices/order.slice"
import axios from "react-native-axios"
import { API_URL, DELIVERY_API_URL } from "@env"
import BackButton from "../components/BackButton"

export default function CartScreen({ navigation }) {
  /* ───────── Redux ───────── */
  const dispatch = useDispatch()
  const { items } = useSelector((s) => s.cart)

  const token = useSelector((s) => s.user.token)
  const user = useSelector((s) => s.user.userInfo)

  /* Shop actual (lo guardamos en order.currentOrder.shop_id) */
  const shopId = useSelector((s) => s.order.currentOrder.shop_id)

  const { addresses = [], currentAddress } = useSelector((s) => s.user)
  const selectedAddress = currentAddress ?? addresses.find((a) => a.isDefault) ?? null

  /* ───────── Propina ───────── */
  const TIP_OPTIONS = [0, 5, 10, 15]
  const [tipPct, setTipPct] = useState(0)

  /* ───────── Totales ───────── */
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.pricePerUnit * it.quantity, 0),
    [items],
  )
  const deliveryFee = selectedAddress ? 2.99 : 0
  const tipAmount = useMemo(() => subtotal * (tipPct / 100), [subtotal, tipPct])
  const total = useMemo(() => subtotal + deliveryFee + tipAmount, [subtotal, deliveryFee, tipAmount])

  /* ───────── Modal ───────── */
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  console.log(selectedAddress, "addres")

  /* ───────────────────── PLACE ORDER ───────────────────── */
  const placeOrder = async () => {
    console.log("🟡 [Cart] placeOrder started")
    setSaving(true)

    try {
      /* 1. Crear orden en backend */
      const orderPayload = {
        user_id: user.id,
        shop_id: shopId,
        address: selectedAddress?.id,
        deliveryAddress: selectedAddress.street,
        subtotal,
        deliveryFee,
        tip: tipAmount,
        total,
        price: subtotal,
        finalPrice: total.toFixed(),
        plus_21: true,
        status: "pendiente",
        items: items.map((it) => ({
          product_id: it.id,
          quantity: it.quantity,
        })),
      }

      const { data: order } = await axios.post(`${API_URL}/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      dispatch(setCurrentOrder(order))

      /* 2. Payload para servicio de delivery usando order.shop */
      const shop = order.shop

      const deliveryPayload = {
        platform: {
          name: "Bodega",
          image: "https://iili.io/3IgQ6jn.png",
        },
        local: {
          name: shop.name,
          address: "calle 39 n 459",
          description: shop.description,
          lat_lng: { latitude: shop.latitude, longitude: shop.longitude },
          image: shop.logo,
        },
        user: {
          name: user.name,
          address: selectedAddress.street,
          description: selectedAddress.comments ?? "",
          lat_lng: {
            latitude: -34.6518,
            longitude: -59.4303,
          },
          image:
            "https://img.freepik.com/vector-gratis/mensajero-que-entrega-pedido-puerta-cliente-hombre-recibiendo-paquete-caja-paquete-plano-ilustracion-vectorial-cartero-envio-servicio_74855-8309.jpg",
        },
        order: {
          id: order.id,
          description: items.map((it) => it.name).join(", "),
          delivery_code: order.deliveryCode,
          pickup_code: order.pickupCode,
          total_price: total,
          subtotal,
          tax: 0,
          tip: tipAmount,
          delivery_price: deliveryFee,
          plus_21: true,
        },
      }

      await axios.put(`${API_URL}/orders/${order.id}/delivery-payload`, {deliveryPayload: deliveryPayload})
      console.log("🟢 [Cart] delivery task created")

      /* 3. Limpiar estados y navegar */
      dispatch(clearCart())

      setShowModal(false)
      navigation.replace("OrderTracking", { orderId: order.id })
    } catch (err) {
      console.error("🔴 [Cart] placeOrder error:", err)
      alert("Hubo un problema al procesar tu pedido.")
    } finally {
      setSaving(false)
    }
  }

  /* ───────── Render ítem ───────── */
  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.img || "https://via.placeholder.com/100" }} style={styles.itemImg} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              item.quantity > 1 && dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity - 1 }))
            }
          >
            <Feather name="minus" size={14} color="#F5F5DC" />
          </TouchableOpacity>

          <Text style={styles.qtyTxt}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
          >
            <Feather name="plus" size={14} color="#F5F5DC" />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemPrice}>${(item.pricePerUnit * item.quantity).toFixed(2)}</Text>
      </View>

      <TouchableOpacity onPress={() => dispatch(removeItem(item.id))}>
        <Feather name="trash-2" size={18} color="#FF5252" />
      </TouchableOpacity>
    </View>
  )

  /* ───────── JSX ───────── */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header dirección */}
      <BackButton />
      <View style={styles.addrHeader}>
        <TouchableOpacity style={styles.addrContent} onPress={() => navigation.navigate("Addresses")}>
          <Icon name="map-marker" size={22} color="#F5F5DC" style={{ marginRight: 10 }} />
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
          <Icon name="chevron-right" size={24} color="#A0A0A0" />
        </TouchableOpacity>
      </View>

      {/* Lista o vacío */}
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="cart-outline" size={64} color="#A0A0A0" />
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
                    <Text style={[styles.tipTxt, pct === tipPct && styles.tipTxtActive]}>{pct}%</Text>
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
              <ActivityIndicator size="large" color="#F5F5DC" style={{ marginTop: 20 }} />
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
  )
}

/* ───────── Row helper ───────── */
const Row = ({ label, value, muted, bold }) => (
  <View style={styles.row}>
    <Text
      style={[styles.rowLabel, muted && { color: "#A0A0A0" }, bold && { fontWeight: "700", color: "#F5F5DC" }]}
    >
      {label}
    </Text>
    <Text
      style={[styles.rowVal, muted && { color: "#A0A0A0" }, bold && { fontWeight: "700", color: "#F5F5DC" }]}
    >
      ${value.toFixed(2)}
    </Text>
  </View>
)

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },

  addrHeader: {
    backgroundColor: "#121620",
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  addrContent: { flexDirection: "row", alignItems: "center" },
  addrTitle: { fontSize: 15, fontWeight: "600", color: "#F5F5DC" },
  addrSubtitle: { fontSize: 12, color: "#A0A0A0" },
  addAddrTxt: { fontSize: 15, color: "#A0A0A0", flex: 1 },

  list: { padding: 16, paddingBottom: 100 },

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#121620",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  itemImg: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#F5F5DC" },

  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5F5DC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A2332",
  },
  qtyTxt: { marginHorizontal: 8, fontSize: 14, fontWeight: "600", color: "#F5F5DC" },
  itemPrice: { fontSize: 13, color: "#A0A0A0", marginTop: 4 },

  summaryBox: {
    backgroundColor: "#121620",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: { fontSize: 14, color: "#A0A0A0" },
  rowVal: { fontSize: 14, color: "#A0A0A0" },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tipLabel: { fontSize: 14, color: "#A0A0A0" },
  tipOptions: { flexDirection: "row", gap: 6 },
  tipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5F5DC",
    backgroundColor: "#1A2332",
  },
  tipBtnActive: { backgroundColor: "#F5F5DC" },
  tipTxt: { fontSize: 13, color: "#F5F5DC", fontWeight: "600" },
  tipTxtActive: { color: "#0A0C10" },
  tipAmount: { fontSize: 14, color: "#A0A0A0" },

  checkoutBtn: {
    marginTop: 12,
    backgroundColor: "#F5F5DC",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutTxt: { color: "#0A0C10", fontSize: 15, fontWeight: "600" },

  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { color: "#A0A0A0", marginTop: 12, fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#121620",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#F5F5DC" },
  modalText: { fontSize: 14, color: "#A0A0A0", marginBottom: 24 },
  modalConfirm: {
    width: "100%",
    backgroundColor: "#F5F5DC",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalConfirmTxt: { color: "#0A0C10", fontSize: 15, fontWeight: "600" },
  modalCancel: { marginTop: 12 },
  modalCancelTxt: { color: "#FF5252", fontSize: 14, fontWeight: "600" },
})
