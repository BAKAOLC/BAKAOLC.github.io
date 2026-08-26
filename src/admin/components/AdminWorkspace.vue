<script setup lang="ts">
import { useEventListener, useMediaQuery } from '@vueuse/core';
import {
  NAlert,
  NAvatar,
  NButton,
  NButtonGroup,
  NCard,
  NDropdown,
  NEmpty,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSkeleton,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui';
import { computed, defineAsyncComponent, nextTick, onMounted, provide, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  deleteConfigFile,
  duplicateConfigFile,
  getProject,
  listAssets,
  listConfigFiles,
  loadConfig,
  renameConfigFile,
  saveConfig,
  uploadAsset,
} from '../api';
import { assetManagerKey, normalizeAssetDirectory, type AssetManagerOpenOptions } from '../asset-manager';
import { resolveAssetUrl } from '../asset-url';
import { useContextMenuEscape } from '../context-menu';
import { defaultNowForField } from '../date-time';
import { decodeConfig, encodeConfig } from '../formats';
import { adminResources, adminSections, getAdminResource } from '../schema';
import type { AdminField, AdminResource, AssetItem, ConfigFile, ProjectInfo } from '../types';

import AdminIcon from './AdminIcon.vue';
import AssetPickerModal from './AssetPickerModal.vue';

type Locale = 'zh' | 'en' | 'jp';
type RelationOption = { label: string; value: string };
type FileDialogMode = 'create' | 'duplicate' | 'rename';

const SchemaForm = defineAsyncComponent(() => import('./SchemaForm.vue'));

const message = useMessage();
const dialog = useDialog();
const { locale: uiLocale, t, te } = useI18n();
const project = ref<ProjectInfo | null>(null);
const loading = ref(true);
const editorLoading = ref(false);
let resourceLoadSequence = 0;
const saving = ref(false);
const sidebarCollapsed = ref(false);
const compactNavOpen = ref(false);
const mobileNavOpen = ref(false);
const isCompact = useMediaQuery('(max-width: 1240px)');
const isMobile = useMediaQuery('(max-width: 900px)');
const isPhone = useMediaQuery('(max-width: 640px)');
const activeView = ref<'dashboard' | 'resource'>('dashboard');
const activeResourceId = ref('gallery');
const activePath = ref<string | null>(null);
const modifiedAt = ref<number | null>(null);
const editorData = ref<unknown>({});
const collectionFiles = ref<ConfigFile[]>([]);
const search = ref('');
const dirty = ref(false);
const locale = ref<Locale>('zh');
const assetCount = ref(0);
const referencesRaw = ref<Record<string, unknown>>({});
const pickerShow = ref(false);
const pickerAccept = ref('');
const pickerMultiple = ref(false);
const pickerDirectory = ref('public/assets');
const pickerMode = ref<'manage' | 'select'>('select');
let pickerResolve: ((value: string | string[] | null) => void) | null = null;
const fileDialogShow = ref(false);
const fileDialogMode = ref<FileDialogMode>('create');
const fileDialogName = ref('');
const fileDialogId = ref('');
const fileDialogBusy = ref(false);
const managedFile = ref<ConfigFile | null>(null);
const entryContextShow = ref(false);
const entryContextX = ref(0);
const entryContextY = ref(0);
const entryContextFile = ref<ConfigFile | null>(null);
useContextMenuEscape(entryContextShow);

const ENTRY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const fileMenuOptions = computed(() => [
  { label: t('files.duplicateEntry'), key: 'duplicate' },
  { label: t('files.renameFile'), key: 'rename' },
  { type: 'divider', key: 'divider' },
  { label: t('files.deletePermanently'), key: 'delete' },
]);

const activeResource = computed(() => getAdminResource(activeResourceId.value) ?? adminResources[0]);
const navigationCollapsed = computed(() => (
  sidebarCollapsed.value || (isCompact.value && !compactNavOpen.value && !mobileNavOpen.value)
));

const localeLabels: Record<Locale, string> = { zh: '中文', en: 'EN', jp: '日本語' };
const uiLocaleOptions = computed(() => [
  { label: t('ui.chinese'), key: 'zh' },
  { label: t('ui.english'), key: 'en' },
  { label: t('ui.japanese'), key: 'jp' },
]);
const uiLocaleLabel = computed(() => uiLocaleOptions.value.find(option => option.key === uiLocale.value)?.label ?? t('ui.language'));
const resourceLabel = (resource: AdminResource): string => t(`resources.${resource.id}.label`, resource.label);
const resourceDescription = (resource: AdminResource): string => t(`resources.${resource.id}.description`, resource.description);
const resourceSingular = (resource: AdminResource): string => {
  const key = `resources.${resource.id}.singular`;
  return te(key) ? t(key) : resource.singular ?? t('schema.item');
};
const setUiLocale = (value: string): void => {
  if (value !== 'zh' && value !== 'en' && value !== 'jp') return;
  uiLocale.value = value;
  localStorage.setItem('admin-ui-locale', value);
};
const cloneData = <T>(value: T): T => structuredClone(toRaw(value));

const localizedText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  return String(record[locale.value] ?? record.zh ?? record.en ?? record.jp ?? fallback);
};

