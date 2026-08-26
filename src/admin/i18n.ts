/* eslint-disable @stylistic/object-property-newline */
import { createI18n } from 'vue-i18n';

export type AdminUiLocale = 'zh' | 'en' | 'jp';

const messages = {
  zh: {
    ui: {
      language: '界面语言', chinese: '简体中文', english: 'English', japanese: '日本語',
      close: '关闭', cancel: '取消', create: '创建', delete: '删除', refresh: '刷新', optional: '可选',
      saved: '已保存', saveChanges: '保存修改', unsaved: '尚未保存', loadingFailed: '加载失败', operationFailed: '操作失败',
    },
    nav: {
      dashboard: '管理概览', open: '打开导航', expand: '展开导航', collapse: '收起导航',
      preview: '打开站点预览', repositoryBound: '已绑定当前仓库', overview: '概览', assets: '素材库', navigation: '管理导航', close: '关闭导航', adminCenter: '站点管理中心',
    },
    dashboard: { connected: '本地项目已连接', start: '开始管理内容', availableAssets: '可用素材', modules: '管理模块', moduleCount: '{count} 个模块' },
    sections: { content: '内容管理', structure: '结构与关系', presentation: '站点呈现', experience: '功能与体验', integrations: '外部集成' },
    resources: {
      gallery: { label: '图库作品', singular: '作品', description: '作品、图片组、作者、标签与角色关联。' },
      articles: { label: '文章', singular: '文章', description: '正文、分类、封面、发布日期和评论设置。' },
      profiles: { label: '角色档案', singular: '角色档案', description: '角色、差分、立绘和信息卡片的正式层级。' },
      characters: { label: '角色索引', description: '图库与档案共用的角色字典。' }, tags: { label: '图库标签', description: '含前置关系和受限标记的标签体系。' },
      articleCategories: { label: '文章分类', description: '文章使用的正式分类字典。' }, links: { label: '友链体系', description: '友链标签、分类、站点和页面显示规则。' },
      personal: { label: '首页与个人资料', description: '头像、介绍、社交链接、背景和操作按钮。' }, app: { label: '站点名称与版权', description: '页面标题和页脚版权文本。' },
      html: { label: 'SEO 与浏览器', description: 'Meta、站点地址、主题色和图标。' }, languages: { label: '语言与回退', description: '启用语言、默认语言和浏览器别名。' }, articlesPage: { label: '文章页卡片', description: '文章页面顶部的信息卡片。' },
      features: { label: '功能开关', description: '站点模块和图片查看器界面。' }, bgm: { label: '背景音乐', description: '播放器行为、曲目、封面和循环区间。' }, live2d: { label: 'Live2D 挂件', description: '模型、画布位置和交互行为。' }, live2dEngine: { label: 'Live2D 运行时', description: 'Cubism Core 运行时文件。' },
      giscus: { label: 'Giscus 评论', description: '仓库、Discussion 分类和加载策略。' }, fontawesome: { label: 'FontAwesome', description: '默认图标包与回退图标。' }, sites: { label: '站点识别规则', description: '外部域名的显示名称和图标映射。' },
    },
    editor: {
      contentLanguage: '编辑语言', content: '配置内容', siteConfig: '站点配置', configFile: '配置文件',
      noFile: '尚未选择文件', fileActions: '文件操作', search: '搜索条目', selectEntry: '选择要编辑的条目',
      newEntry: '新建', empty: '暂无条目', refreshFiles: '刷新文件列表', newFile: '新建配置文件',
    },
    files: {
      duplicateEntry: '复制为新条目', renameFile: '重命名文件', deletePermanently: '永久删除', newTitle: '新建{item}', duplicateTitle: '复制{item}', renameTitle: '重命名配置文件', startEditing: '开始编辑', createCopy: '创建副本', rename: '重命名',
      discardTitle: '放弃尚未保存的修改？', discardBody: '切换页面后，当前表单中的修改会丢失。', discard: '放弃修改', keepEditing: '继续编辑', loadFailed: '配置加载失败', newPending: '新条目尚未写入磁盘，填写内容后点击保存。', created: '已创建 {name}.json5', renamed: '已重命名为 {name}.json5', actionFailed: '文件操作失败',
      deleteTitle: '永久删除 {name}.json5？', deleteBody: '对应的{item}配置会从仓库中直接删除，此操作不会进入回收站。', deleted: '{name}.json5 已删除', deleteFailed: '删除失败', refreshed: '文件列表已刷新', refreshFailed: '刷新失败', invalidId: '请先填写有效的唯一 ID，再保存新条目。', configSaved: '配置已保存', saveFailed: '保存失败', initFailed: '管理中心初始化失败',
      renameInfo: '重命名只改变磁盘上的 JSON5 文件名，不会修改配置中的 ID 或引用关系。', duplicateInfo: '副本会复制当前磁盘内容，并使用新的文件名和配置 ID；原条目保持不变。', createInfo: '文件会在首次保存时创建；若同名文件已经存在，保存会被拒绝而不会覆盖原文件。', fileName: '文件名', fileNameHint: '使用字母、数字、点、下划线或连字符，不需要填写 .json5。', id: '配置 ID', idHint: 'ID 用于页面路由和其他配置引用；创建后仍可在表单中修改。', example: '例如 my-gallery-entry',
    },
    schema: {
      items: '{count} 项', item: '项目', add: '添加{item}', importImages: '批量导入图片',
      key: '键', value: '值', dragSort: '拖拽排序；Alt + 方向键也可排序', confirmDelete: '确定删除这个{item}吗？',
      imageDropTitle: '拖入多张图片快速建项',
      imageOnly: '这里只能批量导入图片文件。', importDone: '{count} 张图片已上传并创建条目；保存配置后写入引用', importFailed: '批量导入失败',
    },
    media: {
      none: '尚未选择', files: '{count} 个文件', noFiles: '尚未选择文件', uploadDestination: '拖入本机文件会保存到 {directory}',
      localUpload: '本机上传', localReplace: '本机替换', manager: '文件管理器', choose: '选择素材', replace: '替换素材',
      clear: '清除', remove: '移除', replaceShort: '替换', pathPlaceholder: '公开路径或外部 URL', addPath: '添加路径',
      pastePath: '也可粘贴公开路径或外部 URL', drop: '拖入{type}', image: '图片', file: '文件',
      dropHelp: '或点击从本机选择，也可打开文件管理器', release: '释放后上传并写入此字段',
      chooseFromManager: '从文件管理器选择', replaceFromManager: '从文件管理器替换', imageOnly: '这里仅接受图片文件。',
      uploadDone: '{count} 个文件已上传并加入当前字段；保存配置后写入引用', uploadFailed: '文件上传失败',
    },
    markdown: {
      heading: '标题', bold: '粗体', italic: '斜体', link: '链接', quote: '引用', unorderedList: '无序列表', code: '代码',
      insertImage: '插入图片', chooseImage: '从文件管理器选择图片', write: '编辑', split: '分栏', preview: '预览',
      fullscreen: '全屏编辑', exitFullscreen: '退出全屏', placeholder: '使用 Markdown 编写内容；可直接拖入多张图片…',
      uploading: '正在保存图片并插入正文…', stats: '{characters} 字符 · {words} 词', imageAlt: '图片说明',
      imageOnly: 'Markdown 编辑区只接收图片拖入。', uploadDone: '{count} 张图片已上传并插入正文', uploadFailed: '图片上传失败',
    },
    assets: {
      manager: '文件管理器', chooseFile: '选择文件', chooseFiles: '选择多个文件', allFiles: '所有文件', projectFolders: '项目目录',
      back: '后退', forward: '前进', up: '上一级', currentLocation: '当前位置', allDirectories: '所有管理目录',
      searchAll: '搜索所有文件', searchHere: '在当前位置及子目录中搜索', allTypes: '全部类型', image: '图片', audio: '音频', video: '视频', document: '文档', other: '其他',
      name: '名称', modified: '最近修改', size: '文件大小', grid: '网格视图', list: '详细列表', newFolder: '新建文件夹', uploadHere: '上传到此处',
      foldersAndFiles: '{folders} 个文件夹 · {files} 个文件', location: '位置', modifiedTime: '修改时间', noMatch: '当前位置没有匹配项', empty: '这个文件夹是空的', firstUpload: '上传第一个文件',
      dropTitle: '上传到 {directory}', dropBody: '松开即可保存文件', moveDropTitle: '将 {name} 移动到 {directory}', type: '类型', copyPath: '复制路径', moveRename: '移动或改名', selected: '已选择 {count} 项', useSelected: '使用所选文件', useCount: '使用 {count} 个文件',
      folderName: '文件夹名称', fileName: '文件名', destination: '目标文件夹', saveLocation: '保存位置',
      siteAssets: '站点素材', articleFiles: '文章文件', items: '{count} 项', selectedMark: '已选择',
      copyPublicPath: '复制公开路径', duplicate: '创建文件副本', moveRenameLong: '移动或重命名', permanentDelete: '永久删除', deleteEmptyFolder: '删除空文件夹', uploadCurrent: '上传到当前位置',
      openFolder: '打开文件夹', newChild: '在此新建文件夹', folderActions: '文件夹操作', fileActions: '文件操作',
      duplicateTitle: '创建文件副本', moveFolderTitle: '移动或重命名文件夹', moveFileTitle: '移动或重命名文件', moveWarning: '移动或改名不会自动修改配置中的旧路径引用。', destinationHint: '请从实际目录树中选择目标位置。', createCopy: '创建副本',
      loadFailed: '文件加载失败', noAccepted: '没有符合当前字段类型的文件。', uploadDone: '{count} 个文件已上传到 {directory}', uploadFailed: '上传失败', copied: '公开路径已复制', copyFailed: '无法写入剪贴板，请手动复制路径。', folderUpdated: '文件夹已更新为 {path}', fileUpdated: '文件已更新为 {path}', movedByDrag: '{name} 已移动到 {directory}；现有配置中的旧路径引用不会自动更新。',
      deleteFileTitle: '永久删除 {name}？', deleteFileBody: '将直接删除 {path}。已有配置中的路径引用不会自动移除。', deleted: '{name} 已删除', deleteFolderTitle: '删除空文件夹 {name}？', deleteFolderBody: '仅空文件夹可以删除；其中存在文件或子文件夹时操作会被拒绝。', deleteFolder: '删除文件夹', folderDeleteFailed: '文件夹删除失败', created: '已创建 {path}', folderCreateFailed: '文件夹创建失败',
    },
  },
  en: {
    ui: {
      language: 'Interface language', chinese: '简体中文', english: 'English', japanese: '日本語',
      close: 'Close', cancel: 'Cancel', create: 'Create', delete: 'Delete', refresh: 'Refresh', optional: 'Optional',
      saved: 'Saved', saveChanges: 'Save changes', unsaved: 'Unsaved', loadingFailed: 'Loading failed', operationFailed: 'Operation failed',
    },
    nav: {
      dashboard: 'Dashboard', open: 'Open navigation', expand: 'Expand navigation', collapse: 'Collapse navigation',
      preview: 'Open site preview', repositoryBound: 'Current repository', overview: 'Overview', assets: 'Assets', navigation: 'Admin navigation', close: 'Close navigation', adminCenter: 'Site administration',
    },
    dashboard: { connected: 'Local project connected', start: 'Manage content', availableAssets: 'Available assets', modules: 'Modules', moduleCount: '{count} modules' },
    sections: { content: 'Content', structure: 'Structure & relations', presentation: 'Site presentation', experience: 'Features & experience', integrations: 'Integrations' },
    resources: {
      gallery: { label: 'Gallery', singular: 'work', description: 'Works, image groups, artists, tags and character relations.' },
      articles: { label: 'Articles', singular: 'article', description: 'Body content, categories, cover images, publication dates and comments.' },
      profiles: { label: 'Character profiles', singular: 'profile', description: 'Characters, variants, artwork and information cards in a formal hierarchy.' },
      characters: { label: 'Character index', description: 'Shared character dictionary for the gallery and profiles.' }, tags: { label: 'Gallery tags', description: 'Tag hierarchy with prerequisites and restrictions.' },
      articleCategories: { label: 'Article categories', description: 'The category dictionary used by articles.' }, links: { label: 'Links', description: 'Link tags, categories, sites and display rules.' },
      personal: { label: 'Home & profile', description: 'Avatar, introduction, social links, backgrounds and actions.' }, app: { label: 'Site name & copyright', description: 'Page title and footer copyright text.' },
      html: { label: 'SEO & browser', description: 'Metadata, public URL, theme colors and icons.' }, languages: { label: 'Languages & fallback', description: 'Enabled languages, defaults and browser aliases.' }, articlesPage: { label: 'Article page cards', description: 'Information cards shown at the top of article pages.' },
      features: { label: 'Feature switches', description: 'Site modules and image viewer controls.' }, bgm: { label: 'Background music', description: 'Player behavior, tracks, covers and loop ranges.' }, live2d: { label: 'Live2D widget', description: 'Model, canvas placement and interactions.' }, live2dEngine: { label: 'Live2D runtime', description: 'Cubism Core runtime files.' },
      giscus: { label: 'Giscus comments', description: 'Repository, Discussion category and loading behavior.' }, fontawesome: { label: 'FontAwesome', description: 'Default icon pack and fallback icon.' }, sites: { label: 'Site recognition', description: 'Names and icon mappings for external domains.' },
    },
    editor: {
      contentLanguage: 'Content language', content: 'Configuration', siteConfig: 'Site settings', configFile: 'Config file',
      noFile: 'No file selected', fileActions: 'File actions', search: 'Search entries', selectEntry: 'Select an entry',
      newEntry: 'New', empty: 'No entries', refreshFiles: 'Refresh files', newFile: 'New config file',
    },
    files: {
      duplicateEntry: 'Duplicate entry', renameFile: 'Rename file', deletePermanently: 'Delete permanently', newTitle: 'New {item}', duplicateTitle: 'Duplicate {item}', renameTitle: 'Rename config file', startEditing: 'Start editing', createCopy: 'Create copy', rename: 'Rename',
      discardTitle: 'Discard unsaved changes?', discardBody: 'Changes in the current form will be lost when you leave.', discard: 'Discard changes', keepEditing: 'Keep editing', loadFailed: 'Could not load configuration', newPending: 'This entry has not been written to disk. Fill it out and save when ready.', created: 'Created {name}.json5', renamed: 'Renamed to {name}.json5', actionFailed: 'File action failed',
      deleteTitle: 'Delete {name}.json5 permanently?', deleteBody: 'The {item} configuration will be deleted directly from the repository and will not go to the Recycle Bin.', deleted: 'Deleted {name}.json5', deleteFailed: 'Delete failed', refreshed: 'File list refreshed', refreshFailed: 'Refresh failed', invalidId: 'Enter a valid unique ID before saving the new entry.', configSaved: 'Configuration saved', saveFailed: 'Save failed', initFailed: 'Could not initialize administration',
      renameInfo: 'Renaming changes only the JSON5 filename, not the configuration ID or references.', duplicateInfo: 'The copy uses a new filename and configuration ID; the original remains unchanged.', createInfo: 'The file is created on first save. An existing file will never be overwritten.', fileName: 'Filename', fileNameHint: 'Use letters, numbers, dots, underscores or hyphens; omit .json5.', id: 'Configuration ID', idHint: 'Used for page routes and references; it can still be edited in the form.', example: 'For example, my-gallery-entry',
    },
    schema: {
      items: '{count} items', item: 'item', add: 'Add {item}', importImages: 'Import images',
      key: 'Key', value: 'Value', dragSort: 'Drag to reorder; Alt + arrow keys also work', confirmDelete: 'Delete this {item}?',
      imageDropTitle: 'Drop images to create items',
      imageOnly: 'Only image files can be imported here.', importDone: '{count} images uploaded and added; save to write the references', importFailed: 'Import failed',
    },
    media: {
      none: 'Not selected', files: '{count} files', noFiles: 'No files selected', uploadDestination: 'Dropped files are saved to {directory}',
      localUpload: 'Upload', localReplace: 'Replace file', manager: 'File manager', choose: 'Choose asset', replace: 'Replace asset',
      clear: 'Clear', remove: 'Remove', replaceShort: 'Replace', pathPlaceholder: 'Public path or external URL', addPath: 'Add path',
      pastePath: 'Paste a public path or external URL', drop: 'Drop {type}', image: 'images', file: 'files',
      dropHelp: 'or choose local files or open the file manager', release: 'Release to upload into this field',
      chooseFromManager: 'Choose from file manager', replaceFromManager: 'Replace from file manager', imageOnly: 'Only image files are accepted here.',
      uploadDone: '{count} files uploaded and added; save to write the references', uploadFailed: 'Upload failed',
    },
    markdown: {
      heading: 'Heading', bold: 'Bold', italic: 'Italic', link: 'Link', quote: 'Quote', unorderedList: 'Bulleted list', code: 'Code',
      insertImage: 'Insert image', chooseImage: 'Choose images from file manager', write: 'Write', split: 'Split', preview: 'Preview',
      fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', placeholder: 'Write Markdown here; you can also drop multiple images…',
      uploading: 'Saving and inserting images…', stats: '{characters} characters · {words} words', imageAlt: 'Image description',
      imageOnly: 'The Markdown editor only accepts dropped images.', uploadDone: '{count} images uploaded and inserted', uploadFailed: 'Image upload failed',
    },
    assets: {
      manager: 'File manager', chooseFile: 'Choose file', chooseFiles: 'Choose files', allFiles: 'All files', projectFolders: 'Project folders',
      back: 'Back', forward: 'Forward', up: 'Up one level', currentLocation: 'Current location', allDirectories: 'All managed folders',
      searchAll: 'Search all files', searchHere: 'Search here and in subfolders', allTypes: 'All types', image: 'Images', audio: 'Audio', video: 'Video', document: 'Documents', other: 'Other',
      name: 'Name', modified: 'Recently modified', size: 'File size', grid: 'Grid view', list: 'List view', newFolder: 'New folder', uploadHere: 'Upload here',
      foldersAndFiles: '{folders} folders · {files} files', location: 'Location', modifiedTime: 'Modified', noMatch: 'No matching items here', empty: 'This folder is empty', firstUpload: 'Upload the first file',
      dropTitle: 'Upload to {directory}', dropBody: 'Release to save files', moveDropTitle: 'Move {name} to {directory}', type: 'Type', copyPath: 'Copy path', moveRename: 'Move or rename', selected: '{count} selected', useSelected: 'Use selected file', useCount: 'Use {count} files',
      folderName: 'Folder name', fileName: 'File name', destination: 'Destination folder', saveLocation: 'Save location',
      siteAssets: 'Site assets', articleFiles: 'Article files', items: '{count} items', selectedMark: 'Selected',
      copyPublicPath: 'Copy public path', duplicate: 'Duplicate file', moveRenameLong: 'Move or rename', permanentDelete: 'Delete permanently', deleteEmptyFolder: 'Delete empty folder', uploadCurrent: 'Upload to current folder',
      openFolder: 'Open folder', newChild: 'New folder here', folderActions: 'Folder actions', fileActions: 'File actions',
      duplicateTitle: 'Duplicate file', moveFolderTitle: 'Move or rename folder', moveFileTitle: 'Move or rename file', moveWarning: 'Moving or renaming does not update existing path references in configuration.', destinationHint: 'Choose a destination from the actual folder tree.', createCopy: 'Create copy',
      loadFailed: 'Could not load files', noAccepted: 'No files match this field type.', uploadDone: '{count} files uploaded to {directory}', uploadFailed: 'Upload failed', copied: 'Public path copied', copyFailed: 'Could not write to the clipboard. Copy the path manually.', folderUpdated: 'Folder updated to {path}', fileUpdated: 'File updated to {path}', movedByDrag: '{name} was moved to {directory}. Existing configuration references were not updated.',
      deleteFileTitle: 'Delete {name} permanently?', deleteFileBody: '{path} will be deleted directly. Existing configuration references will not be removed.', deleted: 'Deleted {name}', deleteFolderTitle: 'Delete empty folder {name}?', deleteFolderBody: 'Only empty folders can be deleted. The action is rejected if files or subfolders exist.', deleteFolder: 'Delete folder', folderDeleteFailed: 'Could not delete folder', created: 'Created {path}', folderCreateFailed: 'Could not create folder',
    },
  },
  jp: {
    ui: {
      language: '表示言語', chinese: '简体中文', english: 'English', japanese: '日本語',
      close: '閉じる', cancel: 'キャンセル', create: '作成', delete: '削除', refresh: '更新', optional: '任意',
      saved: '保存済み', saveChanges: '変更を保存', unsaved: '未保存', loadingFailed: '読み込みに失敗しました', operationFailed: '操作に失敗しました',
    },
    nav: {
      dashboard: '管理ダッシュボード', open: 'ナビゲーションを開く', expand: 'ナビゲーションを展開', collapse: 'ナビゲーションを折りたたむ',
      preview: 'サイトをプレビュー', repositoryBound: '現在のリポジトリ', overview: '概要', assets: '素材', navigation: '管理ナビゲーション', close: 'ナビゲーションを閉じる', adminCenter: 'サイト管理',
    },
    dashboard: { connected: 'ローカルプロジェクト接続済み', start: 'コンテンツを管理', availableAssets: '利用可能な素材', modules: '管理モジュール', moduleCount: '{count} モジュール' },
    sections: { content: 'コンテンツ管理', structure: '構造と関連付け', presentation: 'サイト表示', experience: '機能と操作性', integrations: '外部連携' },
    resources: {
      gallery: { label: 'ギャラリー', singular: '作品', description: '作品、画像グループ、作者、タグ、キャラクター関連を管理します。' },
      articles: { label: '記事', singular: '記事', description: '本文、カテゴリ、カバー、公開日、コメント設定を管理します。' },
      profiles: { label: 'キャラクター資料', singular: 'キャラクター資料', description: 'キャラクター、差分、立ち絵、情報カードを階層管理します。' },
      characters: { label: 'キャラクター索引', description: 'ギャラリーと資料で共有するキャラクター辞書です。' }, tags: { label: 'ギャラリータグ', description: '前提関係と制限を持つタグ体系です。' },
      articleCategories: { label: '記事カテゴリ', description: '記事で使用するカテゴリ辞書です。' }, links: { label: 'リンク管理', description: 'リンクのタグ、カテゴリ、サイト、表示規則を管理します。' },
      personal: { label: 'ホームとプロフィール', description: 'アバター、紹介、SNSリンク、背景、操作ボタンを管理します。' }, app: { label: 'サイト名と著作権', description: 'ページタイトルとフッターの著作権表記です。' },
      html: { label: 'SEO とブラウザー', description: 'メタ情報、公開 URL、テーマ色、アイコンを管理します。' }, languages: { label: '言語とフォールバック', description: '有効言語、既定言語、ブラウザー別名を管理します。' }, articlesPage: { label: '記事ページカード', description: '記事ページ上部の情報カードです。' },
      features: { label: '機能スイッチ', description: 'サイト機能と画像ビューアー UI を管理します。' }, bgm: { label: 'BGM', description: 'プレイヤー動作、曲、カバー、ループ区間を管理します。' }, live2d: { label: 'Live2D ウィジェット', description: 'モデル、キャンバス位置、操作を管理します。' }, live2dEngine: { label: 'Live2D ランタイム', description: 'Cubism Core のランタイムファイルです。' },
      giscus: { label: 'Giscus コメント', description: 'リポジトリ、Discussion カテゴリ、読み込み方法を管理します。' }, fontawesome: { label: 'FontAwesome', description: '既定アイコンパックとフォールバックアイコンです。' }, sites: { label: 'サイト識別規則', description: '外部ドメインの表示名とアイコン対応を管理します。' },
    },
    editor: {
      contentLanguage: '編集する言語', content: '設定内容', siteConfig: 'サイト設定', configFile: '設定ファイル',
      noFile: 'ファイル未選択', fileActions: 'ファイル操作', search: '項目を検索', selectEntry: '編集項目を選択',
      newEntry: '新規', empty: '項目がありません', refreshFiles: 'ファイル一覧を更新', newFile: '設定ファイルを作成',
    },
    files: {
      duplicateEntry: '項目を複製', renameFile: 'ファイル名を変更', deletePermanently: '完全に削除', newTitle: '{item}を新規作成', duplicateTitle: '{item}を複製', renameTitle: '設定ファイル名を変更', startEditing: '編集を開始', createCopy: 'コピーを作成', rename: '名前を変更',
      discardTitle: '未保存の変更を破棄しますか？', discardBody: 'ページを移動すると現在のフォームの変更は失われます。', discard: '変更を破棄', keepEditing: '編集を続ける', loadFailed: '設定の読み込みに失敗しました', newPending: '新しい項目はまだ保存されていません。入力後に保存してください。', created: '{name}.json5 を作成しました', renamed: '{name}.json5 に変更しました', actionFailed: 'ファイル操作に失敗しました',
      deleteTitle: '{name}.json5 を完全に削除しますか？', deleteBody: '{item}の設定をリポジトリから直接削除します。ごみ箱には入りません。', deleted: '{name}.json5 を削除しました', deleteFailed: '削除に失敗しました', refreshed: 'ファイル一覧を更新しました', refreshFailed: '更新に失敗しました', invalidId: '有効な一意 ID を入力してから保存してください。', configSaved: '設定を保存しました', saveFailed: '保存に失敗しました', initFailed: '管理画面の初期化に失敗しました',
      renameInfo: '名前変更は JSON5 ファイル名のみを変更し、設定 ID や参照は変更しません。', duplicateInfo: '新しいファイル名と設定 ID で複製し、元の項目は変更しません。', createInfo: '初回保存時に作成します。同名ファイルがある場合は上書きせず拒否します。', fileName: 'ファイル名', fileNameHint: '英数字、ピリオド、アンダースコア、ハイフンを使用し、.json5 は省略します。', id: '設定 ID', idHint: 'ページルートや参照に使用します。作成後もフォームから変更できます。', example: '例: my-gallery-entry',
    },
    schema: {
      items: '{count} 件', item: '項目', add: '{item}を追加', importImages: '画像を一括追加',
      key: 'キー', value: '値', dragSort: 'ドラッグで並べ替え（Alt + 矢印キーも使用可能）', confirmDelete: 'この{item}を削除しますか？',
      imageDropTitle: '画像をドロップして項目を作成',
      imageOnly: 'ここでは画像ファイルのみ追加できます。', importDone: '{count} 枚の画像を追加しました。保存すると参照が書き込まれます', importFailed: '一括追加に失敗しました',
    },
    media: {
      none: '未選択', files: '{count} ファイル', noFiles: 'ファイル未選択', uploadDestination: 'ドロップしたファイルは {directory} に保存されます',
      localUpload: 'アップロード', localReplace: 'ファイルを置換', manager: 'ファイル管理', choose: '素材を選択', replace: '素材を置換',
      clear: 'クリア', remove: '削除', replaceShort: '置換', pathPlaceholder: '公開パスまたは外部 URL', addPath: 'パスを追加',
      pastePath: '公開パスまたは外部 URL を貼り付け', drop: '{type}をドロップ', image: '画像', file: 'ファイル',
      dropHelp: 'またはローカルから選択／ファイル管理を開く', release: '離すとこの項目にアップロードします',
      chooseFromManager: 'ファイル管理から選択', replaceFromManager: 'ファイル管理から置換', imageOnly: 'ここでは画像ファイルのみ使用できます。',
      uploadDone: '{count} ファイルを追加しました。保存すると参照が書き込まれます', uploadFailed: 'アップロードに失敗しました',
    },
    markdown: {
      heading: '見出し', bold: '太字', italic: '斜体', link: 'リンク', quote: '引用', unorderedList: '箇条書き', code: 'コード',
      insertImage: '画像を挿入', chooseImage: 'ファイル管理から画像を選択', write: '編集', split: '分割', preview: 'プレビュー',
      fullscreen: '全画面編集', exitFullscreen: '全画面を終了', placeholder: 'Markdown を入力；複数画像のドロップにも対応…',
      uploading: '画像を保存して本文に挿入しています…', stats: '{characters} 文字 · {words} 語', imageAlt: '画像の説明',
      imageOnly: 'Markdown エディターには画像のみドロップできます。', uploadDone: '{count} 枚の画像をアップロードして挿入しました', uploadFailed: '画像のアップロードに失敗しました',
    },
    assets: {
      manager: 'ファイル管理', chooseFile: 'ファイルを選択', chooseFiles: '複数ファイルを選択', allFiles: 'すべてのファイル', projectFolders: 'プロジェクトフォルダー',
      back: '戻る', forward: '進む', up: '上へ', currentLocation: '現在の場所', allDirectories: 'すべての管理フォルダー',
      searchAll: 'すべてのファイルを検索', searchHere: '現在地とサブフォルダーを検索', allTypes: 'すべての種類', image: '画像', audio: '音声', video: '動画', document: '文書', other: 'その他',
      name: '名前', modified: '更新日時', size: 'ファイルサイズ', grid: 'グリッド表示', list: 'リスト表示', newFolder: '新規フォルダー', uploadHere: 'ここにアップロード',
      foldersAndFiles: '{folders} フォルダー · {files} ファイル', location: '場所', modifiedTime: '更新日時', noMatch: '一致する項目がありません', empty: 'このフォルダーは空です', firstUpload: '最初のファイルを追加',
      dropTitle: '{directory} にアップロード', dropBody: '離すと保存します', moveDropTitle: '{name} を {directory} に移動', type: '種類', copyPath: 'パスをコピー', moveRename: '移動または名前変更', selected: '{count} 件選択', useSelected: '選択したファイルを使用', useCount: '{count} ファイルを使用',
      folderName: 'フォルダー名', fileName: 'ファイル名', destination: '移動先フォルダー', saveLocation: '保存先を確定',
      siteAssets: 'サイト素材', articleFiles: '記事ファイル', items: '{count} 件', selectedMark: '選択済み',
      copyPublicPath: '公開パスをコピー', duplicate: 'ファイルを複製', moveRenameLong: '移動または名前変更', permanentDelete: '完全に削除', deleteEmptyFolder: '空のフォルダーを削除', uploadCurrent: '現在地にアップロード',
      openFolder: 'フォルダーを開く', newChild: 'ここに新規フォルダー', folderActions: 'フォルダー操作', fileActions: 'ファイル操作',
      duplicateTitle: 'ファイルを複製', moveFolderTitle: 'フォルダーを移動または名前変更', moveFileTitle: 'ファイルを移動または名前変更', moveWarning: '移動や名前変更をしても、設定内の既存パス参照は更新されません。', destinationHint: '実際のフォルダーツリーから移動先を選択してください。', createCopy: 'コピーを作成',
      loadFailed: 'ファイルの読み込みに失敗しました', noAccepted: 'この項目で使用できるファイルがありません。', uploadDone: '{count} ファイルを {directory} に追加しました', uploadFailed: 'アップロードに失敗しました', copied: '公開パスをコピーしました', copyFailed: 'クリップボードに書き込めません。手動でパスをコピーしてください。', folderUpdated: 'フォルダーを {path} に更新しました', fileUpdated: 'ファイルを {path} に更新しました', movedByDrag: '{name} を {directory} に移動しました。設定内の既存パス参照は更新されません。',
      deleteFileTitle: '{name} を完全に削除しますか？', deleteFileBody: '{path} を直接削除します。設定内の既存参照は削除されません。', deleted: '{name} を削除しました', deleteFolderTitle: '空のフォルダー {name} を削除しますか？', deleteFolderBody: '空のフォルダーのみ削除できます。ファイルやサブフォルダーがある場合は拒否されます。', deleteFolder: 'フォルダーを削除', folderDeleteFailed: 'フォルダーの削除に失敗しました', created: '{path} を作成しました', folderCreateFailed: 'フォルダー作成に失敗しました',
    },
  },
};

const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem('admin-ui-locale');
const siteLocale = typeof localStorage === 'undefined' ? null : localStorage.getItem('locale');
const browserLocale = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
const initialLocale: AdminUiLocale = stored === 'en' || stored === 'jp' || stored === 'zh'
  ? stored
  : siteLocale === 'en' || siteLocale === 'jp' || siteLocale === 'zh'
    ? siteLocale
    : browserLocale.startsWith('ja') ? 'jp' : browserLocale.startsWith('en') ? 'en' : 'zh';

const adminI18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'zh',
  messages,
});

export default adminI18n;
