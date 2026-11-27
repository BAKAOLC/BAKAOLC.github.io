<template>
  <div class="not-found">
    <div class="not-found-card">
      <div class="code-badge">404</div>
      <p class="message">{{ t('app.notFound') }}</p>
      <router-link to="/" class="home-link">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        <span>{{ t('common.back') }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.not-found {
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}

.not-found-card {
  width: min(420px, 100%);
  padding: 2.5rem 2rem;
  text-align: center;
  border-radius: var(--radius-modal);
  background: var(--surface-glass-strong);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
}

.code-badge {
  font-size: clamp(4rem, 12vw, 5.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 0.875rem;
  color: var(--accent-primary);
}

.message {
  margin: 0 0 1.75rem;
  font-size: 1.0625rem;
  color: var(--text-secondary);
}

.home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.375rem;
  border-radius: var(--radius-control);
  background: var(--accent-primary);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s var(--ease-out-expo), background-color 0.18s ease;
}

.home-link:hover {
  transform: translateY(-2px);
  background: var(--accent-primary-hover);
}

.home-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}
</style>
