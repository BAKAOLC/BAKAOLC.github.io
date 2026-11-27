<template>
  <section
    class="personal-section"
    :class="{ 'has-wallpaper': hasBackgroundImage }"
    :style="backgroundStyle"
    :aria-label="$t('personal.mainPage')"
  >
    <div v-if="hasBackgroundImage" class="wallpaper-scrim" aria-hidden="true"></div>

    <div class="personal-stage">
      <article
        class="content-card"
        :class="{ 'glass-effect': hasBackgroundImage }"
        aria-labelledby="personal-name"
        aria-describedby="personal-description"
      >
        <header class="profile-header">
          <div class="avatar-container">
            <ProgressiveImage
              :src="personal.avatar"
              :alt="$t('personal.avatarAlt', { name: getI18nText(personal.name, currentLanguage) })"
              class="avatar"
              image-class="avatar-img"
              object-fit="cover"
              :show-loader="false"
              role="img"
              :aria-label="$t('personal.personalAvatar')"
            />
          </div>

          <h1
            id="personal-name"
            class="name"
            tabindex="-1"
          >
            {{ getI18nText(personal.name, currentLanguage) }}
          </h1>

          <div
            id="personal-description"
            class="description"
            role="region"
            :aria-label="$t('personal.personalDescription')"
          >
            <p
              v-for="(line, index) in personal.description"
              :key="index"
              class="description-line"
              :class="{ 'is-spacer': !getI18nText(line, currentLanguage).trim() }"
            >
              {{ getI18nText(line, currentLanguage) }}
            </p>
          </div>
        </header>

        <nav
          v-if="visibleSocialLinks.length > 0"
          class="social-links"
          :aria-label="$t('personal.socialMediaLinks')"
        >
          <a
            v-for="(link, index) in visibleSocialLinks"
            :key="link.url ?? index"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
            :style="{
              '--link-color': link.color ?? '#0ea5e9',
              'animation-delay': `${Math.min(index * effectiveDelayInterval, 0.35)}s`,
            }"
            :aria-label="$t('personal.visitLink', { name: getI18nText(link.name, currentLanguage) })"
            :title="$t('personal.openInNewWindow', { name: getI18nText(link.name, currentLanguage) })"
          >
            <span class="social-icon-badge" aria-hidden="true">
              <i :class="getIconClass(link.icon ?? 'link')" class="icon"></i>
            </span>
            <span class="link-name">{{ getI18nText(link.name, currentLanguage) }}</span>
          </a>
        </nav>

        <nav
          v-if="enabledActionButtons.length > 0"
          class="action-buttons"
          :aria-label="$t('personal.pageNavigation')"
        >
          <component
            v-for="(button, index) in enabledActionButtons"
            :key="button.id"
            :is="button.type === 'internal' ? 'router-link' : 'a'"
            :to="button.type === 'internal' ? button.target : undefined"
            :href="button.type === 'external' ? button.target : undefined"
            :target="button.type === 'external' ? '_blank' : undefined"
            :rel="button.type === 'external' ? 'noopener noreferrer' : undefined"
            class="action-button"
            :style="computeActionButtonStyle(button, index)"
            :aria-label="getI18nText(button.text, currentLanguage)"
            :title="button.type === 'external'
              ? $t('personal.openInNewWindow', { name: getI18nText(button.text, currentLanguage) })
              : getI18nText(button.text, currentLanguage)"
          >
            <i
              v-if="button.icon"
              :class="getIconClass(button.icon)"
              class="button-icon"
              aria-hidden="true"
            ></i>
            <span class="button-text">{{ getI18nText(button.text, currentLanguage) }}</span>
          </component>
        </nav>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ProgressiveImage from './ProgressiveImage.vue';

import { siteConfig } from '@/config/site';
import { useLanguageStore } from '@/stores/language';
import type { ActionButton } from '@/types';
import { getI18nText } from '@/utils/i18nText';
import { getIconClass } from '@/utils/icons';

const languageStore = useLanguageStore();
const { t: $t } = useI18n();

const { personal } = siteConfig;
const currentLanguage = computed(() => languageStore.currentLanguage);

const animationDelayInterval = computed(() => personal.animationDelayInterval ?? 0.06);
const effectiveDelayInterval = computed(() => Math.min(animationDelayInterval.value, 0.055));

const actionButtonsWaitForLinks = computed(() => personal.actionButtonsWaitForLinks ?? true);
const actionButtonsAnimationDelayInterval = computed(() => (
  personal.actionButtonsAnimationDelayInterval !== undefined
    ? Math.min(personal.actionButtonsAnimationDelayInterval, 0.06)
    : effectiveDelayInterval.value
));
const actionButtonsInitialDelay = computed(() => Math.min(personal.actionButtonsInitialDelay ?? 0.08, 0.12));

const visibleSocialLinks = computed(() => {
  return (personal.links ?? []).filter(link => Boolean(link.url && link.name));
});

const enabledActionButtons = computed(() => {
  if (!personal.actionButtons) return [];
  return personal.actionButtons.filter(button => button.enabled !== false);
});

const currentBackgroundImage = ref<string | null>(null);
const hasBackgroundImage = computed(() => Boolean(currentBackgroundImage.value));

