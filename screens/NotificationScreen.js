"use client";

import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} from "../store/slices/notificationSlice";
import { setSelectedOrder } from "../store/slices/orderSlice";
import { Feather } from "@expo/vector-icons";

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);

  useEffect(() => {
    if (notifications.length) dispatch(markAllAsRead());
  }, [dispatch]);

  /* ───────── Helpers ───────── */
  const iconByType = (type) => {
    switch (type) {
      case "order_update":
        return <Feather name="shopping-bag" color="#4CAF50" size={24} />;
      case "delivery_update":
        return <Feather name="shopping-bag" color="#2196F3" size={24} />;
      case "promotion":
        return <Feather name="tag" color="#FF9800" size={24} />;
      default:
        return <Feather name="bell" color="#757575" size={24} />;
    }
  };

  /* ───────── Item ───────── */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => {
        if (!item.read) dispatch(markAsRead(item.id));
        if (["order_update", "delivery_update"].includes(item.type)) {
          dispatch(setSelectedOrder(item.orderId));
          navigation.navigate("Orders");
        } else if (item.type === "promotion") {
          navigation.navigate("Stores");
        }
      }}
    >
      <View style={styles.notificationIcon}>{iconByType(item.type)}</View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => dispatch(removeNotification(item.id))}
      >
        <Feather name="x" color="#757575" size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
            <Image
              source={{ uri: "https://via.placeholder.com/150" }}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You don't have any notifications at the moment.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  clearAllText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  unreadNotification: {
    backgroundColor: "#F5F5F5",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
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
    color: "#212121",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9E9E9E",
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
})

export default NotificationsScreen
