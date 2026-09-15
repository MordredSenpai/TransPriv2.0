// screens/BoletosScreen.js
// Esta pantalla ahora muestra directamente el mapa para seleccionar ruta
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

export default function BoletosScreen({ navigation }) {
  // Navegar directamente al mapa cuando se carga la pantalla
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Map');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Mientras tanto, mostrar loading
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
