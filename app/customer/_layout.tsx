import React, { useState, useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart } from '../../src/context/CartContext';

const CustomerHeaderRight = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userName').then(name => setUserName(name || 'Khách'));
  }, []);

  const handleLogout = () => {
    const confirmLogout = async () => {
      await AsyncStorage.clear();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn muốn đăng xuất?')) confirmLogout();
    } else {
      Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: confirmLogout }
      ]);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
      <Text style={{ color: '#ea580c', marginRight: 8, fontWeight: 'bold' }}>Chào, {userName}</Text>
      <Ionicons name="log-out-outline" size={22} color="#ff4d4f" />
    </TouchableOpacity>
  );
};

const CartTabIcon = ({ color }: { color: string }) => {
  const { cartCount } = useCart(); 
  
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="cart-outline" size={24} color={color} />
      {cartCount > 0 ? (
        <View style={{ 
          position: 'absolute', top: -6, right: -10, 
          backgroundColor: '#ff4d4f', borderRadius: 10, 
          minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{cartCount}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default function CustomerLayout() {
  const isWeb = Platform.OS === 'web';

  return (
    <CartProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ea580c',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
          headerStyle: { 
            backgroundColor: '#fff',
            height: isWeb ? 70 : undefined,
          },
          headerTintColor: '#ea580c',
          headerTitleAlign: 'left',
          headerTitleStyle: { fontWeight: 'bold', fontSize: isWeb ? 22 : 18 },
          tabBarStyle: {
            height: isWeb ? 70 : 60,
            paddingBottom: isWeb ? 15 : 10,
            paddingTop: isWeb ? 10 : 5,
          },
          tabBarLabelStyle: {
            fontSize: isWeb ? 14 : 12,
            fontWeight: '600',
          },
          headerRight: () => <CustomerHeaderRight />,
        }}
      >
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'Thực đơn', 
            tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={isWeb ? 26 : 24} color={color} /> 
          }} 
        />
        <Tabs.Screen 
          name="cart" 
          options={{ 
            title: 'Giỏ hàng', 
            tabBarIcon: ({ color }) => <CartTabIcon color={color} /> 
          }} 
        />
        <Tabs.Screen 
          name="orders" 
          options={{ 
            title: 'Lịch sử đặt', 
            tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={isWeb ? 26 : 24} color={color} /> 
          }} 
        />
      </Tabs>
    </CartProvider>
  );
}