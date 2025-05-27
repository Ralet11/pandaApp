// ─────────────────────────────────────────────────────────────────────────────
// src/views/StoreDetailScreen.jsx   (componente completo, listo para pegar)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "react-native-axios";
import { useSelector } from "react-redux";
import { API_URL } from "@env";

const { width } = Dimensions.get("window");

const StoreDetailScreen = ({ route, navigation }) => {
  /* ───────────────────────────── Params ───────────────────────────── */
  const { storeId } = route.params;

  /* ───────────────────────────── Global ───────────────────────────── */
  const token = useSelector((s) => s.user.token); // si tu API lo requiere

  /* ───────────────────────────── Local ────────────────────────────── */
  const [store, setStore]           = useState(null);   // detalles tienda
  const [products, setProducts]     = useState([]);     // productos reales
  const [loading, setLoading]       = useState(true);   // carga inicial
  const [cat, setCat]               = useState("All");  // categoría selec.

  console.log(store,"store")
  /* ───────────────────── Fetch store + products ───────────────────── */
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      try {
        // 1) Traer detalles de la tienda
        const storeRes = await axios.get(`${API_URL}/shops/${storeId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // 2) Traer todos los productos y filtrar por shop_id
        const prodRes = await axios.get(`${API_URL}/products`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!alive) return;

        setStore(storeRes.data);
        const prodByStore = (Array.isArray(prodRes.data) ? prodRes.data : []).filter(
          (p) => String(p.shop_id) === String(storeId)
        );
        setProducts(prodByStore);
      } catch (err) {
        console.error("Error cargando datos de tienda:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [storeId, token]);

  /* ───────────────────── Derivar categorías ───────────────────── */
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    return ["All", ...Array.from(cats)];
  }, [products]);

  /* ───────────────────── Filtrado de productos ───────────────────── */
  const filtered = useMemo(
    () =>
      products.filter(
        (p) => cat === "All" || p.category?.name === cat
      ),
    [products, cat]
  );

  /* ───────────────────── Componentes internos ───────────────────── */
  const CategoryPill = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        cat === item && styles.selectedCategoryItem,
      ]}
      onPress={() => setCat(item)}
    >
      <Text
        style={[
          styles.categoryName,
          cat === item && styles.selectedCategoryName,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const ProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        navigation.navigate("ProductDetail", {
          productId: item.id,
          storeId,
        })
      }
    >
      <Image
        source={{ uri: item.img || "https://via.placeholder.com/200" }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>{item.unit ?? ""}</Text>
        <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <MaterialCommunityIcons name="plus" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /* ───────────────────── UI ───────────────────── */
  if (loading)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );

  if (!store)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: "#757575" }}>Store not found.</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen header */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: store.image || "https://via.placeholder.com/500" }}
            style={styles.storeImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageGradient}
          />
        </View>

        {/* Info tienda */}
        <View style={styles.storeInfoContainer}>
          <Text style={styles.storeName}>{store.name}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={18} color="#FFC107" />
            <Text style={styles.ratingText}>
              {store.rating?.toFixed(1) ?? "4.5"}
            </Text>
            <Text style={styles.ratingCount}>
              ({store.ratingCount ?? 0} ratings)
            </Text>
          </View>

          <Text style={styles.storeDescription}>
            {store.description ?? "No description."}
          </Text>

          {/* Detalles */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color="#4CAF50"
              />
              <Text style={styles.detailText}>
                {store.deliveryTime ?? "15-25 min"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={18}
                color="#4CAF50"
              />
              <Text style={styles.detailText}>
                {store.deliveryFee ? `$${store.deliveryFee}` : "$2.99"} delivery
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color="#4CAF50"
              />
              <Text style={styles.detailText}>
                {store.distance ?? "1.2 mi"}
              </Text>
            </View>
          </View>

          {/* Dirección */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons
                name="store-marker"
                size={18}
                color="#757575"
                style={styles.addressIcon}
              />
              <Text style={styles.addressText}>
                {store.address ?? "No address"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Categorías */}
        <FlatList
          data={categories}
          renderItem={({ item }) => <CategoryPill item={item} />}
          keyExtractor={(it) => it}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />

        {/* Productos */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>
            {cat === "All" ? "All Products" : cat}
          </Text>
          {filtered.length === 0 ? (
            <Text style={{ color: "#757575", marginTop: 10 }}>
              No products in this category.
            </Text>
          ) : (
            <View style={styles.productsGrid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} item={p} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = StyleSheet.create({
  /* Layout */
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  /* Header image */
  imageContainer: { position: "relative", height: 220 },
  storeImage: { width: "100%", height: "100%" },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },

  /* Store info card */
  storeInfoContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  storeName: { fontSize: 24, fontWeight: "bold", color: "#212121", marginBottom: 8 },

  ratingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  ratingText: { fontSize: 14, fontWeight: "bold", color: "#212121", marginLeft: 5 },
  ratingCount: { fontSize: 14, color: "#757575", marginLeft: 5 },

  storeDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 15,
    lineHeight: 20,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "#F0F8F1",
    borderRadius: 12,
    padding: 12,
  },
  detailItem: { flexDirection: "row", alignItems: "center" },
  detailText: { fontSize: 13, color: "#4CAF50", fontWeight: "500", marginLeft: 5 },

  addressContainer: { backgroundColor: "#F5F7FA", borderRadius: 12, padding: 12 },
  addressLabel: { fontSize: 14, fontWeight: "bold", color: "#212121", marginBottom: 8 },
  addressRow: { flexDirection: "row", alignItems: "flex-start" },
  addressIcon: { marginRight: 8, marginTop: 2 },
  addressText: { fontSize: 14, color: "#757575", flex: 1 },

  divider: { height: 8, backgroundColor: "#F5F5F5" },

  /* Categories */
  categoriesContainer: { paddingHorizontal: 10, paddingVertical: 10 },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 1,
  },
  selectedCategoryItem: { backgroundColor: "#4CAF50" },
  categoryName: { fontSize: 14, color: "#757575", fontWeight: "500" },
  selectedCategoryName: { color: "#FFFFFF", fontWeight: "bold" },

  /* Products grid */
  productsSection: { padding: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 15,
    marginLeft: 5,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: (width - 50) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    position: "relative",
  },
  productImage: { width: "100%", height: 120, borderRadius: 12, marginBottom: 10 },
  productInfo: { marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: "bold", color: "#212121", marginBottom: 5 },
  productUnit: { fontSize: 12, color: "#757575", marginBottom: 5 },
  productPrice: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  addButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 30,
    height: 30,
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
});

export default StoreDetailScreen;
