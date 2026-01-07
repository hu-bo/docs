import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';
import type { ApiResponse } from '@/types';

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
});

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 解包 ApiResponse，直接返回 data.data
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const { data } = response;

    if (data.code === 0) {
      // 返回内部数据，类型会在调用处指定
      return data.data;
    }

    // 业务错误
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message));
  },
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          message.error('请先登录');
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  }
);

// 封装请求方法，使返回类型正确
const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config) as Promise<T>;
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config) as Promise<T>;
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config) as Promise<T>;
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config) as Promise<T>;
  },
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch(url, data, config) as Promise<T>;
  },
};

export default request;
