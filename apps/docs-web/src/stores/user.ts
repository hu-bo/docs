import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/types';
import * as userApi from '@/api/user';

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);
  const mockUsers = ref<UserInfo[]>([]);
  const isDev = ref(import.meta.env.DEV);

  // Computed
  const isLoggedIn = computed(() => !!userInfo.value);
  const displayName = computed(() => userInfo.value?.nick_name || userInfo.value?.nick_name || '');
  const avatar = computed(() => userInfo.value?.avatar || '');
  const username = computed(() => userInfo.value?.name || '');
  const deptId = computed(() => userInfo.value?.dept_id || 0);
  // Actions
  async function fetchCurrentUser() {
    loading.value = true;
    try {
      const data = await userApi.getCurrentUser();
      userInfo.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      userInfo.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMockUsers() {
    if (!isDev.value) return [];
    try {
      const data = await userApi.getMockUsers();
      mockUsers.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch mock users:', error);
      return [];
    }
  }

  async function switchUser(targetUsername: string) {
    if (!isDev.value) return;
    try {
      await userApi.switchMockUser(targetUsername);
      await fetchCurrentUser();
    } catch (error) {
      console.error('Failed to switch user:', error);
      throw error;
    }
  }

  async function useRealAccount() {
    if (!isDev.value) return;
    try {
      const data = await userApi.clearMockUser();
      userInfo.value = data;
      return data;
    } catch (error) {
      console.error('Failed to switch to real account:', error);
      throw error;
    }
  }

  function logout() {
    userInfo.value = null;
  }

  return {
    // State
    userInfo,
    loading,
    mockUsers,
    isDev,
    // Computed
    deptId,
    isLoggedIn,
    displayName,
    avatar,
    username,
    // Actions
    fetchCurrentUser,
    fetchMockUsers,
    switchUser,
    useRealAccount,
    logout,
  };
});
