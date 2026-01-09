<script setup lang="ts">
import { computed } from 'vue';
import { Shield, Edit2, Trash2 } from 'lucide-vue-next';
import type { UserSpaceAuth, DocUserAcl } from '@/types';

type MemberItem = UserSpaceAuth | DocUserAcl;

const props = defineProps<{
  members: MemberItem[];
  type: 'space' | 'document';
  currentUsername?: string;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  'edit': [member: MemberItem];
  'remove': [username: string];
}>();

function isSpaceMember(member: MemberItem): member is UserSpaceAuth {
  return 'superAdmin' in member;
}

function isDocMember(member: MemberItem): member is DocUserAcl {
  return 'perm' in member;
}

const sortedMembers = computed(() => {
  return [...props.members].sort((a, b) => {
    if (isSpaceMember(a) && isSpaceMember(b)) {
      if (a.superAdmin && !b.superAdmin) return -1;
      if (!a.superAdmin && b.superAdmin) return 1;
    }
    return a.username.localeCompare(b.username);
  });
});

function getPermissionBadges(member: MemberItem): string[] {
  if (isSpaceMember(member)) {
    const badges: string[] = [];
    if (member.superAdmin) badges.push('管理员');
    if (member.canCreateFolder) badges.push('创建目录');
    if (member.canCreateDoc) badges.push('创建文档');
    if (badges.length === 0 && member.canRead) badges.push('只读');
    return badges;
  } else if (isDocMember(member)) {
    return [member.perm === 'EDIT' ? '编辑' : '只读'];
  }
  return [];
}

function getSourceLabel(member: MemberItem): string | null {
  if (isSpaceMember(member)) {
    return member.source === 'AUTO_INIT' ? '自动添加' : null;
  }
  return null;
}

function handleEdit(member: MemberItem) {
  emit('edit', member);
}

function handleRemove(username: string) {
  if (confirm(`确定要移除成员 ${username} 吗？`)) {
    emit('remove', username);
  }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>用户</th>
          <th>权限</th>
          <th v-if="canEdit">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in sortedMembers" :key="member.username">
          <td>
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content w-10 rounded-full">
                  <span>{{ member.username.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div>
                <div class="font-bold flex items-center gap-2">
                  {{ member.username }}
                  <span v-if="member.username === currentUsername" class="badge badge-primary badge-sm">我</span>
                  <Shield v-if="isSpaceMember(member) && member.superAdmin" class="w-4 h-4 text-warning" />
                </div>
                <div v-if="getSourceLabel(member)" class="text-sm opacity-50">{{ getSourceLabel(member) }}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="badge in getPermissionBadges(member)"
                :key="badge"
                class="badge badge-ghost badge-sm"
              >
                {{ badge }}
              </span>
            </div>
          </td>
          <td v-if="canEdit">
            <div v-if="member.username !== currentUsername" class="flex gap-1">
              <button class="btn btn-ghost btn-xs" @click="handleEdit(member)">
                <Edit2 class="w-4 h-4" />
              </button>
              <button class="btn btn-ghost btn-xs text-error" @click="handleRemove(member.username)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="members.length === 0" class="text-center py-8 opacity-50">
      暂无成员
    </div>
  </div>
</template>
