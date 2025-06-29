"use client"

import { useEffect, useMemo, useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useSelector } from "react-redux"
import axios from "react-native-axios"
import { API_URL } from "@env"

const { width } = Dimensions.get("window")

/* ───────── Helpers distancia ───────── */
const toRad = (v) => (v * Math.PI) / 180
const getDistanceKm = (la1, lo1, la2, lo2) => {
  const R = 6371
  const dLat = toRad(la2 - la1)
  const dLon = toRad(lo2 - lo1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
const toNumber = (v) => {
  const n = Number(v)
  return isFinite(n) ? n : null
}

const StoreCatalogScreen = ({ navigation }) => {
  /* ───────── Redux ───────── */
  const token = useSelector((s) => s.user.token)
  const { addresses = [], currentAddress } = useSelector((s) => s.user)

  /* Dirección a mostrar: la elegida o la default DB */
  const shownAddress = useMemo(
    () => currentAddress ?? addresses.find((a) => a.isDefault) ?? null,
    [currentAddress, addresses],
  )

  /* ───────── Local state ───────── */
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [shopsLoading, setShopsLoading] = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState("All")
  const scrollY = new Animated.Value(0)

  /* ───────── Coordenadas de usuario ───────── */
  const userCoords = shownAddress
    ? {
        latitude: toNumber(shownAddress.latitude),
        longitude: toNumber(shownAddress.longitude),
      }
    : null

  /* ───────── Fetch shops ───────── */
  useEffect(() => {
    let alive = true
    ;(async () => {
      setShopsLoading(true)
      try {
        const res = await axios.get(`${API_URL}/shops`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (alive) setShops(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error al obtener shops:", err)
      } finally {
        if (alive) setShopsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [token])

  /* ───────── Fetch categories ───────── */
  useEffect(() => {
    let alive = true
    ;(async () => {
      setCatsLoading(true)
      try {
        const res = await axios.get(`${API_URL}/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (alive) setCategories(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Error al obtener categories:", err)
      } finally {
        if (alive) setCatsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [token])

  const isLoading = shopsLoading || catsLoading

  /* ───────── Datos derivados ───────── */
  const featuredStores = useMemo(() => shops.slice(0, 3), [shops])

  const filtered = useMemo(
    () =>
      shops.filter((s) => {
        const match = s.name.toLowerCase().includes(search.toLowerCase())
        if (cat === "All") return match
        const shopCats = s.categories?.map((c) => c.name) || []
        return match && shopCats.includes(cat)
      }),
    [shops, search, cat],
  )

  /* ───────── Animaciones ───────── */
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  })

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [110, 70],
    extrapolate: "clamp",
  })

  /* ───────── Render helpers ───────── */
  const renderFeatured = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => navigation.navigate("StoreDetail", { storeId: item.id, storeName: item.name })}
      accessible={true}
      accessibilityLabel={`Featured store: ${item.name}`}
      accessibilityHint="Opens store details page"
    >
      <Image source={{ uri: item.logo }} style={styles.featuredImage} accessibilityLabel={`${item.name} logo`} />
      <LinearGradient colors={["transparent", "rgba(10,12,16,0.9)"]} style={styles.featuredGradient}>
        <Text style={styles.featuredName}>{item.name}</Text>
        <Text style={styles.featuredDesc} numberOfLines={1}>
          {item.description}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderStore = ({ item }) => {
    const shopLat = toNumber(item.latitude)
    const shopLon = toNumber(item.longitude)

    let eta = 10
    if (userCoords && shopLat !== null && shopLon !== null) {
      const distKm = getDistanceKm(userCoords.latitude, userCoords.longitude, shopLat, shopLon)
      eta += Math.round(distKm * 2)
    }

    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => navigation.navigate("StoreDetail", { storeId: item.id, storeName: item.name })}
        accessible={true}
        accessibilityLabel={`Store: ${item.name}, estimated delivery time ${eta} minutes`}
        accessibilityHint="Opens store details page"
      >
        <Image source={{ uri: item.logo }} style={styles.storeImage} accessibilityLabel={`${item.name} logo`} />
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="timer-sand" size={14} color="#F5F5DC" />
            <Text style={styles.locationTxt}>15-25 min</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderCat = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryItem, cat === item.name && styles.selectedCategoryItem]}
      onPress={() => setCat(item.name)}
      accessible={true}
      accessibilityLabel={`Category ${item.name}${cat === item.name ? ", selected" : ""}`}
      accessibilityRole="button"
    >
      <Text style={styles.categoryIcon}>{item.emoji || "🛍️"}</Text>
      <Text style={[styles.categoryName, cat === item.name && styles.selectedCategoryName]}>{item.name}</Text>
    </TouchableOpacity>
  )

  /* ───────── JSX ───────── */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      placeOrder

      {/* Combined search and address bar */}
      <View style={styles.topBarContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" color="#A0A0A0" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stores..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#A0A0A0"
              accessibilityLabel="Search stores"
            />
          </View>
        </View>

        <View style={styles.addressBar}>
          {shownAddress ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Addresses")}
              accessible={true}
              accessibilityLabel="Change delivery address"
              accessibilityRole="button"
            >
              <View style={styles.addressContent}>
                <Feather name="map-pin" size={14} color="#F5F5DC" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {shownAddress.street}, {shownAddress.city}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("Addresses")}
              accessible={true}
              accessibilityLabel="Add delivery address"
              accessibilityRole="button"
            >
              <View style={styles.addressContent}>
                <Feather name="plus-circle" size={14} color="#F5F5DC" />
                <Text style={styles.addAddressText}>Add delivery address</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Featured section with title */}
        {featuredStores.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Featured Stores</Text>
            <FlatList
              data={featuredStores}
              renderItem={renderFeatured}
              keyExtractor={(it) => `feature-${it.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 10 }}
              snapToInterval={width - 60}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* Categories with title */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={[{ id: 0, name: "All", emoji: " " }, ...categories]}
            renderItem={renderCat}
            keyExtractor={(it) => it.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* All stores section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>All Stores</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : filtered.length > 0 ? (
            <FlatList
              data={filtered}
              renderItem={renderStore}
              keyExtractor={(it) => it.id.toString()}
              contentContainerStyle={styles.storeList}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stores found</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0C10",
  },

  // Header
  header: {
    height: 110,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#F5F5DC",
    fontSize: 22,
    fontWeight: "bold",
  },

  // Top bar
  topBarContainer: {
    backgroundColor: "#121620",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#1A2332",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // Search
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0C10",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#F5F5DC",
    fontSize: 14,
  },

  // Address bar
  addressBar: {
    marginTop: 4,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    color: "#A0A0A0",
    fontSize: 13,
    marginLeft: 4,
  },
  addAddressText: {
    color: "#F5F5DC",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },

  // Section containers
  sectionContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F5DC",
    marginLeft: 16,
    marginBottom: 12,
  },

  // Featured section
  featuredCard: {
    width: width - 60,
    height: 160,
    backgroundColor: "#121620",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 12,
  },
  featuredName: {
    color: "#F5F5DC",
    fontWeight: "bold",
    fontSize: 16,
  },
  featuredDesc: {
    color: "#A0A0A0",
    fontSize: 12,
    opacity: 0.9,
  },

  // Categories
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#121620",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedCategoryItem: {
    backgroundColor: "#F5F5DC",
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  selectedCategoryName: {
    color: "#0A0C10",
    fontWeight: "500",
  },

  // Store list
  storeList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#121620",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F5F5DC",
    marginBottom: 4,
  },
  storeDesc: {
    fontSize: 12,
    color: "#A0A0A0",
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationTxt: {
    fontSize: 12,
    color: "#F5F5DC",
    marginLeft: 4,
    fontWeight: "500",
  },

  // Loading and empty states
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
})

export default StoreCatalogScreen
