<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Home, FolderKanban, Sun } from 'lucide-vue-next';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const showMockUserSelect = ref(false);

onMounted(async () => {
  try {
    await userStore.fetchCurrentUser();
    if (userStore.isDev) {
      await userStore.fetchMockUsers();
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
});

const userInitial = computed(() => {
  const name = userStore.displayName || userStore.username;
  return name ? name.charAt(0).toUpperCase() : 'U';
});

async function handleSwitchUser(username: string) {
  try {
    await userStore.switchUser(username);
    showMockUserSelect.value = false;
  } catch (error) {
    console.error('Failed to switch user:', error);
  }
}

async function handleUseRealAccount() {
  try {
    await userStore.useRealAccount();
    showMockUserSelect.value = false;
  } catch (error) {
    console.error('Failed to switch to real account:', error);
  }
}

function handleLogout() {
  userStore.logout();
  router.push('/');
}

const navItems = [
  { name: '首页', path: '/', icon: Home },
  { name: '空间', path: '/spaces', icon: FolderKanban },
];
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Navbar -->
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div class="navbar-start">
        <router-link to="/" class="btn btn-ghost text-xl gap-2">
          <Sun class="w-6 h-6 text-warning" />
          <span class="font-bold">向日葵文档</span>
        </router-link>
      </div>

      <div class="navbar-center hidden md:flex">
        <ul class="menu menu-horizontal px-1">
          <li v-for="item in navItems" :key="item.path">
            <router-link :to="item.path" class="gap-2">
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.name }}
            </router-link>
          </li>
        </ul>
      </div>

      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
            <div v-if="userStore.avatar" class="w-10 rounded-full">
              <img :src="userStore.avatar" :alt="userStore.displayName" />
            </div>
            <div v-else class="bg-primary text-primary-content w-10 rounded-full">
              <span>{{ userInitial }}</span>
            </div>
          </div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg">
            <li class="menu-title">
              <span>{{ userStore.userInfo?.nick_name || userStore.userInfo?.name || '未登录' }}</span>
            </li>

            <!-- Dev Mode: Mock User Switcher -->
            <template v-if="userStore.isDev && userStore.mockUsers.length > 0">
              <li>
                <details>
                  <summary>切换用户 (Dev)</summary>
                  <ul>
                    <li>
                      <a @click="handleUseRealAccount" class="text-info">
                        真实账户
                      </a>
                    </li>
                    <li v-for="mockUser in userStore.mockUsers" :key="mockUser.name">
                      <a
                        @click="handleSwitchUser(mockUser.name)"
                        :class="{ 'active': mockUser.name === userStore.username }"
                      >
                        {{ mockUser.nick_name || mockUser.name }}
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
            </template>

            <div class="divider my-0"></div>
            <li><a @click="handleLogout" class="text-error">退出登录</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>
  </div>
</template>
