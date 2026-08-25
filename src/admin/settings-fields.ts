import { colorField, idField, localizedField, localizedSubFields } from './fields';
import type { AdminField as Field } from './types';

export const appFields: Field[] = [
  localizedField('title', '站点标题', { collapsed: false }),
  localizedField('copyright', '版权信息', { collapsed: false }),
];

export const htmlFields: Field[] = [
  { name: 'title', label: 'HTML 标题', widget: 'string' },
  { name: 'description', label: 'SEO 描述', widget: 'text' },
  { name: 'keywords', label: 'SEO 关键词', widget: 'string', hint: '使用英文逗号分隔。' },
  { name: 'author', label: '作者', widget: 'string' },
  { name: 'url', label: '站点公开地址', widget: 'string', type: 'url' },
  { name: 'image', label: '分享预览图', widget: 'image' },
  {
    name: 'themeColor',
    label: '浏览器主题色',
    widget: 'object',
    fields: [colorField('light', '浅色模式'), colorField('dark', '深色模式')],
  },
  { name: 'favicon', label: 'Favicon', widget: 'image' },
  { name: 'appleTouchIcon', label: 'Apple Touch Icon', widget: 'image' },
];

export const personalFields: Field[] = [
  { name: 'avatar', label: '头像', widget: 'image' },
  localizedField('name', '显示名称', { collapsed: false }),
  {
    name: 'description',
    label: '个人介绍段落',
    label_singular: '段落',
    widget: 'list',
    min: 1,
    collapsed: 'auto',
    minimize_collapsed: true,
    summary: '{{fields.zh}}',
    fields: localizedSubFields(),
  },
  {
    name: 'links',
    label: '社交链接',
    label_singular: '链接',
    widget: 'list',
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name.zh}} · {{fields.url}}',
    fields: [
      localizedField('name', '名称'),
      { name: 'url', label: '地址', widget: 'string', pattern: [/^(https?:\/\/|mailto:|tel:).+/, '请输入 URL、mailto: 或 tel: 地址。'] },
      { name: 'icon', label: 'FontAwesome 图标', widget: 'string' },
      colorField(),
    ],
  },
  {
    name: 'backgroundImages',
    label: '随机背景图',
    widget: 'image',
    multiple: true,
    required: false,
    media_folder: '/public/assets/backgrounds',
    public_folder: '/assets/backgrounds',
  },
  {
    name: 'actionButtons',
    label: '首页操作按钮',
    label_singular: '按钮',
    widget: 'list',
    required: false,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.text.zh}} · {{fields.id}}',
    fields: [
      idField('按钮 ID'),
      localizedField('text', '按钮文本'),
      { name: 'icon', label: '图标类名', widget: 'string', required: false },
      colorField(),
      {
        name: 'type',
        label: '链接类型',
        widget: 'select',
        options: [
          { label: '站内路由', value: 'internal' },
          { label: '外部链接', value: 'external' },
        ],
        default: 'internal',
      },
      { name: 'target', label: '目标地址', widget: 'string' },
      { name: 'enabled', label: '启用', widget: 'boolean', required: false, default: true },
    ],
  },
  {
    name: 'animationDelayInterval',
    label: '链接动画间隔',
    widget: 'number',
    value_type: 'float',
    min: 0,
    step: 0.05,
    required: false,
    after_input: '秒',
  },
  {
    name: 'actionButtonsWaitForLinks',
    label: '按钮等待链接动画',
    widget: 'boolean',
    required: false,
    default: true,
  },
  {
    name: 'actionButtonsInitialDelay',
    label: '按钮初始延迟',
    widget: 'number',
    value_type: 'float',
    min: 0,
    step: 0.05,
    required: false,
    after_input: '秒',
  },
  {
    name: 'actionButtonsAnimationDelayInterval',
    label: '按钮动画间隔',
    widget: 'number',
    value_type: 'float',
    min: 0,
    step: 0.05,
    required: false,
    after_input: '秒',
  },
];

