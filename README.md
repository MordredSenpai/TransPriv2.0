# TransPriv - Gestión de Transporte Particular

Aplicación móvil multiplataforma (iOS y Android) desarrollada en React Native (Expo) para la gestión y seguimiento de transportes particulares en tiempo real.

## Stack Tecnológico
- **Frontend:** React Native (Expo)
- **Backend & Base de Datos:** Firebase (Auth, Cloud Firestore)
- **Navegación:** React Navigation
- **Mapas y Geolocalización:** Google Maps SDK, Expo Location
- **Notificaciones:** Expo Notifications

## Características Principales
- Autenticación segura (Email/Contraseña y Biometría vía Face ID/Huella).
- Gestión completa de boletos y gastos (CRUD).
- Mapas interactivos con selección de origen y destino.
- Seguimiento de rutas en tiempo real con cálculo de distancia y ETA.
- Sincronización y persistencia offline con Firestore.
- Notificaciones push integradas.

## Configuración del Proyecto

### 1. Instalación
npm install

### 2. Variables de Entorno y APIs
Configura tus credenciales de Firebase en el archivo firebaseConfig.js en la raíz del proyecto:

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

Para habilitar los mapas en Android, añade tu API Key de Google Maps en app.json:

"react-native-maps": {
  "googleMapsApiKey": "TU_API_KEY"
}
(Nota: iOS utiliza MapKit por defecto y no requiere API Key adicional).

### 3. Estructura de Base de Datos (Firestore)
La aplicación requiere las siguientes colecciones principales. Asegúrate de crear índices compuestos en Firebase Console para optimizar las consultas:

- users: uid, email, role, expoPushToken.
- boletos: userId, origin, destination, status. (Índice compuesto: userId [Asc], createdAt [Desc])
- gastos: userId, amount, status. (Índice compuesto: userId [Asc], createdAt [Desc])

## Personalización de Rutas
Las rutas de transporte predefinidas se configuran en el archivo config/rutas.js. Puedes modificarlas agregando tus propias paradas utilizando coordenadas decimales:

export const RUTAS_PREDEFINIDAS = [
  {
    id: 'ruta1',
    nombre: 'Ruta Norte-Sur',
    color: '#007AFF',
    paradas: [
      { id: 'p1', nombre: 'Parada Inicial', coordenadas: { latitude: 0.00, longitude: 0.00 } }
    ]
  }
];

## Ejecución
npm start       # Inicia el servidor de desarrollo de Expo
npm run android # Compila y ejecuta en Android
npm run ios     # Compila y ejecuta en iOS

## Estructura Principal del Proyecto
transpriv-app/
├── App.js                 # Componente raíz
├── firebaseConfig.js      # Inicialización de servicios de Firebase
├── screens/               # Vistas principales (Auth, Mapas, Perfil, etc.)
├── navigation/            # Configuración de Stacks y Tabs
├── contexts/              # Estados globales (ej. AuthContext)
├── config/                # Constantes y configuración estática (rutas.js)
└── utils/                 # Funciones de ayuda (Notificaciones, Cálculo de rutas)
