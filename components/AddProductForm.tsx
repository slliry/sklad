import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, useColorScheme, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Text, View } from './Themed';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../app/config/firebase';
import Colors from '../constants/Colors';
import { useAuth } from '../app/context/auth';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface AddProductFormProps {
  product?: {
    name: string;
    code: string;
    color: string;
    size: string;
    quantity: number;
    priceYuan: number;
    exchangeRate: number;
    supplier: string;
  };
}

export default function AddProductForm({ product, onBack }: { product?: AddProductFormProps['product']; onBack: () => void }) {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priceYuan, setPriceYuan] = useState('');
  const [exchangeRate, setExchangeRate] = useState(product?.exchangeRate?.toString() || '');
  const [supplier, setSupplier] = useState(product?.supplier || '');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

  useEffect(() => {
    const fetchLastProductData = async () => {
      if (!user || !product?.supplier) return;

      try {
        const q = query(
          collection(firestore, 'purchases'),
          where('userId', '==', user.uid),
          where('supplier', '==', product.supplier),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastProduct = querySnapshot.docs[0].data();
          setName(lastProduct.name || '');
          setCode(lastProduct.code || '');
          setColor(lastProduct.color || '');
          setSize(lastProduct.size || '');
          setQuantity(lastProduct.quantity?.toString() || '');
          setPriceYuan(lastProduct.priceYuan?.toString() || '');
          setExchangeRate(lastProduct.exchangeRate?.toString() || '');
        }
      } catch (error) {
        console.error('Error fetching last product data:', error);
      }
    };

    fetchLastProductData();
  }, [user, product?.supplier]);

  const priceTenge = priceYuan
    ? (parseFloat(priceYuan) * parseFloat(exchangeRate || '0')).toFixed(2)
    : '';

  const totalPriceYuan = priceYuan && quantity
    ? (parseFloat(priceYuan) * parseInt(quantity)).toFixed(2)
    : '';

  const totalPriceTenge = totalPriceYuan
    ? (parseFloat(totalPriceYuan) * parseFloat(exchangeRate || '0')).toFixed(2)
    : '';

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо авторизоваться');
      return;
    }

    if (!name || !code || !color || !size || !quantity || !priceYuan || !supplier || !exchangeRate) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name,
        code,
        color,
        size,
        quantity: parseInt(quantity),
        priceYuan: parseFloat(priceYuan),
        priceTenge: parseFloat(priceTenge),
        totalPriceYuan: parseFloat(totalPriceYuan),
        exchangeRate: parseFloat(exchangeRate),
        supplier,
        createdAt: serverTimestamp(),
        createdBy: user.email,
        userId: user.uid,
        status: 'purchase',
        isArchived: false,
        documentType: 'purchase'
      };

      await addDoc(collection(firestore, 'purchases'), productData);

      // Reset form
      setName('');
      setCode('');
      setColor('');
      setSize('');
      setQuantity('');
      setPriceYuan('');
      setSupplier('');
      setExchangeRate('');

      Alert.alert('Успех', 'Товар успешно добавлен в закупки');
    } catch (error) {
      console.error('Ошибка при добавлении товара:', error);
      Alert.alert('Ошибка', 'Не удалось добавить товар: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (focusedInput === 'priceYuan' || focusedInput === 'exchangeRate') {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [focusedInput]);

  // Добавляем функцию выбора размера
  const handleSizeSelect = (selectedSize: string) => {
    setSize(selectedSize);
    setShowSizeModal(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          keyboardDismissMode="interactive"
        >
          <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Поставщик</Text>
                <TextInput
                  style={[styles.input, 
                    { 
                      backgroundColor: product?.supplier ? '#f0f0f0' : Colors[colorScheme].background,
                      color: product?.supplier ? '#666666' : Colors[colorScheme].text
                    }
                  ]}
                  placeholder="Введите поставщика"
                  value={supplier}
                  onChangeText={setSupplier}
                  onFocus={() => setFocusedInput('supplier')}
                  onBlur={() => setFocusedInput(null)}
                  placeholderTextColor="#666666"
                  editable={!product?.supplier}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Название товара</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                  placeholder="Введите название"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Код товара</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                  placeholder="Введите код"
                  value={code}
                  onChangeText={setCode}
                  onFocus={() => setFocusedInput('code')}
                  onBlur={() => setFocusedInput(null)}
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.smallInputGroup]}>
                  <Text style={styles.smallLabel}>Цвет</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                    placeholder="Введите цвет"
                    value={color}
                    onChangeText={setColor}
                    onFocus={() => setFocusedInput('color')}
                    onBlur={() => setFocusedInput(null)}
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={[styles.inputGroup, styles.smallInputGroup]}>
                  <Text style={styles.smallLabel}>Размер</Text>
                  <TouchableOpacity 
                    onPress={() => setShowSizeModal(true)}
                    style={styles.sizeInput}
                  >
                    <TextInput
                      style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                      placeholder="Выберите размер"
                      value={size}
                      onChangeText={setSize}
                      onFocus={() => setShowSizeModal(true)}
                      placeholderTextColor="#666666"
                      editable={true}
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, styles.smallInputGroup]}>
                  <Text style={styles.smallLabel}>Количество</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                    placeholder="Введите количество"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    onFocus={() => setFocusedInput('quantity')}
                    onBlur={() => setFocusedInput(null)}
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.smallInputGroup]}>
                  <Text style={styles.label}>Цена (юань)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                    placeholder="Введите цену"
                    value={priceYuan}
                    onChangeText={setPriceYuan}
                    keyboardType="numeric"
                    onFocus={() => setFocusedInput('priceYuan')}
                    onBlur={() => setFocusedInput(null)}
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={[styles.inputGroup, styles.smallInputGroup]}>
                  <Text style={styles.label}>Курс юаня</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].background }]}
                    placeholder="Введите курс"
                    value={exchangeRate}
                    onChangeText={setExchangeRate}
                    keyboardType="numeric"
                    onFocus={() => setFocusedInput('exchangeRate')}
                    onBlur={() => setFocusedInput(null)}
                    placeholderTextColor="#666666"
                    editable={true}
                  />
                </View>
              </View>

              {priceYuan && (
                <View style={styles.calculatedPrices}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Цена за единицу:</Text>
                    <Text style={styles.priceValue}>₸ {priceTenge}</Text>
                  </View>
                  {quantity && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Общая сумма:</Text>
                      <Text style={styles.priceValue}>¥ {totalPriceYuan}</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSubmit} 
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Добавление...' : 'Добавить товар'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Модальное окно для выбора размера */}
        <Modal
          visible={showSizeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSizeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Выберите размер</Text>
              <FlatList
                data={sizes}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.sizeItem}
                    onPress={() => handleSizeSelect(item)}
                  >
                    <Text style={styles.sizeItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSizeModal(false)}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
    backgroundColor: 'white',
    width: '100%',
  },
  formContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallInputGroup: {
    flex: 1,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500',
  },
  smallLabel: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  calculatedPrices: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sizeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sizeItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  sizeInput: {
    flex: 1,
  },
});