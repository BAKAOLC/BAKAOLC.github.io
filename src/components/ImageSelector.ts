import { Character, CharacterImage } from '../data/config';
import { LayerManager } from './LayerManager';

export class ImageSelector {
  private static instance: ImageSelector;
  private currentCharacter?: Character;
  private onImageSelection?: (image: CharacterImage, character: Character, index: number) => void;
  private onBackToCharacterSelector?: () => void;
  private overlay?: HTMLElement;
  private viewMode: 'grid' | 'list' = 'grid';
  private searchTerm: string = '';

  private constructor() {
    this.createImageSelectorOverlay();
    this.registerToLayerManager();
  }

  public static getInstance(): ImageSelector {
    if (!ImageSelector.instance) {
      ImageSelector.instance = new ImageSelector();
    }
    return ImageSelector.instance;
  }

  public show(character: Character, currentImageIndex: number = 0): void {
    this.currentCharacter = character;
    this.searchTerm = '';
    this.updateModalImages();

    const layerManager = LayerManager.getInstance();
    layerManager.showLayer('image-selector-overlay', {
      onOpen: () => {
        const searchInput = this.overlay?.querySelector('.image-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
      }
    });
  }

  public hide(): void {
    const layerManager = LayerManager.getInstance();
    layerManager.hideLayer('image-selector-overlay');
  }

  public setImageSelectionCallback(callback: (image: CharacterImage, character: Character, index: number) => void): void {
    this.onImageSelection = callback;
  }

  public setBackToCharacterSelectorCallback(callback: () => void): void {
    this.onBackToCharacterSelector = callback;
  }

  private switchModalView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;

    const viewToggle = this.overlay?.querySelector('.view-toggle') as HTMLElement;
    if (viewToggle) {
      const gridBtn = viewToggle.querySelector('.view-btn:first-child') as HTMLButtonElement;
      const listBtn = viewToggle.querySelector('.view-btn:last-child') as HTMLButtonElement;

      if (mode === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
      } else {
        gridBtn.classList.remove('active');
        listBtn.classList.add('active');
      }
    }

    const imagesGrid = this.overlay?.querySelector('#modal-images-grid') as HTMLElement;
    if (imagesGrid) {
      imagesGrid.className = `images-grid ${mode}-view`;
    }

    if (this.currentCharacter) {
      this.updateModalImages();
    }
  }

  private createImageSelectorOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'image-selector-overlay';
    this.overlay.className = 'image-selector-overlay';

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    const modal = document.createElement('div');
    modal.className = 'image-selector-modal';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '<i class="fa fa-arrow-left"></i> 返回';
    backBtn.title = '返回角色选择';
    backBtn.addEventListener('click', () => {
      if (this.onBackToCharacterSelector) {
        this.onBackToCharacterSelector();
      }
    });

    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = '选择图片';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '<i class="fa fa-times"></i>';
    closeBtn.title = '关闭';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(closeBtn);