const filteredFiles = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase();
  if (!keyword) return collectionFiles.value;
  return collectionFiles.value.filter(file => {
    const record = file.data as Record<string, unknown>;
    return `${file.name} ${record.id ?? ''} ${localizedText(record.name)} ${localizedText(record.title)}`
      .toLocaleLowerCase().includes(keyword);
  });
});

const collectionOptions = computed(() => collectionFiles.value.map(file => ({
  label: `${titleForEntry(file)} · ${subtitleForEntry(file)}`,
  value: file.path,
})));

const currentFile = computed(() => collectionFiles.value.find(file => file.path === activePath.value) ?? null);
const fileDialogTitle = computed(() => ({
  create: t('files.newTitle', { item: resourceSingular(activeResource.value) }),
  duplicate: t('files.duplicateTitle', { item: resourceSingular(activeResource.value) }),
  rename: t('files.renameTitle'),
}[fileDialogMode.value]));
const fileDialogAction = computed(() => ({
  create: t('files.startEditing'), duplicate: t('files.createCopy'), rename: t('files.rename'),
})[fileDialogMode.value]);
const fileDialogValid = computed(() => (
  ENTRY_NAME_PATTERN.test(fileDialogName.value.trim())
    && (fileDialogMode.value === 'rename' || ENTRY_NAME_PATTERN.test(fileDialogId.value.trim()))
));

const relationOptions = computed<Record<string, RelationOption[]>>(() => {
  const toOptions = (value: unknown, nameKey = 'name'): RelationOption[] => (
    Array.isArray(value)
      ? value.map(item => {
        const record = item as Record<string, unknown>;
        const id = String(record.id ?? '');
        return { value: id, label: `${localizedText(record[nameKey], id)} · ${id}` };
      }).filter(option => option.value)
      : []
  );
  const categories = referencesRaw.value.articleCategories as Record<string, unknown> | undefined;
  const languages = referencesRaw.value.languages as Record<string, unknown> | undefined;
  const links = referencesRaw.value.links as Record<string, unknown> | undefined;
  return {
    characters: toOptions(referencesRaw.value.characters),
    tags: toOptions(referencesRaw.value.tags),
    articleCategories: toOptions(categories?.entries),
    languages: toOptions(languages?.languages),
    linkTags: toOptions(links?.tags),
  };
});

const countFor = (resource: AdminResource): number | null => (
  resource.kind === 'collection' ? project.value?.counts[resource.id] ?? 0 : null
);

const imageForEntry = (file: ConfigFile): string | null => {
  const record = file.data as Record<string, unknown>;
  const direct = record.src ?? record.cover;
  if (typeof direct === 'string') return direct;
  if (typeof direct === 'object' && direct !== null) return String((direct as Record<string, unknown>).zh ?? '');
  const children = record.childImages;
  if (Array.isArray(children) && children[0]) return String((children[0] as Record<string, unknown>).src ?? '');
  const { variants } = record;
  if (Array.isArray(variants) && variants[0]) {
    const { images } = (variants[0] as Record<string, unknown>);
    if (Array.isArray(images) && images[0]) return String((images[0] as Record<string, unknown>).src ?? '');
  }
  return null;
};

const titleForEntry = (file: ConfigFile): string => {
  const record = file.data as Record<string, unknown>;
  return localizedText(record.name) || localizedText(record.title) || String(record.id ?? file.name);
};

const subtitleForEntry = (file: ConfigFile): string => {
  const record = file.data as Record<string, unknown>;
  return String(record.id ?? file.name);
};

const fileMetaForEntry = (file: ConfigFile): string => {
  const id = subtitleForEntry(file);
  const relativePath = file.path.startsWith(`${activeResource.value.path}/`)
    ? file.path.slice(activeResource.value.path.length + 1)
    : `${file.name}.json5`;
  return id === file.name ? relativePath : `${relativePath} · ${id}`;
};

