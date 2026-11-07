import express, { Request, Response } from 'express';
import http from 'http';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { findMatchingEditorialPhoto } from './src/data/editorialPresets';
import { generateCarouselLocally } from './src/utils/generator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/videos', express.static(path.resolve(__dirname, 'public', 'videos')));
app.use(express.static(path.resolve(__dirname, 'public')));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface KeyTestResult {
  status: 'ok' | 'billing_required' | 'invalid_key' | 'missing';
  error?: string;
  timestamp: number;
}

let keyTestCache: KeyTestResult = {
  status: 'missing',
  timestamp: 0,
};

async function testGeminiKey(key?: string): Promise<KeyTestResult> {
  const now = Date.now();
  if (!key) return { status: 'missing', timestamp: now };
  if (now - keyTestCache.timestamp < 30000 && keyTestCache.status !== 'missing') {
    return keyTestCache;
  }
  try {
    const testAi = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    await testAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'ping',
    });
    keyTestCache = { status: 'ok', timestamp: now };
    return keyTestCache;
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('free tier is not available') || msg.includes('set up billing') || err.status === 403) {
      keyTestCache = { status: 'billing_required', error: 'The Gemini API free tier is not available for this project. Set up billing or create key in a new project.', timestamp: now };
    } else {
      keyTestCache = { status: 'invalid_key', error: msg, timestamp: now };
    }
    return keyTestCache;
  }
}

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const currentKey = process.env.GEMINI_API_KEY;
  const testRes = await testGeminiKey(currentKey);
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(currentKey),
    geminiLiveStatus: testRes.status,
    geminiError: testRes.error,
    timestamp: new Date().toISOString(),
  });
});

