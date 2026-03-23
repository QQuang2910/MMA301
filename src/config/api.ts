import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const baseURL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : 'https://unedifying-approximal-ira.ngrok-free.dev/api'; // Hãy chắc chắn đây là link mới nhất nhé

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    // Ép Ngrok bỏ qua trang cảnh báo 100% bằng combo 3 thẻ này
    'ngrok-skip-browser-warning': '69420', // Đôi khi Ngrok đòi giá trị số này thay vì 'true'
    'Bypass-Tunnel-Reminder': 'true',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use(async (config) => {
  if (config.url && !config.url.includes('/auth/')) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;