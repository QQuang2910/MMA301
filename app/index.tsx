import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/config/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    try {
      setLoading(true);
      // Gọi API sang Backend (đã có Ngrok lo phần đường truyền)
      const res = await api.post('/auth/login', {
        username,
        password,
      });

      const { token, user } = res.data.data;

      // Lưu Token và Role vào bộ nhớ điện thoại
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', user.role);
      await AsyncStorage.setItem('userName', user.name);

      Alert.alert('Thành công', `Chào mừng ${user.name} trở lại! 🎉`);

      // Chuyển hướng dựa theo role
      if (user.role === 'admin') {
        router.replace('/admin/home'); // Sẽ tạo sau
      } else {
        router.replace('/customer/home'); // Sẽ tạo sau
      }

    } catch (error: any) {
      // In ra console để theo dõi
      console.log('LỖI ĐĂNG NHẬP:', error);
      
      // Bắt chính xác thông báo lỗi từ Backend hoặc từ Axios
      const errMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
      
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Đăng nhập thất bại', errMsg); // Nó sẽ hiện đúng lỗi thật ở đây!
      }
    }
  };

  return (
    // SafeAreaView lúc này đã có sức mạnh chống "tai thỏ" và "thanh vuốt đáy"
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Tiêu đề */}
        <Text style={styles.title}>F&B Order</Text>
        <Text style={styles.subtitle}>Đăng nhập để đặt món ngay!</Text>

        {/* Form nhập liệu */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Mã hóa mật khẩu thành dấu sao
          />

          {/* Nút Đăng nhập */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Nút chuyển sang trang Đăng ký */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// CSS Style cho Mobile (Flexbox)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B00', // Tông màu cam đặc trưng của ngành F&B
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 16, // Khoảng cách giữa các ô input
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: '#666',
  },
  signupText: {
    fontSize: 15,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
});