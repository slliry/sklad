import React from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from './Themed';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { firestore } from '../app/config/firebase';
import { useAuth } from '../app/context/auth';
import { useState, useEffect } from 'react';
import AddProductForm from './AddProductForm';

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
  status: string;
}

interface PurchaseListProps {}


export default function PurchaseList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedSuppliers, setCompletedSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);


  const fetchProducts = async () => {
    console.log('Starting fetchProducts function');
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    try {
      console.log('Creating query for purchases collection');
      const q = query(
        collection(firestore, 'purchases'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      console.log('Executing query to fetch products');
      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.size} documents`);

      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Processing document ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data,
          isArchived: data.isArchived || false
        };
      }) as Product[];

      console.log('Processed products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список товаров');
    } finally {
      console.log('Finishing fetchProducts function');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleArrived = async (productId: string) => {
    try {
      // First, check if the purchase document still exists
      const productRef = doc(firestore, 'purchases', productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        Alert.alert('Ошибка', 'Товар не найден в базе данных');
        // Remove from local state since document doesn't exist
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== productId)
        );
        return;
      }

      const productData = productDoc.data();
      
      // Create a new document in warehouse collection
      const warehouseData = {
        name: productData.name,
        code: productData.code,
        color: productData.color,
        size: productData.size,
        quantity: productData.quantity,
        priceYuan: productData.priceYuan,
        priceTenge: productData.priceTenge,
        totalPriceYuan: productData.totalPriceYuan,
        exchangeRate: productData.exchangeRate,
        supplier: productData.supplier,
        createdAt: serverTimestamp(),
        createdBy: productData.createdBy,
        userId: productData.userId,
        purchaseRef: productId // Reference to original purchase document
      };

      // Add to warehouse collection
      await addDoc(collection(firestore, 'warehouse'), warehouseData);

      // Update the purchase document to mark it as archived
      await updateDoc(productRef, {
        isArchived: true // This field helps maintain the purchase history
      });

      // Update the product in the list instead of removing it
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isArchived: true }
            : product
        )
        );

      Alert.alert('Успех', 'Товар успешно добавлен на склад');
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус товара');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText} emptyText={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 8,
            color: '#333'
          }}
          emptySubtext={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center'
          }}
        >Нет товаров в закупках</Text>
        <Text style={styles.emptySubtext}>Добавьте новый товар, нажав на кнопку "+"</Text>
      </View>
    );
  }

  const groupProductsBySupplier = (products: Product[]) => {
    // Filter out archived products first
    const activeProducts = products.filter(product => !product.isArchived);
    return activeProducts.reduce((groups: { [supplier: string]: Product[] }, product) => {
      const supplier = product.supplier || 'Неизвестный';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(product);
      return groups;
    }, {});
  };

  const handleSupplierCompletion = async (supplier: string) => {
    try {
      const supplierProducts = products.filter(p => p.supplier === supplier);
      const checkData = {
        supplier,
        products: supplierProducts.map(p => ({
          name: p.name,
          code: p.code,
          color: p.color,
          size: p.size,
          quantity: p.quantity,
          priceYuan: p.priceYuan,
          priceTenge: p.priceTenge,
          totalPriceYuan: p.priceYuan * p.quantity,
          exchangeRate: p.exchangeRate
        })),
        totalQuantity: supplierProducts.reduce((sum, p) => sum + p.quantity, 0),
        totalPriceYuan: supplierProducts.reduce((sum, p) => sum + (p.priceYuan * p.quantity), 0),
        createdAt: serverTimestamp(),
        createdBy: user?.email,
        userId: user?.uid,
        status: 'pending'
      };

      await addDoc(collection(firestore, 'checks'), checkData);
      setCompletedSuppliers(prev => [...prev, supplier]);
      setSelectedSupplier(null);
      Alert.alert('Успех', 'Закупка завершена и чек сохранен');
    } catch (error) {
      console.error('Error completing supplier products:', error);
      Alert.alert('Ошибка', 'Не удалось обработать товары поставщика');
    }
  };

  const handleSupplierArrived = async (supplier: string, products: Product[]) => {
    try {
      // Add each product to the warehouse collection individually
      for (const product of products) {
        const warehouseData = {
          name: product.name || '',
          code: product.code || '',
          color: product.color || '',
          size: product.size || '',
          quantity: product.quantity || 0,
          priceYuan: product.priceYuan || 0,
          priceTenge: product.priceTenge || 0,
          totalPriceYuan: (product.priceYuan || 0) * (product.quantity || 0),
          exchangeRate: product.exchangeRate || 0,
          supplier: supplier || 'Unknown',
          createdAt: serverTimestamp(),
          createdBy: user?.email || 'unknown',
          userId: user?.uid || '',
          purchaseRef: product.id // Reference to original purchase document
        };

        // Add to warehouse collection
        await addDoc(collection(firestore, 'warehouse'), warehouseData);

        // Update the purchase document
        if (product.id) {
          const productRef = doc(firestore, 'purchases', product.id);
          await updateDoc(productRef, {
            isArchived: true
          });
        }
      }

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          products.some(p => p.id === product.id)
            ? { ...product, isArchived: true }
            : product
        )
      );

      Alert.alert('Успех', 'Все товары успешно добавлены на склад');
    } catch (error) {
      console.error('Error updating supplier products:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус товаров');
    }
  };

  const handleAddProduct = (supplier: string) => {
    setSelectedSupplier(supplier);
    setShowAddForm(true);
  };

  if (showAddForm && selectedSupplier) {
    return (
      <View style={styles.container}>
        <AddProductForm 
          product={{ supplier: selectedSupplier }} 
          onBack={() => {
            setSelectedSupplier(null);
            setShowAddForm(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(groupProductsBySupplier(products))}
        keyExtractor={([supplier]) => supplier}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchProducts();
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: [supplier, supplierProducts] }) => (
          <View style={styles.supplierGroup}>
            <View style={styles.supplierHeader}>
              <Text style={styles.supplierName}>{supplier}</Text>
            </View>
            {supplierProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>Код: {product.code}</Text>
                  <Text style={styles.productDetails}>Цвет: {product.color}</Text>
                  <Text style={styles.productDetails}>Размер: {product.size}</Text>
                  <View style={styles.priceDetails}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Количество:</Text>
                      <Text style={styles.priceValue}>{product.quantity}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Цена (юань):</Text>
                      <Text style={styles.priceValue}>¥ {product.priceYuan}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Цена (тенге):</Text>
                      <Text style={styles.priceValue}>₸ {product.priceTenge}</Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Итого:</Text>
                      <Text style={styles.totalValue}>¥ {(product.priceYuan * product.quantity).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
                {!product.isArchived && completedSuppliers.includes(supplier) && (
                  <TouchableOpacity
                    style={styles.arrivedButton}
                    onPress={() => handleArrived(product.id)}
                  >
                    <Text style={styles.arrivedButtonText}>Прибыл</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={styles.supplierFooter}>
              {!completedSuppliers.includes(supplier) && !showAddForm && (
                <View style={{ position: 'relative', marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: '#4CAF50', position: 'absolute', bottom: -18, right: 15, zIndex: 1 }]}
                    onPress={() => handleAddProduct(supplier)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.supplierTotal}>
                <Text style={styles.supplierTotalLabel}>Общая сумма:</Text>
                <Text style={styles.supplierTotalValue}>
                  ¥ {supplierProducts.reduce((total, product) => total + (product.priceYuan * product.quantity), 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.footerButtons}>
                {supplierProducts.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => 
                      completedSuppliers.includes(supplier)
                        ? handleSupplierArrived(supplier, supplierProducts)
                        : handleSupplierCompletion(supplier)
                    }
                    style={[styles.completeButton, 
                      completedSuppliers.includes(supplier) && { backgroundColor: '#4CAF50' }
                    ]}
                  >
                    <Text style={styles.completeButtonText}>
                      {completedSuppliers.includes(supplier) ? 'Прибыл' : 'Закрыть чек'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    width: '100%',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    flex: 1,
    width: '100%'
  },
  listContent: {
    paddingVertical: 15
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333'
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  priceDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  priceLabel: {
    fontSize: 14,
    color: '#666'
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3'
  },
  supplierTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3'
  },
  supplierTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  supplierTotal: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 15
  },
  arrivedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10
  },
  arrivedButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  supplierGroup: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: 500,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8
  },
  supplierFooter: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    width: '100%'
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -75,
    left: '50%',
    marginLeft: -180,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1
  },
  addButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold'
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
});