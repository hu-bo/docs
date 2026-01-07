<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Result, Button } from 'ant-design-vue';
import MainLayout from '@/layouts/MainLayout.vue';

const router = useRouter();
</script>

<template>
  <MainLayout>
    <div class="not-found-page">
      <Result
        status="404"
        title="404"
        sub-title="抱歉，您访问的页面不存在"
      >
        <template #extra>
          <Button type="primary" @click="router.push('/')">
            返回首页
          </Button>
        </template>
      </Result>
    </div>
  </MainLayout>
</template>

<style lang="less" scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
}
</style>
