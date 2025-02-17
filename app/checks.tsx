import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '../components/Themed';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from './config/firebase';
import { useAuth } from './context/auth';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faRepeat } from '@fortawesome/free-solid-svg-icons';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';

interface Check {
  id: string;
  supplier: string;
  products: Array<{
    name: string;
    code: string;
    color: string;
    size: string;
    quantity: number;
    priceYuan: number;
    priceTenge: number;
    totalPriceYuan: number;
    exchangeRate: number;
  }>;
  totalQuantity: number;
  totalPriceYuan: number;
  createdAt: Date;
  createdBy: string;
  userId: string;
  status: string;
}

export default function ChecksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChecks = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(firestore, 'checks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const checksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Check[];

      setChecks(checksData);
    } catch (error) {
      console.error('Error fetching checks:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список чеков');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRepeatCheck = async (check: Check) => {
    try {
      router.push(`/checks?repeatCheck=${encodeURIComponent(JSON.stringify(check))}`);
    } catch (error) {
      console.error('Error repeating check:', error);
      Alert.alert('Ошибка', 'Не удалось повторить чек');
    }
  };

  useEffect(() => {
    fetchChecks();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (checks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Нет закрытых чеков</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={checks}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchChecks();
        }}
        renderItem={({ item: check }) => (
          <View style={styles.checkCard}>
            <View style={styles.checkHeader}>
              <Text style={styles.supplierName}>{check.supplier}</Text>
              <TouchableOpacity
                style={styles.repeatButton}
                onPress={() => handleRepeatCheck(check)}
              >
                <FontAwesomeIcon icon={faRepeat} size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>

            <View style={styles.checkInfo}>
              <Text style={styles.infoText}>Количество товаров: {check.totalQuantity}</Text>
              <Text style={styles.infoText}>Сумма: ¥{check.totalPriceYuan?.toLocaleString() || '0'}</Text>
              <Text style={styles.dateText}>
                {check.createdAt?.toLocaleDateString() || 'Дата не указана'}
              </Text>
            </View>

            <View style={styles.productsList}>
              {check.products?.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>
                    Код: {product.code} | Цвет: {product.color} | Размер: {product.size}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Количество: {product.quantity} | ¥{product.priceYuan?.toLocaleString() || '0'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 18,
    color: '#666'
  },
  checkCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  repeatButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)'
  }
});
