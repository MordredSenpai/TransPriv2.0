// config/rutas.js
// Configuración de rutas predefinidas de Tijuana, Baja California

export const RUTAS_PREDEFINIDAS = [
  {
    id: 'ruta1',
    nombre: 'Ruta Centro',
    color: '#007AFF',
    tarifa: 20.00,
    paradas: [
      {
        id: 'parada1',
        nombre: 'Plaza Monarca',
        coordenadas: {
          latitude: 32.5286,
          longitude: -117.0451
        }
      },
      {
        id: 'parada2',
        nombre: 'Zona Río',
        coordenadas: {
          latitude: 32.5265,
          longitude: -117.0338
        }
      },
      {
        id: 'parada3',
        nombre: 'Centro',
        coordenadas: {
          latitude: 32.5149,
          longitude: -117.0382
        }
      }
    ]
  },
  {
    id: 'ruta2',
    nombre: 'Ruta Norte',
    color: '#34C759',
    tarifa: 20.00,
    paradas: [
      {
        id: 'parada4',
        nombre: 'Otay Mesa',
        coordenadas: {
          latitude: 32.5675,
          longitude: -116.9350
        }
      },
      {
        id: 'parada5',
        nombre: 'La Mesa',
        coordenadas: {
          latitude: 32.5350,
          longitude: -116.9600
        }
      },
      {
        id: 'parada6',
        nombre: 'Florido',
        coordenadas: {
          latitude: 32.5500,
          longitude: -116.9000
        }
      }
    ]
  },
  {
    id: 'ruta3',
    nombre: 'Ruta Sur',
    color: '#FF9500',
    tarifa: 20.00,
    paradas: [
      {
        id: 'parada7',
        nombre: 'Playas de Tijuana',
        coordenadas: {
          latitude: 32.4500,
          longitude: -117.1036
        }
      },
      {
        id: 'parada8',
        nombre: 'Hipódromo',
        coordenadas: {
          latitude: 32.5050,
          longitude: -117.0250
        }
      },
      {
        id: 'parada9',
        nombre: 'Lomas de Tijuana',
        coordenadas: {
          latitude: 32.4900,
          longitude: -117.0150
        }
      }
    ]
  }
];

// Obtener todas las paradas de todas las rutas
export const getAllParadas = () => {
  const paradas = [];
  RUTAS_PREDEFINIDAS.forEach(ruta => {
    ruta.paradas.forEach(parada => {
      paradas.push({
        ...parada,
        rutaId: ruta.id,
        rutaNombre: ruta.nombre,
        rutaColor: ruta.color,
        rutaTarifa: ruta.tarifa
      });
    });
  });
  return paradas;
};

// Obtener tarifa de una ruta
export const getTarifaRuta = (rutaId) => {
  const ruta = RUTAS_PREDEFINIDAS.find(r => r.id === rutaId);
  return ruta ? ruta.tarifa : 0;
};

// Calcular tarifa entre dos paradas - Tarifa fija de $20 MXN
export const calcularTarifaBoleto = (origin, destination) => {
  // Tarifa estándar fija de $20 MXN por viaje
  return 20.00;
};

// Obtener una parada por ID
export const getParadaById = (paradaId) => {
  const paradas = getAllParadas();
  return paradas.find(p => p.id === paradaId);
};

// Obtener una ruta por ID
export const getRutaById = (rutaId) => {
  return RUTAS_PREDEFINIDAS.find(r => r.id === rutaId);
};

// Obtener el centro de todas las rutas (para centrar el mapa)
export const getCentroMapa = () => {
  const paradas = getAllParadas();
  if (paradas.length === 0) {
    return {
      latitude: 32.5149,
      longitude: -117.0382
    };
  }

  const latitudes = paradas.map(p => p.coordenadas.latitude);
  const longitudes = paradas.map(p => p.coordenadas.longitude);

  return {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2
  };
};

