"use client"

import { useEffect } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useDispatch, useSelector } from "react-redux"
import {
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} from "../store/slices/notificationSlice"
import { setSelectedOrder } from "../store/slices/orderSlice"
import { Feather } from "@expo/vector-icons"

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const { notifications } = useSelector((state) => state.notifications)

  useEffect(() => {
    if (notifications.length) dispatch(markAllAsRead())
  }, [dispatch, notifications.length])

  /* ───────── Helpers ───────── */
  const iconByType = (type) => {
    switch (type) {
      case "order_update":
        return <Feather name="shopping-bag" color="#F5F5DC" size={24} />
      case "delivery_update":
        return <Feather name="shopping-bag" color="#F5F5DC" size={24} />
      case "promotion":
        return <Feather name="tag" color="#F5F5DC" size={24} />
      default:
        return <Feather name="bell" color="#A0A0A0" size={24} />
    }
  }

  /* ───────── Item ───────── */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => {
        if (!item.read) dispatch(markAsRead(item.id))
        if (["order_update", "delivery_update"].includes(item.type)) {
          dispatch(setSelectedOrder(item.orderId))
          navigation.navigate("Orders")
        } else if (item.type === "promotion") {
          navigation.navigate("Stores")
        }
      }}
    >
      <View style={styles.notificationIcon}>{iconByType(item.type)}</View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={() => dispatch(removeNotification(item.id))}>
        <Feather name="x" color="#A0A0A0" size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  /* ───────── UI ───────── */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {!!notifications.length && (
          <TouchableOpacity onPress={() => dispatch(clearNotifications())}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You don't have any notifications at the moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0C10",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2332",
    backgroundColor: "#121620",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F5F5DC",
  },
  clearAllText: {
    fontSize: 14,
    color: "#F5F5DC",
    fontWeight: "bold",
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2332",
    backgroundColor: "#121620",
  },
  unreadNotification: {
    backgroundColor: "#1A2332",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A0C10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  removeButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    tintColor: "#A0A0A0",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
  },
})

export default NotificationsScreen
