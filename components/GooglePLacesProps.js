export const GOOGLE_PROPS_FIX = {
  minLength:                2,
  timeout:                  1000,
  debounce:                 300,
  fetchDetails:             true,
  nearbyPlacesAPI:          'GooglePlacesSearch',
  enablePoweredByContainer: true,
  predefinedPlaces:         [],
  predefinedPlacesAlwaysVisible: false,
  textInputProps:           {},      // evita otro undefined
  filterResults: (results = []) =>
    results.filter(r => Array.isArray(r?.types)),
}