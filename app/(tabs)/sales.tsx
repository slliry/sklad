import { StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { firestore } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { useAuth } from '../context/auth';

interface SaleItem {
  productId: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  name: string;
  code: string;
}

interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  saleDate: Date;
  soldBy: string;
}

export default function SalesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    console.log('Начинаем загрузку продаж...');
    try {
      const salesCollection = collection(firestore, 'sales');
      const q = query(
        salesCollection,
        where('userId', '==', user.uid),
        orderBy('saleDate', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Получены данные о продажах:', snapshot.docs.length);
          const salesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            saleDate: doc.data().saleDate?.toDate() || new Date(),
          })) as Sale[];
          console.log('Обработанные данные:', salesList);
          setSales(salesList);
          setLoading(false);
        },
        (error) => {
          console.error('Ошибка при загрузке продаж:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Ошибка при настройке слушателя продаж:', error);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (sales.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <View style={styles.emptyState}>
          <FontAwesomeIcon 
            icon={faChartLine} 
            size={50} 
            color={Colors[colorScheme].subtitle}
            style={styles.icon}
          />
          <Text style={styles.title}>Продажи</Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme].subtitle }]}>
            История продаж пуста
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <ScrollView style={styles.salesList}>
        {sales.map((sale) => (
          <View 
            key={sale.id} 
            style={[styles.saleCard, { backgroundColor: Colors[colorScheme].cardBackground }]}
          >
            <View style={styles.saleHeader}>
              <Text style={[styles.saleDate, { color: Colors[colorScheme].subtitle }]}>
                Дата: {sale.saleDate.toLocaleDateString()} {sale.saleDate.toLocaleTimeString()}
              </Text>
              <Text style={[styles.salePerson, { color: Colors[colorScheme].subtitle }]}>
                Продал: {sale.soldBy}
              </Text>
            </View>

            {sale.items.map((item, index) => (
              <View key={index} style={styles.saleItem}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemCode, { color: Colors[colorScheme].subtitle }]}>
                    {item.code}
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemQuantity, { color: Colors[colorScheme].text }]}>
                    {item.quantity} шт.
                  </Text>
                  <Text style={[styles.itemPrice, { color: Colors[colorScheme].tint }]}>
                    ₸{item.priceTenge.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.saleFooter, { borderTopColor: Colors[colorScheme].inputBorder }]}>
              <Text style={[styles.totalLabel, { color: Colors[colorScheme].subtitle }]}>
                Итого:
              </Text>
              <Text style={[styles.totalAmount, { color: Colors[colorScheme].tint }]}>
                ₸{sale.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  salesList: {
    flex: 1,
    padding: 15,
  },
  saleCard: {
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3A3A3C20',
    borderRadius: 10,
    padding: 15,
  },
  saleHeader: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  saleDate: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.6,
  },
  salePerson: {
    fontSize: 13,
    opacity: 0.6,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  itemCode: {
    fontSize: 14,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saleInfo: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  saleDetails: {
    fontSize: 15,
    marginBottom: 12,
    opacity: 0.6,
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 0.3,
  },
});
