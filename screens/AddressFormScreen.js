/* ─────────────────────── ConfirmAddressMap.jsx ─────────────────────── */
"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native"
import MapView, { Marker } from "react-native-maps"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import { GOOGLE_API_KEY } from "@env"

/* same props-fix helper ------------------------------------------------ */
const GOOGLE_PROPS_FIX = {
  minLength:                     2,
  timeout:                       1000,
  debounce:                      300,
  fetchDetails:                  true,
  enablePoweredByContainer:      true,
  nearbyPlacesAPI:               "GooglePlacesSearch",
  predefinedPlaces:              [],
  predefinedPlacesAlwaysVisible: false,
  textInputProps:                {},
  filterResults: (results = []) => results.filter(r => Array.isArray(r?.types)),
}

/* --------------------------------------------------------------------- */
const screenWidth  = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height

export default function ConfirmAddressMap({
  visible,
  onClose,
  defaultLat,
  defaultLng,
  onConfirm,
}) {
  /* ---------- state ---------- */
  const [region, setRegion] = useState({
    latitude:       defaultLat || 37.78825,
    longitude:      defaultLng || -122.4324,
    latitudeDelta:  0.01,
    longitudeDelta: 0.01,
  })
  const [markerCoords, setMarkerCoords] = useState({
    latitude:  defaultLat || 37.78825,
    longitude: defaultLng || -122.4324,
  })
  const [currentAddress,      setCurrentAddress]      = useState("")
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [additionalDetails,   setAdditionalDetails]   = useState("")

  const googlePlacesRef = useRef(null)
  const mapRef          = useRef(null)

  /* ---------- Google query ---------- */
  const googleQuery = useMemo(() => ({
    key: GOOGLE_API_KEY,
    language: "en",
    types: [],
  }), [])

  /* ---------- fetch initial address ---------- */
  useEffect(() => {
    fetchAddressFromCoords(markerCoords.latitude, markerCoords.longitude)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`,
      )
      const data = await res.json()
      if (data.results?.length) {
        const txt = data.results[0].formatted_address
        setCurrentAddress(txt)
        googlePlacesRef.current?.setAddressText(txt)
      }
    } catch (err) {
      console.error("reverse geocode:", err)
    }
  }

  /* ---------- helpers ---------- */
  const updateCoords = async (lat, lng) => {
    setMarkerCoords({ latitude: lat, longitude: lng })
    setRegion(prev => ({ ...prev, latitude: lat, longitude: lng }))

    await fetchAddressFromCoords(lat, lng)
  }

  /* ---------- map handlers ---------- */
  const handleDragEnd  = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    updateCoords(latitude, longitude)
  }
  const handleMapPress = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    updateCoords(latitude, longitude)
  }

  /* ---------- flow ---------- */
  const handleConfirm = () => setDetailsModalVisible(true)

  const handleSaveDetails = () => {
    onConfirm({
      latitude:          markerCoords.latitude,
      longitude:         markerCoords.longitude,
      address:           currentAddress || "Unknown address",
      additionalDetails: additionalDetails.trim() || "No details",
    })
    setDetailsModalVisible(false)
    onClose()
  }

  /* ---------- UI ---------- */
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.mapContainer}>
          {/* Autocomplete */}
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder="Search address"
            query={googleQuery}
            onPress={(data, details = null) => {
              if (details?.geometry) {
                const { lat, lng } = details.geometry.location
                updateCoords(lat, lng)
              }
            }}
            styles={gStyles}
            {...GOOGLE_PROPS_FIX}
          />

          {/* Map */}
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={markerCoords}
              draggable
              onDragEnd={handleDragEnd}
            />
          </MapView>

          {/* Confirm btn */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm location</Text>
          </TouchableOpacity>
        </View>

        {/* Extra details modal */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.detailsModal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Additional details</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="e.g. apt. number, instructions…"
                placeholderTextColor="#A0A0A0"
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                <Text style={styles.saveButtonText}>
                  {additionalDetails.trim() ? "Save" : "Skip"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  modalOverlay:{ flex:1, backgroundColor:"rgba(10,12,16,0.9)" },
  mapContainer:{ flex:1, marginTop:80, backgroundColor:"#0A0C10" },
  map:{ width:screenWidth, height:screenHeight },
  confirmButton:{
    position:"absolute", bottom:40, left:20, right:20,
    backgroundColor:"#F5F5DC", borderRadius:8, padding:16, alignItems:"center",
  },
  confirmText:{ color:"#0A0C10", fontWeight:"600", fontSize:15 },

  detailsModal:{
    flex:1, justifyContent:"center", alignItems:"center", padding:20,
    backgroundColor:"rgba(10,12,16,0.9)",
  },
  modalContent:{
    width:screenWidth*0.9, backgroundColor:"#121620",
    borderRadius:16, padding:24, alignItems:"center",
  },
  modalTitle:{
    fontSize:18, fontWeight:"700", color:"#F5F5DC",
    marginBottom:20, textAlign:"center",
  },
  detailsInput:{
    width:"100%", height:50, backgroundColor:"#0A0C10",
    paddingHorizontal:15, borderRadius:8,
    borderWidth:1, borderColor:"#1A2332",
    marginBottom:20, fontSize:16, color:"#F5F5DC",
  },
  saveButton:{
    backgroundColor:"#F5F5DC", paddingVertical:14,
    paddingHorizontal:25, borderRadius:8, width:"100%", alignItems:"center",
  },
  saveButtonText:{ color:"#0A0C10", fontWeight:"600", fontSize:15 },
})

/* dark theme for autocomplete */
const gStyles = {
  container:{ position:"absolute", width:"90%", top:10, alignSelf:"center", zIndex:9999 },
  textInputContainer:{
    backgroundColor:"#121620",
    borderRadius:8, borderWidth:1, borderColor:"#1A2332",
  },
  textInput:{
    height:40, paddingHorizontal:12,
    backgroundColor:"#121620", color:"#F5F5DC", fontSize:14,
  },
  listView:{ backgroundColor:"#121620", borderRadius:8, marginTop:2 },
  row:{ backgroundColor:"#121620", padding:12,
        borderBottomWidth:1, borderBottomColor:"#1A2332" },
  description:{ color:"#F5F5DC", fontSize:14 },
  predefinedPlacesDescription:{ color:"#A0A0A0" },
}
