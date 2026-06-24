import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine.
// iOS simulator can use localhost. Physical device needs your machine's LAN IP.
const HOST = Platform.OS === 'android' ? '192.168.1.10' : 'localhost';
const BASE_URL = `http://${HOST}:3000/api/v1`;
console.log(`[API] Platform: ${Platform.OS} | BASE_URL: ${BASE_URL}`);

// Matches the test church seeded by seeders (INT AUTO_INCREMENT)
const DEFAULT_CHURCH_ID = '1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Church-ID': DEFAULT_CHURCH_ID,
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const churchId = await AsyncStorage.getItem('church_id');
  if (churchId) {
    config.headers['X-Church-ID'] = churchId;
  }
  console.log(`[API REQ] ${config.method?.toUpperCase()} ${config.baseURL}${config.url} | churchId: ${churchId || 'default'} | hasToken: ${!!token}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API RES] ${response.config.method?.toUpperCase()} ${response.config.url} | status: ${response.status}`);
    return response.data;
  },
  async (error) => {
    if (error.response) {
      console.error(`[API ERR] ${error.config?.method?.toUpperCase()} ${error.config?.url} | status: ${error.response.status} | data:`, error.response.data);
    } else if (error.request) {
      console.error(`[API ERR] No response received | ${error.config?.url} | message: ${error.message}`);
    } else {
      console.error(`[API ERR] Request setup failed: ${error.message}`);
    }
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default apiClient;
