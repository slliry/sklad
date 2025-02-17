import { StyleSheet, TouchableOpacity, ScrollView, TextInput, useColorScheme, Alert } from 'react-native';
import { Text, View } from '../../components/Themed';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMinus, faPlus, faTrash, faArrowLeft, faArrowRight, faReceipt } from '@fortawesome/free-solid-svg-icons';
import Colors from '../../constants/Colors';
import { Stack, router } from 'expo-router';
import { firestore } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/auth';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    code: string;
    quantity: number;
    selectedQuantity: number;
    priceYuan: number;
    priceTenge: number;
    sellingPrice: number;
  };
}

const CartItem = ({ item }: CartItemProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const { removeFromCart, updateItem } = useCart();

  const handleUpdateQuantity = (change: number) => {
    const newQuantity = item.selectedQuantity + change;
    if (newQuantity > 0 && newQuantity <= item.quantity) {
      updateItem(item.id, newQuantity, item.sellingPrice);
    }
  };

  const handleUpdatePrice = (price: string) => {
    updateItem(item.id, item.selectedQuantity, parseFloat(price) || 0);
  };

  return (
    <View style={[styles.itemCard, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.codeContainer, { backgroundColor: Colors[colorScheme].cardBackground }]}>
          <Text style={[styles.itemCode, { color: Colors[colorScheme].text }]}>
            {item.code}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => removeFromCart(item.id)}
          style={styles.removeButton}
        >
          <FontAwesomeIcon icon={faTrash} size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>
        {item.name}
      </Text>

      <View style={styles.detailsRow}>
        <Text style={[styles.label, { color: Colors[colorScheme].text }]}>
          Количество:
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(-1)}
            style={[styles.quantityButton, { backgroundColor: Colors[colorScheme].cardBackground }]}
          >
            <FontAwesomeIcon icon={faMinus} size={16} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
          <Text style={[styles.quantity, { color: Colors[colorScheme].text }]}>
            {item.selectedQuantity}
          </Text>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(1)}
            style={[styles.quantityButton, { backgroundColor: Colors[colorScheme].cardBackground }]}
          >
            <FontAwesomeIcon icon={faPlus} size={16} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.priceSection, { borderTopColor: Colors[colorScheme].inputBorder }]}>
        <View style={styles.priceInputContainer}>
          <Text style={[styles.label, { color: Colors[colorScheme].text }]}>
            Цена продажи (₸):
          </Text>
          <TextInput
            style={[styles.priceInput, { 
              backgroundColor: Colors[colorScheme].cardBackground,
              borderColor: Colors[colorScheme].inputBorder,
              color: Colors[colorScheme].text 
            }]}
            value={item.sellingPrice.toString()}
            onChangeText={handleUpdatePrice}
            keyboardType="numeric"
            placeholder="Введите цену"
            placeholderTextColor={Colors[colorScheme].text}
          />
        </View>

        <View style={styles.priceInfo}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: Colors[colorScheme].text }]}>
              Закупочная цена:
            </Text>
            <Text style={[styles.priceValue, { color: Colors[colorScheme].text }]}>
              ₸{item.priceTenge.toLocaleString()}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: Colors[colorScheme].text }]}>
              Итого:
            </Text>
            <Text style={[styles.itemTotal, { color: Colors[colorScheme].tint }]}>
              ₸{(item.sellingPrice * item.selectedQuantity).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { items, removeFromCart, updateItem, clearCart, getGroupedItems, completeSupplierPurchase } = useCart();
  const groupedItems = getGroupedItems();
  const { user } = useAuth();

  const handleSale = async () => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо авторизоваться');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Ошибка', 'Корзина пуста');
      return;
    }

    try {
      console.log('Начало оформления продажи...');
      
      // Создаем запись о продаже
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.selectedQuantity,
          priceYuan: item.priceYuan,
          priceTenge: item.sellingPrice,
          name: item.name,
          code: item.code,
        })),
        totalAmount: items.reduce((sum, item) => sum + (item.sellingPrice * item.selectedQuantity), 0),
        saleDate: serverTimestamp(),
        soldBy: user.email,
        userId: user.uid
      };

      console.log('Данные продажи:', saleData);

      // Добавляем продажу в коллекцию sales
      const salesCollection = collection(firestore, 'sales');
      const saleRef = await addDoc(salesCollection, saleData);
      console.log('Продажа создана с ID:', saleRef.id);

      // Обновляем количество товаров на складе
      for (const item of items) {
        console.log('Обновление товара:', {
          id: item.id,
          name: item.name,
          currentQuantity: item.quantity,
          selectedQuantity: item.selectedQuantity,
          userId: user.uid
        });
        
        const newQuantity = item.quantity - item.selectedQuantity;
        if (newQuantity < 0) {
          throw new Error(`Недостаточно товара ${item.name} (${item.code}) на складе`);
        }

        const productRef = doc(firestore, 'warehouse', item.id);
        try {
          await updateDoc(productRef, {
            quantity: newQuantity,
            lastUpdated: serverTimestamp(),
            lastUpdatedBy: user.email,
            userId: user.uid
          });
          console.log('Товар обновлен успешно. Новое количество:', newQuantity);
        } catch (updateError) {
          console.error('Ошибка при обновлении товара:', {
            error: updateError,
            itemId: item.id,
            userId: user.uid
          });
          throw new Error(`Ошибка при обновлении количества товара ${item.name}: ${updateError.message}`);
        }
      }

      // Очищаем корзину и возвращаемся на склад
      clearCart();
      Alert.alert('Успех', 'Продажа успешно оформлена');
      router.replace('/(tabs)/warehouse');
    } catch (error) {
      console.error('Ошибка при оформлении продажи:', error);
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось оформить продажу');
    }
  };

  const handleUpdateQuantity = (id: string, change: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = item.selectedQuantity + change;
      if (newQuantity > 0 && newQuantity <= item.quantity) {
        updateItem(id, newQuantity, item.sellingPrice);
      }
    }
  };

  const handleUpdatePrice = (id: string, price: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      updateItem(id, item.selectedQuantity, parseFloat(price) || 0);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.sellingPrice * item.selectedQuantity), 0);

  const handleSupplierPurchase = async (supplier: string) => {
    try {
      const supplierItems = groupedItems[supplier] || [];
      
      if (supplierItems.length === 0) {
        Alert.alert('Ошибка', 'Нет товаров для оформления чека');
        return;
      }

      // Create check data
      const checkData = {
        supplier,
        items: supplierItems.map(item => ({
          productId: item.id,
          name: item.name,
          code: item.code,
          color: item.color,
          quantity: item.selectedQuantity,
          priceYuan: item.priceYuan,
          priceTenge: item.priceTenge,
          sellingPrice: item.sellingPrice
        })),
        totalAmount: supplierItems.reduce((sum, item) => sum + (item.sellingPrice * item.selectedQuantity), 0),
        createdAt: serverTimestamp(),
        createdBy: user?.email,
        userId: user?.uid,
        status: 'completed'
      };

      // Add to checks collection
      const checksCollection = collection(firestore, 'checks');
      await addDoc(checksCollection, checkData);

      // Complete the purchase in cart
      completeSupplierPurchase(supplier);
      Alert.alert('Успех', 'Чек успешно создан');
    } catch (error) {
      console.error('Error creating check:', error);
      Alert.alert('Ошибка', 'Не удалось создать чек');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen
        options={{
          title: 'Корзина',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesomeIcon icon={faArrowLeft} size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/checks')}>
              <FontAwesomeIcon icon={faReceipt} size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.cartList}>
        {Object.entries(groupedItems).map(([supplier, items]) => (
          <View key={supplier} style={styles.supplierGroup}>
            <View style={styles.supplierHeader}>
              <Text style={[styles.supplierName, { color: Colors[colorScheme].text }]}>{supplier}</Text>
              <TouchableOpacity 
                onPress={() => handleSupplierPurchase(supplier)}
                style={styles.completeButton}
              >
                <FontAwesomeIcon icon={faArrowRight} size={20} color={Colors[colorScheme].tint} />
              </TouchableOpacity>
            </View>
            {items.map((item, index) => (
              <CartItem key={index} item={item} />
            ))}
          </View>
        ))}
      </ScrollView>
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Итого:</Text>
            <Text style={styles.totalAmount}>₸{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.saleButton, 
              { backgroundColor: Colors[colorScheme].tint }
            ]} 
            onPress={handleSale}
          >
            <Text style={styles.saleButtonText}>Оформить продажу</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  supplierGroup: {
    marginBottom: 30,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  itemList: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    marginHorizontal: 15,
    marginBottom: 25,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  codeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 5,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
  },
  priceSection: {
    borderTopWidth: 1,
    paddingTop: 25,
  },
  priceInputContainer: {
    marginBottom: 15,
  },
  priceInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  priceInfo: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkoutButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  cartList: {
    flex: 1,
    padding: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '500',
  },
  saleButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});