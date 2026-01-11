<script setup lang="ts">
import { notification } from '@/utils/notification';

const alertClass: Record<string, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};
</script>

<template>
  <div class="toast toast-top toast-end z-50">
    <TransitionGroup name="notification">
      <div
        v-for="n in notification.notifications.value"
        :key="n.id"
        class="alert shadow-lg"
        :class="alertClass[n.type]"
      >
        <span>{{ n.message }}</span>
        <button class="btn btn-ghost btn-xs" @click="notification.remove(n.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
