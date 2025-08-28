import { Character, CharacterImage } from '../data/config';
import { LayerManager } from './LayerManager';

export class FullscreenViewer {
  private viewer: HTMLElement;
  private viewerImage: HTMLImageElement;
  private viewerImageName: HTMLElement;
  private viewerImageDesc: HTMLElement;
  private currentScale: number = 1;
  private isDragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private translateX: number = 0;
  private translateY: number = 0;
  private currentCharacter: Character | null = null;
  private currentImageIndex: number = 0;
  private scrollHandler?: (e: Event) => void;
  private thumbnailsCollapsed: boolean = false;
  private hideUITimeout?: number;
  private isUIVisible: boolean = true;
  private onImageSelectRequest?: (character: Character, imageIndex: number) => void;

  private isTransitioning: boolean = false;
  private transitionTimeout?: number;
  private clickDebounceTimeout?: number;

  private miniMap: HTMLElement;
  private miniMapImage: HTMLImageElement;
  private miniMapViewport: HTMLElement;
  private isMiniMapVisible: boolean = true;
  private canDragImage: boolean = false;

  constructor() {
    this.viewer = document.getElementById('fullscreen-viewer') as HTMLElement;
    this.viewerImage = document.getElementById('viewer-image') as HTMLImageElement;
    this.viewerImageName = document.getElementById('viewer-image-name') as HTMLElement;
    this.viewerImageDesc = document.getElementById('viewer-image-description') as HTMLElement;

    this.miniMap = document.getElementById('mini-map') as HTMLElement;
    this.miniMapImage = document.getElementById('mini-map-image') as HTMLImageElement;
    this.miniMapViewport = document.getElementById('mini-map-viewport') as HTMLElement;

    this.setupEventListeners();
    this.registerToLayerManager();
    this.setupMiniMap();
  }

