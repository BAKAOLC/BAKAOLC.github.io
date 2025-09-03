import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
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

// 路由守卫：处理GitHub Pages重定向后的状态恢复
router.beforeEach((to, _from, next) => {
  // 检查是否有GitHub Pages重定向信息
  const redirectPath = sessionStorage.getItem('github-pages-redirect');

  if (redirectPath && to.path === '/' && redirectPath !== '/') {
    // 如果有重定向信息且当前要导航到根路径，则重定向到目标路径
    next(redirectPath);
    return;
  }

  // 清理可能存在的重定向信息
  if (redirectPath) {
    sessionStorage.removeItem('github-pages-redirect');
    sessionStorage.removeItem('github-pages-redirect-full');
  }

  next();
});

// 路由后置守卫：确保重定向后页面状态正确
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
