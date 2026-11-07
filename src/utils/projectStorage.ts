import { CarouselProject, VisualStyleId, SlideItem, EvidenceCard } from '../types/carousel';
import { PILOT_CASE_PROJECT } from '../data/pilotCase';

export const ACTIVE_PROJECT_STORAGE_KEY = 'viral_carousel_active_project_v2';
export const PROJECTS_LIST_STORAGE_KEY = 'viral_carousel_saved_projects_v2';

export interface SavedProjectMeta {
  id: string;
  topic: string;
  title: string;
  editorialThesis: string;
  visualStyleId: VisualStyleId;
  slidesCount: number;
  coverTitle: string;
  createdAt: string;
  updatedAt: string;
  qualityScore: number;
}

export interface StoredProjectRecord {
  meta: SavedProjectMeta;
  data: CarouselProject;
}

/**
 * Convert full CarouselProject into lightweight metadata
 */
export function extractProjectMeta(project: CarouselProject): SavedProjectMeta {
  const coverSlide = project.slides[0];
  const coverTitle = coverSlide?.title || project.hooks[project.activeHookIndex]?.headline || project.topic;

  return {
    id: project.id || 'project-' + Date.now(),
    topic: project.topic,
    title: project.topic,
    editorialThesis: project.editorialThesis || '',
    visualStyleId: project.visualStyleId,
    slidesCount: project.slides.length,
    coverTitle,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    qualityScore: project.qualityScore?.total || 90,
  };
}

/**
 * Load the active project from LocalStorage or fallback to Pilot Case
 */
export function loadActiveProjectFromStorage(): CarouselProject {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return parsed as CarouselProject;
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to read active project:', err);
  }
  return PILOT_CASE_PROJECT;
}

/**
 * Persist active project to LocalStorage immediately and sync to catalog
 */
export function persistActiveProject(project: CarouselProject): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, JSON.stringify(project));
    syncProjectToCatalog(project);
  } catch (err) {
    console.warn('[Storage] Failed to persist active project:', err);
  }
}

/**
 * Get all stored projects from LocalStorage catalog
 */
export function getAllSavedProjects(): StoredProjectRecord[] {
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to read projects list:', err);
  }

  // Seed with Pilot Case if catalog is empty
  const defaultRecord: StoredProjectRecord = {
    meta: extractProjectMeta(PILOT_CASE_PROJECT),
    data: PILOT_CASE_PROJECT,
  };
  try {
    localStorage.setItem(PROJECTS_LIST_STORAGE_KEY, JSON.stringify([defaultRecord]));
  } catch {
    // ignore
  }
  return [defaultRecord];
}

/**
 * Sync single project into the saved projects catalog
 */
