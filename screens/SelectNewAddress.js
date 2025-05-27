import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import axios from 'react-native-axios';
import { useSelector } from 'react-redux';
import { GOOGLE_API_KEY, API_URL } from '@env';
console.log(GOOGLE_API_KEY)

const SelectNewAddress = ({ navigation, route }) => {
  const { addressParam } = route.params || {};
  const token = useSelector((state) => state.user.userInfo.token);
  const user_id = useSelector((state) => state.user.userInfo.id);
  const [addressId, setAddressId] = useState(null);

  // Estado para los campos de dirección
  const [address, setAddress] = useState({
    street: '',
    floor: '',
    comments: '',
    type: 'home',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const [region, setRegion] = useState({
    latitude: -34.603722,
    longitude: -58.381592,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerCoords, setMarkerCoords] = useState({
    latitude: -34.603722,
    longitude: -58.381592,
  });

  const googlePlacesRef = useRef(null);
  const mapRef = useRef(null);
  const hasAddressParamBeenHandled = useRef(false);

  const googleQuery = useMemo(() => {
    return {
      key: GOOGLE_API_KEY,
      language: 'es',
    };
  }, [GOOGLE_API_KEY]);

  const googleStyles = useMemo(
    () => ({
      container: { flex: 0 },
      textInputContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
      },
      textInput: {
        height: 44,
        fontSize: 15,
        backgroundColor: '#f5f5f5',
      },
      listView: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 8,
      },
    }),
    []
  );

  useEffect(() => {
    if (addressParam && !hasAddressParamBeenHandled.current) {
      setAddressId(addressParam.id);
      setAddress((prev) => ({
        ...prev,
        street: addressParam.street || '',
        floor: addressParam.floor || '',
        comments: addressParam.comments || '',
        type: addressParam.type || 'home',
        city: addressParam.city || '',
        state: addressParam.state || '',
        zipCode: addressParam.zipCode || '',
        country: addressParam.country || '',
      }));

      if (addressParam.latitude && addressParam.longitude) {
        setMarkerCoords({
          latitude: addressParam.latitude,
          longitude: addressParam.longitude,
        });
        setRegion({
          latitude: addressParam.latitude,
          longitude: addressParam.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
      hasAddressParamBeenHandled.current = true;
    }
  }, [addressParam]);

  const handlePlaceSelect = (data, details) => {
    if (details && details.geometry) {
      const { lat, lng } = details.geometry.location;
      const addressComponents = details.address_components;

      // Helper para obtener valores de address_components
      const getComponent = (type) =>
        addressComponents.find((component) => component.types.includes(type))?.long_name || '';

      const city = getComponent('locality');
      const state = getComponent('administrative_area_level_1');
      const zipCode = getComponent('postal_code');
      const country = getComponent('country');

      setMarkerCoords({ latitude: lat, longitude: lng });
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Actualizamos el estado con los valores obtenidos
      setAddress((prev) => ({
        ...prev,
        street: details.formatted_address || data.description,
        city,
        state,
        zipCode: zipCode || '',
        country,
      }));

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoords({ latitude, longitude });
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
  };

  const handleSaveAddress = async () => {
    const data = {
      user_id,
      street: address.street,
      floor: address.floor,
      comments: address.comments,
      type: address.type,
      latitude: markerCoords.latitude,
      longitude: markerCoords.longitude,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    };

    try {
      if (addressId) {
        await axios.put(`${API_URL}/user/updateAddress/${addressId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Dirección actualizada');
      } else {
        await axios.post(`${API_URL}/user/addAddress`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Dirección guardada');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar la dirección:', error);
      alert('Hubo un problema al guardar la dirección.');
    }
  };

  const AddressTypeButton = ({ type, icon, label }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        address.type === type && styles.typeButtonActive,
      ]}
      onPress={() => setAddress((prev) => ({ ...prev, type }))}
    >
      <Icon
        name={icon}
        size={24}
        color={address.type === type ? '#D32F2F' : '#666'}
      />
      <Text
        style={[
          styles.typeButtonText,
          address.type === type && styles.typeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {addressId ? 'Editar dirección' : 'Agregar nueva dirección'}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
        >
          <Marker coordinate={markerCoords} />
        </MapView>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder="Dirección*"
            fetchDetails
            minLength={2}
            debounce={300}
            query={googleQuery}
            onPress={handlePlaceSelect}
            styles={googleStyles}
            textInputProps={{
              value: address.street,
              onChangeText: (text) =>
                setAddress((prev) => ({ ...prev, street: text })),
            }}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Piso / Depto</Text>
            <TextInput
              style={styles.input}
              value={address.floor}
              onChangeText={(text) =>
                setAddress((prev) => ({ ...prev, floor: text }))
              }
              placeholder="Ej: 3B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comentarios</Text>
            <TextInput
              style={styles.input}
              value={address.comments}
              onChangeText={(text) =>
                setAddress((prev) => ({ ...prev, comments: text }))
              }
              placeholder="Ej: No anda el timbre, llamar"
              multiline
            />
          </View>

          <View style={styles.typeContainer}>
            <AddressTypeButton type="home" icon="home" label="Casa" />
            <AddressTypeButton type="work" icon="briefcase" label="Trabajo" />
            <AddressTypeButton type="other" icon="map-marker" label="Otro" />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
            <Text style={styles.saveButtonText}>
              {addressId ? 'Actualizar dirección' : 'Guardar dirección'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SelectNewAddress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#D32F2F', // Cambiado a rojo para consistencia
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF', // Texto en blanco
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.35,
  },
  map: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 44,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: '#F7F2FF',
  },
  typeButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#D32F2F', // Activo en rojo
  },
  saveButton: {
    backgroundColor: '#D32F2F', // Botón de guardar en rojo
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
