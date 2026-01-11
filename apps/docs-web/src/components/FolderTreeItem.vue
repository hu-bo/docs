<script setup lang="ts">
import { ChevronRight, ChevronDown, Folder, Loader2 } from 'lucide-vue-next';
import type { TreeNode } from '@/types';

const props = defineProps<{
  node: TreeNode;
  depth: number;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  selectedFolderId?: string;
}>();

const emit = defineEmits<{
  (e: 'toggle', node: TreeNode): void;
  (e: 'select', folderId: string, folderName: string): void;
}>();

const hasChildren = props.node.children && props.node.children.filter(n => n.type === 'folder').length > 0;
const isExpanded = props.expandedFolders.has(props.node.key);
const isLoading = props.loadingFolders.has(props.node.key);
const isSelected = props.selectedFolderId === props.node.key;

function handleClick() {
  emit('select', props.node.key, props.node.title);
}

function handleToggle(e: MouseEvent) {
  e.stopPropagation();
  emit('toggle', props.node);
}
</script>

<template>
  <div class="select-none">
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-base-300 transition-colors"
      :class="{ 'bg-primary/20': isSelected }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="handleClick"
    >
      <!-- Expand/Collapse -->
      <span
        v-if="hasChildren || !node.loaded"
        class="w-4 h-4 flex items-center justify-center shrink-0"
        @click="handleToggle"
      >
        <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin opacity-50" />
        <ChevronDown v-else-if="isExpanded" class="w-4 h-4 opacity-50" />
        <ChevronRight v-else class="w-4 h-4 opacity-50" />
      </span>
      <span v-else class="w-4 shrink-0"></span>

      <Folder class="w-4 h-4 text-warning shrink-0" />
      <span class="text-sm truncate">{{ node.title }}</span>
    </div>

    <!-- Children -->
    <template v-if="isExpanded && node.children">
      <FolderTreeItem
        v-for="child in node.children.filter(n => n.type === 'folder')"
        :key="child.key"
        :node="child"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        :loading-folders="loadingFolders"
        :selected-folder-id="selectedFolderId"
        @toggle="emit('toggle', $event)"
        @select="(id, name) => emit('select', id, name)"
      />
    </template>
  </div>
</template>
