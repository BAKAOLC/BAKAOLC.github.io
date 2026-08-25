import type { AdminField as Field } from './types';

type LocalizedWidget = 'string' | 'text' | 'markdown' | 'image' | 'file';

type LocalizedFieldOptions = {
  required?: boolean;
  collapsed?: boolean | 'auto';
  widget?: LocalizedWidget;
  hint?: string;
  mediaFolder?: string;
  publicFolder?: string;
  accept?: string;
};

const localeLabels = {
  zh: '简体中文',
  en: 'English',
  jp: '日本語',
} as const;

const createLocalizedSubField = (
  locale: keyof typeof localeLabels,
  widget: LocalizedWidget,
  options: LocalizedFieldOptions,
): Field => ({
  name: locale,
  label: localeLabels[locale],
  widget,
  required: false,
  locale,
  ...(widget === 'markdown' ? { modes: ['rich_text', 'raw'] } : {}),
  ...(widget === 'image' || widget === 'file'
    ? {
      media_folder: options.mediaFolder,
      public_folder: options.publicFolder,
      accept: options.accept,
    }
    : {}),
});

export const localizedSubFields = (options: LocalizedFieldOptions = {}): Field[] => {
  const widget = options.widget ?? 'string';

  return (Object.keys(localeLabels) as Array<keyof typeof localeLabels>)
    .map(locale => createLocalizedSubField(locale, widget, options));
};

export const localizedField = (
  name: string,
  label: string,
  options: LocalizedFieldOptions = {},
): Field => {
  return {
    name,
    label,
    widget: 'object',
    localized: true,
    required: options.required ?? true,
    collapsed: options.collapsed ?? 'auto',
    hint: options.hint ?? '可为各语言分别填写；留空的语言由站点回退策略处理。',
    fields: localizedSubFields(options),
  };
};

export const idField = (label = '唯一 ID'): Field => ({
  name: 'id',
  label,
  widget: 'string',
  pattern: [/^[A-Za-z0-9][A-Za-z0-9._-]*$/, '仅允许字母、数字、点、下划线和连字符，且需以字母或数字开头。'],
  hint: '用于 URL 和配置引用，创建后尽量不要修改。',
});

export const colorField = (name = 'color', label = '主题颜色', required = false): Field => ({
  name,
  label,
  widget: 'color',
  required,
  allowInput: true,
});

const relationToRootList = (
  name: string,
  label: string,
  file: 'characters' | 'tags',
  multiple = true,
  required = false,
): Field => ({
  name,
  label,
  widget: 'relation',
  multiple,
  required,
  relation: file,
});

const authorLinksField = (): Field => ({
  name: 'authorLinks',
  label: '作者主页',
  label_singular: '主页链接',
  widget: 'list',
  required: false,
  collapsed: 'auto',
  minimize_collapsed: true,
  summary: '{{fields.name.zh}} · {{fields.url}}',
  fields: [
    { name: 'url', label: '链接地址', widget: 'string', type: 'url' },
    localizedField('name', '显示名称', { required: false }),
    { name: 'favicon', label: '自定义图标', widget: 'image', required: false },
  ],
});

const imageBaseFields = (requireSource: boolean): Field[] => [
  idField(),
  { name: 'hidden', label: '隐藏此项', widget: 'boolean', required: false, default: false },
  localizedField('name', '名称', { required: false }),
  localizedField('listName', '列表短名称', { required: false }),
  localizedField('description', '说明', { required: false, widget: 'text' }),
  {
    name: 'artist',
    label: '作者／艺术家',
    label_singular: '作者',
    widget: 'list',
    required: false,
    collapsed: 'auto',
    minimize_collapsed: true,
    summary: '{{fields.zh}} / {{fields.en}}',
    fields: localizedSubFields(),
  },
  authorLinksField(),
  {
    name: 'src',
    label: requireSource ? '图片' : '单张图片',
    widget: 'image',
    required: requireSource,
    media_folder: '/public/assets/category',
    public_folder: '/assets/category',
    accept: 'image/*',
  },
  relationToRootList('tags', '标签', 'tags'),
  relationToRootList('characters', '关联角色', 'characters'),
  { name: 'date', label: '创作日期', widget: 'datetime', type: 'date', format: 'YYYY-MM-DD', required: false },
];

export const imageFields: Field[] = [
  ...imageBaseFields(false),
  {
    name: 'childImages',
    label: '图片列表',
    label_singular: '图片',
    widget: 'list',
    required: false,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.listName.zh}} · {{fields.id}}',
    thumbnail: 'src',
    fields: imageBaseFields(true),
  },
];

