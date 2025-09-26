import * as monaco from 'monaco-editor';
import { ref, onBeforeUnmount, type Ref } from 'vue';

import monacoConfig from '@/config/monaco-editor.json';
import { useAppStore } from '@/stores/app';

// ���Ͷ���
type AbortControllerType = {
  signal: { aborted: boolean };
  abort(): void;
};

export interface MonacoEditorOptions {
  language?: keyof typeof monacoConfig.languageConfigs;
  theme?: keyof typeof monacoConfig.themes;
  value?: string;
  readOnly?: boolean;
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  quickSuggestions?: boolean;
  suggestOnTriggerCharacters?: boolean;
  acceptSuggestionOnEnter?: 'on' | 'off' | 'smart';
  showToolbar?: boolean;
  toolbarOptions?: {
    showUndoRedo?: boolean;
    showFormat?: boolean;
    showCopy?: boolean;
    showFindReplace?: boolean;
    showThemeToggle?: boolean;
    showReadOnlyToggle?: boolean;
    showMinimapToggle?: boolean;
    showWordWrapToggle?: boolean;
    showLineNumbersToggle?: boolean;
    showFontSizeControls?: boolean;
  };
  [key: string]: any;
}

export interface MonacoEditorInstance {
  editor: Ref<monaco.editor.IStandaloneCodeEditor | null>;
  container: Ref<HTMLElement | null>;
  abortController: AbortControllerType | null;
  isReady: Ref<boolean>;
  isDisposed: Ref<boolean>;
  initialize: (container: HTMLElement, options?: MonacoEditorOptions) => void;
  dispose: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  format: () => void;
  copyToClipboard: () => Promise<void>;
  focus: () => void;
  setReadOnly: (readOnly: boolean) => void;
  setTheme: (theme: keyof typeof monacoConfig.themes) => void;
  setLanguage: (language: keyof typeof monacoConfig.languageConfigs) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  find: () => void;
  replace: () => void;
  toggleMinimap: () => void;
  toggleWordWrap: () => void;
  toggleLineNumbers: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  getFontSize: () => number;
  setFontSize: (size: number) => void;
  getWordWrap: () => string;
  getMinimapEnabled: () => boolean;
  getLineNumbersEnabled: () => boolean;
}

