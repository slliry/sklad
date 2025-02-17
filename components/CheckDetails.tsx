import React from 'react';
import { StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Text, View } from './Themed';
import Colors from '../constants/Colors';

interface Product {
  name: string;
  code: string;
  color: string;
  size: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  totalPriceYuan: number;
  exchangeRate: number;
}

interface CheckDetailsProps {
  check: {
    supplier: string;
    products: Product[];
    totalQuantity: number;
    totalPriceYuan: number;
    createdAt: Date;
    createdBy: string;
  };
}

export default function CheckDetails({ check }: CheckDetailsProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={styles.supplier}>{check.supplier}</Text>
        <Text style={styles.date}>
          {check.createdAt.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Общее количество:</Text>
          <Text style={styles.summaryValue}>{check.totalQuantity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Общая сумма:</Text>
          <Text style={styles.summaryValue}>¥ {check.totalPriceYuan.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Создал:</Text>
          <Text style={styles.summaryValue}>{check.createdBy}</Text>
        </View>
      </View>

      <View style={styles.productsContainer}>
        <Text style={styles.productsTitle}>Товары</Text>
        {check.products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.productDetails}>
              <Text style={styles.productInfo}>Код: {product.code}</Text>
              <Text style={styles.productInfo}>Цвет: {product.color}</Text>
              <Text style={styles.productInfo}>Размер: {product.size}</Text>
            </View>
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
                <Text style={styles.totalValue}>
                  ¥ {(product.priceYuan * product.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  supplier: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  summary: {
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  productsContainer: {
    padding: 20,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  productDetails: {
    marginBottom: 15,
  },
  productInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  priceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
});