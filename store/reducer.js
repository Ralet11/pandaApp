import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importa tus slices
import userReducer from './slices/user.slice';
import cartReducer from './slices/cart.slice';

import orderReducer from './slices/order.slice';

// Configuración de persistencia
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'cart', 'shops', 'order'], // Si quieres persistir algún estado específico, agrega aquí el slice
};

// Combina todos los reducers
const appReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  order: orderReducer,
});

// Root reducer con lógica para logout
const rootReducer = (state, action) => {
  if (action.type === 'user/logout') {
    state = undefined; // Reinicia todo el estado al desloguear
  }
  return appReducer(state, action);
};

// Reducer persistido
const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;
