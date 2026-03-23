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
import { Ionicons } from '@expo/vector-icons'; // Import icon con mắt
import api from '../src/config/api';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State quản lý việc ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu nhập lại không khớp!');
      return;
    }

    try {
      setLoading(true);
      
      await api.post('/auth/register', {
        name,
        username,
        email,
        password,
      });

      // Xử lý thông báo và chuyển trang tương thích cả Web lẫn Mobile
      if (Platform.OS === 'web') {
        window.alert('Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.');
        router.replace('/'); // Trở về trang đăng nhập
      } else {
        Alert.alert('Thành công', 'Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.', [
          { text: 'OK', onPress: () => router.replace('/') } 
        ]);
      }

    } catch (error: any) {
      console.log('Lỗi đăng ký:', error.response?.data || error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Đăng ký thất bại', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Bắt đầu hành trình ẩm thực của bạn!</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên (VD: Quang)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email (VD: quang@gmail.com)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Ô nhập Mật khẩu có nút Mắt */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword} // Đảo ngược giá trị state
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Ô nhập lại Mật khẩu có nút Mắt */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 40, left: 24, padding: 8 },
  backButtonText: { fontSize: 16, color: '#666' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ea580c', marginBottom: 8, marginTop: 40 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  form: { gap: 16 },
  input: { 
    backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12, 
    fontSize: 16, borderWidth: 1, borderColor: '#eee' 
  },
  
  // Style cho ô chứa mật khẩu
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },

  signupButton: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});