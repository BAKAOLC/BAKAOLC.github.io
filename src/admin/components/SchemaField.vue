<script setup lang="ts">
/* eslint-disable @stylistic/max-len */
import {
  NButton, NCard, NColorPicker, NDatePicker, NDynamicInput, NFormItem, NInput,
  NDropdown, NInputNumber, NPopconfirm, NSelect, NSwitch, NTag, type DropdownOption, useMessage,
} from 'naive-ui';
import Sortable from 'sortablejs';
import {
  computed, defineAsyncComponent, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, toRaw,
} from 'vue';
import { useI18n } from 'vue-i18n';

import { assetManagerKey, normalizeAssetDirectory } from '../asset-manager';
import { resolveAssetUrl } from '../asset-url';
import { preservesNativeContextMenu, useContextMenuEscape } from '../context-menu';
import { defaultNowForField, formatLocalDate, parseConfigDate } from '../date-time';
import { translateDefinition } from '../definition-i18n';
import type { AdminUiLocale } from '../i18n';
import type { AdminField, AdminOption } from '../types';

import AdminIcon from './AdminIcon.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import MediaField from './MediaField.vue';

type RelationOption = { label: string; value: string };

const props = defineProps<{
  modelValue: unknown;
  field: AdminField;
  locale: 'zh' | 'en' | 'jp';
  relations: Record<string, RelationOption[]>;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: unknown]; change: [] }>();
const SchemaForm = defineAsyncComponent(() => import('./SchemaForm.vue'));
const manager = inject(assetManagerKey);
const message = useMessage();
const { locale: uiLocale, t } = useI18n();
const dt = (value: string | undefined): string => translateDefinition(value, uiLocale.value as AdminUiLocale);
const listRoot = ref<HTMLElement | null>(null);
const listFileInput = ref<HTMLInputElement | null>(null);
const importingListImages = ref(false);
const listContextShow = ref(false);
const listContextX = ref(0);
const listContextY = ref(0);
const listContextIndex = ref<number | null>(null);
useContextMenuEscape(listContextShow);
let sortable: Sortable | null = null;
let objectKeyCounter = 0;
const objectKeys = new WeakMap<object, string>();

const update = (value: unknown): void => {
  emit('update:modelValue', value);
  emit('change');
};
const recordValue = computed<Record<string, unknown>>(() => (
  typeof props.modelValue === 'object' && props.modelValue !== null && !Array.isArray(props.modelValue)
    ? props.modelValue as Record<string, unknown>
    : {}
));
const arrayValue = computed<unknown[]>(() => Array.isArray(props.modelValue) ? props.modelValue : []);
const activeLocalizedField = computed<AdminField>(() => {
  const localized = props.field.fields?.find(field => field.locale === props.locale);
  return {
    ...localized,
    name: props.field.name,
    label: props.field.label,
    required: props.field.required,
    hint: props.field.hint,
    localized: false,
    fields: undefined,
  } as AdminField;
});
const localizedValue = computed(() => recordValue.value[props.locale] ?? '');
const updateLocalized = (value: unknown): void => update({ ...recordValue.value, [props.locale]: value });
const selectOptions = computed(() => (props.field.options ?? []).map((option: AdminOption) => (
  typeof option === 'string' ? { label: dt(option), value: option } : { ...option, label: dt(option.label) }
)));
const relationOptions = computed(() => props.field.relation ? props.relations[props.field.relation] ?? [] : []);
const datePickerType = computed<'date' | 'datetime'>(() => (
  props.field.type === 'datetime' || /\d{2}:\d{2}/.test(String(props.modelValue ?? '')) ? 'datetime' : 'date'
));
const datePickerValue = computed(() => parseConfigDate(props.modelValue));
const updateDateValue = (value: number | null): void => {
  update(value === null ? '' : formatLocalDate(new Date(value), datePickerType.value === 'datetime'));
};
const layoutClass = computed(() => {
  const widget = (props.field.localized ? activeLocalizedField.value.widget : props.field.widget) ?? 'string';
  if (['image', 'file', 'keyvalue', 'list', 'markdown', 'object', 'text'].includes(widget)) return 'schema-field--wide';
  if (['boolean', 'color', 'datetime', 'number'].includes(widget)) return 'schema-field--compact';
  return 'schema-field--half';
});
const keyValueEntries = computed(() => Object.entries(recordValue.value).map(([key, value]) => ({ key, value: String(value ?? '') })));
const updateKeyValues = (entries: Array<{ key: string; value: string }>): void => {
  update(Object.fromEntries(entries.filter(entry => entry.key.trim()).map(entry => [entry.key, entry.value])));
};

