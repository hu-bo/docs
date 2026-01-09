import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { type APIResponse } from '@/types';

const config: AxiosRequestConfig = {
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
};

const instance: AxiosInstance = axios.create(config);

instance.interceptors.response.use(
  (response: AxiosResponse<APIResponse>) => {
    const { code, data, message } = response.data;
    if (code === 0) {
      return data;
    } else {
      // Handle business errors
      console.error(`API Error: ${message} (Code: ${code})`);
      return Promise.reject(new Error(message || 'Error'));
    }
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Redirect to login or handle unauthorized
        console.warn('Unauthorized, please login.');
        // window.location.href = '/login'; // Adjust as needed
      } else if (status === 403) {
        console.warn('Access denied.');
      } else if (status === 404) {
        console.warn('Resource not found.');
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
