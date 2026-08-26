<script setup lang="ts">
/* eslint-disable @stylistic/max-len */
import { NButton, NDropdown, NInput, NProgress, type DropdownOption, useMessage } from 'naive-ui';
import Sortable from 'sortablejs';
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { assetManagerKey, normalizeAssetDirectory } from '../asset-manager';
import { resolveAssetUrl } from '../asset-url';
import { preservesNativeContextMenu, useContextMenuEscape } from '../context-menu';
import type { AdminField } from '../types';

import AdminIcon from './AdminIcon.vue';

const props = defineProps<{ modelValue: unknown; field: AdminField }>();
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]]; change: [] }>();

const manager = inject(assetManagerKey);
const message = useMessage();
const { t } = useI18n();
const grid = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const draggingFiles = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const pendingUrl = ref('');
const mediaContextShow = ref(false);
const mediaContextX = ref(0);
const mediaContextY = ref(0);
const mediaContextIndex = ref<number | null>(null);
useContextMenuEscape(mediaContextShow);
let sortable: Sortable | null = null;
let dragDepth = 0;

const isImage = computed(() => props.field.widget === 'image');
const values = computed<string[]>(() => {
  if (props.field.multiple) return Array.isArray(props.modelValue) ? props.modelValue.map(String).filter(Boolean) : [];
  const value = String(props.modelValue ?? '').trim();
  return value ? [value] : [];
});
const uploadDirectory = computed(() => normalizeAssetDirectory(props.field.media_folder));
const accepts = computed(() => props.field.accept || (isImage.value ? 'image/*' : ''));
const singleName = computed(() => {
  const parts = values.value[0]?.split('/').filter(Boolean) ?? [];
  return parts[parts.length - 1] ?? t('media.none');
});

const updateValues = (next: string[]): void => {
  emit('update:modelValue', props.field.multiple ? next : (next[0] ?? ''));
  emit('change');
};

const appendValues = (paths: string[]): void => {
  const clean = paths.map(value => value.trim()).filter(Boolean);
  updateValues(props.field.multiple ? [...new Set([...values.value, ...clean])] : clean.slice(0, 1));
};

const openLibrary = async (replaceIndex?: number): Promise<void> => {
  if (!manager) return;
  const replace = replaceIndex !== undefined;
  const selected = await manager.open({
    accept: accepts.value,
    directory: uploadDirectory.value,
    mode: 'select',
    multiple: props.field.multiple && !replace,
  });
  if (selected === null) return;
  const paths = Array.isArray(selected) ? selected : [selected];
  if (replace && replaceIndex !== undefined) {
    const next = [...values.value];
    next[replaceIndex] = paths[0] ?? next[replaceIndex];
    updateValues(next);
  } else appendValues(paths);
};

const uploadFiles = async (files: File[]): Promise<void> => {
  if (!manager || files.length === 0) return;
  const accepted = isImage.value ? files.filter(file => file.type.startsWith('image/')) : files;
  if (accepted.length === 0) {
    message.warning(t('media.imageOnly'));
    return;
  }
  uploading.value = true;
  uploadProgress.value = 20;
  try {
    const paths = await manager.upload(props.field.multiple ? accepted : accepted.slice(0, 1), uploadDirectory.value);
    uploadProgress.value = 100;
    appendValues(paths);
    message.success(t('media.uploadDone', { count: paths.length }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('media.uploadFailed'));
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
    if (input.value) input.value.value = '';
  }
};

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  void uploadFiles([...target.files ?? []]);
};

const onDragEnter = (event: DragEvent): void => {
  if (!event.dataTransfer?.types.includes('Files')) return;
  dragDepth += 1;
  draggingFiles.value = true;
};

const onDragLeave = (): void => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) draggingFiles.value = false;
};

const onDrop = (event: DragEvent): void => {
  dragDepth = 0;
  draggingFiles.value = false;
  void uploadFiles([...event.dataTransfer?.files ?? []]);
};

const remove = (index: number): void => updateValues(values.value.filter((_, itemIndex) => itemIndex !== index));

const moveValue = (index: number, delta: number): void => {
  const target = index + delta;
  if (target < 0 || target >= values.value.length) return;
  const next = [...values.value];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  updateValues(next);
  void nextTick(() => {
    const handles = grid.value?.querySelectorAll<HTMLElement>('.drag-handle');
    handles?.[target]?.focus();
  });
};

