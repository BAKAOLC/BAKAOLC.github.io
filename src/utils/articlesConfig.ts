import { validateArticlesConfig } from '@/config/validation';
import type { Article } from '@/types';

export const parseArticlesConfig = (value: unknown): Article[] => validateArticlesConfig(value);
