export interface PersonalInfo {
  avatar: string;
  name: string;
  description: string[];
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}

export interface CharacterImage {
  name: string;
  description: string;
  src: string;
}

export interface Character {
  id: string;
  name: string;
  images: CharacterImage[];
}

export interface SiteConfig {
  personal: PersonalInfo;
  characters: Character[];
}

export const config: SiteConfig = {
  personal: {
    avatar: './assets/avatar.png',
    name: 'OLC',
    description: [
      '无聊的摸鱼人',
      '',
      '== 常用ID ==',
      'OLC',
      'BAKAOLC',
      '律影映幻',
      'Ritsukage Utsumabo',
    ],
    links: [
      {
        name: 'Bilibili',
        url: 'https://space.bilibili.com/3818840',
        icon: '<i class="fa fa-play-circle"></i>'
      },
      {
        name: 'X',
        url: 'https://x.com/BAKAOLC',
        icon: '<i class="fa fa-twitter"></i>'
      },
      {
        name: 'Steam',
        url: 'https://steamcommunity.com/id/BAKAOLC/',
        icon: '<i class="fa fa-steam-square"></i>'
      },
      {
        name: 'GitHub',
        url: 'https://github.com/BAKAOLC',
        icon: '<i class="fa fa-github"></i>'
      },
      {
        name: 'QQ',
        url: 'https://qm.qq.com/q/PSo9Ks06K4&personal_qrcode_source=4',
        icon: '<i class="fa fa-qq"></i>'
      },
      {
        name: 'Mail',
        url: 'mailto:utsumabo@ritsukage.com',
        icon: '<i class="fa fa-envelope"></i>'
      },
    ]
  },
  characters: [
    {
      id: 'ritsukage-utsumabo-design',
      name: '律影映幻 设定三视图',
      images: [
        {
          name: '普通形态',
          description: '律影映幻的普通形态，画师：橙灵光',
          src: './assets/catagory/ritsukage-utsumabo/design/1.png'
        },
        {
          name: '猫猫形态',
          description: '律影映幻的猫猫形态，画师：橙灵光',
          src: './assets/catagory/ritsukage-utsumabo/design/2.png'
        },
      ]
    },
    {
      id: 'ritsukage-utsumabo-wallpaper',
      name: '律影映幻 壁纸',
      images: [
        {
          name: '废土',
          description: '作者：木月',
          src: './assets/catagory/ritsukage-utsumabo/wallpaper/1.png'
        },
        {
          name: '天空',
          description: '作者：破皮皮',
          src: './assets/catagory/ritsukage-utsumabo/wallpaper/2.png'
        },
        {
          name: '卧室 (通常)',
          description: '作者：Re-ViVi',
          src: './assets/catagory/ritsukage-utsumabo/wallpaper/3-1.png'
        },
        {
          name: '卧室 (丝带)',
          description: '作者：Re-ViVi',
          src: './assets/catagory/ritsukage-utsumabo/wallpaper/3-2.png'
        },
      ]
    },
    {
      id: 'ritsukage-utsumabo-miscellaneous',
      name: '律影映幻 杂图',
      images: [
        {
          name: '初始设定图',
          description: '作者：ID',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/original.png'
        },
        {
          name: 'プシュケーLo-1',
          description: '作者：プシュケーLo',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-1.png'
        },
        {
          name: 'プシュケーLo-2',
          description: '作者：プシュケーLo',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-2.png'
        },
        {
          name: 'プシュケーLo-3',
          description: '作者：プシュケーLo',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-3.png'
        },
        {
          name: '柠檬水',
          description: '作者：江欣',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/柠檬水小律影.png'
        },
        {
          name: '流月绘',
          description: '作者：流月',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/流月绘.jpg'
        },
        {
          name: '半挂赠图',
          description: '作者：半挂',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/半挂绘.jpg'
        },
        {
          name: '雾酱赠图',
          description: '作者：霧鈴桐喻',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/雾酱绘.png'
        },
        {
          name: '浴衣',
          description: '作者：霧鈴桐喻',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/雾酱绘浴衣律影.jpg'
        },
        {
          name: 'BUG 律影',
          description: '作者：霧鈴桐喻',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/BUG 律影.png'
        },
        {
          name: '青空之影',
          description: '作者：霧鈴桐喻',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/青空之影.jpg'
        },
        {
          name: '喵叽赠图',
          description: '作者：喵叽',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/喵叽绘.jpg'
        },
        {
          name: '公园律影',
          description: '作者：hiyakata',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/公园律影.png'
        },
        {
          name: '阳光',
          description: '作者：猫村ゆゆこ',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/阳光律影.png'
        },
        {
          name: '塔罗牌 女皇',
          description: '作者：栗粟Liz',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/塔罗牌 女皇 律影.jpg'
        },
        {
          name: '阿巴阿巴小律影',
          description: '作者：点炮叉腰姬',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/阿巴阿巴小律影.png'
        },
        {
          name: '软软猫律影',
          description: '作者：ちゅばき',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/软软猫律影.png'
        },
        {
          name: '速绘小律影头',
          description: '作者：Twuos',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/速绘小律影头.png'
        },
        {
          name: '哇小律影',
          description: '作者：樱井纱奈',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/哇小律影.png'
        },
        {
          name: '蓝蓝的小律影',
          description: '作者：いーたん＆mikokoたん',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/蓝蓝的小律影.png'
        },
        {
          name: '新年头像',
          description: '作者：花本',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/新年头像.png'
        },
        {
          name: 'Q版小律影',
          description: '作者：岚舞',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-1.png'
        },
        {
          name: 'Q版小律影',
          description: '作者：獭祭',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-2.png'
        },
        {
          name: 'Q版小律影',
          description: '作者：米白勺子',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-3.png'
        },
        {
          name: '小律影打卡',
          description: '作者：再来两笼奶包',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/小律影打卡.gif'
        },
        {
          name: '打拳表情包',
          description: '作者：空酱',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/打拳表情包.png'
        },
        {
          name: 'Miya绘',
          description: '作者：喵田弥夜Miya',
          src: './assets/catagory/ritsukage-utsumabo/miscellaneous/Miya绘.jpg'
        },

      ]
    }
  ]
}; 