const backgroundStyle = computed(() => {
  if (!currentBackgroundImage.value) {
    return {};
  }

  return {
    backgroundImage: `url(${currentBackgroundImage.value})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
});

const selectRandomBackground = (): void => {
  if (personal.backgroundImages && personal.backgroundImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * personal.backgroundImages.length);
    currentBackgroundImage.value = personal.backgroundImages[randomIndex];
  }
};

onMounted(() => {
  selectRandomBackground();
});

const computeActionButtonStyle = (button: ActionButton, index: number): Record<string, string> => {
  const baseDelay = actionButtonsInitialDelay.value + (index + 1) * actionButtonsAnimationDelayInterval.value;
  const extraLinksDelay = actionButtonsWaitForLinks.value
    ? Math.min(visibleSocialLinks.value.length * effectiveDelayInterval.value, 0.28)
    : 0;
  const delay = Math.min(baseDelay + extraLinksDelay, 0.45);

  return {
    '--button-color': button.color ?? '#0ea5e9',
    'animation-delay': `${delay}s`,
  };
};
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.personal-section {
  position: relative;
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.wallpaper-scrim {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: rgba(0, 0, 0, 0.22);
}

.dark .wallpaper-scrim {
  background: rgba(0, 0, 0, 0.36);
}

.personal-stage {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1.25rem, 3.5vh, 2.75rem) 1rem;
  box-sizing: border-box;
}

.content-card {
  width: min(640px, 100%);
  margin: auto;
  padding: clamp(1.75rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.25rem);
  border-radius: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  animation: cardReveal 0.42s var(--ease-out-expo) both;
}

/* 保留高通透度磨砂玻璃，让背景插画清晰透出 */
.content-card.glass-effect {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.38);
  box-shadow:
    0 12px 36px rgba(15, 23, 42, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.dark .content-card.glass-effect {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.profile-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.125rem;
}

.avatar {
  width: clamp(5.5rem, 12vw, 7.5rem);
  height: clamp(5.5rem, 12vw, 7.5rem);
  border-radius: 9999px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s var(--ease-out-expo);
}

.dark .avatar {
  border-color: rgba(30, 41, 59, 0.9);
}

.avatar:hover {
  transform: scale(1.05);
}

.name {
  margin: 0 0 0.75rem;
  font-size: clamp(1.85rem, 4.5vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--text-primary);
}

.glass-effect .name {
  color: #0f172a;
}

.dark .glass-effect .name {
  color: #f8fafc;
}

.description {
  max-width: 28rem;
  margin: 0 auto;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.65;
}

.glass-effect .description {
  color: #0f172a;
  font-weight: 500;
}

.dark .glass-effect .description {
  color: #f1f5f9;
}

.description-line {
  margin: 0.15rem 0;
}

.description-line.is-spacer {
  height: 0.6rem;
  margin: 0;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 7.25rem;
  padding: 0.475rem 0.85rem 0.475rem 0.525rem;
  border-radius: var(--radius-control);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--surface-card-solid);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  animation: itemReveal 0.36s var(--ease-out-expo) both;
  transition:
    transform 0.2s var(--ease-out-expo),
    box-shadow 0.2s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.glass-effect .social-link {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(255, 255, 255, 0.5);
}

.dark .glass-effect .social-link {
  background: rgba(15, 23, 42, 0.68);
  border-color: rgba(255, 255, 255, 0.14);
}

.social-icon-badge {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--link-color);
  color: #ffffff;
  font-size: 0.8125rem;
  transition: transform 0.2s var(--ease-out-expo);
}

.social-link:hover {
  transform: translateY(-2px);
  border-color: var(--link-color);
  background: var(--surface-card-solid);
  box-shadow: var(--shadow-md);
}

.social-link:hover .social-icon-badge {
  transform: scale(1.06);
}

.social-link:active {
  transform: translateY(0) scale(0.98);
}

.social-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.link-name {
  flex: 1;
  text-align: center;
  padding-right: 0.2rem;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-control);
  color: #ffffff;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  background-color: var(--button-color, #0284c7);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: var(--shadow-sm);
  animation: itemReveal 0.38s var(--ease-out-expo) both;
  transition:
    transform 0.2s var(--ease-out-expo),
    box-shadow 0.2s ease,
    background-color 0.18s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  background-color: color-mix(in srgb, var(--button-color, #0284c7) 88%, #000000 12%);
  box-shadow: var(--shadow-md);
  text-decoration: none;
}

.action-button:active {
  transform: translateY(0) scale(0.98);
}

.action-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

.button-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes itemReveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 560px) {
  .personal-stage {
    padding: 1rem 0.75rem;
  }

  .content-card {
    border-radius: 0.75rem;
    padding: 1.5rem 1.125rem;
  }

  .profile-header {
    margin-bottom: 1.25rem;
  }

  .social-links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .social-link {
    min-width: 0;
    width: 100%;
    padding: 0.45rem 0.625rem 0.45rem 0.45rem;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.5rem;
  }

  .action-button {
    width: 100%;
    padding: 0.625rem 1rem;
  }
}

@media (max-height: 680px) {
  .personal-stage {
    padding: 0.875rem 1rem;
  }

  .content-card {
    padding: 1.35rem 1.75rem;
  }

  .profile-header {
    margin-bottom: 1.125rem;
  }

  .avatar-container {
    margin-bottom: 0.75rem;
  }

  .avatar {
    width: 5rem;
    height: 5rem;
  }
}
</style>
