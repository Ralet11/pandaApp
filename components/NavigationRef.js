import { createNavigationContainerRef } from "@react-navigation/native";

/* Ref global que usaremos desde cualquier parte de la app */
export const navigationRef = createNavigationContainerRef();

/* Helper opcional para navegar sin repetir el isReady() */
export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};