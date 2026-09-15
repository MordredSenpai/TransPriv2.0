// utils/directions.js
// Servicio para obtener rutas de Google Directions API

const GOOGLE_MAPS_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con tu propia API Key de Google Maps
const DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Obtiene la ruta entre dos puntos usando Google Directions API
 * @param {Object} origin - Coordenadas de origen {latitude, longitude}
 * @param {Object} destination - Coordenadas de destino {latitude, longitude}
 * @returns {Promise<Array>} Array de coordenadas para dibujar la ruta
 */
export const getRouteDirections = async (origin, destination) => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    const url = `${DIRECTIONS_API_URL}?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Error en Directions API:', data.status, data.error_message);
      throw new Error(data.error_message || 'Error al obtener la ruta');
    }
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No se encontró una ruta entre los puntos seleccionados');
    }
    
    // Extraer las coordenadas de la ruta
    const route = data.routes[0];
    const coordinates = [];
    
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        // Decodificar la polyline codificada
        const decodedPath = decodePolyline(step.polyline.points);
        coordinates.push(...decodedPath);
      });
    });
    
    return coordinates;
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    throw error;
  }
};

/**
 * Decodifica una polyline codificada de Google Maps
 * @param {string} encoded - Polyline codificada
 * @returns {Array} Array de objetos {latitude, longitude}
 */
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    poly.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return poly;
};

/**
 * Obtiene información adicional de la ruta (distancia, duración)
 * @param {Object} origin - Coordenadas de origen {latitude, longitude}
 * @param {Object} destination - Coordenadas de destino {latitude, longitude}
 * @returns {Promise<Object>} Objeto con distancia y duración
 */
export const getRouteInfo = async (origin, destination) => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    const url = `${DIRECTIONS_API_URL}?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      return null;
    }
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    return {
      distance: leg.distance.text,
      distanceValue: leg.distance.value, // en metros
      duration: leg.duration.text,
      durationValue: leg.duration.value, // en segundos
    };
  } catch (error) {
    console.error('Error al obtener información de la ruta:', error);
    return null;
  }
};

