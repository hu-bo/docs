<script setup lang="ts">
import { FileText, FolderOpen, Clock } from 'lucide-vue-next';

export interface DocumentItem {
  id: string;
  title: string;
  path: string;
  tags: string[];
  time: string;
  type?: 'doc' | 'sheet';
}

defineProps<{
  item: DocumentItem;
}>();
</script>

<template>
  <div class="card bg-base-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full">
    <div class="card-body p-5">
      <div class="flex items-start gap-3">
        <div class="p-1.5 bg-primary/10 rounded-lg shrink-0">
          <FileText class="w-4 h-4 text-primary" />
        </div>
        <h3 class="card-title text-sm line-clamp-2">{{ item.title }}</h3>
      </div>

      <div class="flex items-center gap-2 text-xs opacity-50 mt-1">
        <FolderOpen class="w-3 h-3" />
        <span class="truncate">{{ item.path }}</span>
      </div>

      <div class="card-actions mt-auto pt-2">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(tag, idx) in item.tags"
            :key="idx"
            class="badge badge-sm badge-ghost"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-xs opacity-50">
        <Clock class="w-3 h-3" />
        <span>{{ item.time }}</span>
      </div>
    </div>
  </div>
</template>
