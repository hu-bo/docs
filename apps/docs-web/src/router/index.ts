import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router';
import { checkAccessStatus, type SpaceAccessStatus } from '@/api/space';
import { message } from 'ant-design-vue';
import { useSpaceStore } from '@/stores/space';

// 缓存空间访问状态，避免重复请求
const accessStatusCache = new Map<string, { status: SpaceAccessStatus; timestamp: number }>();
const CACHE_TTL = 60000; // 1分钟缓存

async function getSpaceAccessStatus(spaceId: string): Promise<SpaceAccessStatus | null> {
  // 检查缓存
  const cached = accessStatusCache.get(spaceId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.status;
  }

  try {
    const status = await checkAccessStatus(spaceId) as unknown as SpaceAccessStatus;
    accessStatusCache.set(spaceId, { status, timestamp: Date.now() });
    return status;
  } catch {
    return null;
  }
}

// 清除缓存（用于权限变更后）
export function clearAccessStatusCache(spaceId?: string) {
  if (spaceId) {
    accessStatusCache.delete(spaceId);
  } else {
    accessStatusCache.clear();
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/spaces',
    name: 'SpaceList',
    component: () => import('@/views/space/SpaceList.vue'),
    meta: { title: '空间列表' },
  },
  {
    path: '/space/:spaceId',
    component: () => import('@/views/space/SpaceDetail.vue'),
    meta: { title: '空间详情', requiresSpaceAccess: true },
    children: [
      {
        path: '',
        name: 'SpaceHome',
        component: () => import('@/views/space/SpaceHome.vue'),
        meta: { title: '空间首页' },
      },
      {
        path: 'members',
        name: 'SpaceMembers',
        component: () => import('@/views/space/SpaceMembers.vue'),
        meta: { title: '成员管理', requiresSuperAdmin: true },
      },
      // 支持目录层级路径: /space/:spaceId/folder/:folderId1/folder/:folderId2/...
      {
        path: 'folder/:folderPath+',
        name: 'FolderView',
        component: () => import('@/views/space/SpaceHome.vue'),
        meta: { title: '文件夹' },
      },
      {
        path: 'doc/:documentId',
        name: 'DocumentView',
        component: () => import('@/views/document/DocumentView.vue'),
        meta: { title: '文档查看' },
      },
      {
        path: 'doc/:documentId/edit',
        name: 'DocumentEdit',
        component: () => import('@/views/document/DocumentEdit.vue'),
        meta: { title: '编辑文档' },
      },
      {
        path: 'doc/:documentId/members',
        name: 'DocumentMembers',
        component: () => import('@/views/document/DocumentMembers.vue'),
        meta: { title: '文档成员' },
      },
      {
        path: 'doc/:documentId/spaces',
        name: 'DocumentSpaces',
        component: () => import('@/views/document/DocumentSpaces.vue'),
        meta: { title: '空间绑定' },
      },
      // 支持在目录下查看/编辑文档: /space/:spaceId/folder/.../doc/:documentId
      {
        path: 'folder/:folderPath+/doc/:documentId',
        name: 'FolderDocumentView',
        component: () => import('@/views/document/DocumentView.vue'),
        meta: { title: '文档查看' },
      },
      {
        path: 'folder/:folderPath+/doc/:documentId/edit',
        name: 'FolderDocumentEdit',
        component: () => import('@/views/document/DocumentEdit.vue'),
        meta: { title: '编辑文档' },
      },
    ],
  },
  {
    path: '/space/:spaceId/access-denied',
    name: 'SpaceAccessDenied',
    component: () => import('@/views/space/SpaceAccessDenied.vue'),
    meta: { title: '访问申请' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 检查路由是否需要空间权限
function requiresSpaceAccess(to: RouteLocationNormalized): boolean {
  return to.matched.some(record => record.meta.requiresSpaceAccess);
}

// 检查路由是否需要管理员权限
function requiresSuperAdmin(to: RouteLocationNormalized): boolean {
  return to.matched.some(record => record.meta.requiresSuperAdmin);
}

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '向日葵文档'} - 向日葵文档`;

  const spaceId = to.params.spaceId as string;

  // 检查空间访问权限
  if (spaceId && requiresSpaceAccess(to)) {
    const status = await getSpaceAccessStatus(spaceId);

    if (!status) {
      message.error('获取权限信息失败');
      return next('/spaces');
    }

    if (!status.hasAccess) {
      return next(`/space/${spaceId}/access-denied`);
    }

    // 将用户权限信息存入 store
    if (status.auth) {
      const spaceStore = useSpaceStore();
      spaceStore.setCurrentUserAuth(status.auth);
    }

    // 检查管理员权限
    if (requiresSuperAdmin(to) && !status.isSuperAdmin) {
      message.warning('仅空间管理员可访问');
      return next(`/space/${spaceId}`);
    }
  }

  next();
});

export default router;
