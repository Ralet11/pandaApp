// ─────────────────────────────────────────────────────────────
// views/AuthScreen.jsx  (full component in ENGLISH)
// ─────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/user.slice";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "@env";

const { width } = Dimensions.get("window");

const AuthScreen = ({ navigation }) => {
  /* ----------------------------- State ----------------------------- */
  const [isLogin, setIsLogin] = useState(true); // login ↔ signup
  const [showForgot, setShowForgot] = useState(false); // forgot-password flow
  const [name, setName] = useState("");
  const [email, setEmail] = useState("ramiro.alet@gmail.com");
  const [password, setPassword] = useState("123456");
  const [secure, setSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const dispatch = useDispatch();

  console.log(`${API_URL}/auth/users/login`);

  /* --------------------------- Helpers --------------------------- */
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const clearErrors = () => {
    setEmailErr(false);
    setPassErr(false);
  };

  /* --------------------------- API Calls --------------------------- */
  const handleLogin = async () => {
    clearErrors();
    if (!email || !isValidEmail(email)) {
      setEmailErr(true);
      Toast.show({ type: "error", text1: "Invalid email" });
      return;
    }
    if (!password) {
      setPassErr(true);
      Toast.show({ type: "error", text1: "Password required" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/users/login`, { email, password });
      if (res.status === 200) {
        const { user, token } = res.data;
        dispatch(setUser({ user, token }));
        navigation.navigate("HomeTabs");
      } else {
        Toast.show({ type: "error", text1: "Incorrect credentials" });
      }
    } catch (err) {
      console.error("Login error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Authentication failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    clearErrors();
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Name required" });
      return;
    }
    if (!email || !isValidEmail(email)) {
      setEmailErr(true);
      Toast.show({ type: "error", text1: "Invalid email" });
      return;
    }
    if (!password || password.length < 6) {
      setPassErr(true);
      Toast.show({
        type: "error",
        text1: "Invalid password",
        text2: "Must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/users/register`, {
        name,
        email,
        password,
      });
      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "Registration successful",
          text2: "You can now log in.",
        });
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Register error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Could not register.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    clearErrors();
    if (!email || !isValidEmail(email)) {
      setEmailErr(true);
      Toast.show({ type: "error", text1: "Invalid email" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/user/forgot-password`, { email });
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Check your mailbox",
          text2: res.data.message || "Reset link sent.",
        });
        setShowForgot(false);
      }
    } catch (err) {
      console.error("Forgot-password error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Email could not be sent.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.headerGradient}>
        <View style={styles.logoWrapper}>
          <Icon name="panda" size={64} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>Panda</Text>
        <Text style={styles.headerSubtitle}>Shop • Deliver • Enjoy</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* -------- Login / Signup / Forgot -------- */}
            {!showForgot ? (
              <>
                <Text style={styles.cardTitle}>{isLogin ? "Sign In" : "Create Account"}</Text>

                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon name="account-outline" size={20} color="#777" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <View style={[styles.inputContainer, emailErr && styles.inputError]}>
                    <Icon name="email-outline" size={20} color="#777" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setEmailErr(false);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {emailErr && <Text style={styles.errorText}>Invalid email</Text>}
                </View>

                <View style={styles.inputWrapper}>
                  <View style={[styles.inputContainer, passErr && styles.inputError]}>
                    <Icon name="lock-outline" size={20} color="#777" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setPassErr(false);
                      }}
                      secureTextEntry={secure}
                    />
                    <TouchableOpacity onPress={() => setSecure(!secure)} style={{ padding: 4 }}>
                      <Icon name={secure ? "eye-outline" : "eye-off-outline"} size={20} color="#777" />
                    </TouchableOpacity>
                  </View>
                  {passErr && <Text style={styles.errorText}>Password required</Text>}
                </View>

                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => setShowForgot(true)}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    isLoading && styles.buttonDisabled,
                    { marginTop: isLogin ? 0 : 10 },
                  ]}
                  onPress={isLogin ? handleLogin : handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isLogin ? "Sign In" : "Sign Up"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLogin(!isLogin);
                      clearErrors();
                    }}
                  >
                    <Text style={styles.switchButton}>{isLogin ? "Register" : "Sign In"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Reset Password</Text>
                <Text style={styles.resetInfo}>
                  Enter your email to receive a recovery link.
                </Text>

                <View style={styles.inputWrapper}>
                  <View style={[styles.inputContainer, emailErr && styles.inputError]}>
                    <Icon name="email-outline" size={20} color="#777" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setEmailErr(false);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {emailErr && <Text style={styles.errorText}>Invalid email</Text>}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonForgot,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleForgot}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Send link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backToLogin} onPress={() => setShowForgot(false)}>
                  <Icon name="arrow-left" size={16} color="#2E7D32" style={{ marginRight: 5 }} />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

/* ------------------------------ Styles ------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerGradient: {
    width,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { color: "#FFF", fontSize: 28, fontWeight: "bold" },
  headerSubtitle: { color: "#E8F5E9", fontSize: 15, marginTop: 4 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, elevation: 5 },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrapper: { marginBottom: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  inputError: { borderColor: "#C62828" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#1F2937" },
  errorText: { color: "#C62828", fontSize: 12, marginTop: 4, marginLeft: 4 },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 24, marginTop: 4 },
  forgotPasswordText: { color: "#2E7D32", fontSize: 14, fontWeight: "500" },
  button: {
    height: 55,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  buttonForgot: { marginTop: 10 },
  buttonDisabled: { backgroundColor: "#A5D6A7" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  switchText: { color: "#6B7280", fontSize: 15 },
  switchButton: { color: "#2E7D32", fontWeight: "bold", fontSize: 15 },
  backToLogin: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: { color: "#2E7D32", fontSize: 14, fontWeight: "500" },
  resetInfo: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
});

export default AuthScreen;
