import {
  validateArticleEntry,
  validateCharacterProfileEntry,
  validateImageEntry,
} from '../config/validation';

import type { AdminCodec } from './types';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const asRecord = (value: unknown): JsonRecord => isRecord(value) ? value : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const mapObject = (value: unknown, mapper: (record: JsonRecord) => JsonRecord): unknown => (
  isRecord(value) ? mapper(value) : value
);

const normalizeI18n = (value: unknown): JsonRecord => {
  if (typeof value === 'string') {
    return { zh: value, en: value, jp: value };
  }

  return isRecord(value) ? value : { zh: '', en: '', jp: '' };
};

const normalizeI18nKeys = (record: JsonRecord, keys: string[]): JsonRecord => {
  const normalized = { ...record };
  keys.forEach(key => {
    if (key in normalized && normalized[key] !== undefined && normalized[key] !== null) {
      normalized[key] = normalizeI18n(normalized[key]);
    }
  });
  return normalized;
};

const normalizeImageBase = (value: unknown): unknown => mapObject(value, record => {
  const normalized = normalizeI18nKeys(record, ['name', 'listName', 'description']);
  if ('artist' in normalized && normalized.artist !== undefined && normalized.artist !== null) {
    normalized.artist = (Array.isArray(normalized.artist) ? normalized.artist : [normalized.artist])
      .map(normalizeI18n);
  }
  if (Array.isArray(normalized.authorLinks)) {
    normalized.authorLinks = normalized.authorLinks.map(link => mapObject(link, item => (
      normalizeI18nKeys(item, ['name'])
    )));
  }
  return normalized;
});

const normalizeImage = (value: unknown): unknown => mapObject(normalizeImageBase(value), record => ({
  ...record,
  ...(Array.isArray(record.childImages)
    ? { childImages: record.childImages.map(normalizeImageBase) }
    : {}),
}));

const normalizeInfoCard = (value: unknown): unknown => mapObject(value, record => (
  normalizeI18nKeys(record, ['title', 'content'])
));

const normalizeCharacterProfile = (value: unknown): unknown => mapObject(value, record => {
  const normalized = normalizeI18nKeys(record, ['name']);
  normalized.infoCardTemplates = asArray(normalized.infoCardTemplates).map(normalizeInfoCard);
  normalized.infoCards = asArray(normalized.infoCards).map(normalizeInfoCard);
  if (Array.isArray(normalized.variants)) {
    normalized.variants = normalized.variants.map(variant => mapObject(variant, variantRecord => {
      const normalizedVariant = normalizeI18nKeys(variantRecord, ['name']);
      normalizedVariant.infoCards = asArray(normalizedVariant.infoCards).map(normalizeInfoCard);
      normalizedVariant.images = asArray(normalizedVariant.images).map(image => mapObject(image, imageRecord => {
        const normalizedProfileImage = normalizeI18nKeys(imageRecord, ['alt']);
        normalizedProfileImage.infoCards = asArray(normalizedProfileImage.infoCards).map(normalizeInfoCard);
        return normalizedProfileImage;
      }));
      return normalizedVariant;
    }));
  }
  return normalized;
});

const normalizeTrack = (value: unknown): unknown => mapObject(value, record => {
  const normalized = normalizeI18nKeys(record, ['name', 'url', 'artist', 'album']);
  if (isRecord(normalized.dualFile)) {
    normalized.dualFile = normalizeI18nKeys(normalized.dualFile, ['intro', 'loop']);
  }
  normalized.artwork = asArray(normalized.artwork).map(artwork => mapObject(artwork, item => (
    normalizeI18nKeys(item, ['src'])
  )));
  return normalized;
});

const recordToEntries = (value: unknown, normalizer: (item: unknown) => unknown = item => item): JsonRecord => ({
  entries: Object.entries(asRecord(value)).map(([id, item]) => ({ id, ...asRecord(normalizer(item)) })),
});

