// AppNavigation.js
"use client";

/* ------------ Navegación ------------ */
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

/* ------------ Socket ------------ */
import useSocket from "./config/socket"; // Hook que inicializa WS

/* ------------ Screens ------------ */
import AuthScreen             from "./screens/AuthScreen";
import StoreCatalogScreen     from "./screens/StoreCatalogScreen";
import StoreDetailScreen      from "./screens/StoreDetailScreen";
import ProductDetailScreen    from "./screens/ProductDetailScreen";
import ProfileScreen          from "./screens/ProfileScreen";
import CartScreen             from "./screens/CartScreen";
import OrdersScreen           from "./screens/OrderScreen";
import AddressBookScreen      from "./screens/AddressBookScreen";
import SelectNewAddress       from "./screens/SelectNewAddress";
import OrderTrackingScreen    from "./screens/OrderTrackingScreen";

/* ------------ Ref global ------------ */
import { navigationRef } from "./components/NavigationRef";

/* ------------ Tema Oscuro ------------ */
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#F5F5DC",     // Beige/crema
    background: "#0A0C10",  // Fondo principal oscuro
    card: "#121620",        // Fondo cards / tab
    text: "#F5F5DC",        // Texto
    border: "#1A2332",      // Bordes sutiles
    notification: "#F5F5DC",
  },
};

/* ------------ Stacks / Tabs ---------- */
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

/* Helper iconos */
const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case "Home":    return focused ? "home"   : "home-outline";
    case "Cart":    return focused ? "cart"   : "cart-outline";
    case "Orders":  return focused ? "list"   : "list-outline";
    case "Profile": return focused ? "person" : "person-outline";
    default:        return "ellipse";
  }
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#121620",
          borderTopWidth: 1,
          borderTopColor: "#1A2332",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 56,       // Ajustado
          paddingBottom: 4, // Ajustado
          paddingTop: 6,    // Ajustado
        },
        tabBarActiveTintColor:   "#F5F5DC",
        tabBarInactiveTintColor: "#A0A0A0",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={StoreCatalogScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarLabel: "Carrito" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarLabel: "Pedidos" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

/* ------------ Root navigator --------- */
export default function AppNavigation() {
  useSocket(); // Inicializa WebSocket

  return (
    <NavigationContainer ref={navigationRef} theme={customTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#0A0C10" },
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
        initialRouteName="Login"
      >
        {/* Auth */}
        <Stack.Screen
          name="Login"
          component={AuthScreen}
          options={{ animation: "fade" }}
        />

        {/* Tabs */}
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ animation: "fade" }}
        />

        {/* Detalles */}
        <Stack.Screen
          name="StoreDetail"
          component={StoreDetailScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="Addresses"
          component={AddressBookScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="SelectNewAddress"
          component={SelectNewAddress}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="OrderTracking"
          component={OrderTrackingScreen}
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
