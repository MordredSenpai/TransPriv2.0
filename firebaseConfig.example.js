// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ¡¡¡REEMPLAZAR CON TUS PROPIAS CREDENCIALES DE FIREBASE!!!
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_AUTH_DOMAIN_AQUI",
  projectId: "TU_PROJECT_ID_AQUI",
  storageBucket: "TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
  appId: "TU_APP_ID_AQUI"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar Auth con persistencia en React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Firestore
const db = getFirestore(app);

// Habilitar la persistencia offline
// Esto guardará los datos en caché para usarlos sin conexión.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Múltiples pestañas abiertas, la persistencia puede fallar.");
    } else if (err.code == 'unimplemented') {
      console.log("El navegador no soporta persistencia.");
    }
  });

export { auth, db };

