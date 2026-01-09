<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { UserPlus, Users, Clock, Check, X } from 'lucide-vue-next';
import { useSpaceStore } from '@/stores/space';
import { useUserStore } from '@/stores/user';
import MemberList from '@/components/MemberList.vue';
import type { UserSpaceAuth, AccessRequest } from '@/types';
import * as accessApi from '@/api/access';

const route = useRoute();
const spaceStore = useSpaceStore();
const userStore = useUserStore();

const spaceId = computed(() => route.params.spaceId as string);
const activeTab = ref<'members' | 'pending'>('members');

const pendingRequests = ref<AccessRequest[]>([]);
const loadingRequests = ref(false);

// Add member form
const showAddMemberModal = ref(false);
const newMemberUsername = ref('');
const newMemberPermissions = ref({
  canRead: true,
  canCreateFolder: false,
  canCreateDoc: true,
  superAdmin: false,
});
const adding = ref(false);

// Edit member form
const showEditMemberModal = ref(false);
const editingMember = ref<UserSpaceAuth | null>(null);
const editPermissions = ref({
  canRead: true,
  canCreateFolder: false,
  canCreateDoc: true,
  superAdmin: false,
});
const updating = ref(false);

onMounted(async () => {
  await loadMembers();
  await loadPendingRequests();
});

async function loadMembers() {
  await spaceStore.fetchSpaceMembers(spaceId.value);
}

async function loadPendingRequests() {
  loadingRequests.value = true;
  try {
    const data = await accessApi.getPendingRequests({
      type: 'SPACE',
      targetId: spaceId.value,
    });
    pendingRequests.value = data.list;
  } catch (error) {
    console.error('Failed to load pending requests:', error);
  } finally {
    loadingRequests.value = false;
  }
}

async function handleAddMember() {
  if (!newMemberUsername.value.trim()) return;

  adding.value = true;
  try {
    await spaceStore.addMembers(spaceId.value, [{
      username: newMemberUsername.value.trim(),
      ...newMemberPermissions.value,
    }]);

    showAddMemberModal.value = false;
    newMemberUsername.value = '';
    resetNewMemberPermissions();
  } catch (error) {
    console.error('Failed to add member:', error);
  } finally {
    adding.value = false;
  }
}

function resetNewMemberPermissions() {
  newMemberPermissions.value = {
    canRead: true,
    canCreateFolder: false,
    canCreateDoc: true,
    superAdmin: false,
  };
}

function handleEditMember(member: UserSpaceAuth) {
  editingMember.value = member;
  editPermissions.value = {
    canRead: member.canRead,
    canCreateFolder: member.canCreateFolder,
    canCreateDoc: member.canCreateDoc,
    superAdmin: member.superAdmin,
  };
  showEditMemberModal.value = true;
}

async function handleUpdateMember() {
  if (!editingMember.value) return;

  updating.value = true;
  try {
    await spaceStore.updateMember(
      spaceId.value,
      editingMember.value.username,
      editPermissions.value
    );

    showEditMemberModal.value = false;
    editingMember.value = null;
  } catch (error) {
    console.error('Failed to update member:', error);
  } finally {
    updating.value = false;
  }
}

async function handleRemoveMember(username: string) {
  try {
    await spaceStore.removeMember(spaceId.value, username);
  } catch (error) {
    console.error('Failed to remove member:', error);
  }
}

async function handleApproveRequest(request: AccessRequest) {
  try {
    await accessApi.approveAccess({
      requestId: request.documentId,
      status: 'APPROVED',
    });
    await loadPendingRequests();
    await loadMembers();
  } catch (error) {
    console.error('Failed to approve request:', error);
  }
}

