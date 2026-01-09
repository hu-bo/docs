<script setup lang="ts">
import { computed } from 'vue';
import { Users } from 'lucide-vue-next';
import type { CollaborationUser } from '@/types';

const props = defineProps<{
  users: CollaborationUser[];
  maxVisible?: number;
}>();

const maxVisible = computed(() => props.maxVisible || 5);

const visibleUsers = computed(() => {
  return props.users.slice(0, maxVisible.value);
});

const remainingCount = computed(() => {
  return Math.max(0, props.users.length - maxVisible.value);
});

function getInitial(user: CollaborationUser): string {
  const name = user.displayName || user.username;
  return name ? name.charAt(0).toUpperCase() : '?';
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="avatar-group -space-x-4">
      <div
        v-for="user in visibleUsers"
        :key="user.username"
        class="avatar placeholder tooltip"
        :data-tip="user.displayName || user.username"
      >
        <div
          v-if="user.avatar"
          class="w-8 rounded-full ring ring-offset-base-100 ring-offset-1"
          :style="{ '--tw-ring-color': user.color }"
        >
          <img :src="user.avatar" :alt="user.displayName || user.username" />
        </div>
        <div
          v-else
          class="w-8 rounded-full text-neutral-content"
          :style="{ backgroundColor: user.color }"
        >
          <span class="text-xs">{{ getInitial(user) }}</span>
        </div>
      </div>

      <div v-if="remainingCount > 0" class="avatar placeholder">
        <div class="bg-neutral text-neutral-content w-8 rounded-full">
          <span class="text-xs">+{{ remainingCount }}</span>
        </div>
      </div>
    </div>

    <div class="badge badge-ghost gap-1">
      <Users class="w-3 h-3" />
      {{ users.length }} 在线
    </div>
  </div>
</template>
