<template>
  <div class="filter-section">
    <button
      class="filter-section-button"
      :class="{ 'is-expanded': expanded, 'is-danger': tone === 'danger' }"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="optionsId"
      :aria-label="buttonAriaLabel"
      @click="expanded = !expanded"
    >
      <span class="filter-section-title" :class="{ 'danger': tone === 'danger' }">
        <i v-if="icon" :class="getIconClass(icon)" class="title-icon" aria-hidden="true"></i>
        <span>{{ title }}</span>
      </span>
      <span class="expand-icon" :class="{ 'rotated': expanded }" aria-hidden="true">
        <i :class="getIconClass('chevron-down')"></i>
      </span>
    </button>

    <div class="filter-collapse" :class="{ 'is-open': expanded }">
      <div class="filter-collapse-inner">
        <div
          :id="optionsId"
          class="filter-options"
          :role="optionsRole"
          :aria-label="optionsAriaLabel"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIconClass } from '@/utils/icons';

interface Props {
  title: string;
  icon?: string;
  tone?: 'default' | 'danger';
  buttonAriaLabel?: string;
  optionsId?: string;
  optionsRole?: string;
  optionsAriaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  icon: undefined,
  tone: 'default',
  buttonAriaLabel: undefined,
  optionsId: undefined,
  optionsRole: undefined,
  optionsAriaLabel: undefined,
});

const expanded = defineModel<boolean>('expanded', { required: true });
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.filter-section {
  display: flex;
  flex-direction: column;
}

.filter-section-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  color: var(--text-primary);
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.filter-section-button:hover {
  background: var(--surface-muted-hover);
  border-color: var(--border-default);
}

.filter-section-button.is-danger {
  background: var(--danger-soft);
  border-color: var(--danger-border);
}

.filter-section-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.filter-section-title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  min-width: 0;
}

.filter-section-title.danger {
  color: var(--danger-text);
}

.title-icon {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.expand-icon {
  width: 1.375rem;
  height: 1.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  color: var(--text-muted);
  font-size: 0.7rem;
  flex-shrink: 0;
  transition: transform 0.24s var(--ease-out-expo), color 0.16s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* Smooth Grid Accordion (no max-height lag!) */
.filter-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.24s var(--ease-out-expo),
    opacity 0.2s ease;
}

.filter-collapse.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.filter-collapse-inner {
  overflow: hidden;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 0.5rem;
}

@media (max-width: 767px) {
  .filter-options {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
}
</style>