const entriesToRecord = (value: unknown): JsonRecord => Object.fromEntries(
  asArray(asRecord(value).entries)
    .map(item => {
      const record = asRecord(item);
      const { id, ...data } = record;
      return [String(id ?? ''), data] as const;
    })
    .filter(([id]) => id.length > 0),
);

export const decodeConfig = (codec: AdminCodec, value: unknown): unknown => {
  switch (codec) {
    case 'article':
      return mapObject(value, record => normalizeI18nKeys(record, ['title', 'cover', 'content', 'markdownPath', 'summary']));
    case 'articleCategories':
      return recordToEntries(value, item => mapObject(item, record => normalizeI18nKeys(record, ['name'])));
    case 'articlesPage':
      return mapObject(value, record => ({
        ...record,
        infoCards: asArray(record.infoCards).map(card => mapObject(card, item => {
          const normalized = normalizeI18nKeys(item, ['title']);
          if (typeof normalized.image === 'string') {
            normalized.image = { light: normalized.image, dark: normalized.image };
          }
          return normalized;
        })),
      }));
    case 'app':
      return mapObject(value, record => normalizeI18nKeys(record, ['title', 'copyright']));
    case 'bgm':
      return mapObject(value, record => ({ ...record, tracks: asArray(record.tracks).map(normalizeTrack) }));
    case 'characterProfile':
      return normalizeCharacterProfile(value);
    case 'characters':
      return asArray(value).map(item => mapObject(item, record => normalizeI18nKeys(record, ['name', 'description'])));
    case 'image':
      return normalizeImage(value);
    case 'languages': {
      const data = asRecord(value);
      return {
        ...data,
        languages: Object.entries(asRecord(data.languages)).map(([id, language]) => ({ id, ...asRecord(language) })),
      };
    }
    case 'links': {
      const data = asRecord(value);
      return {
        ...data,
        tags: Object.entries(asRecord(data.tags)).map(([id, name]) => ({ id, name: normalizeI18n(name) })),
        categories: asArray(data.categories).map(category => mapObject(category, categoryRecord => {
          const normalized = normalizeI18nKeys(categoryRecord, ['name', 'description']);
          normalized.links = asArray(normalized.links).map(link => mapObject(link, item => (
            normalizeI18nKeys(item, ['name', 'description'])
          )));
          return normalized;
        })),
      };
    }
    case 'personal':
      return mapObject(value, record => {
        const normalized = normalizeI18nKeys(record, ['name']);
        normalized.description = asArray(normalized.description).map(normalizeI18n);
        normalized.links = asArray(normalized.links).map(link => mapObject(link, item => normalizeI18nKeys(item, ['name'])));
        normalized.actionButtons = asArray(normalized.actionButtons)
          .map(button => mapObject(button, item => normalizeI18nKeys(item, ['text'])));
        return normalized;
      });
    case 'sites':
      return recordToEntries(value);
    case 'tags':
      return asArray(value).map(item => mapObject(item, record => normalizeI18nKeys(record, ['name'])));
    default:
      return value;
  }
};

export const encodeConfig = (codec: AdminCodec, value: unknown): unknown => {
  switch (codec) {
    case 'article':
      return validateArticleEntry(value);
    case 'articleCategories':
    case 'sites':
      return entriesToRecord(value);
    case 'characterProfile':
      return validateCharacterProfileEntry(value);
    case 'image':
      return validateImageEntry(value);
    case 'languages': {
      const data = asRecord(value);
      const languages = Object.fromEntries(asArray(data.languages).map<[string, JsonRecord]>(item => {
        const record = asRecord(item);
        const { id, ...language } = record;
        return [String(id ?? ''), language];
      }).filter(([id]) => id.length > 0));
      return { ...data, languages };
    }
    case 'links': {
      const data = asRecord(value);
      const tags = Object.fromEntries(asArray(data.tags).map<[string, unknown]>(item => {
        const record = asRecord(item);
        return [String(record.id ?? ''), record.name];
      }).filter(([id]) => id.length > 0));
      return { ...data, tags };
    }
    default:
      return value;
  }
};
