<script setup lang="ts">
/* eslint-disable @stylistic/max-len */
import {
  NAlert, NButton, NDropdown, NEmpty, NFormItem, NInput, NModal, NSelect,
  NSpace, NSpin, NTag, NTree, type TreeOption, useDialog, useMessage,
} from 'naive-ui';
import { computed, h, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  createAssetDirectory, deleteAsset, deleteAssetDirectory, duplicateAsset,
  listAssetDirectories, listAssets, moveAsset, moveAssetDirectory, uploadAsset,
} from '../api';
import { normalizeAssetDirectory } from '../asset-manager';
import { resolveAssetUrl } from '../asset-url';
import { preservesNativeContextMenu, useContextMenuEscape } from '../context-menu';
import type { AssetDirectory, AssetItem } from '../types';

import AdminIcon from './AdminIcon.vue';

import { useTimers } from '@/composables/useTimers';

const props = withDefaults(defineProps<{
  show: boolean;
  accept?: string;
  defaultDirectory?: string;
  mode?: 'manage' | 'select';
  multiple?: boolean;
}>(), { accept: '', defaultDirectory: 'public/assets', mode: 'select', multiple: false });

const emit = defineEmits<{
  'update:show': [value: boolean];
  assetsChange: [];
  select: [value: string | string[]];
}>();

type ScopeMode = 'all' | 'directory';
type ViewMode = 'grid' | 'list';
type EditorKind = 'directory' | 'file';
type EditorMode = 'duplicate' | 'move';
type ContextTarget
  = | { kind: 'directory'; directory: AssetDirectory }
    | { kind: 'file'; asset: AssetItem }
    | { kind: 'general' };

const managedRoots = ['public/assets', 'public/articles', 'public/live2d'] as const;
const INTERNAL_ASSET_DRAG_TYPE = 'application/x-personal-homepage-asset';
const message = useMessage();
const dialog = useDialog();
const { locale: uiLocale, t } = useI18n();
const rootLabel = (path: string): string => ({
  'public/assets': t('assets.siteAssets'),
  'public/articles': t('assets.articleFiles'),
  'public/live2d': 'Live2D',
}[path] ?? path.split('/').pop() ?? path);
const { clearTimeout, requestAnimationFrame, setTimeout } = useTimers();
const assets = ref<AssetItem[]>([]);
const directories = ref<AssetDirectory[]>([]);
const loading = ref(false);
const uploading = ref(false);
const externalDragActive = ref(false);
const draggedAsset = ref<AssetItem | null>(null);
const dropTargetDirectory = ref<string | null>(null);
const dropTargetIsExplicit = ref(false);
const dropBusy = ref(false);
const search = ref('');
const selected = ref<string[]>([]);
const focusedAsset = ref<AssetItem | null>(null);
const currentDirectory = ref(normalizeAssetDirectory(props.defaultDirectory));
const scopeMode = ref<ScopeMode>('directory');
const viewMode = ref<ViewMode>('grid');
const typeFilter = ref(props.accept.startsWith('image/') ? 'image' : 'all');
const sortBy = ref('name');
const expandedKeys = ref<string[]>([...managedRoots]);
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const uploadInput = ref<HTMLInputElement | null>(null);
const contextMenuShow = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextTarget = ref<ContextTarget>({ kind: 'general' });
let longPressTimer: number | null = null;
let longPressStart: { x: number; y: number } | null = null;
let suppressClickUntil = 0;
useContextMenuEscape(contextMenuShow);

const createDirectoryShow = ref(false);
const createDirectoryBusy = ref(false);
const createDirectoryName = ref('');

const editorShow = ref(false);
const editorBusy = ref(false);
const editorKind = ref<EditorKind>('file');
const editorMode = ref<EditorMode>('move');
const editingAsset = ref<AssetItem | null>(null);
const editingDirectory = ref<AssetDirectory | null>(null);
const editorName = ref('');
const editorParent = ref('public/assets');

const fileMenuOptions = computed(() => [
  { label: t('assets.copyPublicPath'), key: 'copy-path' },
  { label: t('assets.duplicate'), key: 'duplicate' },
  { label: t('assets.moveRenameLong'), key: 'edit' },
  { type: 'divider', key: 'divider' },
  { label: t('assets.permanentDelete'), key: 'delete' },
]);
const directoryMenuOptions = computed(() => [
  { label: t('assets.moveRenameLong'), key: 'edit' },
  { type: 'divider', key: 'divider' },
  { label: t('assets.deleteEmptyFolder'), key: 'delete' },
]);
const generalMenuOptions = computed(() => [
  { label: t('assets.newFolder'), key: 'new-folder', disabled: scopeMode.value !== 'directory' },
  { label: t('assets.uploadCurrent'), key: 'upload', disabled: scopeMode.value !== 'directory' },
  { type: 'divider', key: 'divider' },
  { label: t('ui.refresh'), key: 'refresh' },
]);
const contextMenuOptions = computed(() => {
  if (contextTarget.value.kind === 'file') return fileMenuOptions.value;
  if (contextTarget.value.kind === 'directory') {
    const isRoot = managedRoots.includes(contextTarget.value.directory.path as typeof managedRoots[number]);
    return [
      { label: t('assets.openFolder'), key: 'open' },
      { label: t('assets.newChild'), key: 'new-child' },
      ...(!isRoot
        ? [
          { type: 'divider', key: 'divider' },
          ...directoryMenuOptions.value,
        ]
        : []),
    ];
  }
  return generalMenuOptions.value;
});
const typeOptions = computed(() => [
  { label: t('assets.allTypes'), value: 'all' },
  { label: t('assets.image'), value: 'image' },
  { label: t('assets.audio'), value: 'audio' },
  { label: t('assets.video'), value: 'video' },
  { label: t('assets.document'), value: 'document' },
  { label: t('assets.other'), value: 'other' },
]);
const sortOptions = computed(() => [
  { label: t('assets.name'), value: 'name' },
  { label: t('assets.modified'), value: 'modified' },
  { label: t('assets.size'), value: 'size' },
]);