    const characterInfo = document.createElement('div');
    characterInfo.className = 'current-character-info';

    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'character-avatar';
    avatarContainer.innerHTML = `<img src="" alt="" class="character-avatar-img">`;

    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'character-details';
    detailsContainer.innerHTML = `
      <h4 class="character-name"></h4>
      <p class="character-description"></p>
    `;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'modal-control-bar';

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索图片...';
    searchInput.className = 'image-search';
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      this.updateModalImages();
    });

    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = '<i class="fa fa-search"></i>';

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);

    const countDisplay = document.createElement('div');
    countDisplay.className = 'image-count';
    countDisplay.id = 'modal-image-count';
    countDisplay.textContent = '显示 0 张图片';

    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';

    const gridBtn = document.createElement('button');
    gridBtn.className = 'view-btn active';
    gridBtn.innerHTML = '<i class="fa fa-th"></i>';
    gridBtn.title = '网格视图';
    gridBtn.addEventListener('click', () => this.switchModalView('grid'));

    const listBtn = document.createElement('button');
    listBtn.className = 'view-btn';
    listBtn.innerHTML = '<i class="fa fa-list"></i>';
    listBtn.title = '列表视图';
    listBtn.addEventListener('click', () => this.switchModalView('list'));

    viewToggle.appendChild(gridBtn);
    viewToggle.appendChild(listBtn);

    controlsContainer.appendChild(searchContainer);
    controlsContainer.appendChild(countDisplay);
    controlsContainer.appendChild(viewToggle);

    characterInfo.appendChild(avatarContainer);
    characterInfo.appendChild(detailsContainer);
    characterInfo.appendChild(controlsContainer);

    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'images-grid grid-view';
    imagesGrid.id = 'modal-images-grid';

    modal.appendChild(header);
    modal.appendChild(characterInfo);
    modal.appendChild(imagesGrid);

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);
  }

  private registerToLayerManager(): void {
    if (!this.overlay) return;

    const layerManager = LayerManager.getInstance();
    layerManager.registerLayer({
      id: 'image-selector-overlay',
      element: this.overlay,
      background: 'dim',

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

  private updateModalImages(): void {
    if (!this.overlay || !this.currentCharacter) return;

    const characterName = this.overlay.querySelector('.character-name') as HTMLElement;
    const characterDescription = this.overlay.querySelector('.character-description') as HTMLElement;
    const characterAvatar = this.overlay.querySelector('.character-avatar-img') as HTMLImageElement;

    if (characterName) characterName.textContent = this.currentCharacter.name;
    if (characterDescription) characterDescription.textContent = `${this.currentCharacter.images.length} 张图片`;
    if (characterAvatar && this.currentCharacter.images.length > 0) {
      characterAvatar.src = this.currentCharacter.images[0].src;
      characterAvatar.alt = this.currentCharacter.name;
    }

    const imagesGrid = this.overlay.querySelector('#modal-images-grid') as HTMLElement;
    if (!imagesGrid) return;

    imagesGrid.innerHTML = '';

    const filteredImages = this.currentCharacter.images.filter(image => {
      if (!this.searchTerm) return true;
      return image.name.toLowerCase().includes(this.searchTerm) ||
        image.description.toLowerCase().includes(this.searchTerm);
    });

    filteredImages.forEach((image, index) => {
      const originalIndex = this.currentCharacter!.images.indexOf(image);
      const imageCard = this.createImageCard(image, originalIndex);
      imagesGrid.appendChild(imageCard);
    });

    const countDisplay = this.overlay?.querySelector('#modal-image-count') as HTMLElement;
    if (countDisplay && this.currentCharacter) {
      countDisplay.textContent = `显示 ${filteredImages.length} / ${this.currentCharacter.images.length} 张图片`;
    }
  }

  private createImageCard(image: CharacterImage, index: number): HTMLElement {
    const imageCard = document.createElement('div');
    imageCard.className = `image-card ${this.viewMode}-card`;
    imageCard.tabIndex = 0;

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-preview';

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';
      placeholder.innerHTML = '<i class="fa fa-picture-o"></i>';
      imageContainer.appendChild(placeholder);
    });

    imageContainer.appendChild(img);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'image-info';

    const nameElement = document.createElement('h4');
    nameElement.className = 'image-name';
    nameElement.textContent = image.name;

    const metaElement = document.createElement('div');
    metaElement.className = 'image-meta';
    metaElement.innerHTML = `
      <span class="image-description">${image.description}</span>
    `;

    infoContainer.appendChild(nameElement);
    infoContainer.appendChild(metaElement);

    const indicator = document.createElement('div');
    indicator.className = 'selection-indicator';
    indicator.innerHTML = '<i class="fa fa-check"></i>';

    imageCard.appendChild(imageContainer);
    imageCard.appendChild(infoContainer);
    imageCard.appendChild(indicator);

    if (this.viewMode === 'list') {
      const selectBtn = document.createElement('button');
      selectBtn.className = 'select-btn';
      selectBtn.textContent = '查看';
      imageCard.appendChild(selectBtn);
    }

    imageCard.addEventListener('click', () => {
      if (this.onImageSelection && this.currentCharacter) {
        this.onImageSelection(image, this.currentCharacter, index);
      }
      this.hide();
    });

    imageCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.onImageSelection && this.currentCharacter) {
          this.onImageSelection(image, this.currentCharacter, index);
        }
        this.hide();
      }
    });

    return imageCard;
  }

} 