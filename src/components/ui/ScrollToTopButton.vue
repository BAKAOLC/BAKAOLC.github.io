<template>
  <Transition name="scroll-top-tab">
    <button
      v-if="visible"
      type="button"
      class="scroll-to-top-tab"
      :aria-label="ariaLabel"
      @click="$emit('click')"
    >
      <i class="fas fa-chevron-up scroll-top-icon" aria-hidden="true"></i>
      <span class="scroll-top-text">TOP</span>
    </button>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  ariaLabel?: string;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.scroll-to-top-tab {
  position: fixed;
  right: 0;
  top: 56%;
  width: 34px;
  height: 82px;
  border-radius: 10px 0 0 10px;
  background: var(--surface-glass-strong);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-right: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
  z-index: 45;
  box-shadow: var(--shadow-md);
  transform: translateY(-50%) translateX(3px);
  transition:
    transform 0.22s var(--ease-spring),
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.scroll-to-top-tab:hover {
  transform: translateY(-50%) translateX(0);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

.scroll-to-top-tab:active {
  transform: translateY(-50%) translateX(1px) scale(0.97);
}

.scroll-to-top-tab:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.scroll-top-icon {
  font-size: 0.78rem;
  line-height: 1;
}

.scroll-top-text {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1;
  writing-mode: vertical-rl;
  text-orientation: upright;
  text-transform: uppercase;
  opacity: 0.82;
}

.scroll-top-tab-enter-active {
  transition: opacity 0.22s ease, transform 0.24s var(--ease-spring);
}

.scroll-top-tab-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.scroll-top-tab-enter-from,
.scroll-top-tab-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(36px);
}
</style>
