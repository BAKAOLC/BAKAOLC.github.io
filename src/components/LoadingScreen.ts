import { loadingConfig, getRandomLoadingMessage } from '../data/loading-config';
import { LayerManager } from './LayerManager';

export class LoadingScreen {
  private loadingElement!: HTMLElement;
  private isPageLoaded: boolean = false;
  private isProgressComplete: boolean = false;
  private currentProgress: number = 0;
  private onLoadComplete?: () => void;
  private layerManager!: LayerManager;

  constructor() {
    this.createLoadingScreen();
    this.setupEventListeners();
  }

  private createLoadingScreen(): void {
    this.loadingElement = document.createElement('div');
    this.loadingElement.id = 'loading-screen';
    this.loadingElement.className = 'loading-screen active';

    const randomMessage = getRandomLoadingMessage();

    this.loadingElement.innerHTML = `
      <div class="loading-container">
        <div class="loading-logo">
          <div class="logo-circle">
            <div class="logo-inner"></div>
          </div>
        </div>
        <div class="loading-text">
          <h2 class="loading-title">${loadingConfig.title}</h2>
          <p class="loading-subtitle">${randomMessage}</p>
        </div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
        <div class="loading-animation">
          <div class="dot dot-1"></div>
          <div class="dot dot-2"></div>
          <div class="dot dot-3"></div>
        </div>
      </div>
      <div class="loading-background"></div>
    `;

    this.applyCustomColors();

    document.body.insertBefore(this.loadingElement, document.body.firstChild);

    this.layerManager = LayerManager.getInstance();
    this.layerManager.registerLayer({
      id: 'loading-screen',
      element: this.loadingElement,
      background: 'transparent',
      onScroll: () => true, onKeydown: () => true, onTouchmove: () => true
    });
    this.layerManager.showLayer('loading-screen');
  }

  private applyCustomColors(): void {
    const { primary, secondary, accent } = loadingConfig.colors;

    this.loadingElement.style.background = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;

    this.loadingElement.style.setProperty('--loading-primary', primary);
    this.loadingElement.style.setProperty('--loading-secondary', secondary);
    this.loadingElement.style.setProperty('--loading-accent', accent);
  }

  private setupEventListeners(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.startProgressAnimation();
      });
    } else {
      this.startProgressAnimation();
    }

    window.addEventListener('load', () => {
      this.completeLoading();
    });
  }

  private startProgressAnimation(): void {
    const progressFill = this.loadingElement.querySelector('.progress-fill') as HTMLElement;
    const progressText = this.loadingElement.querySelector('.progress-text') as HTMLElement;
    const duration = loadingConfig.duration.minLoadTime;
    const interval = loadingConfig.duration.progressSpeed;
    const increment = (interval / duration) * 100;

    const updateProgress = () => {
      const randomIncrement = increment + Math.random() * 1.5;
      this.currentProgress += randomIncrement;

      const maxProgress = this.isPageLoaded ? 100 : 95;
      this.currentProgress = Math.min(this.currentProgress, maxProgress);

      if (progressFill) {
        progressFill.style.width = `${this.currentProgress}%`;
      }
      if (progressText) {
        progressText.textContent = `${Math.floor(this.currentProgress)}%`;
      }

      if (this.currentProgress >= 100) {
        this.isProgressComplete = true;
        this.checkCompleteAndHide();
        return;
      }

      if (this.currentProgress < maxProgress) {
        setTimeout(updateProgress, interval);
      }
    };

    updateProgress();
  }

  private completeLoading(): void {
    this.isPageLoaded = true;

    if (!this.isProgressComplete && this.currentProgress < 100) {
      this.continueProgressToComplete();
    }

    this.checkCompleteAndHide();
  }

  private continueProgressToComplete(): void {
    const progressFill = this.loadingElement.querySelector('.progress-fill') as HTMLElement;
    const progressText = this.loadingElement.querySelector('.progress-text') as HTMLElement;
    const interval = loadingConfig.duration.progressSpeed;

    const updateProgress = () => {
      const increment = 2 + Math.random() * 3;
      this.currentProgress += increment;
      this.currentProgress = Math.min(this.currentProgress, 100);

      if (progressFill) {
        progressFill.style.width = `${this.currentProgress}%`;
      }
      if (progressText) {
        progressText.textContent = `${Math.floor(this.currentProgress)}%`;
      }

      if (this.currentProgress >= 100) {
        this.isProgressComplete = true;
        this.checkCompleteAndHide();
        return;
      }

      setTimeout(updateProgress, interval);
    };

    updateProgress();
  }

  private checkCompleteAndHide(): void {
    if (this.isPageLoaded && this.isProgressComplete) {
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 500);
    }
  }

  private hideLoadingScreen(): void {
    this.loadingElement.classList.add('fade-out');

    this.layerManager.hideLayer('loading-screen');

    if (this.onLoadComplete) {
      this.onLoadComplete();
    }

    setTimeout(() => {
      if (this.loadingElement && this.loadingElement.parentNode) {
        this.loadingElement.parentNode.removeChild(this.loadingElement);
      }
    }, 1000);
  }

  public setLoadCompleteCallback(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  public forceComplete(): void {
    this.completeLoading();
  }

  public isLoadingComplete(): boolean {
    return this.isPageLoaded && this.isProgressComplete;
  }
} 