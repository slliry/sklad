import React, { createContext, useContext, useState } from 'react';

interface Product {
  id: string;
  name: string;
  code: string;
  color: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  createdAt: Date;
  supplier: string;
}

interface CartItem extends Product {
  selectedQuantity: number;
  sellingPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateItem: (itemId: string, quantity: number, price: number) => void;
  getGroupedItems: () => { [supplier: string]: CartItem[] };
  completeSupplierPurchase: (supplier: string) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateItem: () => {},
  getGroupedItems: () => ({}),
  completeSupplierPurchase: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const getGroupedItems = () => {
    return items.reduce((groups: { [supplier: string]: CartItem[] }, item) => {
      const supplier = item.supplier || 'Неизвестный';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(item);
      return groups;
    }, {});
  };

  const completeSupplierPurchase = (supplier: string) => {
    setItems(currentItems => currentItems.filter(item => item.supplier !== supplier));
  };

  const addToCart = (item: CartItem) => {
    console.log('Adding item to cart:', item);
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.id === item.id);
      if (existingItem) {
        return currentItems.map(i =>
          i.id === item.id
            ? { ...i, selectedQuantity: i.selectedQuantity + item.selectedQuantity }
            : i
        );
      }
      return [...currentItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const updateItem = (itemId: string, quantity: number, price: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId
          ? { ...item, selectedQuantity: quantity, sellingPrice: price }
          : item
      )
    );
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      updateItem,
      getGroupedItems,
      completeSupplierPurchase
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default {};