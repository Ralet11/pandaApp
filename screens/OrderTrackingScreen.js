import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { createSelector, shallowEqual } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { API_URL } from "@env";
import { setCurrentOrder } from "../store/slices/order.slice"; // Ajusta ruta si hace falta

/* -------------------------------------------------------------------------- */
/*                              SELECTORES REDUX                              */
/* -------------------------------------------------------------------------- */
const selectOrderSlice = (state) => state.order;
const selectAuthSlice = (state) => state.auth;

const makeCurrentOrderSelector = createSelector(
  selectOrderSlice,
  (order) => ({
    currentOrder: order.currentOrder,
    isLoading:    order.isLoading,
    error:        order.error,
  })
);

const makeTokenSelector = createSelector(
  selectAuthSlice,
  (auth) => auth?.user?.token || null
);

/* -------------------------------------------------------------------------- */
/*                           COMPONENTE OrderTracking                        */
/* -------------------------------------------------------------------------- */
export default function OrderTrackingScreen({ navigation }) {
  const dispatch = useDispatch();
  const { currentOrder, isLoading, error } = useSelector(
    makeCurrentOrderSelector,
    shallowEqual
  );
  const token = useSelector((state) => state.user.token);

  /* Pull-to-refresh */
  const [refreshing, setRefreshing] = useState(false);

  /* Fetch full order details */
  const fetchOrderDetails = useCallback(async () => {
    console.log("aqui")
      console.log(currentOrder.id, token)
    if (!currentOrder?.id || !token) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/orders/${currentOrder.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(setCurrentOrder(data));
    } catch (err) {
      console.error("Error refreshing order:", err);
    }
  }, [currentOrder?.id, token, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [fetchOrderDetails]);

  /* Fetch initial order & address */
  const [address, setAddress]         = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError]     = useState(null);

  
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return [
      addr.street,
      addr.number,
      addr.apartment && `Apt ${addr.apartment}`,
      addr.city,
      addr.state,
      addr.zip,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const countItems = useMemo(
    () =>
      (currentOrder?.order_items || []).reduce(
        (sum, it) => sum + Number(it.quantity || 0),
        0
      ),
    [currentOrder]
  );

  const statusConfig = {
    pendiente:  { label: "Pending",   color: "#757575" },
    aceptada:   { label: "Accepted",  color: "#2196F3" },
    envio:      { label: "Shipping",  color: "#9C27B0" },
    finalizada: { label: "Delivered", color: "#4CAF50" },
    rechazada:  { label: "Rejected",  color: "#F44336" },
    cancelada:  { label: "Cancelled", color: "#FF9800" },
  };

  const getStatus = (key = "") =>
    statusConfig[key.toLowerCase()] || { label: key, color: "#757575" };

  const StatusBadge = ({ status }) => {
    const { label, color } = getStatus(status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusBadgeText}>{label}</Text>
      </View>
    );
  };

  const InfoCard = ({ icon, label, value, iconColor = "#4CAF50" }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const TrackingStep = ({ item, isLast }) => (
    <View style={styles.trackingStep}>
      <View style={styles.stepIconContainer}>
        <View
          style={[
            styles.stepIcon,
            item.completed ? styles.completedStepIcon : styles.pendingStepIcon,
          ]}
        >
          <Feather name={item.completed ? "check" : "clock"} size={16} color="#FFF" />
        </View>
        {!isLast && (
          <View
            style={[
              styles.stepLine,
              item.completed ? styles.completedLine : styles.pendingLine,
            ]}
          />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, item.completed ? styles.completedText : styles.pendingText]}>
          {item.title}
        </Text>
        <Text style={styles.stepTime}>{item.time}</Text>
      </View>
    </View>
  );

  const CodeDisplay = ({ title, code, icon, color }) => (
    <View style={styles.codeContainer}>
      <View style={[styles.codeIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text style={styles.codeLabel}>{title}</Text>
      <Text style={[styles.codeValue, { color }]}>{code}</Text>
    </View>
  );

  const handleBackToHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
  };

  if (isLoading || !currentOrder) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
              <Feather name="home" size={20} color="#FFF" />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading order...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const {
    shop = {},
    pickupCode,
    deliveryCode,
    price,
    deliveryFee,
    finalPrice,
    status,
    id,
    order_items = [],
  } = currentOrder;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
              <Feather name="home" size={20} color="#FFF" />
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Order Tracking</Text>
            <Text style={styles.headerSubtitle}>Track your order in real time</Text>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.card}>
          <View style={styles.shopHeader}>
            <View style={styles.shopLogoContainer}>
              <Image
                source={{ uri: shop.logo || "https://via.placeholder.com/80" }}
                style={styles.shopLogo}
              />
              <View style={styles.shopBadge}>
                <Feather name="store" size={12} color="#FFF" />
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
            <InfoCard icon="shopping-bag" label="Items" value={`${countItems}`} />
            <InfoCard icon="hash"        label="Order ID" value={`#${id}`} iconColor="#4CAF50" />
            <InfoCard icon="truck"       label="Delivery Fee" value={`$${deliveryFee}`} iconColor="#9C27B0" />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Feather name="credit-card" size={20} color="#4CAF50" />
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>${deliveryFee}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.totalValue}>${finalPrice}</Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <View style={styles.addressHeader}>
            <Feather name="map-pin" size={20} color="#FF5722" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          {addrLoading ? (
            <ActivityIndicator size="small" color="#FF5722" />
          ) : addrError ? (
            <Text style={[styles.addressText, { color: "#F44336" }]}>{addrError}</Text>
          ) : (
            <Text style={styles.addressText}>{formatAddress(address)}</Text>
          )}
        </View>

        {/* Codes */}
        <View style={styles.codesRow}>
          <CodeDisplay title="Pickup Code"   code={pickupCode}   icon="package" color="#FF9800" />
          <CodeDisplay title="Delivery Code" code={deliveryCode} icon="truck"   color="#4CAF50" />
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );

}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#757575",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  fullHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullHomeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopLogoContainer: {
    position: "relative",
    marginRight: 16,
  },
  shopLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  shopBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  infoContent: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
  },
  summaryContent: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#757575",
  },
  summaryValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF572220",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 22,
    paddingLeft: 52,
  },
  codesRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  codeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
    textAlign: "center",
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  trackingContent: {
    marginTop: 8,
  },
  trackingStep: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  completedStepIcon: {
    backgroundColor: "#4CAF50",
  },
  pendingStepIcon: {
    backgroundColor: "#BDBDBD",
  },
  stepLine: {
    position: "absolute",
    top: 36,
    left: 17,
    width: 2,
    height: 32,
  },
  completedLine: {
    backgroundColor: "#4CAF50",
  },
  pendingLine: {
    backgroundColor: "#E0E0E0",
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  completedText: {
    color: "#212121",
  },
  pendingText: {
    color: "#757575",
  },
  stepTime: {
    fontSize: 14,
    color: "#757575",
  },
});