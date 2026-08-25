export const resolveAssetUrl = (value: unknown): string => {
  const path = String(value ?? '').trim();
  if (!path) return '';
  if (/^(?:https?:)?\/\//i.test(path) || /^(?:blob|data):/i.test(path)) return path;
  const publicPath = path.startsWith('public/')
    ? path
    : /^\/(?:articles|assets|live2d)(?:\/|$)/.test(path)
      ? `public${path}`
      : path.startsWith('./assets/')
        ? `public/${path.slice(2)}`
        : path.startsWith('assets/')
          ? `public/${path}`
          : '';
  if (publicPath) return `/api/admin/asset?path=${encodeURIComponent(publicPath)}`;
  return path;
};
