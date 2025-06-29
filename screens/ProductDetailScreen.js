"use client"

import { useEffect, useState } from "react"
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useDispatch } from "react-redux"
import Toast from "react-native-toast-message"
import axios from "react-native-axios"
import { addItem } from "../store/slices/cart.slice"
import { setCurrentOrder } from "../store/slices/order.slice" // ←── NUEVO
import { API_URL } from "@env"
import BackButton from "../components/BackButton"

/* ───────── Valores por defecto ───────── */
const INITIAL_PRODUCT = {
  id: "",
  name: "",
  img: "",
  price: 0,
  unit: "",
  description: "",
  weight: "",
  nutrition: {},
  inStock: true,
}

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId, storeId } = route.params
  const dispatch = useDispatch()

  const [product, setProduct] = useState(INITIAL_PRODUCT)
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  /* ───────── Fetch product + related ───────── */
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await axios.get(`${API_URL}/products/${productId}`)
        const relatedRes = await axios.get(`${API_URL}/products`, {
          params: { shop_id: storeId },
        })

        if (!alive) return

        setProduct({ ...res.data, img: res.data.img || "https://via.placeholder.com/500" })

        const others = (Array.isArray(relatedRes.data) ? relatedRes.data : [])
          .filter((p) => p.id !== res.data.id)
          .slice(0, 6)
        setRelated(others)
      } catch (err) {
        console.error("Error cargando producto:", err)
      }
    })()
    return () => {
      alive = false
    }
  }, [productId, storeId])

  /* ───────── Helpers ───────── */
  const nutritionEntries = Object.entries(product.nutrition || {})

  const handleAddToCart = () => {
    /* 1. Agregar ítem al carrito */
    const cartItem = {
      id: `${product.id}`,
      name: product.name,
      img: product.img,
      pricePerUnit: Number(product.price),
      quantity,
      totalPrice: Number(product.price) * quantity,
      storeId,
    }
    dispatch(addItem(cartItem))

    /* 2. Registrar el comercio en currentOrder (solo 1 comercio por orden) */
    dispatch(setCurrentOrder({ shop_id: storeId }))

    /* 3. Feedback */
    Toast.show({
      type: "success",
      text1: "Added to cart",
      text2: `${quantity} × ${product.name}`,
      visibilityTime: 1500,
    })
  }

  const renderRelatedProduct = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.relatedProductCard}
      onPress={() => navigation.replace("ProductDetail", { productId: item.id, storeId })}
    >
      <Image source={{ uri: item.img || "https://via.placeholder.com/200" }} style={styles.relatedProductImage} />
      <View style={styles.relatedProductInfo}>
        <Text style={styles.relatedProductName}>{item.name}</Text>
        <Text style={styles.relatedProductPrice}>
          ${Number(item.price).toFixed(2)} / {item.unit ?? ""}
        </Text>
      </View>
    </TouchableOpacity>
  )

  /* ───────── UI ───────── */
  return (
    <SafeAreaView style={styles.container}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Imagen + fav */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.img }} style={styles.productImage} />
          <TouchableOpacity style={styles.favoriteButton} onPress={() => setIsFavorite((p) => !p)}>
            <Feather name="heart" size={20} color={isFavorite ? "#FF5252" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>

        {/* Info principal */}
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productUnit}>{product.unit}</Text>
            <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
          </View>

          {/* Selector cantidad */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={() => quantity > 1 && setQuantity(quantity - 1)}>
              <Feather name="minus" size={16} color="#F5F5DC" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
              <Feather name="plus" size={16} color="#F5F5DC" />
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          {product.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Detalles */}
          {product.weight && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{product.weight}</Text>
              </View>
            </View>
          )}

          {/* Nutrición */}
          {nutritionEntries.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <View style={styles.nutritionContainer}>
                {nutritionEntries.map(([k, v]) => (
                  <View key={k} style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{v}</Text>
                    <Text style={styles.nutritionLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Productos relacionados */}
          {related.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>You might also like</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedProductsContainer}
              >
                {related.map(renderRelatedProduct)}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pie de acción */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${(Number(product.price) * quantity).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Feather name="shopping-bag" size={20} color="#0A0C10" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </SafeAreaView>
  )
}

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },

  /* Imagen header */
  imageContainer: { width: "100%", height: 300, position: "relative" },
  productImage: { width: "100%", height: "100%" },
  favoriteButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(10,12,16,0.7)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Contenido */
  contentContainer: { padding: 20 },
  headerContainer: { marginBottom: 15 },
  productName: { fontSize: 24, fontWeight: "bold", color: "#F5F5DC", marginBottom: 5 },
  productUnit: { fontSize: 16, color: "#A0A0A0", marginBottom: 5 },
  productPrice: { fontSize: 20, fontWeight: "bold", color: "#F5F5DC" },

  quantityContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F5F5DC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121620",
  },
  quantityText: { fontSize: 16, fontWeight: "bold", color: "#F5F5DC", marginHorizontal: 15 },

  /* Secciones */
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#F5F5DC", marginBottom: 10 },
  descriptionText: { fontSize: 14, color: "#A0A0A0", lineHeight: 22 },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#121620",
  },
  detailLabel: { fontSize: 14, color: "#A0A0A0" },
  detailValue: { fontSize: 14, color: "#F5F5DC" },

  nutritionContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  nutritionItem: { alignItems: "center", width: "20%", marginBottom: 10 },
  nutritionValue: { fontSize: 14, fontWeight: "bold", color: "#F5F5DC", marginBottom: 5 },
  nutritionLabel: { fontSize: 12, color: "#A0A0A0" },

  /* Relacionados */
  relatedProductsContainer: { paddingVertical: 10 },
  relatedProductCard: { width: 120, marginRight: 15 },
  relatedProductImage: { width: 120, height: 120, borderRadius: 8, marginBottom: 8 },
  relatedProductInfo: { paddingHorizontal: 5 },
  relatedProductName: { fontSize: 14, fontWeight: "bold", color: "#F5F5DC", marginBottom: 5 },
  relatedProductPrice: { fontSize: 12, color: "#F5F5DC" },

  /* Pie */
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#121620",
    backgroundColor: "#0A0C10",
  },
  totalContainer: { flex: 1 },
  totalLabel: { fontSize: 12, color: "#A0A0A0" },
  totalPrice: { fontSize: 18, fontWeight: "bold", color: "#F5F5DC" },

  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#F5F5DC",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  addToCartText: { fontSize: 16, fontWeight: "bold", color: "#0A0C10", marginLeft: 10 },
})

export default ProductDetailScreen
