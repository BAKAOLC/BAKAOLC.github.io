import { config, Character } from '../data/config';
import { LayerManager } from './LayerManager';

export class CharacterSelector {
  private container: HTMLElement;
  private selectorContainer: HTMLElement;
  private currentCharacterId: string = '';
  private onCharacterChange?: (characterId: string) => void;
  private onCharacterSelection?: (characterId: string) => void;
  private selectionContext: 'main' | 'fullscreen' = 'main'; private viewMode: 'grid' | 'list' = 'grid';
  private searchTerm: string = '';
  private isExpanded: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.selectorContainer = container.querySelector('.character-selector') as HTMLElement;
    this.init();
  }

  private init(): void {
    this.setupCompactSelector();
    this.setupEventListeners();
    this.registerToLayerManager();
    if (config.characters.length > 0) {
      this.setActiveCharacter(config.characters[0].id);
    }
  }

  private registerToLayerManager(): void {
    setTimeout(() => {
      const overlay = document.getElementById('character-selector-overlay');
      if (overlay) {
        const layerManager = LayerManager.getInstance();
        layerManager.registerLayer({
          id: 'character-selector-overlay',
          element: overlay,
          background: 'dim'
        });
      }
    }, 0);
  }

  private setupCompactSelector(): void {
    this.selectorContainer.innerHTML = '';
    this.selectorContainer.className = 'character-selector compact';

    const compactContainer = document.createElement('div');
    compactContainer.className = 'compact-selector';

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'character-tabs-compact';
    tabsContainer.id = 'character-tabs-compact';

    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-selector-btn';
    expandBtn.innerHTML = '<i class="fa fa-ellipsis-h"></i>';
    expandBtn.title = '展开角色选择器';
    expandBtn.addEventListener('click', () => this.toggleExpanded());

    const countBadge = document.createElement('div');
    countBadge.className = 'character-count-badge';
    countBadge.textContent = `${config.characters.length}`;

    compactContainer.appendChild(tabsContainer);
    compactContainer.appendChild(expandBtn);
    compactContainer.appendChild(countBadge);

    this.selectorContainer.appendChild(compactContainer);

    this.createExpandedSelector();

    this.updateCompactTabs();
  }

  private updateCompactTabs(): void {
    const tabsContainer = document.getElementById('character-tabs-compact') as HTMLElement;
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    config.characters.forEach((char) => {
      const tab = document.createElement('button');
      tab.className = `character-tab-compact ${char.id === this.currentCharacterId ? 'active' : ''}`;
      tab.textContent = char.name;
      tab.dataset.characterId = char.id;
      tab.title = `切换到${char.name}`;

      tab.addEventListener('click', () => {
        this.setActiveCharacter(char.id);
      });

      tabsContainer.appendChild(tab);
    });

    setTimeout(() => this.scrollToActiveTab(), 50);
  }

  private scrollToActiveTab(): void {
    const tabsContainer = document.getElementById('character-tabs-compact') as HTMLElement;
    if (!tabsContainer) return;

    const activeTab = tabsContainer.querySelector('.character-tab-compact.active') as HTMLElement;
    if (!activeTab) return;

    const containerRect = tabsContainer.getBoundingClientRect();
    const activeTabRect = activeTab.getBoundingClientRect();

    const scrollLeft = tabsContainer.scrollLeft;
    const containerWidth = containerRect.width;
    const tabLeft = activeTabRect.left - containerRect.left + scrollLeft;
    const tabWidth = activeTabRect.width;

    if (tabLeft < scrollLeft || tabLeft + tabWidth > scrollLeft + containerWidth) {
      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2;
      tabsContainer.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }

  private createExpandedSelector(): void {
    const overlay = document.createElement('div');
    overlay.className = 'character-selector-overlay';
    overlay.id = 'character-selector-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeExpanded();
      }
    });

    const modal = document.createElement('div');
    modal.className = 'character-selector-modal';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = '选择角色';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '<i class="fa fa-times"></i>';
    closeBtn.title = '关闭';
    closeBtn.addEventListener('click', () => this.closeExpanded());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const controlBar = document.createElement('div');
    controlBar.className = 'modal-control-bar';

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索角色...';
    searchInput.className = 'character-search';
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      this.updateModalCharacters();
    });

    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = '<i class="fa fa-search"></i>';

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);

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

    const countDisplay = document.createElement('div');
    countDisplay.className = 'character-count';
    countDisplay.id = 'modal-character-count';
    countDisplay.textContent = `显示 ${config.characters.length} 个角色`;

    controlBar.appendChild(searchContainer);
    controlBar.appendChild(countDisplay);
    controlBar.appendChild(viewToggle);

    const charactersGrid = document.createElement('div');
    charactersGrid.className = 'characters-grid grid-view';
    charactersGrid.id = 'modal-characters-grid';

    modal.appendChild(header);
    modal.appendChild(controlBar);
    modal.appendChild(charactersGrid);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  private toggleExpanded(): void {
    if (this.isExpanded) {
      this.closeExpanded();
    } else {
      this.openExpanded();
    }
  }

  public openExpanded(): void {
    this.isExpanded = true;

    const layerManager = LayerManager.getInstance();
    layerManager.showLayer('character-selector-overlay', {
      onOpen: () => {
        this.updateModalCharacters();

        const overlay = document.getElementById('character-selector-overlay');
        const searchInput = overlay?.querySelector('.character-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = '';
          this.searchTerm = '';
          setTimeout(() => searchInput.focus(), 100);
        }
      }
    });
  }

  private closeExpanded(): void {
    this.isExpanded = false;

    const layerManager = LayerManager.getInstance();
    layerManager.hideLayer('character-selector-overlay');
  }

  private switchModalView(newViewMode: 'grid' | 'list'): void {
    this.viewMode = newViewMode;

    const overlay = document.getElementById('character-selector-overlay') as HTMLElement;
    const viewBtns = overlay.querySelectorAll('.view-btn');
    viewBtns.forEach((btn, index) => {
      if ((index === 0 && newViewMode === 'grid') || (index === 1 && newViewMode === 'list')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateModalCharacters();
  }

  private updateModalCharacters(): void {
    const charactersGrid = document.getElementById('modal-characters-grid') as HTMLElement;
    if (!charactersGrid) return;

    const filteredCharacters = config.characters.filter(char =>
      char.name.toLowerCase().includes(this.searchTerm)
    );

    charactersGrid.innerHTML = '';
    charactersGrid.className = `characters-grid ${this.viewMode}-view`;

    filteredCharacters.forEach((char, index) => {
      const characterCard = this.createCharacterCard(char, index);
      charactersGrid.appendChild(characterCard);
    });

    const countDisplay = document.getElementById('modal-character-count') as HTMLElement;
    if (countDisplay) {
      countDisplay.textContent = `显示 ${filteredCharacters.length} / ${config.characters.length} 个角色`;
    }
  }

  private createCharacterCard(character: Character, index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = `character-card ${character.id === this.currentCharacterId ? 'active' : ''}`;
    card.dataset.characterId = character.id;
    card.setAttribute('tabindex', '0');

    const previewContainer = document.createElement('div');
    previewContainer.className = 'character-preview';

    if (character.images.length > 0) {
      const previewImg = document.createElement('img');
      previewImg.src = character.images[0].src;
      previewImg.alt = character.name;
      previewImg.loading = 'lazy';
      previewImg.addEventListener('error', () => {
        previewImg.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = '<i class="fa fa-picture-o"></i>';
        previewContainer.appendChild(placeholder);
      });
      previewContainer.appendChild(previewImg);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';
      placeholder.innerHTML = '<i class="fa fa-picture-o"></i>';
      previewContainer.appendChild(placeholder);
    }

    const infoContainer = document.createElement('div');
    infoContainer.className = 'character-info';

    const nameElement = document.createElement('h4');
    nameElement.className = 'character-name';
    nameElement.textContent = character.name;

    const metaElement = document.createElement('div');
    metaElement.className = 'character-meta';
    metaElement.innerHTML = `
      <span class="image-count">${character.images.length} 张图片</span>
    `;

    infoContainer.appendChild(nameElement);
    infoContainer.appendChild(metaElement);

    const indicator = document.createElement('div');
    indicator.className = 'selection-indicator';
    indicator.innerHTML = '<i class="fa fa-check"></i>';

    card.appendChild(previewContainer);
    card.appendChild(infoContainer);
    card.appendChild(indicator);

    card.addEventListener('click', () => {
      this.setActiveCharacter(character.id);

      if (this.onCharacterSelection) {
        this.onCharacterSelection(character.id);
      }

      if (this.selectionContext === 'main') {
        this.closeExpanded();
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.setActiveCharacter(character.id);

        if (this.onCharacterSelection) {
          this.onCharacterSelection(character.id);
        }

        if (this.selectionContext === 'main') {
          this.closeExpanded();
        }
      }
    });

    return card;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (this.isExpanded) return;
      const currentIndex = config.characters.findIndex(c => c.id === this.currentCharacterId);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (currentIndex - 1 + config.characters.length) % config.characters.length;
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (currentIndex + 1) % config.characters.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = config.characters.length - 1;
      }

      if (newIndex !== currentIndex) {
        this.setActiveCharacter(config.characters[newIndex].id);
      }
    });
  }

  public setActiveCharacter(characterId: string): void {
    if (this.currentCharacterId === characterId) return;

    this.currentCharacterId = characterId;

    this.updateCompactTabs();

    const modalCards = document.querySelectorAll('#modal-characters-grid .character-card');
    modalCards.forEach(card => {
      const cardElement = card as HTMLElement;
      if (cardElement.dataset.characterId === characterId) {
        cardElement.classList.add('active');
      } else {
        cardElement.classList.remove('active');
      }
    });

    if (this.onCharacterChange) {
      this.onCharacterChange(characterId);
    }
  }

  public getCurrentCharacter(): Character | null {
    return config.characters.find(c => c.id === this.currentCharacterId) || null;
  }

  public setCharacterChangeCallback(callback: (characterId: string) => void): void {
    this.onCharacterChange = callback;
  }

  public setCharacterSelectionCallback(callback: (characterId: string) => void, context: 'main' | 'fullscreen' = 'main'): void {
    this.onCharacterSelection = callback;
    this.selectionContext = context;
  }

  public nextCharacter(): void {
    const currentIndex = config.characters.findIndex(c => c.id === this.currentCharacterId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % config.characters.length;
    this.setActiveCharacter(config.characters[nextIndex].id);
  }

  public previousCharacter(): void {
    const currentIndex = config.characters.findIndex(c => c.id === this.currentCharacterId);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + config.characters.length) % config.characters.length;
    this.setActiveCharacter(config.characters[prevIndex].id);
  }

  public destroy(): void {
    const overlay = document.getElementById('character-selector-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }
} 