export function syncProjectToCatalog(project: CarouselProject): void {
  try {
    const existing = getAllSavedProjects();
    const meta = extractProjectMeta(project);
    const existingIdx = existing.findIndex((r) => r.data.id === project.id);

    const record: StoredProjectRecord = {
      meta,
      data: project,
    };

    if (existingIdx !== -1) {
      existing[existingIdx] = record;
    } else {
      existing.unshift(record);
    }

    localStorage.setItem(PROJECTS_LIST_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('[Storage] Failed to sync project to catalog:', err);
  }
}

/**
 * Delete project from catalog
 */
export function deleteProjectFromCatalog(projectId: string): StoredProjectRecord[] {
  try {
    const existing = getAllSavedProjects();
    const updated = existing.filter((r) => r.data.id !== projectId);
    localStorage.setItem(PROJECTS_LIST_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[Storage] Failed to delete project:', err);
    return [];
  }
}

/**
 * Duplicate an existing project in catalog
 */
export function duplicateProjectInCatalog(projectId: string): CarouselProject | null {
  try {
    const existing = getAllSavedProjects();
    const target = existing.find((r) => r.data.id === projectId);
    if (!target) return null;

    const newId = `project-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const clonedData: CarouselProject = {
      ...JSON.parse(JSON.stringify(target.data)),
      id: newId,
      topic: `${target.data.topic} (Копия)`,
      createdAt: new Date().toISOString(),
    };

    syncProjectToCatalog(clonedData);
    return clonedData;
  } catch (err) {
    console.warn('[Storage] Failed to duplicate project:', err);
    return null;
  }
}

/**
 * Rename a project in catalog
 */
export function renameProjectInCatalog(projectId: string, newTopic: string): void {
  try {
    const existing = getAllSavedProjects();
    const record = existing.find((r) => r.data.id === projectId);
    if (record) {
      record.data.topic = newTopic.trim();
      record.meta.topic = newTopic.trim();
      record.meta.title = newTopic.trim();
      record.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(PROJECTS_LIST_STORAGE_KEY, JSON.stringify(existing));

      // If active project is this one, update active project storage too
      const activeRaw = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active.id === projectId) {
          active.topic = newTopic.trim();
          localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, JSON.stringify(active));
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to rename project:', err);
  }
}

/**
 * Creates a fresh blank carousel project ready for editing
 */
export function createBlankProject(title = 'Новая карусель'): CarouselProject {
  const newId = `project-${Date.now()}`;
  const now = new Date().toISOString();

  const rawSlides: Omit<SlideItem, 'visualPrompt'>[] = [
    {
      slideNumber: 1,
      role: 'ХУК',
      roleName: 'Остановка скролла',
      kicker: 'ГЛАВНЫЙ ИНСАЙТ',
      title: 'ЗАГОЛОВОК НОВОЙ КАРУСЕЛИ',
      body: 'Вводный тезис, который заставляет остановиться и прочесть карусель до конца...',
      highlight: 'Главный парадокс или интригующий вывод',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 2,
      role: 'КОНТЕКСТ',
      roleName: 'Разворот проблемы',
      kicker: 'ПРОБЛЕМА',
      title: 'Почему старый подход больше не работает',
      body: 'Большинство людей делают одну и ту же ошибку:\n1. Тратят ресурсы впустую\n2. Не видят скрытых барьеров\n3. Получают нулевой результат',
      highlight: 'Скрытый барьер, о котором молчат',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 3,
      role: 'РАЗБОР',
      roleName: 'Первый ключевой принцип',
      kicker: 'ПРИНЦИП #1',
      title: 'Первое фундаментальное правило',
      body: 'Объясните суть первого шага понятным и емким языком без сложных терминов и воды.',
      highlight: '«Точный фокус дает 80% всего результата»',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 4,
      role: 'ДИАЛОГ',
      roleName: 'Реальный диалог / Ситуация',
      kicker: 'ПРАКТИКА',
      title: 'Вопрос, который задают чаще всего',
      body: '«Как внедрить это правило, если нет бюджета и времени?»',
      highlight: 'Начните с одного ключевого процесса, а не перестраивайте всё сразу.',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 5,
      role: 'АНАЛИЗ',
      roleName: 'Цитата и глубокая мысль',
      kicker: 'ГЛУБИНА',
      title: 'В чем главная разница между любителем и профи',
      body: 'Любитель ищет волшебную таблетку и быстрые трюки. Профессионал выстраивает повторяемую систему.',
      highlight: 'Система всегда побеждает хаотичные усилия',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 6,
      role: 'ДОКАЗАТЕЛЬСТВО',
      roleName: 'Цифры и факты',
      kicker: 'МЕТРИКИ',
      title: 'Статистика подтверждает гипотезу',
      statNumber: '84%',
      statLabel: 'Рост эффективности по данным исследований',
      body: 'Компании и авторы, внедрившие системный подход, удерживают внимание в 3 раза дольше.',
      highlight: 'Цифры, которые невозможно игнорировать',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 7,
      role: 'РЕШЕНИЕ',
      roleName: 'Пошаговый чеклист',
      kicker: 'ИНСТРУКЦИЯ',
      title: '3 шага для быстрого старта',
      body: '1. Проведите аудит текущего состояния\n2. Уберите 50% лишних действий\n3. Зафиксируйте один главный фокус',
      highlight: 'Чеклист готов к применению сегодня',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 8,
      role: 'АНТИ-ШАБЛОН',
      roleName: 'Голосовая мысль автора',
      kicker: 'ИНСАЙТ АВТОРА',
      title: 'Чего категорически нельзя делать',
      body: 'Не пытайтесь копировать чужие шаблоны без адаптации к вашей аудитории. Контекст решает всё.',
      highlight: 'Оригинальность — это не вычурность, а честность',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 9,
      role: 'КУЛЬМИНАЦИЯ',
      roleName: 'Главный манифест',
      kicker: 'ИТОГОВЫЙ ВЫВОД',
      title: 'Формула долгосрочного успеха',
      body: 'Результат складывается не из одного рывка, а из ежедневных точных решений.',
      highlight: 'Сделайте один шаг прямо сейчас',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
    {
      slideNumber: 10,
      role: 'ФИНАЛ',
      roleName: 'Призыв к действию',
      kicker: 'ЧТО ДАЛЬШЕ',
      title: 'Было полезно? Сохраните и примените',
      body: 'Сохраните эту карусель в закладки 🔖, чтобы не потерять, и отправьте коллеге, которому это нужно прямо сейчас.',
      highlight: 'Напишите в комментариях ваш главный вывод!',
      footnote: 'VIRAL CAROUSEL OS 2.0',
      imageDisplayMode: 'frame' as const,
      imageOverlayDarkness: 60,
    },
  ];

  const slides: SlideItem[] = rawSlides.map((s) => ({
    ...s,
    visualPrompt: `Репортажная кинематографическая фотография: чистая композиция, премиальный мягкий свет для слайда «${s.title}»`,
  }));

  return {
    id: newId,
    topic: title,
    category: 'Экспертный контент',
    editorialThesis: 'Четко сформулируйте главный тезис и трансформацию читателя к 10 слайду.',
    angleName: 'Прямой авторский разбор',
    angleDescription: 'Практическая карусель с четкой драматургией удержания внимания.',
    alternativeAngles: [],
    evidence: [],
    viralityMechanic: '«Я знаю человека, которому это нужно отправить»',
    viralityGoal: 'Отправки (DMs)',
    targetAudience: 'Эксперты, предприниматели, авторы и специалисты',
    visualStyleId: 'smart-adaptive',
    autoMixPaletteId: 'obsidian-gold',
    visualStyleRationale: 'Режиссерский автомикс: адаптивные микро-виджеты под драматургию',
    hooks: [
      {
        id: 'h1',
        type: 'Конфликт',
        headline: 'ЗАГОЛОВОК НОВОЙ КАРУСЕЛИ',
        subline: 'Подзаголовок, привлекающий внимание целевой аудитории',
        score: 24,
        rationale: 'Высокий интерес и обещание ценности',
      },
    ],
    activeHookIndex: 0,
    caption: 'Здесь напишите текст подписи к посту в Instagram.\n\nПоделитесь вашим мнением в комментариях и сохраните пост в закладки 🔖!',
    callToAction: 'Сохраните в закладки 🔖 и отправьте коллеге!',
    qualityScore: {
      total: 92,
      breakdown: {
        idea: 19,
        cover: 14,
        scenario: 14,
        text: 14,
        evidence: 9,
        visual: 14,
        virality: 4,
        execution: 4,
      },
      verdict: 'Одобрено к публикации',
      strengths: ['Готовая драматургическая структура из 10 слайдов'],
      flaws: [],
      recommendations: ['Наполните слайды вашими конкретными примерами'],
      antiTemplateChecks: {
        noAiFiller: true,
        noPseudoDepth: true,
        noFakeDrama: true,
        noRepetitiveAntitheses: true,
        naturalCadence: true,
        verifiedFacts: true,
      },
    },
    slides,
    createdAt: now,
  };
}
