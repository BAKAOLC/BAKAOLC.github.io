export interface LoadingConfig {
  title: string;
  subtitle: string;
  duration: {
    minLoadTime: number;
    progressSpeed: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customMessages: string[];
}

export const loadingConfig: LoadingConfig = {
  title: '律影映幻',
  subtitle: 'Loading...',
  duration: {
    minLoadTime: 2000,
    progressSpeed: 50
  },
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#ffffff'
  },
  customMessages: [
    '正在思考人生...',
    '正在殴打界面直到它自动显示出来...',
    '正在抓捕迟到的鸽子...',
    '即将放飞自我...',
  ]
};

export function getRandomLoadingMessage(): string {
  const messages = loadingConfig.customMessages;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
} 