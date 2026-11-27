<template>
  <div v-if="effectiveAuthorLinks && effectiveAuthorLinks.length > 0" class="author-links">
    <a
      v-for="(link, index) in effectiveAuthorLinks"
      :key="index"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="author-link-button"
      :title="getLinkTitle(link)"
    >
      <img
        v-if="getFaviconUrl(link)"
        :src="getFaviconUrl(link)"
        :alt="getLinkName(link)"
        class="link-favicon"
        @error="handleFaviconError"
      />
      <ExternalLinkIcon v-else class="link-icon" aria-hidden="true" />
      <span class="link-name">{{ getLinkName(link) }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ExternalLinkIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import siteNames from '@/config/sites.json5';
import { useLanguageStore } from '@/stores/language';
import type { AuthorLink, SitesConfig } from '@/types';
import { getI18nText } from '@/utils/i18nText';

const props = defineProps<{
  authorLinks?: AuthorLink[];
}>();

const { t: $t } = useI18n();
const languageStore = useLanguageStore();
const sitesConfig = siteNames as SitesConfig;

const currentLanguage = computed(() => languageStore.currentLanguage);

const isMatchingDomain = (hostname: string, configDomain: string): boolean => {
  if (hostname === configDomain) {
    return true;
  }

  if (hostname === `www.${configDomain}` || configDomain === `www.${hostname}`) {
    return true;
  }

  if (hostname.endsWith(`.${configDomain}`)) {
    return true;
  }

  const domainVariants: Record<string, string[]> = {
    'twitter.com': ['x.com', 't.co'],
    'x.com': ['twitter.com', 't.co'],
    'youtube.com': ['youtu.be', 'm.youtube.com'],
    'instagram.com': ['instagr.am'],
    'reddit.com': ['redd.it'],
    'github.com': ['github.io'],
    'tiktok.com': ['tiktok.com', 'vm.tiktok.com'],
  };

  for (const [mainDomain, variants] of Object.entries(domainVariants)) {
    if (configDomain === mainDomain && variants.some(variant => hostname === variant || hostname.endsWith(`.${variant}`))) {
      return true;
    }
    if (variants.includes(configDomain) && (
      hostname === mainDomain || hostname.endsWith(`.${mainDomain}`)
    )) {
      return true;
    }
  }

  return false;
};

const extractMainDomain = (hostname: string): string => {
  const withoutWww = hostname.replace(/^www\./, '');

  const keepFullDomain = [
    'github.io',
    'gitlab.io',
    'netlify.app',
    'vercel.app',
    'herokuapp.com',
    'blogspot.com',
    'wordpress.com',
    'co.uk',
    'co.jp',
    'com.au',
    'com.cn',
  ];

  for (const suffix of keepFullDomain) {
    if (withoutWww.endsWith(`.${suffix}`)) {
      return withoutWww;
    }
  }

  const parts = withoutWww.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return withoutWww;
};

const effectiveAuthorLinks = computed(() => {
  return props.authorLinks ?? [];
});

const getLinkName = (link: AuthorLink): string => {
  if (link.name) {
    return getI18nText(link.name, currentLanguage.value);
  }

  try {
    const url = new URL(link.url);
    const hostname = url.hostname.toLowerCase();

    for (const [configDomain, siteInfo] of Object.entries(sitesConfig)) {
      if (isMatchingDomain(hostname, configDomain)) {
        const validSiteInfo = Object.fromEntries(
          Object.entries(siteInfo).filter(([key, value]) => value !== undefined && key !== 'iconUrl'),
        ) as Record<string, string>;
        return getI18nText(validSiteInfo, currentLanguage.value);
      }
    }

    const mainDomain = extractMainDomain(hostname);
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  } catch {
    return link.url;
  }
};

const getFaviconUrl = (link: AuthorLink): string | undefined => {
  if (link.favicon) {
    return link.favicon;
  }

  try {
    const url = new URL(link.url);
    const hostname = url.hostname.toLowerCase();

    for (const [configDomain, siteInfo] of Object.entries(sitesConfig)) {
      if (isMatchingDomain(hostname, configDomain)) {
        if (siteInfo.iconUrl) {
          return siteInfo.iconUrl;
        }
        break;
      }
    }

    return `${url.protocol}//${url.hostname}/favicon.ico`;
  } catch {
    return undefined;
  }
};

const getLinkTitle = (link: AuthorLink): string => {
  const name = getLinkName(link);
  return $t('viewer.visitAuthorPage', { name });
};

const handleFaviconError = (event: Event): void => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.author-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.author-link-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.author-link-button:hover {
  background: var(--accent-soft);
  border-color: rgba(14, 165, 233, 0.35);
  color: var(--accent-primary-hover);
  text-decoration: none;
}

.dark .author-link-button:hover {
  color: var(--accent-primary);
}

.link-favicon,
.link-icon {
  width: 0.9rem;
  height: 0.9rem;
  object-fit: contain;
  flex-shrink: 0;
}

.link-name {
  line-height: 1.2;
}
</style>