const directoryMap = computed(() => new Map(directories.value.map(directory => [directory.path, directory])));
const childDirectories = computed(() => {
  const grouped = new Map<string | null, AssetDirectory[]>();
  for (const directory of directories.value) {
    const siblings = grouped.get(directory.parent) ?? [];
    siblings.push(directory);
    grouped.set(directory.parent, siblings);
  }
  for (const siblings of grouped.values()) siblings.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  return grouped;
});
const makeTreeNode = (directory: AssetDirectory): TreeOption => ({
  key: directory.path,
  label: managedRoots.includes(directory.path as typeof managedRoots[number]) ? rootLabel(directory.path) : directory.name,
  children: (childDirectories.value.get(directory.path) ?? []).map(makeTreeNode),
});
const directoryTree = computed<TreeOption[]>(() => managedRoots
  .map(root => directoryMap.value.get(root))
  .filter((directory): directory is AssetDirectory => Boolean(directory))
  .map(makeTreeNode));
const selectedTreeKeys = computed(() => scopeMode.value === 'directory' ? [currentDirectory.value] : []);

const isInsideDirectory = (path: string, directory: string): boolean => path === directory || path.startsWith(`${directory}/`);
const searchKeyword = computed(() => search.value.trim().toLocaleLowerCase());
const visibleDirectories = computed(() => {
  if (scopeMode.value === 'all') return [];
  if (!searchKeyword.value) return childDirectories.value.get(currentDirectory.value) ?? [];
  return directories.value.filter(directory => (
    directory.path !== currentDirectory.value
      && isInsideDirectory(directory.path, currentDirectory.value)
      && directory.path.toLocaleLowerCase().includes(searchKeyword.value)
  ));
});
const visibleAssets = computed(() => {
  const filtered = assets.value.filter(asset => {
    const typeMatches = typeFilter.value === 'all' || asset.type === typeFilter.value;
    if (!typeMatches) return false;
    if (scopeMode.value === 'all') {
      return !searchKeyword.value || asset.path.toLocaleLowerCase().includes(searchKeyword.value);
    }
    if (searchKeyword.value) {
      return isInsideDirectory(asset.path, currentDirectory.value)
        && asset.path.toLocaleLowerCase().includes(searchKeyword.value);
    }
    return `public/${asset.directory}` === currentDirectory.value;
  });
  return [...filtered].sort((left, right) => {
    if (sortBy.value === 'modified') return right.modifiedAt - left.modifiedAt;
    if (sortBy.value === 'size') return right.size - left.size;
    return left.name.localeCompare(right.name, 'zh-CN');
  });
});
const itemCount = computed(() => visibleDirectories.value.length + visibleAssets.value.length);
const breadcrumbs = computed(() => {
  if (scopeMode.value === 'all') return [{ label: t('assets.allFiles'), path: '' }];
  const root = managedRoots.find(path => isInsideDirectory(currentDirectory.value, path)) ?? 'public/assets';
  const result: Array<{ label: string; path: string }> = [{ label: rootLabel(root), path: root }];
  let path: string = root;
  for (const part of currentDirectory.value.slice(root.length).split('/').filter(Boolean)) {
    path = `${path}/${part}`;
    result.push({ label: part, path });
  }
  return result;
});
const parentDirectory = computed(() => directoryMap.value.get(currentDirectory.value)?.parent ?? null);
const canGoBack = computed(() => historyIndex.value > 0);
const canGoForward = computed(() => historyIndex.value >= 0 && historyIndex.value < history.value.length - 1);
const currentScopeLabel = computed(() => scopeMode.value === 'all' ? t('assets.allDirectories') : currentDirectory.value);

const formatSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
const formatDate = (timestamp: number): string => new Intl.DateTimeFormat(uiLocale.value === 'en' ? 'en-US' : uiLocale.value === 'jp' ? 'ja-JP' : 'zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(timestamp);
const assetIcon = (asset: AssetItem): string => {
  if (asset.type === 'audio') return 'AudioLines';
  if (asset.type === 'video') return 'Video';
  if (asset.type === 'document') return 'FileText';
  return 'Archive';
};
const directFileCount = (path: string): number => assets.value.filter(asset => `public/${asset.directory}` === path).length;
const directFolderCount = (path: string): number => (childDirectories.value.get(path) ?? []).length;

const openContextMenuAt = (x: number, y: number, target: ContextTarget): void => {
  contextMenuShow.value = false;
  contextMenuX.value = x;
  contextMenuY.value = y;
  contextTarget.value = target;
  requestAnimationFrame(() => contextMenuShow.value = true);
};
const resolveContextTarget = (eventTarget: EventTarget | null): ContextTarget | null => {
  const element = eventTarget instanceof HTMLElement ? eventTarget : null;
  const contextual = element?.closest<HTMLElement>('[data-context-kind]');
  const kind = contextual?.dataset.contextKind;
  const path = contextual?.dataset.contextPath;
  if (kind === 'file' && path) {
    const asset = assets.value.find(item => item.path === path);
    if (asset) return { kind: 'file', asset };
  }
  if (kind === 'directory' && path) {
    const directory = directoryMap.value.get(path);
    if (directory) return { kind: 'directory', directory };
  }
  if (element?.closest('.asset-scroll-region, .asset-tree-panel')) return { kind: 'general' };
  return null;
};
const handleContextMenu = (event: MouseEvent): void => {
  if (preservesNativeContextMenu(event.target)) {
    contextMenuShow.value = false;
    return;
  }
  const target = resolveContextTarget(event.target);
  if (!target) {
    contextMenuShow.value = false;
    return;
  }
  event.preventDefault();
  openContextMenuAt(event.clientX, event.clientY, target);
};
const cancelLongPress = (): void => {
  if (longPressTimer) clearTimeout(longPressTimer);
  longPressTimer = null;
  longPressStart = null;
};
const handlePointerDown = (event: PointerEvent): void => {
  if (event.pointerType !== 'touch') return;
  if (preservesNativeContextMenu(event.target)) {
    contextMenuShow.value = false;
    return;
  }
  const target = resolveContextTarget(event.target);
  if (!target) return;
  cancelLongPress();
  longPressStart = { x: event.clientX, y: event.clientY };
  longPressTimer = setTimeout(() => {
    openContextMenuAt(event.clientX, event.clientY, target);
    suppressClickUntil = performance.now() + 700;
    longPressTimer = null;
  }, 560);
};
const handlePointerMove = (event: PointerEvent): void => {
  if (!longPressStart) return;
  if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > 10) cancelLongPress();
};
const suppressLongPressClick = (event: MouseEvent): void => {
  if (performance.now() >= suppressClickUntil) return;
  event.preventDefault();
  event.stopPropagation();
};
const renderTreeLabel = ({ option }: { option: TreeOption }): ReturnType<typeof h> => h('span', {
  class: ['asset-tree-label', { 'drop-target': dropTargetDirectory.value === String(option.key) }],
  'data-context-kind': 'directory',
  'data-context-path': String(option.key),
  'data-drop-directory': String(option.key),
}, String(option.label ?? ''));

const expandAncestors = (path: string): void => {
  for (const directory of directories.value) {
    if (isInsideDirectory(path, directory.path) && !expandedKeys.value.includes(directory.path)) {
      expandedKeys.value.push(directory.path);
    }
  }
};
const navigateDirectory = (path: string, pushHistory = true): void => {
  if (!directoryMap.value.has(path)) return;
  scopeMode.value = 'directory';
  currentDirectory.value = path;
  search.value = '';
  focusedAsset.value = null;
  expandAncestors(path);
  if (pushHistory) {
    history.value = [...history.value.slice(0, historyIndex.value + 1), path];
    historyIndex.value = history.value.length - 1;
  }
};
const showAllFiles = (): void => {
  scopeMode.value = 'all';
  search.value = '';
  focusedAsset.value = null;
};
const goBack = (): void => {
  if (!canGoBack.value) return;
  historyIndex.value -= 1;
  navigateDirectory(history.value[historyIndex.value], false);
};
const goForward = (): void => {
  if (!canGoForward.value) return;
  historyIndex.value += 1;
  navigateDirectory(history.value[historyIndex.value], false);
};

const refresh = async (): Promise<void> => {
  loading.value = true;
  try {
    const [nextAssets, nextDirectories] = await Promise.all([listAssets(), listAssetDirectories()]);
    assets.value = nextAssets;
    directories.value = nextDirectories;
    if (!directoryMap.value.has(currentDirectory.value)) {
      const fallback = [...nextDirectories]
        .sort((left, right) => right.path.length - left.path.length)
        .find(directory => isInsideDirectory(currentDirectory.value, directory.path))
        ?? nextDirectories.find(directory => directory.path === 'public/assets');
      if (fallback) currentDirectory.value = fallback.path;
    }
    expandAncestors(currentDirectory.value);
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('assets.loadFailed'));
  } finally {
    loading.value = false;
  }
};

watch(() => props.show, show => {
  contextMenuShow.value = false;
  cancelLongPress();
  externalDragActive.value = false;
  draggedAsset.value = null;
  dropTargetDirectory.value = null;
  dropTargetIsExplicit.value = false;
  if (!show) return;
  selected.value = [];
  focusedAsset.value = null;
  search.value = '';
  scopeMode.value = 'directory';
  currentDirectory.value = normalizeAssetDirectory(props.defaultDirectory);
  history.value = [currentDirectory.value];
  historyIndex.value = 0;
  typeFilter.value = props.accept.startsWith('image/') ? 'image' : 'all';
  void refresh();
});

const choose = (asset: AssetItem): void => {
  focusedAsset.value = asset;
  if (props.mode === 'manage') return;
  if (props.multiple) {
    selected.value = selected.value.includes(asset.publicUrl)
      ? selected.value.filter(path => path !== asset.publicUrl)
      : [...selected.value, asset.publicUrl];
  } else {
    selected.value = [asset.publicUrl];
  }
};
const confirmSelection = (): void => {
  if (selected.value.length === 0) return;
  emit('select', props.multiple ? selected.value : selected.value[0]);
  emit('update:show', false);
};
const activateAsset = (asset: AssetItem): void => {
  choose(asset);
  if (props.mode === 'select' && !props.multiple) {
    emit('select', asset.publicUrl);
    emit('update:show', false);
  }
};

