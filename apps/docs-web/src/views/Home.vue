<script setup lang="ts">
import { ref, onMounted, computed, type Component } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

import {
  FolderKanban,
  Plus,
  Hash,
  Laptop,
  Video,
  Users,
  Ship,
  Cpu,
  PlayCircle,
  Radio,
  Target,
  TrendingUp,
  Zap,
  ShieldCheck,
  Globe,
  Briefcase
} from 'lucide-vue-next';
import SpaceCard, { type SpaceItem } from '@/components/SpaceCard.vue';
import DocumentCard, { type DocumentItem } from '@/components/DocumentCard.vue';
import CommunityCard, { type CommunityItem } from '@/components/CommunityCard.vue';
import CreateSpaceModal from '@/components/CreateSpaceModal.vue';
import { useSpaceStore } from '@/stores/space';
import { useDocumentStore } from '@/stores/document';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const spaceStore = useSpaceStore();
const documentStore = useDocumentStore();

const activeTab = ref<'created' | 'shared'>('created');
const showCreateModal = ref(false);

onMounted(async () => {
  await Promise.all([
    spaceStore.fetchJoinedSpaces({ page: 1, pageSize: 10 }),
    spaceStore.fetchSpaces({ page: 1, pageSize: 20 }),
    documentStore.fetchRecentDocuments({ limit: 12 }),
  ]);
});

const ICONS: Component[] = [Laptop, Video, Users, Ship, Cpu, PlayCircle, Radio, Target, TrendingUp, Zap, ShieldCheck, Globe, Briefcase];
const COLORS = [
  { bg: 'bg-neutral/10', icon: 'text-neutral', theme: 'gray' },
  { bg: 'bg-info/10', icon: 'text-info', theme: 'blue' },
  { bg: 'bg-secondary/10', icon: 'text-secondary', theme: 'purple' },
  { bg: 'bg-success/10', icon: 'text-success', theme: 'emerald' },
  { bg: 'bg-warning/10', icon: 'text-warning', theme: 'orange' },
  { bg: 'bg-error/10', icon: 'text-error', theme: 'pink' },
  { bg: 'bg-accent/10', icon: 'text-accent', theme: 'cyan' },
  { bg: 'bg-warning/10', icon: 'text-warning', theme: 'amber' },
  { bg: 'bg-primary/10', icon: 'text-primary', theme: 'indigo' },
];

function getVisuals(id: number) {
  const hash = id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const icon = ICONS[hash % ICONS.length];
  const color = COLORS[hash % COLORS.length];
  return { icon, color };
}

const mySpaces = computed<SpaceItem[]>(() => {
  return spaceStore.joinedSpaces.map(space => {
    const visuals = getVisuals(space.id);
    return {
      id: space.documentId,
      title: space.name,
      folderCount: 0,
      fileCount: 0,
      time: dayjs(space.mtime).fromNow(),
      icon: visuals.icon,
      bgColor: visuals.color.bg,
      iconColor: visuals.color.icon,
    };
  });
});

const myDocuments = computed<DocumentItem[]>(() => {
  return documentStore.recentDocuments.map(doc => ({
    id: doc.documentId,
    title: doc.title,
    path: doc.spaceName || '个人空间',
    tags: [],
    time: dayjs(doc.lastViewedAt || doc.mtime).fromNow(),
  }));
});

const communityItems = computed<CommunityItem[]>(() => {
  return spaceStore.publicSpaces.slice(0, 8).map(space => {
    const visuals = getVisuals(space.id);
    return {
      id: space.documentId,
      title: space.name,
      count: 0,
      icon: visuals.icon,
      themeColor: visuals.color.theme,
    };
  });
});

async function handleCreateSuccess() {
  showCreateModal.value = false;
  await Promise.all([
    spaceStore.fetchJoinedSpaces({ page: 1, pageSize: 10 }),
    spaceStore.fetchSpaces({ page: 1, pageSize: 20 }),
  ]);
}
</script>

<template>
  <div class="container mx-auto p-4 md:p-8 space-y-10">
    <!-- Header / My Space Section -->
    <section>
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <FolderKanban class="w-6 h-6 text-primary" />
          <h1 class="text-2xl font-extrabold">我的空间</h1>
        </div>
        <button class="btn btn-neutral" @click="showCreateModal = true">
          <Plus class="w-4 h-4" />
          新建空间
        </button>
      </div>

      <div v-if="spaceStore.loading && mySpaces.length === 0" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else-if="mySpaces.length === 0" class="text-center py-10 opacity-50">
        您还没有加入任何空间
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="space in mySpaces"
          :key="space.id"
          :to="`/space/${space.id}`"
          class="block"
        >
          <SpaceCard :item="space" />
        </router-link>
      </div>
    </section>

    <!-- My Documents Section -->
    <section>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 class="text-xl font-bold">我的文档</h2>

        <div class="flex items-center gap-4">
          <div role="tablist" class="tabs tabs-boxed">
            <a
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'created' }"
              @click="activeTab = 'created'"
            >
              最近访问
            </a>
            <a
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'shared' }"
              @click="activeTab = 'shared'"
            >
              我参与的
            </a>
          </div>

          <span class="badge badge-neutral">{{ myDocuments.length }} 篇</span>
        </div>
      </div>

      <div v-if="documentStore.loading && myDocuments.length === 0" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else-if="myDocuments.length === 0" class="text-center py-10 opacity-50">
        暂无最近文档
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <router-link
          v-for="(doc, idx) in myDocuments"
          :key="doc.id"
          :to="`/space/${documentStore.recentDocuments[idx]?.spaceId}/doc/${doc.id}`"
          class="block h-full"
        >
          <DocumentCard :item="doc" />
        </router-link>
      </div>
    </section>
       <!-- Community Section -->
    <section class="pb-10">
      <div class="flex items-center gap-2 mb-6">
        <Hash class="w-5 h-5 text-secondary" />
        <h2 class="text-xl font-bold">全部空间</h2>
      </div>

      <div v-if="spaceStore.loading && communityItems.length === 0" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else-if="communityItems.length === 0" class="text-center py-10 opacity-50">
        暂无社区内容
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <router-link
          v-for="item in communityItems"
          :key="item.id"
          :to="`/space/${item.id}`"
          class="block"
        >
          <CommunityCard :item="item" />
        </router-link>
      </div>
    </section>
    <!-- Community Section -->
    <section class="pb-10">
      <div class="flex items-center gap-2 mb-6">
        <Hash class="w-5 h-5 text-secondary" />
        <h2 class="text-xl font-bold">知识社区</h2>
      </div>

      <div v-if="spaceStore.loading && communityItems.length === 0" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else-if="communityItems.length === 0" class="text-center py-10 opacity-50">
        暂无社区内容
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <router-link
          v-for="item in communityItems"
          :key="item.id"
          :to="`/space/${item.id}`"
          class="block"
        >
          <CommunityCard :item="item" />
        </router-link>
      </div>
    </section>

    <CreateSpaceModal v-model="showCreateModal" @success="handleCreateSuccess" />
  </div>
</template>
