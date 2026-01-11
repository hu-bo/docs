<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Edit2,
  Users,
  Link2,
  MessageSquare,
  Clock,
  Send,
  MoreHorizontal,
  Trash2,
  Reply,
  X,
} from 'lucide-vue-next';
import { useDocumentStore } from '@/stores/document';
import { useSpaceStore } from '@/stores/space';
import { useUserStore } from '@/stores/user';
import TiptapEditor from '@/components/editor/TiptapEditor.vue';
import * as commentApi from '@/api/comment';
import type { Comment } from '@/types';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const spaceStore = useSpaceStore();
const userStore = useUserStore();

const spaceId = computed(() => route.params.spaceId as string);
const documentId = computed(() => route.params.documentId as string);

const comments = ref<Comment[]>([]);
const loadingComments = ref(false);
const newComment = ref('');
const submittingComment = ref(false);
const replyingTo = ref<Comment | null>(null);
const replyContent = ref('');

const canEdit = computed(() => {
  const doc = documentStore.currentDocument;
  if (!doc) return false;
  if (doc.owner === userStore.username) return true;
  if (spaceStore.currentSpace?.permission.superAdmin) return true;
  if (doc.accessMode === 'OPEN_EDIT') return true;
  return doc.hasSpaceAuth && doc.accessMode !== 'WHITELIST_ONLY';
});

const isOwnerOrAdmin = computed(() => {
  const doc = documentStore.currentDocument;
  if (!doc) return false;
  return doc.owner === userStore.username || spaceStore.currentSpace?.permission.superAdmin;
});

onMounted(async () => {
  await loadDocument();
});

watch(documentId, async () => {
  await loadDocument();
});

async function loadDocument() {
  if (!documentId.value) return;

  try {
    await documentStore.fetchDocumentById(documentId.value);
    await loadComments();
  } catch (error) {
    console.error('Failed to load document:', error);
  }
}

async function loadComments() {
  loadingComments.value = true;
  try {
    const data = await commentApi.getComments(documentId.value);
    comments.value = data.list;
  } catch (error) {
    console.error('Failed to load comments:', error);
  } finally {
    loadingComments.value = false;
  }
}

function goToEdit() {
  const folderPath = route.params.folderPath;
  if (folderPath) {
    router.push({
      name: 'FolderDocumentEdit',
      params: { spaceId: spaceId.value, folderPath, documentId: documentId.value },
    });
  } else {
    router.push({
      name: 'DocumentEdit',
      params: { spaceId: spaceId.value, documentId: documentId.value },
    });
  }
}

function goToMembers() {
  router.push({
    name: 'DocumentMembers',
    params: { spaceId: spaceId.value, documentId: documentId.value },
  });
}

function goToSpaces() {
  router.push({
    name: 'DocumentSpaces',
    params: { spaceId: spaceId.value, documentId: documentId.value },
  });
}

async function handleSubmitComment() {
  if (!newComment.value.trim()) return;

  submittingComment.value = true;
  try {
    await commentApi.createComment({
      docId: documentId.value,
      parentId: '',
      content: newComment.value.trim()
    });

    newComment.value = '';
    await loadComments();
  } catch (error) {
    console.error('Failed to submit comment:', error);
  } finally {
    submittingComment.value = false;
  }
}

async function handleDeleteComment(commentId: string) {
  if (!confirm('确定要删除这条评论吗？')) return;

  try {
    await commentApi.deleteComment(commentId);
    await loadComments();
  } catch (error) {
    console.error('Failed to delete comment:', error);
  }
}

function startReply(comment: Comment) {
  replyingTo.value = comment;
  replyContent.value = '';
}

function cancelReply() {
  replyingTo.value = null;
  replyContent.value = '';
}

async function handleSubmitReply() {
  if (!replyingTo.value || !replyContent.value.trim()) return;

  submittingComment.value = true;
  try {
    await commentApi.createComment({
      docId: documentId.value,
      parentId: replyingTo.value.documentId,
      content: replyContent.value.trim()
    });

    replyingTo.value = null;
    replyContent.value = '';
    await loadComments();
  } catch (error) {
    console.error('Failed to submit reply:', error);
  } finally {
    submittingComment.value = false;
  }
}