const updatePath = (index: number, value: string): void => {
  const next = [...values.value];
  next[index] = value;
  updateValues(next);
};

const addUrl = (): void => {
  if (!pendingUrl.value.trim()) return;
  appendValues([pendingUrl.value]);
  pendingUrl.value = '';
};

const mediaContextOptions = computed<DropdownOption[]>(() => {
  const index = mediaContextIndex.value;
  if (index === null || !values.value[index]) {
    return [
      { label: t('media.localUpload'), key: 'upload' },
      { label: t('media.chooseFromManager'), key: 'choose' },
    ];
  }
  return [
    { label: t('assets.copyPublicPath'), key: 'copy-path' },
    { label: t('media.replaceFromManager'), key: 'replace' },
    ...(props.field.multiple
      ? [
        { type: 'divider', key: 'divider-1' },
        { label: t('schema.moveUp'), key: 'move-up', disabled: index <= 0 },
        { label: t('schema.moveDown'), key: 'move-down', disabled: index >= values.value.length - 1 },
      ]
      : []),
    { type: 'divider', key: 'divider-2' },
    { label: props.field.multiple ? t('media.remove') : t('media.clear'), key: 'remove' },
  ];
});
const openMediaContextMenu = (event: MouseEvent, index: number | null): void => {
  if (preservesNativeContextMenu(event.target)) {
    mediaContextShow.value = false;
    return;
  }
  event.preventDefault();
  mediaContextShow.value = false;
  mediaContextX.value = event.clientX;
  mediaContextY.value = event.clientY;
  mediaContextIndex.value = index;
  void nextTick(() => mediaContextShow.value = true);
};
const handleMediaContextSelect = async (key: string): Promise<void> => {
  const index = mediaContextIndex.value;
  mediaContextShow.value = false;
  if (key === 'upload') input.value?.click();
  else if (key === 'choose') await openLibrary();
  else if (index !== null && values.value[index]) {
    if (key === 'copy-path') {
      try {
        await navigator.clipboard.writeText(values.value[index]);
        message.success(t('assets.copied'));
      } catch {
        message.error(t('assets.copyFailed'));
      }
    } else if (key === 'replace') await openLibrary(index);
    else if (key === 'move-up') moveValue(index, -1);
    else if (key === 'move-down') moveValue(index, 1);
    else if (key === 'remove') remove(index);
  }
};

const initializeSortable = (): void => {
  if (!props.field.multiple || !grid.value || sortable) return;
  sortable = Sortable.create(grid.value, {
    animation: 170,
    draggable: '.media-card',
    handle: '.drag-handle',
    filter: 'input',
    forceFallback: true,
    preventOnFilter: false,
    fallbackTolerance: 5,
    touchStartThreshold: 5,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: event => {
      if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex) return;
      const next = [...values.value];
      const [moved] = next.splice(event.oldIndex, 1);
      next.splice(event.newIndex, 0, moved);
      updateValues(next);
    },
  });
};

watch(() => props.field.multiple, async () => {
  sortable?.destroy();
  sortable = null;
  await nextTick();
  initializeSortable();
});
onMounted(initializeSortable);
onBeforeUnmount(() => sortable?.destroy());
</script>

