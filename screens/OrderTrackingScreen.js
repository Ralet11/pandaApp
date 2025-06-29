// src/screens/OrderTrackingScreen.jsx
// Rastreo de orden con marcador animado en tiempo real
"use client";

import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  AnimatedRegion,
  Animated as AnimatedMap,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { createSelector, shallowEqual } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { API_URL } from "@env";
import {
  setCurrentOrder,
  updateOrderLocation,
} from "../store/slices/order.slice";
import useSocket from "../config/socket";

/* ───────────── Status helper ───────────── */
const statusConfig = {
  pendiente:  { label: "Pending",   color: "#A0A0A0" },
  aceptada:   { label: "Accepted",  color: "#F5F5DC" },
  envio:      { label: "Shipping",  color: "#F5F5DC" },
  finalizada: { label: "Delivered", color: "#F5F5DC" },
  rechazada:  { label: "Rejected",  color: "#FF5252" },
  cancelada:  { label: "Cancelled", color: "#FF9800" },
};
const getStatus = (key = "") =>
  statusConfig[key.toLowerCase()] || { label: key, color: "#A0A0A0" };

/* ───────────── Selectores Redux ───────────── */
const selectOrderSlice  = (s) => s.order;
const makeOrderSelector = createSelector(selectOrderSlice, (o) => ({
  currentOrder: o.currentOrder,
  isLoading:    o.isLoading,
  error:        o.error,
}));

