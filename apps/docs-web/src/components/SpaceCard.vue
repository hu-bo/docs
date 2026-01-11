<script setup lang="ts">
import { Folder, FileText, Clock } from 'lucide-vue-next';
import type { Component } from 'vue';

export interface SpaceItem {
  id: string;
  title: string;
  folderCount: number;
  docCount: number;
  // time: string;
  icon: Component;
  bgColor: string;
  iconColor: string;
}

defineProps<{
  item: SpaceItem;
}>();
</script>

<template>
  <div class="card bg-base-100 shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
    <div class="card-body p-5">
      <div class="flex items-start gap-4">
        <div :class="`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bgColor}`">
          <component :is="item.icon" :class="`w-6 h-6 ${item.iconColor}`" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="card-title text-base truncate">{{ item.title }}</h3>
          <div class="flex items-center gap-4 text-xs opacity-60 mt-2">
            <span class="flex items-center gap-1">
              <Folder class="w-3.5 h-3.5" />
              {{ item.folderCount }}
            </span>
            <span class="flex items-center gap-1">
              <FileText class="w-3.5 h-3.5" />
              {{ item.docCount }}
            </span>
            <!-- <span class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              {{ item.time }}
            </span> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
