<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Result,
  Button,
  Form,
  FormItem,
  Input,
  message,
} from 'ant-design-vue';
import { LockOutlined } from '@ant-design/icons-vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { applyAccess } from '@/api/access';
import { useSpaceStore } from '@/stores/space';

const router = useRouter();
const spaceStore = useSpaceStore();

const reason = ref('');
const submitting = ref(false);

async function handleApply() {
  if (!reason.value.trim()) {
    message.warning('请填写申请理由');
    return;
  }

  if (!spaceStore.currentSpace) {
    message.error('空间信息加载失败');
    return;
  }

  submitting.value = true;
  try {
    await applyAccess({
      type: 'space',
      targetId: spaceStore.currentSpace.id,
      requestedPerm: 'read',
      reason: reason.value,
    });
    message.success('申请已提交，请等待管理员审批');
    router.push('/spaces');
  } catch {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <MainLayout>
    <div class="access-denied-page">
      <Result status="403" title="无权访问">
        <template #icon>
          <LockOutlined />
        </template>
        <template #subTitle>
          <p>您没有访问此空间的权限</p>
          <p>请填写申请理由，等待管理员审批</p>
        </template>
        <template #extra>
          <Form layout="vertical" class="apply-form">
            <FormItem label="申请理由">
              <Input.TextArea
                v-model:value="reason"
                :rows="4"
                placeholder="请说明您需要访问此空间的原因"
              />
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                :loading="submitting"
                @click="handleApply"
              >
                提交申请
              </Button>
              <Button class="ml-md" @click="router.push('/spaces')">
                返回空间列表
              </Button>
            </FormItem>
          </Form>
        </template>
      </Result>
    </div>
  </MainLayout>
</template>

<style lang="less" scoped>
.access-denied-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 24px;
}

.apply-form {
  max-width: 400px;
  margin: 0 auto;
  text-align: left;
}
</style>