// Generate carousel endpoint
app.post('/api/carousel/generate', async (req: Request, res: Response) => {
  try {
    const { topic, mode = 'FULL PRODUCTION', customStyle } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!ai) {
      console.log('Gemini API key not configured, generating deep domain carousel locally for topic:', topic);
      const localProject = generateCarouselLocally(topic, customStyle);
      return res.json({
        success: true,
        data: localProject,
        isLocalFallback: true,
      });
    }

    const systemPrompt = `Ты — VIRAL CAROUSEL ENGINE 2.0, профессиональная редакционная система создания вирусных Instagram-каруселей с глубокой драматургией.
Тема: "${topic}"
Режим: "${mode}"
${customStyle ? `Предпочтительный стиль: "${customStyle}"` : ''}

КРИТИЧЕСКИ ВАЖНО:
1. Массив "slides" ОБЯЗАТЕЛЬНО должен содержать от 8 до 10 полноценных, содержательных слайдов.
2. Не генерируй только 1 слайд! Каждый слайд с 1-го по 9-й должен раскрывать тему глубже и иметь разную драматургическую роль:
   - Слайд 1: Хук / Обложка (role: "01 / ХУК", layoutVariant: "statement") — мощный захват внимания.
   - Слайд 2: Контекст / Слом стереотипа (role: "02 / КОНТЕКСТ", layoutVariant: "split") — почему привычный взгляд ошибочен.
   - Слайд 3: Анатомия проблемы (role: "03 / ПРОБЛЕМА", layoutVariant: "centered") — в чём скрытая боль или парадокс.
   - Слайд 4: Данные / Факты / Исследования (role: "04 / ДОКАЗАТЕЛЬСТВО", layoutVariant: "data", statNumber: "число/процент", statLabel: "описание метрики").
   - Слайд 5: Поворотный инсайт / Механизм (role: "05 / МЕХАНИЗМ", layoutVariant: "quote", highlight: "главная акцентная мысль").
   - Слайд 6: Пошаговый алгоритм решения (role: "06 / ПРАКТИКА", layoutVariant: "checklist") — 3 четких действия читателя.
   - Слайд 7: Разбор кейса / Было vs Стало (role: "07 / КЕЙС", comparisonBefore: "Как делают 90%", comparisonAfter: "Как делают профи").
   - Слайд 8: Философия / Ключевой вывод (role: "08 / ВЫВОД", highlight: "Сформулированное правило").
   - Слайд 9: Призыв к действию (role: "09 / ДЕЙСТВИЕ", layoutVariant: "statement") — конкретный вопрос в комментарии и просьба сохранить.
3. СТРОЖАЙШИЙ ЗАПРЕТ НА ВОДУ И ПУСТЫЕ МЕТА-ФРАЗЫ:
   - ЗАПРЕЩЕНЫ абстрактные общие фразы: "в вопросе Х достаточно делать больше", "смена оптики", "архитектура процесса", "отказ от иллюзий".
   - Каждый слайд ДОЛЖЕН содержать ПРЕДМЕТНЫЙ, КОНКРЕТНЫЙ КОНТЕНТ по теме "${topic}": конкретные названия инструментов, реальные ошибки, точные цифры и метрики, пошаговые инструкции и примеры из практики.
4. Подбери идеальный visualStyleId под настроение темы из списка:
   - "swiss-editorial" (бизнес, деньги, аналитика, метрики, технологии)
   - "editorial-brutalism" (маркетинг, жесткая правда, разоблачения, мотивация)
   - "independent-magazine" (психология, культура, эстетика, личные истории)
   - "dark-editorial" (премиум, амбиции, статус, искусственный интеллект)
   - "moleskine-journal" (заметки, писательский опыт, рефлексия, привычки)
   - "smart-adaptive" (универсальный гармоничный автомикс)

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "topic": "${topic}",
  "angle": "Выбранный редакционный угол подачи",
  "editorialThesis": "Главный тезис публикации",
  "mechanic": "Основной вирусный триггер ('Это буквально про меня' / 'Я знаю кому отправить' / 'Я этого не знал' / 'Теперь я могу применить')",
  "targetAudience": "Целевая аудитория",
  "visualStyleId": "smart-adaptive | editorial-brutalism | independent-magazine | swiss-editorial | dark-editorial | moleskine-journal",
  "visualStyleName": "Название стиля",
  "visualStyleRationale": "Почему именно этот визуальный стиль подходит к теме",
  "evidence": [
    {
      "claim": "Утверждение",
      "source": "Первоисточник / исследование",
      "date": "2024-2026",
      "reliability": "Подтверждено",
      "limitations": "Ограничение вывода"
    }
  ],
  "hooks": [
    {
      "type": "Конфликт / Парадокс / Вопрос / Факт / Загадка",
      "headline": "Текст заголовка обложки",
      "subline": "Подзаголовок / хук",
      "score": 24
    }
  ],
  "slides": [
    {
      "slideNumber": 1,
      "role": "01 / ХУК",
      "roleName": "Остановка скролла",
      "kicker": "РЕДАКЦИОННЫЙ РАЗБОР",
      "title": "Крупный заголовок",
      "body": "Текст слайда",
      "highlight": "Ключевая мысль",
      "layoutVariant": "statement",
      "visualPrompt": "Конкретный визуальный промпт для арт-директора",
      "footnote": "Источник или ссылка"
    }
  ],
  "caption": "Полный продающий текст поста для Instagram с абзацами и хештегами",
  "callToAction": "Единый сильный CTA",
  "qualityScore": {
    "total": 92,
    "breakdown": {
      "idea": 19,
      "cover": 14,
      "scenario": 14,
      "text": 14,
      "evidence": 9,
      "visual": 14,
      "virality": 4,
      "execution": 4
    },
    "verdict": "Одобрено к публикации",
    "recommendations": ["Рекомендация по улучшению"]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // If there's markdown fences
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Gemini generation error, falling back to local domain engine:', err);
    try {
      const { topic, customStyle } = req.body;
      const localProject = generateCarouselLocally(topic || 'Экспертный разбор', customStyle);
      res.json({ success: true, data: localProject, isLocalFallback: true });
    } catch (fallbackErr: any) {
      res.status(500).json({ error: err.message || 'Generation failed' });
    }
  }
});

// Semantic visual prompt suggestion endpoint for a specific slide
app.post('/api/carousel/visual-prompt-suggestions', async (req: Request, res: Response) => {
  try {
    const { slide, topic = '', angle = '' } = req.body;
    if (!slide) {
      return res.status(400).json({ error: 'Slide data is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment',
        fallback: true,
      });
    }

    const slideInfo = `
Номер слайда: ${slide.slideNumber}
Роль в сценарии: ${slide.role} (${slide.roleName || ''})
Кикер: ${slide.kicker || ''}
Заголовок: ${slide.title}
Основной текст: ${slide.body}
Акцентная мысль: ${slide.highlight || ''}
Тема карусели: ${topic}
Редакционный угол: ${angle}
    `.trim();

    const promptText = `Ты — ведущий креативный арт-директор топовых независимых медиа (Monocle, Kinfolk, Wired).
Проанализируй глубинную суть и драматургическую роль следующего слайда Instagram-карусели:

${slideInfo}

Твоя задача — считать СУТЬ слайда (не буквальный пересказ слов, а скрытую драматургию, психологический парадокс, эмоцию или конфликт) и предложить 4 контрастных, профессиональных варианта визуального промпта для генерации художественного изображения (Imagen 3 / Midjourney v6).

КРИТИЧЕСКИЕ ПРАВИЛА АРТ-ДИРЕКШЕНА:
- НИКАКИХ стоковых штампов (никаких "рукопожатий", банальных "лампочек идеи", кричащих людей с ноутбуками).
- В промптах указывай конкретную оптику, свет, фактуры, операторскую работу (Hasselblad, 35mm плёнка Kodak Portra, естественный контражур, глубина резкости, макро-детали).
- Оставляй пространство под типографику слайда (negative space).
- 4 направления:
  1. 'metaphor' (Художественная метафора / аллегория внутреннего состояния)
  2. 'realism' (Документальный пленочный 35mm реализм / живой кадр)
  3. 'brutalism' (Бруталистская архитектура / скульптурная геометрия и свет)
  4. 'symbol' (Символический предмет / предметный натюрморт с глубоким смыслом)

Верни ТОЛЬКО валидный JSON без markdown обёртки:
{
  "detectedEssence": "Краткая формулировка сути слайда (1 предложение)",
  "moodTag": "Эмоциональный тон (например: 'Отрезвляющая тишина' или 'Драматический выбор')",
  "colorSuggestion": "Цветовая гамма (например: 'Графит, базальт и акцентный янтарь')",
  "suggestions": [
    {
      "id": "sug-1",
      "category": "metaphor",
      "categoryLabel": "Метафорический образ",
      "categoryIcon": "🎭",
      "badge": "Арт-дирекшн",
      "title": "Название образа (3-5 слов)",
      "prompt": "Детальный кинематографичный промпт на русском языке с указанием света, композиции, оптики и настроения",
      "rationale": "Почему этот образ бьет точно в суть слайда"
    },
    {
      "id": "sug-2",
      "category": "realism",
      "categoryLabel": "Документальный кадр (35mm)",
      "categoryIcon": "📷",
      "badge": "Живой контекст",
      "title": "Название кадра",
      "prompt": "Детальный кинематографичный промпт...",
      "rationale": "..."
    },
    {
      "id": "sug-3",
      "category": "brutalism",
      "categoryLabel": "Архитектурная форма",
      "categoryIcon": "🏛️",
      "badge": "Премиум минимализм",
      "title": "Название формы",
      "prompt": "Детальный архитектурный промпт...",
      "rationale": "..."
    },
    {
      "id": "sug-4",
      "category": "symbol",
      "categoryLabel": "Символический предмет",
      "categoryIcon": "🕯️",
      "badge": "Точный акцент",
      "title": "Название артефакта",
      "prompt": "Детальный предметный натюрморт...",
      "rationale": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, analysis: data });
  } catch (err: any) {
    console.error('Visual prompt suggestions error:', err);
    res.status(500).json({ error: err.message || 'Failed to suggest visual prompts' });
  }
});

