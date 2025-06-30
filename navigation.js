// AppNavigation.js
"use client";

/* ------------ Navigation ------------ */
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

/* ------------ WebSocket Hook ------------ */
import useSocket from "./config/socket"; // Hook to initialize WebSocket connection

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

/* ------------ Global Navigation Ref ------------ */
import { navigationRef } from "./components/NavigationRef";

/* ------------ Dark Theme ------------ */
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#F5F5DC",     // Cream
    background: "#0A0C10",  // Main dark background
    card: "#121620",        // Card / tab background
    text: "#F5F5DC",        // Text color
    border: "#1A2332",      // Subtle borders
    notification: "#F5F5DC",
  },
};

/* ------------ Stack & Tab Navigators ---------- */
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

/* Helper for tab icons */
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
          height: 56,
          paddingBottom: 4,
          paddingTop: 6,
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
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarLabel: "Cart" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

/* ------------ Root Navigator --------- */
export default function AppNavigation() {
  useSocket(); // Initialize WebSocket

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
        {/* Authentication */}
        <Stack.Screen
          name="Login"
          component={AuthScreen}
          options={{ animation: "fade" }}
        />

        {/* Main Tabs */}
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ animation: "fade" }}
        />

        {/* Detail Screens */}
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
