interface LayerConfig {
  id: string;
  element: HTMLElement;
  background?: 'blur' | 'dim' | 'transparent';
  onOpen?: () => void;
  onClose?: () => void;
  onActive?: () => void;
  onInactive?: () => void;
  onScroll?: (e: WheelEvent) => boolean;
  onKeydown?: (e: KeyboardEvent) => boolean;
  onTouchmove?: (e: TouchEvent) => boolean;
}

interface LayerInfo {
  config: LayerConfig;
  isVisible: boolean;
}

interface PageScrollConfig {
  sections: NodeListOf<Element>;
  dots: NodeListOf<Element>;
  currentSection: number;
  isScrolling: boolean;
}

export class LayerManager {
  private static instance: LayerManager;
  private layers: Map<string, LayerInfo> = new Map();
  private layerStack: string[] = []; private baseZIndex: number = 1000;
  private originalBodyStyles: { [key: string]: string } = {};

  private pageScrollConfig?: PageScrollConfig;

  private constructor() {
    this.setupGlobalEventListeners();
  }

  public static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  public initPageScroll(): void {
    const sections = document.querySelectorAll('.section');
    const dots = document.querySelectorAll('.scroll-dot');

    if (sections.length === 0) return;

    this.pageScrollConfig = {
      sections,
      dots,
      currentSection: 0,
      isScrolling: false
    };

    this.setupScrollIndicators();
    this.updateScrollIndicators();
    this.setupResizeHandler();
  }

  public registerLayer(config: LayerConfig): void {
    console.log(`[LayerManager] 注册层级: ${config.id}`);

    const layerInfo: LayerInfo = {
      config,
      isVisible: false
    };

    this.layers.set(config.id, layerInfo);

    const layerIndex = this.layers.size - 1;
    const zIndex = this.baseZIndex + (layerIndex * 10);
    config.element.style.zIndex = zIndex.toString();
    console.log(`[LayerManager] 分配z-index: ${config.id} = ${zIndex}`);

    config.element.style.display = 'none';
  }

  public showLayer(layerId: string, options?: { onOpen?: () => void }): void {
    const layerInfo = this.layers.get(layerId);
    if (!layerInfo) {
      console.error(`[LayerManager] 层级未找到: ${layerId}`);
      return;
    }

    console.log(`[LayerManager] 显示层级: ${layerId}`);

    layerInfo.config.element.style.display = 'flex';
    layerInfo.config.element.classList.add('active');
    layerInfo.isVisible = true;

    const existingIndex = this.layerStack.indexOf(layerId);
    if (existingIndex >= 0) {
      this.layerStack.splice(existingIndex, 1);
    }
    this.layerStack.push(layerId);

    this.applyLayerBackground(layerId);

    this.updateBodyScrollState();

    if (options?.onOpen) options.onOpen();
    if (layerInfo.config.onOpen) layerInfo.config.onOpen();
    if (layerInfo.config.onActive) layerInfo.config.onActive();
  }

  public hideLayer(layerId: string, options?: { onClose?: () => void }): void {
    const layerInfo = this.layers.get(layerId);
    if (!layerInfo) {
      console.error(`[LayerManager] 层级未找到: ${layerId}`);
      return;
    }

    console.log(`[LayerManager] 隐藏层级: ${layerId}`);

    layerInfo.config.element.style.display = 'none';
    layerInfo.config.element.classList.remove('active');
    layerInfo.isVisible = false;

    const index = this.layerStack.indexOf(layerId);
    if (index >= 0) {
      this.layerStack.splice(index, 1);
    }

    this.updateBodyScrollState();

    if (options?.onClose) options.onClose();
    if (layerInfo.config.onClose) layerInfo.config.onClose();
    if (layerInfo.config.onInactive) layerInfo.config.onInactive();
  }

  public switchLayer(fromLayerId: string, toLayerId: string, options?: {
    onSwitch?: () => void;
    keepFromLayer?: boolean;
  }): void {
    console.log(`[LayerManager] 层级切换: ${fromLayerId} -> ${toLayerId}`);

    if (!options?.keepFromLayer) {
      this.hideLayer(fromLayerId);
    }

    this.showLayer(toLayerId, {
      onOpen: options?.onSwitch
    });
  }

  public hideAllLayers(): void {
    console.log('[LayerManager] 关闭所有层级');

    const layerIds = Array.from(this.layers.keys());
    layerIds.forEach(layerId => {
      this.hideLayer(layerId);
    });

    this.layerStack = [];
    this.updateBodyScrollState();
  }

  public getTopLayer(): string | null {
    return this.layerStack.length > 0 ? this.layerStack[this.layerStack.length - 1] : null;
  }

  public isLayerVisible(layerId: string): boolean {
    const layerInfo = this.layers.get(layerId);
    return layerInfo ? layerInfo.isVisible : false;
  }

  private applyLayerBackground(layerId: string): void {
    const layerInfo = this.layers.get(layerId);
    if (!layerInfo) return;

    const { background } = layerInfo.config;
    const element = layerInfo.config.element;

    switch (background) {
      case 'blur':
        element.style.backdropFilter = 'blur(10px)';
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        break;
      case 'dim':
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        break;
      case 'transparent':
        element.style.backgroundColor = 'transparent';
        break;
    }
  }

  private updateBodyScrollState(): void {
    if (this.layerStack.length > 0) {
      this.blockBodyScroll();
    } else {
      this.restoreBodyScroll();
    }
  }

  private blockBodyScroll(): void {
    if (document.body.style.position === 'fixed') return;
    console.log('[LayerManager] 阻止body滚动');

    this.saveBodyStyles();

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = `-${scrollY}px`;
  }

