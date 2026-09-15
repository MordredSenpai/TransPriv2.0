// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Importar pantallas de autenticación
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Importar pantallas principales
import BoletosScreen from '../screens/BoletosScreen';
import GastosScreen from '../screens/GastosScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Importar pantallas de agregar
import AddBoletoScreen from '../screens/AddBoletoScreen';
import AddGastoScreen from '../screens/AddGastoScreen';

// Importar pantalla de mapa
import MapScreen from '../screens/MapScreen';
import TrackingScreen from '../screens/TrackingScreen';

// Crear los navegadores
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de autenticación
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Stack de boletos (para agregar navegación a AddBoleto)
function BoletosStackNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="BoletosList"
        component={BoletosScreen}
        options={{
          title: 'Boletos',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <AppStack.Screen
        name="AddBoleto"
        component={AddBoletoScreen}
        options={{
          title: 'Agregar Boleto',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <AppStack.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Seleccionar Ruta',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <AppStack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{
          title: 'Seguimiento de Ruta',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </AppStack.Navigator>
  );
}

// Stack de gastos (para agregar navegación a AddGasto)
function GastosStackNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="GastosList"
        component={GastosScreen}
        options={{
          title: 'Gastos',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <AppStack.Screen
        name="AddGasto"
        component={AddGastoScreen}
        options={{
          title: 'Agregar Gasto',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </AppStack.Navigator>
  );
}

// Tab Navigator principal
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
        },
      }}
    >
      <Tab.Screen
        name="Boletos"
        component={BoletosStackNavigator}
        options={{
          tabBarLabel: 'Boletos',
          tabBarIcon: () => null, // Puedes agregar iconos aquí si los tienes
        }}
      />
      <Tab.Screen
        name="Gastos"
        component={GastosStackNavigator}
        options={{
          tabBarLabel: 'Gastos',
          tabBarIcon: () => null, // Puedes agregar iconos aquí si los tienes
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: () => null, // Puedes agregar iconos aquí si los tienes
          headerShown: true,
          headerTitle: 'Perfil',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Tab.Navigator>
  );
}

// Navegador principal de la app
export default function AppNavigator() {
  const { user } = useAuth();

  // Si el usuario no está autenticado, mostrar el stack de autenticación
  // Si el usuario está autenticado, mostrar el tab navigator
  return user ? <TabNavigator /> : <AuthStackNavigator />;
}

