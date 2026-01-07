import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as userApi from '@/api/user';
import type { OAUserInfo } from '@/api/user';

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<OAUserInfo | null>(null);
  const loading = ref(false);
  const mockUsers = ref<string[]>([]);
  const isDev = ref(import.meta.env.DEV);

  // 计算属性
  const isLoggedIn = computed(() => !!userInfo.value);
  const displayName = computed(() => userInfo.value?.nick_name || userInfo.value?.name || '');
  const avatar = computed(() => userInfo.value?.avatar || '');
  const username = computed(() => userInfo.value?.login_id || userInfo.value?.name || '');

  // 操作
  async function fetchCurrentUser() {
    loading.value = true;
    try {
      userInfo.value = await userApi.getCurrentUser();
    } catch (error) {
      userInfo.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMockUsers() {
    if (!isDev.value) return;
    try {
      mockUsers.value = await userApi.getMockUsers();
    } catch {
      mockUsers.value = [];
    }
  }

  async function switchUser(targetUsername: string) {
    if (!isDev.value) return;
    loading.value = true;
    try {
      await userApi.switchMockUser(targetUsername);
      await fetchCurrentUser();
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    userInfo.value = null;
    // 生产环境跳转到登录页
    if (!isDev.value) {
      window.location.href = '/login';
    }
  }

  function clearUser() {
    userInfo.value = null;
  }

  return {
    // 状态
    userInfo,
    loading,
    mockUsers,
    isDev,
    // 计算属性
    isLoggedIn,
    displayName,
    avatar,
    username,
    // 操作
    fetchCurrentUser,
    fetchMockUsers,
    switchUser,
    logout,
    clearUser,
  };
});
