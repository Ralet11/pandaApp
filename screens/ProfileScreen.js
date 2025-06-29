"use client"

import { useState } from "react"
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Switch, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "../store/slices/user.slice"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.user.userInfo)
  const [notif, setNotif] = useState(true)

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#121620", "#0A0C10"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.profileImage} />
            <TouchableOpacity style={styles.editImageButton}>
              <MaterialCommunityIcons name="camera" size={18} color="#0A0C10" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {[
            { icon: "account", label: "Personal Information" },
            { icon: "map-marker", label: "Saved Addresses" },
            { icon: "credit-card", label: "Payment Methods" },
          ].map(({ icon, label }) => (
            <TouchableOpacity key={label} style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <MaterialCommunityIcons name={icon} size={22} color="#F5F5DC" />
              </View>
              <Text style={styles.menuItemText}>{label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#A0A0A0" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Orders")}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="shopping" size={22} color="#F5F5DC" />
            </View>
            <Text style={styles.menuItemText}>Order History</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="bell" size={22} color="#F5F5DC" />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Switch
              value={notif}
              onValueChange={() => setNotif((n) => !n)}
              trackColor={{ false: "#1A2332", true: "#1A2332" }}
              thumbColor={notif ? "#F5F5DC" : "#A0A0A0"}
              style={styles.switch}
            />
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="cog" size={22} color="#F5F5DC" />
            </View>
            <Text style={styles.menuItemText}>App Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="help-circle" size={22} color="#F5F5DC" />
            </View>
            <Text style={styles.menuItemText}>Help Center</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#A0A0A0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert("Logout", "Are you sure you want to logout?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: () => dispatch(logout()),
                },
              ])
            }
          >
            <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
              <MaterialCommunityIcons name="logout" size={22} color="#FF5252" />
            </View>
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
       
          <Text style={styles.appVersion}>Chill v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2023 Chill Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0C10",
  },
  headerGradient: {
    height: 80,
    width: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F5F5DC",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121620",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0A0C10",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F5F5DC",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0A0C10",
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: "#1A2332",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  editProfileText: {
    fontSize: 12,
    color: "#F5F5DC",
    fontWeight: "bold",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    backgroundColor: "#121620",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2332",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A2332",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  logoutIconContainer: {
    backgroundColor: "#331A1A",
  },
  menuItemText: {
    fontSize: 16,
    color: "#F5F5DC",
    flex: 1,
  },
  logoutText: {
    color: "#FF5252",
    fontWeight: "500",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  appInfo: {
    alignItems: "center",
    marginVertical: 30,
  },
  appVersion: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 8,
    marginBottom: 5,
  },
  appCopyright: {
    fontSize: 12,
    color: "#A0A0A0",
  },
})

export default ProfileScreen
