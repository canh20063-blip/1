import React, { useState, useRef, useMemo } from 'react';
import { SlideItem, ImageFrameSettings } from '../types/carousel';
import {
  Edit3,
  X,
  Check,
  Upload,
  Sparkles,
  Trash2,
  Sliders,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Copy,
  Wand2,
  Lightbulb,
  Eye,
  CheckCircle2,
  ArrowRight,
  Plus,
  RotateCcw,
  Type,
  FileText,
  Tag,
  Award,
  BarChart2,
  Scale,
  Bookmark,
  ArrowUp,
  ArrowDown,
  Move,
  Crop,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import {
  analyzeSlideAndSuggestPrompts,
  SlideVisualAnalysis,
  VisualPromptSuggestion,
} from '../utils/visualPromptEngine';
import {
  EDITORIAL_PHOTO_PRESETS,
  EditorialPhotoPreset,
} from '../data/editorialPresets';

interface SlideEditorProps {
  slide: SlideItem;
  totalSlides: number;
  topic?: string;
  angle?: string;
  editorialThesis?: string;
  onUpdateSlide: (updatedSlide: SlideItem) => void;
  onSelectSlide?: (idx: number) => void;
  onNewProject?: () => void;
  onClose?: () => void;
}

const NANO_BANANA_STYLES = [
  { id: 'editorial-minimal', label: '🎨 Эдиториал / Глянец', desc: 'Премиальное журнальное фото, мягкий свет' },
  { id: '3d-glass', label: '🗿 3D Стекло & Металл', desc: 'Глянцевый рендер, матовое стекло, неоновые блики' },
  { id: 'film-35mm', label: '🎞️ Пленка 35mm', desc: 'Аналоговое зерно Kodak Portra, теплый свет' },
  { id: 'cyber-obsidian', label: '⚡ Кибер-Обсидиан', desc: 'Глубокий черный, неоновые акценты' },
  { id: 'swiss-vector', label: '📐 Швейцарский чертеж', desc: 'Геометрия Баухаус, четкие линии' },
  { id: 'vintage-collage', label: '📰 Винтаж-Коллаж', desc: 'Архивная бумага, ретро-газета, типографика' },
];

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  totalSlides,
  topic,
  angle,
  editorialThesis,
  onUpdateSlide,
  onSelectSlide,
  onNewProject,
  onClose,
}) => {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genPrompt, setGenPrompt] = useState(slide.visualPrompt || slide.title);
  const [genStyle, setGenStyle] = useState('editorial-minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // AI Semantic prompt suggestion state
  const [customAnalysis, setCustomAnalysis] = useState<SlideVisualAnalysis | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Curated photo gallery state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute local instant semantic analysis
  const localAnalysis = useMemo(() => {
    return analyzeSlideAndSuggestPrompts(slide, topic, angle);
  }, [slide.title, slide.body, slide.highlight, slide.kicker, slide.role, topic, angle]);

  const activeAnalysis = customAnalysis || localAnalysis;

  const handleChange = (field: keyof SlideItem, value: any) => {
    onUpdateSlide({
      ...slide,
      [field]: value,
    });
  };

  // Handle local user file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGenError('Пожалуйста, выберите файл изображения (PNG, JPG, WebP и т.д.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateSlide({
          ...slide,
          imageUrl: dataUrl,
          imageSource: 'upload',
          imageDisplayMode: slide.imageDisplayMode || 'background',
          imageOverlayDarkness: slide.imageOverlayDarkness ?? 60,
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image URL submission
  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    onUpdateSlide({
      ...slide,
      imageUrl: imageUrlInput.trim(),
      imageSource: 'upload',
      imageDisplayMode: slide.imageDisplayMode || 'background',
      imageOverlayDarkness: slide.imageOverlayDarkness ?? 60,
    });
    setImageUrlInput('');
    setIsUrlInputOpen(false);
  };

  // Generate via Nano Banana backend endpoint
  const handleGenerateNanoBanana = async (promptOverride?: string) => {
    const promptToSend = (promptOverride || genPrompt || slide.visualPrompt || slide.title).trim();
    if (!promptToSend) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          style: genStyle,
          aspectRatio: '4:5',
          slideContext: {
            title: slide.title,
            kicker: slide.kicker,
            role: slide.roleName,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        onUpdateSlide({
          ...slide,
          imageUrl: data.imageUrl,
          imagePrompt: promptToSend,
          imageSource: 'nano-banana',
          imageDisplayMode: slide.imageDisplayMode || 'background',
          imageOverlayDarkness: slide.imageOverlayDarkness ?? 60,
        });
        setIsGeneratorOpen(false);
      } else {
        setGenError(data.error || 'Не удалось сгенерировать изображение');
      }
    } catch (err: any) {
      setGenError(err.message || 'Ошибка связи с сервером генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  const ALL_MANAGEABLE_BLOCKS = [
    { id: 'title', label: 'Главный заголовок', icon: '📝', desc: 'Ключевой посыл слайда' },
    { id: 'body', label: 'Основной текст', icon: '📄', desc: 'Текстовое раскрытие / чеклист' },
    { id: 'highlight', label: 'Акцентная мысль', icon: '💡', desc: 'Выделенный тезис / цитата' },
    { id: 'image', label: 'Визуал / Картинка', icon: '🖼️', desc: 'Nano Banana AI или медиатека' },
    { id: 'kicker', label: 'Кикер (Рубрика)', icon: '🏷️', desc: 'Надзаголовок' },
    { id: 'roleName', label: 'Функция в истории', icon: '🎖️', desc: 'Бейдж роли слайда' },
    { id: 'stats', label: 'Метрика / Цифра', icon: '📊', desc: 'Большое число и подпись' },
    { id: 'comparison', label: 'Сравнение До/После', icon: '⚖️', desc: 'Контраст двух подходов' },
    { id: 'footnote', label: 'Сноска / Источник', icon: '📌', desc: 'Подтверждение данных' },
    { id: 'swipePrompt', label: 'Подсказка свайпа', icon: '➡️', desc: 'Индикатор SWIPE →' },
  ];

  const isBlockVisible = (key: string): boolean => {
    if (slide.hiddenBlocks && slide.hiddenBlocks.includes(key)) {
      return false;
    }
    return true;
  };

  const handleDeleteBlock = (blockKey: string) => {
    const currentHidden = slide.hiddenBlocks || [];
    if (!currentHidden.includes(blockKey)) {
      const updatedHidden = [...currentHidden, blockKey];
      if (blockKey === 'image') {
        onUpdateSlide({
          ...slide,
          hiddenBlocks: updatedHidden,
          imageUrl: undefined,
          imagePrompt: undefined,
          imageSource: undefined,
        });
      } else {
        onUpdateSlide({
          ...slide,
          hiddenBlocks: updatedHidden,
        });
      }
    }
  };

  const handleRestoreBlock = (blockKey: string) => {
    const currentHidden = slide.hiddenBlocks || [];
    const updatedHidden = currentHidden.filter((k) => k !== blockKey);
    const patch: Partial<SlideItem> = { hiddenBlocks: updatedHidden };

    if (blockKey === 'kicker' && !slide.kicker) patch.kicker = 'РУБРИКА';
    if (blockKey === 'roleName' && !slide.roleName) patch.roleName = 'ИНСАЙТ';
    if (blockKey === 'title' && !slide.title) patch.title = 'Новый заголовок слайда';
    if (blockKey === 'body' && !slide.body) patch.body = 'Основное раскрытие идеи или практический совет...';
    if (blockKey === 'highlight' && !slide.highlight) patch.highlight = 'Выделенный тезис для запоминания';
    if (blockKey === 'footnote' && !slide.footnote) patch.footnote = 'VIRAL CAROUSEL OS 2.0';
    if (blockKey === 'stats') {
      if (!slide.statNumber) patch.statNumber = '74%';
      if (!slide.statLabel) patch.statLabel = 'Доказательная база';
    }
    if (blockKey === 'comparison') {
      if (!slide.comparisonBefore) patch.comparisonBefore = 'Как делали раньше';
      if (!slide.comparisonAfter) patch.comparisonAfter = 'Как работает в 2026';
    }
    if (blockKey === 'image') {
      setIsGeneratorOpen(true);
    }

    onUpdateSlide({
      ...slide,
      ...patch,
    });
  };

  const handleRestoreAll = () => {
    onUpdateSlide({
      ...slide,
      hiddenBlocks: [],
    });
  };

  const handleUpdateImageFrame = (settings: Partial<ImageFrameSettings>) => {
    onUpdateSlide({
      ...slide,
      imageFrameSettings: {
        ...(slide.imageFrameSettings || {}),
        ...settings,
      },
    });
  };

  const handleMoveBlock = (blockKey: string, direction: 'up' | 'down') => {
    const defaultOrder = ['kicker', 'roleName', 'title', 'image', 'highlight', 'body', 'stats', 'comparison', 'footnote', 'swipePrompt'];
    const currentOrder = slide.blockOrder && slide.blockOrder.length > 0
      ? [...slide.blockOrder]
      : [...defaultOrder];

    defaultOrder.forEach((k) => {
      if (!currentOrder.includes(k)) currentOrder.push(k);
    });

    const idx = currentOrder.indexOf(blockKey);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx - 1];
      currentOrder[idx - 1] = temp;
    } else if (direction === 'down' && idx < currentOrder.length - 1) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx + 1];
      currentOrder[idx + 1] = temp;
    }

    onUpdateSlide({
      ...slide,
      blockOrder: currentOrder,
    });
  };

  const handleApplyOrderPreset = (order: string[]) => {
    onUpdateSlide({
      ...slide,
      blockOrder: order,
    });
  };

  // Remove image
  const handleRemoveImage = () => {
    handleDeleteBlock('image');
  };

  // Apply a suggested visual prompt into slide.visualPrompt and generator
  const handleApplySuggestion = (sug: VisualPromptSuggestion) => {
    handleChange('visualPrompt', sug.prompt);
    setGenPrompt(sug.prompt);
    setAppliedSuggestionId(sug.id);
    setTimeout(() => setAppliedSuggestionId(null), 2500);
  };

  // Apply and immediately trigger Nano Banana generator
  const handleApplyAndGenerate = (sug: VisualPromptSuggestion) => {
    handleApplySuggestion(sug);
    setIsGeneratorOpen(true);
    handleGenerateNanoBanana(sug.prompt);
  };

  // Select a photo from curated editorial library
  const handleSelectPresetPhoto = (preset: EditorialPhotoPreset) => {
    onUpdateSlide({
      ...slide,
      imageUrl: preset.url,
      imagePrompt: preset.description,
      imageSource: 'preset',
      imageDisplayMode: slide.imageDisplayMode || 'background',
      imageOverlayDarkness: slide.imageOverlayDarkness ?? 60,
    });
    setIsGalleryOpen(false);
  };

  // Deep AI semantic analysis via server endpoint
  const handleDeepAiAnalyze = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/carousel/visual-prompt-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide,
          topic,
          angle,
        }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setCustomAnalysis(data.analysis);
      }
    } catch (e) {
      console.warn('AI prompt suggestion fallback to local engine:', e);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!slide.visualPrompt) return;
    navigator.clipboard.writeText(slide.visualPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      {/* Hidden file input for native upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header with Navigation & New Project Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Редактор слайда #{slide.slideNumber}
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono">
              {slide.role} · {slide.roleName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Slide Switcher */}
          {onSelectSlide && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-neutral-500 mr-1 hidden sm:inline">Слайд:</span>
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onSelectSlide(i)}
                  className={`w-5 h-5 rounded text-[10px] font-mono font-bold transition-all ${
                    slide.slideNumber === i + 1
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* New Project Button directly in editor */}
          {onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-[11px] font-mono font-bold transition-all shadow-md active:scale-95 border border-rose-400/40 shrink-0"
              title="Создать новую карусель (Новый проект)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Новый проект</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
              title="Закрыть редактор"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          VISUAL ASSET & ATTACHMENT CONTROLS
         ======================================================== */}
      {!isBlockVisible('image') ? (
        <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400 font-mono">
            <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span>Блок визуала (изображение) скрыт на этом слайде</span>
          </div>
          <button
            type="button"
            onClick={() => handleRestoreBlock('image')}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 text-xs font-mono border border-neutral-700 transition-colors flex items-center gap-1.5 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить визуал</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider">
                Визуал слайда
              </span>
              {slide.imageUrl && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    slide.imageSource === 'nano-banana'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : slide.imageSource === 'preset'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {slide.imageSource === 'nano-banana'
                    ? '🍌 Nano Banana AI'
                    : slide.imageSource === 'preset'
                    ? '📸 Медиатека'
                    : '📎 Свой файл'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {!slide.imageUrl ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono border border-neutral-700 transition-colors shadow-sm"
                    title="Загрузить собственное изображение с устройства"
                  >
                    <Upload className="w-3 h-3 text-rose-400" />
                    <span>Прикрепить</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsGalleryOpen(!isGalleryOpen);
                      setIsGeneratorOpen(false);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-colors shadow-sm ${
                      isGalleryOpen
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                    title="Выбрать из готовой кураторской медиатеки кинематографичных фото"
                  >
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    <span>Медиатека</span>
                  </button>
                  <button
                    onClick={() => {
                      setGenPrompt(slide.visualPrompt || activeAnalysis.primaryPrompt || slide.title);
                      setIsGeneratorOpen(true);
                      setIsGalleryOpen(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors shadow-sm"
                    title="Сгенерировать изображение через арт-движок Nano Banana"
                  >
                    <Sparkles className="w-3 h-3 fill-neutral-950" />
                    <span>Nano Banana AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock('image')}
                    className="p-1 rounded bg-neutral-800 hover:bg-rose-950/60 border border-neutral-700 hover:border-rose-800/60 text-neutral-400 hover:text-rose-300 transition-colors"
                    title="Удалить блок визуала со слайда"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsGalleryOpen(!isGalleryOpen);
                    setIsGeneratorOpen(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-colors ${
                    isGalleryOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border-neutral-700'
                  }`}
                  title="Выбрать другое фото из медиатеки"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Медиатека</span>
                </button>
                <button
                  onClick={() => {
                    setGenPrompt(slide.visualPrompt || activeAnalysis.primaryPrompt || slide.title);
                    setIsGeneratorOpen(true);
                    setIsGalleryOpen(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-mono border border-neutral-700 transition-colors"
                  title="Сгенерировать другую картинку через Nano Banana"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Nano Banana</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono border border-neutral-700 transition-colors"
                  title="Заменить на свой файл"
                >
                  <Upload className="w-3 h-3" />
                  <span>Заменить</span>
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 transition-colors"
                  title="Удалить картинку со слайда"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* If image is attached, show mini preview & display controls */}
        {slide.imageUrl && (
          <div className="pt-2 border-t border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-16 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0 relative shadow-sm">
                <img
                  src={slide.imageUrl}
                  alt="Slide visual"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-2 text-xs">
                {/* Mode Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase w-16 shrink-0">Режим:</span>
                  <button
                    onClick={() => handleChange('imageDisplayMode', 'background')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                      slide.imageDisplayMode !== 'frame'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Фон слайда</span>
                  </button>
                  <button
                    onClick={() => handleChange('imageDisplayMode', 'frame')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                      slide.imageDisplayMode === 'frame'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Медиа-карточка</span>
                  </button>
                </div>

                {/* Opacity / Darkness Slider */}
                {slide.imageDisplayMode !== 'frame' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase w-16 shrink-0 flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      Затемнение:
                    </span>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      step="5"
                      value={slide.imageOverlayDarkness ?? 60}
                      onChange={(e) => handleChange('imageOverlayDarkness', Number(e.target.value))}
                      className="flex-1 accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-neutral-300 w-8 text-right">
                      {slide.imageOverlayDarkness ?? 60}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CapCut-style Media Card Customization Panel (Resize & Crop) */}
            {slide.imageDisplayMode === 'frame' && (
              <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-3 mt-2 shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-neutral-800 pb-2">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <Crop className="w-3.5 h-3.5 text-rose-400" />
                    <span>Кадрирование и размер медиа-карточки</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Настройка масштаба и фокуса
                  </span>
                </div>

                {/* 1. Size / Height Slider and Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-amber-400" />
                      <span>Высота карточки:</span>
                    </span>
                    <span className="text-[11px] font-mono text-white font-bold">
                      {slide.imageFrameSettings?.height ?? 135}px
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="80"
                      max="300"
                      step="10"
                      value={slide.imageFrameSettings?.height ?? 135}
                      onChange={(e) => handleUpdateImageFrame({ height: Number(e.target.value) })}
                      className="flex-1 accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    {[
                      { label: 'Компактная', h: 100 },
                      { label: 'Стандарт', h: 140 },
                      { label: 'Крупная', h: 200 },
                      { label: 'Максимум', h: 280 },
                    ].map((p) => {
                      const isCurr = (slide.imageFrameSettings?.height ?? 135) === p.h;
                      return (
                        <button
                          key={p.h}
                          type="button"
                          onClick={() => handleUpdateImageFrame({ height: p.h })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                            isCurr
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold'
                              : 'bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                          }`}
                        >
                          {p.label} ({p.h}px)
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Crop / Focal Alignment */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <Move className="w-3 h-3 text-cyan-400" />
                      <span>Кадрирование (фокусная точка):</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-300">
                      {(slide.imageFrameSettings?.focalPoint || 'center') === 'top'
                        ? 'Верх / Голова'
                        : (slide.imageFrameSettings?.focalPoint || 'center') === 'bottom'
                        ? 'Низ'
                        : 'Центр'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'top', label: '⬆️ Верх / Лицо' },
                      { id: 'center', label: '⏺️ Центр' },
                      { id: 'bottom', label: '⬇️ Низ' },
                    ].map((f) => {
                      const isAct = (slide.imageFrameSettings?.focalPoint || 'center') === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleUpdateImageFrame({ focalPoint: f.id as any })}
                          className={`py-1 px-2 rounded-lg text-xs font-mono border transition-colors text-center ${
                            isAct
                              ? 'bg-neutral-800 text-white border-cyan-500/80 font-bold shadow-sm ring-1 ring-cyan-500/30'
                              : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Zoom / Crop Scale */}
                <div className="space-y-1 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <ZoomIn className="w-3 h-3 text-emerald-400" />
                      <span>Масштаб кадра (Зум / Приближение):</span>
                    </span>
                    <span className="text-[11px] font-mono text-white font-bold">
                      {slide.imageFrameSettings?.zoom ?? 100}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="100"
                    max="175"
                    step="5"
                    value={slide.imageFrameSettings?.zoom ?? 100}
                    onChange={(e) => handleUpdateImageFrame({ zoom: Number(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 4. Aspect Ratio & Rounded Corners */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">Пропорции:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'auto', label: 'Авто' },
                        { id: '16:9', label: '16:9' },
                        { id: '4:3', label: '4:3' },
                        { id: '1:1', label: '1:1' },
                        { id: '4:5', label: '4:5' },
                      ].map((asp) => {
                        const isAct = (slide.imageFrameSettings?.aspectRatio || 'auto') === asp.id;
                        return (
                          <button
                            key={asp.id}
                            type="button"
                            onClick={() => handleUpdateImageFrame({ aspectRatio: asp.id as any })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              isAct
                                ? 'bg-neutral-800 text-white border-amber-400 font-bold'
                                : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                            }`}
                          >
                            {asp.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">Скругление:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'none', label: '0' },
                        { id: 'sm', label: 'Мягкое' },
                        { id: 'md', label: '16px' },
                        { id: 'lg', label: '24px' },
                      ].map((rd) => {
                        const isAct = (slide.imageFrameSettings?.borderRadius || 'md') === rd.id;
                        return (
                          <button
                            key={rd.id}
                            type="button"
                            onClick={() => handleUpdateImageFrame({ borderRadius: rd.id as any })}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              isAct
                                ? 'bg-neutral-800 text-white border-amber-400 font-bold'
                                : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                            }`}
                          >
                            {rd.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick URL toggle */}
        {!slide.imageUrl && !isGeneratorOpen && (
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500 font-mono">
              Поддерживаются JPG, PNG, WebP и прямые ссылки
            </span>
            <button
              onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
              className="text-neutral-400 hover:text-neutral-200 font-mono flex items-center gap-1 transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{isUrlInputOpen ? 'Скрыть URL' : 'Вставить ссылку'}</span>
            </button>
          </div>
        )}

        {/* URL Input field if opened */}
        {isUrlInputOpen && !slide.imageUrl && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 font-mono"
            />
            <button
              onClick={handleApplyUrl}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-mono border border-neutral-600 transition-colors"
            >
              Применить
            </button>
          </div>
        )}

        {/* ========================================================
            NANO BANANA GENERATION DRAWER (Inline)
           ======================================================== */}
        {isGeneratorOpen && (
          <div className="p-3 bg-neutral-900 rounded-lg border border-amber-500/40 space-y-3 mt-2 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🍌</span>
                <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wide">
                  Nano Banana Генератор Арта
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {activeAnalysis.moodTag}
                </span>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Semantic Choices right inside Generator */}
            <div className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span className="uppercase text-amber-400 font-bold flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  Подсказки по смыслу этого слайда:
                </span>
                <span className="text-neutral-500">выберите направление</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {activeAnalysis.suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    onClick={() => {
                      setGenPrompt(sug.prompt);
                      handleChange('visualPrompt', sug.prompt);
                    }}
                    className={`text-left p-1.5 rounded border transition-colors flex items-start gap-1.5 text-[10px] font-mono leading-tight ${
                      genPrompt === sug.prompt
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <span className="text-xs shrink-0">{sug.categoryIcon}</span>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{sug.categoryLabel}</div>
                      <div className="text-neutral-500 text-[9px] truncate">{sug.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <label className="block text-neutral-400 mb-1 font-mono text-[10px] uppercase flex items-center justify-between">
                <span>Промпт для генерации:</span>
                <span className="text-neutral-500 font-normal">
                  {genPrompt.length} символов
                </span>
              </label>
              <textarea
                rows={3}
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Опишите желаемый визуальный образ..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-xs text-neutral-100 leading-relaxed focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>

            {/* Style Pills */}
            <div>
              <label className="block text-neutral-400 mb-1.5 font-mono text-[10px] uppercase">
                Арт-дирекшн & Эстетика:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {NANO_BANANA_STYLES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setGenStyle(st.id)}
                    className={`p-1.5 rounded text-left transition-colors border text-[10px] font-mono leading-tight ${
                      genStyle === st.id
                        ? 'bg-amber-400/20 text-amber-200 border-amber-400 font-bold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                    title={st.desc}
                  >
                    <div>{st.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <div className="text-[10px] text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/60">
                {genError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800">
              <button
                onClick={() => setIsGeneratorOpen(false)}
                disabled={isGenerating}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 font-mono transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleGenerateNanoBanana()}
                disabled={isGenerating}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Генерирую в Nano Banana...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
                    <span>Сгенерировать сейчас</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            CURATED EDITORIAL PHOTO LIBRARY DRAWER
           ======================================================== */}
        {isGalleryOpen && (
          <div className="p-3 bg-neutral-900 rounded-lg border border-cyan-500/40 space-y-3 mt-2 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📸</span>
                <span className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wide">
                  Кураторская медиатека фото (12 авторских кадров)
                </span>
              </div>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
              {[
                { id: 'all', label: 'Все (12)' },
                { id: 'candid-35mm', label: '🎞️ 35mm Плёнка' },
                { id: 'brutalism', label: '🏛️ Брутализм' },
                { id: 'metaphor', label: '🎭 Метафоры' },
                { id: 'symbolic', label: '🕯️ Натюрморты' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setGalleryCategory(cat.id)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    galleryCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 font-bold'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {EDITORIAL_PHOTO_PRESETS.filter(
                (p) => galleryCategory === 'all' || p.category === galleryCategory
              ).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPresetPhoto(preset)}
                  className="group cursor-pointer rounded-lg overflow-hidden border border-neutral-800 hover:border-cyan-400/80 transition-all bg-neutral-950 flex flex-col hover:shadow-lg"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden relative bg-neutral-900">
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-85" />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <div className="text-[10px] font-bold text-white truncate font-sans">
                        {preset.title}
                      </div>
                      <div className="text-[9px] text-neutral-400 truncate font-mono">
                        {preset.categoryLabel}
                      </div>
                    </div>
                  </div>
                  <div className="p-1 text-center bg-neutral-900/90 border-t border-neutral-800 group-hover:bg-cyan-500/20 transition-colors">
                    <span className="text-[10px] font-mono text-neutral-300 group-hover:text-cyan-200 font-semibold">
                      Выбрать кадр →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ========================================================
          EDITORIAL VISUAL PROMPT & CONTEXTUAL SUGGESTIONS
         ======================================================== */}
      <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/90 space-y-3">
        {/* Section Header with Detected Essence */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Eye className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-200 font-mono uppercase tracking-wide">
                  Редакционный визуальный промпт
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  {activeAnalysis.moodTag}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDeepAiAnalyze}
            disabled={isAnalyzingAi}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-mono border border-neutral-700 transition-colors self-start sm:self-auto"
            title="Глубокий анализ драматургии слайда через нейросеть"
          >
            {isAnalyzingAi ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span>Считываю суть...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 text-amber-400" />
                <span>✨ ИИ-анализ сути</span>
              </>
            )}
          </button>
        </div>

        {/* Detected Essence Callout */}
        <div className="p-2 rounded bg-neutral-900/90 border border-neutral-800 flex items-start gap-2 text-xs">
          <div className="mt-0.5 text-amber-400 shrink-0">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">
              Суть и драматургический акцент слайда:
            </div>
            <p className="text-neutral-200 text-xs mt-0.5 leading-snug">
              {activeAnalysis.detectedEssence}
            </p>
          </div>
        </div>

        {/* Current Visual Prompt Editor Input */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-neutral-400 uppercase">
            <span>Текст промпта для арт-директора / генерации:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrompt}
                className="hover:text-neutral-200 flex items-center gap-1 transition-colors normal-case"
              >
                {copiedPrompt ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
              <span>{slide.visualPrompt?.length || 0} симв.</span>
            </div>
          </div>
          <textarea
            rows={2}
            value={slide.visualPrompt || ''}
            onChange={(e) => handleChange('visualPrompt', e.target.value)}
            placeholder="Опишите сцену, свет, оптику и фактуру..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-amber-400/80 resize-none"
          />
        </div>

        {/* 4 Semantic Directions Cards Tailored to the Slide */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase">
            <span className="flex items-center gap-1 font-bold text-neutral-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Варианты визуальных образов под смысл:
            </span>
            <span className="text-neutral-500">кликните для применения</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeAnalysis.suggestions.map((sug) => {
              const isCurrent = slide.visualPrompt === sug.prompt;
              const isApplied = appliedSuggestionId === sug.id;

              return (
                <div
                  key={sug.id}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between space-y-2 ${
                    isCurrent
                      ? 'bg-amber-400/10 border-amber-400/60 shadow-sm'
                      : 'bg-neutral-900/80 border-neutral-800/90 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">{sug.categoryIcon}</span>
                        <span className="text-xs font-bold text-neutral-200 truncate font-mono">
                          {sug.categoryLabel}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        {sug.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-amber-200/90 font-sans leading-tight mb-1">
                      {sug.title}
                    </div>

                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                      {sug.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70">
                    <span className="text-[9px] text-neutral-500 italic truncate pr-1">
                      {sug.rationale}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleApplySuggestion(sug)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
                          isApplied || isCurrent
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                        }`}
                        title="Подставить этот промпт в поле"
                      >
                        {isApplied || isCurrent ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Выбрано</span>
                          </>
                        ) : (
                          <span>Применить</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleApplyAndGenerate(sug)}
                        className="p-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 transition-colors"
                        title="Сгенерировать этот образ через Nano Banana"
                      >
                        <Sparkles className="w-2.5 h-2.5 fill-amber-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODULAR DELETABLE SLIDE CONTENT BLOCKS
         ======================================================== */}
      <div className="space-y-3 pt-1">
        {/* Block: Kicker (Рубрика) */}
        {isBlockVisible('kicker') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px] uppercase font-bold">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Кикер (Рубрика над заголовком)</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('kicker')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить кикер со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <input
              type="text"
              value={slide.kicker}
              onChange={(e) => handleChange('kicker', e.target.value)}
              placeholder="Например: ОСТАНОВКА СКРОЛЛА или ПАРАДОКС ВНИМАНИЯ..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400/70"
            />
          </div>
        )}

        {/* Block: Role in Story (Функция в истории / Пилл-бейдж) */}
        {isBlockVisible('roleName') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px] uppercase font-bold">
                <Award className="w-3.5 h-3.5 text-rose-400" />
                <span>Функция в истории (Пилл-бейдж роли)</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('roleName')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить бейдж роли со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <input
              type="text"
              value={slide.roleName}
              onChange={(e) => handleChange('roleName', e.target.value)}
              placeholder="Например: ГЛАВНЫЙ ТЕЗИС или ОСТАНОВКА СКРОЛЛА..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-400/70"
            />
          </div>
        )}

        {/* Block: Main Headline (Главный заголовок) */}
        {isBlockVisible('title') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Главный заголовок слайда</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('title')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить главный заголовок со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={slide.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Главный тезис, провокация или вопрос..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 font-semibold leading-snug focus:outline-none focus:border-amber-400/80 resize-none"
            />
          </div>
        )}

        {/* Block: Main Body Text (Основной текст) */}
        {isBlockVisible('body') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Основной текст слайда</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('body')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить основной текст со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={slide.body}
              onChange={(e) => handleChange('body', e.target.value)}
              placeholder="Основное повествование, чеклист или аргументы..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-300 leading-relaxed focus:outline-none focus:border-cyan-400/70 resize-none font-sans"
            />
          </div>
        )}

        {/* Block: Highlight / Citation (Акцентная мысль) */}
        {isBlockVisible('highlight') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Акцентная мысль (Выделенная цитата / плашка)</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('highlight')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить акцентную мысль со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <input
              type="text"
              value={slide.highlight || ''}
              onChange={(e) => handleChange('highlight', e.target.value)}
              placeholder="Выделенный тезис для запоминания и сохранения..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400/70"
            />
          </div>
        )}

        {/* Block: Data Metric / Number (Статистика / Большая цифра) */}
        {isBlockVisible('stats') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Метрика / Большая цифра</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('stats')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить блок метрики со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-500 mb-1 font-mono text-[9px] uppercase">
                  Число / Процент (Например: 74%)
                </label>
                <input
                  type="text"
                  value={slide.statNumber || ''}
                  onChange={(e) => handleChange('statNumber', e.target.value)}
                  placeholder="74%"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400/70"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1 font-mono text-[9px] uppercase">
                  Подпись к метрике
                </label>
                <input
                  type="text"
                  value={slide.statLabel || ''}
                  onChange={(e) => handleChange('statLabel', e.target.value)}
                  placeholder="Потеря внимания аудитории"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Block: Comparison (Сравнение До / После) */}
        {isBlockVisible('comparison') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Сравнение До / После (Контраст подходов)</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('comparison')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить блок сравнения со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-500 mb-1 font-mono text-[9px] uppercase">
                  Как было / Миф
                </label>
                <input
                  type="text"
                  value={slide.comparisonBefore || ''}
                  onChange={(e) => handleChange('comparisonBefore', e.target.value)}
                  placeholder="Списки «топ-5» давали охваты в 2022..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-400 focus:outline-none focus:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1 font-mono text-[9px] uppercase">
                  Как стало / Реальность
                </label>
                <input
                  type="text"
                  value={slide.comparisonAfter || ''}
                  onChange={(e) => handleChange('comparisonAfter', e.target.value)}
                  placeholder="В 2026 работают глубина и личные кейсы..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-medium focus:outline-none focus:border-cyan-400/70"
                />
              </div>
            </div>
          </div>
        )}

        {/* Block: Footnote / Source (Сноска / Первоисточник) */}
        {isBlockVisible('footnote') && (
          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[11px] uppercase font-bold">
                <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                <span>Сноска / Первоисточник</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBlock('footnote')}
                className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
                title="Удалить сноску со слайда"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Удалить блок</span>
              </button>
            </div>
            <input
              type="text"
              value={slide.footnote || ''}
              onChange={(e) => handleChange('footnote', e.target.value)}
              placeholder="Источник данных или авторская сноска..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-[11px] text-neutral-400 font-mono focus:outline-none focus:border-neutral-700"
            />
          </div>
        )}

        {/* Block: Swipe Prompt (Подсказка свайпа) */}
        {isBlockVisible('swipePrompt') && (
          <div className="p-2.5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-mono text-neutral-300">
                Нижний индикатор листания ({slide.slideNumber === totalSlides ? 'ФИНАЛ 🔖' : 'SWIPE →'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteBlock('swipePrompt')}
              className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1 text-[10px] font-mono"
              title="Удалить индикатор свайпа со слайда"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              <span>Удалить блок</span>
            </button>
          </div>
        )}

        {/* ========================================================
            ADD / RESTORE BLOCKS DOCK
           ======================================================== */}
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-bold text-neutral-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Добавить блок на слайд</span>
            </span>
            {slide.hiddenBlocks && slide.hiddenBlocks.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreAll}
                className="text-[10px] text-neutral-400 hover:text-white underline flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Вернуть все скрытые ({slide.hiddenBlocks.length})</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALL_MANAGEABLE_BLOCKS.filter((b) => !isBlockVisible(b.id)).map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => handleRestoreBlock(block.id)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm group"
                title={`Добавить ${block.label} на этот слайд`}
              >
                <span className="text-sm">{block.icon}</span>
                <span className="font-medium group-hover:text-emerald-300 transition-colors">
                  + {block.label}
                </span>
              </button>
            ))}
            {ALL_MANAGEABLE_BLOCKS.every((b) => isBlockVisible(b.id)) && (
              <span className="text-[11px] text-neutral-500 font-mono py-0.5 italic">
                ✓ Все доступные блоки активны на этом слайде. Любой блок можно удалить нажатием на «Удалить блок».
              </span>
            )}
          </div>
        </div>

        {/* ========================================================
            CAPCUT LAYERS: BLOCK ORDER & REPOSITIONING
           ======================================================== */}
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono border-b border-neutral-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>Порядок и слои блоков на слайде</span>
            </span>
            <span className="text-[10px] text-neutral-400">
              Двигайте блоки выше/ниже стрелками
            </span>
          </div>

          {/* Quick Order Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-mono text-neutral-500 shrink-0">Пресеты:</span>
            <button
              type="button"
              onClick={() =>
                handleApplyOrderPreset([
                  'kicker',
                  'roleName',
                  'title',
                  'image',
                  'highlight',
                  'body',
                  'stats',
                  'footnote',
                  'swipePrompt',
                ])
              }
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 whitespace-nowrap"
            >
              Заголовок → Визуал → Текст
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyOrderPreset([
                  'kicker',
                  'image',
                  'roleName',
                  'title',
                  'highlight',
                  'body',
                  'stats',
                  'footnote',
                  'swipePrompt',
                ])
              }
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 whitespace-nowrap"
            >
              Визуал во главе
            </button>
            <button
              type="button"
              onClick={() =>
                handleApplyOrderPreset([
                  'kicker',
                  'highlight',
                  'title',
                  'body',
                  'image',
                  'stats',
                  'footnote',
                  'swipePrompt',
                ])
              }
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 whitespace-nowrap"
            >
              Тезис первым
            </button>
          </div>

          {/* Ordered Block List */}
          <div className="space-y-1.5 pt-1">
            {(() => {
              const defaultOrder = [
                'kicker',
                'roleName',
                'title',
                'image',
                'highlight',
                'body',
                'stats',
                'comparison',
                'footnote',
                'swipePrompt',
              ];
              const currentOrder =
                slide.blockOrder && slide.blockOrder.length > 0 ? slide.blockOrder : defaultOrder;

              const visibleOrdered = currentOrder
                .filter((k) => isBlockVisible(k))
                .map((k) => ALL_MANAGEABLE_BLOCKS.find((b) => b.id === k))
                .filter(Boolean) as typeof ALL_MANAGEABLE_BLOCKS;

              return visibleOrdered.map((block, idx) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="text-base">{block.icon}</span>
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{block.label}</span>
                      <span className="text-[10px] text-neutral-500 font-mono block truncate">{block.desc}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBlock(block.id, 'up')}
                      className={`p-1.5 rounded transition-colors ${
                        idx === 0
                          ? 'text-neutral-700 cursor-not-allowed'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800 bg-neutral-950 border border-neutral-800'
                      }`}
                      title="Переместить выше"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === visibleOrdered.length - 1}
                      onClick={() => handleMoveBlock(block.id, 'down')}
                      className={`p-1.5 rounded transition-colors ${
                        idx === visibleOrdered.length - 1
                          ? 'text-neutral-700 cursor-not-allowed'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800 bg-neutral-950 border border-neutral-800'
                      }`}
                      title="Переместить ниже"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors ml-1"
                      title="Удалить блок"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Bottom Save & Close Action */}
      {onClose && (
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Готово (Сохранить изменения)</span>
          </button>
        </div>
      )}
    </div>
  );
};
