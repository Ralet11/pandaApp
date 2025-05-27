// ─────────────────────────────────────────────────────────────
// navigation.js   (completo, listo para pegar)
// ─────────────────────────────────────────────────────────────
"use client";

import React from "react";

/* ------------ Navegación ------------ */
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator }       from "@react-navigation/native-stack";
import { createBottomTabNavigator }         from "@react-navigation/bottom-tabs";
import Icon                                 from "react-native-vector-icons/Ionicons";

/* ------------ Socket ------------ */
import useSocket from "./config/socket";           // Hook que inicializa WS

/* ------------ Screens ------------ */
import AuthScreen            from "./screens/AuthScreen";
import StoreCatalogScreen    from "./screens/StoreCatalogScreen";
import StoreDetailScreen     from "./screens/StoreDetailScreen";
import ProductDetailScreen   from "./screens/ProductDetailScreen";
import ProfileScreen         from "./screens/ProfileScreen";
import CartScreen            from "./screens/CartScreen";
import OrdersScreen          from "./screens/OrderScreen";
import AddressBookScreen     from "./screens/AddressBookScreen";
import SelectNewAddress      from "./screens/SelectNewAddress";
import OrderTrackingScreen   from "./screens/OrderTrackingScreen";

/* ------------ Ref global ------------ */
import { navigationRef } from "./components/NavigationRef";

/* ------------ Tema ------------ */
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:      "#4CAF50",
    background:   "#FFFFFF",
    card:         "#FFFFFF",
    text:         "#000000",
    border:       "#E0E0E0",
    notification: "#4CAF50",
  },
};

/* ------------ Stacks / Tabs ---------- */
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

/* Icon helper */
const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case "Home":
      return focused ? "home"   : "home-outline";
    case "Cart":
      return focused ? "cart"   : "cart-outline";
    case "Orders":
      return focused ? "list"   : "list-outline";
    case "Profile":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse";
  }
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: customTheme.colors.card,
          borderTopWidth: 0,
          elevation: 3,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   customTheme.colors.primary,
        tabBarInactiveTintColor: "#757575",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home"    component={StoreCatalogScreen} />
      <Tab.Screen name="Cart"    component={CartScreen} />
      <Tab.Screen name="Orders"  component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/* ------------ Root navigator --------- */
export default function AppNavigation() {
  useSocket(); // habilita conexión con el backend por WebSocket

  return (
    <NavigationContainer ref={navigationRef} theme={customTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: customTheme.colors.background },
        }}
        initialRouteName="Login"
      >
        {/* Auth */}
        <Stack.Screen name="Login" component={AuthScreen} />

        {/* Tabs */}
        <Stack.Screen name="HomeTabs" component={HomeTabs} />

        {/* Detalles */}
        <Stack.Screen name="StoreDetail"       component={StoreDetailScreen} />
        <Stack.Screen name="ProductDetail"     component={ProductDetailScreen} />
        <Stack.Screen name="Addresses"         component={AddressBookScreen} />
        <Stack.Screen name="SelectNewAddress"  component={SelectNewAddress} />
        <Stack.Screen name="OrderTracking"     component={OrderTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
