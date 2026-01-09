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
  const currentUserAuth = ref<UserSpaceAuth | null>(null);
  const personalSpace = ref<Space | null>(null);
  const folders = ref<Folder[]>([]);
  const loading = ref(false);

  // Computed
  const isSuperAdmin = computed(() => currentUserAuth.value?.superAdmin || false);
  const canCreateFolder = computed(() => currentUserAuth.value?.canCreateFolder || false);
  const canCreateDoc = computed(() => currentUserAuth.value?.canCreateDoc || false);
  const publicSpaces = computed(() => spaces.value.filter(s => s.spaceType === 1));

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

  async function checkAccessStatus(spaceId: string) {
    try {
      const data = await spaceApi.checkAccessStatus(spaceId);
      if (data.auth) {
        currentUserAuth.value = data.auth;
      }
      return data;
    } catch (error) {
      console.error('Failed to check access status:', error);
      throw error;
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

  async function addMembers(spaceId: string, members: any[]) {
    try {
      await spaceApi.addSpaceMembers(spaceId, members);
      await fetchSpaceMembers(spaceId);
    } catch (error) {
      console.error('Failed to add members:', error);
      throw error;
    }
  }

  async function updateMember(spaceId: string, username: string, data: any) {
    try {
      await spaceApi.updateSpaceMember(spaceId, username, data);
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

  function setCurrentUserAuth(auth: UserSpaceAuth | null) {
    currentUserAuth.value = auth;
  }

  function resetCurrentSpace() {
    currentSpace.value = null;
    currentSpaceMembers.value = [];
    currentUserAuth.value = null;
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
    currentUserAuth,
    personalSpace,
    folders,
    loading,
    // Computed
    isSuperAdmin,
    canCreateFolder,
    canCreateDoc,
    publicSpaces,
    // Actions
    fetchSpaces,
    fetchJoinedSpaces,
    fetchPersonalSpace,
    fetchSpaceById,
    checkAccessStatus,
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
    setCurrentUserAuth,
    resetCurrentSpace,
  };
});
