// screens/MapScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { RUTAS_PREDEFINIDAS, getAllParadas, getCentroMapa } from '../config/rutas';
import { getRouteDirections, getRouteInfo } from '../utils/directions';

export default function MapScreen({ route, navigation }) {
  const { onSelectOrigin, onSelectDestination, selectedOrigin, selectedDestination } = route.params || {};
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState(selectedOrigin || null);
  const [destination, setDestination] = useState(selectedDestination || null);
  const [showParadasModal, setShowParadasModal] = useState(false);
  const [selectingMode, setSelectingMode] = useState(null); // 'origin' o 'destination'
  const [paradas] = useState(getAllParadas());
  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    getLocationAsync();
    initializeMap();
  }, []);

  // Obtener la ruta cuando se selecciona origen y destino
  useEffect(() => {
    if (origin && destination) {
      fetchRoute();
    } else {
      setRouteCoordinates([]);
      setRouteInfo(null);
    }
  }, [origin, destination]);

  const fetchRoute = async () => {
    if (!origin || !destination) return;
    
    setLoadingRoute(true);
    try {
      // Obtener coordenadas de la ruta
      const coordinates = await getRouteDirections(
        origin.coordenadas,
        destination.coordenadas
      );
      setRouteCoordinates(coordinates);

      // Obtener información adicional (distancia, duración)
      const info = await getRouteInfo(
        origin.coordenadas,
        destination.coordenadas
      );
      setRouteInfo(info);

      // Ajustar el mapa para mostrar toda la ruta
      if (coordinates.length > 0) {
        const latitudes = coordinates.map(c => c.latitude);
        const longitudes = coordinates.map(c => c.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        const latDelta = (maxLat - minLat) * 1.5; // Agregar padding
        const lngDelta = (maxLng - minLng) * 1.5;
        
        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(latDelta, 0.01),
          longitudeDelta: Math.max(lngDelta, 0.01),
        });
      }
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
      // Si falla, usar línea recta como fallback
      setRouteCoordinates([
        origin.coordenadas,
        destination.coordenadas
      ]);
    } finally {
      setLoadingRoute(false);
    }
  };

  const initializeMap = () => {
    const centro = getCentroMapa();
    setMapRegion({
      latitude: centro.latitude,
      longitude: centro.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  };

  const getLocationAsync = async () => {
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'Necesitamos acceso a tu ubicación para mostrarte las rutas cercanas.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Centrar el mapa en la ubicación actual
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setLoading(false);
    }
  };

  const handleParadaSelect = (parada) => {
    if (selectingMode === 'origin') {
      setOrigin(parada);
      if (onSelectOrigin) {
        onSelectOrigin(parada);
      }
    } else if (selectingMode === 'destination') {
      setDestination(parada);
      if (onSelectDestination) {
        onSelectDestination(parada);
      }
      // Si ya hay origen y destino, navegar a AddBoleto
      if (origin && parada) {
        setShowParadasModal(false);
        setSelectingMode(null);
        navigation.navigate('AddBoleto', {
          origin: origin,
          destination: parada
        });
        return;
      }
    }
    setShowParadasModal(false);
    setSelectingMode(null);
  };

  const handleSelectOrigin = () => {
    setSelectingMode('origin');
    setShowParadasModal(true);
  };

  const handleSelectDestination = () => {
    setSelectingMode('destination');
    setShowParadasModal(true);
  };

  const handleConfirmSelection = () => {
    if (origin && destination) {
      if (onSelectOrigin) onSelectOrigin(origin);
      if (onSelectDestination) onSelectDestination(destination);
      // Navegar a AddBoleto con los datos seleccionados
      navigation.navigate('AddBoleto', {
        origin: origin,
        destination: destination
      });
    } else {
      Alert.alert('Error', 'Por favor, selecciona origen y destino');
    }
  };


  const renderRutas = () => {
    if (!Polyline) return null;
    return RUTAS_PREDEFINIDAS.map((ruta) => {
      const coordinates = ruta.paradas.map(p => p.coordenadas);
      return (
        <Polyline
          key={ruta.id}
          coordinates={coordinates}
          strokeColor={ruta.color}
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
      );
    });
  };

  const renderParadas = () => {
    if (!Marker) return null;
    return paradas.map((parada) => (
      <Marker
        key={parada.id}
        coordinate={parada.coordenadas}
        title={parada.nombre}
        description={parada.rutaNombre}
        pinColor={parada.rutaColor}
      />
    ));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {MapView ? (
        <MapView
          style={styles.map}
          provider={MapView.PROVIDER_GOOGLE}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={false}
        >
          {renderRutas()}
          {renderParadas()}

          {/* Línea de ruta entre origen y destino usando Google Directions API */}
          {origin && destination && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#007AFF"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {origin && (
            <Marker
              coordinate={origin.coordenadas}
              title="Origen"
              description={origin.nombre}
              pinColor="#34C759"
            />
          )}

          {destination && (
            <Marker
              coordinate={destination.coordenadas}
              title="Destino"
              description={destination.nombre}
              pinColor="#FF3B30"
            />
          )}
        </MapView>
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No se pudo cargar el mapa. Verifica la instalación de react-native-maps.
        </Text>
      )}

      {/* Panel de controles */}
      <View style={styles.controlsContainer}>
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[styles.selectorButton, origin && styles.selectorButtonActive]}
            onPress={handleSelectOrigin}
          >
            <Text style={styles.selectorButtonText}>
              {origin ? `Origen: ${origin.nombre}` : 'Seleccionar Origen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectorButton, destination && styles.selectorButtonActive]}
            onPress={handleSelectDestination}
          >
            <Text style={styles.selectorButtonText}>
              {destination ? `Destino: ${destination.nombre}` : 'Seleccionar Destino'}
            </Text>
          </TouchableOpacity>
        </View>

        {origin && destination && (
          <>
            {loadingRoute && (
              <View style={styles.routeInfoContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.routeInfoText}>Calculando ruta...</Text>
              </View>
            )}
            {routeInfo && !loadingRoute && (
              <View style={styles.routeInfoContainer}>
                <Text style={styles.routeInfoText}>
                   {routeInfo.distance} • {routeInfo.duration}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.confirmButton, loadingRoute && styles.confirmButtonDisabled]}
              onPress={handleConfirmSelection}
              disabled={loadingRoute}
            >
              <Text style={styles.confirmButtonText}>Confirmar Selección</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modal de selección de paradas */}
      <Modal
        visible={showParadasModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowParadasModal(false);
          setSelectingMode(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Seleccionar {selectingMode === 'origin' ? 'Origen' : 'Destino'}
            </Text>
            <ScrollView style={styles.paradasList}>
              {RUTAS_PREDEFINIDAS.map((ruta) => (
                <View key={ruta.id} style={styles.rutaSection}>
                  <Text style={[styles.rutaTitle, { color: ruta.color }]}>
                    {ruta.nombre}
                  </Text>
                  {ruta.paradas.map((parada) => (
                    <TouchableOpacity
                      key={parada.id}
                      style={styles.paradaItem}
                      onPress={() => handleParadaSelect(parada)}
                    >
                      <View
                        style={[styles.paradaMarker, { backgroundColor: ruta.color }]}
                      />
                      <Text style={styles.paradaName}>{parada.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowParadasModal(false);
                setSelectingMode(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
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
  selectorContainer: {
    marginBottom: 10,
  },
  selectorButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectorButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  routeInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  paradasList: {
    maxHeight: 400,
  },
  rutaSection: {
    marginBottom: 20,
  },
  rutaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paradaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  paradaMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  paradaName: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

