export type AutoMixPaletteId =
  | 'obsidian-gold'
  | 'signal-coral'
  | 'monochrome-chalk'
  | 'emerald-slate'
  | 'editorial-cream';

export interface AutoMixPaletteConfig {
  id: AutoMixPaletteId;
  name: string;
  nameRu: string;
  desc: string;
  bgClass: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  widgetBg: string;
  widgetBorder: string;
  accentHex: string;
  isLight?: boolean;
}

export const AUTO_MIX_PALETTES: AutoMixPaletteConfig[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian & Warm Gold',
    nameRu: 'Обсидиан & Золото',
    desc: 'Глубокий угольный фон, жемчужный текст и благородный золотисто-янтарный акцент',
    bgClass: 'bg-[#0c0d10]',
    cardBg: '#0c0d10',
    textPrimary: 'text-neutral-50',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-500',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-400/10',
    accentBorder: 'border-amber-400/40',
    widgetBg: 'bg-[#15171f]/90',
    widgetBorder: 'border-neutral-800/90',
    accentHex: '#fbbf24',
  },
  {
    id: 'signal-coral',
    name: 'Graphite & Signal Coral',
    nameRu: 'Графит & Сигнальный коралл',
    desc: 'Динамичный медийный контраст для резких критических тем и разоблачений',
    bgClass: 'bg-[#0e0f14]',
    cardBg: '#0e0f14',
    textPrimary: 'text-neutral-50',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-500',
    accentText: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/40',
    widgetBg: 'bg-[#181a24]/90',
    widgetBorder: 'border-neutral-800/90',
    accentHex: '#f43f5e',
  },
  {
    id: 'monochrome-chalk',
    name: 'Monochrome Studio',
    nameRu: 'Студийный монохром',
    desc: 'Безупречный архитектурный минимализм: глубокий черный и чистый белый мел',
    bgClass: 'bg-[#080809]',
    cardBg: '#080809',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-500',
    accentText: 'text-white',
    accentBg: 'bg-white/10',
    accentBorder: 'border-white/40',
    widgetBg: 'bg-[#131316]/90',
    widgetBorder: 'border-neutral-800',
    accentHex: '#ffffff',
  },
  {
    id: 'emerald-slate',
    name: 'Cyber Slate & Emerald',
    nameRu: 'Сланец & Изумруд',
    desc: 'Технологичная современная эстетика для тем про алгоритмы, нейросети и тренды',
    bgClass: 'bg-[#0a0f12]',
    cardBg: '#0a0f12',
    textPrimary: 'text-neutral-50',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-500',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-400/10',
    accentBorder: 'border-emerald-400/40',
    widgetBg: 'bg-[#111a1f]/90',
    widgetBorder: 'border-neutral-800/90',
    accentHex: '#34d399',
  },
  {
    id: 'editorial-cream',
    name: 'Warm Alabaster & Ink',
    nameRu: 'Журнальный крем',
    desc: 'Светлая бумажная верстка с книжной гармонией и терракотовым акцентом',
    bgClass: 'bg-[#f7f5f0]',
    cardBg: '#f7f5f0',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-700',
    textMuted: 'text-stone-500',
    accentText: 'text-amber-800',
    accentBg: 'bg-amber-800/10',
    accentBorder: 'border-stone-400',
    widgetBg: 'bg-[#ede9df]',
    widgetBorder: 'border-stone-300',
    accentHex: '#9a3412',
    isLight: true,
  },
];
