import type { I18nText } from './language';

export interface Character {
  id: string;
  name: I18nText;
  description: I18nText;
  avatar?: string;
  color?: string;
}

export interface CharacterInfoCard {
  id: string;
  title?: I18nText;
  content?: I18nText;
  color?: string;
}

export interface CharacterVariantImage {
  id: string;
  src: string;
  alt: I18nText;
  infoCards?: CharacterInfoCard[];
}

export interface CharacterVariant {
  id: string;
  name: I18nText;
  images: CharacterVariantImage[];
  infoCards?: CharacterInfoCard[];
}

export interface CharacterProfile {
  id: string;
  name: I18nText;
  color?: string;
  variants: CharacterVariant[];
}

export interface CharacterProfilesConfig {
  characters: CharacterProfile[];
}
