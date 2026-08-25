import JSON5 from 'json5';

import type { AssetDirectory, AssetItem, ConfigFile, ProjectInfo } from './types';

type ConfigResponse = {
  path: string;
  data: unknown;
  modifiedAt: number;
};

const request = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const data = await response.json() as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? `请求失败（${response.status}）`);
  }
  return data;
};

export const getProject = (): Promise<ProjectInfo> => request('/api/admin/project');

export const listConfigFiles = (directory: string): Promise<ConfigFile[]> => (
  request(`/api/admin/files?directory=${encodeURIComponent(directory)}`)
);

export const loadConfig = (path: string): Promise<ConfigResponse> => (
  request(`/api/admin/config?path=${encodeURIComponent(path)}`)
);

export const saveConfig = (
  path: string,
  data: unknown,
  expectedModifiedAt: number | null,
): Promise<{ path: string; modifiedAt: number }> => request('/api/admin/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, data, expectedModifiedAt }),
});

export const renameConfigFile = (
  path: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<ConfigFile> => request('/api/admin/config-file', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, targetName, expectedModifiedAt }),
});

export const duplicateConfigFile = (
  path: string,
  targetName: string,
  targetId: string,
  expectedModifiedAt: number,
): Promise<ConfigFile> => request('/api/admin/config-file/duplicate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, targetName, targetId, expectedModifiedAt }),
});

export const deleteConfigFile = (path: string, expectedModifiedAt: number): Promise<{ deleted: boolean }> => (
  request(`/api/admin/config-file?path=${encodeURIComponent(path)}&expectedModifiedAt=${expectedModifiedAt}`, {
    method: 'DELETE',
  })
);

export const listAssets = (): Promise<AssetItem[]> => request('/api/admin/assets');

export const listAssetDirectories = (): Promise<AssetDirectory[]> => request('/api/admin/asset-directories');

export const createAssetDirectory = (
  parentDirectory: string,
  name: string,
): Promise<AssetDirectory> => request('/api/admin/asset-directory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ parentDirectory, name }),
});

export const moveAssetDirectory = (
  path: string,
  targetParent: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<AssetDirectory> => request('/api/admin/asset-directory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, targetParent, targetName, expectedModifiedAt }),
});

export const deleteAssetDirectory = (
  path: string,
  expectedModifiedAt: number,
): Promise<{ deleted: boolean }> => request(
  `/api/admin/asset-directory?path=${encodeURIComponent(path)}&expectedModifiedAt=${expectedModifiedAt}`,
  { method: 'DELETE' },
);

export const uploadAsset = async (file: File, directory: string): Promise<{ publicUrl: string }> => (
  request(`/api/admin/upload?directory=${encodeURIComponent(directory)}`, {
    method: 'POST',
    headers: {
      'X-File-Name': encodeURIComponent(file.name),
      'Content-Type': file.type.length > 0 ? file.type : 'application/octet-stream',
    },
    body: file,
  })
);

export const moveAsset = (
  path: string,
  targetDirectory: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<AssetItem> => request('/api/admin/asset', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, targetDirectory, targetName, expectedModifiedAt }),
});

export const duplicateAsset = (
  path: string,
  targetDirectory: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<AssetItem> => request('/api/admin/asset/duplicate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON5.stringify({ path, targetDirectory, targetName, expectedModifiedAt }),
});

export const deleteAsset = (path: string, expectedModifiedAt: number): Promise<{ deleted: boolean }> => (
  request(`/api/admin/asset?path=${encodeURIComponent(path)}&expectedModifiedAt=${expectedModifiedAt}`, {
    method: 'DELETE',
  })
);
