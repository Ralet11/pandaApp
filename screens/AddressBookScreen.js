"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector, useDispatch } from "react-redux";
import axios from "react-native-axios";
import { API_URL } from "@env";
import { setCurrentAddress } from "../store/slices/user.slice";

const AddressesView = ({ navigation }) => {
  /* ───────── Redux ───────── */
  const dispatch = useDispatch();
  const token = useSelector((state) => state.user.token);
  const currentAddress = useSelector((state) => state.user.currentAddress);

  /* ───────── Local ───────── */
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ───────── Fetch addresses ───────── */
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("get addresses:", err);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  /* ───────── Handlers ───────── */
  const handleDeleteAddress = async (id) => {
    try {
      await axios.delete(`${API_URL}/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      if (currentAddress?.id === id) dispatch(setCurrentAddress(null));
    } catch (err) {
      console.error("delete address:", err);
    }
  };

  const handleSelectAddress = (address) => {
    dispatch(setCurrentAddress(address));
  };

  /* ───────── UI ───────── */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#F5F5DC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery address</Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5F5DC" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Add */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("SelectNewAddress")}
          >
            <Icon name="plus" size={20} color="#0A0C10" style={styles.addIcon} />
            <Text style={styles.addButtonText}>Add address</Text>
          </TouchableOpacity>

          {/* List */}
          {addresses.length > 0 ? (
            addresses.map((address) => {
              const isSelected = currentAddress?.id === address.id;
              return (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    isSelected && styles.selectedAddressCard,
                  ]}
                  onPress={() => handleSelectAddress(address)}
                  activeOpacity={0.8}
                >
                  <Icon name="map-marker" size={24} color="#F5F5DC" style={styles.locationIcon} />
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>{address.street}</Text>
                    <Text style={styles.addressDescription}>{address.type || "No type"}</Text>
                  </View>

                  {isSelected && (
                    <Icon name="check-circle" size={20} color="#F5F5DC" style={styles.tickIcon} />
                  )}

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Icon name="trash-can" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="map-marker-outline" size={64} color="#A0A0A0" />
              <Text style={styles.noAddressesText}>You have no saved addresses</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default AddressesView;

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#121620",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F5DC",
    marginLeft: 16,
  },
  backButton: { padding: 4 },

  /* Loading */
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Scroll & add */
  scrollContent: { padding: 16 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5DC",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  addIcon: { marginRight: 8 },
  addButtonText: { color: "#0A0C10", fontSize: 15, fontWeight: "600" },

  /* Cards */
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121620",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedAddressCard: { borderColor: "#F5F5DC", backgroundColor: "#1A2332" },
  locationIcon: { marginRight: 12 },

  addressInfo: { flex: 1 },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F5F5DC",
    marginBottom: 4,
  },
  addressDescription: { fontSize: 13, color: "#A0A0A0" },
  tickIcon: { marginRight: 12 },

  deleteButton: { padding: 8, marginLeft: 8 },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  noAddressesText: { fontSize: 15, color: "#A0A0A0", marginTop: 12 },
});
