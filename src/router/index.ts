import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/views/Gallery.vue'),
    },
    {
      path: '/viewer/:imageId',
      name: 'image-viewer',
      component: () => import('@/views/ImageViewer.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
});

// 路由后置守卫：确保页面状态正确
router.afterEach((to) => {
  // 确保页面滚动到顶部（除非有hash）
  if (!to.hash) {
    window.scrollTo(0, 0);
  }

  // 更新页面标题
  const siteTitle = '律影映幻';
  if (to.name === 'home') {
    document.title = siteTitle;
  } else if (to.name === 'gallery') {
    document.title = `画廊 - ${siteTitle}`;
  } else if (to.name === 'image-viewer') {
    document.title = `图片查看器 - ${siteTitle}`;
  } else if (to.name === 'not-found') {
    document.title = `页面未找到 - ${siteTitle}`;
  }
});

export default router;