export const featureFields: Field[] = [
  {
    name: 'gallery', label: '启用图库', widget: 'boolean',
  },
  {
    name: 'articles', label: '启用文章', widget: 'boolean',
  },
  {
    name: 'links', label: '启用友链', widget: 'boolean',
  },
  {
    name: 'characterProfiles', label: '启用角色档案', widget: 'boolean',
  },
  {
    name: 'comments', label: '启用评论', widget: 'boolean',
  },
  {
    name: 'live2d', label: '启用 Live2D', widget: 'boolean',
  },
  {
    name: 'viewerUI',
    label: '图片查看器界面',
    widget: 'object',
    collapsed: false,
    fields: [
      { name: 'imageList', label: '显示图库图片列表', widget: 'boolean' },
      { name: 'imageGroupList', label: '显示组内图片列表', widget: 'boolean' },
      { name: 'viewerTitle', label: '显示顶部标题', widget: 'boolean' },
      {
        name: 'infoPanel',
        label: '信息面板项目',
        widget: 'object',
        fields: [
          { name: 'title', label: '标题', widget: 'boolean' },
          { name: 'description', label: '说明', widget: 'boolean' },
          { name: 'artist', label: '作者', widget: 'boolean' },
          { name: 'date', label: '日期', widget: 'boolean' },
          { name: 'tags', label: '标签', widget: 'boolean' },
        ],
      },
      { name: 'commentsButton', label: '显示评论按钮', widget: 'boolean' },
    ],
  },
];

export const languageFields: Field[] = [
  {
    name: 'fallback',
    label: '回退语言',
    widget: 'relation',
    relation: 'languages',
  },
  {
    name: 'default',
    label: '默认语言',
    widget: 'relation',
    relation: 'languages',
  },
  {
    name: 'languages',
    label: '语言列表',
    label_singular: '语言',
    widget: 'list',
    min: 1,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.name}} · {{fields.id}}',
    fields: [
      idField('语言 ID'),
      { name: 'enabled', label: '启用', widget: 'boolean', default: true },
      { name: 'code', label: '站点语言代码', widget: 'string' },
      { name: 'name', label: '显示名称', widget: 'string' },
      { name: 'giscus', label: 'Giscus 语言代码', widget: 'string' },
      { name: 'aliases', label: '浏览器语言别名', widget: 'list', required: false },
    ],
  },
];

export const articlesPageFields: Field[] = [
  {
    name: 'infoCards',
    label: '文章页信息卡片',
    label_singular: '信息卡片',
    widget: 'list',
    required: false,
    collapsed: true,
    minimize_collapsed: true,
    summary: '{{fields.title.zh}} · {{fields.id}}',
    fields: [
      idField('卡片 ID'),
      localizedField('title', '标题', { required: false }),
      {
        name: 'image',
        label: '主题图片',
        widget: 'object',
        fields: [
          { name: 'light', label: '浅色模式图片', widget: 'image' },
          { name: 'dark', label: '深色模式图片', widget: 'image' },
        ],
      },
    ],
  },
];

export const giscusFields: Field[] = [
  { name: 'repo', label: 'GitHub 仓库', widget: 'string', pattern: [/^[^/\s]+\/[^/\s]+$/, '格式应为 owner/repository。'] },
  { name: 'repoId', label: '仓库 ID', widget: 'string' },
  { name: 'category', label: 'Discussion 分类', widget: 'string' },
  { name: 'categoryId', label: '分类 ID', widget: 'string' },
  {
    name: 'mapping',
    label: '页面映射',
    widget: 'select',
    options: ['specific', 'pathname', 'url', 'title', 'og:title', 'number'],
  },
  { name: 'strict', label: '严格匹配', widget: 'select', options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] },
  { name: 'reactionsEnabled', label: '启用反应', widget: 'select', options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] },
  { name: 'emitMetadata', label: '输出元数据', widget: 'select', options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] },
  { name: 'inputPosition', label: '评论框位置', widget: 'select', options: [{ label: '顶部', value: 'top' }, { label: '底部', value: 'bottom' }] },
  { name: 'loading', label: '加载策略', widget: 'select', options: [{ label: '懒加载', value: 'lazy' }, { label: '立即加载', value: 'eager' }] },
];

