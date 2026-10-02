import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cloudcart_cart_items_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to persist cart items to localStorage', err);
    }
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.productId) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.productId === product.productId);
      if (existingIndex > -1) {
        const next = [...prevItems];
        const newQty = next[existingIndex].quantity + quantity;
        const availableStock = product.stock || 999;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(newQty, availableStock),
        };
        return next;
      } else {
        return [...prevItems, { product, quantity: Math.min(quantity, product.stock || 999) }];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.productId === productId) {
          const availableStock = item.product.stock || 999;
          return { ...item, quantity: Math.min(newQuantity, availableStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.product.price) || 0;
    return sum + price * item.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        tax,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
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