const confirmDiscard = (): Promise<boolean> => {
  if (!dirty.value) return Promise.resolve(true);
  return new Promise(resolve => {
    dialog.warning({
      title: t('files.discardTitle'),
      content: t('files.discardBody'),
      positiveText: t('files.discard'),
      negativeText: t('files.keepEditing'),
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    });
  });
};

const loadReferences = async (): Promise<void> => {
  const definitions = {
    characters: ['src/config/characters.json5', 'characters'],
    tags: ['src/config/tags.json5', 'tags'],
    articleCategories: ['src/config/articles-categories.json5', 'articleCategories'],
    languages: ['src/config/languages.json5', 'languages'],
    links: ['src/config/links.json5', 'links'],
  } as const;
  const results = await Promise.all(Object.entries(definitions).map(async ([key, [path, codec]]) => {
    const response = await loadConfig(path);
    return [key, decodeConfig(codec, response.data)] as const;
  }));
  referencesRaw.value = Object.fromEntries(results);
};

const loadFile = async (file: ConfigFile): Promise<void> => {
  if (!(await confirmDiscard())) return;
  const resource = activeResource.value;
  editorData.value = decodeConfig(resource.codec, cloneData(file.data));
  activePath.value = file.path;
  modifiedAt.value = file.modifiedAt;
  dirty.value = false;
};

const loadResource = async (resource: AdminResource): Promise<boolean> => {
  const loadSequence = ++resourceLoadSequence;
  editorLoading.value = true;
  try {
    let nextFiles: ConfigFile[] = [];
    let nextData: unknown = {};
    let nextPath: string | null = null;
    let nextModifiedAt: number | null = null;

    if (resource.kind === 'collection') {
      nextFiles = await listConfigFiles(resource.path);
      const first = nextFiles[0];
      if (first) {
        nextData = decodeConfig(resource.codec, cloneData(first.data));
        nextPath = first.path;
        nextModifiedAt = first.modifiedAt;
      }
    } else {
      const response = await loadConfig(resource.path);
      nextData = decodeConfig(resource.codec, response.data);
      nextPath = response.path;
      nextModifiedAt = response.modifiedAt;
    }

    // A newer navigation request owns the editor now. Never let this stale
    // response replace it, and commit schema + data in the same Vue update.
    if (loadSequence !== resourceLoadSequence) return false;

    activeResourceId.value = resource.id;
    collectionFiles.value = nextFiles;
    editorData.value = nextData;
    activePath.value = nextPath;
    modifiedAt.value = nextModifiedAt;
    if (resource.kind === 'collection' && project.value) {
      project.value.counts[resource.id] = nextFiles.length;
    }
    dirty.value = false;
    return true;
  } catch (error) {
    if (loadSequence === resourceLoadSequence) {
      message.error(error instanceof Error ? error.message : t('files.loadFailed'));
    }
    return false;
  } finally {
    if (loadSequence === resourceLoadSequence) editorLoading.value = false;
  }
};

const selectResource = async (id: string): Promise<void> => {
  if (!(await confirmDiscard())) return;
  const resource = getAdminResource(id);
  if (!resource) return;
  const loaded = await loadResource(resource);
  if (!loaded) return;
  const url = new URL(window.location.href);
  url.searchParams.set('resource', id);
  window.history.replaceState(null, '', url);
  mobileNavOpen.value = false;
  compactNavOpen.value = false;
  activeView.value = 'resource';
  search.value = '';
  await loadResource(activeResource.value);
};

const selectView = async (view: 'dashboard'): Promise<void> => {
  if (!(await confirmDiscard())) return;
  activeView.value = view;
  mobileNavOpen.value = false;
  compactNavOpen.value = false;
  dirty.value = false;
};

const defaultForField = (field: AdminField): unknown => {
  if (field.default !== undefined) return field.default === '{{now}}' ? defaultNowForField(field) : field.default;
  if (field.localized) return { zh: '', en: '', jp: '' };
  if (field.widget === 'boolean') return false;
  if (field.widget === 'list' || field.multiple) return [];
  if (field.widget === 'object') return Object.fromEntries((field.fields ?? []).map(item => [item.name, defaultForField(item)]));
  if (field.widget === 'number') return 0;
  return '';
};

const refreshCollectionFiles = async (): Promise<void> => {
  collectionFiles.value = await listConfigFiles(activeResource.value.path);
  if (project.value) project.value.counts[activeResource.value.id] = collectionFiles.value.length;
};

