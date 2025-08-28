import { Character, CharacterImage } from '../data/config';

export class ImageCarousel {
  private container: HTMLElement;
  private imagesContainer: HTMLElement;
  private prevBtn: HTMLElement;
  private nextBtn: HTMLElement;
  private imageNameEl: HTMLElement;
  private imageDescEl: HTMLElement;
  private currentCharacter: Character | null = null;
  private currentImageIndex: number = 0;
  private onImageClick?: (image: CharacterImage, character: Character, index: number) => void;

  private isTransitioning: boolean = false;
  private transitionTimeout?: number;
  private clickDebounceTimeout?: number;

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagesContainer = container.querySelector('#images-container') as HTMLElement;
    this.prevBtn = container.querySelector('#prev-btn') as HTMLElement;
    this.nextBtn = container.querySelector('#next-btn') as HTMLElement;
    this.imageNameEl = container.querySelector('#image-name') as HTMLElement;
    this.imageDescEl = container.querySelector('#image-description') as HTMLElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.prevBtn.addEventListener('click', (e) => {
      if (this.isTransitioning) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.debouncedPreviousImage();
    });

    this.nextBtn.addEventListener('click', (e) => {
      if (this.isTransitioning) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.debouncedNextImage();
    });

    this.container.addEventListener('keydown', (e) => {
      if (!this.currentCharacter || this.isTransitioning) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.debouncedPreviousImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.debouncedNextImage();
      }
    });

    this.setupTouchNavigation();
  }

  private debouncedNextImage(): void {
    if (this.isTransitioning) return;
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.clickDebounceTimeout = window.setTimeout(() => {
      this.nextImage();
    }, 100);
  }

  private debouncedPreviousImage(): void {
    if (this.isTransitioning) return;
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.clickDebounceTimeout = window.setTimeout(() => {
      this.previousImage();
    }, 100);
  }

  private setupTouchNavigation(): void {
    let startX: number = 0;
    let startY: number = 0;
    let isDragging: boolean = false;

    this.imagesContainer.addEventListener('touchstart', (e) => {
      if (this.isTransitioning) {
        e.preventDefault();
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    });

    this.imagesContainer.addEventListener('touchmove', (e) => {
      if (!isDragging || this.isTransitioning) return;
      e.preventDefault();
    });

    this.imagesContainer.addEventListener('touchend', (e) => {
      if (!isDragging || !this.currentCharacter || this.isTransitioning) {
        isDragging = false;
        return;
      }

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
        if (diffX > 0) {
          this.debouncedNextImage();
        } else {
          this.debouncedPreviousImage();
        }
      }

      isDragging = false;
    });
  }

  public setCharacter(character: Character): void {
    this.currentCharacter = character;
    this.currentImageIndex = 0;
    this.isTransitioning = false;
    this.cleanupTransitionImages();
    this.stopAutoPlay();
    this.updateDisplay();
  }

  public setImageClickCallback(callback: (image: CharacterImage, character: Character, index: number) => void): void {
    this.onImageClick = callback;
  }

  public nextImage(): void {
    if (this.isTransitioning) return;
    this.nextImageWithAnimation();
  }

  public previousImage(): void {
    if (this.isTransitioning) return;
    this.previousImageWithAnimation();
  }

  public goToImage(index: number): void {
    if (!this.currentCharacter || this.currentCharacter.images.length === 0 || this.isTransitioning) return;
    if (index < 0 || index >= this.currentCharacter.images.length) return;

    this.currentImageIndex = index;
    this.updateDisplay();
  }

  public getCurrentImageIndex(): number {
    return this.currentImageIndex;
  }

  public getCurrentImage(): CharacterImage | null {
    if (!this.currentCharacter || this.currentCharacter.images.length === 0) {
      return null;
    }
    return this.currentCharacter.images[this.currentImageIndex];
  }

  private updateDisplay(): void {
    if (!this.currentCharacter || this.currentCharacter.images.length === 0) {
      this.imagesContainer.innerHTML = '';
      this.updateNavigationVisibility(0);
      return;
    }

    this.updateImageCarousel();
    this.updateImageInfo();
    this.updateNavigationVisibility(this.currentCharacter.images.length);
  }

  private updateImageCarousel(): void {
    if (!this.currentCharacter) return;

    this.imagesContainer.innerHTML = '';

    const totalImages = this.currentCharacter.images.length;

    for (let i = 0; i < 3; i++) {
      const imageIndex = (this.currentImageIndex - 1 + i + totalImages) % totalImages;
      const actualImageIndex = this.currentImageIndex - 1 + i;

      const image = this.currentCharacter.images[imageIndex];

      const imageEl = document.createElement('div');
      imageEl.className = `carousel-image ${i === 1 ? 'active' : ''}`;
      imageEl.dataset.position = i.toString();
      imageEl.dataset.imageIndex = imageIndex.toString();

      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.name;
      img.loading = 'lazy';

      img.addEventListener('click', (e) => {
        if (this.isTransitioning) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (i === 1) {
          if (this.onImageClick) {
            this.onImageClick(image, this.currentCharacter!, actualImageIndex);
          }
        } else {
          if (i === 0) {
            this.debouncedPreviousImage();
          } else if (i === 2) {
            this.debouncedNextImage();
          }
        }
      });

      imageEl.appendChild(img);
      this.imagesContainer.appendChild(imageEl);
    }
  }

  private nextImageWithAnimation(): void {
    if (!this.currentCharacter || this.currentCharacter.images.length === 0 || this.isTransitioning) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % this.currentCharacter.images.length;
    this.updateDisplayWithAnimation('next');
  }

  private previousImageWithAnimation(): void {
    if (!this.currentCharacter || this.currentCharacter.images.length === 0 || this.isTransitioning) return;

    this.currentImageIndex = (this.currentImageIndex - 1 + this.currentCharacter.images.length) % this.currentCharacter.images.length;
    this.updateDisplayWithAnimation('prev');
  }

  private updateDisplayWithAnimation(direction: 'next' | 'prev'): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }

    this.imagesContainer.classList.add(`transitioning-${direction}`);

    this.createTransitionImage(direction);

    this.transitionTimeout = window.setTimeout(() => {
      this.updateImageCarousel();
      this.updateImageInfo();
      this.imagesContainer.classList.remove(`transitioning-${direction}`);
      this.cleanupTransitionImages();
      this.isTransitioning = false;
    }, 500);
  }

  private createTransitionImage(direction: 'next' | 'prev'): void {
    if (!this.currentCharacter) return;

    const totalImages = this.currentCharacter.images.length;
    let imageIndex: number;

    if (direction === 'next') {
      if (totalImages === 1) {
        imageIndex = 0;
      } else if (totalImages === 2) {
        imageIndex = (this.currentImageIndex + 1) % 2;
      } else {
        imageIndex = (this.currentImageIndex + 1) % totalImages;
      }
    } else {
      if (totalImages === 1) {
        imageIndex = 0;
      } else if (totalImages === 2) {
        imageIndex = (this.currentImageIndex + 1) % 2;
      } else {
        imageIndex = (this.currentImageIndex - 2 + totalImages) % totalImages;
      }
    }

    const image = this.currentCharacter.images[imageIndex];

    const imageEl = document.createElement('div');
    imageEl.className = `carousel-image transition-image ${direction}`;
    imageEl.dataset.imageIndex = imageIndex.toString();

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.name;
    img.loading = 'lazy';

    imageEl.appendChild(img);
    this.imagesContainer.appendChild(imageEl);

    imageEl.offsetHeight;

    requestAnimationFrame(() => {
      imageEl.classList.add('sliding-in');
    });
  }

  private cleanupTransitionImages(): void {
    const transitionImages = this.imagesContainer.querySelectorAll('.transition-image');
    transitionImages.forEach(img => img.remove());
  }

  private updateImageInfo(): void {
    if (!this.currentCharacter) return;

    const currentImage = this.currentCharacter.images[this.currentImageIndex];
    if (!currentImage) return;

    this.imageNameEl.textContent = currentImage.name;
    this.imageDescEl.textContent = currentImage.description;
  }

  private updateNavigationVisibility(imageCount: number): void {
    this.prevBtn.style.display = 'flex';
    this.nextBtn.style.display = 'flex';
  }

  private autoPlayInterval?: number;

  public startAutoPlay(interval: number = 5000): void {
    this.stopAutoPlay();
    this.autoPlayInterval = window.setInterval(() => {
      if (!this.isTransitioning) {
        this.nextImage();
      }
    }, interval);
  }

  public stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = undefined;
    }
  }

  public setupAutoPlayControls(): void {
    this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.container.addEventListener('mouseleave', () => this.startAutoPlay());
  }

  public destroy(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.stopAutoPlay();
  }
} 