const defaultForField = (field: AdminField): unknown => {
  if (field.default !== undefined) {
    if (field.default === '{{now}}') return defaultNowForField(field);
    return structuredClone(field.default);
  }
  if (field.localized) return { zh: '', en: '', jp: '' };
  if (field.widget === 'boolean') return false;
  if (field.widget === 'list' || field.multiple) return [];
  if (field.widget === 'object') return Object.fromEntries((field.fields ?? []).map(item => [item.name, defaultForField(item)]));
  if (field.widget === 'number') return 0;
  return '';
};
const createListItem = (): unknown => (
  props.field.fields ? Object.fromEntries(props.field.fields.map(field => [field.name, defaultForField(field)])) : ''
);
const insertListItem = (index: number): void => {
  const next = [...arrayValue.value];
  next.splice(index, 0, createListItem());
  update(next);
};
const addListItem = (): void => insertListItem(arrayValue.value.length);
const updateListItem = (index: number, value: unknown): void => {
  const next = [...arrayValue.value];
  next[index] = value;
  update(next);
};
const removeListItem = (index: number): void => {
  if (arrayValue.value.length <= (props.field.min ?? 0)) return;
  update(arrayValue.value.filter((_, itemIndex) => itemIndex !== index));
};
const moveListItem = (index: number, direction: -1 | 1): void => {
  const target = index + direction;
  if (target < 0 || target >= arrayValue.value.length) return;
  const next = [...arrayValue.value];
  [next[index], next[target]] = [next[target], next[index]];
  update(next);
};
const duplicateListItem = (index: number): void => {
  const item = arrayValue.value[index];
  const duplicate = structuredClone(toRaw(item));
  if (typeof duplicate === 'object' && duplicate !== null && !Array.isArray(duplicate) && 'id' in duplicate) {
    const record = duplicate as Record<string, unknown>;
    const originalId = String(record.id ?? '').trim();
    if (originalId) {
      const existingIds = new Set(arrayValue.value.map(value => (
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? String((value as Record<string, unknown>).id ?? '')
          : ''
      )).filter(Boolean));
      let nextId = `${originalId}-copy`;
      let suffix = 2;
      while (existingIds.has(nextId)) nextId = `${originalId}-copy-${suffix++}`;
      record.id = nextId;
    }
  }
  const next = [...arrayValue.value];
  next.splice(index + 1, 0, duplicate);
  update(next);
};
const listContextOptions = computed<DropdownOption[]>(() => {
  const index = listContextIndex.value ?? -1;
  return [
    { label: t('schema.insertBefore'), key: 'insert-before' },
    { label: t('schema.insertAfter'), key: 'insert-after' },
    { label: t('schema.duplicateItem'), key: 'duplicate' },
    { type: 'divider', key: 'divider-1' },
    { label: t('schema.moveUp'), key: 'move-up', disabled: index <= 0 },
    { label: t('schema.moveDown'), key: 'move-down', disabled: index < 0 || index >= arrayValue.value.length - 1 },
    { type: 'divider', key: 'divider-2' },
    { label: t('ui.delete'), key: 'delete', disabled: arrayValue.value.length <= (props.field.min ?? 0) },
  ];
});
const openListContextMenu = (event: MouseEvent, index: number): void => {
  if (preservesNativeContextMenu(event.target)) {
    listContextShow.value = false;
    return;
  }
  event.preventDefault();
  listContextShow.value = false;
  listContextX.value = event.clientX;
  listContextY.value = event.clientY;
  listContextIndex.value = index;
  void nextTick(() => listContextShow.value = true);
};
const handleListContextSelect = (key: string): void => {
  const index = listContextIndex.value;
  listContextShow.value = false;
  if (index === null || index < 0 || index >= arrayValue.value.length) return;
  if (key === 'insert-before') insertListItem(index);
  else if (key === 'insert-after') insertListItem(index + 1);
  else if (key === 'duplicate') duplicateListItem(index);
  else if (key === 'move-up') moveListItem(index, -1);
  else if (key === 'move-down') moveListItem(index, 1);
  else if (key === 'delete') removeListItem(index);
};
const localizedText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return '';
  const record = value as Record<string, unknown>;
  return String(record[props.locale] ?? record.zh ?? record.en ?? record.jp ?? '');
};
const itemSummary = (item: unknown, index: number): string => {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return String(item ? item : `${t('schema.item')} ${index + 1}`);
  }
  const record = item as Record<string, unknown>;
  return localizedText(record.name) || localizedText(record.title) || localizedText(record.alt)
    || localizedText(record)
    || String(record.id ?? record.url ?? `${dt(props.field.label_singular) || t('schema.item')} ${index + 1}`);
};
const itemKey = (item: unknown, index: number): string => {
  if (typeof item !== 'object' || item === null) return `primitive-${index}-${String(item)}`;
  const current = objectKeys.get(item);
  if (current) return current;
  const created = `${props.field.name}-${objectKeyCounter += 1}`;
  objectKeys.set(item, created);
  return created;
};

