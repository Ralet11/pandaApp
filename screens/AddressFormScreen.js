import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '@env';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function ConfirmAddressMap({
  visible,
  onClose,
  defaultLat,
  defaultLng,
  onConfirm,
}) {
  // Región inicial y marcador
  const [region, setRegion] = useState({
    latitude: defaultLat || 37.78825,
    longitude: defaultLng || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerCoords, setMarkerCoords] = useState({
    latitude: defaultLat || 37.78825,
    longitude: defaultLng || -122.4324,
  });

  // Dirección que obtenemos desde las coordenadas
  const [currentAddress, setCurrentAddress] = useState('');

  // Manejo del modal para detalles adicionales
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');

  const googlePlacesRef = useRef(null);

  useEffect(() => {
    // Al montar o cambiar coords, obtenemos la dirección
    fetchAddressFromCoords(markerCoords.latitude, markerCoords.longitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para obtener dirección a partir de lat/lng usando la Geocoding API de Google
  const fetchAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setCurrentAddress(address);
      }
    } catch (error) {
      console.error('Error al obtener la dirección:', error);
    }
  };

  // Cada vez que el usuario mueve el marcador o hace tap en el mapa
  const updateMarkerAndAddress = async (latitude, longitude) => {
    setMarkerCoords({ latitude, longitude });
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));

    // Obtenemos la dirección usando Google
    await fetchAddressFromCoords(latitude, longitude);

    // Si quisieras actualizar el texto del Autocomplete
    if (googlePlacesRef.current) {
      googlePlacesRef.current.setAddressText('');
    }
  };

  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateMarkerAndAddress(latitude, longitude);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateMarkerAndAddress(latitude, longitude);
  };

  // Cuando se presiona "Confirmar Ubicación"
  const handleConfirm = () => {
    // Abrimos el modal para detalles adicionales
    setDetailsModalVisible(true);
  };

  // Guardar los detalles y cerrar
  const handleSaveDetails = () => {
    // Enviamos todo al padre
    onConfirm({
      latitude: markerCoords.latitude,
      longitude: markerCoords.longitude,
      address: currentAddress || 'Sin dirección',
      additionalDetails: additionalDetails.trim() || 'Sin detalles',
    });
    setDetailsModalVisible(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.mapContainer}>
          {/* Barra de búsqueda de direcciones */}
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder="Buscar dirección"
            fetchDetails
            minLength={2}
            debounce={300}
            onPress={(data, details = null) => {
              if (details && details.geometry) {
                const { lat, lng } = details.geometry.location;
                updateMarkerAndAddress(lat, lng);
              }
            }}
            query={{
              key: GOOGLE_API_KEY,
              language: 'es',
            }}
            styles={{
              container: {
                position: 'absolute',
                width: '90%',
                top: 10,
                alignSelf: 'center',
                zIndex: 9999,
              },
              textInputContainer: {
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ccc',
              },
              textInput: {
                height: 40,
                paddingHorizontal: 10,
                backgroundColor: '#fff',
              },
              listView: {
                backgroundColor: '#fff',
              },
            }}
          />

          {/* Mapa con el marcador */}
          <MapView
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

          {/* Botón de Confirmar Ubicación */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirmar Ubicación</Text>
          </TouchableOpacity>
        </View>

        {/* Modal para los detalles adicionales */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.detailsModal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalles adicionales</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="Ej: Número de departamento, instrucciones..."
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                <Text style={styles.saveButtonText}>
                  {additionalDetails.trim() ? 'Guardar' : 'Sin detalles'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  mapContainer: {
    flex: 1,
    marginTop: 80,
    backgroundColor: '#fff',
  },
  map: {
    width: screenWidth,
    height: screenHeight,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#6D28D9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: screenWidth * 0.9,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#6D28D9',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
