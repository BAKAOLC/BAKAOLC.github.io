import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { basename, dirname, extname, relative, resolve, sep } from 'node:path';

import JSON5 from 'json5';
import type { Plugin } from 'vite';

import { adminResources } from '../src/admin/schema';
import {
  validateArticleEntry,
  validateCharacterProfileEntry,
  validateImageEntry,
} from '../src/config/validation';

const MAX_BODY_SIZE = 100 * 1024 * 1024;
const GENERATED_DIRECTORIES = new Set(['thumbnails']);
const MANAGED_FILE_ROOTS = ['public/assets', 'public/articles', 'public/live2d'] as const;
const CONFIG_DIRECTORIES = adminResources
  .filter(resource => resource.kind === 'collection')
  .map(resource => resource.path);
const CONFIG_FILES = new Set(adminResources
  .filter(resource => resource.kind === 'file')
  .map(resource => resource.path));

type JsonRecord = Record<string, unknown>;

const sendJson = (response: ServerResponse, status: number, value: unknown): void => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  // eslint-disable-next-line no-restricted-properties -- HTTP responses require strict JSON.
  response.end(JSON.stringify(value));
};

const readBody = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_SIZE) {
      throw new Error('请求内容超过 100 MB 限制。');
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
};

const readJsonBody = async (request: IncomingMessage): Promise<JsonRecord> => {
  const value = JSON5.parse((await readBody(request)).toString('utf8'));
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('请求内容必须是对象。');
  }
  return value as JsonRecord;
};

const normalizeRelativePath = (value: string): string => value.replaceAll('\\', '/').replace(/^\/+/, '');

const resolveInside = (root: string, relativePath: string): string => {
  const normalized = normalizeRelativePath(relativePath);
  const absolutePath = resolve(root, normalized);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) {
    throw new Error('路径超出当前项目。');
  }
  return absolutePath;
};

const isAllowedConfigPath = (relativePath: string): boolean => {
  const normalized = normalizeRelativePath(relativePath);
  if (CONFIG_FILES.has(normalized)) {
    return true;
  }
  return CONFIG_DIRECTORIES.some(directory => (
    normalized.startsWith(`${directory}/`)
      && extname(normalized) === '.json5'
  ));
};

const collectionDirectoryForPath = (relativePath: string): string => {
  const normalized = normalizeRelativePath(relativePath);
  const directory = CONFIG_DIRECTORIES.find(item => normalized.startsWith(`${item}/`));
  if (!directory || extname(normalized) !== '.json5') {
    throw new Error('该文件不属于可管理的内容集合。');
  }
  return directory;
};

