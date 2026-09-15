// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // Campos de perfil
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    checkBiometricStatus();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        setNombre(data.nombre || '');
        setApellidos(data.apellidos || '');
        setTelefono(data.telefono || '');
        setDireccion(data.direccion || '');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  const handleSaveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await loadUserProfile();
      setEditMode(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', 'Error al guardar el perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const credentials = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      setBiometricEnabled(!!credentials);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleEnableBiometricPress = () => {
    setShowPasswordModal(true);
  };

  const handleEnableBiometric = async () => {
    if (!password) {
      Alert.alert('Error', 'La contraseña es requerida');
      return;
    }

    try {
      setLoading(true);
      setShowPasswordModal(false);

      // Verificar si hay hardware biométrico
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica');
        setLoading(false);
        return;
      }

      // Verificar si hay huellas registradas
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          'Error',
          'No hay huellas registradas en tu dispositivo. Por favor, registra una huella en la configuración del dispositivo.'
        );
        setLoading(false);
        return;
      }

      // Solicitar autenticación biométrica para habilitar la función
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentica para habilitar el ingreso con huella',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        // Guardar las credenciales de forma segura
        // Nota: En producción, deberías usar un método más seguro (ej. encriptación)
        const user = auth.currentUser;
        if (user && user.email) {
          await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify({
            email: user.email,
            password: password // Almacenar contraseña (en producción, encriptar)
          }));

          setBiometricEnabled(true);
          setPassword('');
          Alert.alert('Éxito', 'Ingreso con huella habilitado');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error al habilitar biométricos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Deshabilitar Biométricos',
      '¿Estás seguro de que quieres deshabilitar el ingreso con huella?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Deshabilitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
              setBiometricEnabled(false);
              Alert.alert('Éxito', 'Ingreso con huella deshabilitado');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setEditMode(false);
                    loadUserProfile(); // Recargar datos originales
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSaveProfile}
                  disabled={saving}
                  style={[styles.saveButton, saving && styles.buttonDisabled]}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email:</Text>
            {editMode ? (
              <TextInput
                style={styles.inputDisabled}
                value={user?.email || ''}
                editable={false}
              />
            ) : (
              <Text style={styles.value}>{user?.email || ''}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#8A8A8A"
                value={nombre}
                onChangeText={setNombre}
                color="#0A0A0A"
              />
            ) : (
              <Text style={styles.value}>{nombre || 'No especificado'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Apellidos:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                placeholder="Ingresa tus apellidos"
                placeholderTextColor="#8A8A8A"
                value={apellidos}
                onChangeText={setApellidos}
                color="#0A0A0A"
              />
            ) : (
              <Text style={styles.value}>{apellidos || 'No especificado'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Teléfono:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu teléfono"
                placeholderTextColor="#8A8A8A"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                color="#0A0A0A"
              />
            ) : (
              <Text style={styles.value}>{telefono || 'No especificado'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Dirección:</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ingresa tu dirección"
                placeholderTextColor="#8A8A8A"
                value={direccion}
                onChangeText={setDireccion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                color="#0A0A0A"
              />
            ) : (
              <Text style={styles.value}>{direccion || 'No especificado'}</Text>
            )}
          </View>
        </View>

        <View style={styles.biometricSection}>
          <Text style={styles.sectionTitle}>Autenticación Biométrica</Text>
          <Text style={styles.sectionDescription}>
            {biometricEnabled
              ? 'El ingreso con huella está habilitado'
              : 'Habilita el ingreso con huella para una experiencia más rápida'}
          </Text>

          {!biometricEnabled ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={handleEnableBiometricPress}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Habilitando...' : 'Habilitar ingreso con huella'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleDisableBiometric}
            >
              <Text style={styles.buttonText}>Deshabilitar ingreso con huella</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para ingresar contraseña */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Habilitar Ingreso con Huella</Text>
            <Text style={styles.modalDescription}>
              Ingresa tu contraseña para habilitar el ingreso con huella:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña"
              placeholderTextColor="#8A8A8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleEnableBiometric}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Habilitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#0A0A0A',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#666',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  biometricSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#FF9500',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#0A0A0A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#999',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

