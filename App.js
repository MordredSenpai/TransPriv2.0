// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './utils/notifications';

// Componente interno que usa el contexto de autenticación
function AppContent() {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Registrar para notificaciones push cuando el usuario inicia sesión
    if (user) {
      registerForPushNotificationsAsync().catch(console.error);

      // Configurar listeners de notificaciones
      // Listener para cuando se recibe una notificación
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      // Listener para cuando el usuario toca una notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    }

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

// Componente principal de la app
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}