export const fontAwesomeFields: Field[] = [
  {
    name: 'defaultPackage',
    label: '默认图标包',
    widget: 'select',
    options: ['fas', 'far', 'fab', 'fal', 'fad', 'fat', 'fa-solid', 'fa-regular', 'fa-brands', 'fa-light', 'fa-duotone', 'fa-thin'],
  },
  { name: 'fallbackIcon', label: '回退图标名称', widget: 'string' },
];

export const live2dFields: Field[] = [
  {
    name: 'model',
    label: '模型',
    widget: 'object',
    collapsed: false,
    fields: [
      {
        name: 'url',
        label: '模型入口文件',
        widget: 'file',
        required: false,
        media_folder: '/public/live2d',
        public_folder: '/live2d',
        accept: '.json,application/json',
      },
      { name: 'scale', label: '缩放倍率', widget: 'number', value_type: 'float', min: 0.01, step: 0.05 },
      { name: 'x', label: 'X 偏移', widget: 'number', value_type: 'float', step: 1, after_input: 'px' },
      { name: 'y', label: 'Y 偏移', widget: 'number', value_type: 'float', step: 1, after_input: 'px' },
    ],
  },
  {
    name: 'display',
    label: '显示区域',
    widget: 'object',
    collapsed: false,
    fields: [
      { name: 'width', label: '宽度', widget: 'number', value_type: 'int', min: 1, after_input: 'px' },
      { name: 'height', label: '高度', widget: 'number', value_type: 'int', min: 1, after_input: 'px' },
      {
        name: 'anchor',
        label: '停靠位置',
        widget: 'select',
        options: [
          'top-left',
          'top-center',
          'top-right',
          'middle-left',
          'middle-center',
          'middle-right',
          'bottom-left',
          'bottom-center',
          'bottom-right',
        ],
      },
      { name: 'offsetX', label: '水平偏移', widget: 'number', value_type: 'int', after_input: 'px' },
      { name: 'offsetY', label: '垂直偏移', widget: 'number', value_type: 'int', after_input: 'px' },
      { name: 'opacity', label: '透明度', widget: 'number', value_type: 'float', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    name: 'interaction',
    label: '交互',
    widget: 'object',
    collapsed: false,
    fields: [
      { name: 'cursorTracking', label: '视角跟随鼠标', widget: 'boolean' },
      { name: 'clickExpression', label: '点击切换表情', widget: 'boolean' },
      { name: 'expressionInterval', label: '自动表情间隔', widget: 'number', value_type: 'int', min: 0, after_input: 'ms' },
      { name: 'expressionResetDelay', label: '表情恢复延迟', widget: 'number', value_type: 'int', min: 0, required: false, after_input: 'ms' },
      { name: 'idleMotionGroup', label: '待机动作组', widget: 'string', required: false },
    ],
  },
];

export const live2dEngineFields: Field[] = [
  {
    name: 'cubism4Runtime',
    label: 'Cubism 4 Core 运行时',
    widget: 'file',
    required: false,
    media_folder: '/public/live2d/runtime',
    public_folder: '/live2d/runtime',
    accept: '.js,text/javascript,application/javascript',
  },
  {
    name: 'cubism2Runtime',
    label: 'Cubism 2 运行时',
    widget: 'file',
    required: false,
    media_folder: '/public/live2d/runtime',
    public_folder: '/live2d/runtime',
    accept: '.js,text/javascript,application/javascript',
  },
];