const openFileDialog = async (mode: FileDialogMode, file: ConfigFile | null = currentFile.value): Promise<void> => {
  if (mode !== 'create' && !file) return;
  if (!(await confirmDiscard())) return;
  dirty.value = false;
  fileDialogMode.value = mode;
  managedFile.value = file;
  if (mode === 'create') {
    fileDialogName.value = '';
    fileDialogId.value = '';
  } else if (mode === 'duplicate' && file) {
    fileDialogName.value = `${file.name}-copy`;
    fileDialogId.value = `${file.id || file.name}-copy`;
  } else if (file) {
    fileDialogName.value = file.name;
    fileDialogId.value = file.id || file.name;
  }
  fileDialogShow.value = true;
};

const submitFileDialog = async (): Promise<void> => {
  if (!fileDialogValid.value) return;
  fileDialogBusy.value = true;
  try {
    const name = fileDialogName.value.trim();
    if (fileDialogMode.value === 'create') {
      const { fields } = activeResource.value;
      const next = Object.fromEntries(fields.map(field => [field.name, defaultForField(field)]));
      next.id = fileDialogId.value.trim();
      editorData.value = next;
      activePath.value = `${activeResource.value.path}/${name}.json5`;
      modifiedAt.value = null;
      dirty.value = true;
      message.info(t('files.newPending'));
    } else if (fileDialogMode.value === 'duplicate' && managedFile.value) {
      const result = await duplicateConfigFile(
        managedFile.value.path,
        name,
        fileDialogId.value.trim(),
        managedFile.value.modifiedAt,
      );
      await refreshCollectionFiles();
      await loadFile(result);
      message.success(t('files.created', { name }));
    } else if (fileDialogMode.value === 'rename' && managedFile.value) {
      const result = await renameConfigFile(managedFile.value.path, name, managedFile.value.modifiedAt);
      await refreshCollectionFiles();
      await loadFile(result);
      message.success(t('files.renamed', { name }));
    }
    fileDialogShow.value = false;
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('files.actionFailed'));
  } finally {
    fileDialogBusy.value = false;
  }
};

const requestDeleteFile = async (file: ConfigFile): Promise<void> => {
  if (dirty.value && file.path === activePath.value) {
    if (!(await confirmDiscard())) return;
    dirty.value = false;
  }
  dialog.warning({
    title: t('files.deleteTitle', { name: file.name }),
    content: t('files.deleteBody', { item: resourceSingular(activeResource.value) }),
    positiveText: t('files.deletePermanently'),
    negativeText: t('ui.cancel'),
    onPositiveClick: async () => {
      try {
        const wasActive = activePath.value === file.path;
        const oldIndex = collectionFiles.value.findIndex(item => item.path === file.path);
        await deleteConfigFile(file.path, file.modifiedAt);
        await refreshCollectionFiles();
        if (wasActive) {
          const nextFile = collectionFiles.value[Math.min(oldIndex, collectionFiles.value.length - 1)];
          if (nextFile) await loadFile(nextFile);
          else {
            editorData.value = {};
            activePath.value = null;
            modifiedAt.value = null;
            dirty.value = false;
          }
        }
        message.success(t('files.deleted', { name: file.name }));
      } catch (error) {
        message.error(error instanceof Error ? error.message : t('files.deleteFailed'));
      }
    },
  });
};

const handleFileMenu = (key: string, file: ConfigFile): void => {
  entryContextShow.value = false;
  if (key === 'delete') void requestDeleteFile(file);
  else if (key === 'duplicate' || key === 'rename') void openFileDialog(key, file);
};
const openEntryContextMenu = (event: MouseEvent, file: ConfigFile): void => {
  event.preventDefault();
  entryContextShow.value = false;
  entryContextX.value = event.clientX;
  entryContextY.value = event.clientY;
  entryContextFile.value = file;
  void nextTick(() => entryContextShow.value = true);
};

const reloadCollection = async (): Promise<void> => {
  if (!(await confirmDiscard())) return;
  const selectedPath = activePath.value;
  editorLoading.value = true;
  try {
    dirty.value = false;
    await refreshCollectionFiles();
    const selected = collectionFiles.value.find(file => file.path === selectedPath) ?? collectionFiles.value[0];
    if (selected) await loadFile(selected);
    message.success(t('files.refreshed'));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('files.refreshFailed'));
  } finally {
    editorLoading.value = false;
  }
};

