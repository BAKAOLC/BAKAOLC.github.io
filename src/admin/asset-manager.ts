import type { InjectionKey } from 'vue';

export type AssetManagerMode = 'manage' | 'select';

export type AssetManagerOpenOptions = {
  accept?: string;
  directory?: string;
  mode?: AssetManagerMode;
  multiple?: boolean;
};

export type AssetManagerContext = {
  open: (options?: AssetManagerOpenOptions) => Promise<string | string[] | null>;
  upload: (files: File[], directory?: string) => Promise<string[]>;
};

export const assetManagerKey: InjectionKey<AssetManagerContext> = Symbol('asset-manager');

export const normalizeAssetDirectory = (directory?: string): string => {
  const normalized = (directory ?? 'public/assets').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const withPublic = normalized.startsWith('public/') ? normalized : `public/${normalized}`;
  if (['public/assets', 'public/articles', 'public/live2d'].some(root => withPublic === root || withPublic.startsWith(`${root}/`))) {
    return withPublic;
  }
  return 'public/assets';
};
