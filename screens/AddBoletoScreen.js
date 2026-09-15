// screens/AddBoletoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { calcularTarifaBoleto } from '../config/rutas';

export default function AddBoletoScreen({ navigation, route }) {
  const routeParams = route?.params || {};
  const [origin, setOrigin] = useState(routeParams.origin || null);
  const [destination, setDestination] = useState(routeParams.destination || null);
  const [loading, setLoading] = useState(false);

  // Si no hay origen o destino, abrir el mapa automáticamente
  useEffect(() => {
    if (!origin || !destination) {
      const timer = setTimeout(() => {
        handleSelectRoute();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelectRoute = () => {
    // Navegar a la pantalla de mapa para seleccionar origen y destino
    navigation.navigate('Map', {
      onSelectOrigin: (parada) => {
        setOrigin(parada);
      },
      onSelectDestination: (parada) => {
        setDestination(parada);
      },
      selectedOrigin: origin,
      selectedDestination: destination
    });
  };

  const handleSave = async () => {
    // Validaciones
    if (!origin) {
      Alert.alert('Error', 'Por favor, selecciona un origen');
      return;
    }

    if (!destination) {
      Alert.alert('Error', 'Por favor, selecciona un destino');
      return;
    }

    if (origin.id === destination.id) {
      Alert.alert('Error', 'El origen y destino deben ser diferentes');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      // Calcular la tarifa del boleto
      const tarifa = calcularTarifaBoleto(origin, destination);

      // Agregar boleto a Firestore con información de geolocalización
      const boletoData = {
        userId: user.uid,
        origin: {
          id: origin.id,
          nombre: origin.nombre,
          coordenadas: origin.coordenadas,
          rutaId: origin.rutaId || null,
          rutaNombre: origin.rutaNombre || null
        },
        destination: {
          id: destination.id,
          nombre: destination.nombre,
          coordenadas: destination.coordenadas,
          rutaId: destination.rutaId || null,
          rutaNombre: destination.rutaNombre || null
        },
        tarifa: tarifa,
        status: 'en_camino',
        createdAt: serverTimestamp()
      };

      // Eliminar campos undefined para evitar errores de Firebase
      Object.keys(boletoData).forEach(key => {
        if (boletoData[key] === undefined) {
          delete boletoData[key];
        }
      });

      if (boletoData.origin.rutaId === null) delete boletoData.origin.rutaId;
      if (boletoData.origin.rutaNombre === null) delete boletoData.origin.rutaNombre;
      if (boletoData.destination.rutaId === null) delete boletoData.destination.rutaId;
      if (boletoData.destination.rutaNombre === null) delete boletoData.destination.rutaNombre;

      // Crear gasto automáticamente asociado al boleto
      const gastoData = {
        userId: user.uid,
        description: `Boleto: ${origin.nombre} → ${destination.nombre}`,
        amount: tarifa,
        tipo: 'boleto',
        createdAt: serverTimestamp()
      };

      const gastoRef = await addDoc(collection(db, 'gastos'), gastoData);
      
      // Agregar boleto con referencia al gasto
      const boletoRef = await addDoc(collection(db, 'boletos'), {
        ...boletoData,
        gastoId: gastoRef.id
      });

      Alert.alert(
        'Éxito', 
        `Boleto agregado correctamente. Gasto de $${tarifa.toFixed(2)} MXN registrado automáticamente.`,
        [
          {
            text: 'Comenzar Viaje',
            onPress: () => {
              // Navegar a la pantalla de seguimiento
              navigation.navigate('Tracking', {
                origin: origin,
                destination: destination,
                boletoId: boletoRef.id
              });
            }
          },
          {
            text: 'Ver Gastos',
            style: 'cancel',
            onPress: () => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate('Gastos');
              }, 500);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al agregar boleto:', error);
      Alert.alert('Error', 'Error al agregar el boleto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Ruta Seleccionada</Text>
          
          {origin && destination ? (
            <>
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoLabel}>Origen:</Text>
                <Text style={styles.routeInfoText}>{origin.nombre}</Text>
                {origin.rutaNombre && (
                  <Text style={styles.routeInfoSubtext}>{origin.rutaNombre}</Text>
                )}
              </View>

              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoLabel}>Destino:</Text>
                <Text style={styles.routeInfoText}>{destination.nombre}</Text>
                {destination.rutaNombre && (
                  <Text style={styles.routeInfoSubtext}>{destination.rutaNombre}</Text>
                )}
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Precio:</Text>
                <Text style={styles.priceValue}>
                  ${calcularTarifaBoleto(origin, destination).toFixed(2)} MXN
                </Text>
              </View>

              <TouchableOpacity
                style={styles.routeButton}
                onPress={handleSelectRoute}
              >
                <Text style={styles.routeButtonText}>Cambiar Ruta</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.routeButton}
              onPress={handleSelectRoute}
            >
              <Text style={styles.routeButtonText}>Seleccionar Ruta</Text>
            </TouchableOpacity>
          )}

          {origin && destination && (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Guardar Boleto'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  priceContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  routeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  routeInfoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  routeInfoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  routeInfoSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  button: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
