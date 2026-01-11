import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Space, Folder, UserSpaceAuth } from '@/types';
import * as spaceApi from '@/api/space';

export const useSpaceStore = defineStore('space', () => {
  // State
  const spaces = ref<Space[]>([]);
  const spacesTotal = ref(0);
  const joinedSpaces = ref<Space[]>([]);
  const joinedSpacesTotal = ref(0);
  const currentSpace = ref<Space | null>(null);
  const currentSpaceMembers = ref<UserSpaceAuth[]>([]);
  const personalSpace = ref<Space | null>(null);
  const folders = ref<Folder[]>([]);
  const loading = ref(false);

  // Computed
  const publicSpaces = computed(() => spaces.value.filter(s => s.spaceType === 1));
  const spaceAccess = computed(() => currentSpace.value?.permission);
  const isSuperAdmin = computed(() => {
    return currentSpace.value?.permission?.isSuperAdmin ?? false
  });
  // Actions
  async function fetchSpaces(params: { page: number; pageSize: number; type?: number }) {
    loading.value = true;
    try {
      const data = await spaceApi.getSpaces(params);
      spaces.value = data.list;
      spacesTotal.value = data.total;
      return data;
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchJoinedSpaces(params?: { page?: number; pageSize?: number }) {
    loading.value = true;
    try {
      const data = await spaceApi.getJoinedSpaces(params);
      joinedSpaces.value = data.list;
      joinedSpacesTotal.value = data.total;
      return data;
    } catch (error) {
      console.error('Failed to fetch joined spaces:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPersonalSpace() {
    try {
      const data = await spaceApi.getOrCreatePersonalSpace();
      personalSpace.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch personal space:', error);
      throw error;
    }
  }

  async function fetchSpaceById(spaceId: string) {
    loading.value = true;
    try {
      const data = await spaceApi.getSpaceById(spaceId);
      currentSpace.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch space:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }


  async function createSpace(data: Partial<Space> & { deptId: number }) {
    try {
      const newSpace = await spaceApi.createSpace(data);
      spaces.value.unshift(newSpace);
      return newSpace;
    } catch (error) {
      console.error('Failed to create space:', error);
      throw error;
    }
  }

  async function updateSpace(spaceId: string, data: Partial<Space>) {
    try {
      const updated = await spaceApi.updateSpace(spaceId, data);
      const index = spaces.value.findIndex(s => s.documentId === spaceId);
      if (index !== -1) {
        spaces.value[index] = updated;
      }
      if (currentSpace.value?.documentId === spaceId) {
        currentSpace.value = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update space:', error);
      throw error;
    }
  }

  async function deleteSpace(spaceId: string) {
    try {
      await spaceApi.deleteSpace(spaceId);
      spaces.value = spaces.value.filter(s => s.documentId !== spaceId);
      if (currentSpace.value?.documentId === spaceId) {
        currentSpace.value = null;
      }
    } catch (error) {
      console.error('Failed to delete space:', error);
      throw error;
    }
  }

  async function fetchFolders(spaceId: string, parentFolderId?: string) {
    try {
      const data = await spaceApi.getFolders(spaceId, parentFolderId);
      folders.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      throw error;
    }
  }

  async function createFolder(spaceId: string, data: Partial<Folder>) {
    try {
      const newFolder = await spaceApi.createFolder(spaceId, data);
      folders.value.push(newFolder);
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  async function updateFolder(spaceId: string, folderId: string, data: Partial<Folder>) {
    try {
      const updated = await spaceApi.updateFolder(spaceId, folderId, data);
      const index = folders.value.findIndex(f => f.documentId === folderId);
      if (index !== -1) {
        folders.value[index] = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  }

  async function fetchSpaceMembers(spaceId: string, params?: any) {
    try {
      const data = await spaceApi.getSpaceMembers(spaceId, params);
      currentSpaceMembers.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch space members:', error);
      throw error;
    }
  }

  // 将 boolean 权限转换为 0/1 格式
  function convertPermToNumber(perm: Record<string, boolean | undefined>): Record<string, number | undefined> {
    const result: Record<string, number | undefined> = {};
    if (perm.canRead !== undefined) result.canRead = perm.canRead ? 1 : 0;
    if (perm.canCreateFolder !== undefined) result.canCreateFolder = perm.canCreateFolder ? 1 : 0;
    if (perm.canCreateDoc !== undefined) result.canCreateDoc = perm.canCreateDoc ? 1 : 0;
    if (perm.superAdmin !== undefined) result.superAdmin = perm.superAdmin ? 1 : 0;
    return result;
  }

  async function addMembers(spaceId: string, members: any[]) {
    try {
      // 转换权限格式
      const convertedMembers = members.map(m => ({
        username: m.username,
        ...convertPermToNumber(m),
      }));
      await spaceApi.addSpaceMembers(spaceId, convertedMembers);
      await fetchSpaceMembers(spaceId);
    } catch (error) {
      console.error('Failed to add members:', error);
      throw error;
    }
  }

  async function updateMember(spaceId: string, username: string, data: any) {
    try {
      // 转换权限格式
      const convertedData = convertPermToNumber(data);
      await spaceApi.updateSpaceMember(spaceId, username, convertedData);
      await fetchSpaceMembers(spaceId);
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  }

  async function removeMember(spaceId: string, username: string) {
    try {
      await spaceApi.removeSpaceMembers(spaceId, username);
      currentSpaceMembers.value = currentSpaceMembers.value.filter(m => m.username !== username);
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }


  function resetCurrentSpace() {
    currentSpace.value = null;
    currentSpaceMembers.value = [];
    folders.value = [];
  }

  return {
    // State
    spaces,
    spacesTotal,
    joinedSpaces,
    joinedSpacesTotal,
    currentSpace,
    currentSpaceMembers,
    personalSpace,
    folders,
    loading,
    // Computed
    spaceAccess,
    publicSpaces,
    isSuperAdmin,
    // Actions
    fetchSpaces,
    fetchJoinedSpaces,
    fetchPersonalSpace,
    fetchSpaceById,
    createSpace,
    updateSpace,
    deleteSpace,
    fetchFolders,
    createFolder,
    updateFolder,
    fetchSpaceMembers,
    addMembers,
    updateMember,
    removeMember,
    resetCurrentSpace,
  };
});
