<script setup lang="ts">
import { NForm } from 'naive-ui';
import { computed } from 'vue';

import type { AdminField } from '../types';

import SchemaField from './SchemaField.vue';

type RelationOption = { label: string; value: string };

const props = defineProps<{
  modelValue: unknown;
  fields: AdminField[];
  locale: 'zh' | 'en' | 'jp';
  relations: Record<string, RelationOption[]>;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: unknown]; change: [] }>();

const recordValue = computed<Record<string, unknown>>(() => (
  typeof props.modelValue === 'object' && props.modelValue !== null && !Array.isArray(props.modelValue)
    ? props.modelValue as Record<string, unknown>
    : {}
));

const visibleFields = computed(() => props.fields.filter(field => !field.locale || field.locale === props.locale));

const fieldValue = (field: AdminField): unknown => field.root ? props.modelValue : recordValue.value[field.name];

const updateField = (field: AdminField, value: unknown): void => {
  emit('update:modelValue', field.root ? value : { ...recordValue.value, [field.name]: value });
  emit('change');
};
</script>

<template>
  <NForm label-placement="top" :show-require-mark="false" class="schema-form">
    <SchemaField
      v-for="field in visibleFields"
      :key="field.name"
      :model-value="fieldValue(field)"
      :field="field"
      :locale="locale"
      :relations="relations"
      @update:model-value="updateField(field, $event)"
      @change="emit('change')"
    />
  </NForm>
</template>
