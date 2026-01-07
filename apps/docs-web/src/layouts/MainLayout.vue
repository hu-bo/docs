<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Layout,
  LayoutHeader,
  LayoutContent,
  Menu,
  MenuItem,
  Dropdown,
  Avatar,
  Modal,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import {
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  DownOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const selectedKeys = ref<string[]>(['home']);

// 切换账号弹窗
const switchModalVisible = ref(false);
const selectedMockUser = ref('');

onMounted(async () => {
  try {
    await userStore.fetchCurrentUser();
    if (userStore.isDev) {
      await userStore.fetchMockUsers();
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
  }
});

function handleMenuClick(info: { key: string | number }) {
  const key = String(info.key);
  switch (key) {
    case 'home':
      router.push('/');
      break;
    case 'spaces':
      router.push('/spaces');
      break;
  }
}

function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      userStore.logout();
      message.success('已退出登录');
    },
  });
}

function showSwitchModal() {
  selectedMockUser.value = userStore.username;
  switchModalVisible.value = true;
}

async function handleSwitchUser() {
  if (!selectedMockUser.value) {
    message.warning('请选择用户');
    return;
  }
  try {
    await userStore.switchUser(selectedMockUser.value);
    switchModalVisible.value = false;
    message.success(`已切换为用户: ${userStore.displayName}`);
    // 刷新页面以更新所有数据
    window.location.reload();
  } catch (error) {
    message.error('切换用户失败');
  }
}
</script>

<template>
  <Layout class="main-layout">
    <LayoutHeader class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <FileTextOutlined />
          <span class="logo-text">向日葵文档</span>
        </div>
        <Menu
          v-model="selectedKeys"
          mode="horizontal"
          theme="dark"
          class="nav-menu"
          @click="handleMenuClick"
        >
          <MenuItem key="home">
            <HomeOutlined />
            <span>首页</span>
          </MenuItem>
          <MenuItem key="spaces">
            <AppstoreOutlined />
            <span>空间</span>
          </MenuItem>
        </Menu>
        <div class="header-right">
          <Dropdown>
            <div class="user-info">
              <Avatar
                v-if="userStore.avatar"
                :src="userStore.avatar"
                :size="28"
              />
              <Avatar v-else :size="28">
                <template #icon><UserOutlined /></template>
              </Avatar>
              <span class="user-name">{{ userStore.displayName || '未登录' }}</span>
              <DownOutlined class="dropdown-icon" />
            </div>
            <template #overlay>
              <Menu>
                <MenuItem v-if="userStore.isDev" key="switch" @click="showSwitchModal">
                  <SwapOutlined />
                  <span>切换账号</span>
                </MenuItem>
                <MenuItem key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </div>
    </LayoutHeader>
    <LayoutContent class="content">
      <slot />
    </LayoutContent>

    <!-- 切换账号弹窗 (仅开发环境) -->
    <Modal
      v-model:open="switchModalVisible"
      title="切换账号"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleSwitchUser"
    >
      <div class="switch-modal-content">
        <p class="switch-tip">仅本地开发环境可用，用于模拟不同用户的效果</p>
        <Select
          v-model:value="selectedMockUser"
          style="width: 100%"
          placeholder="选择要切换的用户"
        >
          <SelectOption
            v-for="user in userStore.mockUsers"
            :key="user"
            :value="user"
          >
            {{ user }}
          </SelectOption>
        </Select>
      </div>
    </Modal>
  </Layout>
</template>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 24px;
  display: flex;
  align-items: center;

  .header-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    margin-right: 40px;

    .logo-text {
      white-space: nowrap;
    }
  }

  .nav-menu {
    flex: 1;
    background: transparent;
    border: none;
    line-height: 64px;
  }

  .header-right {
    margin-left: auto;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }

      .user-name {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dropdown-icon {
        font-size: 12px;
      }
    }
  }
}

.content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}

.switch-modal-content {
  .switch-tip {
    color: #999;
    font-size: 12px;
    margin-bottom: 16px;
  }
}
</style>