const save = async (): Promise<void> => {
  const resource = activeResource.value;
  let path = activePath.value;
  if (!path && resource.kind === 'collection') {
    const id = String((editorData.value as Record<string, unknown>).id ?? '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
      message.error(t('files.invalidId'));
      return;
    }
    path = `${resource.path}/${id}.json5`;
  }
  if (!path) return;

  saving.value = true;
  try {
    const encoded = encodeConfig(resource.codec, cloneData(editorData.value));
    const result = await saveConfig(path, encoded, modifiedAt.value);
    activePath.value = result.path;
    modifiedAt.value = result.modifiedAt;
    dirty.value = false;
    message.success(t('files.configSaved'));
    if (resource.kind === 'collection') await refreshCollectionFiles();
    await loadReferences();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('files.saveFailed'));
  } finally {
    saving.value = false;
  }
};

const handleKeyboardShortcut = (event: KeyboardEvent): void => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 's' && activeView.value === 'resource') {
    event.preventDefault();
    if (dirty.value && !saving.value) void save();
  }
};

const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = '';
};

useEventListener(window, 'keydown', handleKeyboardShortcut);
useEventListener(window, 'beforeunload', handleBeforeUnload);

const refreshAssetCount = async (): Promise<void> => {
  assetCount.value = (await listAssets()).length;
};

const openAssetManager = (options: AssetManagerOpenOptions = {}): Promise<string | string[] | null> => {
  mobileNavOpen.value = false;
  compactNavOpen.value = false;
  pickerAccept.value = options.accept ?? '';
  pickerMultiple.value = options.multiple ?? false;
  pickerDirectory.value = normalizeAssetDirectory(options.directory);
  pickerMode.value = options.mode ?? 'select';
  pickerShow.value = true;
  return new Promise(resolve => {
    pickerResolve = resolve;
  });
};

const uploadManagedFiles = async (files: File[], directory?: string): Promise<string[]> => {
  const target = normalizeAssetDirectory(directory);
  const results = await Promise.all(files.map(file => uploadAsset(file, target)));
  await refreshAssetCount();
  return results.map(result => result.publicUrl);
};

provide(assetManagerKey, { open: openAssetManager, upload: uploadManagedFiles });

const finishPicker = (value: string | string[]): void => {
  pickerResolve?.(value);
  pickerResolve = null;
};

const closePicker = (show: boolean): void => {
  pickerShow.value = show;
  if (!show && pickerResolve) {
    pickerResolve(null);
    pickerResolve = null;
  }
};

const openPreview = (): void => {
  const record = editorData.value as Record<string, unknown>;
  const id = String(record.id ?? '');
  const path = activeResource.value.previewPath?.replace('{id}', encodeURIComponent(id)) ?? '/';
  window.open(`http://127.0.0.1:5173${path}`, '_blank', 'noopener,noreferrer');
};

