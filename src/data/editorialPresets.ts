export interface EditorialPhotoPreset {
  id: string;
  category: 'candid-35mm' | 'brutalism' | 'metaphor' | 'symbolic';
  categoryLabel: string;
  title: string;
  description: string;
  url: string;
  keywords: string[];
}

export const EDITORIAL_PHOTO_PRESETS: EditorialPhotoPreset[] = [
  // 1. Candid 35mm & Documentary
  {
    id: 'film-foggy-bridge',
    category: 'candid-35mm',
    categoryLabel: '🎞️ 35mm Плёнка',
    title: 'Силуэт на туманном мосту',
    description: 'Одинокая фигура в темном пальто на мосту в сумерках, кинематографичный туман и огни',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    keywords: ['мост', 'пальто', 'туман', 'силуэт', 'город', 'сумерки', 'вечер', 'одиночество', 'дорога'],
  },
  {
    id: 'film-morning-desk',
    category: 'candid-35mm',
    categoryLabel: '🎞️ 35mm Плёнка',
    title: 'Утренний рабочий стол и кофе',
    description: 'Деревянный стол, блокнот с записями, чашка черного кофе, естественные лучи солнца',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    keywords: ['стол', 'блокнот', 'кофе', 'утро', 'мысли', 'записи', 'честность', 'исследование', 'текст'],
  },
  {
    id: 'film-atmospheric-road',
    category: 'candid-35mm',
    categoryLabel: '🎞️ 35mm Плёнка',
    title: 'Сумеречная трасса в тумане',
    description: 'Глубокая ночная перспектива, мягкий аналоговый свет фар, медитативная тишина',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80',
    keywords: ['дорога', 'ночь', 'путь', 'трасса', 'фары', 'неизвестность', 'выбор', 'путешествие'],
  },
  {
    id: 'film-candid-portrait',
    category: 'candid-35mm',
    categoryLabel: '🎞️ 35mm Плёнка',
    title: 'Документальный взгляд человека',
    description: 'Искренний крупный план, естественный рассеянный свет, пленочная текстура Kodak',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    keywords: ['человек', 'взгляд', 'лицо', 'портрет', 'эмоция', 'психика', 'страх', 'инсайт', 'рефлексия'],
  },

  // 2. Brutalism & Architecture
  {
    id: 'brutalism-light-beam',
    category: 'brutalism',
    categoryLabel: '🏛️ Брутализм',
    title: 'Контрастный луч на бетоне',
    description: 'Резкая диагональная тень и чистый солнечный луч на фактурной серой стене',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    keywords: ['бетон', 'луч', 'свет', 'тень', 'стена', 'геометрия', 'брутализм', 'минимализм', 'архитектура'],
  },
  {
    id: 'brutalism-skyscraper-grid',
    category: 'brutalism',
    categoryLabel: '🏛️ Брутализм',
    title: 'Монументальная сетка фасада',
    description: 'Строгая швейцарская геометрия из темного стекла и титана, уходящая в небо',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    keywords: ['фасад', 'сетка', 'небоскреб', 'стекло', 'данные', 'метрики', 'система', 'масштаб', 'бизнес'],
  },
  {
    id: 'brutalism-concrete-monolith',
    category: 'brutalism',
    categoryLabel: '🏛️ Брутализм',
    title: 'Монолитные формы архитектуры',
    description: 'Чистые плоскости современного модернизма, просторное негативное пространство',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    keywords: ['монолит', 'пространство', 'здание', 'модернизм', 'строгость', 'баланс', 'форма'],
  },

  // 3. Conceptual Metaphors
  {
    id: 'metaphor-light-rays',
    category: 'metaphor',
    categoryLabel: '🎭 Метафора',
    title: 'Лучи ясности сквозь туман',
    description: 'Атмосферный объемный свет, пробивающийся сквозь утреннюю мглу, символ озарения',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    keywords: ['лучи', 'туман', 'озарение', 'инсайт', 'метафора', 'призма', 'прозрение', 'ясность'],
  },
  {
    id: 'metaphor-minimal-perspective',
    category: 'metaphor',
    categoryLabel: '🎭 Метафора',
    title: 'Взгляд в перспективу горизонта',
    description: 'Лаконичная открытая перспектива, чистый воздух, ощущение преодоления предела',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    keywords: ['горизонт', 'перспектива', 'шаг', 'действие', 'предел', 'цель', 'уверенность'],
  },
  {
    id: 'metaphor-fine-art-texture',
    category: 'metaphor',
    categoryLabel: '🎭 Метафора',
    title: 'Художественная текстура галереи',
    description: 'Утонченная фактура музейной живописи, приглушенные благородные земляные тона',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    keywords: ['арт', 'картина', 'галерея', 'живопись', 'культура', 'парадокс', 'сложность'],
  },

  // 4. Symbolic Objects & Still Life
  {
    id: 'symbol-dark-tech',
    category: 'symbolic',
    categoryLabel: '🕯️ Символический натюрморт',
    title: 'Черный монолит технологий в тишине',
    description: 'Минималистичный выключенный экран, тонкий отблеск света на керамической грани',
    url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80',
    keywords: ['экран', 'гаджет', 'телефон', 'девайс', 'технологии', 'монолит', 'черный', 'декодер'],
  },
  {
    id: 'symbol-tactile-still-life',
    category: 'symbolic',
    categoryLabel: '🕯️ Символический натюрморт',
    title: 'Тактильные артефакты и текстура',
    description: 'Фактурные предметы на темном фоне, глубокий направленный свет, акцент на детали',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    keywords: ['предмет', 'натюрморт', 'тактильность', 'деталь', 'артефакт', 'материал', 'фокус'],
  },
];

/**
 * Match a text prompt to the most semantically relevant editorial photo
 */
export function findMatchingEditorialPhoto(
  prompt: string,
  preferredCategory?: string
): EditorialPhotoPreset {
  const p = (prompt || '').toLowerCase();

  // Score each preset by keyword hits and category preference
  let bestMatch = EDITORIAL_PHOTO_PRESETS[0];
  let maxScore = -1;

  for (const preset of EDITORIAL_PHOTO_PRESETS) {
    let score = 0;

    if (preferredCategory && preset.category === preferredCategory) {
      score += 3;
    }

    for (const kw of preset.keywords) {
      if (p.includes(kw)) {
        score += 5;
      }
    }

    // Specific prompt phrase signals
    if (p.includes('мост') || p.includes('пальто') || p.includes('туман')) {
      if (preset.id === 'film-foggy-bridge') score += 10;
    }
    if (p.includes('стол') || p.includes('кофе') || p.includes('блокнот') || p.includes('утро')) {
      if (preset.id === 'film-morning-desk') score += 10;
    }
    if (p.includes('бетон') || p.includes('тень') || p.includes('луч') || p.includes('брутализм')) {
      if (preset.id === 'brutalism-light-beam') score += 10;
    }
    if (p.includes('фасад') || p.includes('сетк') || p.includes('данны') || p.includes('небоскреб')) {
      if (preset.id === 'brutalism-skyscraper-grid') score += 10;
    }
    if (p.includes('призм') || p.includes('стекл') || p.includes('озарен')) {
      if (preset.id === 'metaphor-light-rays') score += 10;
    }
    if (p.includes('экран') || p.includes('смартфон') || p.includes('монолит') || p.includes('девайс')) {
      if (preset.id === 'symbol-dark-tech') score += 10;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = preset;
    }
  }

  return bestMatch;
}
