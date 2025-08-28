import { config } from '../data/config';

export class PersonalInfo {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init(): void {
    this.setupPersonalInfo();
  }

  private setupPersonalInfo(): void {
    const { personal } = config;

    const avatar = this.container.querySelector('#avatar') as HTMLImageElement;
    if (avatar) {
      avatar.src = personal.avatar;
      avatar.alt = personal.name;

      avatar.onerror = () => {
        avatar.style.display = 'none';
        console.warn('头像图片加载失败:', personal.avatar);
      };
    }

    const nameEl = this.container.querySelector('#name') as HTMLElement;
    if (nameEl) {
      nameEl.textContent = personal.name;
    }

    const descEl = this.container.querySelector('#description') as HTMLElement;
    if (descEl) {
      // 清空现有内容
      descEl.innerHTML = '';
      
      // 处理多行描述
      personal.description.forEach((line, index) => {
        if (line.trim() === '') {
          // 空行添加换行符
          descEl.appendChild(document.createElement('br'));
        } else if (line.startsWith('==') && line.endsWith('==')) {
          // 标题行使用特殊样式
          const titleEl = document.createElement('div');
          titleEl.textContent = line.replace(/==/g, '').trim();
          titleEl.className = 'description-title';
          descEl.appendChild(titleEl);
        } else {
          // 普通文本行
          const lineEl = document.createElement('div');
          lineEl.textContent = line;
          lineEl.className = 'description-line';
          descEl.appendChild(lineEl);
        }
      });
    }

    const linksEl = this.container.querySelector('#links') as HTMLElement;
    if (linksEl) {
      linksEl.innerHTML = '';
      personal.links.forEach(link => {
        const linkEl = document.createElement('a');
        linkEl.href = link.url;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        linkEl.className = 'social-link';
        linkEl.setAttribute('aria-label', `访问 ${link.name}`);

        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = link.icon || '';
        iconSpan.className = 'social-icon';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = link.name;
        nameSpan.className = 'social-name';

        linkEl.appendChild(iconSpan);
        linkEl.appendChild(nameSpan);

        linkEl.addEventListener('click', () => {
          console.log(`点击了社交链接: ${link.name}`);
        });

        linksEl.appendChild(linkEl);
      });
    }
  }

  public updatePersonalInfo(newPersonalInfo: typeof config.personal): void {
    console.log('更新个人信息:', newPersonalInfo);
  }

  public playIntroAnimation(): void {
    const elements = this.container.querySelectorAll('.personal-container > *');
    elements.forEach((el, index) => {
      const element = el as HTMLElement;

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 150 + 100);
    });
  }
} 