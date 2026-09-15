// screens/TrackingScreen.js
// Pantalla para seguir la ruta en tiempo real
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRouteDirections } from '../utils/directions';

export default function TrackingScreen({ route, navigation }) {
  const { origin, destination, boletoId } = route.params || {};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (origin && destination) {
      loadRoute();
    }
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const loadRoute = async () => {
    try {
      setLoading(true);
      const coordinates = await getRouteDirections(
        origin.coordenadas,
        destination.coordenadas
      );
      setRouteCoordinates(coordinates);
      
      // Obtener ubicación inicial
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error al cargar la ruta:', error);
      Alert.alert('Error', 'No se pudo cargar la ruta');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para el seguimiento');
        return;
      }

      setIsTracking(true);

      // Configurar seguimiento de ubicación en tiempo real
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // O cada 10 metros
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLocation);

          // Centrar el mapa en la ubicación actual
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }

          // Calcular distancia restante (simplificado)
          if (destination && destination.coordenadas) {
            const distance = calculateDistance(
              newLocation,
              destination.coordenadas
            );
            setDistanceRemaining(distance);
          }
        }
      );
    } catch (error) {
      console.error('Error al iniciar seguimiento:', error);
      Alert.alert('Error', 'No se pudo iniciar el seguimiento');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando ruta...</Text>
      </View>
    );
  }

  if (!origin || !destination) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró la información de la ruta</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={MapView.PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={isTracking}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: origin.coordenadas.latitude,
          longitude: origin.coordenadas.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Ruta completa */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marcador de origen */}
        <Marker
          coordinate={origin.coordenadas}
          title="Origen"
          description={origin.nombre}
          pinColor="#34C759"
        />

        {/* Marcador de destino */}
        <Marker
          coordinate={destination.coordenadas}
          title="Destino"
          description={destination.nombre}
          pinColor="#FF3B30"
        />

        {/* Ubicación actual si está disponible */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Tu ubicación"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      {/* Panel de control */}
      <View style={styles.controlPanel}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Seguimiento de Ruta</Text>
          {distanceRemaining !== null && (
            <Text style={styles.distanceText}>
              Distancia restante: {formatDistance(distanceRemaining)}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startTracking}
            >
              <Text style={styles.buttonText}>▶ Comenzar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopTracking}
            >
              <Text style={styles.buttonText}> Detener</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  distanceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