export default function OrderTrackingScreen({ navigation }) {
  const dispatch = useDispatch();
  const socket   = useSocket();

  const { currentOrder, isLoading, error } = useSelector(
    makeOrderSelector,
    shallowEqual,
  );
  const token = useSelector((s) => s.user.token);

  /* ---------- Pull-to-refresh ---------- */
  const [refreshing, setRefreshing] = useState(false);
  const fetchOrder = useCallback(async () => {
    if (!currentOrder?.id || !token) return;
    try {
      const { data } = await axios.get(`${API_URL}/orders/${currentOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(setCurrentOrder(data));
    } catch (e) {
      console.error("refresh order:", e.message);
    }
  }, [currentOrder?.id, token, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, [fetchOrder]);

  /* ---------- Socket: ubicación ---------- */
  useEffect(() => {
    if (!socket || !currentOrder?.id) return;
    const handler = (data) => {
      if (data.orderId !== currentOrder.id) return;
      dispatch(updateOrderLocation({
        deliveryLat:  data.deliveryLat,
        deliveryLng:  data.deliveryLng,
        deliveryName: data.deliveryName,
      }));
    };
    socket.on("driver_location", handler);
    return () => socket.off("driver_location", handler);
  }, [socket, currentOrder?.id, dispatch]);

  /* ---------- Auto-refresh cada 10 s ---------- */
  useEffect(() => {
    if (currentOrder?.status === "envio") {
      const id = setInterval(fetchOrder, 10000);
      return () => clearInterval(id);
    }
  }, [currentOrder?.status, fetchOrder]);

  /* ---------- Localización del dispositivo ---------- */
  const [deviceCoords, setDeviceCoords] = useState(null);
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setDeviceCoords({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  /* ---------- Loading / error ---------- */
  if (isLoading || !currentOrder) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#FF5252" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#F5F5DC" />
            <Text style={styles.loadingText}>Loading order…</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  /* ---------- Destructuring de la orden ---------- */
  const {
    shop = {},
    pickupCode,
    deliveryCode,
    price,
    deliveryFee,
    finalPrice,
    status,
    id,
    address,
    deliveryLat,
    deliveryLng,
    deliveryName,
    deliveryPayload,
  } = currentOrder;

  /* ---------- Coordenadas del usuario ---------- */
  const payloadCoords = deliveryPayload?.user?.lat_lng || [];
  const userLat = parseFloat(
    address?.lat          ??
    address?.latitude     ??
    payloadCoords[0]      ??
    deviceCoords?.latitude ??
    0,
  );
  const userLng = parseFloat(
    address?.lng          ??
    address?.longitude    ??
    payloadCoords[1]      ??
    deviceCoords?.longitude ??
    0,
  );

  /* ---------- Coordenadas del driver ---------- */
  const delLat = parseFloat(deliveryLat ?? 0);
  const delLng = parseFloat(deliveryLng ?? 0);

  const hasDriver = !!delLat && !!delLng && !isNaN(delLat) && !isNaN(delLng);
  const hasUser   = !!userLat && !!userLng && !isNaN(userLat) && !isNaN(userLng);

  const showMap = status === "envio" && hasDriver && (hasUser || deviceCoords);

  /* ---------- Animated marker ---------- */
  const animatedCoord = useRef(new AnimatedRegion({
    latitude:      hasDriver ? delLat : 0,
    longitude:     hasDriver ? delLng : 0,
    latitudeDelta: 0.001,
    longitudeDelta:0.001,
  })).current;

  useEffect(() => {
    if (!hasDriver) return;
    animatedCoord.timing({
      latitude:        delLat,
      longitude:       delLng,
      duration:        1500,
      useNativeDriver: false,
    }).start();
  }, [delLat, delLng, hasDriver, animatedCoord]);

  /* ---------- Helpers ---------- */
  const formatAddress = (addr) =>
    !addr
      ? ""
      : [
          addr.street,
          addr.number,
          addr.apartment && `Apt ${addr.apartment}`,
          addr.city,
          addr.state,
          addr.zip,
        ]
          .filter(Boolean)
          .join(", ");

  const countItems = useMemo(
    () =>
      (currentOrder?.order_items || []).reduce(
        (s, it) => s + Number(it.quantity || 0),
        0,
      ),
    [currentOrder],
  );

  /* ---------- Región inicial del mapa ---------- */
  const initialRegion = hasDriver
    ? {
        latitude:       hasUser ? (delLat + userLat) / 2 : delLat,
        longitude:      hasUser ? (delLng + userLng) / 2 : delLng,
        latitudeDelta:  hasUser ? Math.abs(delLat - userLat) * 2 + 0.02 : 0.02,
        longitudeDelta: hasUser ? Math.abs(delLng - userLng) * 2 + 0.02 : 0.02,
      }
    : {
        latitude:       0,
        longitude:      0,
        latitudeDelta:  0.02,
        longitudeDelta: 0.02,
      };

  /* ---------- Render ---------- */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#F5F5DC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Mapa */}
        {showMap && (
          <View style={styles.mapWrapper}>
            <AnimatedMap
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={initialRegion}
              showsUserLocation={false}
              followsUserLocation={false}
            >
              {/* Línea entre driver ↔ usuario */}
              {hasUser && (
                <Polyline
                  coordinates={[
                    { latitude: delLat, longitude: delLng },
                    { latitude: userLat, longitude: userLng },
                  ]}
                  strokeColor="#F5F5DC"
                  strokeWidth={3}
                />
              )}

              {/* Marker animado del delivery */}
              <Marker.Animated
                coordinate={animatedCoord}
                title={deliveryName || "Delivery"}
                pinColor="#FF0000"
              />

              {/* Marker del usuario */}
              {hasUser && (
                <Marker
                  coordinate={{ latitude: userLat, longitude: userLng }}
                  title="Your Address"
                  pinColor="#4CAF50"
                />
              )}

              {/* Marker fallback del dispositivo */}
              {deviceCoords && (
                <Marker
                  coordinate={deviceCoords}
                  title="You"
                  pinColor="#2196F3"
                />
              )}
            </AnimatedMap>
          </View>
        )}

        {/* Shop Info */}
        <View style={styles.card}>
          <View style={styles.shopHeader}>
            <View style={styles.shopLogoContainer}>
              <Image
                source={{
                  uri: shop.logo || "https://via.placeholder.com/80",
                }}
                style={styles.shopLogo}
              />
              <View style={styles.shopBadge}>
                <MaterialIcons name="store" size={12} color="#0A0C10" />
              </View>
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopDescription} numberOfLines={2}>
                {shop.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
            <StatusBadge status={status} />
          </View>
          <View style={styles.infoGrid}>
            <InfoCard icon="shopping-bag" label="Items"    value={`${countItems}`} />
            <InfoCard icon="hash"         label="Order ID" value={`#${id}`}     />
            <InfoCard icon="truck"        label="Delivery" value={`$${deliveryFee}`} />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Feather name="credit-card" size={20} color="#F5F5DC" />
          </View>
          <View style={styles.summaryContent}>
            <Row label="Subtotal" value={`$${price}`} />
            <Row label="Delivery" value={`$${deliveryFee}`} />
            <Row label="Total"    value={`$${finalPrice}`} bold />
          </View>
        </View>

        {/* Codes */}
        <View style={styles.codesRow}>
          <CodeDisplay
            title="Delivery Code"
            code={deliveryCode || pickupCode}
            icon="package"
            color="#F5F5DC"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------- Sub-componentes UI -------- */
const StatusBadge = ({ status }) => {
  const { label, color } = getStatus(status);
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: color === "#F5F5DC" ? "#1A2332" : "transparent",
          borderColor:     color,
        },
      ]}
    > 
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIcon}>
      <Feather name={icon} size={20} color="#F5F5DC" />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const Row = ({ label, value, bold }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, bold && { fontWeight: "700" }]}>{label}</Text>
    <Text style={[styles.summaryValue, bold && { fontWeight: "700" }]}>{value}</Text>
  </View>
);

