/* SelectNewAddress – fully working ------------------------------------------------ */
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import axios from "react-native-axios";
import { useSelector } from "react-redux";
import { GOOGLE_API_KEY, API_URL } from "@env";
import { GOOGLE_PROPS_FIX } from "../components/GooglePLacesProps"; // minLength • timeout • filterResults …

/* -------------------------------------------------------------------------- */

const { height: screenH } = Dimensions.get("window");
const DEFAULT_POS = { latitude: -34.603722, longitude: -58.381592 };

export default function SelectNewAddress({ navigation, route }) {
  /* ───────── params ───────── */
  const { addressParam = null } = route.params || {};

  /* ───────── redux ───────── */
  const token   = useSelector(s => s.user?.token);
  const user_id = useSelector(s => s.user?.userInfo?.id ?? null);

  /* ───────── local ───────── */
  const [addressId, setAddressId] = useState(null);
  const [address, setAddress]     = useState({
    street:   "",
    floor:    "",
    comments: "",
    type:     "home",
    city:     "",
    state:    "",
    zipCode:  "",
    country:  "",
  });

  const [region, setRegion]   = useState({ ...DEFAULT_POS, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const [marker, setMarker]   = useState({ ...DEFAULT_POS });

  /* refs */
  const gRef  = useRef(null); // GooglePlacesAutocomplete
  const mapR  = useRef(null);
  const once  = useRef(false);

  /* ───────── Google props ───────── */
  const gQuery = useMemo(
    () => ({ key: GOOGLE_API_KEY, language: "en", types: [] }),
    [],
  );
  const gStyles = {
    container          : { flex: 0 },
    textInputContainer : { backgroundColor: "#121620", borderRadius: 8, paddingHorizontal: 12 },
    textInput          : { height: 44, fontSize: 15, color: "#F5F5DC", backgroundColor: "#121620" },
    listView           : { backgroundColor: "#121620", borderRadius: 8, marginTop: 8 },
    row                : { backgroundColor: "#121620" },
    description        : { color: "#F5F5DC" },
    separator          : { backgroundColor: "#1A2332" },
  };

  /* ───────── hydrate when editing ───────── */
  useEffect(() => {
    if (addressParam && !once.current) {
      setAddressId(addressParam.id ?? null);
      setAddress(prev => ({
        ...prev,
        street  : addressParam.street   ?? "",
        floor   : addressParam.floor    ?? "",
        comments: addressParam.comments ?? "",
        type    : addressParam.type     ?? "home",
        city    : addressParam.city     ?? "",
        state   : addressParam.state    ?? "",
        zipCode : addressParam.zipCode  ?? "",
        country : addressParam.country  ?? "",
      }));

      if (addressParam.latitude && addressParam.longitude) {
        const { latitude, longitude } = addressParam;
        setMarker({ latitude, longitude });
        setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        gRef.current?.setAddressText(addressParam.street ?? "");
      }
      once.current = true;
    }
  }, [addressParam]);

  /* helper – keep text box & state aligned */
  const writeStreet = full => {
    gRef.current?.setAddressText(full);
    setAddress(prev => ({ ...prev, street: full }));
  };

  /* ---------- Google suggestion tapped ---------- */
  const onSuggestion = (data, details = null) => {
    console.log("🔥 onPress fired › ", data.description);     // <-- debug
    if (!details?.geometry) return;

    /* place geometry */
    const { lat, lng } = details.geometry.location;
    setMarker({ latitude: lat, longitude: lng });
    setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    mapR.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500,
    );

    /* address components */
    const comps = details.address_components || [];
    const get   = t => comps.find(c => c.types?.includes(t))?.long_name ?? "";
    const full  = details.formatted_address || data.description;

    setAddress(prev => ({
      ...prev,
      street : full,
      city   : get("locality"),
      state  : get("administrative_area_level_1"),
      zipCode: get("postal_code"),
      country: get("country"),
    }));
    gRef.current?.setAddressText(full); // reflect in UI
  };

  /* ---------- map interaction ---------- */
  const setCoords = async (lat, lng) => {
    setMarker({ latitude: lat, longitude: lng });
    setRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));

    try {
      const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
      const data = await res.json();
      const full = data.results?.[0]?.formatted_address ?? "";
      writeStreet(full);
    } catch (err) {
      console.error("reverse-geocode:", err);
    }
  };

  /* ---------- save to backend ---------- */
  const saveAddress = async () => {
    const payload = { user_id, ...address, latitude: marker.latitude, longitude: marker.longitude };
    try {
      if (addressId) {
        await axios.put(`${API_URL}/addresses/${addressId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/addresses`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      navigation.goBack();
    } catch (err) {
      console.error("saveAddress:", err);
      alert("Could not save the address.");
    }
  };

  /* ───────── UI ───────── */
  return (
    <SafeAreaView style={st.container} edges={["top"]}>
      {/* header */}
      <View style={st.header}>
        <TouchableOpacity onPress={navigation.goBack} style={st.backBtn}>
          <Icon name="arrow-left" size={24} color="#F5F5DC" />
        </TouchableOpacity>
        <Text style={st.hTitle}>{addressId ? "Edit address" : "Add address"}</Text>
      </View>

      {/* map */}
      <View style={st.mapBox}>
        <MapView
          ref={mapR}
          style={st.map}
          region={region}
          onPress={e => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setCoords(latitude, longitude);
          }}
        >
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={e => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setCoords(latitude, longitude);
            }}
          />
        </MapView>
      </View>

      {/* form */}
      <View style={st.content}>
        <View style={st.searchBox}>
          <GooglePlacesAutocomplete
            ref={gRef}
            placeholder="Address*"
            query={gQuery}
            fetchDetails             // <-- required for geometry
            keyboardShouldPersistTaps="handled"
            enablePoweredByContainer
            onPress={onSuggestion}
            styles={gStyles}
            textInputProps={{
              value: address.street,
              onChangeText: t => setAddress(prev => ({ ...prev, street: t })),
              placeholderTextColor: "#A0A0A0",
            }}
            {...GOOGLE_PROPS_FIX}
          />
        </View>

        <View style={st.form}>
          {/* floor / unit */}
          <View style={st.group}>
            <Text style={st.label}>Floor / Unit</Text>
            <TextInput
              style={st.input}
              value={address.floor}
              onChangeText={t => setAddress(prev => ({ ...prev, floor: t }))}
              placeholder="e.g. 3B"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          {/* comments */}
          <View style={st.group}>
            <Text style={st.label}>Comments</Text>
            <TextInput
              style={st.input}
              value={address.comments}
              onChangeText={t => setAddress(prev => ({ ...prev, comments: t }))}
              placeholder="Doorbell broken, call me"
              placeholderTextColor="#A0A0A0"
              multiline
            />
          </View>

          {/* type */}
          <View style={st.typeRow}>
            {["home", "work", "other"].map(t => (
              <TouchableOpacity
                key={t}
                style={[st.typeBtn, address.type === t && st.typeBtnActive]}
                onPress={() => setAddress(prev => ({ ...prev, type: t }))}
              >
                <Icon
                  name={t === "home" ? "home" : t === "work" ? "briefcase" : "map-marker"}
                  size={24}
                  color={address.type === t ? "#F5F5DC" : "#A0A0A0"}
                />
                <Text style={[st.typeTxt, address.type === t && st.typeTxtActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* save */}
          <TouchableOpacity style={st.saveBtn} onPress={saveAddress}>
            <Text style={st.saveTxt}>{addressId ? "Update" : "Save"} address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* styles ------------------------------------------------------------------- */
const st = StyleSheet.create({
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
  hTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5DC", marginLeft: 16 },
  backBtn: { padding: 4 },

  mapBox: { height: screenH * 0.35 },
  map: { flex: 1 },

  content: { flex: 1 },
  searchBox: {
    padding: 16,
    backgroundColor: "#0A0C10",
    borderBottomWidth: 1,
    borderBottomColor: "#1A2332",
  },

  form: { padding: 16 },
  group: { marginBottom: 16 },

  label: { fontSize: 14, color: "#F5F5DC", marginBottom: 8, fontWeight: "500" },
  input: {
    backgroundColor: "#121620",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#1A2332",
    color: "#F5F5DC",
  },

  typeRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 24 },
  typeBtn: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#121620",
    borderWidth: 1,
    borderColor: "#1A2332",
  },
  typeBtnActive: { backgroundColor: "#1A2332", borderColor: "#F5F5DC" },
  typeTxt: { marginTop: 4, fontSize: 12, color: "#A0A0A0", fontWeight: "500" },
  typeTxtActive: { color: "#F5F5DC", fontWeight: "600" },

  saveBtn: { backgroundColor: "#F5F5DC", borderRadius: 8, padding: 16, alignItems: "center" },
  saveTxt: { color: "#0A0C10", fontSize: 16, fontWeight: "600" },
});
