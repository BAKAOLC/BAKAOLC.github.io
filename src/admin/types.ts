export type AdminWidget
  = | 'boolean'
  | 'color'
  | 'datetime'
  | 'file'
  | 'image'
  | 'keyvalue'
  | 'list'
  | 'markdown'
  | 'number'
  | 'object'
  | 'relation'
  | 'select'
  | 'string'
  | 'text';

export type AdminOption = string | { label: string; value: string | number };

export type AdminField = {
  name: string;
  label: string;
  widget?: AdminWidget;
  required?: boolean;
  hint?: string;
  default?: unknown;
  fields?: AdminField[];
  options?: AdminOption[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  type?: string;
  format?: string;
  pattern?: [RegExp, string];
  accept?: string;
  media_folder?: string;
  public_folder?: string;
  after_input?: string;
  value_type?: 'float' | 'int';
  label_singular?: string;
  summary?: string;
  thumbnail?: string;
  root?: boolean;
  locale?: 'zh' | 'en' | 'jp';
  localized?: boolean;
  relation?: 'articleCategories' | 'characters' | 'languages' | 'linkTags' | 'tags';
  collapsed?: boolean | 'auto';
  minimize_collapsed?: boolean;
  allowInput?: boolean;
  key_label?: string;
  value_label?: string;
  modes?: string[];
};

export type AdminCodec
  = | 'article'
  | 'articleCategories'
  | 'articlesPage'
  | 'app'
  | 'bgm'
  | 'characterProfile'
  | 'characters'
  | 'default'
  | 'image'
  | 'languages'
  | 'links'
  | 'personal'
  | 'sites'
  | 'tags';

export type AdminResource = {
  id: string;
  label: string;
  description: string;
  icon: string;
  kind: 'collection' | 'file';
  path: string;
  codec: AdminCodec;
  fields: AdminField[];
  previewPath?: string;
  singular?: string;
};

export type AdminSection = {
  id: string;
  label: string;
  icon: string;
  resources: AdminResource[];
};

export type ProjectInfo = {
  name: string;
  root: string;
  branch: string;
  siteTitle: string;
  counts: Record<string, number>;
};

export type ConfigFile = {
  path: string;
  name: string;
  id: string;
  data: unknown;
  modifiedAt: number;
};

export type AssetItem = {
  path: string;
  publicUrl: string;
  name: string;
  directory: string;
  type: 'audio' | 'document' | 'image' | 'other' | 'video';
  size: number;
  modifiedAt: number;
};

export type AssetDirectory = {
  path: string;
  name: string;
  parent: string | null;
  modifiedAt: number;
};