const CodeDisplay = ({ title, code, icon, color }) => (
  <View style={styles.codeContainer}>
    <View style={styles.codeIcon}>
      <Feather name={icon} size={24} color={color} />
    </View>
    <Text style={styles.codeLabel}>{title}</Text>
    <Text style={[styles.codeValue, { color }]}>{code}</Text>
  </View>
);

/* ------------ Styles ------------ */
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0A0C10" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0C10" },
  loadingContent:   { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:      { marginTop: 16, color: "#A0A0A0" },
  errorContainer:   { flex: 1, justifyContent: "center", alignItems: "center" },
  errorTitle:       { marginTop: 12, color: "#F5F5DC", fontSize: 18, fontWeight: "700" },
  errorText:        { color: "#A0A0A0", marginTop: 4 },
  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    padding:         16,
  },
  backButton: {
    width:          44,
    height:         44,
    borderRadius:   22,
    backgroundColor:"#121620",
    justifyContent: "center",
    alignItems:     "center",
  },
  headerTitle:    { color: "#F5F5DC", fontSize: 18, fontWeight: "700" },
  mapWrapper:     { height: 260, margin: 16, borderRadius: 16, overflow: "hidden" },
  map:            { flex: 1 },
  card: {
    backgroundColor: "#121620",
    marginHorizontal:16,
    marginBottom:    16,
    padding:         16,
    borderRadius:    16,
  },
  shopHeader:        { flexDirection: "row", alignItems: "center" },
  shopLogoContainer: { position: "relative", marginRight: 12 },
  shopLogo:          { width: 60, height: 60, borderRadius: 12, backgroundColor: "#1A2332" },
  shopBadge: {
    position:       "absolute",
    top:            -4,
    right:          -4,
    width:          24,
    height:         24,
    borderRadius:   12,
    backgroundColor:"#F5F5DC",
    justifyContent: "center",
    alignItems:     "center",
  },
  shopName:        { color: "#F5F5DC", fontWeight: "700", fontSize: 16 },
  shopDescription: { color: "#A0A0A0", fontSize: 12, marginTop: 2 },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  cardTitle:       { color: "#F5F5DC", fontWeight: "700", fontSize: 16 },
  statusBadge:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  infoGrid:        { flexDirection: "row", justifyContent: "space-between" },
  infoCard: {
    flex:            1,
    alignItems:      "center",
    padding:         12,
    backgroundColor: "#1A2332",
    borderRadius:    12,
    marginHorizontal:4,
  },
  infoIcon:   { marginBottom: 6 },
  infoLabel:  { color: "#A0A0A0", fontSize: 12 },
  infoValue:  { color: "#F5F5DC", fontSize: 14, fontWeight: "700" },
  summaryContent: { marginTop: 8 },
  summaryRow:     { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  summaryLabel:   { color: "#A0A0A0" },
  summaryValue:   { color: "#F5F5DC" },
  codesRow:       { flexDirection: "row", marginHorizontal: 16, marginBottom: 16 },
  codeContainer:  { flex: 1, alignItems: "center", backgroundColor: "#121620", paddingVertical: 16, borderRadius: 16 },
  codeIcon:       { marginBottom: 6 },
  codeLabel:      { color: "#A0A0A0", fontSize: 12 },
  codeValue:      { fontSize: 20, fontWeight: "700", letterSpacing: 2 },
});
