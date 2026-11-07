export interface VideoPreset {
  id: string;
  title: string;
  category: 'cinematic' | 'lifestyle' | 'abstract' | 'tech';
  url: string;
  durationSec: number;
  description: string;
  poster?: string;
}

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'vid-city-skyscrapers',
    title: 'Архитектура & Небоскрёбы',
    category: 'cinematic',
    url: '/videos/city-skyscrapers.mp4',
    durationSec: 6,
    description: 'Минималистичные стеклянные фасады и строгая геометрия швейцарской сетки.',
  },
  {
    id: 'vid-steaming-coffee',
    title: 'Утренний кофе & Пар',
    category: 'lifestyle',
    url: '/videos/steaming-coffee.mp4',
    durationSec: 6,
    description: 'Глубокий уют, дымок и теплый янтарный акцент для экспертных рассуждений.',
  },
  {
    id: 'vid-ocean-waves',
    title: 'Океанический прибой',
    category: 'lifestyle',
    url: '/videos/ocean-waves.mp4',
    durationSec: 6,
    description: 'Медитативные волны и глубокий темно-бирюзовый фон для чтения.',
  },
  {
    id: 'vid-fluid-ink',
    title: 'Абстрактные чернила & Флюид',
    category: 'abstract',
    url: '/videos/fluid-ink.mp4',
    durationSec: 6,
    description: 'Глубокие градиентные переливы, идеально контрастирующие с текстом.',
  },
  {
    id: 'vid-laptop-typing',
    title: 'Работа & Терминал',
    category: 'tech',
    url: '/videos/laptop-typing.mp4',
    durationSec: 6,
    description: 'Динамичный фокус на технологиях, кодинге и продуктивности.',
  },
  {
    id: 'vid-mobile-screen',
    title: 'Смартфон & Вертикальный контент',
    category: 'tech',
    url: '/videos/mobile-screen.mp4',
    durationSec: 6,
    description: 'Нативный UX мобильного приложения и цифровых карточек.',
  },
];
