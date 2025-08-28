import './styles/main.css';
import { config, Character, CharacterImage } from './data/config';
import { PersonalInfo } from './components/PersonalInfo';
import { CharacterSelector } from './components/CharacterSelector';
import { ImageCarousel } from './components/ImageCarousel';
import { FullscreenViewer } from './components/FullscreenViewer';
import { LayerManager } from './components/LayerManager';
import { LoadingScreen } from './components/LoadingScreen';
import { ImageSelector } from './components/ImageSelector';

class PersonalHomepage {
  private personalInfo!: PersonalInfo;
  private characterSelector!: CharacterSelector;
  private imageCarousel!: ImageCarousel;
  private fullscreenViewer!: FullscreenViewer;

  private loadingScreen!: LoadingScreen;

  constructor() {
    this.initWithLoading();
  }

  private initWithLoading(): void {
    this.loadingScreen = new LoadingScreen();

    this.loadingScreen.setLoadCompleteCallback(() => {
      this.showMainInterface();
    });
  }

  public init(): void {
    LayerManager.getInstance();

    const personalSection = document.getElementById('section-personal') as HTMLElement;
    this.personalInfo = new PersonalInfo(personalSection);

    this.setupCharacterComponents();

    LayerManager.getInstance().initPageScroll();

    this.fullscreenViewer = new FullscreenViewer();

    this.setupComponentCommunication();
  }

  private showMainInterface(): void {
    const app = document.getElementById('app') as HTMLElement;
    if (app) {
      app.classList.add('loaded');
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        this.personalInfo.playIntroAnimation();
      }, 300);
    });
  }

  private setupCharacterComponents(): void {
    if (config.characters.length === 0) return;

    const charactersSection = document.getElementById('section-characters') as HTMLElement;

    this.characterSelector = new CharacterSelector(charactersSection);

    this.imageCarousel = new ImageCarousel(charactersSection);
  }

  private setupComponentCommunication(): void {
    this.characterSelector.setCharacterChangeCallback((characterId: string) => {
      const character = config.characters.find(c => c.id === characterId);
      if (character) {
        this.imageCarousel.setCharacter(character);
      }
    });


    this.characterSelector.setCharacterSelectionCallback((characterId: string) => {
      const character = config.characters.find(c => c.id === characterId);
      if (character && character.images.length > 0) {
        this.openImageSelectorFromMain(character);
      }
    }, 'main');

    this.imageCarousel.setImageClickCallback((image, character, index) => {
      this.fullscreenViewer.show(image, character, index);
    });

    this.fullscreenViewer.setImageSelectCallback((character, imageIndex) => {
      this.openImageSelectorFromViewer(character, imageIndex);
    });

    if (config.characters.length > 0) {
      const firstCharacter = config.characters[0];
      this.imageCarousel.setCharacter(firstCharacter);
    }
  }

  private openImageSelectorFromMain(character: Character): void {
    const imageSelector = ImageSelector.getInstance();

    imageSelector.setImageSelectionCallback((image, character, index) => {
      this.fullscreenViewer.show(image, character, index);

      this.imageCarousel.setCharacter(character);
      this.imageCarousel.goToImage(index);
    });

    imageSelector.setBackToCharacterSelectorCallback(() => {
      const layerManager = LayerManager.getInstance();
      layerManager.switchLayer('image-selector-overlay', 'character-selector-overlay', {
        onSwitch: () => {
          this.characterSelector.openExpanded();

          this.characterSelector.setCharacterSelectionCallback((characterId: string) => {
            const selectedCharacter = config.characters.find(c => c.id === characterId);
            if (selectedCharacter && selectedCharacter.images.length > 0) {
              layerManager.hideLayer('character-selector-overlay', {
                onClose: () => {
                  this.openImageSelectorFromMain(selectedCharacter);
                }
              });
            }
          }, 'main');
        }
      });
    });

    imageSelector.show(character, 0);
  }

  private openImageSelectorFromViewer(character: Character, currentImageIndex: number): void {
    const imageSelector = ImageSelector.getInstance();

    imageSelector.setImageSelectionCallback((image, character, index) => {
      this.fullscreenViewer.show(image, character, index);

      this.imageCarousel.setCharacter(character);
      this.imageCarousel.goToImage(index);
    });

    imageSelector.setBackToCharacterSelectorCallback(() => {
      const layerManager = LayerManager.getInstance();
      layerManager.switchLayer('image-selector-overlay', 'character-selector-overlay', {
        onSwitch: () => {
          this.characterSelector.openExpanded();

          this.characterSelector.setCharacterSelectionCallback((characterId: string) => {
            const selectedCharacter = config.characters.find(c => c.id === characterId);
            if (selectedCharacter && selectedCharacter.images.length > 0) {
              layerManager.hideLayer('character-selector-overlay', {
                onClose: () => {
                  this.openImageSelectorFromViewer(selectedCharacter, 0);
                }
              });
            }
          }, 'fullscreen');
        }
      });
    });

    imageSelector.show(character, currentImageIndex);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  const homepage = new PersonalHomepage();

  requestAnimationFrame(() => {
    homepage.init();
  });
}); 