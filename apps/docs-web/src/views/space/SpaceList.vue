<script setup lang="ts">
import { ref, onMounted, computed, type Component } from 'vue';
import { Plus, FolderKanban, Users, User } from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import CreateSpaceModal from '@/components/CreateSpaceModal.vue';
import type { Space } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const spaceStore = useSpaceStore();

const showCreateModal = ref(false);
const currentPage = ref(1);
const pageSize = 20;

// Icon mapping
const ICONS: Component[] = [FolderKanban, Users, User];
const COLORS = [
  { bg: 'bg-info/10', icon: 'text-info' },
  { bg: 'bg-secondary/10', icon: 'text-secondary' },
  { bg: 'bg-success/10', icon: 'text-success' },
  { bg: 'bg-warning/10', icon: 'text-warning' },
  { bg: 'bg-error/10', icon: 'text-error' },
];

function getSpaceVisuals(space: Space) {
  const hash = space.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    icon: ICONS[hash % ICONS.length],
    color: COLORS[hash % COLORS.length],
  };
}

const spaces = computed(() => spaceStore.spaces);
const total = computed(() => spaceStore.spacesTotal);
const totalPages = computed(() => Math.ceil(total.value / pageSize));

onMounted(async () => {
  await loadSpaces();
});

async function loadSpaces() {
  await spaceStore.fetchSpaces({
    page: currentPage.value,
    pageSize,
  });
}

async function handlePageChange(page: number) {
  currentPage.value = page;
  await loadSpaces();
}

function handleCreateSuccess() {
  showCreateModal.value = false;
  loadSpaces();
}

function getSpaceTypeLabel(spaceType: number) {
  return spaceType === 1 ? '公共空间' : '个人空间';
}

function getSpaceTypeBadgeClass(spaceType: number) {
  return spaceType === 1 ? 'badge-info' : 'badge-secondary';
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold">所有空间</h1>
        <p class="opacity-60 mt-1">发现和加入感兴趣的知识空间</p>
      </div>
      <button class="btn btn-neutral" @click="showCreateModal = true">
        <Plus class="w-4 h-4" />
        创建空间
      </button>
    </div>

    <!-- Loading -->
    <div v-if="spaceStore.loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty State -->
    <div v-else-if="spaces.length === 0" class="text-center py-20">
      <FolderKanban class="w-16 h-16 opacity-30 mx-auto mb-4" />
      <h3 class="text-lg font-medium mb-2">暂无空间</h3>
      <p class="opacity-50 mb-6">创建一个新空间开始协作</p>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <Plus class="w-4 h-4" />
        创建空间
      </button>
    </div>

    <!-- Space Grid -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <router-link
          v-for="space in spaces"
          :key="space.id"
          :to="`/space/${space.documentId}`"
        >
          <div class="card bg-base-100 shadow-sm hover:shadow-xl transition-shadow h-full">
            <div class="card-body p-5">
              <div class="flex items-start gap-4">
                <div
                  :class="`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getSpaceVisuals(space).color.bg}`"
                >
                  <component
                    :is="getSpaceVisuals(space).icon"
                    :class="`w-6 h-6 ${getSpaceVisuals(space).color.icon}`"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="card-title text-base truncate">{{ space.name }}</h3>
                  <div class="badge badge-sm mt-1" :class="getSpaceTypeBadgeClass(space.spaceType)">
                    {{ getSpaceTypeLabel(space.spaceType) }}
                  </div>
                  <p class="text-xs opacity-50 mt-2">
                    创建于 {{ dayjs(space.ctime).fromNow() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="join">
          <button
            v-for="page in totalPages"
            :key="page"
            class="join-item btn btn-sm"
            :class="{ 'btn-active': currentPage === page }"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateSpaceModal v-model="showCreateModal" @success="handleCreateSuccess" />
  </div>
</template>
