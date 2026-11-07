import { SlideItem } from '../types/carousel';

export interface VisualPromptSuggestion {
  id: string;
  category: 'metaphor' | 'realism' | 'brutalism' | 'symbol';
  categoryLabel: string;
  categoryIcon: string;
  badge: string;
  title: string;
  prompt: string;
  rationale: string;
}

export interface SlideVisualAnalysis {
  detectedEssence: string;
  moodTag: string;
  colorSuggestion: string;
  primaryPrompt: string;
  suggestions: VisualPromptSuggestion[];
}

/**
 * Intelligent Semantic Visual Prompt Engine
 * Analyzes the semantic core, emotional tone, and narrative function of a slide,
 * then generates high-aesthetic visual prompts tailored to the essence of the message.
 */
export function analyzeSlideAndSuggestPrompts(
  slide: SlideItem,
  topic?: string,
  angle?: string
): SlideVisualAnalysis {
  const title = (slide.title || '').trim();
  const body = (slide.body || '').trim();
  const highlight = (slide.highlight || '').trim();
  const kicker = (slide.kicker || '').trim();
  const role = (slide.role || '').toLowerCase();
  const roleName = (slide.roleName || '').toLowerCase();
  const combinedText = `${kicker} ${title} ${body} ${highlight} ${topic || ''} ${angle || ''}`.toLowerCase();

  // Detect narrative archetype and semantic tension
  const isHook = role.includes('хук') || role.includes('обложка') || slide.slideNumber === 1;
  const isCtaOrFinal = role.includes('финал') || role.includes('cta') || role.includes('действие') || slide.slideNumber >= 9;
  const isDataOrComparison = Boolean(
    slide.statNumber ||
    slide.comparisonBefore ||
    slide.comparisonAfter ||
    combinedText.includes('сравните') ||
    combinedText.includes('статистик') ||
    combinedText.includes('данные') ||
    combinedText.includes('исследован') ||
    combinedText.includes('%')
  );

  const hasPsychology = /тревог|страх|саботаж|вина|стыд|мозг|психик|биохим|дофамин|эмоци|мысл|уверенн|синдром|выгоран|перфекционизм/.test(combinedText);
  const hasConflict = /парадокс|противореч|ошибк|иллюзи|ловушк|цена|заблужден|миф|правда|но на самом деле|проблема|стоимость/.test(combinedText);
  const hasAction = /действие|решение|инструмент|шаг|система|фреймворк|правило|тест|запуск|начать|сделать/.test(combinedText);
  const hasTech = /ai|нейросет|алгоритм|программ|код|экран|соцсет|контент|гаджет|цифров|технолог/.test(combinedText);
  const hasTime = /время|года|месяц|прокрастинац|ожидан|откладыват|срок|дедлайн|часы|утро|ночь|пауз/.test(combinedText);

  // 1. Detect Slide Essence
  let detectedEssence = 'Ключевой смысловой узел публикации';
  let moodTag = 'Кинематографичная сосредоточенность';
  let colorSuggestion = 'Глубокий графит, приглушенный теплый свет';

  if (isHook) {
    detectedEssence = 'Провокационный хук: остановка взгляда и разрыв шаблона';
    moodTag = 'Драматичное напряжение';
    colorSuggestion = 'Контрастный обсидиан и акцентный сигнальный луч';
  } else if (hasConflict && hasPsychology) {
    detectedEssence = 'Вскрытие ментальной ловушки и внутреннего сопротивления';
    moodTag = 'Интимная рефлексия, честность';
    colorSuggestion = 'Монохромные глубокие тени, мягкий контражур';
  } else if (hasConflict) {
    detectedEssence = 'Парадокс и столкновение двух несовместимых реальностей';
    moodTag = 'Острое интеллектуальное напряжение';
    colorSuggestion = 'Холодный бетон, геометрия и луч прозрения';
  } else if (isDataOrComparison) {
    detectedEssence = 'Холодный сравнительный анализ и доказательная опора';
    moodTag = 'Швейцарская точность, ясность ума';
    colorSuggestion = 'Строгий матовый титан, чистые графические плоскости';
  } else if (hasTime || combinedText.includes('откладыван')) {
    detectedEssence = 'Иллюзия бесконечного времени и невидимая цена промедления';
    moodTag = 'Экзистенциальная пауза';
    colorSuggestion = 'Теплые янтарные тона угасающего дня, кинематографичное зерно';
  } else if (hasTech) {
    detectedEssence = 'Человек на стыке алгоритмов, информационного шума и выбора';
    moodTag = 'Минималистичный техно-гуманизм';
    colorSuggestion = 'Глубокий индиго, черный оникс, неоновый микро-блик';
  } else if (isCtaOrFinal || hasAction) {
    detectedEssence = 'Точка перехода: от ментального тупика к конкретному первому шагу';
    moodTag = 'Сфокусированная готовность к действию';
    colorSuggestion = 'Рассветный золотой свет, воздух, простор композиции';
  }

  // Helper to extract key nouns or core subject
  const coreSubject = title.length > 5 ? title : topic || 'Концептуальная идея';

  // 2. Generate 4 tailored suggestions:
  const suggestions: VisualPromptSuggestion[] = [];

  // Suggestion A: Conceptual Metaphor (Метафорический образ)
  let metaphorPrompt = '';
  let metaphorTitle = '';
  let metaphorRationale = '';

  if (hasConflict || hasPsychology) {
    metaphorTitle = 'Стеклянный лабиринт и чистый горизонт';
    metaphorPrompt = `Концептуальная художественная метафора: геометрическая прозрачная призма из матового стекла на темном базальтовом постаменте, преломляющая одиночный узкий луч теплого света. Атмосфера скандинавской галереи, строгие пропорции, отсутствие лишних деталей. Тема: «${coreSubject}». Кадр снят на Hasselblad 80mm f/2.8, кинематографичная глубина резкости, минимализм, пространство для текста.`;
    metaphorRationale = 'Визуализирует ментальное распутывание сложного узла через чистую геометрию стекла и света.';
  } else if (hasTime) {
    metaphorTitle = 'Песочные часы и застывшее мгновение';
    metaphorPrompt = `Художественная метафора времени: монолитные скульптурные песочные часы из дымчатого кварца на гладкой темной поверхности. Мягкий контровой свет из высокого окна, кинематографическая пыль в луче солнца, утонченная эстетика тишины. Смысл: «${coreSubject}». Hasselblad, мягкое зерно, нейтральная журнальная композиция.`;
    metaphorRationale = 'Передает тактильное ощущение уходящего времени без избитых стоковых штампов.';
  } else if (isDataOrComparison) {
    metaphorTitle = 'Баланс двух монолитов';
    metaphorPrompt = `Абстрактная архитектурная инсталляция: два строгих куба разного масштаба из черного сланца и полированного алюминия, находящиеся в идеальном кинетическом равновесии. Чистый студийный свет, швейцарский модернизм, негативное пространство для типографики. Отражает суть: «${coreSubject}».`;
    metaphorRationale = 'Показывает контраст двух состояний через физику массы и баланса.';
  } else {
    metaphorTitle = 'Одиночный архитектурный луч';
    metaphorPrompt = `Минималистичная арт-композиция: высокая глухая стена из теплого серого травертина, на которую через невидимый проем падает четкий геометрический луч полуденного солнца. Никаких людей, абсолютная концентрация мысли. Контекст: «${coreSubject}». Журнальный кадр премиум-класса, мягкие тени.`;
    metaphorRationale = 'Создает ощущение ясности и инсайта после долгого блуждания в тумане.';
  }

  suggestions.push({
    id: 'sug-metaphor',
    category: 'metaphor',
    categoryLabel: 'Метафорический образ',
    categoryIcon: '🎭',
    badge: 'Арт-дирекшн',
    title: metaphorTitle,
    prompt: metaphorPrompt,
    rationale: metaphorRationale,
  });

  // Suggestion B: Candid Documentary Realism (35mm кино-хроника)
  let realismPrompt = '';
  let realismTitle = '';
  let realismRationale = '';

  if (hasPsychology || hasTime) {
    realismTitle = 'Утренний стол и момент честности';
    realismPrompt = `Атмосферный документальный кадр на 35mm плёнку Kodak Portra 400: рабочий деревянный стол из темного ясеня ранним утром, открытый блокнот с рукописными строчками, чашка черного кофе, длинные тени от оконной рамы. Человек на заднем плане в расфокусе, естественная непарадная поза. Кинематографичный реализм, искренность, без глянца. Идея слайда: «${coreSubject}».`;
    realismRationale = 'Вызывает моментальное узнавание («это буквально про меня») через живые детали быта.';
  } else if (isHook || hasConflict) {
    realismTitle = 'Силуэт в пространстве города';
    realismPrompt = `Репортажная кинематографическая фотография: фигура человека в темном пальто на пустом мосту или открытой террасе современного мегаполиса в сумерках. Холодный вечерний туман, вдалеке теплые огни зданий, мягкое аналоговое зерно 35mm. Широкий кинематографический план 4:5, драматическая пауза перед принятием решения. Тема: «${coreSubject}».`;
    realismRationale = 'Задает эпический масштаб личному выбору или внутренней дилемме.';
  } else if (isCtaOrFinal || hasAction) {
    realismTitle = 'Шаг за порог: естественный свет';
    realismPrompt = `Документальный реализм: кадр через приоткрытую массивную дубовую дверь в залитую утренним солнцем комнату. Крупный план руки на дверной ручке, естественная текстура кожи и дерева, тактильный реализм, ощущение начала нового действия. Настоящая пленочная эстетика Leica M6, 50mm, естественное боке. Суть: «${coreSubject}».`;
    realismRationale = 'Символизирует смелость сделать шаг без назидательности и клише.';
  } else {
    realismTitle = 'Кабинет исследователя';
    realismPrompt = `Аутентичный репортажный снимок: фрагмент рабочего стола с разложенными книгами, черновиками и винтажной настольной лампой, дающей теплый конус света. Глубокие тени по краям, документальная фактура, ощущение сосредоточенного поиска истины. Контекст: «${coreSubject}». 35mm пленочный цвет.`;
    realismRationale = 'Подчеркивает глубину исследования и экспертную опору слайда.';
  }

  suggestions.push({
    id: 'sug-realism',
    category: 'realism',
    categoryLabel: 'Документальный кадр (35mm)',
    categoryIcon: '📷',
    badge: 'Живой контекст',
    title: realismTitle,
    prompt: realismPrompt,
    rationale: realismRationale,
  });

  // Suggestion C: Brutalist Architecture & Form (Брутализм и чистая форма)
  let brutalismTitle = 'Монументальный бетон и свет';
  let brutalismPrompt = `Скульптурная бруталистская архитектура: массивный геометрический угол из монолитного текстурированного бетона, пересекаемый резкой диагональной тенью. Ощущение незыблемости, швейцарская строгость композиции, абсолютная чистота линий. Никакого визуального мусора, выверенные пропорции 4:5 для текста карусели. Смысловой посыл: «${coreSubject}».`;
  let brutalismRationale = 'Придает мысли фундаментальный вес и авторитетность.';

  if (isDataOrComparison) {
    brutalismTitle = 'Швейцарская модульная сетка в объеме';
    brutalismPrompt = `Модульная архитектурная сетка: фрагмент фасада из темного анодированного алюминия и матового стекла, ритмичное повторение строгих вертикалей и горизонталей. Высокий контраст, холодное графическое совершенство, пространство для наложения ключевых цифр. Отражает: «${coreSubject}».`;
    brutalismRationale = 'Идеальный фон для слайда с данными, подчеркивающий системность.';
  }

  suggestions.push({
    id: 'sug-brutalism',
    category: 'brutalism',
    categoryLabel: 'Архитектурная форма',
    categoryIcon: '🏛️',
    badge: 'Премиум минимализм',
    title: brutalismTitle,
    prompt: brutalismPrompt,
    rationale: brutalismRationale,
  });

  // Suggestion D: Symbolic Key Prop / Still Life (Символический предмет)
  let symbolTitle = 'Одиночный артефакт смысла';
  let symbolPrompt = '';
  let symbolRationale = '';

  if (hasTech) {
    symbolTitle = 'Черный монолит экрана в тишине';
    symbolPrompt = `Макро-натюрморт: выключенный черный экран смартфона с гладкой керамической гранью, лежащий на темном льняном полотне грубого плетения. Единственный тонкий блик света по краю стекла, матовая глубина черного цвета. Символ цифрового детокса и осознанности. Суть: «${coreSubject}». Hasselblad макро, 100mm.`;
    symbolRationale = 'Точечно раскрывает тему технологий через контраст органики и холодного кремния.';
  } else if (hasConflict || hasPsychology) {
    symbolTitle = 'Разорванная нить или чистый лист';
    symbolPrompt = `Минималистичный макро-натюрморт: плотный фактурный лист хлопковой бумаги ручной работы с неровным рваным краем, лежащий на темном граните. Контрастное боковое освещение, подчеркивающее микрорельеф волокон бумаги. Метафора чистого листа и преодоления внутреннего паралича. «${coreSubject}».`;
    symbolRationale = 'Тактильный, осязаемый образ преодоления страха белого листа.';
  } else {
    symbolTitle = 'Фокусирующая линза истины';
    symbolPrompt = `Предметный натюрморт: тяжелая оптическая стеклянная призма на старинной деревянной подставке, отбрасывающая на темную поверхность тонкий спектральный радужный блик. Темный фон, точечный направленный свет. Символ ясности восприятия. Суть: «${coreSubject}».`;
    symbolRationale = 'Лаконичный символ ясности и фокусировки на главном.';
  }

  suggestions.push({
    id: 'sug-symbol',
    category: 'symbol',
    categoryLabel: 'Символический предмет',
    categoryIcon: '🕯️',
    badge: 'Точный акцент',
    title: symbolTitle,
    prompt: symbolPrompt,
    rationale: symbolRationale,
  });

  // Pick primary prompt
  const primaryPrompt = suggestions[0].prompt;

  return {
    detectedEssence,
    moodTag,
    colorSuggestion,
    primaryPrompt,
    suggestions,
  };
}
