import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as spaceApi from '@/api/space';
import type { Space, UserSpaceAuth, PaginatedData, CreateFolderForm, SpaceType } from '@/types';
import { SPACE_TYPE } from '@/types';

export const useSpaceStore = defineStore('space', () => {
  // 状态
  const spaces = ref<Space[]>([]);
  const spacesTotal = ref(0);
  const currentSpace = ref<Space | null>(null);
  const currentSpaceMembers = ref<UserSpaceAuth[]>([]);
  const currentUserAuth = ref<UserSpaceAuth | null>(null);
  const loading = ref(false);
  const personalSpace = ref<Space | null>(null);

  // 计算属性
  const isSuperAdmin = computed(() => {
    return currentUserAuth.value?.superAdmin === true;
  });

  const canCreateFolder = computed(() => {
    if (!currentUserAuth.value) return false;
    return currentUserAuth.value.superAdmin || currentUserAuth.value.canCreateFolder;
  });

  const canCreateDoc = computed(() => {
    if (!currentUserAuth.value) return false;
    return currentUserAuth.value.superAdmin || currentUserAuth.value.canCreateDoc;
  });

  // 计算属性 - 公共空间列表
  const publicSpaces = computed(() => {
    return spaces.value.filter(s => s.space_type === SPACE_TYPE.PUBLIC);
  });

  // 操作
  async function fetchSpaces(page = 1, pageSize = 20, spaceType?: SpaceType) {
    loading.value = true;
    try {
      const result = await spaceApi.getSpaces({ page, pageSize, spaceType }) as unknown as PaginatedData<Space>;
      spaces.value = result.list;
      spacesTotal.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPersonalSpace() {
    try {
      personalSpace.value = await spaceApi.getOrCreatePersonalSpace() as unknown as Space;
      return personalSpace.value;
    } catch {
      return null;
    }
  }

  async function fetchSpaceById(spaceId: string) {
    loading.value = true;
    try {
      currentSpace.value = await spaceApi.getSpaceById(spaceId) as unknown as Space;
    } finally {
      loading.value = false;
    }
  }

  async function createSpace(data: { name: string; codeName: string; icon?: string }) {
    const result = await spaceApi.createSpace(data) as unknown as Space;
    spaces.value.unshift(result);
    return result;
  }

  async function updateSpace(spaceId: string, data: Partial<{ name: string; icon: string }>) {
    const result = await spaceApi.updateSpace(spaceId, data) as unknown as Space;
    if (currentSpace.value?.documentId === spaceId) {
      currentSpace.value = result;
    }
    const index = spaces.value.findIndex(s => s.documentId === spaceId);
    if (index !== -1) {
      spaces.value[index] = result;
    }
    return result;
  }

  async function deleteSpace(spaceId: string) {
    await spaceApi.deleteSpace(spaceId);
    spaces.value = spaces.value.filter(s => s.documentId !== spaceId);
    if (currentSpace.value?.documentId === spaceId) {
      currentSpace.value = null;
    }
  }

  async function fetchSpaceMembers(spaceId: string, page = 1, pageSize = 50) {
    const result = await spaceApi.getSpaceMembers(spaceId, { page, pageSize }) as unknown as PaginatedData<UserSpaceAuth>;
    currentSpaceMembers.value = result.list;
    return result;
  }

  async function addMembers(spaceId: string, members: { username: string; canRead?: boolean; canCreateFolder?: boolean; canCreateDoc?: boolean; superAdmin?: boolean }[]) {
    const result = await spaceApi.addSpaceMembers(spaceId, members) as unknown as UserSpaceAuth[];
    await fetchSpaceMembers(spaceId);
    return result;
  }

  async function updateMember(spaceId: string, data: { username: string; canRead?: boolean; canCreateFolder?: boolean; canCreateDoc?: boolean; superAdmin?: boolean }) {
    const result = await spaceApi.updateSpaceMember(spaceId, data) as unknown as UserSpaceAuth;
    await fetchSpaceMembers(spaceId);
    return result;
  }

  async function removeMembers(spaceId: string, usernames: string[]) {
    await spaceApi.removeSpaceMembers(spaceId, usernames);
    currentSpaceMembers.value = currentSpaceMembers.value.filter(m => !usernames.includes(m.username));
  }

  async function createFolder(spaceId: string, data: CreateFolderForm) {
    return await spaceApi.createFolder(spaceId, data);
  }

  function setCurrentUserAuth(auth: UserSpaceAuth | null) {
    currentUserAuth.value = auth;
  }

  function clearCurrentSpace() {
    currentSpace.value = null;
    currentSpaceMembers.value = [];
    currentUserAuth.value = null;
  }

  return {
    // 状态
    spaces,
    spacesTotal,
    currentSpace,
    currentSpaceMembers,
    currentUserAuth,
    loading,
    personalSpace,
    // 计算属性
    isSuperAdmin,
    canCreateFolder,
    canCreateDoc,
    publicSpaces,
    // 操作
    fetchSpaces,
    fetchSpaceById,
    fetchPersonalSpace,
    createSpace,
    updateSpace,
    deleteSpace,
    fetchSpaceMembers,
    addMembers,
    updateMember,
    removeMembers,
    createFolder,
    setCurrentUserAuth,
    clearCurrentSpace,
  };
});