  private restoreBodyScroll(): void {
    if (document.body.style.position !== 'fixed') return;
    console.log('[LayerManager] 恢复body滚动');

    const scrollY = parseInt(document.body.style.top?.replace('-', '')?.replace('px', '') || '0');

    for (const [key, value] of Object.entries(this.originalBodyStyles)) {
      if (value) {
        document.body.style.setProperty(key, value);
      } else {
        document.body.style.removeProperty(key);
      }
    }

    window.scrollTo(0, scrollY);
  }

  private saveBodyStyles(): void {
    this.originalBodyStyles = {
      overflow: document.body.style.overflow || '',
      position: document.body.style.position || '',
      width: document.body.style.width || '',
      height: document.body.style.height || '',
      top: document.body.style.top || ''
    };
  }

  private setupGlobalEventListeners(): void {
    document.addEventListener('wheel', (e) => {
      this.handleWheelEvent(e);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      this.handleKeydownEvent(e);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      this.handleTouchmoveEvent(e);
    }, { passive: false });
  }

  private handleWheelEvent(e: WheelEvent): void {
    if (this.layerStack.length > 0) {
      const target = e.target as HTMLElement;

      for (let i = this.layerStack.length - 1; i >= 0; i--) {
        const layerId = this.layerStack[i];
        const layerInfo = this.layers.get(layerId);

        if (layerInfo && layerInfo.config.element.contains(target)) {
          return;
        }
      }

      e.preventDefault();
      return;
    }

    if (this.pageScrollConfig) {
      this.handlePageScroll(e);
    }
  }

  private handleKeydownEvent(e: KeyboardEvent): void {
    for (let i = this.layerStack.length - 1; i >= 0; i--) {
      const layerId = this.layerStack[i];
      const layerInfo = this.layers.get(layerId);

      if (layerInfo?.config.onKeydown) {
        const handled = layerInfo.config.onKeydown(e);
        if (handled) {
          return;
        }
      }
    }

    if (this.pageScrollConfig) {
      this.handlePageKeydown(e);
    }
  }

  private handleTouchmoveEvent(e: TouchEvent): void {
    for (let i = this.layerStack.length - 1; i >= 0; i--) {
      const layerId = this.layerStack[i];
      const layerInfo = this.layers.get(layerId);

      if (layerInfo?.config.onTouchmove) {
        const handled = layerInfo.config.onTouchmove(e);
        if (handled) {
          return;
        }
      }
    }
  }

  private handlePageScroll(e: WheelEvent): void {
    if (!this.pageScrollConfig || this.pageScrollConfig.isScrolling) return;

    e.preventDefault();
    this.pageScrollConfig.isScrolling = true;

    if (e.deltaY > 0 && this.pageScrollConfig.currentSection < this.pageScrollConfig.sections.length - 1) {
      this.pageScrollConfig.currentSection++;
      this.scrollToSection(this.pageScrollConfig.currentSection);
    } else if (e.deltaY < 0 && this.pageScrollConfig.currentSection > 0) {
      this.pageScrollConfig.currentSection--;
      this.scrollToSection(this.pageScrollConfig.currentSection);
    } else {
      this.pageScrollConfig.isScrolling = false;
    }
  }

  private handlePageKeydown(e: KeyboardEvent): void {
    if (!this.pageScrollConfig || this.pageScrollConfig.isScrolling) return;

    if (e.key === 'ArrowDown' && this.pageScrollConfig.currentSection < this.pageScrollConfig.sections.length - 1) {
      e.preventDefault();
      this.pageScrollConfig.isScrolling = true;
      this.pageScrollConfig.currentSection++;
      this.scrollToSection(this.pageScrollConfig.currentSection);
    } else if (e.key === 'ArrowUp' && this.pageScrollConfig.currentSection > 0) {
      e.preventDefault();
      this.pageScrollConfig.isScrolling = true;
      this.pageScrollConfig.currentSection--;
      this.scrollToSection(this.pageScrollConfig.currentSection);
    }
  }

  private scrollToSection(sectionIndex: number): void {
    if (!this.pageScrollConfig) return;

    const targetSection = this.pageScrollConfig.sections[sectionIndex] as HTMLElement;

    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    this.updateScrollIndicators();

    setTimeout(() => {
      if (this.pageScrollConfig) {
        this.pageScrollConfig.isScrolling = false;
      }
    }, 800);
  }

  private setupScrollIndicators(): void {
    if (!this.pageScrollConfig) return;

    this.pageScrollConfig.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        if (this.pageScrollConfig && !this.pageScrollConfig.isScrolling) {
          this.pageScrollConfig.currentSection = index;
          this.scrollToSection(index);
        }
      });
    });
  }

  private updateScrollIndicators(): void {
    if (!this.pageScrollConfig) return;

    this.pageScrollConfig.dots.forEach((dot, index) => {
      if (index === this.pageScrollConfig!.currentSection) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  public goToPage(pageIndex: number): void {
    if (!this.pageScrollConfig || this.pageScrollConfig.isScrolling) return;
    if (pageIndex < 0 || pageIndex >= this.pageScrollConfig.sections.length) return;

    this.pageScrollConfig.currentSection = pageIndex;
    this.scrollToSection(pageIndex);
  }

  public getCurrentPage(): number {
    return this.pageScrollConfig?.currentSection ?? 0;
  }

  private setupResizeHandler(): void {
    let resizeTimer: number;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.handleResize();
      }, 100);
    });
  }

  private handleResize(): void {
    if (!this.pageScrollConfig || this.pageScrollConfig.isScrolling) return;

    const currentSection = this.pageScrollConfig.sections[this.pageScrollConfig.currentSection] as HTMLElement;
    if (!currentSection) return;

    const rect = currentSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (Math.abs(rect.top) > windowHeight * 0.1) {
      this.scrollToSection(this.pageScrollConfig.currentSection);
    }
  }
} 