<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, UserPlus } from 'lucide-vue-next';
import { useDocumentStore } from '@/stores/document';
import { useUserStore } from '@/stores/user';
import MemberList from '@/components/MemberList.vue';
import type { DocUserAcl, DocPerm } from '@/types';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const userStore = useUserStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

const showAddMemberModal = ref(false);
const newMemberUsername = ref('');
const newMemberPerm = ref<DocPerm>('READ');
const adding = ref(false);

const showEditMemberModal = ref(false);
const editingMember = ref<DocUserAcl | null>(null);
const editPerm = ref<DocPerm>('READ');
const updating = ref(false);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  if (!documentId.value) return;

  await documentStore.fetchDocumentById(documentId.value);
  await documentStore.fetchDocMembers(documentId.value);
}

function goBack() {
  router.push({
    name: 'DocumentView',
    params: { spaceId: spaceId.value, documentId: documentId.value },
  });
}

async function handleAddMember() {
  if (!newMemberUsername.value.trim()) return;

  adding.value = true;
  try {
    await documentStore.addDocMembers(documentId.value, [{
      username: newMemberUsername.value.trim(),
      perm: newMemberPerm.value,
    }]);

    showAddMemberModal.value = false;
    newMemberUsername.value = '';
    newMemberPerm.value = 'READ';
  } catch (error) {
    console.error('Failed to add member:', error);
  } finally {
    adding.value = false;
  }
}

function handleEditMember(member: DocUserAcl) {
  editingMember.value = member;
  editPerm.value = member.perm;
  showEditMemberModal.value = true;
}

async function handleUpdateMember() {
  if (!editingMember.value) return;

  updating.value = true;
  try {
    await documentStore.updateDocMember(
      documentId.value,
      editingMember.value.username,
      { perm: editPerm.value }
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
    await documentStore.removeDocMember(documentId.value, username);
  } catch (error) {
    console.error('Failed to remove member:', error);
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <button class="btn btn-ghost btn-square" @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div class="flex-1">
        <h1 class="text-xl font-bold">文档成员管理</h1>
        <p class="text-sm opacity-50 mt-1">
          {{ documentStore.currentDocument?.title }}
        </p>
      </div>
      <button class="btn btn-primary" @click="showAddMemberModal = true">
        <UserPlus class="w-4 h-4" />
        添加成员
      </button>
    </div>

    <!-- Info Box -->
    <div class="alert alert-info mb-6">
      <span>
        添加到此列表的用户将根据其权限级别获得对文档的访问权限。
        当文档设置为"白名单"模式时，只有此列表中的用户才能访问。
      </span>
    </div>

    <!-- Members List -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <MemberList
          :members="documentStore.documentMembers"
          type="document"
          :current-username="userStore.username"
          :can-edit="true"
          @edit="handleEditMember"
          @remove="handleRemoveMember"
        />
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
              <span class="label-text">权限级别</span>
            </label>
            <div class="flex gap-4">
              <label
                class="label cursor-pointer flex-1 justify-start gap-4 border rounded-lg p-4"
                :class="{ 'border-info bg-info/10': newMemberPerm === 'READ' }"
              >
                <input type="radio" v-model="newMemberPerm" value="READ" class="radio radio-info" />
                <div>
                  <p class="font-medium">只读</p>
                  <p class="text-xs opacity-60">只能查看</p>
                </div>
              </label>

              <label
                class="label cursor-pointer flex-1 justify-start gap-4 border rounded-lg p-4"
                :class="{ 'border-success bg-success/10': newMemberPerm === 'EDIT' }"
              >
                <input type="radio" v-model="newMemberPerm" value="EDIT" class="radio radio-success" />
                <div>
                  <p class="font-medium">编辑</p>
                  <p class="text-xs opacity-60">可以编辑</p>
                </div>
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

        <div class="py-4 flex gap-4">
          <label
            class="label cursor-pointer flex-1 justify-start gap-4 border rounded-lg p-4"
            :class="{ 'border-info bg-info/10': editPerm === 'READ' }"
          >
            <input type="radio" v-model="editPerm" value="READ" class="radio radio-info" />
            <div>
              <p class="font-medium">只读</p>
              <p class="text-xs opacity-60">只能查看</p>
            </div>
          </label>

          <label
            class="label cursor-pointer flex-1 justify-start gap-4 border rounded-lg p-4"
            :class="{ 'border-success bg-success/10': editPerm === 'EDIT' }"
          >
            <input type="radio" v-model="editPerm" value="EDIT" class="radio radio-success" />
            <div>
              <p class="font-medium">编辑</p>
              <p class="text-xs opacity-60">可以编辑</p>
            </div>
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
