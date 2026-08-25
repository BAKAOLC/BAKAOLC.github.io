import { idField, localizedField } from './fields';
import type { AdminField as Field } from './types';

const linkTagRelation = (): Field => ({
  name: 'tags',
  label: '友链标签',
  widget: 'relation',
  multiple: true,
  required: false,
  relation: 'linkTags',
});

export const linksFields: Field[] = [
  {
    name: 'tags',
    label: '友链标签',
    label_singular: '标签',
    widget: 'list',
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name.zh}} · {{fields.id}}',
    fields: [idField('标签 ID'), localizedField('name', '标签名称')],
  },
  {
    name: 'categories',
    label: '友链分类',
    label_singular: '分类',
    widget: 'list',
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name.zh}} · {{fields.id}}',
    fields: [
      idField('分类 ID'),
      localizedField('name', '分类名称'),
      localizedField('description', '分类说明', { widget: 'text', required: false }),
      {
        name: 'links',
        label: '分类内友链',
        label_singular: '友链',
        widget: 'list',
        collapsed: true,
        minimize_collapsed: true,
        summary: '{{fields.name.zh}} · {{fields.url}}',
        fields: [
          idField('友链 ID'),
          localizedField('name', '站点名称'),
          { name: 'url', label: '站点地址', widget: 'string', type: 'url' },
          {
            name: 'avatar',
            label: '头像／Logo',
            widget: 'image',
            required: false,
            media_folder: '/public/assets/links',
            public_folder: '/assets/links',
          },
          localizedField('description', '简介', { widget: 'text', required: false }),
          linkTagRelation(),
        ],
      },
    ],
  },
  {
    name: 'settings',
    label: '友链页显示设置',
    widget: 'object',
    collapsed: false,
    fields: [
      { name: 'showTags', label: '显示标签', widget: 'boolean' },
      { name: 'showDescription', label: '显示简介', widget: 'boolean' },
      { name: 'showAvatar', label: '显示头像', widget: 'boolean' },
      { name: 'defaultAvatar', label: '默认头像', widget: 'image' },
    ],
  },
];

const localizedAudioField = (name: string, label: string, required = false): Field => localizedField(name, label, {
  widget: 'file',
  required,
  mediaFolder: '/public/assets/audio',
  publicFolder: '/assets/audio',
  accept: 'audio/*,.mp3,.ogg,.wav,.flac,.m4a,.aac',
});

export const bgmFields: Field[] = [
  { name: 'enabled', label: '启用播放器', widget: 'boolean' },
  { name: 'autoplay', label: '记忆并尝试自动播放', widget: 'boolean' },
  {
    name: 'volume',
    label: '默认音量',
    widget: 'number',
    value_type: 'float',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    name: 'mode',
    label: '播放模式',
    widget: 'select',
    options: [
      { label: '单曲循环', value: 'single-loop' },
      { label: '列表顺序', value: 'list-order' },
      { label: '列表随机', value: 'list-shuffle' },
    ],
  },
  {
    name: 'tracks',
    label: '曲目',
    label_singular: '曲目',
    widget: 'list',
    required: false,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name.zh}} · {{fields.artist.zh}}',
    fields: [
      localizedField('name', '曲名'),
      localizedAudioField('url', '完整音频文件'),
      {
        name: 'dualFile',
        label: 'Intro + Loop 双文件',
        widget: 'object',
        required: false,
        collapsed: 'auto',
        hint: '使用双文件模式时填写；与完整音频文件二选一。',
        fields: [
          localizedAudioField('intro', 'Intro 文件'),
          localizedAudioField('loop', 'Loop 文件'),
        ],
      },
      localizedField('artist', '艺术家', { required: false }),
      localizedField('album', '专辑', { required: false }),
      {
        name: 'artwork',
        label: '封面图',
        label_singular: '封面规格',
        widget: 'list',
        required: false,
        collapsed: true,
        minimize_collapsed: true,
        summary: '{{fields.sizes}} · {{fields.type}}',
        fields: [
          localizedField('src', '图片', {
            widget: 'image',
            mediaFolder: '/public/assets/audio/artwork',
            publicFolder: '/assets/audio/artwork',
          }),
          { name: 'sizes', label: '尺寸提示', widget: 'string', required: false, hint: '例如 512x512。' },
          { name: 'type', label: 'MIME 类型', widget: 'string', required: false, hint: '例如 image/webp。' },
        ],
      },
      {
        name: 'loop',
        label: '循环区间',
        widget: 'object',
        required: false,
        collapsed: 'auto',
        fields: [
          { name: 'start', label: '开始时间', widget: 'number', value_type: 'float', min: 0, step: 0.01, after_input: '秒' },
          { name: 'end', label: '结束时间', widget: 'number', value_type: 'float', min: 0, step: 0.01, after_input: '秒' },
        ],
      },
    ],
  },
];
