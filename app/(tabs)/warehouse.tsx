import { StyleSheet, TouchableOpacity, ScrollView, TextInput, useColorScheme, Modal, Alert, FlatList } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faShoppingCart, faCartPlus, faMinus, faPlus, faPencil, faThLarge, faList, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { firestore } from '../config/firebase';
import { router } from 'expo-router';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/auth';

interface Product {
  id: string;
  name: string;
  code: string;
  color: string;
  size: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  totalPriceYuan: number;
  exchangeRate: number;
  supplier: string;
  createdAt: Date;
  createdBy: string;
  userId: string;
  purchaseRef?: string;
}

interface CartItem extends Product {
  selectedQuantity: number;
  sellingPrice: number;
}

export default function WarehouseScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { items: cartItems, addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPriceYuan, setEditPriceYuan] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'suppliers' | 'catalog'>('suppliers');
  const [selectedSupplierProducts, setSelectedSupplierProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('Пользователь не авторизован');
      return;
    }

    console.log('ID пользователя:', user.uid);
    console.log('Email пользователя:', user.email);

    const q = query(
      collection(firestore, 'warehouse'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Получены данные из warehouse');
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error('Ошибка при получении данных:', error);
        console.error('Детали ошибки:', JSON.stringify(error, null, 2));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredProducts = products.filter(product => 
    (product.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
    (product.code?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    setProductToAdd(product);
    setSelectedQuantity(1);
    setDetailsModalVisible(false);
    setQuantityModalVisible(true);
  };

  const handleConfirmAddToCart = async () => {
    if (!user) {
      console.log('Ошибка: пользователь не авторизован');
      Alert.alert('Ошибка', 'Необходимо авторизоваться');
      return;
    }

    console.log('Текущий пользователь:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });

    if (productToAdd) {
      try {
        console.log('Попытка добавления в корзину:', {
          productId: productToAdd.id,
          name: productToAdd.name,
          quantity: selectedQuantity
        });

        const cartItem: CartItem = {
          ...productToAdd,
          selectedQuantity,
          sellingPrice: productToAdd.priceTenge
        };

        await addToCart(cartItem);
        console.log('Товар успешно добавлен в корзину');
        
        setQuantityModalVisible(false);
        setProductToAdd(null);
        setSelectedQuantity(1);
      } catch (error) {
        console.error('Ошибка при добавлении в корзину:', error);
        console.error('Детали ошибки:', JSON.stringify(error, null, 2));
        console.error('Стек ошибки:', (error as Error).stack);
        
        Alert.alert(
          'Ошибка',
          'Не удалось добавить товар в корзину. Проверьте права доступа или обратитесь к администратору.'
        );
      }
    }
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailsModalVisible(true);
  };

  const handleEditPress = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCode(product.code);
    setEditColor(product.color);
    setEditQuantity(product.quantity.toString());
    setEditPriceYuan(product.priceYuan.toString());
    setEditSupplier(product.supplier || '');
    setDetailsModalVisible(false);
    setEditModalVisible(true);
  };

  const handleCloseEdit = () => {
    setEditModalVisible(false);
    setEditingProduct(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    
    setEditLoading(true);
    try {
      const productRef = doc(firestore, 'warehouse', editingProduct.id);
      await updateDoc(productRef, {
        name: editName,
        code: editCode,
        color: editColor,
        quantity: parseInt(editQuantity),
        priceYuan: parseFloat(editPriceYuan),
        supplier: editSupplier,
      });

      setEditModalVisible(false);
      setEditingProduct(null);
      Alert.alert('Успех', 'Товар успешно обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении товара:', error);
      Alert.alert('Ошибка', 'Не удалось обновить товар');
    } finally {
      setEditLoading(false);
    }
  };

  const groupProductsBySupplier = (products: Product[]) => {
    return products.reduce((groups: { [supplier: string]: Product[] }, product) => {
      const supplier = product.supplier || 'Unknown';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(product);
      return groups;
    }, {});
  };

  const renderProductDetails = (product: Product) => (
    <View style={styles.productDetails}>
      <View style={styles.productHeader}>
        <Text style={styles.productTitle}>{product.name}</Text>
        <Text style={styles.productSubtitle}>Код: {product.code}</Text>
      </View>

      <View style={styles.productInfoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Цвет</Text>
          <Text style={styles.infoValue}>{product.color}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Размер</Text>
          <Text style={styles.infoValue}>{product.size}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Количество</Text>
          <Text style={styles.infoValue}>{product.quantity} шт.</Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Цена (юань)</Text>
          <Text style={styles.priceValue}>¥{product.priceYuan}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Цена (тенге)</Text>
          <Text style={styles.priceValue}>₸{product.priceTenge}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditPress(product)}
        >
          <FontAwesomeIcon icon={faPencil} size={16} color="#fff" />
          <Text style={styles.buttonText}>Редактировать</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(product)}
        >
          <FontAwesomeIcon icon={faCartPlus} size={16} color="#fff" />
          <Text style={styles.buttonText}>В корзину</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCatalogItem = (product: Product) => (
    <TouchableOpacity
      style={[styles.catalogItem, { backgroundColor: Colors[colorScheme].cardBackground }]}
      onPress={() => handleProductPress(product)}
    >
      <Text style={[styles.catalogItemName, { color: Colors[colorScheme].text }]}>{product.name}</Text>
      <Text style={[styles.catalogItemDetails, { color: Colors[colorScheme].subtitle }]}>
        {product.code} | {product.color} | {product.size}
      </Text>
      <Text style={[styles.catalogItemQuantity, { color: Colors[colorScheme].text }]}>
        {product.quantity} шт.
      </Text>
      <Text style={[styles.catalogItemPrice, { color: Colors[colorScheme].tint }]}>
        ₸{product.priceTenge}
      </Text>
      <TouchableOpacity
        style={styles.catalogAddToCart}
        onPress={() => handleAddToCart(product)}
      >
        <FontAwesomeIcon icon={faCartPlus} size={20} color={Colors[colorScheme].tint} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].cardBackground }]}>
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme].inputBackground }]}>
          <FontAwesomeIcon icon={faSearch} size={20} color={Colors[colorScheme].subtitle} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Поиск по названию или коду"
            placeholderTextColor={Colors[colorScheme].subtitle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode(viewMode === 'suppliers' ? 'catalog' : 'suppliers')}
        >
          <FontAwesomeIcon 
            icon={viewMode === 'suppliers' ? faThLarge : faList} 
            size={20} 
            color={Colors[colorScheme].tint}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text>Загрузка...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>Товары не найдены</Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme].subtitle }]}>
            Добавьте товары через форму добавления
          </Text>
        </View>
      ) : viewMode === 'suppliers' ? (
        <FlatList
          key="suppliers"
          style={styles.productList}
          data={Object.entries(groupProductsBySupplier(filteredProducts))}
          keyExtractor={([supplier]) => supplier}
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            // Re-fetch products
            const q = query(
              collection(firestore, 'warehouse'),
              where('userId', '==', user?.uid),
              orderBy('createdAt', 'desc')
            );
            
            onSnapshot(q, 
              (snapshot) => {
                const productList = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Product[];
                setProducts(productList);
                setLoading(false);
              },
              (error) => {
                console.error('Error fetching products:', error);
                setLoading(false);
              }
            );
          }}
          renderItem={({ item: [supplier, supplierProducts] }) => (
            <View style={[styles.supplierCard, { backgroundColor: Colors[colorScheme].cardBackground }]}>
              <View style={styles.supplierHeader}>
                <Text style={[styles.supplierName, { color: Colors[colorScheme].text }]}>
                  {supplier}
                </Text>
                <Text style={[styles.productCount, { color: Colors[colorScheme].subtitle }]}>
                  {supplierProducts.length} товаров
                </Text>
              </View>

              <View style={styles.productSummary}>
                {supplierProducts.map((product, index) => (
                  <View key={index} style={styles.colorGroup}>
                    <Text style={[styles.colorName, { color: Colors[colorScheme].text }]}>
                      {product.name} - {product.color}:
                    </Text>
                    <Text style={[styles.colorQuantity, { color: Colors[colorScheme].subtitle }]}>
                      {product.quantity} шт.
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => {
                  setSelectedSupplierProducts(supplierProducts);
                  setDetailsModalVisible(true);
                }}
              >
                <Text style={styles.viewDetailsText}>Подробнее</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          key="catalog"
          style={styles.catalogList}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            // Re-fetch products
            const q = query(
              collection(firestore, 'warehouse'),
              where('userId', '==', user?.uid),
              orderBy('createdAt', 'desc')
            );
            
            onSnapshot(q, 
              (snapshot) => {
                const productList = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Product[];
                setProducts(productList);
                setLoading(false);
              },
              (error) => {
                console.error('Error fetching products:', error);
                setLoading(false);
              }
            );
          }}
          renderItem={({ item }) => renderCatalogItem(item)}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={quantityModalVisible}
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.quantityModalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              {productToAdd?.name}
            </Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                onPress={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                style={styles.quantityButton}
              >
                <FontAwesomeIcon icon={faMinus} size={20} color={Colors[colorScheme].tint} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: Colors[colorScheme].text }]}>
                {selectedQuantity}
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedQuantity(Math.min(productToAdd?.quantity || 1, selectedQuantity + 1))}
                style={styles.quantityButton}
              >
                <FontAwesomeIcon icon={faPlus} size={20} color={Colors[colorScheme].tint} />
              </TouchableOpacity>
            </View>
            <View style={styles.quantityModalButtons}>
              <TouchableOpacity 
                style={[styles.quantityModalButton, styles.cancelQuantityButton]}
                onPress={() => {
                  setQuantityModalVisible(false);
                  setProductToAdd(null);
                }}
              >
                <Text style={styles.cancelQuantityText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quantityModalButton, styles.confirmQuantityButton]}
                onPress={handleConfirmAddToCart}
              >
                <Text style={styles.confirmQuantityText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} size={20} color={Colors[colorScheme].text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
                {selectedSupplierProducts[0]?.supplier || 'Товары поставщика'}
              </Text>
              <TouchableOpacity style={{ width: 40, opacity: 0 }}>
                <Text> </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedSupplierProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderProductDetails(item)}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleCloseEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleCloseEdit}
              >
                <FontAwesomeIcon icon={faArrowLeft} size={20} color={Colors[colorScheme].text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
                Редактировать товар
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Название</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Название товара"
                  placeholderTextColor={Colors[colorScheme].subtitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Код</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                  value={editCode}
                  onChangeText={setEditCode}
                  placeholder="Код товара"
                  placeholderTextColor={Colors[colorScheme].subtitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Поставщик</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                  value={editSupplier}
                  onChangeText={setEditSupplier}
                  placeholder="Поставщик"
                  placeholderTextColor={Colors[colorScheme].subtitle}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1, styles.marginRight]}>
                  <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Цвет</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                    value={editColor}
                    onChangeText={setEditColor}
                    placeholder="Цвет"
                    placeholderTextColor={Colors[colorScheme].subtitle}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Количество</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    placeholder="Количество"
                    keyboardType="numeric"
                    placeholderTextColor={Colors[colorScheme].subtitle}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Цена (¥)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: Colors[colorScheme].inputBackground }]}
                  value={editPriceYuan}
                  onChangeText={setEditPriceYuan}
                  placeholder="Цена в юанях"
                  keyboardType="numeric"
                  placeholderTextColor={Colors[colorScheme].subtitle}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseEdit}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                <Text style={styles.saveButtonText}>
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C20',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  productList: {
    flex: 1,
  },
  productCard: {
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C10',
    backgroundColor: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCode: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.6,
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  productDetails: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  productHeader: {
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  productInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 10,
    backgroundColor: 'transparent',
  },
  productList: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  quantityModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  quantityModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelQuantityButton: {
    backgroundColor: '#f8f9fa',
  },
  confirmQuantityButton: {
    backgroundColor: '#2196F3',
  },
  cancelQuantityText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmQuantityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  editModalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  editForm: {
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.6,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  marginRight: {
    marginRight: 5,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  supplierCard: {
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600'
  },
  productCount: {
    fontSize: 14
  },
  productSummary: {
    marginTop: 10
  },
  colorGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  colorName: {
    fontSize: 14
  },
  colorQuantity: {
    fontSize: 14
  },
  viewDetailsButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    alignItems: 'center'
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  viewModeButtons: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  viewModeButton: {
    padding: 10,
    marginLeft: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  catalogList: {
    padding: 10,
  },
  catalogItem: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  catalogItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  catalogItemDetails: {
    fontSize: 14,
    marginBottom: 5,
  },
  catalogItemQuantity: {
    fontSize: 14,
    marginBottom: 5,
  },
  catalogItemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  catalogAddToCart: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});