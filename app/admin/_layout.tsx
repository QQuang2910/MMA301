import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLayout() {
  const handleLogout = () => {
    const confirmLogout = async () => {
      await AsyncStorage.clear();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        confirmLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: confirmLogout }
      ]);
    }
  };

  // Tự động nhận diện nếu chạy trên Web thì phóng to giao diện
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: { 
          backgroundColor: '#ea580c',
          height: isWeb ? 80 : undefined, // Phóng to chiều cao Header trên Web
        },
        headerTitleStyle: {
          fontSize: isWeb ? 24 : 18, // Phóng to chữ tiêu đề
          fontWeight: 'bold',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        tabBarStyle: {
          height: isWeb ? 80 : 60, // Phóng to thanh Tab đáy trên Web
          paddingBottom: isWeb ? 15 : 10,
          paddingTop: isWeb ? 10 : 5,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 14 : 12, // Chữ ở tab to hơn
          fontWeight: 'bold',
        },
        // Nút đăng xuất được bọc lại thành một cục Button xịn xò
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleLogout} 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginRight: 24, 
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)', // Nền kính mờ
              borderRadius: 8 
            }}
          >
            <Text style={{ color: '#fff', marginRight: 8, fontWeight: 'bold', fontSize: isWeb ? 16 : 14 }}>
              Đăng xuất
            </Text>
            <Ionicons name="log-out-outline" size={isWeb ? 24 : 20} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Quản lý món', 
          tabBarIcon: ({ color }) => <Ionicons name="fast-food-outline" size={isWeb ? 28 : 24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="orders" 
        options={{ 
          title: 'Đơn hàng', 
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={isWeb ? 28 : 24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="customers" 
        options={{ 
          title: 'Khách hàng', 
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={isWeb ? 28 : 24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="productForm" 
        options={{ href: null, title: 'Chi tiết món ăn' }} 
      />
    </Tabs>
  );
}