const thumbnailField = computed(() => {
  if (!props.field.fields || !props.field.thumbnail) return null;
  const configured = props.field.fields.find(field => field.name === props.field.thumbnail);
  return configured?.widget === 'image' ? configured : null;
});
const itemThumbnail = (item: unknown): string => {
  if (!thumbnailField.value || typeof item !== 'object' || item === null || Array.isArray(item)) return '';
  return localizedText((item as Record<string, unknown>)[thumbnailField.value.name]);
};
const uniqueImportedId = (stem: string, existing: Set<string>): string => {
  const candidateStem = stem.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const normalized = candidateStem.length > 0 ? candidateStem : 'image';
  let candidate = normalized;
  let suffix = 2;
  while (existing.has(candidate)) candidate = `${normalized}-${suffix++}`;
  existing.add(candidate);
  return candidate;
};
const importListImages = async (files: File[]): Promise<void> => {
  const sourceField = thumbnailField.value;
  if (!manager || !sourceField || files.length === 0) return;
  const images = files.filter(file => file.type.startsWith('image/'));
  if (images.length === 0) {
    message.warning(t('schema.imageOnly'));
    return;
  }
  importingListImages.value = true;
  try {
    const paths = await manager.upload(images, normalizeAssetDirectory(sourceField.media_folder));
    const existingIds = new Set(arrayValue.value.map(item => (
      typeof item === 'object' && item !== null ? String((item as Record<string, unknown>).id ?? '') : ''
    )).filter(Boolean));
    const additions = paths.map((path, index) => {
      const file = images[index];
      const stem = file.name.replace(/\.[^.]+$/, '');
      const item = Object.fromEntries((props.field.fields ?? []).map(field => [field.name, defaultForField(field)]));
      item[sourceField.name] = path;
      if ('id' in item) item.id = uniqueImportedId(stem, existingIds);
      for (const key of ['name', 'alt', 'listName']) {
        const value = item[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          item[key] = { ...value, [props.locale]: stem };
          break;
        }
      }
      return item;
    });
    update([...arrayValue.value, ...additions]);
    message.success(t('schema.importDone', { count: additions.length }));
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('schema.importFailed'));
  } finally {
    importingListImages.value = false;
    if (listFileInput.value) listFileInput.value.value = '';
  }
};
const handleListFileInput = (event: Event): void => {
  void importListImages([...((event.target as HTMLInputElement).files ?? [])]);
};
const handleListDrop = (event: DragEvent): void => {
  void importListImages([...event.dataTransfer?.files ?? []]);
};

