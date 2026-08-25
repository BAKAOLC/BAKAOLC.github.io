<script setup lang="ts">
/* eslint-disable @stylistic/max-len */
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { NButton, NButtonGroup, useMessage } from 'naive-ui';
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { assetManagerKey, normalizeAssetDirectory } from '../asset-manager';
import { resolveAssetUrl } from '../asset-url';

import AdminIcon from './AdminIcon.vue';

const props = withDefaults(defineProps<{ modelValue: string; directory?: string }>(), {
  directory: 'public/assets/articles',
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const manager = inject(assetManagerKey);
const message = useMessage();
const { t } = useI18n();
const textarea = ref<HTMLTextAreaElement | null>(null);
const view = ref<'preview' | 'split' | 'write'>('split');
const fullscreen = ref(false);
const uploading = ref(false);

const escapeAttribute = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const renderer = new marked.Renderer();
renderer.image = ({ href, text, title }) => {
  const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : '';
  return `<img src="${escapeAttribute(resolveAssetUrl(href))}" alt="${escapeAttribute(text)}"${titleAttribute}>`;
};
marked.setOptions({ breaks: true, gfm: true });
const preview = computed(() => DOMPurify.sanitize(marked.parse(props.modelValue, { async: false, renderer }) as string));
const statistics = computed(() => {
  const text = props.modelValue.trim();
  const characters = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return t('markdown.stats', { characters, words });
});

const setValue = (value: string): void => emit('update:modelValue', value);

const replaceSelection = async (before: string, after: string, placeholder: string): Promise<void> => {
  const element = textarea.value;
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const rawSelection = props.modelValue.slice(start, end);
  const selected = rawSelection.length > 0 ? rawSelection : placeholder;
  setValue(`${props.modelValue.slice(0, start)}${before}${selected}${after}${props.modelValue.slice(end)}`);
  await nextTick();
  element.focus();
  element.setSelectionRange(start + before.length, start + before.length + selected.length);
};

const prefixLines = async (prefix: string, placeholder: string): Promise<void> => {
  const element = textarea.value;
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const lineStart = props.modelValue.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const rawSelection = props.modelValue.slice(lineStart, end);
  const selection = rawSelection.length > 0 ? rawSelection : placeholder;
  const replacement = selection.split('\n').map(line => `${prefix}${line}`).join('\n');
  setValue(`${props.modelValue.slice(0, lineStart)}${replacement}${props.modelValue.slice(end)}`);
  await nextTick();
  element.focus();
  element.setSelectionRange(lineStart, lineStart + replacement.length);
};

const insertAtCursor = async (content: string): Promise<void> => {
  const element = textarea.value;
  const start = element?.selectionStart ?? props.modelValue.length;
  const end = element?.selectionEnd ?? start;
  const leading = start > 0 && props.modelValue[start - 1] !== '\n' ? '\n' : '';
  const trailing = end < props.modelValue.length && props.modelValue[end] !== '\n' ? '\n' : '';
  const inserted = `${leading}${content}${trailing}`;
  setValue(`${props.modelValue.slice(0, start)}${inserted}${props.modelValue.slice(end)}`);
  await nextTick();
  textarea.value?.focus();
  textarea.value?.setSelectionRange(start + inserted.length, start + inserted.length);
};

const insertImages = async (paths: string[]): Promise<void> => {
  await insertAtCursor(paths.map(path => `![${t('markdown.imageAlt')}](<${path.replace(/</g, '%3C').replace(/>/g, '%3E')}>)`).join('\n\n'));
};

const openImageManager = async (): Promise<void> => {
  if (!manager) return;
  const selected = await manager.open({
    accept: 'image/*', directory: normalizeAssetDirectory(props.directory), mode: 'select', multiple: true,
  });
  if (selected === null) return;
  await insertImages(Array.isArray(selected) ? selected : [selected]);
};

const uploadImages = async (files: File[]): Promise<void> => {
  if (!manager) return;
  const images = files.filter(file => file.type.startsWith('image/'));
  if (!images.length) {
    message.warning(t('markdown.imageOnly'));
    return;
  }
  uploading.value = true;
  try {
    const paths = await manager.upload(images, normalizeAssetDirectory(props.directory));
    await insertImages(paths);
    message.success(t('markdown.uploadDone', { count: paths.length }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('markdown.uploadFailed'));
  } finally {
    uploading.value = false;
  }
};

const handleDrop = (event: DragEvent): void => {
  const files = [...event.dataTransfer?.files ?? []];
  if (files.length) void uploadImages(files);
};

const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && fullscreen.value) fullscreen.value = false;
};

watch(fullscreen, value => document.body.classList.toggle('markdown-fullscreen-open', value));
onBeforeUnmount(() => document.body.classList.remove('markdown-fullscreen-open'));
</script>

<template>
  <section class="markdown-editor" :class="{ 'is-fullscreen': fullscreen }" @keydown="handleEscape">
    <header class="markdown-toolbar">
      <div class="markdown-format-actions">
        <NButton quaternary circle size="small" :title="t('markdown.heading')" @click="prefixLines('## ', t('markdown.heading'))"><strong>H2</strong></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.bold')" @click="replaceSelection('**', '**', t('markdown.bold'))"><AdminIcon name="Bold" :size="16" /></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.italic')" @click="replaceSelection('*', '*', t('markdown.italic'))"><AdminIcon name="Italic" :size="16" /></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.link')" @click="replaceSelection('[', '](https://)', t('markdown.link'))"><AdminIcon name="Link2" :size="16" /></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.quote')" @click="prefixLines('> ', t('markdown.quote'))"><AdminIcon name="Quote" :size="16" /></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.unorderedList')" @click="prefixLines('- ', t('schema.item'))"><AdminIcon name="List" :size="16" /></NButton>
        <NButton quaternary circle size="small" :title="t('markdown.code')" @click="replaceSelection('`', '`', 'code')"><AdminIcon name="Code2" :size="16" /></NButton>
        <NButton secondary size="small" :loading="uploading" :title="t('markdown.chooseImage')" @click="openImageManager">
          <template #icon><AdminIcon name="ImagePlus" :size="16" /></template>{{ t('markdown.insertImage') }}
        </NButton>
      </div>
      <div class="markdown-view-actions">
        <span>{{ statistics }}</span>
        <NButtonGroup size="small">
          <NButton :type="view === 'write' ? 'primary' : 'default'" @click="view = 'write'">{{ t('markdown.write') }}</NButton>
          <NButton :type="view === 'split' ? 'primary' : 'default'" @click="view = 'split'">{{ t('markdown.split') }}</NButton>
          <NButton :type="view === 'preview' ? 'primary' : 'default'" @click="view = 'preview'">{{ t('markdown.preview') }}</NButton>
        </NButtonGroup>
        <NButton quaternary circle size="small" :title="fullscreen ? t('markdown.exitFullscreen') : t('markdown.fullscreen')" @click="fullscreen = !fullscreen">
          <AdminIcon :name="fullscreen ? 'Minimize2' : 'Maximize2'" :size="17" />
        </NButton>
      </div>
    </header>

    <div class="markdown-workspace" :class="`view-${view}`">
      <div v-show="view !== 'preview'" class="markdown-write-pane">
        <textarea
          ref="textarea"
          :value="modelValue"
          class="markdown-textarea"
          spellcheck="true"
          :placeholder="t('markdown.placeholder')"
          @input="setValue(($event.target as HTMLTextAreaElement).value)"
          @dragover.prevent
          @drop.prevent="handleDrop"
        />
        <div v-if="uploading" class="markdown-uploading"><AdminIcon name="UploadCloud" :size="18" />{{ t('markdown.uploading') }}</div>
      </div>
      <article v-show="view !== 'write'" class="markdown-preview" v-html="preview" />
    </div>
  </section>
</template>
