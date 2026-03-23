import React, { createContext, useState, useContext, ReactNode } from 'react';

type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: any;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any) => void;
  updateQuantity: (id: string, type: 'inc' | 'dec') => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number; 
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.productId === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, type: 'inc' | 'dec') => {
    setCart(
      cart.map((item) =>
        item.productId === id
          ? {
              ...item,
              quantity: type === 'inc' ? item.quantity + 1 : Math.max(1, item.quantity - 1),
            }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.productId !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng trong CartProvider');
  return context;
};