const initializeSortable = (): void => {
  if (props.field.widget !== 'list' || !listRoot.value || sortable) return;
  sortable = Sortable.create(listRoot.value, {
    animation: 170,
    draggable: props.field.fields ? '.structured-list-item' : '.simple-list-item',
    handle: '.drag-handle',
    filter: 'input, textarea, select, a, .n-base-selection',
    forceFallback: true,
    preventOnFilter: false,
    fallbackTolerance: 5,
    touchStartThreshold: 5,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: event => {
      if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex) return;
      const next = [...arrayValue.value];
      const [moved] = next.splice(event.oldIndex, 1);
      next.splice(event.newIndex, 0, moved);
      update(next);
    },
  });
};
onMounted(() => void nextTick(initializeSortable));
onUpdated(initializeSortable);
onBeforeUnmount(() => sortable?.destroy());
</script>

<template>
  <div class="schema-field" :class="layoutClass">
    <SchemaField v-if="field.localized" :model-value="localizedValue" :field="activeLocalizedField" :locale="locale" :relations="relations" @update:model-value="updateLocalized" @change="emit('change')" />

    <NFormItem v-else-if="field.widget === 'boolean'" :show-label="false" class="switch-field">
      <div class="switch-field-copy"><strong>{{ dt(field.label) }}</strong><span v-if="field.hint">{{ dt(field.hint) }}</span></div>
      <NSwitch :value="Boolean(modelValue)" @update:value="update" />
    </NFormItem>

    <NCard v-else-if="field.widget === 'object'" size="small" class="field-group" bordered>
      <template #header><div class="field-group-title"><span>{{ dt(field.label) }}</span><NTag v-if="!field.required" size="small" :bordered="false">{{ t('ui.optional') }}</NTag></div></template>
      <p v-if="field.hint" class="field-hint">{{ dt(field.hint) }}</p>
      <SchemaForm :model-value="recordValue" :fields="field.fields ?? []" :locale="locale" :relations="relations" @update:model-value="update" @change="emit('change')" />
    </NCard>

    <section v-else-if="field.widget === 'list'" class="list-field">
      <header class="list-field-header">
        <div><strong>{{ dt(field.label) }}</strong><span>{{ t('schema.items', { count: arrayValue.length }) }}</span></div>
        <div class="list-header-actions">
          <input v-if="thumbnailField" ref="listFileInput" class="visually-hidden-file" type="file" accept="image/*" multiple @change="handleListFileInput">
          <NButton v-if="thumbnailField" size="small" secondary :loading="importingListImages" @click="listFileInput?.click()"><template #icon><AdminIcon name="ImagePlus" :size="15" /></template>{{ t('schema.importImages') }}</NButton>
          <NButton size="small" secondary type="primary" @click="addListItem"><template #icon><AdminIcon name="Plus" :size="15" /></template>{{ t('schema.add', { item: dt(field.label_singular) || t('schema.item') }) }}</NButton>
        </div>
      </header>
      <p v-if="field.hint" class="field-hint">{{ dt(field.hint) }}</p>

      <div v-if="!field.fields" ref="listRoot" class="simple-list">
        <div v-for="(item, index) in arrayValue" :key="itemKey(item, index)" class="simple-list-item" @contextmenu.stop="openListContextMenu($event, index)">
          <span role="button" tabindex="0" class="drag-handle" :title="t('schema.dragSort')" @keydown.alt.up.prevent="moveListItem(index, -1)" @keydown.alt.down.prevent="moveListItem(index, 1)"><AdminIcon name="GripVertical" :size="17" /></span>
          <span class="list-index">{{ index + 1 }}</span>
          <NInput :value="String(item ?? '')" @update:value="updateListItem(index, $event)" />
          <NButton quaternary circle type="error" :title="t('ui.delete')" :disabled="arrayValue.length <= (field.min ?? 0)" @click="removeListItem(index)"><AdminIcon name="Trash2" :size="16" /></NButton>
        </div>
      </div>

      <div v-else ref="listRoot" class="structured-list">
        <details v-for="(item, index) in arrayValue" :key="itemKey(item, index)" class="structured-list-item" :class="{ 'has-thumbnail': Boolean(itemThumbnail(item)) }" :open="field.collapsed === false" @contextmenu.stop="openListContextMenu($event, index)">
          <summary>
            <span role="button" tabindex="0" class="drag-handle" :title="t('schema.dragSort')" @click.stop @keydown.alt.up.prevent="moveListItem(index, -1)" @keydown.alt.down.prevent="moveListItem(index, 1)"><AdminIcon name="GripVertical" :size="17" /></span>
            <div v-if="itemThumbnail(item)" class="list-item-thumb"><img :src="resolveAssetUrl(itemThumbnail(item))" alt=""></div>
            <span class="list-index">{{ index + 1 }}</span>
            <strong>{{ itemSummary(item, index) }}</strong>
            <span class="list-item-expand"><AdminIcon name="ChevronDown" :size="17" /></span>
            <NPopconfirm @positive-click="removeListItem(index)">
              <template #trigger><NButton quaternary circle size="small" type="error" :title="t('ui.delete')" :disabled="arrayValue.length <= (field.min ?? 0)" @click.stop><AdminIcon name="Trash2" :size="15" /></NButton></template>
              {{ t('schema.confirmDelete', { item: dt(field.label_singular) || t('schema.item') }) }}
            </NPopconfirm>
          </summary>
          <div class="structured-list-content">
            <SchemaForm :model-value="item" :fields="field.fields" :locale="locale" :relations="relations" @update:model-value="updateListItem(index, $event)" @change="emit('change')" />
          </div>
        </details>
      </div>

      <button v-if="thumbnailField" type="button" class="list-image-drop" :disabled="importingListImages" @click="listFileInput?.click()" @dragover.prevent @drop.prevent="handleListDrop">
        <AdminIcon name="UploadCloud" :size="22" />
        <span><strong>{{ t('schema.imageDropTitle') }}</strong></span>
      </button>
    </section>

    <NFormItem v-else-if="field.widget === 'keyvalue'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NDynamicInput :value="keyValueEntries" preset="pair" :key-placeholder="dt(field.key_label) || t('schema.key')" :value-placeholder="dt(field.value_label) || t('schema.value')" @update:value="value => updateKeyValues(value as Array<{ key: string; value: string }>)" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'relation'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NSelect :value="modelValue as string | string[] | null" :options="relationOptions" :multiple="field.multiple" filterable clearable @update:value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'select'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NSelect :value="modelValue as string | number | null" :options="selectOptions" @update:value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'number'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NInputNumber :value="typeof modelValue === 'number' ? modelValue : null" :min="field.min" :max="field.max" :step="field.step" @update:value="update"><template v-if="field.after_input" #suffix>{{ dt(field.after_input) }}</template></NInputNumber>
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'color'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NColorPicker :value="String(modelValue ?? '')" :show-alpha="false" :modes="['hex']" @update:value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'image' || field.widget === 'file'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <MediaField :model-value="modelValue" :field="field" @update:model-value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'markdown'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <MarkdownEditor :model-value="String(modelValue ?? '')" :directory="field.media_folder ?? 'public/assets/articles'" @update:model-value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else-if="field.widget === 'datetime'" :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NDatePicker :value="datePickerValue" :type="datePickerType" clearable @update:value="updateDateValue" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>
    <NFormItem v-else :label="dt(field.label)" :show-feedback="Boolean(field.hint)">
      <NInput :value="String(modelValue ?? '')" :type="field.widget === 'text' ? 'textarea' : 'text'" :rows="field.widget === 'text' ? 5 : undefined" :placeholder="field.required === false ? t('ui.optional') : undefined" @update:value="update" />
      <template v-if="field.hint" #feedback>{{ dt(field.hint) }}</template>
    </NFormItem>

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="listContextShow"
      :x="listContextX"
      :y="listContextY"
      :options="listContextOptions"
      @select="handleListContextSelect"
      @clickoutside="listContextShow = false"
    />
  </div>
</template>