const toggleNavigation = (): void => {
  if (isMobile.value) {
    sidebarCollapsed.value = false;
    mobileNavOpen.value = !mobileNavOpen.value;
    return;
  }
  if (isCompact.value) {
    sidebarCollapsed.value = false;
    compactNavOpen.value = !compactNavOpen.value;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const selectCollectionPath = async (path: string): Promise<void> => {
  const file = collectionFiles.value.find(item => item.path === path);
  if (file) await loadFile(file);
};

onMounted(async () => {
  try {
    [project.value, assetCount.value] = await Promise.all([
      getProject(),
      listAssets().then((assets: AssetItem[]) => assets.length),
    ]);
    await loadReferences();
    const requestedResourceId = new URL(window.location.href).searchParams.get('resource');
    const requestedResource = requestedResourceId ? getAdminResource(requestedResourceId) : undefined;
    if (requestedResource && await loadResource(requestedResource)) {
      activeView.value = 'resource';
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('files.initFailed'));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="admin-shell"
    :class="{
      'sidebar-collapsed': navigationCollapsed,
      'compact-nav-open': compactNavOpen,
      'mobile-nav-open': mobileNavOpen,
    }"
  >
    <button
      v-if="mobileNavOpen"
      class="mobile-nav-backdrop"
      :aria-label="t('nav.close')"
      @click="mobileNavOpen = false"
    />
    <aside class="admin-sidebar">
      <div class="brand">
        <NAvatar round :size="38" :src="resolveAssetUrl('/assets/avatar.png')">
          <AdminIcon name="Sparkles" />
        </NAvatar>
        <div v-if="!navigationCollapsed" class="brand-copy">
          <strong>{{ project?.siteTitle || t('nav.adminCenter') }}</strong>
          <span>Local Studio</span>
        </div>
      </div>

      <div class="sidebar-scroll">
        <nav class="sidebar-nav" :aria-label="t('nav.navigation')">
          <button
            class="nav-item nav-root"
            data-view="dashboard"
            :class="{ active: activeView === 'dashboard' }"
            @click="selectView('dashboard')"
          >
            <AdminIcon name="CircleGauge" />
            <span v-if="!navigationCollapsed">{{ t('nav.overview') }}</span>
          </button>
          <button
            class="nav-item nav-root"
            data-view="assets"
            @click="openAssetManager({ mode: 'manage' })"
          >
            <AdminIcon name="HardDrive" />
            <span v-if="!navigationCollapsed">{{ t('nav.assets') }}</span>
            <small v-if="!navigationCollapsed">{{ assetCount }}</small>
          </button>

          <section v-for="section in adminSections" :key="section.id" class="nav-section">
            <div v-if="!navigationCollapsed" class="nav-section-label">
              <AdminIcon :name="section.icon" :size="14" />
              {{ t(`sections.${section.id}`, section.label) }}
            </div>
            <button
              v-for="resourceItem in section.resources"
              :key="resourceItem.id"
              class="nav-item"
              :data-resource-id="resourceItem.id"
              :class="{ active: activeView === 'resource' && activeResourceId === resourceItem.id }"
              :title="navigationCollapsed ? resourceLabel(resourceItem) : undefined"
              @click="selectResource(resourceItem.id)"
            >
              <AdminIcon :name="resourceItem.icon" />
              <span v-if="!navigationCollapsed">{{ resourceLabel(resourceItem) }}</span>
              <small v-if="!navigationCollapsed && countFor(resourceItem) !== null">{{ countFor(resourceItem) }}</small>
            </button>
          </section>
        </nav>
      </div>

      <div class="sidebar-project" :title="project?.root">
        <AdminIcon name="HardDrive" :size="16" />
        <div v-if="!navigationCollapsed">
          <strong>{{ project?.name }}</strong>
          <span>{{ project?.branch }} · {{ t('nav.repositoryBound') }}</span>
        </div>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <NButton
          quaternary
          circle
          :title="isMobile ? t('nav.open') : navigationCollapsed ? t('nav.expand') : t('nav.collapse')"
          @click="toggleNavigation"
        >
          <AdminIcon :name="isMobile ? 'Menu' : navigationCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'" />
        </NButton>
        <div class="topbar-title">
          <span>
            {{ activeView === 'dashboard' ? t('nav.dashboard') : resourceLabel(activeResource) }}
          </span>
          <small v-if="activeView === 'resource'">{{ resourceDescription(activeResource) }}</small>
        </div>
        <div class="topbar-actions">
          <NDropdown :options="uiLocaleOptions" placement="bottom-end" @select="setUiLocale">
            <NButton secondary size="small" class="ui-locale-switcher" :title="t('ui.language')">
              <template #icon><AdminIcon name="Languages" :size="16" /></template>
              {{ uiLocaleLabel }}
              <AdminIcon name="ChevronDown" :size="14" />
            </NButton>
          </NDropdown>
          <NTooltip trigger="hover"><template #trigger>
            <NButton quaternary circle :title="t('nav.preview')" @click="openPreview">
              <AdminIcon name="ExternalLink" />
            </NButton>
          </template>{{ t('nav.preview') }}</NTooltip>
          <NTooltip
            v-if="activeView === 'resource' && activeResource.kind === 'collection'"
            trigger="hover"
          ><template #trigger>
            <NButton quaternary circle :title="t('editor.refreshFiles')" @click="reloadCollection">
              <AdminIcon name="RefreshCw" />
            </NButton>
          </template>{{ t('editor.refreshFiles') }}</NTooltip>
          <NButton
            v-if="activeView === 'resource'"
            type="primary"
            :loading="saving"
            :disabled="!dirty"
            @click="save"
          >
            <template #icon><AdminIcon name="Save" /></template>
            {{ dirty ? t('ui.saveChanges') : t('ui.saved') }}
          </NButton>
        </div>
      </header>

      <div v-if="loading" class="page-loading"><NSkeleton text :repeat="5" /></div>

      <div v-else-if="activeView === 'dashboard'" class="page-scroll">
        <div class="dashboard-page">
          <section class="dashboard-hero">
            <div>
              <NTag size="small" type="success" :bordered="false">{{ t('dashboard.connected') }}</NTag>
              <h1>{{ project?.siteTitle }}</h1>
            </div>
            <NButton type="primary" size="large" @click="selectResource('gallery')">{{ t('dashboard.start') }}</NButton>
          </section>
          <section class="stat-grid">
            <NCard
              v-for="resourceItem in adminSections[0].resources"
              :key="resourceItem.id"
              hoverable
              @click="selectResource(resourceItem.id)"
            >
              <div class="stat-card">
                <AdminIcon :name="resourceItem.icon" :size="24" />
                <div><strong>{{ countFor(resourceItem) }}</strong><span>{{ resourceLabel(resourceItem) }}</span></div>
              </div>
            </NCard>
            <NCard hoverable @click="openAssetManager({ mode: 'manage' })">
              <div class="stat-card">
                <AdminIcon name="HardDrive" :size="24" />
                <div><strong>{{ assetCount }}</strong><span>{{ t('dashboard.availableAssets') }}</span></div>
              </div>
            </NCard>
          </section>
          <section class="dashboard-section">
            <h2>{{ t('dashboard.modules') }}</h2>
            <div class="module-grid">
              <button
                v-for="section in adminSections.slice(1)"
                :key="section.id"
                @click="selectResource(section.resources[0].id)"
              >
                <AdminIcon :name="section.icon" :size="22" />
                <span>
                  <strong>{{ t(`sections.${section.id}`, section.label) }}</strong>
                  <small>{{ t('dashboard.moduleCount', { count: section.resources.length }) }}</small>
                </span>
                <AdminIcon name="ChevronRight" :size="16" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="resource-workspace" :class="{ 'has-entry-panel': activeResource.kind === 'collection' }">
        <aside v-if="activeResource.kind === 'collection'" class="entry-panel">
          <div class="entry-panel-header">
            <NInput v-model:value="search" clearable size="small" :placeholder="t('editor.search')">
              <template #prefix><AdminIcon name="Search" :size="15" /></template>
            </NInput>
            <NButton quaternary circle size="small" :title="t('editor.refreshFiles')" @click="reloadCollection">
              <AdminIcon name="RefreshCw" :size="15" />
            </NButton>
            <NButton type="primary" size="small" :title="t('editor.newFile')" @click="openFileDialog('create', null)">
              <template #icon><AdminIcon name="FilePlus2" :size="15" /></template>
              {{ t('editor.newEntry') }}
            </NButton>
          </div>
          <div class="entry-list-scroll">
            <div class="entry-list">
              <div
                v-for="file in filteredFiles"
                :key="file.path"
                class="entry-row"
                :class="{ active: file.path === activePath }"
                @contextmenu="openEntryContextMenu($event, file)"
              >
                <button class="entry-main" @click="loadFile(file)">
                  <div class="entry-thumb">
                    <img
                      v-if="imageForEntry(file)"
                      :src="resolveAssetUrl(imageForEntry(file))"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    >
                    <AdminIcon v-else :name="activeResource.icon" :size="20" />
                  </div>
                  <span><strong>{{ titleForEntry(file) }}</strong><small>{{ fileMetaForEntry(file) }}</small></span>
                </button>
                <NDropdown
                  trigger="click"
                  :options="fileMenuOptions"
                  placement="bottom-end"
                  @select="handleFileMenu($event, file)"
                >
                  <NButton
                    quaternary circle size="tiny" class="entry-menu-button"
                    :title="t('editor.fileActions')"
                    @click.stop
                  >
                    <AdminIcon name="MoreHorizontal" :size="16" />
                  </NButton>
                </NDropdown>
              </div>
              <NEmpty v-if="filteredFiles.length === 0" size="small" :description="t('editor.empty')" />
            </div>
          </div>
        </aside>

        <NSpin :show="editorLoading" class="editor-panel">
          <div class="editor-scroll">
            <div class="editor-content">
              <div v-if="isPhone && activeResource.kind === 'collection'" class="mobile-entry-toolbar">
                <NSelect
                  :value="activePath"
                  :options="collectionOptions"
                  filterable
                  :placeholder="t('editor.selectEntry')"
                  @update:value="selectCollectionPath"
                />
                <NButton quaternary circle :title="t('editor.refreshFiles')" @click="reloadCollection">
                  <AdminIcon name="RefreshCw" :size="16" />
                </NButton>
                <NButton type="primary" circle :title="t('editor.newFile')" @click="openFileDialog('create', null)">
                  <AdminIcon name="FilePlus2" :size="16" />
                </NButton>
              </div>
              <section class="editor-heading">
                <div class="editor-heading-main">
                  <div class="resource-glyph"><AdminIcon :name="activeResource.icon" :size="24" /></div>
                  <div>
                    <div class="eyebrow">
                      <span>
                        {{ activeResource.kind === 'collection'
                          ? resourceSingular(activeResource)
                          : t('editor.siteConfig') }}
                      </span>
                      <span v-if="dirty" class="dirty-indicator">{{ t('ui.unsaved') }}</span>
                    </div>
                    <h1>{{ resourceLabel(activeResource) }}</h1>
                    <p>{{ resourceDescription(activeResource) }}</p>
                  </div>
                </div>
                <div class="editor-file-side">
                  <div class="editor-file-meta">
                    <span>{{ t('editor.configFile') }}</span>
                    <code>{{ activePath ?? t('editor.noFile') }}</code>
                  </div>
                  <NDropdown
                    v-if="activeResource.kind === 'collection' && currentFile"
                    trigger="click"
                    :options="fileMenuOptions"
                    placement="bottom-end"
                    @select="handleFileMenu($event, currentFile)"
                  >
                    <NButton secondary size="small">
                      <template #icon><AdminIcon name="MoreHorizontal" :size="15" /></template>
                      {{ t('editor.fileActions') }}
                    </NButton>
                  </NDropdown>
                </div>
              </section>
              <section class="editor-form-surface">
                <header class="form-surface-header">
                  <strong>{{ t('editor.content') }}</strong>
                  <div class="content-locale-control" role="group" :aria-label="t('editor.contentLanguage')">
                    <span>{{ t('editor.contentLanguage') }}</span>
                    <NButtonGroup size="small">
                      <NButton
                        v-for="(label, code) in localeLabels"
                        :key="code"
                        :type="locale === code ? 'primary' : 'default'"
                        :secondary="locale !== code"
                        @click="locale = code"
                      >{{ label }}</NButton>
                    </NButtonGroup>
                  </div>
                </header>
                <SchemaForm
                  :model-value="editorData"
                  :fields="activeResource.fields"
                  :locale="locale"
                  :relations="relationOptions"
                  @update:model-value="editorData = $event"
                  @change="dirty = true"
                />
              </section>
            </div>
          </div>
        </NSpin>
      </div>
    </main>

    <NModal
      v-model:show="fileDialogShow"
      preset="card"
      class="entry-file-modal"
      :title="fileDialogTitle"
      :mask-closable="!fileDialogBusy"
    >
      <NAlert v-if="fileDialogMode === 'rename'" type="info" :bordered="false">
        {{ t('files.renameInfo') }}
      </NAlert>
      <NAlert v-else-if="fileDialogMode === 'duplicate'" type="info" :bordered="false">
        {{ t('files.duplicateInfo') }}
      </NAlert>
      <NAlert v-else type="info" :bordered="false">
        {{ t('files.createInfo') }}
      </NAlert>
      <NFormItem
        :label="t('files.fileName')"
        :validation-status="fileDialogName && !ENTRY_NAME_PATTERN.test(fileDialogName.trim()) ? 'error' : undefined"
        :feedback="t('files.fileNameHint')"
      >
        <NInput v-model:value="fileDialogName" autofocus :placeholder="t('files.example')">
          <template #suffix>.json5</template>
        </NInput>
      </NFormItem>
      <NFormItem
        v-if="fileDialogMode !== 'rename'"
        :label="t('files.id')"
        :validation-status="fileDialogId && !ENTRY_NAME_PATTERN.test(fileDialogId.trim()) ? 'error' : undefined"
        :feedback="t('files.idHint')"
      >
        <NInput v-model:value="fileDialogId" :placeholder="t('files.example')" @keyup.enter="submitFileDialog" />
      </NFormItem>
      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="fileDialogBusy" @click="fileDialogShow = false">{{ t('ui.cancel') }}</NButton>
          <NButton type="primary" :loading="fileDialogBusy" :disabled="!fileDialogValid" @click="submitFileDialog">
            {{ fileDialogAction }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="entryContextShow"
      :x="entryContextX"
      :y="entryContextY"
      :options="fileMenuOptions"
      @select="entryContextFile && handleFileMenu($event, entryContextFile)"
      @clickoutside="entryContextShow = false"
    />

    <AssetPickerModal
      :show="pickerShow"
      :accept="pickerAccept"
      :multiple="pickerMultiple"
      :default-directory="pickerDirectory"
      :mode="pickerMode"
      @update:show="closePicker"
      @select="finishPicker"
      @assets-change="refreshAssetCount"
    />
  </div>
</template>
