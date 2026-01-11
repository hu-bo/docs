import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { type APIResponse } from '@/types';
import notification from '@/utils/notification';

const config: AxiosRequestConfig = {
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
};

const instance = axios.create(config);

/**
 * 封装的请求方法，自动解包 APIResponse 并处理业务错误
 */
export async function request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<APIResponse<T>> = await instance.request(requestConfig);
    const { code, data, message } = response.data;

    if (code === 0) {
      return data;
    }

    // 业务错误
    notification.error(message || 'Error');
    throw new Error(message || 'Error');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const message = (data as APIResponse)?.message || error.message;

      if (status === 401) {
        notification.warning('请先登录');
        // window.location.href = '/login';
      } else if (status === 403) {
        notification.warning('无访问权限');
      } else if (status === 404) {
        notification.error('资源不存在');
      } else {
        notification.error(message);
      }
    } else if (error instanceof Error && error.message) {
      // 业务错误已在上面处理，这里不重复通知
    }
    throw error;
  }
}

export default request;
