<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { FolderKanban, User } from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import { useUserStore } from '@/stores/user';
import type { SpaceType } from '@/types';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [];
}>();

const spaceStore = useSpaceStore();
const userStore = useUserStore();
const form = reactive({
  name: '',
  codeName: '',
  spaceType: 1 as SpaceType,
  deptId: userStore.deptId,
});

const creating = ref(false);
const error = ref('');

watch(() => props.modelValue, (visible) => {
  if (visible) {
    form.name = '';
    form.codeName = '';
    form.spaceType = 1;
    error.value = '';
  }
});

function closeModal() {
  emit('update:modelValue', false);
}

async function handleCreate() {
  if (!form.name.trim()) {
    error.value = '请输入空间名称';
    return;
  }

  creating.value = true;
  error.value = '';

  try {
    await spaceStore.createSpace({
      name: form.name.trim(),
      codeName: form.codeName.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
      spaceType: form.spaceType,
      deptId: form.deptId
    });

    emit('success');
    closeModal();
  } catch (err) {
    error.value = (err as Error).message || '创建失败，请重试';
    console.error('Failed to create space:', err);
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">创建空间</h3>

      <form @submit.prevent="handleCreate" class="py-4 space-y-4">
        <!-- Space Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">空间名称 *</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="输入空间名称"
            class="input input-bordered"
            maxlength="50"
          />
        </div>

        <!-- Code Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">标识名称（可选）</span>
          </label>
          <input
            v-model="form.codeName"
            type="text"
            placeholder="用于URL，留空则自动生成"
            class="input input-bordered"
            maxlength="50"
          />
          <label class="label">
            <span class="label-text-alt">建议使用小写字母和横线</span>
          </label>
        </div>

        <!-- Space Type -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">空间类型</span>
          </label>
          <div class="flex gap-4">
            <label class="label cursor-pointer flex-1 border rounded-lg p-4" :class="{ 'border-primary bg-primary/10': form.spaceType === 1 }">
              <div class="flex items-center gap-3">
                <input type="radio" v-model="form.spaceType" :value="1" class="radio radio-primary" />
                <FolderKanban class="w-5 h-5" />
                <div>
                  <p class="font-medium">公共空间</p>
                  <p class="text-xs opacity-60">团队协作共享</p>
                </div>
              </div>
            </label>

            <label class="label cursor-pointer flex-1 border rounded-lg p-4" :class="{ 'border-secondary bg-secondary/10': form.spaceType === 2 }">
              <div class="flex items-center gap-3">
                <input type="radio" v-model="form.spaceType" :value="2" class="radio radio-secondary" />
                <User class="w-5 h-5" />
                <div>
                  <p class="font-medium">个人空间</p>
                  <p class="text-xs opacity-60">私人知识库</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error">
          <span>{{ error }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" class="btn" @click="closeModal">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="creating">
            <span v-if="creating" class="loading loading-spinner loading-sm"></span>
            创建
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>
