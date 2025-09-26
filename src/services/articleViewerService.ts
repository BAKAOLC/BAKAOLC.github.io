import { useRouter } from 'vue-router';

import type { Article } from '@/types';

import ArticleViewerModal from '@/components/modals/ArticleViewerModal.vue';
import { useModalManager } from '@/composables/useModalManager';

export interface ArticleViewerOptions {
  // ��������
  article: Article;
  articles?: Article[];

  // ���ܿ���
  showCopyButton?: boolean;
  showComments?: boolean;
  showNavigation?: boolean;

  // �Զ������ӣ������ⲿ���£�
  customLink?: string;

  // ·�ɿ���
  updateRoute?: boolean; // �Ƿ����·��
  returnRoute?: string; // �ر�ʱ���ص�·��
}

class ArticleViewerService {
  private currentModalId?: string;

  /**
   * �����²鿴��
   */
  open(options: ArticleViewerOptions): string {
    const modalManager = useModalManager();

    // ����Ѿ��д򿪵����²鿴�����ȹر���
    if (this.currentModalId) {
      this.close();
    }

    const modalId = `article-viewer-${Date.now()}`;

    // ��������
    this.currentModalId = modalManager.open({
      id: modalId,
      component: ArticleViewerModal,
      props: {
        article: options.article,
        articles: options.articles,
        showCopyButton: options.showCopyButton ?? true,
        showComments: options.showComments ?? true,
        showNavigation: options.showNavigation ?? true,
        customLink: options.customLink,
      },
      options: {
        width: '90vw',
        height: '90vh',
        maskClosable: true,
        escClosable: true,
        className: 'article-viewer-modal-wrapper',
      },
      onClose: () => {
        this.handleClose(options);
      },
    });

    // ����·�ɣ������Ҫ��
    if (options.updateRoute && options.article.id) {
      this.updateRoute(options.article.id);
    }

    return modalId;
  }

  /**
   * �ر����²鿴��
   */
  close(): void {
    if (this.currentModalId) {
      const modalManager = useModalManager();
      modalManager.close(this.currentModalId);
      this.currentModalId = undefined;
    }
  }

  /**
   * ������ָ������
   */
  navigate(article: Article, updateRoute = true): void {
    if (!this.currentModalId) return;

    const modalManager = useModalManager();
    const modal = modalManager.getModal(this.currentModalId);
    if (!modal) return;

    // ���µ�������
    if (modal.props) {
      modal.props.article = article;
    }

    // ����·�ɣ������Ҫ��
    if (updateRoute) {
      this.updateRoute(article.id);
    }
  }

  /**
   * ����Ƿ��д򿪵����²鿴��
   */
  isOpen(): boolean {
    if (!this.currentModalId) return false;
    const modalManager = useModalManager();
    return modalManager.isModalOpen(this.currentModalId);
  }

  /**
   * ��ȡ��ǰ���²鿴����ģ̬��ID
   */
  getCurrentModalId(): string | undefined {
    return this.currentModalId;
  }

  /**
   * ���ⲿ���£�������·�ɣ�
   */
  openExternal(options: Omit<ArticleViewerOptions, 'updateRoute'>): string {
    return this.open({
      ...options,
      updateRoute: false,
      showCopyButton: options.showCopyButton ?? false, // �ⲿ����Ĭ�ϲ���ʾ���ư�ť
      showComments: options.showComments ?? false, // �ⲿ����Ĭ�ϲ���ʾ����
      showNavigation: options.showNavigation ?? false, // �ⲿ����Ĭ�ϲ���ʾ����
    });
  }

  private handleClose(options: ArticleViewerOptions): void {
    this.currentModalId = undefined;

    // ����ָ��·�ɻ�Ĭ��·��
    if (options.updateRoute) {
      const returnRoute = options.returnRoute || '/articles';
      const router = useRouter();
      router.push(returnRoute);
    }
  }

  private updateRoute(articleId: string): void {
    const router = useRouter();
    router.push({
      name: 'article-detail',
      params: { id: articleId },
    });
  }
}

// ����ʵ��
let articleViewerService: ArticleViewerService | null = null;

export function useArticleViewerService(): ArticleViewerService {
  if (!articleViewerService) {
    articleViewerService = new ArticleViewerService();
  }

  return articleViewerService;
}

// ��ݷ���
export function openArticleViewer(options: ArticleViewerOptions): string {
  const service = useArticleViewerService();
  return service.open(options);
}

export function openExternalArticle(options: Omit<ArticleViewerOptions, 'updateRoute'>): string {
  const service = useArticleViewerService();
  return service.openExternal(options);
}

export function closeArticleViewer(): void {
  const service = useArticleViewerService();
  service.close();
}

export function navigateArticleViewer(article: Article, updateRoute = true): void {
  const service = useArticleViewerService();
  service.navigate(article, updateRoute);
}
