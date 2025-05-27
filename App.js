// App.js
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';


import RootNavigator from './navigation'; // tu stack/tab navigator
import { store, persistor } from './store/store';
import { STRIPE_PUBLISHABLE_KEY } from '@env';

export default function App() {
  return (
    <Provider store={store}>
 
        <PersistGate loading={null} persistor={persistor}>
    
            <RootNavigator />
     
        </PersistGate>

    </Provider>
  );
}
