export type VisualStyleId =
  // Режиссерский автомикс (ТОП выбор)
  | 'smart-adaptive'
  // Редакционные и медийные стили
  | 'editorial-brutalism'
  | 'independent-magazine'
  | 'documentary'
  | 'dark-editorial'
  | 'archival-collage'
  | 'swiss-editorial'
  | 'native-internet'
  | 'contemporary-art'
  // Живые UGC стили
  | 'ios-notes'
  | 'telegram-chat'
  | 'twitter-x-thread'
  | 'moleskine-journal'
  | 'voice-memo';

export type AutoMixPaletteId =
  | 'obsidian-gold'
  | 'signal-coral'
  | 'monochrome-chalk'
  | 'emerald-slate'
  | 'editorial-cream';

export interface VisualStyle {
  id: VisualStyleId;
  name: string;
  nameRu: string;
  subtitle: string;
  bestFor: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  fontHeadline: string;
  fontBody: string;
  borderStyle: string;
  paletteDescription: string;
  typographyDescription: string;
  category?: 'smart' | 'ugc' | 'editorial' | 'art';
  badge?: string;
}

export interface ImageFrameSettings {
  height?: number; // Height in px (80 - 320, default around 140)
  aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1' | '4:5';
  focalPoint?: 'top' | 'center' | 'bottom';
  focalY?: number; // 0 - 100 (% vertical offset from top)
  focalX?: number; // 0 - 100 (% horizontal offset from left)
  zoom?: number; // 100 - 180 (%)
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export interface SlideItem {
  slideNumber: number;
  role: string; // e.g. '01 / ХУК', '02 / КОНТЕКСТ'
  roleName: string;
  kicker: string;
  title: string;
  body: string;
  highlight?: string;
  subtext?: string;
  visualPrompt: string;
  layoutVariant?: 'centered' | 'split' | 'statement' | 'quote' | 'data' | 'checklist';
  footnote?: string;
  sourceType?: 'source' | 'data' | 'research' | 'expert' | 'stat' | 'factcheck' | 'custom';
  sourceVerified?: boolean;
  statNumber?: string;
  statLabel?: string;
  comparisonBefore?: string;
  comparisonAfter?: string;
  adaptiveStyleId?: VisualStyleId;
  imageUrl?: string;
  imagePrompt?: string;
  imageSource?: 'upload' | 'nano-banana' | 'preset';
  imageDisplayMode?: 'background' | 'frame';
  imageOverlayDarkness?: number;
  hiddenBlocks?: string[];
  blockOrder?: string[];
  imageFrameSettings?: ImageFrameSettings;
  swipePrompt?: string;
  chatSenderTitle?: string;
  // Video attachment & playback options
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  videoSource?: 'upload' | 'preset' | 'url';
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoPoster?: string;
}

export interface HookOption {
  id: string;
  type: 'Парадокс' | 'Конфликт' | 'Неочевидное наблюдение' | 'Конкретный вопрос' | 'Подтверждённый факт' | 'Визуальная загадка';
  headline: string;
  subline: string;
  score: number;
  rationale: string;
}

export interface EvidenceCard {
  id: string;
  claim: string;
  source: string;
  sourceType: 'Первоисточник' | 'Метаанализ' | 'Платформенные данные' | 'Исследование' | 'Интервью / Кейс';
  date: string;
  context: string;
  limitations: string;
  reliability: 'Подтверждено' | 'Требует уточнения' | 'Не подтверждено';
  editorAction: string;
}

export interface QualityScore {
  total: number;
  breakdown: {
    idea: number; // max 20
    cover: number; // max 15
    scenario: number; // max 15
    text: number; // max 15
    evidence: number; // max 10
    visual: number; // max 15
    virality: number; // max 5
    execution: number; // max 5
  };
  verdict: 'Одобрено к публикации' | 'Требует точечной доработки' | 'Отправить на пересмотр';
  strengths: string[];
  flaws: string[];
  recommendations: string[];
  antiTemplateChecks: {
    noAiFiller: boolean; // Нет "в современном мире", "важно понимать"
    noPseudoDepth: boolean; // Нет псевдофилософских банальностей
    noFakeDrama: boolean; // Нет дешевого нагнетания
    noRepetitiveAntitheses: boolean; // Нет однотипных "дело не в Х, дело в Y"
    naturalCadence: boolean; // Живой ритмичный синтаксис
    verifiedFacts: boolean; // Цифры и цитаты имеют проверяемые источники
  };
}

export interface FeedbackMetrics {
  reach: number;
  impressions: number;
  nonFollowerShare: number; // percentage, e.g. 74
  shares: number;
  saves: number;
  comments: number;
  profileVisits: number;
  follows: number;
  saveRate: number; // saves / reach
  shareRate: number; // shares / reach
  followRate: number; // follows / profileVisits
  diagnosis: string;
  nextHypothesis: string;
}

export interface CarouselProject {
  id: string;
  topic: string;
  category: string;
  editorialThesis: string;
  angleName: string;
  angleDescription: string;
  alternativeAngles: { title: string; angle: string; score: number }[];
  viralityMechanic: string;
  viralityGoal: 'Охват' | 'Отправки (DMs)' | 'Сохранения' | 'Подписки' | 'Дискуссия';
  targetAudience: string;
  visualStyleId: VisualStyleId;
  visualStyleRationale: string;
  autoMixPaletteId?: AutoMixPaletteId;
  hooks: HookOption[];
  activeHookIndex: number;
  evidence: EvidenceCard[];
  slides: SlideItem[];
  caption: string;
  callToAction: string;
  qualityScore: QualityScore;
  feedbackMetrics?: FeedbackMetrics;
  createdAt: string;
}

export type OperationalMode =
  | 'FULL PRODUCTION'
  | 'DISCOVER'
  | 'DEEP RESEARCH'
  | 'CONCEPT'
  | 'DESIGN ONLY'
  | 'TEXT ONLY'
  | 'AUDIT'
  | 'POST-MORTEM';