  private registerToLayerManager(): void {
    const layerManager = LayerManager.getInstance();
    layerManager.registerLayer({
      id: 'fullscreen-viewer',
      element: this.viewer,
      background: 'blur',
      onScroll: (e) => {
        const target = e.target as HTMLElement;
        if (this.viewer.contains(target)) {
          return true;
        }
        return false;
      },
      onKeydown: (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hide();
          return true;
        }
        return false;
      }
    });
  }

  private setupEventListeners(): void {
    const closeBtn = document.getElementById('close-viewer') as HTMLElement;
    closeBtn.addEventListener('click', () => this.hide());
    this.viewer.addEventListener('click', (e) => {
      if (e.target === this.viewer) {
        this.hide();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (!this.viewer.classList.contains('active')) return;

      if (e.key === 'Escape') {
        this.hide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.debouncedShowPreviousImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.debouncedShowNextImage();
      }
    });
    this.viewer.addEventListener('wheel', (e) => {
      if (!this.viewer.classList.contains('active')) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.currentScale = Math.max(0.5, Math.min(3, this.currentScale * delta));
      this.updateImageTransform();
      this.checkImageSize();
    });
    this.setupDragProtection();

    this.viewerImage.addEventListener('mousedown', (e) => {
      if (!this.canDragImage) return;

      e.preventDefault();
      e.stopPropagation();

      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.viewerImage.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.canDragImage) return;

      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;

      this.translateX += deltaX;
      this.translateY += deltaY;

      this.lastX = e.clientX;
      this.lastY = e.clientY;

      this.updateImageTransform();
    });

    document.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }

      this.isDragging = false;
      if (this.canDragImage) {
        this.viewerImage.style.cursor = 'grab';
      } else {
        this.viewerImage.style.cursor = 'default';
      }
    });
    this.viewerImage.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.resetTransform();
    });
    this.setupAutoHideUI();
    this.setupTouchNavigation();
  }
  private setupDragProtection(): void {
    this.viewerImage.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.viewerImage.addEventListener('drag', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.viewerImage.addEventListener('dragend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    this.viewerImage.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.viewerImage.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.viewerImage.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.viewerImage.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    this.viewerImage.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    this.viewerImage.draggable = false;
  }

  private setupTouchNavigation(): void {
    let startX: number = 0;
    let startY: number = 0;
    let isDragging: boolean = false;

    this.viewer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    });

    this.viewer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
    });

    this.viewer.addEventListener('touchend', (e) => {
      if (!isDragging || !this.currentCharacter || e.changedTouches.length !== 1) {
        isDragging = false;
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.showNextImage();
        } else {
          this.showPreviousImage();
        }
      }

      isDragging = false;
    });
  }

  show(image: CharacterImage, character: Character, imageIndex: number): void {
    this.currentCharacter = character;
    this.currentImageIndex = imageIndex;

    this.viewerImage.src = image.src;
    this.viewerImage.alt = image.name;
    this.viewerImageName.textContent = image.name;
    this.viewerImageDesc.textContent = image.description;

    this.viewerImage.draggable = false;

    this.resetTransform();

    const layerManager = LayerManager.getInstance();
    layerManager.showLayer('fullscreen-viewer', {
      onOpen: () => {
        this.updateViewerNavigation();
        this.updateViewerThumbnails();
        this.updateViewerControls();
        this.checkImageSize();

        this.isUIVisible = true;
        this.showAllUI();
        this.resetHideTimer();
      }
    });
  }

  hide(): void {
    const layerManager = LayerManager.getInstance();
    layerManager.hideLayer('fullscreen-viewer', {
      onClose: () => {
        if (this.hideUITimeout) {
          clearTimeout(this.hideUITimeout);
          this.hideUITimeout = undefined;
        }

        this.isUIVisible = true;

        this.cleanupViewerElements();
      }
    });
  }

  private cleanupViewerElements(): void {
    const existingNavs = this.viewer.querySelectorAll('.viewer-nav-btn');
    existingNavs.forEach(btn => btn.remove());

    const existingThumbnails = this.viewer.querySelector('.viewer-thumbnails-wrapper');
    if (existingThumbnails) {
      existingThumbnails.remove();
    }

    const existingControls = this.viewer.querySelectorAll('.viewer-control-btn');
    existingControls.forEach(btn => btn.remove());

    const controlsContainer = this.viewer.querySelector('.viewer-controls');
    if (controlsContainer) {
      controlsContainer.remove();
    }
  }

  private updateViewerNavigation(): void {
    if (!this.currentCharacter) return;

    const existingNavs = this.viewer.querySelectorAll('.viewer-nav-btn');
    existingNavs.forEach(btn => btn.remove());

    if (this.currentCharacter.images.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'viewer-nav-btn viewer-prev-btn';
      prevBtn.innerHTML = '<i class="fa fa-chevron-left"></i>';
      prevBtn.setAttribute('aria-label', '上一张图片');
      prevBtn.addEventListener('click', () => this.debouncedShowPreviousImage());
      this.viewer.appendChild(prevBtn);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'viewer-nav-btn viewer-next-btn';
      nextBtn.innerHTML = '<i class="fa fa-chevron-right"></i>';
      nextBtn.setAttribute('aria-label', '下一张图片');
      nextBtn.addEventListener('click', () => this.debouncedShowNextImage());
      this.viewer.appendChild(nextBtn);
    }
  }

  private updateViewerControls(): void {
    const existingControls = this.viewer.querySelectorAll('.viewer-control-btn');
    existingControls.forEach(btn => btn.remove());

    if (!this.currentCharacter) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'viewer-controls';

    const imageListBtn = document.createElement('button');
    imageListBtn.className = 'viewer-control-btn image-list-control-btn';
    imageListBtn.innerHTML = '<i class="fa fa-th-large"></i>';
    imageListBtn.title = `浏览 ${this.currentCharacter.name} 的图片`;
    imageListBtn.setAttribute('aria-label', '打开图片列表');
    imageListBtn.addEventListener('click', () => {
      if (this.currentCharacter && this.onImageSelectRequest) {
        this.onImageSelectRequest(this.currentCharacter, this.currentImageIndex);
      }
    });

    controlsContainer.appendChild(imageListBtn);
    this.viewer.appendChild(controlsContainer);
  }

  public setImageSelectCallback(callback: (character: Character, imageIndex: number) => void): void {
    this.onImageSelectRequest = callback;
  }

  private updateViewerThumbnails(): void {
    if (!this.currentCharacter) return;

    const existingThumbnails = this.viewer.querySelector('.viewer-thumbnails-wrapper');
    if (existingThumbnails) {
      existingThumbnails.remove();
    }

    if (this.currentCharacter.images.length > 1) {
      const thumbnailsWrapper = document.createElement('div');
      thumbnailsWrapper.className = `viewer-thumbnails-wrapper ${this.thumbnailsCollapsed ? 'collapsed' : ''}`;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'thumbnails-toggle-btn';
      toggleBtn.innerHTML = this.thumbnailsCollapsed ? '<i class="fa fa-chevron-up"></i>' : '<i class="fa fa-chevron-down"></i>';
      toggleBtn.setAttribute('aria-label', this.thumbnailsCollapsed ? '展开缩略图' : '折叠缩略图');
      toggleBtn.addEventListener('click', () => this.toggleThumbnails());

      const thumbnailsContainer = document.createElement('div');
      thumbnailsContainer.className = 'viewer-thumbnails';

      this.currentCharacter.images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = `viewer-thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
        thumb.setAttribute('aria-label', `切换到图片: ${img.name}`);

        const thumbImg = document.createElement('img');
        thumbImg.src = img.src;
        thumbImg.alt = img.name;
        thumbImg.loading = 'lazy';

        thumb.appendChild(thumbImg);
        thumb.addEventListener('click', () => this.showImageByIndex(index));
        thumbnailsContainer.appendChild(thumb);
      });

      thumbnailsWrapper.appendChild(toggleBtn);
      thumbnailsWrapper.appendChild(thumbnailsContainer);
      this.viewer.appendChild(thumbnailsWrapper);

      if (!this.thumbnailsCollapsed) {
        this.scrollThumbnailToView();
      }
    }
  }

  private setupAutoHideUI(): void {
    this.viewer.addEventListener('mousemove', () => {
      this.showAllUI();
      this.resetHideTimer();
    });

    this.viewer.addEventListener('mouseleave', () => {
      this.hideAllUI();
    });

    document.addEventListener('keydown', (e) => {
      if (this.viewer.classList.contains('active')) {
        this.showAllUI();
        this.resetHideTimer();
      }
    });

    this.viewer.addEventListener('touchstart', () => {
      this.showAllUI();
      this.resetHideTimer();
    });
  }

  private showAllUI(): void {
    this.isUIVisible = true;

    const viewerInfo = document.getElementById('viewer-info') as HTMLElement;
    if (viewerInfo) {
      viewerInfo.style.opacity = '1';
      viewerInfo.style.visibility = 'visible';
      viewerInfo.style.pointerEvents = 'auto';
    }

    const navButtons = this.viewer.querySelectorAll('.viewer-nav-btn');
    navButtons.forEach(btn => {
      const button = btn as HTMLElement;
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto';
    });

    const closeBtn = document.getElementById('close-viewer') as HTMLElement;
    if (closeBtn) {
      closeBtn.style.opacity = '1';
      closeBtn.style.visibility = 'visible';
      closeBtn.style.pointerEvents = 'auto';
      closeBtn.style.zIndex = '1001';
    }

    const thumbnailsWrapper = this.viewer.querySelector('.viewer-thumbnails-wrapper') as HTMLElement;
    if (thumbnailsWrapper) {
      thumbnailsWrapper.style.opacity = '1';
      thumbnailsWrapper.style.visibility = 'visible';
      thumbnailsWrapper.style.pointerEvents = 'auto';
    }

    const controlButtons = this.viewer.querySelectorAll('.viewer-control-btn');
    controlButtons.forEach(btn => {
      const button = btn as HTMLElement;
      button.style.opacity = '1';
      button.style.visibility = 'visible';
      button.style.pointerEvents = 'auto';
    });
  }

  private hideAllUI(): void {
    this.isUIVisible = false;

    const viewerInfo = document.getElementById('viewer-info') as HTMLElement;
    if (viewerInfo) {
      viewerInfo.style.opacity = '0';
      viewerInfo.style.visibility = 'hidden';
      viewerInfo.style.pointerEvents = 'none';
    }

    const navButtons = this.viewer.querySelectorAll('.viewer-nav-btn');
    navButtons.forEach(btn => {
      const button = btn as HTMLElement;
      button.style.opacity = '0';
      button.style.visibility = 'hidden';
      button.style.pointerEvents = 'none';
    });

    const closeBtn = document.getElementById('close-viewer') as HTMLElement;
    if (closeBtn) {
      closeBtn.style.opacity = '0.3';
      closeBtn.style.visibility = 'visible';
      closeBtn.style.pointerEvents = 'auto';
      closeBtn.style.zIndex = '1001';
    }

    const thumbnailsWrapper = this.viewer.querySelector('.viewer-thumbnails-wrapper') as HTMLElement;
    if (thumbnailsWrapper) {
      thumbnailsWrapper.style.opacity = '0';
      thumbnailsWrapper.style.visibility = 'hidden';
      thumbnailsWrapper.style.pointerEvents = 'none';
    }

    const controlButtons = this.viewer.querySelectorAll('.viewer-control-btn');
    controlButtons.forEach(btn => {
      const button = btn as HTMLElement;
      button.style.opacity = '0';
      button.style.visibility = 'hidden';
      button.style.pointerEvents = 'none';
    });
  }

  private resetHideTimer(): void {
    if (this.hideUITimeout) {
      clearTimeout(this.hideUITimeout);
    }

    this.hideUITimeout = window.setTimeout(() => {
      this.hideAllUI();
    }, 3000);
  }

  private toggleThumbnails(): void {
    this.thumbnailsCollapsed = !this.thumbnailsCollapsed;

    const thumbnailsWrapper = this.viewer.querySelector('.viewer-thumbnails-wrapper') as HTMLElement;
    const toggleBtn = this.viewer.querySelector('.thumbnails-toggle-btn') as HTMLElement;

    if (thumbnailsWrapper && toggleBtn) {
      if (this.thumbnailsCollapsed) {
        thumbnailsWrapper.classList.add('collapsed');
        toggleBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
        toggleBtn.setAttribute('aria-label', '展开缩略图');
      } else {
        thumbnailsWrapper.classList.remove('collapsed');
        toggleBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
        toggleBtn.setAttribute('aria-label', '折叠缩略图');
        setTimeout(() => this.scrollThumbnailToView(), 300);
      }
    }
  }

  private scrollThumbnailToView(): void {
    const thumbnailsContainer = this.viewer.querySelector('.viewer-thumbnails') as HTMLElement;
    if (!thumbnailsContainer) return;

    const activeThumbnail = thumbnailsContainer.querySelector('.viewer-thumbnail.active') as HTMLElement;
    if (!activeThumbnail) return;

    const containerWidth = thumbnailsContainer.clientWidth;
    const containerScrollWidth = thumbnailsContainer.scrollWidth;

    if (containerScrollWidth <= containerWidth) return;

    const thumbLeft = activeThumbnail.offsetLeft;
    const thumbWidth = activeThumbnail.offsetWidth;
    const thumbCenter = thumbLeft + (thumbWidth / 2);
    const containerCenter = containerWidth / 2;

    const scrollPosition = thumbCenter - containerCenter;
    const maxScroll = containerScrollWidth - containerWidth;
    const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

    thumbnailsContainer.scrollTo({
      left: finalScrollPosition,
      behavior: 'smooth'
    });
  }

  private debouncedShowNextImage(): void {
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.clickDebounceTimeout = window.setTimeout(() => {
      this.showNextImage();
    }, 100);
  }

  private debouncedShowPreviousImage(): void {
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.clickDebounceTimeout = window.setTimeout(() => {
      this.showPreviousImage();
    }, 100);
  }

  private showPreviousImage(): void {
    if (!this.currentCharacter || this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.currentCharacter.images.length) % this.currentCharacter.images.length;
    this.updateCurrentImage();

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    this.transitionTimeout = window.setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  private showNextImage(): void {
    if (!this.currentCharacter || this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.currentCharacter.images.length;
    this.updateCurrentImage();

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    this.transitionTimeout = window.setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  private showImageByIndex(index: number): void {
    if (!this.currentCharacter || this.isTransitioning) return;
    if (index < 0 || index >= this.currentCharacter.images.length) return;

    this.isTransitioning = true;
    this.currentImageIndex = index;
    this.updateCurrentImage();

    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    this.transitionTimeout = window.setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  private updateCurrentImage(): void {
    if (!this.currentCharacter) return;

    const currentImage = this.currentCharacter.images[this.currentImageIndex];
    if (!currentImage) return;

    this.viewerImage.style.opacity = '0.5';

    this.viewerImage.src = currentImage.src;
    this.viewerImage.alt = currentImage.name;
    this.viewerImageName.textContent = currentImage.name;
    this.viewerImageDesc.textContent = currentImage.description;

    this.viewerImage.draggable = false;

    this.viewerImage.onload = () => {
      this.viewerImage.style.opacity = '1';
      this.viewerImage.draggable = false;
      this.checkImageSize();
    };

    this.resetTransform();
    this.updateViewerThumbnails();

    this.showAllUI();
    this.resetHideTimer();
  }

  private updateImageTransform(): void {
    this.viewerImage.style.transform =
      `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`;

    this.updateMiniMapViewport();
  }

  private resetTransform(): void {
    this.currentScale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateImageTransform();
  }

  public destroy(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    if (this.hideUITimeout) {
      clearTimeout(this.hideUITimeout);
    }
  }

  private setupMiniMap(): void {

    this.miniMap.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.target === this.miniMapImage || e.target === this.miniMap) {
        this.navigateToClickPosition(e);
      }
    });


    this.setupMiniMapImageDragProtection();
    this.setupViewportDrag();
  }

  private setupMiniMapImageDragProtection(): void {

    this.miniMapImage.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.miniMapImage.addEventListener('drag', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.miniMapImage.addEventListener('dragend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.miniMapImage.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    this.miniMapImage.draggable = false;
    this.miniMapImage.style.userSelect = 'none';
    this.miniMapImage.style.pointerEvents = 'none';
  }

  private navigateToClickPosition(e: MouseEvent): void {
    if (!this.canDragImage || !this.currentCharacter) return;

    const miniMapRect = this.miniMap.getBoundingClientRect();
    const clickX = e.clientX - miniMapRect.left;
    const clickY = e.clientY - miniMapRect.top;

    const imageRect = this.viewerImage.getBoundingClientRect();
    const viewerRect = this.viewer.getBoundingClientRect();

    const scaleX = miniMapRect.width / imageRect.width;
    const scaleY = miniMapRect.height / imageRect.height;
    const scale = Math.min(scaleX, scaleY);

    const viewportWidth = viewerRect.width * scale;
    const viewportHeight = viewerRect.height * scale;

    const newViewportX = clickX - viewportWidth / 2;
    const newViewportY = clickY - viewportHeight / 2;

    this.updateViewerFromViewport(newViewportX, newViewportY);
  }

  private setupViewportDrag(): void {
    let isDraggingViewport = false;
    let startX = 0;
    let startY = 0;
    let startViewportX = 0;
    let startViewportY = 0;

    this.miniMapViewport.addEventListener('mousedown', (e) => {
      if (!this.canDragImage) return;

      e.preventDefault();
      e.stopPropagation();
      isDraggingViewport = true;
      startX = e.clientX;
      startY = e.clientY;
      startViewportX = parseFloat(this.miniMapViewport.style.left) || 0;
      startViewportY = parseFloat(this.miniMapViewport.style.top) || 0;
      this.miniMapViewport.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDraggingViewport || !this.canDragImage) return;

      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newViewportX = startViewportX + deltaX;
      const newViewportY = startViewportY + deltaY;

      this.updateViewerFromViewport(newViewportX, newViewportY);
    });

    document.addEventListener('mouseup', (e) => {
      if (isDraggingViewport) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingViewport = false;
        this.miniMapViewport.classList.remove('dragging');
      }
    });
  }

  private updateViewerFromViewport(viewportX: number, viewportY: number): void {
    if (!this.currentCharacter) return;

    const miniMapRect = this.miniMap.getBoundingClientRect();
    const imageRect = this.viewerImage.getBoundingClientRect();
    const viewerRect = this.viewer.getBoundingClientRect();

    const scaleX = miniMapRect.width / imageRect.width;
    const scaleY = miniMapRect.height / imageRect.height;
    const scale = Math.min(scaleX, scaleY);

    const viewportWidth = viewerRect.width * scale;
    const viewportHeight = viewerRect.height * scale;

    const clampedViewportX = Math.max(0, Math.min(viewportX, miniMapRect.width - viewportWidth));
    const clampedViewportY = Math.max(0, Math.min(viewportY, miniMapRect.height - viewportHeight));

    this.miniMapViewport.style.left = `${clampedViewportX}px`;
    this.miniMapViewport.style.top = `${clampedViewportY}px`;

    const newTranslateX = -(clampedViewportX - (miniMapRect.width - viewportWidth) / 2) / scale;
    const newTranslateY = -(clampedViewportY - (miniMapRect.height - viewportHeight) / 2) / scale;

    this.translateX = newTranslateX;
    this.translateY = newTranslateY;
    this.updateImageTransform();
  }

  private updateMiniMap(): void {
    if (!this.currentCharacter || !this.isMiniMapVisible || !this.canDragImage) return;

    const currentImage = this.currentCharacter.images[this.currentImageIndex];
    if (!currentImage) return;

    this.miniMapImage.src = currentImage.src;
    this.miniMapImage.alt = currentImage.name;

    this.updateMiniMapViewport();
  }

  private updateMiniMapViewport(): void {
    if (!this.miniMapImage.complete) {
      this.miniMapImage.onload = () => this.updateMiniMapViewport();
      return;
    }

    const miniMapRect = this.miniMap.getBoundingClientRect();
    const imageRect = this.viewerImage.getBoundingClientRect();
    const viewerRect = this.viewer.getBoundingClientRect();

    const scaleX = miniMapRect.width / imageRect.width;
    const scaleY = miniMapRect.height / imageRect.height;
    const scale = Math.min(scaleX, scaleY);

    const viewportWidth = Math.min(viewerRect.width * scale, miniMapRect.width);
    const viewportHeight = Math.min(viewerRect.height * scale, miniMapRect.height);

    const viewportX = (-this.translateX * scale) + (miniMapRect.width - viewportWidth) / 2;
    const viewportY = (-this.translateY * scale) + (miniMapRect.height - viewportHeight) / 2;

    const clampedViewportX = Math.max(0, Math.min(viewportX, miniMapRect.width - viewportWidth));
    const clampedViewportY = Math.max(0, Math.min(viewportY, miniMapRect.height - viewportHeight));

    this.miniMapViewport.style.width = `${viewportWidth}px`;
    this.miniMapViewport.style.height = `${viewportHeight}px`;
    this.miniMapViewport.style.left = `${clampedViewportX}px`;
    this.miniMapViewport.style.top = `${clampedViewportY}px`;
  }

  private toggleMiniMap(): void {
    this.isMiniMapVisible = !this.isMiniMapVisible;
    this.miniMap.style.opacity = this.isMiniMapVisible ? '1' : '0.3';
  }

  private checkImageSize(): void {
    if (!this.viewerImage.complete) {
      this.viewerImage.onload = () => this.checkImageSize();
      return;
    }

    const viewerRect = this.viewer.getBoundingClientRect();
    const imageRect = this.viewerImage.getBoundingClientRect();

    const imageExceedsViewport =
      (imageRect.width * this.currentScale > viewerRect.width) ||
      (imageRect.height * this.currentScale > viewerRect.height);

    this.canDragImage = imageExceedsViewport;

    if (imageExceedsViewport) {
      this.miniMap.classList.add('visible');
      this.viewerImage.style.cursor = 'grab';
    } else {
      this.miniMap.classList.remove('visible');
      this.viewerImage.style.cursor = 'default';
      this.centerImage();
    }

    this.updateMiniMap();
  }

  private centerImage(): void {
    this.translateX = 0;
    this.translateY = 0;
    this.updateImageTransform();
  }
} 