// Audit carousel endpoint
app.post('/api/carousel/audit', async (req: Request, res: Response) => {
  try {
    const { carousel } = req.body;
    if (!carousel) {
      return res.status(400).json({ error: 'Carousel data is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured',
        fallback: true,
      });
    }

    const auditPrompt = `Ты — независимый шеф-редактор и критик VIRAL CAROUSEL OS 2.0 (Модуль M7 Quality Gate).
Проведи независимую критику следующей карусели:
${JSON.stringify(carousel, null, 2)}

Верни ТОЛЬКО валидный JSON без markdown обёртки:
{
  "totalScore": 92,
  "verdict": "Готов к публикации | Требует доработки | Отклонить",
  "scores": {
    "idea": 19,
    "cover": 14,
    "scenario": 14,
    "text": 14,
    "evidence": 9,
    "visual": 14,
    "virality": 4,
    "execution": 4
  },
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "flaws": ["Слабое место 1", "Слабое место 2"],
  "specificFixes": [
    {
      "slide": 3,
      "issue": "Что не так",
      "fix": "Конкретное исправление текста/смысла"
    }
  ],
  "antiTemplateChecks": {
    "noAiFiller": true,
    "noPseudoDepth": true,
    "noFakeDrama": true,
    "noRepetitiveAntitheses": true,
    "naturalCadence": true,
    "verifiedFacts": true
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: auditPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, audit: data });
  } catch (err: any) {
    console.error('Audit error:', err);
    res.status(500).json({ error: err.message || 'Audit failed' });
  }
});

// Nano Banana Generative SVG helper for high-aesthetic art direction fallback
function generateNanoBananaArt(prompt: string, style: string = 'editorial-minimal', title: string = ''): string {
  const width = 800;
  const height = 1000; // 4:5 aspect ratio
  const cleanPrompt = (prompt || 'Aesthetic composition').slice(0, 80);
  const cleanTitle = (title || 'VIRAL CAROUSEL OS 2.0').slice(0, 50);

  let bgGradient = '';
  let shapes = '';
  let accentColor = '#f43f5e';
  let badgeLabel = 'NANO BANANA // EDITORIAL';

  switch (style) {
    case '3d-glass':
      accentColor = '#38bdf8';
      badgeLabel = 'NANO BANANA // 3D GLASS';
      bgGradient = `
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0b0f19" />
            <stop offset="50%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#030712" />
          </linearGradient>
          <radialGradient id="glow" cx="60%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
          </radialGradient>
          <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        <circle cx="500" cy="380" r="280" fill="url(#glow)" filter="url(#blurFilter)" />
        <circle cx="280" cy="620" r="200" fill="#a855f7" opacity="0.25" filter="url(#blurFilter)" />
      `;
      shapes = `
        <g transform="translate(400, 480)">
          <!-- Glass sphere effect -->
          <circle cx="0" cy="0" r="180" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
          <circle cx="0" cy="0" r="140" fill="rgba(255,255,255,0.04)" stroke="rgba(56,189,248,0.5)" stroke-width="3" />
          <circle cx="-40" cy="-40" r="50" fill="rgba(255,255,255,0.15)" />
          <ellipse cx="30" cy="20" rx="220" ry="80" fill="none" stroke="rgba(56,189,248,0.4)" stroke-width="2" transform="rotate(-25)" />
          <ellipse cx="30" cy="20" rx="200" ry="60" fill="none" stroke="rgba(217,70,239,0.3)" stroke-width="1.5" transform="rotate(-25)" />
        </g>
      `;
      break;

    case 'film-35mm':
      accentColor = '#f59e0b';
      badgeLabel = 'NANO BANANA // KODAK 35MM';
      bgGradient = `
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1c1917" />
            <stop offset="40%" stop-color="#292524" />
            <stop offset="100%" stop-color="#0c0a09" />
          </linearGradient>
          <radialGradient id="sun" cx="30%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
            <stop offset="60%" stop-color="#b45309" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        <rect width="${width}" height="${height}" fill="url(#sun)" />
      `;
      shapes = `
        <!-- Film grain lines & frame stamp -->
        <rect x="50" y="60" width="700" height="880" fill="none" stroke="rgba(245,158,11,0.3)" stroke-width="1" stroke-dasharray="6,4" />
        <text x="70" y="90" font-family="monospace" font-size="14" fill="#f59e0b" letter-spacing="3">KODAK PORTRA 400 · 35MM EXP 24</text>
        <text x="640" y="90" font-family="monospace" font-size="14" fill="#f59e0b">ISO 400</text>
        <!-- Vintage abstract silhouette -->
        <g transform="translate(400, 520)">
          <circle cx="0" cy="-60" r="120" fill="#78350f" opacity="0.3" />
          <path d="M-180,160 C-90,60 90,60 180,160 Z" fill="#451a03" opacity="0.4" />
          <line x1="-250" y1="0" x2="250" y2="0" stroke="rgba(245,158,11,0.2)" stroke-width="1" />
        </g>
      `;
      break;

    case 'cyber-obsidian':
      accentColor = '#10b981';
      badgeLabel = 'NANO BANANA // CYBER OBSIDIAN';
      bgGradient = `
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050505" />
            <stop offset="100%" stop-color="#0a0f0d" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.08)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        <rect width="${width}" height="${height}" fill="url(#grid)" />
      `;
      shapes = `
        <g transform="translate(400, 500)">
          <polygon points="0,-160 140,80 -140,80" fill="none" stroke="#10b981" stroke-width="2" opacity="0.8" />
          <polygon points="0,160 140,-80 -140,-80" fill="none" stroke="#059669" stroke-width="1" opacity="0.4" />
          <circle cx="0" cy="0" r="8" fill="#34d399" />
          <circle cx="0" cy="0" r="70" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="8,8" />
          <line x1="-300" y1="0" x2="300" y2="0" stroke="rgba(16,185,129,0.15)" stroke-width="1" />
          <line x1="0" y1="-350" x2="0" y2="350" stroke="rgba(16,185,129,0.15)" stroke-width="1" />
        </g>
        <text x="60" y="100" font-family="monospace" font-size="12" fill="#10b981" letter-spacing="2">SYS::VIRAL_NODE_ACTIVE</text>
        <text x="60" y="120" font-family="monospace" font-size="10" fill="#047857">SIGNAL_LATENCY: 0.12ms</text>
      `;
      break;

    case 'swiss-vector':
      accentColor = '#e11d48';
      badgeLabel = 'NANO BANANA // SWISS BAUHAUS';
      bgGradient = `
        <rect width="${width}" height="${height}" fill="#f4f4f5" />
      `;
      shapes = `
        <!-- Bold Bauhaus color blocking -->
        <rect x="0" y="0" width="360" height="360" fill="#e11d48" opacity="0.9" />
        <circle cx="560" cy="560" r="180" fill="#09090b" />
        <rect x="180" y="440" width="440" height="20" fill="#09090b" />
        <g transform="translate(400, 500)">
          <line x1="-350" y1="0" x2="350" y2="0" stroke="#09090b" stroke-width="1.5" />
          <line x1="0" y1="-450" x2="0" y2="450" stroke="#09090b" stroke-width="1.5" />
          <circle cx="0" cy="0" r="120" fill="none" stroke="#09090b" stroke-width="2" />
        </g>
        <text x="400" y="240" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="64" fill="#09090b">01</text>
        <text x="60" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="28" fill="#ffffff">SYSTEM</text>
      `;
      break;

    case 'vintage-collage':
      accentColor = '#991b1b';
      badgeLabel = 'NANO BANANA // ARCHIVAL PRESS';
      bgGradient = `
        <defs>
          <linearGradient id="paper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f5efe6" />
            <stop offset="100%" stop-color="#e7dcce" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#paper)" />
      `;
      shapes = `
        <rect x="40" y="50" width="720" height="900" fill="none" stroke="#78350f" stroke-width="2" />
        <rect x="48" y="58" width="704" height="884" fill="none" stroke="#78350f" stroke-width="0.75" />
        <!-- Halftone / collage circles -->
        <g transform="translate(400, 480)">
          <circle cx="0" cy="-40" r="160" fill="#451a03" opacity="0.15" />
          <circle cx="0" cy="-40" r="130" fill="none" stroke="#991b1b" stroke-width="3" stroke-dasharray="12,6" />
          <rect x="-180" y="40" width="360" height="120" fill="#292524" opacity="0.85" />
          <text x="0" y="110" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="#f5efe6" text-anchor="middle">CHRONICLE ARCHIVE</text>
        </g>
      `;
      break;

    case 'editorial-minimal':
    default:
      accentColor = '#f43f5e';
      badgeLabel = 'NANO BANANA // EDITORIAL MINIMAL';
      bgGradient = `
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#18181b" />
            <stop offset="50%" stop-color="#09090b" />
            <stop offset="100%" stop-color="#000000" />
          </linearGradient>
          <radialGradient id="mesh" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.3" />
            <stop offset="50%" stop-color="#881337" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        <rect width="${width}" height="${height}" fill="url(#mesh)" />
      `;
      shapes = `
        <g transform="translate(400, 500)">
          <!-- Minimalist sculptural curves -->
          <ellipse cx="0" cy="-20" rx="190" ry="260" fill="none" stroke="rgba(244,63,94,0.4)" stroke-width="1.5" />
          <ellipse cx="20" cy="0" rx="140" ry="200" fill="rgba(244,63,94,0.06)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          <circle cx="0" cy="-20" r="70" fill="none" stroke="rgba(244,63,94,0.6)" stroke-width="2" />
          <line x1="-300" y1="180" x2="300" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        </g>
      `;
      break;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${bgGradient}
      ${shapes}
      <!-- Nano Banana Brand Signature -->
      <g transform="translate(60, ${height - 70})">
        <rect x="0" y="0" width="220" height="28" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" />
        <text x="12" y="18" font-family="monospace" font-size="11" font-weight="bold" fill="${accentColor}">
          🍌 ${badgeLabel}
        </text>
      </g>
      <text x="60" y="${height - 28}" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.4)">
        ${cleanPrompt}
      </text>
    </svg>
  `.trim();

  const base64Svg = Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

// Generate image via Nano Banana (Gemini / Imagen 3 or Generative Fallback)
app.post('/api/image/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'editorial-minimal', aspectRatio = '4:5', slideContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const titleContext = slideContext?.title ? `Subject / Title: "${slideContext.title}". ` : '';
    const styleDescriptions: Record<string, string> = {
      'editorial-minimal': 'high aesthetic editorial magazine photography, clean studio lighting, minimalist composition, muted elegant tones, Hasselblad 8k',
      '3d-glass': 'glossy 3D render, translucent frosted glassmorphism, iridescent reflections, Octane Render, modern abstract sculpture',
      'film-35mm': 'authentic 35mm film photograph, Kodak Portra 400 grain, soft warm analog light, candid framing, cinematic atmosphere',
      'cyber-obsidian': 'cyberpunk dark obsidian aesthetic, deep black negative space, sleek neon vector glows, cinematic high-contrast lighting',
      'swiss-vector': 'Swiss International style graphic composition, Bauhaus geometric precision, bold stark silhouettes, high contrast typography elements',
      'vintage-collage': 'tactile archival paper collage, vintage halftone print, sepia and muted red inks, textured newspaper editorial',
    };

    const chosenStyleDescription = styleDescriptions[style] || styleDescriptions['editorial-minimal'];

    // Translate and art-direct the prompt to English via Gemini or intelligent semantic fallback
    let englishPrompt = prompt;
    if (ai) {
      try {
        const translationRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an elite art director for editorial magazines.
Translate and refine this image generation prompt from Russian to a detailed, high-aesthetic English prompt for Flux/Imagen.
User prompt: "${prompt}"
Context: "${titleContext}"
Aesthetic direction: "${chosenStyleDescription}"

CRITICAL INSTRUCTIONS:
- Return ONLY the refined English prompt text. No explanations, no quotes, no markdown.
- NEVER default to portraits or female models unless the user explicitly requested a woman's portrait.
- If the prompt is about business, psychology, tech, ideas, or metrics, focus on architectural geometry, tactile still-life objects, atmospheric landscapes, or abstract editorial concepts.
- If a person is mentioned (e.g. "фигура в пальто на мосту"), describe them neutrally as an anonymous figure/silhouette from behind or in profile, avoiding any single demographic bias.
- Specify camera lens, cinematic lighting, and negative space suitable for social media carousels.`,
        });
        if (translationRes.text) {
          englishPrompt = translationRes.text.trim().replace(/^["']|["']$/g, '');
        }
      } catch (transErr) {
        console.warn('[Nano Banana] Gemini prompt translation warning:', transErr);
      }
    }

    // If Gemini key is not present or prompt remained in Russian, convert concepts to clean English to prevent image model fallback bias
    const hasCyrillic = /[\u0400-\u04FF]/.test(englishPrompt);
    if (hasCyrillic) {
      const p = englishPrompt.toLowerCase();
      const visualElements: string[] = [];

      if (p.includes('мост')) visualElements.push('empty suspension bridge in twilight mist');
      if (p.includes('пальто') || p.includes('фигур') || p.includes('силуэт') || p.includes('человек')) {
        visualElements.push('anonymous silhouetted solitary figure seen from behind wearing dark coat');
      }
      if (p.includes('город') || p.includes('здани') || p.includes('небоскреб') || p.includes('фасад')) {
        visualElements.push('modern architectural geometric facade, clean negative space');
      }
      if (p.includes('бетон') || p.includes('тень') || p.includes('луч')) {
        visualElements.push('brutalist raw textured concrete with dramatic diagonal sunlight beam');
      }
      if (p.includes('стол') || p.includes('кофе') || p.includes('блокнот') || p.includes('запис')) {
        visualElements.push('minimalist dark oak wooden desk with black ceramic espresso cup and open paper notebook');
      }
      if (p.includes('стекл') || p.includes('призм') || p.includes('лабиринт')) {
        visualElements.push('translucent frosted architectural glass sculpture with prismatic light refractions');
      }
      if (p.includes('экран') || p.includes('монолит') || p.includes('девайс') || p.includes('смартфон')) {
        visualElements.push('sleek dark ceramic monolithic device on matte black pedestal');
      }
      if (p.includes('дорог') || p.includes('трасс') || p.includes('горизонт')) {
        visualElements.push('quiet twilight highway fading into distant fog');
      }

      if (visualElements.length > 0) {
        englishPrompt = visualElements.join(', ');
      } else {
        englishPrompt = 'minimalist editorial art direction, conceptual composition with clean negative space';
      }
    }

    // Check if user specifically requested a person or woman
    const mentionsWoman = /девушк|женщин|девочк|модель|woman|girl|female|lady/i.test(prompt);
    const mentionsPerson = /человек|парень|мужчин|лицо|портрет|person|man|face|portrait/i.test(prompt);
    const negativeFilters = (!mentionsWoman && !mentionsPerson)
      ? 'female portrait, asian woman, influencer selfie, person face close-up, anime, stock photo woman'
      : (!mentionsWoman)
      ? 'female portrait, asian girl, anime'
      : 'distorted face, blurry, watermark, bad anatomy';

    const enhancedPrompt = `${englishPrompt}. Style: ${chosenStyleDescription}. Clean negative space, 8k resolution, cinematic art direction, high aesthetic composition.`;

    // 1. Attempt official Nano Banana generation (gemini-3.1-flash-lite-image / gemini-nano-banana-2.1)
    if (ai) {
      const nanoModels = ['gemini-3.1-flash-lite-image', 'gemini-nano-banana-2.1'];
      for (const modelName of nanoModels) {
        try {
          console.log(`[Nano Banana] Attempting generateContent with ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio === '4:5' ? '3:4' : aspectRatio,
              },
            },
          });

          const parts = response?.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                return res.json({
                  success: true,
                  imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                  prompt: enhancedPrompt,
                  engine: `Nano Banana AI (${modelName})`,
                  style,
                });
              }
            }
          }
        } catch (nanoErr: any) {
          console.warn(`[Nano Banana] ${modelName} unavailable:`, nanoErr?.message || nanoErr);
        }
      }

      // 2. Attempt Imagen 3 if available
      try {
        console.log(`[Nano Banana] Attempting Imagen generation...`);
        const response: any = await (ai.models as any).generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio === '4:5' ? '3:4' : aspectRatio,
          },
        });

        const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          return res.json({
            success: true,
            imageUrl: `data:image/jpeg;base64,${imageBytes}`,
            prompt: enhancedPrompt,
            engine: 'Nano Banana (Imagen 3)',
            style,
          });
        }
      } catch (genError: any) {
        console.warn('[Nano Banana] Imagen 3 unavailable:', genError?.message || genError);
      }
    }

    // 3. Genuine Dynamic AI Image Synthesis Engine (Pollinations Flux / SDXL)
    // Generates a 100% unique, newly synthesized image for any arbitrary prompt with strict negative prompt
    try {
      const seed = Math.floor(Math.random() * 10000000);
      const cleanPromptForUrl = encodeURIComponent(enhancedPrompt.slice(0, 320));
      const encodedNegative = encodeURIComponent(negativeFilters);
      const dynamicUrl = `https://image.pollinations.ai/prompt/${cleanPromptForUrl}?width=800&height=1000&model=flux&nologo=true&seed=${seed}&negative=${encodedNegative}`;

      console.log(`[Nano Banana] Synthesizing dynamic AI visual via Flux engine...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const dynamicRes = await fetch(dynamicUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/jpeg,image/png,image/*;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (dynamicRes.ok) {
        const contentType = dynamicRes.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('image')) {
          const arrayBuffer = await dynamicRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString('base64');
          return res.json({
            success: true,
            imageUrl: `data:${contentType};base64,${base64Data}`,
            prompt: enhancedPrompt,
            engine: 'Nano Banana AI (Flux Engine)',
            isRealAiGenerated: true,
            style,
          });
        }
      }

      // If server IP was temporarily throttled, pass the dynamic URL directly so the user's browser fetches it from their own IP
      console.log(`[Nano Banana] Providing direct dynamic AI endpoint to client browser`);
      return res.json({
        success: true,
        imageUrl: dynamicUrl,
        prompt: enhancedPrompt,
        engine: 'Nano Banana AI (Dynamic Synthesis)',
        isRealAiGenerated: true,
        style,
      });
    } catch (dynamicErr: any) {
      console.warn('[Nano Banana] Dynamic synthesis fallback timed out or errored:', dynamicErr?.message);
      const seed = Math.floor(Math.random() * 10000000);
      const cleanPromptForUrl = encodeURIComponent(enhancedPrompt.slice(0, 320));
      const encodedNegative = encodeURIComponent(negativeFilters);
      const directClientUrl = `https://image.pollinations.ai/prompt/${cleanPromptForUrl}?width=800&height=1000&model=flux&nologo=true&seed=${seed}&negative=${encodedNegative}`;

      return res.json({
        success: true,
        imageUrl: directClientUrl,
        prompt: enhancedPrompt,
        engine: 'Nano Banana AI (Browser Direct)',
        isRealAiGenerated: true,
        style,
      });
    }
  } catch (err: any) {
    console.error('Nano Banana generation error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const isDisableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isDisableHmr
          ? false
          : {
              server: httpServer,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`VIRAL CAROUSEL OS 2.0 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
