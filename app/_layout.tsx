import { Slot } from 'expo-router';
import { CartProvider } from '../src/context/CartContext';

export default function RootLayout() {
  return (
    <CartProvider>
      <Slot /> 
    </CartProvider>
  );
}