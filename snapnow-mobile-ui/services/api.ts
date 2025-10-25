import axios, { AxiosError, AxiosInstance } from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://your-production-api.com/api/v1'; 


const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const token = await currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (__DEV__) {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ API Response: ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.error(`❌ API Error: ${error.config?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('🔒 Unauthorized: Token expired or invalid');
          break;
          
        case 403:
          console.error('⛔ Forbidden: No permission');
          break;
          
        case 404:
          console.error('🔍 Not Found:', error.config?.url);
          break;
          
        case 429:
          console.error('⏱️ Rate limit exceeded');
          break;
          
        case 500:
          console.error('💥 Server Error');
          break;
          
        default:
          console.error(`⚠️ Error ${status}:`, data);
      }
    } else if (error.request) {
      console.error('📡 Network Error: No response received');
    } else {
      console.error('⚙️ Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);


export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    switch (axiosError.response?.status) {
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy tài nguyên.';
      case 429:
        return 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.';
      case 500:
        return 'Lỗi máy chủ. Vui lòng thử lại sau.';
      default:
        return axiosError.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Có lỗi không xác định xảy ra.';
};


export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
};

export const getBackendUrl = (): string => {
  return API_BASE_URL;
};

export default apiClient;
