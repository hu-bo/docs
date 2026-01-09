<script setup lang="ts">
import type { Component } from 'vue';

export interface CommunityItem {
  id: string;
  title: string;
  count: number;
  icon: Component;
  themeColor: string;
}

const props = defineProps<{
  item: CommunityItem;
}>();

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-info/10', text: 'text-info' },
  purple: { bg: 'bg-secondary/10', text: 'text-secondary' },
  emerald: { bg: 'bg-success/10', text: 'text-success' },
  orange: { bg: 'bg-warning/10', text: 'text-warning' },
  pink: { bg: 'bg-error/10', text: 'text-error' },
  cyan: { bg: 'bg-accent/10', text: 'text-accent' },
  amber: { bg: 'bg-warning/10', text: 'text-warning' },
  indigo: { bg: 'bg-primary/10', text: 'text-primary' },
};

const theme = colorMap[props.item.themeColor] || colorMap.blue;
</script>

<template>
  <div class="card bg-base-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">
    <div class="card-body p-4 flex-row items-center gap-4">
      <div :class="`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.bg}`">
        <component :is="item.icon" :class="`w-5 h-5 ${theme.text}`" />
      </div>
      <div>
        <h4 :class="`font-bold text-sm ${theme.text}`">{{ item.title }}</h4>
        <span class="text-xs opacity-60">{{ item.count }} 篇文档</span>
      </div>
    </div>
  </div>
</template>