async function handleRejectRequest(request: AccessRequest) {
  try {
    await accessApi.approveAccess({
      requestId: request.documentId,
      status: 'REJECTED',
    });
    await loadPendingRequests();
  } catch (error) {
    console.error('Failed to reject request:', error);
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">成员管理</h1>
        <p class="opacity-60 mt-1">管理空间成员和权限</p>
      </div>
      <button class="btn btn-primary" @click="showAddMemberModal = true">
        <UserPlus class="w-4 h-4" />
        添加成员
      </button>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed mb-6 w-fit">
      <a
        role="tab"
        class="tab gap-2"
        :class="{ 'tab-active': activeTab === 'members' }"
        @click="activeTab = 'members'"
      >
        <Users class="w-4 h-4" />
        成员列表
        <span class="badge badge-sm">{{ spaceStore.currentSpaceMembers.length }}</span>
      </a>
      <a
        role="tab"
        class="tab gap-2"
        :class="{ 'tab-active': activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        <Clock class="w-4 h-4" />
        待审批
        <span v-if="pendingRequests.length > 0" class="badge badge-sm badge-error">
          {{ pendingRequests.length }}
        </span>
      </a>
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <MemberList
          :members="spaceStore.currentSpaceMembers"
          type="space"
          :current-username="userStore.username"
          :can-edit="spaceStore.isSuperAdmin"
          @edit="handleEditMember"
          @remove="handleRemoveMember"
        />
      </div>
    </div>

    <!-- Pending Tab -->
    <div v-if="activeTab === 'pending'" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div v-if="loadingRequests" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else-if="pendingRequests.length === 0" class="text-center py-10 opacity-50">
          暂无待审批申请
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="flex items-center justify-between p-4 bg-base-200 rounded-xl"
          >
            <div>
              <p class="font-medium">{{ request.username }}</p>
              <p class="text-sm opacity-60 mt-1">{{ request.reason || '未提供申请理由' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-success btn-sm" @click="handleApproveRequest(request)">
                <Check class="w-4 h-4" />
                通过
              </button>
              <button class="btn btn-error btn-sm" @click="handleRejectRequest(request)">
                <X class="w-4 h-4" />
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddMemberModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">添加成员</h3>

        <div class="py-4 space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">用户名</span>
            </label>
            <input
              v-model="newMemberUsername"
              type="text"
              placeholder="输入用户名"
              class="input input-bordered"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">权限设置</span>
            </label>
            <div class="space-y-2">
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" v-model="newMemberPermissions.canRead" class="checkbox checkbox-sm" />
                <span class="label-text">可读取</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" v-model="newMemberPermissions.canCreateDoc" class="checkbox checkbox-sm" />
                <span class="label-text">可创建文档</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" v-model="newMemberPermissions.canCreateFolder" class="checkbox checkbox-sm" />
                <span class="label-text">可创建文件夹</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" v-model="newMemberPermissions.superAdmin" class="checkbox checkbox-sm" />
                <span class="label-text">管理员</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showAddMemberModal = false">取消</button>
          <button class="btn btn-primary" :disabled="adding" @click="handleAddMember">
            <span v-if="adding" class="loading loading-spinner loading-sm"></span>
            添加
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAddMemberModal = false">close</button>
      </form>
    </dialog>

    <!-- Edit Member Modal -->
    <dialog class="modal" :class="{ 'modal-open': showEditMemberModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">编辑成员权限</h3>
        <p class="opacity-60 py-2">{{ editingMember?.username }}</p>

        <div class="py-4 space-y-2">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="editPermissions.canRead" class="checkbox checkbox-sm" />
            <span class="label-text">可读取</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="editPermissions.canCreateDoc" class="checkbox checkbox-sm" />
            <span class="label-text">可创建文档</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="editPermissions.canCreateFolder" class="checkbox checkbox-sm" />
            <span class="label-text">可创建文件夹</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="editPermissions.superAdmin" class="checkbox checkbox-sm" />
            <span class="label-text">管理员</span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showEditMemberModal = false">取消</button>
          <button class="btn btn-primary" :disabled="updating" @click="handleUpdateMember">
            <span v-if="updating" class="loading loading-spinner loading-sm"></span>
            保存
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showEditMemberModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
