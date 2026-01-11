<script setup lang="ts">
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  Lock,
  Eye,
  Edit3,
  Loader2,
  Users,
} from 'lucide-vue-next';
import type { TreeNode } from '@/types';

const props = defineProps<{
  node: TreeNode;
  depth: number;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  currentDocId?: string;
  currentFolderId?: string;
}>();

const emit = defineEmits<{
  (e: 'node-click', node: TreeNode): void;
  (e: 'toggle-expand', node: TreeNode): void;
  (e: 'folder-select', node: TreeNode): void;
  (e: 'context-menu', event: MouseEvent, node: TreeNode): void;
}>();

function handleExpandClick(event: MouseEvent) {
  event.stopPropagation();
  if (props.node.type === 'folder') {
    emit('toggle-expand', props.node);
  }
}

function handleNodeClick() {
  if (props.node.type === 'folder') {
    emit('folder-select', props.node);
  } else {
    emit('node-click', props.node);
  }
}

function getPermIcon(node: TreeNode) {
  if (node.type === 'folder') {
    return node.visibilityScope === 'DEPT_ONLY' ? Users : null;
  }
  if (node.type === 'doc') {
    if (node.accessMode === 'WHITELIST_ONLY') return Lock;
    if (node.accessMode === 'OPEN_READONLY') return Eye;
    if (node.perm?.canEdit) return Edit3;
  }
  return null;
}

function getPermTooltip(node: TreeNode) {
  if (node.type === 'folder') {
    return node.visibilityScope === 'DEPT_ONLY' ? '仅部门可见' : '';
  }
  if (node.type === 'doc') {
    if (node.accessMode === 'WHITELIST_ONLY') return '白名单访问';
    if (node.accessMode === 'OPEN_READONLY') return '只读';
    if (node.perm?.canEdit) return '可编辑';
  }
  return '';
}
</script>

<template>
  <div class="select-none">
    <!-- Node Row -->
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200 transition-colors group"
      :class="{
        'bg-primary/10 text-primary': currentDocId === node.key,
        'bg-base-300': node.type === 'folder' && currentFolderId === node.key,
      }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="handleNodeClick"
      @contextmenu="emit('context-menu', $event, node)"
    >
      <!-- Expand/Collapse Icon -->
      <span
        v-if="node.type === 'folder'"
        class="w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-base-300"
        @click="handleExpandClick"
      >
        <Loader2 v-if="loadingFolders.has(node.key)" class="w-3.5 h-3.5 animate-spin opacity-50" />
        <ChevronDown v-else-if="expandedFolders.has(node.key)" class="w-4 h-4 opacity-50" />
        <ChevronRight v-else class="w-4 h-4 opacity-50" />
      </span>
      <span v-else class="w-5 shrink-0"></span>

      <!-- Icon -->
      <Folder v-if="node.type === 'folder'" class="w-4 h-4 text-warning shrink-0" />
      <FileText v-else class="w-4 h-4 text-info shrink-0" />

      <!-- Title -->
      <span class="text-sm truncate flex-1">{{ node.title }}</span>

      <!-- Permission Icon -->
      <span
        v-if="getPermIcon(node)"
        class="shrink-0 opacity-50"
        :title="getPermTooltip(node)"
      >
        <component :is="getPermIcon(node)" class="w-3.5 h-3.5" />
      </span>
    </div>

    <!-- Children (Recursive) -->
    <template v-if="node.type === 'folder' && expandedFolders.has(node.key) && node.children?.length">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        :loading-folders="loadingFolders"
        :current-doc-id="currentDocId"
        :current-folder-id="currentFolderId"
        @node-click="emit('node-click', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
        @folder-select="emit('folder-select', $event)"
        @context-menu="(e, n) => emit('context-menu', e, n)"
      />
    </template>
  </div>
</template>
