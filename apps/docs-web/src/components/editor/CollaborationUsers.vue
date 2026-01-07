<script setup lang="ts">
import { computed } from 'vue';
import { Avatar, Tooltip } from 'ant-design-vue';
import type { CollaborationUser } from '@/composables/useCollaboration';

interface Props {
  users: CollaborationUser[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  maxDisplay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 5,
});

// 显示的用户（最多 maxDisplay 个）
const displayUsers = computed(() => props.users.slice(0, props.maxDisplay));

// 剩余用户数量
const remainingCount = computed(() =>
  Math.max(0, props.users.length - props.maxDisplay)
);

// 连接状态文字
const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中...';
    case 'disconnected':
      return '未连接';
    default:
      return '';
  }
});
</script>

<template>
  <div class="collaboration-users">
    <!-- 连接状态指示器 -->
    <div class="connection-status">
      <span
        class="status-dot"
        :class="connectionStatus"
      />
      <span class="status-text">{{ statusText }}</span>
    </div>

    <!-- 在线用户头像 -->
    <div v-if="users.length > 0" class="users-list">
      <Tooltip
        v-for="user in displayUsers"
        :key="user.clientId"
        :title="user.name"
      >
        <Avatar
          :style="{ backgroundColor: user.color, border: '2px solid #fff' }"
          :src="user.avatar"
          :size="28"
        >
          {{ user.name?.charAt(0)?.toUpperCase() }}
        </Avatar>
      </Tooltip>

      <!-- 剩余用户数量 -->
      <Tooltip v-if="remainingCount > 0" :title="`还有 ${remainingCount} 人在线`">
        <Avatar
          :size="28"
          :style="{ backgroundColor: '#999', border: '2px solid #fff' }"
        >
          +{{ remainingCount }}
        </Avatar>
      </Tooltip>

      <span class="user-count">{{ users.length }} 人在线</span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.collaboration-users {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.connected {
      background: #52c41a;
    }

    &.connecting {
      background: #faad14;
      animation: pulse 1s infinite;
    }

    &.disconnected {
      background: #ff4d4f;
    }
  }

  .status-text {
    white-space: nowrap;
  }
}

.users-list {
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(.ant-avatar) {
    cursor: default;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:not(:first-child) {
      margin-left: -8px;
    }
  }

  .user-count {
    margin-left: 8px;
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
