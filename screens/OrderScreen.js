// src/screens/OrdersScreen.jsx   (componente completo en inglés, listo para pegar)
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "react-native-axios";
import { useDispatch, useSelector } from "react-redux";
import { API_URL } from "@env";
import { setCurrentOrder } from "../store/slices/order.slice";

/* ----------------------- Utilities ----------------------- */
const statusColors = {
  pendiente:   "#FFB300",
  aceptada:    "#42A5F5",
  envio:       "#AB47BC",
  finalizada:  "#4CAF50",
  cancelada:   "#EF5350",
};

const statusLabels = {
  pendiente:   "Pending",
  aceptada:    "Accepted",
  envio:       "Shipping",
  finalizada:  "Delivered",
  cancelada:   "Cancelled",
};

const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/* ----------------------- Screen --------------------------- */
const OrdersScreen = ({ navigation }) => {
  const token = useSelector((s) => s.user.token);
  const user  = useSelector((s) => s.user.userInfo);

  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const dispatch = useDispatch();

  /* ------------ Fetch all orders for this user ------------ */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (alive) setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, token]);

  const handleNavigateTracking = (item) => {
    dispatch(setCurrentOrder(item));
    navigation.navigate("OrderTracking", { orderId: item.id });
  };

  /* ------------ Stats and filters -------------------- */
  const orderStats = useMemo(() => {
    const stats = { total: orders.length };
    Object.keys(statusLabels).forEach((key) => {
      stats[key] = orders.filter(o => o.status === key).length;
    });
    return stats;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const base = selectedFilter === "all"
      ? orders
      : orders.filter(o => o.status === selectedFilter);
    return [...base].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [orders, selectedFilter]);

  /* ------------ Header Component --------------------------- */
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Main title */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>My Orders</Text>
        <Text style={styles.subtitle}>
          {orderStats.total} {orderStats.total === 1 ? "order" : "orders"} total
        </Text>
      </View>
      {/* Quick stats */}
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === "all" && styles.filterButtonActive
          ]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === "all" && styles.filterTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(statusLabels).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterButton,
              selectedFilter === key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(key)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === key && styles.filterTextActive
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /* ------------ Render each card ---------------------- */
  const renderOrder = ({ item }) => {
    const color = statusColors[item.status] ?? "#757575";
    const shopName = item.shop?.name ?? "Store";
    const date = prettyDate(item.createdAt);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleNavigateTracking(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}># {item.id}</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{statusLabels[item.status]}</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="storefront"
            size={16}
            color="#4CAF50"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.detailText}>{shopName}</Text>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color="#4CAF50"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.detailText}>{date}</Text>
        </View>
        <View style={styles.itemsContainer}>
          {item.order_items?.map((oi) => (
            <View key={oi.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{oi.product?.name}</Text>
              <Text style={styles.itemQty}>x{oi.quantity}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            ${Number(item.finalPrice || item.total).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* ------------ UI -------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          {renderHeader()}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="file-document"
                size={64}
                color="#BDBDBD"
              />
              <Text style={styles.emptyText}>
                {selectedFilter === "all"
                  ? "No orders yet."
                  : `No ${statusLabels[selectedFilter].toLowerCase()} orders yet.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              renderItem={renderOrder}
              keyExtractor={(it) => it.id.toString()}
              contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

/* ----------------------- Styles --------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },

  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },

  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
  },
  filterText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#9E9E9E",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#212121" },

  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },

  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  detailText: { fontSize: 14, color: "#424242" },

  itemsContainer: {
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: { fontSize: 14, color: "#212121" },
  itemQty: { fontSize: 14, color: "#757575" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 14, color: "#757575" },
  totalPrice: { fontSize: 16, fontWeight: "bold", color: "#212121" },
});

export default OrdersScreen;