function getAccessModeBadge(mode: string) {
  switch (mode) {
    case 'OPEN_EDIT':
      return { class: 'badge-success', text: '公开编辑' };
    case 'OPEN_READONLY':
      return { class: 'badge-info', text: '公开只读' };
    default:
      return { class: 'badge-warning', text: '白名单' };
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="documentStore.loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="documentStore.currentDocument">
      <!-- Document Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold">
              {{ documentStore.currentDocument.title }}
            </h1>
            <div class="flex items-center gap-4 mt-3 text-sm opacity-60">
              <span>{{ documentStore.currentDocument.owner }}</span>
              <span class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ dayjs(documentStore.currentDocument.mtime).fromNow() }}
              </span>
              <span
                class="badge badge-sm"
                :class="getAccessModeBadge(documentStore.currentDocument.accessMode).class"
              >
                {{ getAccessModeBadge(documentStore.currentDocument.accessMode).text }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button v-if="canEdit" class="btn btn-primary" @click="goToEdit">
              <Edit2 class="w-4 h-4" />
              编辑
            </button>

            <div v-if="isOwnerOrAdmin" class="dropdown dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-square">
                <MoreHorizontal class="w-5 h-5" />
              </button>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-44">
                <li>
                  <a @click="goToMembers">
                    <Users class="w-4 h-4" />
                    成员管理
                  </a>
                </li>
                <li>
                  <a @click="goToSpaces">
                    <Link2 class="w-4 h-4" />
                    空间绑定
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Content -->
      <div class="card bg-base-100 shadow-sm mb-8">
        <div class="card-body">
          <TiptapEditor
            v-if="documentStore.currentDocument.content"
            :model-value="documentStore.currentDocument.content"
            :editable="false"
          />
          <p v-else class="opacity-50">暂无内容</p>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-6">
            <MessageSquare class="w-5 h-5" />
            <h2 class="text-lg font-bold">评论</h2>
            <span class="text-sm opacity-50">({{ comments.length }})</span>
          </div>

          <!-- Comment Input -->
          <div class="flex gap-3 mb-6">
            <div class="w-10 rounded-full h-12">
              <span>{{ userStore.displayName?.charAt(0) || 'U' }}</span>
            </div>

            <div class="flex-1">
              <textarea
                v-model="newComment"
                rows="3"
                placeholder="写下你的评论..."
                class="textarea textarea-bordered w-full resize-none"
              ></textarea>
              <div class="flex justify-end mt-2">
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="submittingComment || !newComment.trim()"
                  @click="handleSubmitComment"
                >
                  <Send class="w-4 h-4" />
                  发送
                </button>
              </div>
            </div>
          </div>

          <!-- Comments List -->
          <div v-if="loadingComments" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>

          <div v-else-if="comments.length === 0" class="text-center py-8 opacity-50">
            暂无评论，快来发表第一条评论吧
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="p-4 bg-base-200 rounded-xl"
            >
              <!-- Main Comment -->
              <div class="flex gap-3">
                <div class="avatar placeholder">
                  <div class="w-10 rounded-full h-8">
                    <span>{{ comment.username.charAt(0).toUpperCase() }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ comment.username }}</span>
                      <span class="text-xs opacity-50">{{ dayjs(comment.ctime).fromNow() }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        class="btn btn-ghost btn-xs btn-square"
                        @click="startReply(comment)"
                        title="回复"
                      >
                        <Reply class="w-4 h-4" />
                      </button>
                      <button
                        v-if="comment.username === userStore.username || isOwnerOrAdmin"
                        class="btn btn-ghost btn-xs btn-square"
                        @click="handleDeleteComment(comment.documentId)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="mt-2 opacity-80">{{ comment.content }}</p>
                </div>
              </div>

              <!-- Reply Input -->
              <div v-if="replyingTo?.documentId === comment.documentId" class="mt-4 ml-12 flex gap-2">
                <input
                  v-model="replyContent"
                  type="text"
                  placeholder="写下你的回复..."
                  class="input input-bordered input-sm flex-1"
                  @keyup.enter="handleSubmitReply"
                />
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="!replyContent.trim() || submittingComment"
                  @click="handleSubmitReply"
                >
                  <Send class="w-4 h-4" />
                </button>
                <button class="btn btn-ghost btn-sm btn-square" @click="cancelReply">
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- Replies -->
              <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 ml-12 space-y-3">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="flex gap-3 p-3 bg-base-100 rounded-lg"
                >
                  <div class="avatar placeholder">
                    <div class="w-8 rounded-full h-6 text-sm">
                      <span>{{ reply.username.charAt(0).toUpperCase() }}</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-sm">{{ reply.username }}</span>
                        <span class="text-xs opacity-50">{{ dayjs(reply.ctime).fromNow() }}</span>
                      </div>
                      <button
                        v-if="reply.username === userStore.username || isOwnerOrAdmin"
                        class="btn btn-ghost btn-xs btn-square"
                        @click="handleDeleteComment(reply.documentId)"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                    <p class="mt-1 text-sm opacity-80">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-20 opacity-50">
      文档不存在或已被删除
    </div>
  </div>
</template>
