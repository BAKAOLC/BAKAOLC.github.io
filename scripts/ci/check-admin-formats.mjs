import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import JSON5 from 'json5';
import { createServer } from 'vite';

const projectRoot = resolve(import.meta.dirname, '../..');

const vite = await createServer({
  root: projectRoot,
  configFile: false,
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
});

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);

const auditFields = (value, fields, path) => {
  const rootField = fields.find(field => field.root === true);
  if (rootField) {
    if (!Array.isArray(value)) {
      throw new Error(`${path} must be an array for root field "${rootField.name}".`);
    }
    if (rootField.fields) {
      value.forEach((item, index) => auditFields(item, rootField.fields, `${path}[${index}]`));
    }
    return;
  }

  if (!isRecord(value)) {
    throw new Error(`${path} must be an object.`);
  }

  const knownNames = new Set(fields.map(field => field.name));
  const unknownNames = Object.keys(value).filter(name => !knownNames.has(name));
  if (unknownNames.length > 0) {
    throw new Error(`${path} has fields missing from the admin schema: ${unknownNames.join(', ')}.`);
  }

  fields.forEach(field => {
    const fieldValue = value[field.name];
    if (fieldValue === undefined || !field.fields) {
      return;
    }

    if (field.widget === 'list') {
      if (!Array.isArray(fieldValue)) {
        throw new Error(`${path}.${field.name} must be an array.`);
      }
      fieldValue.forEach((item, index) => auditFields(item, field.fields, `${path}.${field.name}[${index}]`));
      return;
    }

    auditFields(fieldValue, field.fields, `${path}.${field.name}`);
  });
};

const checkFile = async (relativePath, resource, decodeConfig, encodeConfig) => {
  const source = await readFile(resolve(projectRoot, relativePath), 'utf8');
  const adminValue = decodeConfig(resource.codec, JSON5.parse(source));
  auditFields(adminValue, resource.fields, relativePath);
  const serialized = JSON5.stringify(encodeConfig(resource.codec, adminValue));
  const roundTripValue = decodeConfig(resource.codec, JSON5.parse(serialized));
  auditFields(roundTripValue, resource.fields, `${relativePath} (round trip)`);
  console.log(`✓ ${relativePath} (${resource.codec})`);
};

const checkFolder = async (resource, decodeConfig, encodeConfig) => {
  const files = [];
  const walk = async directory => {
    const entries = await readdir(resolve(projectRoot, directory), { withFileTypes: true });
    await Promise.all(entries.map(async entry => {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.json5')) files.push(path);
    }));
  };
  await walk(resource.path);
  files.sort();

  await Promise.all(files.map(file => checkFile(file, resource, decodeConfig, encodeConfig)));
};

const assertImageInheritanceIsNotMaterialized = (decodeConfig, encodeConfig) => {
  const group = {
    id: 'inheritance-check',
    name: { zh: '父级名称' },
    description: { zh: '父级说明' },
    artist: [{ zh: '父级作者' }],
    tags: ['parent-tag'],
    characters: ['parent-character'],
    childImages: [
      { id: 'inheritance-check-1', src: '/assets/category/one.png' },
      { id: 'inheritance-check-2', src: '/assets/category/two.png', listName: { zh: '第二张' } },
    ],
  };
  const encodedGroup = encodeConfig('image', decodeConfig('image', group));
  if (!isRecord(encodedGroup) || Object.hasOwn(encodedGroup, 'src')) {
    throw new Error('Image group admin round trip incorrectly created a parent src.');
  }
  const encodedChildren = encodedGroup.childImages;
  if (!Array.isArray(encodedChildren) || encodedChildren.length !== group.childImages.length) {
    throw new Error('Image group admin round trip changed childImages.');
  }
  const inheritedKeys = ['name', 'description', 'artist', 'authorLinks', 'tags', 'characters', 'date'];
  encodedChildren.forEach((child, index) => {
    if (!isRecord(child)) throw new Error(`childImages[${index}] is not an object.`);
    inheritedKeys.forEach(key => {
      if (!Object.hasOwn(group.childImages[index], key) && Object.hasOwn(child, key)) {
        throw new Error(`childImages[${index}] incorrectly copied parent field "${key}".`);
      }
    });
  });

  const single = { id: 'single-check', src: '/assets/category/single.png', name: { zh: '单图' } };
  const encodedSingle = encodeConfig('image', decodeConfig('image', single));
  if (!isRecord(encodedSingle) || encodedSingle.src !== single.src || Object.hasOwn(encodedSingle, 'childImages')) {
    throw new Error('Single image admin round trip changed src into childImages.');
  }
};

try {
  const [{ decodeConfig, encodeConfig }, { adminResources }] = await Promise.all([
    vite.ssrLoadModule('/src/admin/formats.ts'),
    vite.ssrLoadModule('/src/admin/schema.ts'),
  ]);
  assertImageInheritanceIsNotMaterialized(decodeConfig, encodeConfig);
  const checks = adminResources.map(resource => resource.kind === 'collection'
    ? checkFolder(resource, decodeConfig, encodeConfig)
    : checkFile(resource.path, resource, decodeConfig, encodeConfig));

  await Promise.all(checks);

  console.log('Admin JSON5 format checks passed.');
} finally {
  await vite.close();
}
