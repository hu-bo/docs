import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useSpaceStore } from '@/stores/space';

// Access status cache
const accessStatusCache = new Map<string, { hasAccess: boolean; expiresAt: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

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
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
      },
      {
        path: 'spaces',
        name: 'SpaceList',
        component: () => import('@/views/space/SpaceList.vue'),
      },
      {
        path: 'space/:spaceId',
        name: 'SpaceDetail',
        component: () => import('@/views/space/SpaceDetail.vue'),
        meta: { requiresSpaceAccess: true },
        children: [
          {
            path: '',
            name: 'SpaceHome',
            component: () => import('@/views/space/SpaceHome.vue'),
          },
          {
            path: 'folder/:folderPath+',
            name: 'FolderView',
            component: () => import('@/views/space/SpaceHome.vue'),
          },
          {
            path: 'doc/:documentId',
            name: 'DocumentView',
            component: () => import('@/views/document/DocumentView.vue'),
          },
          {
            path: 'doc/new',
            name: 'DocumentNew',
            component: () => import('@/views/document/DocumentEdit.vue'),
          },
          {
            path: 'doc/:documentId/edit',
            name: 'DocumentEdit',
            component: () => import('@/views/document/DocumentEdit.vue'),
          },
          {
            path: 'doc/:documentId/members',
            name: 'DocumentMembers',
            component: () => import('@/views/document/DocumentMembers.vue'),
          },
          {
            path: 'doc/:documentId/spaces',
            name: 'DocumentSpaces',
            component: () => import('@/views/document/DocumentSpaces.vue'),
          },
          {
            path: 'folder/:folderPath+/doc/new',
            name: 'FolderDocumentNew',
            component: () => import('@/views/document/DocumentEdit.vue'),
          },
          {
            path: 'folder/:folderPath+/doc/:documentId',
            name: 'FolderDocumentView',
            component: () => import('@/views/document/DocumentView.vue'),
          },
          {
            path: 'folder/:folderPath+/doc/:documentId/edit',
            name: 'FolderDocumentEdit',
            component: () => import('@/views/document/DocumentEdit.vue'),
          },
          {
            path: 'members',
            name: 'SpaceMembers',
            component: () => import('@/views/space/SpaceMembers.vue'),
            meta: { requiresSuperAdmin: true },
          },
        ],
      },
      {
        path: 'space/:spaceId/access-denied',
        name: 'SpaceAccessDenied',
        component: () => import('@/views/space/SpaceAccessDenied.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const spaceStore = useSpaceStore();

  // Check space access
  if (to.meta.requiresSpaceAccess) {
    const spaceId = to.params.spaceId as string;
    if (!spaceId) {
      next({ name: 'Home' });
      return;
    }

    // Check cache first
    const cached = accessStatusCache.get(spaceId);
    if (cached && Date.now() < cached.expiresAt) {
      if (!cached.hasAccess) {
        next({ name: 'SpaceAccessDenied', params: { spaceId } });
        return;
      }
    } else {
      // Fetch access status
      // try {
      //   const status = await spaceStore.checkAccessStatus(spaceId);

      //   // Update cache
      //   accessStatusCache.set(spaceId, {
      //     hasAccess: status.hasAccess,
      //     expiresAt: Date.now() + CACHE_TTL,
      //   });

      //   if (!status.hasAccess) {
      //     next({ name: 'SpaceAccessDenied', params: { spaceId } });
      //     return;
      //   }
      // } catch (error) {
      //   console.error('Failed to check access status:', error);
      //   next({ name: 'SpaceAccessDenied', params: { spaceId } });
      //   return;
      // }
    }
  }

  // Check super admin requirement
  if (to.meta.requiresSuperAdmin) {
    if (!spaceStore.isSuperAdmin) {
      const spaceId = to.params.spaceId as string;
      next({ name: 'SpaceHome', params: { spaceId } });
      return;
    }
  }

  next();
});

export default router;
