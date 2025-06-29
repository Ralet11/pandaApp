"use client"

import { useState } from "react"
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
} from "react-native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import axios from "axios"
import { useDispatch } from "react-redux"
import { setUser } from "../store/slices/user.slice"
import Toast from "react-native-toast-message"
import { LinearGradient } from "expo-linear-gradient"
import { API_URL } from "@env"
import { SvgUri, Svg, Circle } from "react-native-svg"
import MaskedView from "@react-native-masked-view/masked-view"

const { width } = Dimensions.get("window")

const AuthScreen = ({ navigation }) => {
  /* ----------------------------- State ----------------------------- */
  const [isLogin, setIsLogin]       = useState(true)
  const [showForgot, setShowForgot] = useState(false)
  const [name, setName]             = useState("")
  const [email, setEmail]           = useState("ramiro.alet@gmail.com")
  const [password, setPassword]     = useState("123456")
  const [secure, setSecure]         = useState(true)
  const [isLoading, setIsLoading]   = useState(false)
  const [emailErr, setEmailErr]     = useState(false)
  const [passErr, setPassErr]       = useState(false)
  const dispatch                    = useDispatch()

  /* --------------------------- Helpers --------------------------- */
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const clearErrors  = () => { setEmailErr(false); setPassErr(false) }

  /* --------------------------- API Calls --------------------------- */
  const handleLogin = async () => {
    clearErrors()
    if (!email || !isValidEmail(email)) {
      setEmailErr(true)
      Toast.show({ type: "error", text1: "Invalid email" })
      return
    }
    if (!password) {
      setPassErr(true)
      Toast.show({ type: "error", text1: "Password required" })
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(`${API_URL}/auth/users/login`, { email, password })
      if (res.status === 200) {
        const { user, token } = res.data
        dispatch(setUser({ user, token }))
        navigation.navigate("HomeTabs")
      } else {
        Toast.show({ type: "error", text1: "Incorrect credentials" })
      }
    } catch (err) {
      console.error("Login error:", err)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Authentication failed.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    clearErrors()
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Name required" })
      return
    }
    if (!email || !isValidEmail(email)) {
      setEmailErr(true)
      Toast.show({ type: "error", text1: "Invalid email" })
      return
    }
    if (!password || password.length < 6) {
      setPassErr(true)
      Toast.show({
        type: "error",
        text1: "Invalid password",
        text2: "Must be at least 6 characters.",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(`${API_URL}/auth/users/register`, { name, email, password })
      if (res.status === 201) {
        Toast.show({
          type: "success",
          text1: "Registration successful",
          text2: "You can now log in.",
        })
        setIsLogin(true)
      }
    } catch (err) {
      console.error("Register error:", err)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Could not register.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgot = async () => {
    clearErrors()
    if (!email || !isValidEmail(email)) {
      setEmailErr(true)
      Toast.show({ type: "error", text1: "Invalid email" })
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(`${API_URL}/user/forgot-password`, { email })
      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Check your mailbox",
          text2: res.data.message || "Reset link sent.",
        })
        setShowForgot(false)
      }
    } catch (err) {
      console.error("Forgot-password error:", err)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Email could not be sent.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  /* ----------------------------- Render ----------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0C10" />

      {/* ---------- Header ---------- */}
      <LinearGradient
        colors={["#1A2332", "#121620", "#0A0C10"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaskedView
          style={styles.logoWrapper}
          maskElement={
            <Svg width="120" height="120">
              {/* círculo ligeramente más pequeño */}
              <Circle cx="60" cy="60" r="58" fill="#fff" />
            </Svg>
          }
        >
          {/* círculo con color hueso */}
          <View style={styles.circleBg} />
          {/* logo SVG */}
          <SvgUri
            width="120"
            height="120"
            uri="https://res.cloudinary.com/doqyrz0sg/image/upload/v1749842305/chillLogo_zwjlpd.svg"
          />
        </MaskedView>

        <Text style={styles.headerSubtitle}>Shop • Deliver • Enjoy</Text>
      </LinearGradient>

      {/* ---------- Formulario ---------- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {!showForgot ? (
              <>
                <Text style={styles.cardTitle}>
                  {isLogin ? "Sign In" : "Create Account"}
                </Text>

                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="account-outline"
                        size={20}
                        color="#A0A0A0"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor="#A0A0A0"
                        value={name}
                        onChangeText={setName}
                        color="#F5F5DC"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      emailErr && styles.inputError,
                    ]}
                  >
                    <Icon
                      name="email-outline"
                      size={20}
                      color="#A0A0A0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#A0A0A0"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t)
                        setEmailErr(false)
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      color="#F5F5DC"
                    />
                  </View>
                  {emailErr && (
                    <Text style={styles.errorText}>Invalid email</Text>
                  )}
                </View>

                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      passErr && styles.inputError,
                    ]}
                  >
                    <Icon
                      name="lock-outline"
                      size={20}
                      color="#A0A0A0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#A0A0A0"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t)
                        setPassErr(false)
                      }}
                      secureTextEntry={secure}
                      color="#F5F5DC"
                    />
                    <TouchableOpacity
                      onPress={() => setSecure(!secure)}
                      style={{ padding: 4 }}
                    >
                      <Icon
                        name={secure ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#A0A0A0"
                      />
                    </TouchableOpacity>
                  </View>
                  {passErr && (
                    <Text style={styles.errorText}>Password required</Text>
                  )}
                </View>

                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => setShowForgot(true)}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot password?
                    </Text>
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
                    <ActivityIndicator color="#0A0C10" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isLogin ? "Sign In" : "Sign Up"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>
                    {isLogin
                      ? "Don't have an account? "
                      : "Already have an account? "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLogin(!isLogin)
                      clearErrors()
                    }}
                  >
                    <Text style={styles.switchButton}>
                      {isLogin ? "Register" : "Sign In"}
                    </Text>
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
                  <View
                    style={[
                      styles.inputContainer,
                      emailErr && styles.inputError,
                    ]}
                  >
                    <Icon
                      name="email-outline"
                      size={20}
                      color="#A0A0A0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#A0A0A0"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t)
                        setEmailErr(false)
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      color="#F5F5DC"
                    />
                  </View>
                  {emailErr && (
                    <Text style={styles.errorText}>Invalid email</Text>
                  )}
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
                    <ActivityIndicator color="#0A0C10" />
                  ) : (
                    <Text style={styles.buttonText}>Send link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLogin}
                    onPress={() => setShowForgot(false)}
                >
                  <Icon
                    name="arrow-left"
                    size={16}
                    color="#F5F5DC"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  )
}

/* ------------------------------ Styles ------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },

  /* ---------- Header ---------- */
  headerGradient: {
    width,
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    alignItems: "center",
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 16,
  },
  circleBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E3DAC9", // color hueso más suave
  },
  headerSubtitle: { color: "#A0A0A0", fontSize: 16, letterSpacing: 1 },

  /* ---------- Formulario ---------- */
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#121620",
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F5F5DC",
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrapper: { marginBottom: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    backgroundColor: "#0A0C10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A2332",
    paddingHorizontal: 12,
  },
  inputError: { borderColor: "#FF5252" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 24, marginTop: 4 },
  forgotPasswordText: {
    color: "#F5F5DC",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    height: 55,
    borderRadius: 12,
    backgroundColor: "#F5F5DC",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  buttonForgot: { marginTop: 10 },
  buttonDisabled: { backgroundColor: "#A0A0A0" },
  buttonText: { color: "#0A0C10", fontSize: 16, fontWeight: "bold" },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  switchText: { color: "#A0A0A0", fontSize: 15 },
  switchButton: { color: "#F5F5DC", fontWeight: "bold", fontSize: 15 },
  backToLogin: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: { color: "#F5F5DC", fontSize: 14, fontWeight: "500" },
  resetInfo: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
    marginBottom: 20,
  },
})

export default AuthScreen
