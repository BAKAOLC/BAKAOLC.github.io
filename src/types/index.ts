export interface I18nText {
  en: string;
  zh: string;
  jp: string;
}

// 语言类型
export type Language = 'en' | 'zh' | 'jp';

export interface PersonalInfo {
  avatar: string;
  name: I18nText;
  description: I18nText[];
  links: SocialLink[];
}

export interface SocialLink {
  name: I18nText;
  url: string;
  icon: string;
  color?: string;
}

export interface ImageTag {
  id: string;
  name: I18nText;
  color?: string;
  icon?: string;
}

export interface CharacterImage {
  id: string;
  name: I18nText;
  description: I18nText;
  artist: I18nText;
  src: string;
  thumbnail?: string;
  tags: string[]; // tag IDs
  characters: string[]; // character IDs  
  date?: string; // yyyy-MM-dd format
}

export interface Character {
  id: string;
  name: I18nText;
  description: I18nText;
  avatar?: string;
  color?: string;
}

export interface SiteConfig {
  personal: PersonalInfo;
  characters: Character[];
  tags: ImageTag[];
  images: CharacterImage[];
}

export interface LoadingConfig {
  minLoadTime: number;
  messages: I18nText[];
  tips: I18nText[];
}
