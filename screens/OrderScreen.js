"use client"

import { useEffect, useState, useMemo } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import axios from "react-native-axios"
import { useDispatch, useSelector } from "react-redux"
import { API_URL } from "@env"
import { setCurrentOrder } from "../store/slices/order.slice"

/* ----------------------- Utilities ----------------------- */
const statusColors = {
  pendiente: "#A0A0A0",
  aceptada: "#F5F5DC",
  envio: "#F5F5DC",
  finalizada: "#F5F5DC",
  cancelada: "#FF5252",
}

const statusLabels = {
  pendiente: "Pending",
  aceptada: "Accepted",
  envio: "Shipping",
  finalizada: "Delivered",
  cancelada: "Cancelled",
}

const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

/* ----------------------- Screen --------------------------- */
const OrdersScreen = ({ navigation }) => {
  const token = useSelector((s) => s.user.token)
  const user = useSelector((s) => s.user.userInfo)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState("all")

  const dispatch = useDispatch()

  /* ------------ Fetch all orders for this user ------------ */
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_URL}/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (alive) setOrders(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.id, token])

  const handleNavigateTracking = (item) => {
    dispatch(setCurrentOrder(item))
    navigation.navigate("OrderTracking", { orderId: item.id })
  }

  /* ------------ Stats and filters -------------------- */
  const orderStats = useMemo(() => {
    const stats = { total: orders.length }
    Object.keys(statusLabels).forEach((key) => {
      stats[key] = orders.filter((o) => o.status === key).length
    })
    return stats
  }, [orders])

  const filteredOrders = useMemo(() => {
    const base = selectedFilter === "all" ? orders : orders.filter((o) => o.status === selectedFilter)
    return [...base].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, selectedFilter])

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

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === "all" && styles.filterButtonActive]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text style={[styles.filterText, selectedFilter === "all" && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {Object.entries(statusLabels).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterButton, selectedFilter === key && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(key)}
          >
            <Text style={[styles.filterText, selectedFilter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  /* ------------ Render each card ---------------------- */
  const renderOrder = ({ item }) => {
    const color = statusColors[item.status] ?? "#A0A0A0"
    const shopName = item.shop?.name ?? "Store"
    const date = prettyDate(item.createdAt)

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleNavigateTracking(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}># {item.id}</Text>
          <View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{statusLabels[item.status]}</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="storefront" size={16} color="#F5F5DC" style={{ marginRight: 6 }} />
          <Text style={styles.detailText}>{shopName}</Text>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#F5F5DC" style={{ marginRight: 6 }} />
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
          <Text style={styles.totalPrice}>${Number(item.finalPrice || item.total).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  /* ------------ UI -------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#F5F5DC" style={{ marginTop: 40 }} />
      ) : (
        <>
          {renderHeader()}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="file-document" size={64} color="#A0A0A0" />
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
  )
}

/* ----------------------- Styles --------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },

  headerContainer: {
    backgroundColor: "#121620",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2332",
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0A0A0",
  },

  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: "#1A2332",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: "#F5F5DC",
  },
  filterText: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#0A0C10",
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#A0A0A0",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#121620",
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
  orderId: { fontSize: 16, fontWeight: "bold", color: "#F5F5DC" },

  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  detailText: { fontSize: 14, color: "#F5F5DC" },

  itemsContainer: {
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1A2332",
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: { fontSize: 14, color: "#F5F5DC" },
  itemQty: { fontSize: 14, color: "#A0A0A0" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1A2332",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 14, color: "#A0A0A0" },
  totalPrice: { fontSize: 16, fontWeight: "bold", color: "#F5F5DC" },
})

export default OrdersScreen