const uploadFiles = async (files: File[], targetDirectory = currentDirectory.value): Promise<void> => {
  if (files.length === 0 || !directoryMap.value.has(targetDirectory)) return;
  const accepted = props.accept.startsWith('image/') ? files.filter(file => file.type.startsWith('image/')) : files;
  if (accepted.length === 0) {
    message.warning(t('assets.noAccepted'));
    return;
  }
  uploading.value = true;
  try {
    await Promise.all(accepted.map(file => uploadAsset(file, targetDirectory)));
    await refresh();
    emit('assetsChange');
    message.success(t('assets.uploadDone', { count: accepted.length, directory: targetDirectory }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('assets.uploadFailed'));
  } finally {
    uploading.value = false;
    externalDragActive.value = false;
    dropTargetDirectory.value = null;
    dropTargetIsExplicit.value = false;
    if (uploadInput.value) uploadInput.value.value = '';
  }
};
const handleUploadInput = (event: Event): void => {
  void uploadFiles([...((event.target as HTMLInputElement).files ?? [])]);
};
const resolveExplicitDropDirectory = (eventTarget: EventTarget | null): string | null => {
  const element = eventTarget instanceof HTMLElement ? eventTarget : null;
  const explicitTarget = element?.closest<HTMLElement>('[data-drop-directory]')?.dataset.dropDirectory;
  if (explicitTarget && directoryMap.value.has(explicitTarget)) return explicitTarget;
  return null;
};
const resolveDropDirectory = (eventTarget: EventTarget | null): string | null => {
  const explicitTarget = resolveExplicitDropDirectory(eventTarget);
  if (explicitTarget) return explicitTarget;
  const element = eventTarget instanceof HTMLElement ? eventTarget : null;
  if (scopeMode.value === 'directory' && element?.closest('.asset-content-panel')) return currentDirectory.value;
  return null;
};
const hasInternalAsset = (event: DragEvent): boolean => (
  Boolean(draggedAsset.value) || (event.dataTransfer?.types.includes(INTERNAL_ASSET_DRAG_TYPE) ?? false)
);
const hasExternalFiles = (event: DragEvent): boolean => (
  !hasInternalAsset(event) && (event.dataTransfer?.types.includes('Files') ?? false)
);
const validDropDirectory = (event: DragEvent): string | null => {
  const target = resolveDropDirectory(event.target);
  if (!target) return null;
  const sourceDirectory = draggedAsset.value ? `public/${draggedAsset.value.directory}` : null;
  return sourceDirectory === target ? null : target;
};
const resetDragState = (): void => {
  externalDragActive.value = false;
  draggedAsset.value = null;
  dropTargetDirectory.value = null;
  dropTargetIsExplicit.value = false;
};
const handleAssetDragStart = (event: DragEvent, asset: AssetItem): void => {
  if (!event.dataTransfer || dropBusy.value) {
    event.preventDefault();
    return;
  }
  draggedAsset.value = asset;
  dropTargetDirectory.value = null;
  dropTargetIsExplicit.value = false;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(INTERNAL_ASSET_DRAG_TYPE, asset.path);
  event.dataTransfer.setData('text/plain', asset.publicUrl);
};
const handleAssetDragEnd = (): void => resetDragState();
const handleDragEnter = (event: DragEvent): void => {
  const recognizedDrag = hasInternalAsset(event) || hasExternalFiles(event);
  if (!recognizedDrag) return;
  event.preventDefault();
  const target = validDropDirectory(event);
  if (!target) return;
  dropTargetDirectory.value = target;
  dropTargetIsExplicit.value = resolveExplicitDropDirectory(event.target) === target;
  externalDragActive.value = hasExternalFiles(event);
};
const handleDragOver = (event: DragEvent): void => {
  const recognizedDrag = hasInternalAsset(event) || hasExternalFiles(event);
  if (!recognizedDrag) return;
  event.preventDefault();
  const target = validDropDirectory(event);
  if (!target) {
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
    dropTargetDirectory.value = null;
    dropTargetIsExplicit.value = false;
    return;
  }
  if (event.dataTransfer) event.dataTransfer.dropEffect = hasInternalAsset(event) ? 'move' : 'copy';
  dropTargetDirectory.value = target;
  dropTargetIsExplicit.value = resolveExplicitDropDirectory(event.target) === target;
  externalDragActive.value = hasExternalFiles(event);
};
const handleDragLeave = (event: DragEvent): void => {
  const shell = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (shell && nextTarget && shell.contains(nextTarget)) return;
  if (hasExternalFiles(event)) externalDragActive.value = false;
  dropTargetDirectory.value = null;
  dropTargetIsExplicit.value = false;
};
const moveDraggedAsset = async (asset: AssetItem, targetDirectory: string): Promise<void> => {
  dropBusy.value = true;
  try {
    const result = await moveAsset(asset.path, targetDirectory, asset.name, asset.modifiedAt);
    selected.value = selected.value.map(value => value === asset.publicUrl ? result.publicUrl : value);
    if (focusedAsset.value?.path === asset.path) focusedAsset.value = result;
    await refresh();
    emit('assetsChange');
    message.warning(t('assets.movedByDrag', { name: asset.name, directory: targetDirectory }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('ui.operationFailed'));
  } finally {
    dropBusy.value = false;
  }
};
const handleDrop = (event: DragEvent): void => {
  const recognizedDrag = hasInternalAsset(event) || hasExternalFiles(event);
  if (!recognizedDrag) return;
  event.preventDefault();
  const targetDirectory = validDropDirectory(event);
  const internalAsset = draggedAsset.value;
  if (!targetDirectory || (!internalAsset && !hasExternalFiles(event))) {
    resetDragState();
    return;
  }
  if (internalAsset) {
    resetDragState();
    void moveDraggedAsset(internalAsset, targetDirectory);
    return;
  }
  const files = [...(event.dataTransfer?.files ?? [])];
  externalDragActive.value = false;
  dropTargetDirectory.value = null;
  dropTargetIsExplicit.value = false;
  void uploadFiles(files, targetDirectory);
};

const copyPublicPath = async (asset: AssetItem): Promise<void> => {
  try {
    await navigator.clipboard.writeText(asset.publicUrl);
    message.success(t('assets.copied'));
  } catch {
    message.error(t('assets.copyFailed'));
  }
};

const openFileEditor = (asset: AssetItem, mode: EditorMode): void => {
  editorKind.value = 'file';
  editorMode.value = mode;
  editingAsset.value = asset;
  editingDirectory.value = null;
  const extensionIndex = asset.name.lastIndexOf('.');
  const stem = extensionIndex > 0 ? asset.name.slice(0, extensionIndex) : asset.name;
  const extension = extensionIndex > 0 ? asset.name.slice(extensionIndex) : '';
  editorName.value = mode === 'duplicate' ? `${stem}-copy${extension}` : asset.name;
  editorParent.value = `public/${asset.directory}`;
  editorShow.value = true;
};
const openDirectoryEditor = (directory: AssetDirectory): void => {
  editorKind.value = 'directory';
  editorMode.value = 'move';
  editingDirectory.value = directory;
  editingAsset.value = null;
  editorName.value = directory.name;
  editorParent.value = directory.parent ?? 'public/assets';
  editorShow.value = true;
};
const editorValid = computed(() => {
  const name = editorName.value.trim();
  if (!name || /[<>:"/\\|?*]/.test(name) || !directoryMap.value.has(editorParent.value)) return false;
  if (editorKind.value === 'directory' && editingDirectory.value) {
    return editorParent.value !== editingDirectory.value.path
      && !editorParent.value.startsWith(`${editingDirectory.value.path}/`);
  }
  return true;
});
const submitEditor = async (): Promise<void> => {
  if (!editorValid.value) return;
  editorBusy.value = true;
  try {
    if (editorKind.value === 'directory' && editingDirectory.value) {
      const oldPath = editingDirectory.value.path;
      const result = await moveAssetDirectory(oldPath, editorParent.value, editorName.value.trim(), editingDirectory.value.modifiedAt);
      if (isInsideDirectory(currentDirectory.value, oldPath)) {
        currentDirectory.value = `${result.path}${currentDirectory.value.slice(oldPath.length)}`;
      }
      message.success(t('assets.folderUpdated', { path: result.path }));
    } else if (editingAsset.value) {
      const oldUrl = editingAsset.value.publicUrl;
      const operation = editorMode.value === 'duplicate' ? duplicateAsset : moveAsset;
      const result = await operation(editingAsset.value.path, editorParent.value, editorName.value.trim(), editingAsset.value.modifiedAt);
      if (editorMode.value === 'move') selected.value = selected.value.map(value => value === oldUrl ? result.publicUrl : value);
      focusedAsset.value = result;
      message.success(t('assets.fileUpdated', { path: result.publicUrl }));
    }
    editorShow.value = false;
    await refresh();
    emit('assetsChange');
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('ui.operationFailed'));
  } finally {
    editorBusy.value = false;
  }
};

const requestDeleteAsset = (asset: AssetItem): void => {
  dialog.warning({
    title: t('assets.deleteFileTitle', { name: asset.name }),
    content: t('assets.deleteFileBody', { path: asset.path }),
    positiveText: t('assets.permanentDelete'),
    negativeText: t('ui.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteAsset(asset.path, asset.modifiedAt);
        selected.value = selected.value.filter(value => value !== asset.publicUrl);
        if (focusedAsset.value?.path === asset.path) focusedAsset.value = null;
        await refresh();
        emit('assetsChange');
        message.success(t('assets.deleted', { name: asset.name }));
      } catch (error) {
        message.error(error instanceof Error ? error.message : t('files.deleteFailed'));
      }
    },
  });
};
const requestDeleteDirectory = (directory: AssetDirectory): void => {
  dialog.warning({
    title: t('assets.deleteFolderTitle', { name: directory.name }),
    content: t('assets.deleteFolderBody'),
    positiveText: t('assets.deleteFolder'),
    negativeText: t('ui.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteAssetDirectory(directory.path, directory.modifiedAt);
        if (currentDirectory.value === directory.path && directory.parent) navigateDirectory(directory.parent);
        await refresh();
        emit('assetsChange');
        message.success(t('assets.deleted', { name: directory.name }));
      } catch (error) {
        message.error(error instanceof Error ? error.message : t('assets.folderDeleteFailed'));
      }
    },
  });
};
const handleFileMenu = (key: string, asset: AssetItem): void => {
  if (key === 'copy-path') void copyPublicPath(asset);
  else if (key === 'duplicate') openFileEditor(asset, 'duplicate');
  else if (key === 'edit') openFileEditor(asset, 'move');
  else if (key === 'delete') requestDeleteAsset(asset);
};
const handleDirectoryMenu = (key: string, directory: AssetDirectory): void => {
  if (key === 'edit') openDirectoryEditor(directory);
  else if (key === 'delete') requestDeleteDirectory(directory);
};
const openCreateDirectory = (parent = currentDirectory.value): void => {
  if (!directoryMap.value.has(parent)) return;
  if (currentDirectory.value !== parent) navigateDirectory(parent);
  createDirectoryName.value = '';
  createDirectoryShow.value = true;
};
const handleContextMenuSelect = (key: string): void => {
  contextMenuShow.value = false;
  const target = contextTarget.value;
  if (target.kind === 'file') {
    handleFileMenu(key, target.asset);
    return;
  }
  if (target.kind === 'directory') {
    if (key === 'open') navigateDirectory(target.directory.path);
    else if (key === 'new-child') openCreateDirectory(target.directory.path);
    else handleDirectoryMenu(key, target.directory);
    return;
  }
  if (key === 'new-folder') openCreateDirectory();
  else if (key === 'upload') uploadInput.value?.click();
  else if (key === 'refresh') void refresh();
};

const submitCreateDirectory = async (): Promise<void> => {
  if (!createDirectoryName.value.trim() || scopeMode.value !== 'directory') return;
  createDirectoryBusy.value = true;
  try {
    const directory = await createAssetDirectory(currentDirectory.value, createDirectoryName.value.trim());
    createDirectoryShow.value = false;
    createDirectoryName.value = '';
    await refresh();
    expandAncestors(directory.path);
    emit('assetsChange');
    message.success(t('assets.created', { path: directory.path }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('assets.folderCreateFailed'));
  } finally {
    createDirectoryBusy.value = false;
  }
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    class="asset-modal"
    :title="mode === 'manage' ? t('assets.manager') : multiple ? t('assets.chooseFiles') : t('assets.chooseFile')"
    @update:show="emit('update:show', $event)"
  >
    <div
      class="asset-manager-shell"
      @click.capture="suppressLongPressClick"
      @contextmenu="handleContextMenu"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="cancelLongPress"
      @pointercancel="cancelLongPress"
    >
      <aside class="asset-tree-panel">
        <div class="asset-tree-content">
          <button type="button" class="asset-special-location" :class="{ active: scopeMode === 'all' }" @click="showAllFiles">
            <AdminIcon name="Files" :size="17" />
            <span>{{ t('assets.allFiles') }}</span>
            <small>{{ assets.length }}</small>
          </button>
          <div class="asset-tree-heading">{{ t('assets.projectFolders') }}</div>
          <NTree
            :data="directoryTree"
            :selected-keys="selectedTreeKeys"
            :expanded-keys="expandedKeys"
            block-line
            show-line
            :render-prefix="() => h(AdminIcon, { name: 'Folder', size: 15 })"
            :render-label="renderTreeLabel"
            @update:selected-keys="keys => keys[0] && navigateDirectory(String(keys[0]))"
            @update:expanded-keys="keys => expandedKeys = keys.map(String)"
          />
        </div>
      </aside>

      <section class="asset-content-panel">
        <header class="asset-location-bar">
          <div class="asset-history-actions">
            <NButton quaternary circle size="small" :title="t('assets.back')" :disabled="!canGoBack" @click="goBack"><AdminIcon name="ChevronLeft" /></NButton>
            <NButton quaternary circle size="small" :title="t('assets.forward')" :disabled="!canGoForward" @click="goForward"><AdminIcon name="ChevronRight" /></NButton>
            <NButton quaternary circle size="small" :title="t('assets.up')" :disabled="scopeMode === 'all' || !parentDirectory" @click="parentDirectory && navigateDirectory(parentDirectory)"><AdminIcon name="ArrowUp" /></NButton>
          </div>
          <nav class="asset-breadcrumb" :aria-label="t('assets.currentLocation')">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path || crumb.label">
              <AdminIcon v-if="index" name="ChevronRight" :size="13" />
              <button
                type="button"
                :disabled="!crumb.path"
                :data-context-kind="crumb.path ? 'directory' : undefined"
                :data-context-path="crumb.path || undefined"
                :data-drop-directory="crumb.path || undefined"
                :class="{ 'drop-target': dropTargetDirectory === crumb.path }"
                @click="crumb.path && navigateDirectory(crumb.path)"
              >{{ crumb.label }}</button>
            </template>
          </nav>
          <span class="asset-location-count">{{ t('assets.items', { count: itemCount }) }}</span>
        </header>

        <div class="asset-toolbar">
          <NInput v-model:value="search" clearable :placeholder="scopeMode === 'all' ? t('assets.searchAll') : t('assets.searchHere')">
            <template #prefix><AdminIcon name="Search" :size="16" /></template>
          </NInput>
          <NSelect v-model:value="typeFilter" :options="typeOptions" class="asset-type-select" />
          <NSelect v-model:value="sortBy" :options="sortOptions" class="asset-sort-select" />
          <div class="asset-view-toggle">
            <NButton quaternary circle size="small" :title="t('assets.grid')" :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'"><AdminIcon name="Grid2X2" /></NButton>
            <NButton quaternary circle size="small" :title="t('assets.list')" :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'"><AdminIcon name="List" /></NButton>
          </div>
          <input ref="uploadInput" class="visually-hidden-file" type="file" :accept="accept" multiple @change="handleUploadInput">
          <NButton v-if="scopeMode === 'directory'" secondary @click="createDirectoryShow = true"><template #icon><AdminIcon name="FolderPlus" /></template>{{ t('assets.newFolder') }}</NButton>
          <NButton v-if="scopeMode === 'directory'" type="primary" :loading="uploading" @click="uploadInput?.click()"><template #icon><AdminIcon name="UploadCloud" /></template>{{ t('assets.uploadHere') }}</NButton>
          <NButton quaternary circle :title="t('ui.refresh')" @click="refresh"><AdminIcon name="RefreshCw" /></NButton>
        </div>

        <NSpin :show="loading" class="asset-browser">
          <div class="asset-scroll-region">
            <div v-if="viewMode === 'grid' && itemCount" class="asset-grid">
              <article
                v-for="directory in visibleDirectories"
                :key="directory.path"
                class="asset-tile asset-folder-tile"
                :class="{ 'drop-target': dropTargetDirectory === directory.path }"
                data-context-kind="directory"
                :data-context-path="directory.path"
                :data-drop-directory="directory.path"
              >
                <button type="button" class="asset-tile-main" @click="navigateDirectory(directory.path)">
                  <div class="asset-folder-preview"><AdminIcon name="Folder" :size="48" /></div>
                  <strong :title="directory.name">{{ directory.name }}</strong>
                  <span>{{ t('assets.foldersAndFiles', { folders: directFolderCount(directory.path), files: directFileCount(directory.path) }) }}</span>
                </button>
                <NDropdown trigger="click" :options="directoryMenuOptions" placement="bottom-end" @select="handleDirectoryMenu($event, directory)">
                  <NButton class="asset-menu-button" quaternary circle size="small" :title="t('assets.folderActions')" @click.stop><AdminIcon name="MoreHorizontal" :size="17" /></NButton>
                </NDropdown>
              </article>

              <article
                v-for="asset in visibleAssets"
                :key="asset.path"
                class="asset-tile"
                :class="{ selected: selected.includes(asset.publicUrl), focused: focusedAsset?.path === asset.path, dragging: draggedAsset?.path === asset.path }"
                data-context-kind="file"
                :data-context-path="asset.path"
                :draggable="!dropBusy"
                @dragstart="handleAssetDragStart($event, asset)"
                @dragend="handleAssetDragEnd"
              >
                <button type="button" class="asset-tile-main" @click="choose(asset)" @dblclick="activateAsset(asset)">
                  <div class="asset-preview">
                    <img v-if="asset.type === 'image'" :src="resolveAssetUrl(asset.publicUrl)" :alt="asset.name" loading="lazy" decoding="async" draggable="false">
                    <AdminIcon v-else :name="assetIcon(asset)" :size="38" />
                  </div>
                  <span v-if="mode === 'select' && selected.includes(asset.publicUrl)" class="asset-selected-mark" :aria-label="t('assets.selectedMark')"><AdminIcon name="Check" :size="14" /></span>
                  <strong :title="asset.name">{{ asset.name }}</strong>
                  <span v-if="scopeMode === 'all' || searchKeyword" :title="asset.directory">{{ asset.directory }}</span>
                  <span v-else>{{ formatDate(asset.modifiedAt) }}</span>
                  <NTag size="small" :bordered="false">{{ formatSize(asset.size) }}</NTag>
                </button>
                <NDropdown trigger="click" :options="fileMenuOptions" placement="bottom-end" @select="handleFileMenu($event, asset)">
                  <NButton class="asset-menu-button" quaternary circle size="small" :title="t('assets.fileActions')" @click.stop><AdminIcon name="MoreHorizontal" :size="17" /></NButton>
                </NDropdown>
              </article>
            </div>

            <div v-else-if="itemCount" class="asset-list-view">
              <div class="asset-list-header"><span>{{ t('assets.name') }}</span><span>{{ t('assets.location') }}</span><span>{{ t('assets.size') }}</span><span>{{ t('assets.modifiedTime') }}</span><span /></div>
              <div
                v-for="directory in visibleDirectories"
                :key="directory.path"
                class="asset-list-row is-folder"
                :class="{ 'drop-target': dropTargetDirectory === directory.path }"
                data-context-kind="directory"
                :data-context-path="directory.path"
                :data-drop-directory="directory.path"
              >
                <button type="button" class="asset-list-name" @click="navigateDirectory(directory.path)"><span class="asset-list-icon"><AdminIcon name="Folder" :size="24" /></span><strong>{{ directory.name }}</strong></button>
                <span>{{ directory.parent }}</span><span>—</span><span>{{ formatDate(directory.modifiedAt) }}</span>
                <NDropdown trigger="click" :options="directoryMenuOptions" @select="handleDirectoryMenu($event, directory)"><NButton quaternary circle size="small" :title="t('assets.folderActions')"><AdminIcon name="MoreHorizontal" /></NButton></NDropdown>
              </div>
              <div
                v-for="asset in visibleAssets"
                :key="asset.path"
                class="asset-list-row"
                :class="{ selected: selected.includes(asset.publicUrl), focused: focusedAsset?.path === asset.path, dragging: draggedAsset?.path === asset.path }"
                data-context-kind="file"
                :data-context-path="asset.path"
                :draggable="!dropBusy"
                @dragstart="handleAssetDragStart($event, asset)"
                @dragend="handleAssetDragEnd"
              >
                <button type="button" class="asset-list-name" @click="choose(asset)" @dblclick="activateAsset(asset)">
                  <span class="asset-list-icon"><img v-if="asset.type === 'image'" :src="resolveAssetUrl(asset.publicUrl)" :alt="asset.name" loading="lazy" decoding="async" draggable="false"><AdminIcon v-else :name="assetIcon(asset)" :size="22" /></span>
                  <span v-if="mode === 'select' && selected.includes(asset.publicUrl)" class="asset-list-selected-mark" :aria-label="t('assets.selectedMark')"><AdminIcon name="Check" :size="12" /></span>
                  <strong>{{ asset.name }}</strong>
                </button>
                <span :title="asset.directory">{{ asset.directory }}</span><span>{{ formatSize(asset.size) }}</span><span>{{ formatDate(asset.modifiedAt) }}</span>
                <NDropdown trigger="click" :options="fileMenuOptions" @select="handleFileMenu($event, asset)"><NButton quaternary circle size="small" :title="t('assets.fileActions')"><AdminIcon name="MoreHorizontal" /></NButton></NDropdown>
              </div>
            </div>

            <NEmpty v-else :description="searchKeyword ? t('assets.noMatch') : t('assets.empty')">
              <template v-if="scopeMode === 'directory' && !searchKeyword" #extra><NButton secondary @click="uploadInput?.click()">{{ t('assets.firstUpload') }}</NButton></template>
            </NEmpty>
          </div>
        </NSpin>

        <div
          v-if="externalDragActive && dropTargetDirectory"
          class="asset-drop-overlay"
          :class="{ compact: dropTargetIsExplicit }"
        >
          <AdminIcon name="UploadCloud" :size="42" />
          <strong>{{ t('assets.dropTitle', { directory: dropTargetDirectory }) }}</strong>
          <span>{{ t('assets.dropBody') }}</span>
        </div>
        <div v-else-if="draggedAsset && dropTargetDirectory" class="asset-move-indicator">
          <AdminIcon name="FolderInput" :size="18" />
          <span>{{ t('assets.moveDropTitle', { name: draggedAsset.name, directory: dropTargetDirectory }) }}</span>
        </div>
      </section>

      <aside
        v-if="focusedAsset"
        class="asset-inspector"
        data-context-kind="file"
        :data-context-path="focusedAsset.path"
      >
        <div class="asset-inspector-preview">
          <img v-if="focusedAsset.type === 'image'" :src="resolveAssetUrl(focusedAsset.publicUrl)" :alt="focusedAsset.name" draggable="false">
          <AdminIcon v-else :name="assetIcon(focusedAsset)" :size="56" />
        </div>
        <div class="asset-inspector-copy">
          <strong>{{ focusedAsset.name }}</strong>
          <code>{{ focusedAsset.publicUrl }}</code>
          <dl><dt>{{ t('assets.type') }}</dt><dd>{{ focusedAsset.type }}</dd><dt>{{ t('assets.size') }}</dt><dd>{{ formatSize(focusedAsset.size) }}</dd><dt>{{ t('assets.modifiedTime') }}</dt><dd>{{ formatDate(focusedAsset.modifiedAt) }}</dd></dl>
        </div>
        <div class="asset-inspector-actions">
          <NButton secondary size="small" @click="copyPublicPath(focusedAsset)">{{ t('assets.copyPath') }}</NButton>
          <NButton secondary size="small" @click="openFileEditor(focusedAsset, 'move')">{{ t('assets.moveRename') }}</NButton>
        </div>
      </aside>
    </div>

    <template #footer>
      <div class="asset-modal-footer">
        <div class="asset-manager-location"><AdminIcon name="FolderOpen" :size="15" /><span>{{ t('assets.currentLocation') }}</span><code>{{ currentScopeLabel }}</code><span v-if="mode === 'select'">{{ t('assets.selected', { count: selected.length }) }}</span></div>
        <NSpace class="asset-modal-actions" justify="end">
          <NButton @click="emit('update:show', false)">{{ mode === 'manage' ? t('ui.close') : t('ui.cancel') }}</NButton>
          <NButton v-if="mode === 'select'" type="primary" :disabled="selected.length === 0" @click="confirmSelection">{{ multiple ? t('assets.useCount', { count: selected.length }) : t('assets.useSelected') }}</NButton>
        </NSpace>
      </div>
    </template>
  </NModal>

  <NDropdown
    trigger="manual"
    placement="bottom-start"
    :show="contextMenuShow"
    :x="contextMenuX"
    :y="contextMenuY"
    :options="contextMenuOptions"
    @select="handleContextMenuSelect"
    @clickoutside="contextMenuShow = false"
  />

  <NModal v-model:show="createDirectoryShow" preset="card" class="asset-editor-modal" :title="t('assets.newFolder')" :mask-closable="!createDirectoryBusy">
    <NFormItem :label="t('assets.location')"><NInput :value="currentDirectory" readonly /></NFormItem>
    <NFormItem :label="t('assets.folderName')"><NInput v-model:value="createDirectoryName" autofocus @keyup.enter="submitCreateDirectory" /></NFormItem>
    <template #footer><NSpace justify="end"><NButton :disabled="createDirectoryBusy" @click="createDirectoryShow = false">{{ t('ui.cancel') }}</NButton><NButton type="primary" :loading="createDirectoryBusy" :disabled="!createDirectoryName.trim()" @click="submitCreateDirectory">{{ t('ui.create') }}</NButton></NSpace></template>
  </NModal>

  <NModal v-model:show="editorShow" preset="card" class="asset-editor-modal" :title="editorMode === 'duplicate' ? t('assets.duplicateTitle') : editorKind === 'directory' ? t('assets.moveFolderTitle') : t('assets.moveFileTitle')" :mask-closable="!editorBusy">
    <NAlert v-if="editorKind === 'file' && editorMode === 'move'" type="warning" :bordered="false">{{ t('assets.moveWarning') }}</NAlert>
    <NFormItem :label="editorKind === 'directory' ? t('assets.folderName') : t('assets.fileName')"><NInput v-model:value="editorName" /></NFormItem>
    <NFormItem :label="t('assets.destination')" :feedback="t('assets.destinationHint')">
      <div class="asset-directory-chooser"><NTree :data="directoryTree" :selected-keys="[editorParent]" :expanded-keys="expandedKeys" block-line show-line :render-prefix="() => h(AdminIcon, { name: 'Folder', size: 15 })" @update:selected-keys="keys => keys[0] && (editorParent = String(keys[0]))" @update:expanded-keys="keys => expandedKeys = keys.map(String)" /></div>
    </NFormItem>
    <template #footer><NSpace justify="end"><NButton :disabled="editorBusy" @click="editorShow = false">{{ t('ui.cancel') }}</NButton><NButton type="primary" :loading="editorBusy" :disabled="!editorValid" @click="submitEditor">{{ editorMode === 'duplicate' ? t('assets.createCopy') : t('assets.saveLocation') }}</NButton></NSpace></template>
  </NModal>
</template>
