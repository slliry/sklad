import { StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { View, Text } from '../../components/Themed';
import Colors from '../../constants/Colors';
import AddProductForm from '../../components/AddProductForm';
import FloatingActionButton from '../../components/FloatingActionButton';
import PurchaseList from '../../components/PurchaseList';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

export default function OrdersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [showForm, setShowForm] = useState(false);
  const [productToRepeat, setProductToRepeat] = useState(null);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {!showForm ? (
        <PurchaseList 
          onRepeatPurchase={(product) => {
            setShowForm(true);
            setProductToRepeat(product);
          }}
        />
      ) : (
        <View style={styles.formWrapper}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowForm(false)}
          >
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <AddProductForm product={productToRepeat} />
        </View>
      )}
      {!showForm && <FloatingActionButton onPress={() => setShowForm(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 0,
    marginLeft: 17,
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#000000',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 15,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10
  }
});