const listCollectionPaths = async (root: string, directory: string): Promise<string[]> => {
  const files: string[] = [];
  const walk = async (relativeDirectory: string): Promise<void> => {
    const entries = await readdir(resolveInside(root, relativeDirectory), { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
      if (entry.name.startsWith('.')) return;
      const path = `${relativeDirectory}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && extname(entry.name) === '.json5') files.push(path);
    }));
  };
  await walk(directory);
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'));
};

const normalizeEntryName = (value: string): string => {
  const name = value.trim().replace(/\.json5$/i, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    throw new Error('文件名只能包含字母、数字、点、下划线和连字符。');
  }
  return name;
};

const assertVersion = async (absolutePath: string, expectedModifiedAt: number): Promise<void> => {
  const metadata = await stat(absolutePath);
  if (!Number.isFinite(expectedModifiedAt) || Math.abs(metadata.mtimeMs - expectedModifiedAt) > 0.1) {
    const error = new Error('文件已被其他程序修改，请刷新后重试。');
    Object.assign(error, { statusCode: 409 });
    throw error;
  }
};

const assertAvailablePath = async (absolutePath: string): Promise<void> => {
  try {
    await stat(absolutePath);
    const error = new Error('目标文件已存在，请使用其他文件名。');
    Object.assign(error, { statusCode: 409 });
    throw error;
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') throw error;
  }
};

const assertWriteOrigin = (request: IncomingMessage): void => {
  const { origin } = request.headers;
  if (!origin) return;
  const parsed = new URL(origin);
  const isLoopback = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  if (parsed.protocol === 'http:' && isLoopback && parsed.host === request.headers.host) return;
  throw new Error('拒绝来自其他来源的写入请求。');
};

const getBranch = async (root: string): Promise<string> => {
  try {
    const head = (await readFile(resolve(root, '.git/HEAD'), 'utf8')).trim();
    return head.startsWith('ref: refs/heads/') ? head.slice('ref: refs/heads/'.length) : 'detached';
  } catch {
    return 'unknown';
  }
};

const readConfig = async (root: string, relativePath: string): Promise<{ data: unknown; modifiedAt: number }> => {
  if (!isAllowedConfigPath(relativePath)) {
    throw new Error('该配置文件不在管理白名单中。');
  }
  const absolutePath = resolveInside(root, relativePath);
  const [source, metadata] = await Promise.all([readFile(absolutePath, 'utf8'), stat(absolutePath)]);
  return { data: JSON5.parse(source), modifiedAt: metadata.mtimeMs };
};

const validateByPath = (relativePath: string, value: unknown): unknown => {
  const normalized = normalizeRelativePath(relativePath);
  if (normalized.startsWith('src/config/images/')) {
    return validateImageEntry(value);
  }
  if (normalized.startsWith('src/config/articles/')) {
    return validateArticleEntry(value);
  }
  if (normalized.startsWith('src/config/character-profiles/')) {
    return validateCharacterProfileEntry(value);
  }
  return value;
};

const assertUniqueCollectionId = async (root: string, relativePath: string, value: unknown): Promise<void> => {
  const normalized = normalizeRelativePath(relativePath);
  const directory = CONFIG_DIRECTORIES.find(item => normalized.startsWith(`${item}/`));
  if (!directory || typeof value !== 'object' || value === null || Array.isArray(value)) return;
  const id = String((value as JsonRecord).id ?? '').trim();
  if (!id) return;
  const candidates = await listCollectionPaths(root, directory);
  for (const candidatePath of candidates) {
    if (candidatePath === normalized) continue;
    const candidate = JSON5.parse(await readFile(resolveInside(root, candidatePath), 'utf8'));
    if (String(candidate.id ?? '').trim() === id) {
      const error = new Error(`配置 ID “${id}” 已由 ${candidatePath} 使用。`);
      Object.assign(error, { statusCode: 409 });
      throw error;
    }
  }
};

const writeConfig = async (
  root: string,
  relativePath: string,
  value: unknown,
  expectedModifiedAt: number | null,
): Promise<number> => {
  if (!isAllowedConfigPath(relativePath)) {
    throw new Error('该配置文件不在管理白名单中。');
  }
  const absolutePath = resolveInside(root, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });

  try {
    const metadata = await stat(absolutePath);
    if (expectedModifiedAt === null) {
      const error = new Error('目标文件已存在，请刷新列表或更换文件名。');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }
    if (expectedModifiedAt !== null && Math.abs(metadata.mtimeMs - expectedModifiedAt) > 0.1) {
      const error = new Error('文件已被其他程序修改，请重新载入后再保存。');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') {
      throw error;
    }
  }

  const validated = validateByPath(relativePath, value);
  await assertUniqueCollectionId(root, relativePath, validated);
  const serialized = `${JSON5.stringify(validated, null, 2)}\n`;
  const temporaryPath = `${absolutePath}.admin-tmp-${process.pid}`;
  await writeFile(temporaryPath, serialized, 'utf8');
  await rename(temporaryPath, absolutePath);
  return (await stat(absolutePath)).mtimeMs;
};

const configFileInfo = async (root: string, relativePath: string): Promise<unknown> => {
  const { data, modifiedAt } = await readConfig(root, relativePath);
  const record = typeof data === 'object' && data !== null && !Array.isArray(data) ? data as JsonRecord : {};
  return {
    path: relativePath,
    name: basename(relativePath, '.json5'),
    data,
    modifiedAt,
    id: typeof record.id === 'string' ? record.id : basename(relativePath, '.json5'),
  };
};

const renameConfigFile = async (
  root: string,
  sourcePath: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<unknown> => {
  collectionDirectoryForPath(sourcePath);
  const normalizedSource = normalizeRelativePath(sourcePath);
  const targetPath = `${dirname(normalizedSource).replaceAll('\\', '/')}/${normalizeEntryName(targetName)}.json5`;
  if (targetPath === normalizedSource) return configFileInfo(root, normalizedSource);
  const source = resolveInside(root, normalizedSource);
  const target = resolveInside(root, targetPath);
  await assertVersion(source, expectedModifiedAt);
  await assertAvailablePath(target);
  await rename(source, target);
  return configFileInfo(root, targetPath);
};

const duplicateConfigFile = async (
  root: string,
  sourcePath: string,
  targetName: string,
  targetId: string,
  expectedModifiedAt: number,
): Promise<unknown> => {
  collectionDirectoryForPath(sourcePath);
  const normalizedSource = normalizeRelativePath(sourcePath);
  const source = resolveInside(root, normalizedSource);
  await assertVersion(source, expectedModifiedAt);
  const { data } = await readConfig(root, normalizedSource);
  const record = typeof data === 'object' && data !== null && !Array.isArray(data) ? data as JsonRecord : {};
  const id = normalizeEntryName(targetId);
  const targetPath = `${dirname(normalizedSource).replaceAll('\\', '/')}/${normalizeEntryName(targetName)}.json5`;
  await writeConfig(root, targetPath, { ...record, id }, null);
  return configFileInfo(root, targetPath);
};

const deleteConfigFile = async (root: string, path: string, expectedModifiedAt: number): Promise<void> => {
  collectionDirectoryForPath(path);
  const absolutePath = resolveInside(root, path);
  await assertVersion(absolutePath, expectedModifiedAt);
  await unlink(absolutePath);
};

const listConfigFiles = async (root: string, directory: string): Promise<unknown[]> => {
  if (!CONFIG_DIRECTORIES.includes(directory)) {
    throw new Error('该配置目录不在管理白名单中。');
  }
  const files = await listCollectionPaths(root, directory);
  const result = await Promise.all(files.map(path => configFileInfo(root, path)));
  return result.sort((left, right) => (
    String((left as JsonRecord).name).localeCompare(String((right as JsonRecord).name), 'zh-CN')
  ));
};

const assetType = (extension: string): 'audio' | 'document' | 'image' | 'other' | 'video' => {
  if (['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)) return 'image';
  if (['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav'].includes(extension)) return 'audio';
  if (['.mkv', '.mov', '.mp4', '.webm'].includes(extension)) return 'video';
  if (['.json', '.md', '.pdf', '.txt'].includes(extension)) return 'document';
  return 'other';
};

const listAssets = async (root: string): Promise<unknown[]> => {
  const items: unknown[] = [];

  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
      if (entry.name.startsWith('.') || (entry.isDirectory() && GENERATED_DIRECTORIES.has(entry.name))) return;
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        return;
      }
      if (!entry.isFile()) return;
      const metadata = await stat(absolutePath);
      const relativePath = relative(root, absolutePath).replaceAll('\\', '/');
      const publicPath = relative(resolve(root, 'public'), absolutePath).replaceAll('\\', '/');
      items.push({
        path: relativePath,
        publicUrl: `/${publicPath}`,
        name: entry.name,
        directory: dirname(publicPath).replaceAll('\\', '/'),
        type: assetType(extname(entry.name).toLowerCase()),
        size: metadata.size,
        modifiedAt: metadata.mtimeMs,
      });
    }));
  };

  await Promise.all(MANAGED_FILE_ROOTS.map(async managedRoot => {
    try {
      await walk(resolve(root, managedRoot));
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') throw error;
    }
  }));
  return items.sort((left, right) => (
    String((left as JsonRecord).path).localeCompare(String((right as JsonRecord).path), 'zh-CN')
  ));
};

const uploadAsset = async (root: string, request: IncomingMessage, directory: string): Promise<unknown> => {
  const normalizedDirectory = normalizeAssetDirectory(directory);

  const encodedName = request.headers['x-file-name'];
  const originalName = decodeURIComponent(Array.isArray(encodedName) ? encodedName[0] : encodedName ?? 'asset');
  const safeName = [...basename(originalName)]
    .map(character => (
      character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? '-' : character
    ))
    .join('')
    .trim();
  if (!safeName) throw new Error('文件名无效。');

  const targetDirectory = resolveInside(root, normalizedDirectory);
  await mkdir(targetDirectory, { recursive: true });
  const extension = extname(safeName);
  const stem = safeName.slice(0, safeName.length - extension.length);
  let targetPath = resolve(targetDirectory, safeName);
  let suffix = 2;
  while (true) {
    try {
      await stat(targetPath);
      targetPath = resolve(targetDirectory, `${stem}-${suffix}${extension}`);
      suffix += 1;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') break;
      throw error;
    }
  }

  const content = await readBody(request);
  await writeFile(targetPath, content);
  const relativePath = relative(root, targetPath).replaceAll('\\', '/');
  const publicPath = relative(resolve(root, 'public'), targetPath).replaceAll('\\', '/');
  return { path: relativePath, publicUrl: `/${publicPath}`, size: content.length };
};

const assertAssetPath = (relativePath: string): string => {
  const normalized = normalizeRelativePath(relativePath);
  if (!MANAGED_FILE_ROOTS.some(root => normalized.startsWith(`${root}/`))
    || normalized.split('/').some(part => part === '.' || part === '..' || GENERATED_DIRECTORIES.has(part))) {
    throw new Error('只能管理已配置的 public/assets、public/articles 和 public/live2d 源文件。');
  }
  return normalized;
};

const normalizeAssetDirectory = (directory: string): string => {
  const normalized = normalizeRelativePath(directory).replace(/\/$/, '');
  if (!MANAGED_FILE_ROOTS.some(root => normalized === root || normalized.startsWith(`${root}/`))
    || normalized.split('/').some(part => part === '.' || part === '..' || GENERATED_DIRECTORIES.has(part))) {
    throw new Error('目标必须位于已配置的媒体目录，且不能是自动生成目录。');
  }
  return normalized;
};

const directoryInfo = async (root: string, relativePath: string): Promise<unknown> => {
  const normalized = normalizeAssetDirectory(relativePath);
  const metadata = await stat(resolveInside(root, normalized));
  return {
    path: normalized,
    name: basename(normalized),
    parent: MANAGED_FILE_ROOTS.includes(normalized as typeof MANAGED_FILE_ROOTS[number])
      ? null
      : dirname(normalized).replaceAll('\\', '/'),
    modifiedAt: metadata.mtimeMs,
  };
};

const listAssetDirectories = async (root: string): Promise<unknown[]> => {
  const directories: unknown[] = [];
  const walk = async (relativeDirectory: string): Promise<void> => {
    directories.push(await directoryInfo(root, relativeDirectory));
    const entries = await readdir(resolveInside(root, relativeDirectory), { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
      if (!entry.isDirectory() || entry.name.startsWith('.') || GENERATED_DIRECTORIES.has(entry.name)) return;
      await walk(`${relativeDirectory}/${entry.name}`);
    }));
  };

  await Promise.all(MANAGED_FILE_ROOTS.map(async managedRoot => {
    try {
      await walk(managedRoot);
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') throw error;
      directories.push({
        path: managedRoot,
        name: basename(managedRoot),
        parent: null,
        modifiedAt: 0,
      });
    }
  }));
  return directories.sort((left, right) => (
    String((left as JsonRecord).path).localeCompare(String((right as JsonRecord).path), 'zh-CN')
  ));
};

const normalizeDirectoryName = (value: string): string => {
  const name = value.trim();
  if (!name || name === '.' || name === '..' || GENERATED_DIRECTORIES.has(name)
    || /[<>:"/\\|?*]/.test(name) || [...name].some(character => character.charCodeAt(0) < 32)) {
    throw new Error('文件夹名称无效。');
  }
  return name;
};

const createAssetDirectory = async (root: string, parentDirectory: string, name: string): Promise<unknown> => {
  const parent = normalizeAssetDirectory(parentDirectory);
  const target = `${parent}/${normalizeDirectoryName(name)}`;
  const absoluteTarget = resolveInside(root, target);
  await assertAvailablePath(absoluteTarget);
  await mkdir(absoluteTarget, { recursive: true });
  return directoryInfo(root, target);
};

const assertMutableDirectory = (directory: string): string => {
  const normalized = normalizeAssetDirectory(directory);
  if (MANAGED_FILE_ROOTS.includes(normalized as typeof MANAGED_FILE_ROOTS[number])) {
    throw new Error('顶层管理目录不能移动、重命名或删除。');
  }
  return normalized;
};

const moveAssetDirectory = async (
  root: string,
  path: string,
  targetParent: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<unknown> => {
  const source = assertMutableDirectory(path);
  const parent = normalizeAssetDirectory(targetParent);
  const target = `${parent}/${normalizeDirectoryName(targetName)}`;
  if (target === source) return directoryInfo(root, source);
  if (parent === source || parent.startsWith(`${source}/`)) {
    throw new Error('不能把文件夹移动到自身内部。');
  }
  const absoluteSource = resolveInside(root, source);
  const absoluteTarget = resolveInside(root, target);
  await assertVersion(absoluteSource, expectedModifiedAt);
  await assertAvailablePath(absoluteTarget);
  await mkdir(resolveInside(root, parent), { recursive: true });
  await rename(absoluteSource, absoluteTarget);
  return directoryInfo(root, target);
};

const deleteAssetDirectory = async (root: string, path: string, expectedModifiedAt: number): Promise<void> => {
  const normalized = assertMutableDirectory(path);
  const absolutePath = resolveInside(root, normalized);
  await assertVersion(absolutePath, expectedModifiedAt);
  try {
    await rmdir(absolutePath);
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOTEMPTY') {
      throw new Error('文件夹不是空的，请先移动或删除其中内容。', { cause: error });
    }
    throw error;
  }
};

const normalizeAssetName = (value: string): string => {
  const name = basename(value.trim());
  if (!name || name !== value.trim() || [...name].some(character => (
    character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character)
  ))) {
    throw new Error('素材文件名无效。');
  }
  return name;
};

const assetInfo = async (root: string, relativePath: string): Promise<unknown> => {
  const normalized = assertAssetPath(relativePath);
  const absolutePath = resolveInside(root, normalized);
  const metadata = await stat(absolutePath);
  const publicPath = relative(resolve(root, 'public'), absolutePath).replaceAll('\\', '/');
  return {
    path: normalized,
    publicUrl: `/${publicPath}`,
    name: basename(normalized),
    directory: dirname(publicPath).replaceAll('\\', '/'),
    type: assetType(extname(normalized).toLowerCase()),
    size: metadata.size,
    modifiedAt: metadata.mtimeMs,
  };
};

const moveAsset = async (
  root: string,
  sourcePath: string,
  targetDirectory: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<unknown> => {
  const normalizedSource = assertAssetPath(sourcePath);
  const directory = normalizeAssetDirectory(targetDirectory);
  const targetPath = `${directory}/${normalizeAssetName(targetName)}`;
  if (targetPath === normalizedSource) return assetInfo(root, normalizedSource);
  const source = resolveInside(root, normalizedSource);
  const target = resolveInside(root, targetPath);
  await assertVersion(source, expectedModifiedAt);
  await assertAvailablePath(target);
  await mkdir(dirname(target), { recursive: true });
  await rename(source, target);
  return assetInfo(root, targetPath);
};

const duplicateAsset = async (
  root: string,
  sourcePath: string,
  targetDirectory: string,
  targetName: string,
  expectedModifiedAt: number,
): Promise<unknown> => {
  const normalizedSource = assertAssetPath(sourcePath);
  const directory = normalizeAssetDirectory(targetDirectory);
  const targetPath = `${directory}/${normalizeAssetName(targetName)}`;
  const source = resolveInside(root, normalizedSource);
  const target = resolveInside(root, targetPath);
  await assertVersion(source, expectedModifiedAt);
  await assertAvailablePath(target);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await readFile(source), { flag: 'wx' });
  return assetInfo(root, targetPath);
};

const deleteAsset = async (root: string, path: string, expectedModifiedAt: number): Promise<void> => {
  const absolutePath = resolveInside(root, assertAssetPath(path));
  await assertVersion(absolutePath, expectedModifiedAt);
  await unlink(absolutePath);
};

const ASSET_CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const serveAsset = async (root: string, response: ServerResponse, path: string): Promise<void> => {
  const normalized = assertAssetPath(path);
  const absolutePath = resolveInside(root, normalized);
  const content = await readFile(absolutePath);
  response.statusCode = 200;
  response.setHeader('Content-Type', ASSET_CONTENT_TYPES[extname(absolutePath).toLocaleLowerCase()] ?? 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.end(content);
};

export const createAdminApiPlugin = (projectRoot: string): Plugin => ({
  name: 'local-admin-api',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.method === 'GET' && request.url?.split('?')[0] === '/favicon.ico') {
        try {
          await serveAsset(projectRoot, response, 'public/assets/avatar.png');
        } catch {
          response.statusCode = 204;
          response.end();
        }
        return;
      }
      if (!request.url?.startsWith('/api/admin/')) {
        next();
        return;
      }

      try {
        const url = new URL(request.url, 'http://127.0.0.1:5174');
        if (request.method === 'GET' && url.pathname === '/api/admin/project') {
          const packageData = JSON5.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
          const appConfig = JSON5.parse(await readFile(resolve(projectRoot, 'src/config/app.json5'), 'utf8'));
          const { title } = appConfig;
          const counts = Object.fromEntries(await Promise.all(CONFIG_DIRECTORIES.map(async directory => {
            return [adminResources.find(resource => resource.path === directory)?.id ?? directory,
              (await listCollectionPaths(projectRoot, directory)).length];
          })));
          sendJson(response, 200, {
            name: String(packageData.name ?? basename(projectRoot)),
            root: projectRoot,
            branch: await getBranch(projectRoot),
            siteTitle: typeof title === 'string' ? title : String((title as JsonRecord)?.zh ?? packageData.name ?? ''),
            counts,
          });
          return;
        }

        if (request.method === 'GET' && url.pathname === '/api/admin/files') {
          sendJson(response, 200, await listConfigFiles(projectRoot, url.searchParams.get('directory') ?? ''));
          return;
        }

        if (request.method === 'GET' && url.pathname === '/api/admin/config') {
          const path = url.searchParams.get('path') ?? '';
          sendJson(response, 200, { path, ...(await readConfig(projectRoot, path)) });
          return;
        }

        if (request.method === 'GET' && url.pathname === '/api/admin/asset') {
          await serveAsset(projectRoot, response, url.searchParams.get('path') ?? '');
          return;
        }

        if (request.method === 'PUT' && url.pathname === '/api/admin/config') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          const path = String(body.path ?? '');
          const modifiedAt = await writeConfig(
            projectRoot,
            path,
            body.data,
            typeof body.expectedModifiedAt === 'number' ? body.expectedModifiedAt : null,
          );
          sendJson(response, 200, { path, modifiedAt });
          return;
        }

        if (request.method === 'PATCH' && url.pathname === '/api/admin/config-file') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 200, await renameConfigFile(
            projectRoot,
            String(body.path ?? ''),
            String(body.targetName ?? ''),
            Number(body.expectedModifiedAt),
          ));
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/admin/config-file/duplicate') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 201, await duplicateConfigFile(
            projectRoot,
            String(body.path ?? ''),
            String(body.targetName ?? ''),
            String(body.targetId ?? ''),
            Number(body.expectedModifiedAt),
          ));
          return;
        }

        if (request.method === 'DELETE' && url.pathname === '/api/admin/config-file') {
          assertWriteOrigin(request);
          await deleteConfigFile(
            projectRoot,
            url.searchParams.get('path') ?? '',
            Number(url.searchParams.get('expectedModifiedAt')),
          );
          sendJson(response, 200, { deleted: true });
          return;
        }

        if (request.method === 'GET' && url.pathname === '/api/admin/assets') {
          sendJson(response, 200, await listAssets(projectRoot));
          return;
        }

        if (request.method === 'GET' && url.pathname === '/api/admin/asset-directories') {
          sendJson(response, 200, await listAssetDirectories(projectRoot));
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/admin/asset-directory') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 201, await createAssetDirectory(
            projectRoot,
            String(body.parentDirectory ?? ''),
            String(body.name ?? ''),
          ));
          return;
        }

        if (request.method === 'PATCH' && url.pathname === '/api/admin/asset-directory') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 200, await moveAssetDirectory(
            projectRoot,
            String(body.path ?? ''),
            String(body.targetParent ?? ''),
            String(body.targetName ?? ''),
            Number(body.expectedModifiedAt),
          ));
          return;
        }

        if (request.method === 'DELETE' && url.pathname === '/api/admin/asset-directory') {
          assertWriteOrigin(request);
          await deleteAssetDirectory(
            projectRoot,
            url.searchParams.get('path') ?? '',
            Number(url.searchParams.get('expectedModifiedAt')),
          );
          sendJson(response, 200, { deleted: true });
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/admin/upload') {
          assertWriteOrigin(request);
          sendJson(response, 201, await uploadAsset(projectRoot, request, url.searchParams.get('directory') ?? ''));
          return;
        }

        if (request.method === 'PATCH' && url.pathname === '/api/admin/asset') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 200, await moveAsset(
            projectRoot,
            String(body.path ?? ''),
            String(body.targetDirectory ?? ''),
            String(body.targetName ?? ''),
            Number(body.expectedModifiedAt),
          ));
          return;
        }

        if (request.method === 'DELETE' && url.pathname === '/api/admin/asset') {
          assertWriteOrigin(request);
          await deleteAsset(
            projectRoot,
            url.searchParams.get('path') ?? '',
            Number(url.searchParams.get('expectedModifiedAt')),
          );
          sendJson(response, 200, { deleted: true });
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/admin/asset/duplicate') {
          assertWriteOrigin(request);
          const body = await readJsonBody(request);
          sendJson(response, 201, await duplicateAsset(
            projectRoot,
            String(body.path ?? ''),
            String(body.targetDirectory ?? ''),
            String(body.targetName ?? ''),
            Number(body.expectedModifiedAt),
          ));
          return;
        }

        sendJson(response, 404, { message: '管理接口不存在。' });
      } catch (error) {
        const status = Number((error as { statusCode?: number }).statusCode ?? 400);
        sendJson(response, status, {
          message: error instanceof Error ? error.message : '管理请求失败。',
          requestId: createHash('sha1').update(`${Date.now()}-${request.url}`).digest('hex').slice(0, 8),
        });
      }
    });
  },
});
