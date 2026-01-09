<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Eye, Users } from 'lucide-vue-next';
import type { Folder, FolderVisibility } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  folder: Folder | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save': [data: { folderId: string; visibilityScope: FolderVisibility }];
}>();

const form = reactive({
  visibilityScope: 'ALL' as FolderVisibility,
});

const saving = ref(false);

watch(() => props.modelValue, (visible) => {
  if (visible && props.folder) {
    form.visibilityScope = props.folder.visibilityScope;
  }
});

function closeModal() {
  emit('update:modelValue', false);
}

async function handleSave() {
  if (!props.folder) return;

  saving.value = true;
  try {
    emit('save', {
      folderId: props.folder.documentId,
      visibilityScope: form.visibilityScope,
    });
    closeModal();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">文件夹权限设置</h3>

      <div class="py-4">
        <div class="alert mb-4">
          <span>文件夹: <strong>{{ folder?.name }}</strong></span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">可见范围</span>
          </label>

          <div class="space-y-2">
            <label class="label cursor-pointer justify-start gap-4 border rounded-lg p-4" :class="{ 'border-primary bg-primary/10': form.visibilityScope === 'ALL' }">
              <input type="radio" v-model="form.visibilityScope" value="ALL" class="radio radio-primary" />
              <Eye class="w-5 h-5" />
              <div>
                <p class="font-medium">所有人可见</p>
                <p class="text-xs opacity-60">空间内所有成员都可以看到此文件夹</p>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-4 border rounded-lg p-4" :class="{ 'border-warning bg-warning/10': form.visibilityScope === 'DEPT_ONLY' }">
              <input type="radio" v-model="form.visibilityScope" value="DEPT_ONLY" class="radio radio-warning" />
              <Users class="w-5 h-5" />
              <div>
                <p class="font-medium">仅部门可见</p>
                <p class="text-xs opacity-60">只有指定部门的成员可以看到此文件夹</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="closeModal">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          保存
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>
