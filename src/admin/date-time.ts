import type { AdminField } from './types';

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatLocalDate = (value: Date, includeTime = false): string => {
  const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  if (!includeTime) return date;
  const offset = -value.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offset);
  return `${date} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())} ${sign}${pad(Math.floor(absoluteOffset / 60))}${pad(absoluteOffset % 60)}`;
};

export const defaultNowForField = (field: AdminField): string => (
  formatLocalDate(new Date(), field.type === 'datetime')
);

export const parseConfigDate = (value: unknown): number | null => {
  const source = String(value ?? '').trim();
  if (!source) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(source)
    ? `${source}T00:00:00`
    : source
      .replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
      .replace(/\s+([+-]\d{2}:?\d{2}|Z)$/i, '$1')
      .replace(/([+-]\d{2})(\d{2})$/i, '$1:$2');
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
};