export const articleFields: Field[] = [
  idField('文章 ID'),
  { name: 'hidden', label: '隐藏文章', widget: 'boolean', required: false, default: false },
  localizedField('title', '文章标题'),
  localizedField('cover', '封面图片', {
    required: false,
    widget: 'image',
    mediaFolder: '/public/assets/articles',
    publicFolder: '/assets/articles',
    accept: 'image/*',
  }),
  {
    name: 'categories',
    label: '文章分类',
    widget: 'relation',
    multiple: true,
    required: false,
    relation: 'articleCategories',
  },
  { name: 'date', label: '发布日期', widget: 'datetime', type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss ZZ', default: '{{now}}' },
  localizedField('content', '正文', {
    required: false,
    widget: 'markdown',
    collapsed: false,
    hint: '正文与外部 Markdown 至少填写一项。支持富文本和 Markdown 源码双模式。',
  }),
  localizedField('markdownPath', '外部 Markdown 文件', {
    required: false,
    widget: 'file',
    mediaFolder: '/public/articles',
    publicFolder: '/articles',
    accept: '.md,text/markdown,text/plain',
  }),
  localizedField('summary', '摘要', { required: false, widget: 'text' }),
  { name: 'allowComments', label: '允许评论', widget: 'boolean', required: false, default: true },
];

const infoCardFields = (includeTemplateOptions = true): Field[] => [
  idField('卡片 ID'),
  localizedField('title', '标题', { required: false }),
  localizedField('content', '内容', { required: false, widget: 'markdown' }),
  colorField(),
  ...(includeTemplateOptions
    ? [
      {
        name: 'from',
        label: '继承卡片 ID',
        widget: 'string',
        required: false,
        hint: '引用同一角色层级中已有的信息卡片 ID。',
      } as Field,
      {
        name: 'template',
        label: '模板 ID',
        widget: 'string',
        required: false,
        hint: '引用当前角色 infoCardTemplates 中的模板 ID。',
      } as Field,
      {
        name: 'variables',
        label: '模板变量',
        widget: 'keyvalue',
        required: false,
        key_label: '变量名',
        value_label: '变量值',
      } as Field,
    ]
    : []),
];

const infoCardsList = (name: string, label: string): Field => ({
  name,
  label,
  label_singular: '信息卡片',
  widget: 'list',
  required: false,
  collapsed: true,
  minimize_collapsed: true,
  summary: '{{fields.title.zh}} · {{fields.id}}',
  fields: infoCardFields(),
});

export const characterProfileFields: Field[] = [
  idField('角色档案 ID'),
  localizedField('name', '角色名称'),
  colorField(),
  {
    name: 'infoCardTemplates',
    label: '信息卡片模板',
    label_singular: '卡片模板',
    widget: 'list',
    required: false,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.title.zh}} · {{fields.id}}',
    fields: [
      ...infoCardFields(false),
      {
        name: 'variables',
        label: '默认变量',
        widget: 'keyvalue',
        required: false,
        key_label: '变量名',
        value_label: '默认值',
      },
    ],
  },
  infoCardsList('infoCards', '角色级信息卡片'),
  {
    name: 'variants',
    label: '角色差分',
    label_singular: '差分',
    widget: 'list',
    min: 1,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name.zh}} · {{fields.id}}',
    fields: [
      idField('差分 ID'),
      localizedField('name', '差分名称'),
      infoCardsList('infoCards', '差分级信息卡片'),
      {
        name: 'images',
        label: '差分图片',
        label_singular: '图片',
        widget: 'list',
        min: 1,
        collapsed: true,
        minimize_collapsed: true,
        summary: '{{fields.alt.zh}} · {{fields.id}}',
        thumbnail: 'src',
        fields: [
          idField('图片 ID'),
          {
            name: 'src',
            label: '图片文件',
            widget: 'image',
            media_folder: '/public/assets/characters',
            public_folder: '/assets/characters',
          },
          localizedField('alt', '替代文本'),
          infoCardsList('infoCards', '图片级信息卡片'),
        ],
      },
    ],
  },
];

export const characterListField: Field = {
  name: 'characters',
  label: '角色索引',
  label_singular: '角色',
  widget: 'list',
  root: true,
  collapsed: true,
  minimize_collapsed: true,
  summary: '{{fields.name.zh}} · {{fields.id}}',
  fields: [
    idField('角色 ID'),
    localizedField('name', '角色名称'),
    localizedField('description', '角色简介', { widget: 'text' }),
    { name: 'avatar', label: '角色头像', widget: 'image', required: false },
    colorField(),
  ],
};

export const tagListField: Field = {
  name: 'tags',
  label: '图库标签',
  label_singular: '标签',
  widget: 'list',
  root: true,
  collapsed: true,
  minimize_collapsed: true,
  summary: '{{fields.name.zh}} · {{fields.id}}',
  fields: [
    idField('标签 ID'),
    localizedField('name', '标签名称'),
    colorField(),
    { name: 'icon', label: '图标名称', widget: 'string', required: false },
    { name: 'isRestricted', label: '受限标签', widget: 'boolean', required: false, default: false },
    relationToRootList('prerequisiteTags', '前置标签', 'tags'),
  ],
};

export const articleCategoriesField: Field = {
  name: 'entries',
  label: '文章分类',
  label_singular: '分类',
  widget: 'list',
  collapsed: true,
  minimize_collapsed: true,
  summary: '{{fields.name.zh}} · {{fields.id}}',
  fields: [idField('分类 ID'), localizedField('name', '分类名称'), colorField()],
};

export const siteRegistryField: Field = {
  name: 'entries',
  label: '站点识别规则',
  label_singular: '站点',
  widget: 'list',
  collapsed: true,
  minimize_collapsed: true,
  summary: '{{fields.zh}} · {{fields.id}}',
  fields: [
    idField('域名'),
    { name: 'zh', label: '中文名称', widget: 'string' },
    { name: 'en', label: '英文名称', widget: 'string', required: false },
    { name: 'jp', label: '日文名称', widget: 'string', required: false },
    { name: 'iconUrl', label: '站点图标 URL', widget: 'string', type: 'url', required: false },
  ],
};