export function useMonacoEditor(): MonacoEditorInstance {
  const container = ref<HTMLElement | null>(null);
  const editor = ref<monaco.editor.IStandaloneCodeEditor | null>(null);
  const abortController = ref<AbortControllerType | null>(null);
  const isReady = ref(false);
  const isDisposed = ref(false);

  // ʹ�����е�����ϵͳ
  const appStore = useAppStore();

  // ��ȡ��������
  const getLanguageConfig = (language: keyof typeof monacoConfig.languageConfigs): any => {
    return monacoConfig.languageConfigs[language] || monacoConfig.languageConfigs.json;
  };

  // ����Monaco����
  const getMonacoTheme = (options: MonacoEditorOptions = {}): string => {
    if (options.theme) {
      return monacoConfig.themes[options.theme] || options.theme;
    }

    // ʹ��Ӧ�õ�����
    const appTheme = appStore.themeMode;
    if (appTheme === 'auto') {
      return appStore.isDarkMode ? 'vs-dark' : 'vs-light';
    }
    return monacoConfig.themeMapping[appTheme] || 'vs-dark';
  };

  // �ϲ�����ѡ��
  const mergeOptions = (options: MonacoEditorOptions = {}): monaco.editor.IStandaloneEditorConstructionOptions => {
    const languageConfig = getLanguageConfig(options.language || 'json');
    const monacoTheme = getMonacoTheme(options);

    return {
      ...monacoConfig.defaultOptions,
      ...languageConfig,
      ...options,
      theme: monacoTheme,
      lineNumbers: options.showLineNumbers ? 'on' : 'off',
    } as monaco.editor.IStandaloneEditorConstructionOptions;
  };

  // ��ʼ���༭��
  const initialize = (containerElement: HTMLElement, options: MonacoEditorOptions = {}): void => {
    if (!containerElement || isDisposed.value) return;

    try {
      // ����AbortController
      abortController.value = new window.AbortController() as AbortControllerType;

      // �ϲ�����
      const editorOptions = mergeOptions(options);

      // �����༭��
      editor.value = monaco.editor.create(containerElement, editorOptions);

      // ������������
      container.value = containerElement;
      isReady.value = true;
      isDisposed.value = false;
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      editor.value = null;
      isReady.value = false;
    }
  };

  // ���ٱ༭��
  const dispose = (): void => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }

    if (editor.value && !isDisposed.value) {
      try {
        const model = editor.value.getModel();
        if (model) {
          model.dispose();
        }
        editor.value.dispose();
        editor.value = null;
        isReady.value = false;
        isDisposed.value = true;
      } catch (error) {
        console.warn('Monaco Editor dispose warning:', error);
        editor.value = null;
        isReady.value = false;
        isDisposed.value = true;
      }
    }
  };

  // ��ȡ�༭��ֵ
  const getValue = (): string => {
    return editor.value?.getValue() || '';
  };

  // ���ñ༭��ֵ
  const setValue = (value: string): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.setValue(value);
    }
  };

  // ��ʽ������
  const format = (): void => {
    if (!editor.value || isDisposed.value || abortController.value?.signal.aborted) return;

    try {
      const content = editor.value.getValue();
      const language = editor.value.getModel()?.getLanguageId();

      if (language === 'json') {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        editor.value.setValue(formatted);
      } else {
        // ʹ��Monaco Editor�ĸ�ʽ������
        editor.value.getAction('editor.action.formatDocument')?.run();
      }
    } catch (error) {
      console.error('Failed to format code:', error);
    }
  };

  // ���Ƶ�������
  const copyToClipboard = async (): Promise<void> => {
    if (!editor.value || isDisposed.value || abortController.value?.signal.aborted) return;

    const content = editor.value.getValue();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        if (editor.value && !abortController.value?.signal.aborted) {
          editor.value.focus();
          editor.value.setSelection(
            editor.value.getModel()?.getFullModelRange()
            || new monaco.Range(1, 1, 1, 1),
          );
          document.execCommand('copy');
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // �۽��༭��
  const focus = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.focus();
    }
  };

  // ����ֻ��ģʽ
  const setReadOnly = (readOnly: boolean): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.updateOptions({ readOnly });
    }
  };

  // ��������
  const setTheme = (theme: keyof typeof monacoConfig.themes): void => {
    if (editor.value && !isDisposed.value) {
      const themeValue = monacoConfig.themes[theme] || theme;
      editor.value.updateOptions({ theme: themeValue });
    }
  };

  // ��������
  const setLanguage = (language: keyof typeof monacoConfig.languageConfigs): void => {
    if (editor.value && !isDisposed.value) {
      const languageConfig = getLanguageConfig(language);
      const model = editor.value.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageConfig.language);
      }
    }
  };

  // ��������
  const undo = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.trigger('keyboard', 'undo', null);
    }
  };

  // ��������
  const redo = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.trigger('keyboard', 'redo', null);
    }
  };

  // ����Ƿ���Գ���
  const canUndo = (): boolean => {
    return editor.value?.getAction('undo')?.isSupported() || false;
  };

  // ����Ƿ��������
  const canRedo = (): boolean => {
    return editor.value?.getAction('redo')?.isSupported() || false;
  };

  // ����
  const find = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.getAction('actions.find')?.run();
    }
  };

  // �滻
  const replace = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.getAction('editor.action.startFindReplaceAction')?.run();
    }
  };

  // �л�С��ͼ
  const toggleMinimap = (): void => {
    if (editor.value && !isDisposed.value) {
      const current = editor.value.getOption(monaco.editor.EditorOption.minimap);
      editor.value.updateOptions({ minimap: { enabled: !current.enabled } });
    }
  };

  // �л��Զ�����
  const toggleWordWrap = (): void => {
    if (editor.value && !isDisposed.value) {
      const current = editor.value.getOption(monaco.editor.EditorOption.wordWrap);
      const newValue = current === 'on' ? 'off' : 'on';
      editor.value.updateOptions({ wordWrap: newValue });
    }
  };

  // �л��к�
  const toggleLineNumbers = (): void => {
    if (editor.value && !isDisposed.value) {
      const current = editor.value.getOption(monaco.editor.EditorOption.lineNumbers);
      const isEnabled = current?.renderType === monaco.editor.RenderLineNumbersType.On || false;
      const newValue: monaco.editor.LineNumbersType = isEnabled ? 'off' : 'on';
      editor.value.updateOptions({ lineNumbers: newValue });
    }
  };

  // ���������С
  const increaseFontSize = (): void => {
    if (editor.value && !isDisposed.value) {
      const current = editor.value.getOption(monaco.editor.EditorOption.fontSize);
      editor.value.updateOptions({ fontSize: Math.min(current + 2, 24) });
    }
  };

  // ���������С
  const decreaseFontSize = (): void => {
    if (editor.value && !isDisposed.value) {
      const current = editor.value.getOption(monaco.editor.EditorOption.fontSize);
      editor.value.updateOptions({ fontSize: Math.max(current - 2, 8) });
    }
  };

  // ���������С
  const resetFontSize = (): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.updateOptions({ fontSize: 14 });
    }
  };

  // ��ȡ�����С
  const getFontSize = (): number => {
    return editor.value?.getOption(monaco.editor.EditorOption.fontSize) || 14;
  };

  // ���������С
  const setFontSize = (size: number): void => {
    if (editor.value && !isDisposed.value) {
      editor.value.updateOptions({ fontSize: Math.max(8, Math.min(24, size)) });
    }
  };

  // ��ȡ�Զ�����״̬
  const getWordWrap = (): string => {
    return editor.value?.getOption(monaco.editor.EditorOption.wordWrap) || 'on';
  };

  // ��ȡС��ͼ״̬
  const getMinimapEnabled = (): boolean => {
    return editor.value?.getOption(monaco.editor.EditorOption.minimap).enabled || false;
  };

  // ��ȡ�к�״̬
  const getLineNumbersEnabled = (): boolean => {
    const lineNumbers = editor.value?.getOption(monaco.editor.EditorOption.lineNumbers);
    return lineNumbers?.renderType === monaco.editor.RenderLineNumbersType.On || false;
  };

  // �������ʱ�Զ�����
  onBeforeUnmount(() => {
    dispose();
  });

  return {
    editor,
    container,
    abortController: abortController.value,
    isReady,
    isDisposed,
    initialize,
    dispose,
    getValue,
    setValue,
    format,
    copyToClipboard,
    focus,
    setReadOnly,
    setTheme,
    setLanguage,
    undo,
    redo,
    canUndo,
    canRedo,
    find,
    replace,
    toggleMinimap,
    toggleWordWrap,
    toggleLineNumbers,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    getFontSize,
    setFontSize,
    getWordWrap,
    getMinimapEnabled,
    getLineNumbersEnabled,
  };
}
