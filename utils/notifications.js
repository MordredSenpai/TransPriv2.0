// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Configurar el comportamiento de las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra el dispositivo para recibir notificaciones push
 * Obtiene el token de Expo Push y lo guarda en Firestore
 */
export async function registerForPushNotificationsAsync() {
  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    // Ignorar errores de configuración de notificaciones (FCM no configurado)
    console.log('Notificaciones push no disponibles:', error.message);
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Guardar el token en Firestore en el documento del usuario
    const user = auth.currentUser;
    if (user) {
      try {
        // Actualizar o crear el documento del usuario con el token
        // Usamos setDoc con merge para actualizar solo el token sin sobrescribir otros campos
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            expoPushToken: token,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error al guardar el token de notificación:', error);
      }
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}


