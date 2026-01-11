<script setup lang="ts">
import NotificationToast from '@/components/NotificationToast.vue';
</script>

<template>
  <div>
    <router-view />
    <NotificationToast />
  </div>
</template>

<style>
/* 全局样式在 main.ts 中引入 */
</style>
