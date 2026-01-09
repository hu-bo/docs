<script setup lang="ts">
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式在 main.ts 中引入 */
</style>
