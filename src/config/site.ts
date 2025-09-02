import type { SiteConfig } from '@/types'

export const siteConfig: SiteConfig = {
  personal: {
    avatar: '/assets/avatar.png',
    name: {
      en: 'OLC',
      zh: 'OLC',
      jp: 'OLC'
    },
    description: [
      {
        en: 'A person who is bored and likes to doodle',
        zh: '一个无聊喜欢摸鱼的人',
        jp: '暇で落書きが好きな人'
      },
      {
        en: '',
        zh: '',
        jp: ''
      },
      {
        en: '== Common IDs ==',
        zh: '== 常用ID ==',
        jp: '== よく使うID =='
      },
      {
        en: 'OLC',
        zh: 'OLC',
        jp: 'OLC'
      },
      {
        en: 'BAKAOLC',
        zh: 'BAKAOLC',
        jp: 'BAKAOLC'
      },
      {
        en: '律影映幻',
        zh: '律影映幻',
        jp: '律影映幻'
      },
      {
        en: 'Ritsukage Utsumabo',
        zh: 'Ritsukage Utsumabo',
        jp: 'Ritsukage Utsumabo'
      }
    ],
    links: [
      {
        name: {
          en: 'Bilibili',
          zh: 'Bilibili',
          jp: 'Bilibili'
        },
        url: 'https://space.bilibili.com/3818840',
        icon: 'play-circle',
        color: '#00a1d6'
      },
      {
        name: {
          en: 'X (Twitter)',
          zh: 'X',
          jp: 'X'
        },
        url: 'https://x.com/BAKAOLC',
        icon: 'twitter',
        color: '#1da1f2'
      },
      {
        name: {
          en: 'Steam',
          zh: 'Steam',
          jp: 'Steam'
        },
        url: 'https://steamcommunity.com/id/BAKAOLC/',
        icon: 'steam-square',
        color: '#171a21'
      },
      {
        name: {
          en: 'GitHub',
          zh: 'GitHub',
          jp: 'GitHub'
        },
        url: 'https://github.com/BAKAOLC',
        icon: 'github',
        color: '#333'
      },
      {
        name: {
          en: 'QQ',
          zh: 'QQ',
          jp: 'QQ'
        },
        url: 'https://qm.qq.com/q/PSo9Ks06K4&personal_qrcode_source=4',
        icon: 'qq',
        color: '#12b7f5'
      },
      {
        name: {
          en: 'Mail',
          zh: '邮箱',
          jp: 'メール'
        },
        url: 'mailto:utsumabo@ritsukage.com',
        icon: 'envelope',
        color: '#ea4335'
      }
    ]
  },

  characters: [
    {
      id: 'ritsukage-utsumabo',
      name: {
        en: 'Ritsukage Utsumabo',
        zh: '律影映幻',
        jp: '律影映幻'
      },
      description: {
        en: 'Main character with various designs and artworks',
        zh: '主要角色，包含各种设计和艺术作品',
        jp: 'メインキャラクター、様々なデザインとアートワーク'
      },
      color: '#667eea'
    }
  ],

  tags: [
    {
      id: 'commission',
      name: {
        en: 'Commission',
        zh: '约稿',
        jp: '依頼'
      },
      color: '#10b981',
      icon: 'handshake'
    },
    {
      id: 'gift',
      name: {
        en: 'Gift',
        zh: '赠送',
        jp: 'プレゼント'
      },
      color: '#f59e0b',
      icon: 'gift'
    },
    {
      id: 'original',
      name: {
        en: 'Original',
        zh: '原创',
        jp: 'オリジナル'
      },
      color: '#8b5cf6',
      icon: 'lightbulb'
    },
    {
      id: 'design',
      name: {
        en: 'Character Design',
        zh: '角色设定',
        jp: 'キャラクターデザイン'
      },
      color: '#4f46e5',
      icon: 'image'
    },
    {
      id: 'wallpaper',
      name: {
        en: 'Wallpaper',
        zh: '壁纸',
        jp: '壁紙'
      },
      color: '#f472b6',
      icon: 'image'
    },
    {
      id: 'illustration',
      name: {
        en: 'Illustration',
        zh: '插画',
        jp: 'イラスト'
      },
      color: '#f472b6',
      icon: 'palette'
    },
    {
      id: 'chibi',
      name: {
        en: 'Chibi',
        zh: 'Q版',
        jp: 'ちび'
      },
      color: '#06b6d4',
      icon: 'baby'
    },
    {
      id: 'avatar',
      name: {
        en: 'Avatar',
        zh: '头像',
        jp: 'アバター'
      },
      color: '#10b981',
      icon: 'user-circle'
    },
    {
      id: 'sketch',
      name: {
        en: 'Sketch',
        zh: '速绘',
        jp: 'スケッチ'
      },
      color: '#8b5cf6',
      icon: 'edit'
    },
    {
      id: 'emoji',
      name: {
        en: 'Emoji',
        zh: '表情包',
        jp: '絵文字'
      },
      color: '#ec4899',
      icon: 'smile'
    }
  ],

  images: [
    // 设定图
    {
      id: 'design-1',
      name: {
        en: 'Normal Form',
        zh: '普通形态',
        jp: '通常形態'
      },
      description: {
        en: 'Normal form character design',
        zh: '普通形态角色设定',
        jp: '通常形態のキャラクター設定'
      },
      artist: {
        en: 'Chengling',
        zh: '橙灵光',
        jp: '橙灵光'
      },
      src: '/assets/catagory/ritsukage-utsumabo/design/1.png',
      tags: ['commission', 'design'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'design-2',
      name: {
        en: 'Cat Girl Form',
        zh: '猫娘形态',
        jp: '猫娘形態'
      },
      description: {
        en: 'Cat girl form character design',
        zh: '猫娘形态角色设定',
        jp: '猫娘形態のキャラクター設定'
      },
      artist: {
        en: 'Chengling',
        zh: '橙灵光',
        jp: '橙灵光'
      },
      src: '/assets/catagory/ritsukage-utsumabo/design/2.png',
      tags: ['commission', 'design'],
      characters: ['ritsukage-utsumabo'],
    },

    // 壁纸
    {
      id: 'wallpaper-1',
      name: {
        en: 'Wasteland',
        zh: '废土',
        jp: '廃土'
      },
      description: {
        en: 'Wasteland themed wallpaper',
        zh: '废土主题壁纸',
        jp: '廃土テーマの壁紙'
      },
      artist: {
        en: 'Muyue',
        zh: '木月',
        jp: '木月'
      },
      src: '/assets/catagory/ritsukage-utsumabo/wallpaper/1.png',
      tags: ['commission', 'wallpaper'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'wallpaper-2',
      name: {
        en: 'Sky',
        zh: '天空',
        jp: '空'
      },
      description: {
        en: 'Sky themed wallpaper',
        zh: '天空主题壁纸',
        jp: '空テーマの壁紙'
      },
      artist: {
        en: 'Popipi',
        zh: '破皮皮',
        jp: '破皮皮'
      },
      src: '/assets/catagory/ritsukage-utsumabo/wallpaper/2.png',
      tags: ['commission', 'wallpaper'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'wallpaper-3-1',
      name: {
        en: 'Bedroom (Normal)',
        zh: '卧室 (通常)',
        jp: '寝室（通常）'
      },
      description: {
        en: 'Bedroom scene wallpaper',
        zh: '卧室场景壁纸',
        jp: '寝室シーンの壁紙'
      },
      artist: {
        en: 'Re-ViVi',
        zh: 'Re-ViVi',
        jp: 'Re-ViVi'
      },
      src: '/assets/catagory/ritsukage-utsumabo/wallpaper/3-1.png',
      tags: ['commission', 'wallpaper'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'wallpaper-3-2',
      name: {
        en: 'Bedroom (Ribbon)',
        zh: '卧室 (丝带)',
        jp: '寝室（リボン）'
      },
      description: {
        en: 'Bedroom scene with ribbon',
        zh: '带丝带的卧室场景',
        jp: 'リボン付きの寝室シーン'
      },
      artist: {
        en: 'Re-ViVi',
        zh: 'Re-ViVi',
        jp: 'Re-ViVi'
      },
      src: '/assets/catagory/ritsukage-utsumabo/wallpaper/3-2.png',
      tags: ['commission', 'wallpaper'],
      characters: ['ritsukage-utsumabo'],
    },

    // 插图
    {
      id: 'illust-original',
      name: {
        en: 'Original Design',
        zh: '初始设定图',
        jp: '初期設定図'
      },
      description: {
        en: 'The very first character design',
        zh: '最初的角色设定图',
        jp: '最初のキャラクター設定図'
      },
      artist: {
        en: 'ID',
        zh: 'ID',
        jp: 'ID'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/original.png',
      tags: ['commission', 'design'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-psyche-1',
      name: {
        en: 'プシュケーLo-1',
        zh: 'プシュケーLo-1',
        jp: 'プシュケーLo-1'
      },
      description: {
        en: 'Artwork by プシュケーLo',
        zh: 'プシュケーLo作品',
        jp: 'プシュケーLoの作品'
      },
      artist: {
        en: 'プシュケーLo',
        zh: 'プシュケーLo',
        jp: 'プシュケーLo'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-1.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-psyche-2',
      name: {
        en: 'プシュケーLo-2',
        zh: 'プシュケーLo-2',
        jp: 'プシュケーLo-2'
      },
      description: {
        en: 'Artwork by プシュケーLo',
        zh: 'プシュケーLo作品',
        jp: 'プシュケーLoの作品'
      },
      artist: {
        en: 'プシュケーLo',
        zh: 'プシュケーLo',
        jp: 'プシュケーLo'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-2.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-psyche-3',
      name: {
        en: 'プシュケーLo-3',
        zh: 'プシュケーLo-3',
        jp: 'プシュケーLo-3'
      },
      description: {
        en: 'Artwork by プシュケーLo',
        zh: 'プシュケーLo作品',
        jp: 'プシュケーLoの作品'
      },
      artist: {
        en: 'プシュケーLo',
        zh: 'プシュケーLo',
        jp: 'プシュケーLo'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/プシュケーLo-3.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-lemonade',
      name: {
        en: 'Lemonade',
        zh: '柠檬水',
        jp: 'レモネード'
      },
      description: {
        en: 'Ritsukage in lemonade',
        zh: '柠檬水中的小律影',
        jp: 'レモネードの中の律影'
      },
      artist: {
        en: 'Jiangxin',
        zh: '江欣',
        jp: '江欣'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/柠檬水小律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-moon',
      name: {
        en: 'Gift by Liuyue',
        zh: '流月赠图',
        jp: '流月のギフトアートワーク'
      },
      description: {
        en: 'Gift artwork by Liuyue',
        zh: '流月老师赠送的作品',
        jp: '流月のギフトアートワーク'
      },
      artist: {
        en: 'Liuyue',
        zh: '流月',
        jp: '流月'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/流月绘.jpg',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-halfhang',
      name: {
        en: 'Gift by Half-hang',
        zh: '半挂赠图',
        jp: '半掛けのギフトアートワーク'
      },
      description: {
        en: 'Gift artwork by Half-hang',
        zh: '半挂老师赠送的作品',
        jp: '半掛けのギフトアートワーク'
      },
      artist: {
        en: 'Half-hang',
        zh: '半挂',
        jp: '半挂'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/半挂绘.jpg',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-mist-1',
      name: {
        en: 'Mist Gift',
        zh: '雾酱赠图',
        jp: '霧ちゃんプレゼント'
      },
      description: {
        en: 'Gift artwork by Mist',
        zh: '雾酱赠送的作品',
        jp: '霧ちゃんからのプレゼント作品'
      },
      artist: {
        en: 'Mist Bell Tong Yu',
        zh: '霧鈴桐喻',
        jp: '霧鈴桐喻'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/雾酱绘.png',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-yukata',
      name: {
        en: 'Yukata',
        zh: '浴衣',
        jp: '浴衣'
      },
      description: {
        en: 'Yukata themed artwork',
        zh: '浴衣主题作品',
        jp: '浴衣テーマの作品'
      },
      artist: {
        en: 'Mist Bell Tong Yu',
        zh: '霧鈴桐喻',
        jp: '霧鈴桐喻'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/雾酱绘浴衣律影.jpg',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-bug',
      name: {
        en: 'Bug',
        zh: 'BUG',
        jp: 'BUG'
      },
      description: {
        en: 'Calling Bug',
        zh: '正在喊BUG的小律影',
        jp: 'BUGを呼ぶ小律影'
      },
      artist: {
        en: 'Mist Bell Tong Yu',
        zh: '霧鈴桐喻',
        jp: '霧鈴桐喻'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/BUG 律影.png',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-hoodie',
      name: {
        en: 'Hoodie Ritsukage',
        zh: '兜帽律影',
        jp: 'フード付き律影'
      },
      description: {
        en: 'Cat ear hoodie Ritsukage',
        zh: '猫耳兜帽小律影',
        jp: '猫耳フード付き律影'
      },
      artist: {
        en: 'HanPian',
        zh: '含片',
        jp: '含片'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/含片绘兜帽律影.jpg',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-bluesky',
      name: {
        en: 'Blue Sky Shadow',
        zh: '青空之影',
        jp: '青空の影'
      },
      description: {
        en: 'Blue sky',
        zh: '青空之影',
        jp: '青空の影'
      },
      artist: {
        en: 'Mist Bell Tong Yu',
        zh: '霧鈴桐喻',
        jp: '霧鈴桐喻'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/青空之影.jpg',
      tags: ['gift', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-miauji',
      name: {
        en: 'Miauji Gift',
        zh: '喵叽赠图',
        jp: 'みゃうじプレゼント'
      },
      description: {
        en: 'Gift artwork by Miauji',
        zh: '喵叽赠送的作品',
        jp: 'みゃうじからのプレゼント作品'
      },
      artist: {
        en: 'Miauji',
        zh: '喵叽',
        jp: '喵叽'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/喵叽绘.jpg',
      tags: ['gift', 'avatar'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-park',
      name: {
        en: 'Park Ritsukage',
        zh: '公园律影',
        jp: '公園律影'
      },
      description: {
        en: 'Park scene artwork',
        zh: '公园场景作品',
        jp: '公園シーンの作品'
      },
      artist: {
        en: 'hiyakata',
        zh: 'hiyakata',
        jp: 'hiyakata'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/公园律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-sunshine',
      name: {
        en: 'Sunshine',
        zh: '阳光',
        jp: '日光'
      },
      description: {
        en: 'Sunshine themed artwork',
        zh: '阳光主题作品',
        jp: '日光テーマの作品'
      },
      artist: {
        en: 'Nekomura Yuyuko',
        zh: '猫村ゆゆこ',
        jp: '猫村ゆゆこ'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/阳光律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-qqman',
      name: {
        en: 'QQ-style Little Ritsukage',
        zh: 'Q版小律影',
        jp: 'Q版小律影'
      },
      description: {
        en: 'QQ-style chibi artwork',
        zh: 'Q版小律影，QQ人风格',
        jp: 'QQスタイルのちび律影'
      },
      artist: {
        en: 'Yuetuo Yayoi',
        zh: '月兔弥生',
        jp: '月兔弥生'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/QQ人小律影.png',
      tags: ['commission', 'chibi'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-noripasuta',
      name: {
        en: 'Ritsukage by syakegayu',
        zh: '律影 by しゃけ',
        jp: '律影 by しゃけ'
      },
      description: {
        en: 'Artwork of Ritsukage by syakegayu',
        zh: 'しゃけ绘制的律影插画',
        jp: 'しゃけによる律影のイラスト'
      },
      artist: {
        en: 'syakegayu',
        zh: 'しゃけ',
        jp: 'しゃけ'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },

    {
      id: 'illust-tarot',
      name: {
        en: 'Tarot Empress',
        zh: '塔罗牌 女皇',
        jp: 'タロット 女帝'
      },
      description: {
        en: 'Tarot Empress card artwork',
        zh: '塔罗牌女皇卡牌作品',
        jp: 'タロット女帝カードの作品'
      },
      artist: {
        en: 'Lisu Liz',
        zh: '栗粟Liz',
        jp: '栗粟Liz'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/塔罗牌 女皇 律影.jpg',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-softcat',
      name: {
        en: 'Soft Cat Ritsukage',
        zh: '软软猫律影',
        jp: 'ふわふわ猫律影'
      },
      description: {
        en: 'Soft cat themed artwork',
        zh: '软萌猫咪主题作品',
        jp: 'ふわふわ猫テーマの作品'
      },
      artist: {
        en: 'ちゅばき',
        zh: 'ちゅばき',
        jp: 'ちゅばき'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/软软猫律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-speedart',
      name: {
        en: 'Speed Art Head',
        zh: '速绘小律影头',
        jp: 'スピードアート頭'
      },
      description: {
        en: 'Speed drawing artwork',
        zh: '快速绘制作品',
        jp: 'スピードドローイング作品'
      },
      artist: {
        en: 'Twuos',
        zh: 'Twuos',
        jp: 'Twuos'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/速绘小律影头.png',
      tags: ['commission', 'avatar', 'sketch'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-blue',
      name: {
        en: 'Blue Little Ritsukage',
        zh: '蓝蓝的小律影',
        jp: '青い小律影'
      },
      description: {
        en: 'Blue themed artwork',
        zh: '蓝色主题作品',
        jp: '青テーマの作品'
      },
      artist: {
        en: 'いーたん＆mikokoたん',
        zh: 'いーたん＆mikokoたん',
        jp: 'いーたん＆mikokoたん'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/蓝蓝的小律影.png',
      tags: ['commission', 'illustration'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-newyear',
      name: {
        en: 'New Year Avatar',
        zh: '新年头像',
        jp: '新年アバター'
      },
      description: {
        en: 'New Year themed avatar',
        zh: '新年主题头像',
        jp: '新年テーマのアバター'
      },
      artist: {
        en: 'Hanamoto',
        zh: '花本',
        jp: '花本'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/新年头像.png',
      tags: ['commission', 'avatar'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-q1',
      name: {
        en: 'Q-style Ritsukage',
        zh: 'Q版小律影',
        jp: 'Q版小律影'
      },
      description: {
        en: 'Q-style chibi artwork',
        zh: 'Q版萌系作品',
        jp: 'Q版萌え系作品'
      },
      artist: {
        en: 'Lanwu',
        zh: '岚舞',
        jp: '岚舞'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-1.png',
      tags: ['commission', 'chibi'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-q2',
      name: {
        en: 'Q-style Ritsukage',
        zh: 'Q版小律影',
        jp: 'Q版小律影'
      },
      description: {
        en: 'Q-style chibi artwork',
        zh: 'Q版萌系作品',
        jp: 'Q版萌え系作品'
      },
      artist: {
        en: 'Tasai',
        zh: '獭祭',
        jp: '獭祭'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-2.png',
      tags: ['commission', 'chibi'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-q3',
      name: {
        en: 'Q-style Ritsukage',
        zh: 'Q版小律影',
        jp: 'Q版小律影'
      },
      description: {
        en: 'Q-style chibi artwork',
        zh: 'Q版萌系作品',
        jp: 'Q版萌え系作品'
      },
      artist: {
        en: 'Mibai Shaozi',
        zh: '米白勺子',
        jp: '米白勺子'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/Q版小律影-3.png',
      tags: ['commission', 'chibi'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'illust-miya',
      name: {
        en: 'Miya Art',
        zh: 'Miya绘',
        jp: 'Miya絵'
      },
      description: {
        en: 'Artwork by Miya',
        zh: 'Miya的作品',
        jp: 'Miyaの作品'
      },
      artist: {
        en: 'Miota Miya',
        zh: '喵田弥夜Miya',
        jp: '喵田弥夜Miya'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/Miya绘.jpg',
      tags: ['commission', 'chibi'],
      characters: ['ritsukage-utsumabo'],
    },

    // 表情包
    {
      id: 'emoji-aba',
      name: {
        en: 'Aba Aba Little Ritsukage',
        zh: '阿巴阿巴小律影',
        jp: 'あばあば小律影'
      },
      description: {
        en: 'Cute expression emoji',
        zh: '可爱表情包',
        jp: 'かわいい表情スタンプ'
      },
      artist: {
        en: 'Dianpao Chayao Ji',
        zh: '点炮叉腰姬',
        jp: '点炮叉腰姬'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/阿巴阿巴小律影.png',
      tags: ['commission', 'avatar', 'chibi', 'emoji'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'emoji-wow',
      name: {
        en: 'Wow Little Ritsukage',
        zh: '哇小律影',
        jp: 'わあ小律影'
      },
      description: {
        en: 'Surprised expression emoji',
        zh: '惊讶表情包',
        jp: '驚き表情スタンプ'
      },
      artist: {
        en: 'Sakurai Sana',
        zh: '樱井纱奈',
        jp: '樱井纱奈'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/哇小律影.png',
      tags: ['commission', 'emoji'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'emoji-checkin',
      name: {
        en: 'Little Ritsukage Check-in',
        zh: '小律影打卡',
        jp: '小律影チェックイン'
      },
      description: {
        en: 'Check-in animation emoji',
        zh: '打卡动图表情包',
        jp: 'チェックインアニメスタンプ'
      },
      artist: {
        en: 'Zailai Lianglongnaibao',
        zh: '再来两笼奶包',
        jp: '再来两笼奶包'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/小律影打卡.gif',
      tags: ['commission', 'emoji'],
      characters: ['ritsukage-utsumabo'],
    },
    {
      id: 'emoji-punch',
      name: {
        en: 'Punch Expression Pack',
        zh: '打拳表情包',
        jp: 'パンチ表情パック'
      },
      description: {
        en: 'Punch themed emoji',
        zh: '打拳主题表情包',
        jp: 'パンチテーマスタンプ'
      },
      artist: {
        en: 'Kongjiang',
        zh: '空酱',
        jp: '空酱'
      },
      src: '/assets/catagory/ritsukage-utsumabo/miscellaneous/打拳表情包.png',
      tags: ['commission', 'emoji'],
      characters: ['ritsukage-utsumabo'],
    }
  ]
}
