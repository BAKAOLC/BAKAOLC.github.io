<template>
  <button
    class="filter-option-button"
    :class="{
      'active': active,
      'restricted': variant === 'restricted',
    }"
    :style="optionStyle"
    type="button"
    @click="$emit('click')"
  >
    <span v-if="variant === 'restricted'" class="restricted-indicator" aria-hidden="true">
      <i :class="getIconClass('check')" class="indicator-icon"></i>
    </span>
    <span class="filter-option-left">
      <i v-if="icon" :class="getIconClass(icon)" class="filter-option-icon" aria-hidden="true"></i>
      <span class="filter-option-label">{{ label }}</span>
    </span>
    <span
      v-if="count !== undefined"
      class="filter-option-count"
      :class="{ 'invisible': !countVisible }"
      aria-hidden="true"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { FontAwesomeIcon } from '@/types';
import { getIconClass } from '@/utils/icons';

interface Props {
  label: string;
  active?: boolean;
  count?: number | string;
  countVisible?: boolean;
  icon?: string | FontAwesomeIcon;
  color?: string;
  hoverColor?: string;
  variant?: 'default' | 'restricted';
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  count: undefined,
  countVisible: true,
  icon: undefined,
  color: '#0ea5e9',
  hoverColor: undefined,
  variant: 'default',
});

defineEmits<{
  (e: 'click'): void;
}>();

const optionStyle = computed(() => ({
  '--filter-color': props.color,
  '--filter-hover-color': props.hoverColor ?? `color-mix(in srgb, ${props.color} 14%, transparent)`,
}));
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.filter-option-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6875rem;
  border-radius: var(--radius-control);
  background: var(--surface-card-solid);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s var(--ease-out-expo),
    box-shadow 0.16s ease;
}

.filter-option-button:hover {
  background: color-mix(in srgb, var(--filter-color, #0ea5e9) 10%, var(--surface-card-solid));
  border-color: color-mix(in srgb, var(--filter-color, #0ea5e9) 45%, var(--border-subtle));
  color: var(--text-primary);
}

.filter-option-button:active {
  transform: scale(0.985);
}

.filter-option-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.filter-option-button.active {
  background: var(--filter-color, #0ea5e9);
  border-color: var(--filter-color, #0ea5e9);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--filter-color, #0ea5e9) 65%, transparent);
}

.filter-option-button.restricted {
  background: var(--danger-soft);
  border-color: var(--danger-border);
  color: var(--danger-text);
  gap: 0.625rem;
}

.filter-option-button.restricted:hover {
  background: color-mix(in srgb, var(--filter-color, #dc2626) 16%, transparent);
  border-color: color-mix(in srgb, var(--filter-color, #dc2626) 52%, transparent);
}

.filter-option-button.restricted.active {
  background: color-mix(in srgb, var(--filter-color, #dc2626) 18%, var(--surface-card-solid));
  border-color: var(--filter-color, #dc2626);
  color: var(--filter-color, #dc2626);
  box-shadow: none;
}

.restricted-indicator {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 9999px;
  border: 1.5px solid color-mix(in srgb, var(--filter-color, #dc2626) 55%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.filter-option-button.restricted.active .restricted-indicator {
  background: var(--filter-color, #dc2626);
  border-color: var(--filter-color, #dc2626);
}

.indicator-icon {
  font-size: 0.625rem;
  opacity: 0;
  color: #ffffff;
  transition: opacity 0.16s ease;
}

.filter-option-button.restricted.active .indicator-icon {
  opacity: 1;
}

.filter-option-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
}

.filter-option-icon {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  opacity: 0.85;
}

.filter-option-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-option-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.425rem;
  min-width: 1.375rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
}

.filter-option-button.active .filter-option-count {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.filter-option-button.restricted.active .filter-option-count {
  background: color-mix(in srgb, var(--filter-color, #dc2626) 20%, transparent);
  color: var(--filter-color, #dc2626);
}

.filter-option-count.invisible {
  opacity: 0;
  visibility: hidden;
}

@media (max-width: 767px) {
  .filter-option-button {
    width: auto;
    min-width: 0;
    max-width: 100%;
    padding: 0.45rem 0.75rem;
  }
}
</style>