<template>
  <div
    class="media-field"
    :class="{ 'is-dragging-files': draggingFiles, 'is-single': !field.multiple }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <header v-if="field.multiple" class="media-field-toolbar">
      <div>
        <strong>{{ values.length ? t('media.files', { count: values.length }) : t('media.noFiles') }}</strong>
        <span>{{ t('media.uploadDestination', { directory: uploadDirectory }) }}</span>
      </div>
      <div class="media-field-actions">
        <NButton secondary size="small" :disabled="uploading" @click="input?.click()">
          <template #icon><AdminIcon name="UploadCloud" :size="15" /></template>
          {{ t('media.localUpload') }}
        </NButton>
        <NButton type="primary" secondary size="small" :disabled="uploading" @click="openLibrary()">
          <template #icon><AdminIcon name="FolderOpen" :size="15" /></template>
          {{ t('media.manager') }}
        </NButton>
      </div>
    </header>

    <input ref="input" class="visually-hidden-file" type="file" :accept="accepts" :multiple="field.multiple" @change="handleInput">
    <NProgress v-if="uploading" type="line" :percentage="uploadProgress" :show-indicator="false" processing />

    <div v-if="!field.multiple" class="single-media-control" :class="{ 'has-value': values.length }" @contextmenu.stop="openMediaContextMenu($event, values.length ? 0 : null)">
      <button type="button" class="single-media-preview" :title="values.length ? t('media.replaceFromManager') : t('media.chooseFromManager')" @click="openLibrary(values.length ? 0 : undefined)">
        <img v-if="isImage && values.length" :src="resolveAssetUrl(values[0])" :alt="field.label" loading="lazy" decoding="async" draggable="false">
        <AdminIcon v-else :name="isImage ? 'ImagePlus' : 'FilePlus2'" :size="30" />
      </button>
      <div class="single-media-details">
        <div class="single-media-heading"><strong :title="singleName">{{ singleName }}</strong></div>
        <NInput v-if="values.length" :value="values[0]" size="small" :placeholder="t('media.pathPlaceholder')" @update:value="updatePath(0, $event)" />
        <div class="single-media-actions">
          <NButton size="small" secondary :disabled="uploading" @click="input?.click()"><template #icon><AdminIcon name="UploadCloud" :size="15" /></template>{{ values.length ? t('media.localReplace') : t('media.localUpload') }}</NButton>
          <NButton size="small" type="primary" secondary :disabled="uploading" @click="openLibrary(values.length ? 0 : undefined)"><template #icon><AdminIcon name="FolderOpen" :size="15" /></template>{{ values.length ? t('media.replace') : t('media.choose') }}</NButton>
          <NButton v-if="values.length" size="small" quaternary type="error" @click="remove(0)">{{ t('media.clear') }}</NButton>
        </div>
      </div>
    </div>

    <div v-else-if="values.length" ref="grid" class="media-card-grid">
      <article v-for="(path, index) in values" :key="`${path}-${index}`" class="media-card" @contextmenu.stop="openMediaContextMenu($event, index)">
        <div class="media-card-preview">
          <img v-if="isImage" :src="resolveAssetUrl(path)" :alt="field.label" loading="lazy" decoding="async" draggable="false">
          <AdminIcon v-else name="FileText" :size="36" />
          <span v-if="field.multiple" role="button" tabindex="0" class="drag-handle" :title="t('schema.dragSort')" :aria-label="t('schema.dragSort')" @keydown.alt.up.prevent="moveValue(index, -1)" @keydown.alt.down.prevent="moveValue(index, 1)">
            <AdminIcon name="GripVertical" :size="17" />
          </span>
        </div>
        <NInput :value="path" size="small" :placeholder="t('media.pathPlaceholder')" @update:value="updatePath(index, $event)" />
        <div class="media-card-actions">
          <NButton text size="tiny" @click="openLibrary(index)">{{ t('media.replaceShort') }}</NButton>
          <NButton text size="tiny" type="error" @click="remove(index)">{{ t('media.remove') }}</NButton>
        </div>
      </article>
    </div>

    <button v-else type="button" class="media-empty-drop" :disabled="uploading" @click="input?.click()" @contextmenu.stop="openMediaContextMenu($event, null)">
      <AdminIcon :name="isImage ? 'ImagePlus' : 'FilePlus2'" :size="28" />
      <strong>{{ t('media.drop', { type: isImage ? t('media.image') : t('media.file') }) }}</strong>
      <span>{{ t('media.dropHelp') }}</span>
    </button>

    <div v-if="field.multiple" class="media-url-row">
      <NInput v-model:value="pendingUrl" size="small" :placeholder="t('media.pastePath')" @keyup.enter="addUrl" />
      <NButton size="small" :disabled="!pendingUrl.trim()" @click="addUrl">{{ t('media.addPath') }}</NButton>
    </div>
    <div v-if="draggingFiles" class="media-drop-overlay"><AdminIcon name="UploadCloud" :size="32" /><strong>{{ t('media.release') }}</strong></div>

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="mediaContextShow"
      :x="mediaContextX"
      :y="mediaContextY"
      :options="mediaContextOptions"
      @select="handleMediaContextSelect"
      @clickoutside="mediaContextShow = false"
    />
  </div>
</template>
