<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import { updateFolder } from '@/api/space';
import type { Folder } from '@/types';

const props = defineProps<{
  visible: boolean;
  folder: Folder | null;
  spaceId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const form = ref({
  visibilityScope: 'ALL' as 'ALL' | 'DEPT_ONLY',
});

watch(() => props.folder, (folder) => {
  if (folder) {
    form.value.visibilityScope = folder.visibilityScope || 'ALL';
  }
}, { immediate: true });

function handleCancel() {
  emit('update:visible', false);
}

async function handleOk() {
  if (!props.folder) return;

  loading.value = true;
  try {
    await updateFolder(props.spaceId, props.folder.id, {
      visibilityScope: form.value.visibilityScope,
    });
    message.success('更新成功');
    emit('update:visible', false);
    emit('success');
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :open="visible"
    title="文件夹权限设置"
    :confirm-loading="loading"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <FormItem label="文件夹名称">
        <Input :value="folder?.name" disabled />
      </FormItem>
      <FormItem label="可见范围">
        <Select v-model:value="form.visibilityScope">
          <SelectOption value="ALL">全员可见</SelectOption>
          <SelectOption value="DEPT_ONLY">仅空间内可见</SelectOption>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>
