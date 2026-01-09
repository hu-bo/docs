<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Lock, Send, ArrowLeft } from 'lucide-vue-next';
import * as accessApi from '@/api/access';

const route = useRoute();
const router = useRouter();

const spaceId = computed(() => route.params.spaceId as string);
const reason = ref('');
const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!reason.value.trim()) {
    error.value = '请填写申请理由';
    return;
  }

  submitting.value = true;
  error.value = '';

  try {
    await accessApi.applyAccess({
      type: 'SPACE',
      targetId: spaceId.value,
      requestedPerm: 'READ',
      reason: reason.value.trim(),
    });

    submitted.value = true;
  } catch (err) {
    error.value = '提交失败，请重试';
    console.error('Failed to submit access request:', err);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/spaces');
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Success State -->
      <div v-if="submitted" class="text-center">
        <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send class="w-8 h-8 text-success" />
        </div>
        <h1 class="text-2xl font-bold mb-2">申请已提交</h1>
        <p class="opacity-60 mb-6">您的访问申请已提交，请等待管理员审批</p>
        <button class="btn btn-link" @click="goBack">
          <ArrowLeft class="w-4 h-4" />
          返回空间列表
        </button>
      </div>

      <!-- Request Form -->
      <div v-else class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock class="w-8 h-8 text-warning" />
            </div>
            <h1 class="text-2xl font-bold mb-2">无权访问</h1>
            <!-- <p class="opacity-60">此空间需要权限才能访问，请填写申请理由</p> -->
          </div>

          <!-- <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">申请理由</span>
              </label>
              <textarea
                v-model="reason"
                rows="4"
                placeholder="请说明您需要访问此空间的原因..."
                class="textarea textarea-bordered resize-none"
              ></textarea>
            </div>

            <div v-if="error" class="alert alert-error">
              <span>{{ error }}</span>
            </div>

            <div class="flex gap-3">
              <button type="button" class="btn flex-1" @click="goBack">返回</button>
              <button type="submit" class="btn btn-primary flex-1" :disabled="submitting">
                <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
                <span v-else>提交申请</span>
              </button>
            </div>
          </form> -->
        </div>
      </div>
    </div>
  </div>
</template>
