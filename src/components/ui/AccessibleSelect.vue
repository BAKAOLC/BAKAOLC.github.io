<template>
  <SelectRoot
    :model-value="modelValue"
    @update:model-value="handleValueChange"
  >
    <SelectTrigger class="accessible-select-trigger" :aria-label="ariaLabel">
      <span v-if="icon" class="accessible-select-leading">
        <i :class="getIconClass(icon)" aria-hidden="true"></i>
      </span>
      <SelectValue :placeholder="placeholder" class="accessible-select-value" />
      <SelectIcon class="accessible-select-icon">
        <i :class="getIconClass('chevron-down')" aria-hidden="true"></i>
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="accessible-select-content"
        position="popper"
        :side-offset="6"
      >
        <SelectViewport class="accessible-select-viewport">
          <SelectItem
            v-for="option in options"
            :key="option.value"
            class="accessible-select-item"
            :value="option.value"
            :disabled="option.disabled"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="accessible-select-indicator">
              <i :class="getIconClass('check')" aria-hidden="true"></i>
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui';

import { getIconClass } from '@/utils/icons';

export interface AccessibleSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  options: AccessibleSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  placeholder: '',
  ariaLabel: undefined,
  icon: undefined,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const handleValueChange = (value: unknown): void => {
  if (typeof value === 'string') {
    emit('update:modelValue', value);
  }
};
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.accessible-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.25rem;
  min-width: 5.75rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card-solid);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.accessible-select-trigger:hover {
  background: var(--surface-muted);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.accessible-select-trigger:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.accessible-select-leading,
.accessible-select-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  opacity: 0.8;
}

.accessible-select-icon {
  font-size: 0.7rem;
}

.accessible-select-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.accessible-select-content {
  z-index: 3200;
  min-width: var(--reka-select-trigger-width);
  overflow: hidden;
  border-radius: 0.875rem;
  border: 1px solid var(--border-default);
  background: var(--surface-elevated);
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
  box-shadow: var(--shadow-lg);
}

.accessible-select-viewport {
  padding: 0.3rem;
}

.accessible-select-item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 2.125rem;
  padding: 0.45rem 2rem 0.45rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.accessible-select-item[data-highlighted] {
  background: var(--surface-muted);
  color: var(--text-primary);
}

.accessible-select-item[data-state="checked"] {
  background: var(--accent-soft);
  color: var(--accent-primary-hover);
  font-weight: 600;
}

.dark .accessible-select-item[data-state="checked"] {
  color: var(--accent-primary);
}

.accessible-select-item[data-disabled] {
  pointer-events: none;
  opacity: 0.45;
}

.accessible-select-indicator {
  position: absolute;
  right: 0.625rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  font-size: 0.7rem;
}

@media (max-width: 767px) {
  .accessible-select-trigger {
    height: 2.125rem;
    min-width: 4.5rem;
    padding: 0 0.6rem;
    gap: 0.35rem;
  }
}
</style>
