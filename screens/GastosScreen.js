// screens/GastosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function GastosScreen({ navigation }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSemana: 0,
    promedioSemana: 0,
    totalMes: 0,
    totalGastos: 0
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Consulta para obtener los gastos del usuario actual
    const q = query(
      collection(db, 'gastos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const gastosData = [];
        querySnapshot.forEach((doc) => {
          gastosData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setGastos(gastosData);
        
        // Calcular estadísticas
        calcularEstadisticas(gastosData);
        
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error al obtener gastos:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Limpiar la suscripción al desmontar
    return () => unsubscribe();
  }, []);

  const calcularEstadisticas = (gastosData) => {
    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - 7);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    let totalSemana = 0;
    let gastosSemana = 0;
    let totalMes = 0;
    let totalGastos = 0;

    gastosData.forEach(gasto => {
      const fechaGasto = gasto.createdAt?.toDate ? gasto.createdAt.toDate() : new Date(gasto.createdAt?.seconds * 1000 || ahora);
      const monto = gasto.amount || 0;
      
      totalGastos += monto;
      
      if (fechaGasto >= inicioMes) {
        totalMes += monto;
      }
      
      if (fechaGasto >= inicioSemana) {
        totalSemana += monto;
        gastosSemana++;
      }
    });

    const promedioSemana = gastosSemana > 0 ? totalSemana / gastosSemana : 0;

    setStats({
      totalSemana,
      promedioSemana,
      totalMes,
      totalGastos
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    // El onSnapshot se actualizará automáticamente
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const renderGasto = ({ item }) => {
    const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
    const formattedDate = createdAt.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.gastoCard}>
        <View style={styles.gastoHeader}>
          <View style={styles.gastoInfo}>
            <Text style={styles.gastoDescription}>{item.description || 'Sin descripción'}</Text>
            <Text style={styles.gastoAmount}>{formatCurrency(item.amount || 0)}</Text>
          </View>
        </View>
        <Text style={styles.gastoDate}>{formattedDate}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderDashboard = () => (
    <View style={styles.dashboard}>
      <Text style={styles.dashboardTitle}>Resumen de Gastos</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Esta Semana</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.totalSemana)}</Text>
          <Text style={styles.statSubtext}>Promedio: {formatCurrency(stats.promedioSemana)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Este Mes</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.totalMes)}</Text>
        </View>
      </View>
      <View style={styles.statCardWide}>
        <Text style={styles.statLabel}>Total General</Text>
        <Text style={styles.statValueLarge}>{formatCurrency(stats.totalGastos)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderDashboard()}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Historial de Gastos</Text>
          {gastos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay gastos registrados</Text>
            </View>
          ) : (
            gastos.map((item) => (
              <View key={item.id} style={styles.gastoCardWrapper}>
                {renderGasto({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  dashboard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statCardWide: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3,
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  gastoCardWrapper: {
    marginBottom: 10,
  },
  gastoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  gastoInfo: {
    flex: 1,
    marginRight: 10,
  },
  gastoDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  gastoAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  gastoDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

