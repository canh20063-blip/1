import React, { useState, useEffect, useRef } from 'react';
import {
  CarouselProject,
  SlideItem,
  VisualStyleId,
  AutoMixPaletteId,
  ImageFrameSettings,
} from '../types/carousel';
import { SlideCard, resolveSlideStyle, resolveSmartWidgetArchetype } from './SlideCard';
import { InstagramSimulator } from './InstagramSimulator';
import { StyleSelector } from './StyleSelector';
import { CaptionView } from './CaptionView';
import { VISUAL_STYLES } from '../data/visualStyles';
import { AUTO_MIX_PALETTES } from '../data/autoMixThemes';
import {
  Palette,
  Type,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  X,
  Play,
  Pause,
  Eye,
  Smartphone,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sliders,
  Crop,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Boxes,
  Radio,
  Share2,
  Film,
  Video,
  Upload,
  Link,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { VIDEO_PRESETS, VideoPreset } from '../data/videoPresets';
import {
  analyzeSlideAndSuggestPrompts,
  SlideVisualAnalysis,
  VisualPromptSuggestion,
} from '../utils/visualPromptEngine';
import {
  EDITORIAL_PHOTO_PRESETS,
  EditorialPhotoPreset,
} from '../data/editorialPresets';

export type CanvaDockTab =
  | 'templates'
  | 'text'
  | 'media'
  | 'elements'
  | 'caption'
  | 'audit';

interface CanvaStudioWorkspaceProps {
  project: CarouselProject;
  activeSlideIndex: number;
  onSelectSlide: (idx: number) => void;
  onUpdateSlide: (updatedSlide: SlideItem) => void;
  onSelectStyle: (styleId: VisualStyleId) => void;
  onSelectAutoMixPalette: (paletteId: AutoMixPaletteId) => void;
  onUpdateCaption: (caption: string) => void;
  onUpdateCta: (cta: string) => void;
  onSelectHook: (hookIdx: number) => void;
  onTriggerAudit: () => void;
  isAuditing: boolean;
  onNewProject: () => void;
  onOpenAnalysisModal: () => void;
  onDuplicateSlide: (idx: number) => void;
  onDeleteSlide: (idx: number) => void;
  onAddSlide: () => void;
  onMoveSlideOrder: (idx: number, direction: 'left' | 'right') => void;
  onGenerate?: (topic: string) => Promise<void> | void;
  isGenerating?: boolean;
}

export const CanvaStudioWorkspace: React.FC<CanvaStudioWorkspaceProps> = ({
  project,
  activeSlideIndex,
  onSelectSlide,
  onUpdateSlide,
  onSelectStyle,
  onSelectAutoMixPalette,
  onUpdateCaption,
  onUpdateCta,
  onSelectHook,
  onTriggerAudit,
  isAuditing,
  onNewProject,
  onOpenAnalysisModal,
  onDuplicateSlide,
  onDeleteSlide,
  onAddSlide,
  onMoveSlideOrder,
  onGenerate,
  isGenerating: isGeneratingProject,
}) => {
  // Canva Left Dock state
  const [activeTab, setActiveTab] = useState<CanvaDockTab | null>('templates');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [quickGenTopic, setQuickGenTopic] = useState('');
  const [aiStatus, setAiStatus] = useState<'ok' | 'billing_required' | 'invalid_key' | 'missing' | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiStatus(d.geminiLiveStatus || (d.hasGeminiKey ? 'ok' : 'missing')))
      .catch(() => setAiStatus('missing'));
  }, []);

  // Canvas Stage state
  const [viewMode, setViewMode] = useState<'canvas' | 'panorama' | 'instagram'>('canvas');
  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [isFilmstripOpen, setIsFilmstripOpen] = useState(true);

  // Nano Banana AI generator state in Media tab
  const [genPrompt, setGenPrompt] = useState('');
  const [genStyle, setGenStyle] = useState('editorial-minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video attachment state in Media tab
  const [mediaSubTab, setMediaSubTab] = useState<'photo' | 'video'>('photo');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = project.slides[activeSlideIndex] || project.slides[0];
  const totalSlides = project.slides.length;
  const activeStyleId = project.visualStyleId;
  const activeAutoMixPaletteId = project.autoMixPaletteId || 'obsidian-gold';

  // Sync prompt and sub-tab when active slide changes
  useEffect(() => {
    if (currentSlide) {
      setGenPrompt(currentSlide.visualPrompt || currentSlide.title || '');
      if (currentSlide.videoUrl) {
        setMediaSubTab('video');
      }
    }
  }, [currentSlide?.slideNumber, currentSlide?.visualPrompt, currentSlide?.title, currentSlide?.videoUrl]);

  // Slideshow auto-play effect
  useEffect(() => {
    if (!isPlayingSlideshow) return;
    const interval = setInterval(() => {
      onSelectSlide((activeSlideIndex + 1) % totalSlides);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlayingSlideshow, activeSlideIndex, totalSlides, onSelectSlide]);

  const handleTabClick = (tab: CanvaDockTab) => {
    if (activeTab === tab && isDrawerOpen) {
      setIsDrawerOpen(false);
    } else {
      setActiveTab(tab);
      setIsDrawerOpen(true);
    }
  };

  // Block management helpers
  const isBlockVisible = (key: string): boolean => {
    return !(currentSlide.hiddenBlocks && currentSlide.hiddenBlocks.includes(key));
  };

  const handleToggleBlock = (key: string) => {
    const currentHidden = currentSlide.hiddenBlocks || [];
    const isHidden = currentHidden.includes(key);
    onUpdateSlide({
      ...currentSlide,
      hiddenBlocks: isHidden
        ? currentHidden.filter((k) => k !== key)
        : [...currentHidden, key],
    });
  };

  const handleDeleteBlock = (blockKey: string) => {
    const currentHidden = currentSlide.hiddenBlocks || [];
    if (!currentHidden.includes(blockKey)) {
      onUpdateSlide({
        ...currentSlide,
        hiddenBlocks: [...currentHidden, blockKey],
      });
    }
  };

  const handleRestoreBlock = (blockKey: string) => {
    const currentHidden = currentSlide.hiddenBlocks || [];
    const patch: Partial<SlideItem> = {
      hiddenBlocks: currentHidden.filter((k) => k !== blockKey),
    };
    if (blockKey === 'kicker' && !currentSlide.kicker) patch.kicker = 'РУБРИКА';
    if (blockKey === 'roleName' && !currentSlide.roleName) patch.roleName = 'ИНСАЙТ';
    if (blockKey === 'title' && !currentSlide.title) patch.title = 'Новый заголовок слайда';
    if (blockKey === 'body' && !currentSlide.body) patch.body = 'Основное раскрытие идеи или практический совет...';
    if (blockKey === 'highlight' && !currentSlide.highlight) patch.highlight = 'Выделенный тезис для запоминания';
    if (blockKey === 'stats') {
      if (!currentSlide.statNumber) patch.statNumber = '74%';
      if (!currentSlide.statLabel) patch.statLabel = 'Доказательная база';
    }
    onUpdateSlide({
      ...currentSlide,
      ...patch,
    });
  };

  const handleEnhanceSlideText = (action: 'sharpen' | 'shorten' | 'punchline' | 'stat') => {
    if (!currentSlide) return;
    const updated = { ...currentSlide };

    if (action === 'sharpen') {
      const title = updated.title || '';
      let sharpened = title
        .replace(/^(Как|Почему|Зачем|Что если)\s+/i, '')
        .replace(/\?$/, '!')
        .trim();
      if (sharpened && !sharpened.startsWith('ТОП-') && !sharpened.startsWith('ГЛАВНОЕ:')) {
        sharpened = `ГЛАВНЫЙ СЕКРЕТ: ${sharpened}`;
      } else if (!sharpened) {
        sharpened = 'ФАТАЛЬНАЯ ОШИБКА, КОТОРУЮ СОВЕРШАЮТ 90%';
      }
      updated.title = sharpened;
    } else if (action === 'shorten') {
      const body = updated.body || '';
      const sentences = body.split(/(?<=[.!?])\s+/);
      if (sentences.length > 2) {
        updated.body = sentences.slice(0, 2).join(' ');
      } else if (!body) {
        updated.body = 'Главная мысль: результат дает не объем действий, а фокус на главном рычаге.';
      }
    } else if (action === 'punchline') {
      if (!updated.highlight) {
        updated.highlight = '⚡️ Без этого правила все остальные усилия дают 0% отдачи.';
      } else {
        updated.highlight = `🎯 Суть: ${updated.highlight.replace(/^(Суть|Главное|Важно)[:\s]*/i, '')}`;
      }
    } else if (action === 'stat') {
      if (!updated.statNumber) {
        updated.statNumber = '+280%';
        updated.statLabel = 'рост конверсии и вовлеченности';
      } else {
        updated.statNumber = updated.statNumber === '+280%' ? '84%' : '+3.5x';
        updated.statLabel = 'проверено на практике';
      }
    }

    onUpdateSlide(updated);
  };

  const handleMoveBlock = (blockKey: string, direction: 'up' | 'down') => {
    const defaultOrder = [
      'kicker',
      'roleName',
      'title',
      'image',
      'highlight',
      'body',
      'stats',
      'comparison',
      'swipePrompt',
    ];
    const currentOrder =
      currentSlide.blockOrder && currentSlide.blockOrder.length > 0
        ? [...currentSlide.blockOrder]
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
      ...currentSlide,
      blockOrder: currentOrder,
    });
  };

  const handleReorderBlock = (sourceKey: string, targetKey: string, position: 'before' | 'after') => {
    const defaultOrder = [
      'kicker',
      'roleName',
      'title',
      'image',
      'highlight',
      'body',
      'stats',
      'comparison',
      'swipePrompt',
    ];
    const currentOrder =
      currentSlide.blockOrder && currentSlide.blockOrder.length > 0
        ? [...currentSlide.blockOrder]
        : [...defaultOrder];

    defaultOrder.forEach((k) => {
      if (!currentOrder.includes(k)) currentOrder.push(k);
    });

    const fromIdx = currentOrder.indexOf(sourceKey);
    if (fromIdx === -1) return;

    currentOrder.splice(fromIdx, 1);

    let toIdx = currentOrder.indexOf(targetKey);
    if (toIdx === -1) {
      currentOrder.push(sourceKey);
    } else {
      if (position === 'after') {
        toIdx += 1;
      }
      currentOrder.splice(toIdx, 0, sourceKey);
    }

    onUpdateSlide({
      ...currentSlide,
      blockOrder: currentOrder,
    });
  };

  const handleApplyOrderPreset = (order: string[]) => {
    onUpdateSlide({
      ...currentSlide,
      blockOrder: order,
    });
  };

  // Image Frame Customization
  const handleUpdateImageFrame = (settings: Partial<ImageFrameSettings>) => {
    onUpdateSlide({
      ...currentSlide,
      imageFrameSettings: {
        ...(currentSlide.imageFrameSettings || {}),
        ...settings,
      },
    });
  };

  // Nano Banana AI Generator
  const handleGenerateNanoBanana = async (promptOverride?: string) => {
    const promptToSend = (promptOverride || genPrompt || currentSlide.visualPrompt || currentSlide.title).trim();
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
            title: currentSlide.title,
            kicker: currentSlide.kicker,
            role: currentSlide.roleName,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        onUpdateSlide({
          ...currentSlide,
          imageUrl: data.imageUrl,
          imagePrompt: promptToSend,
          imageSource: 'nano-banana',
          imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
          imageOverlayDarkness: currentSlide.imageOverlayDarkness ?? 60,
        });
      } else {
        setGenError(data.error || 'Не удалось сгенерировать изображение');
      }
    } catch (err: any) {
      setGenError(err.message || 'Ошибка связи с сервером генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload image handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateSlide({
          ...currentSlide,
          imageUrl: dataUrl,
          imageSource: 'upload',
          mediaType: 'image',
          imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
          imageOverlayDarkness: currentSlide.imageOverlayDarkness ?? 60,
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Video File Upload Handler
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setVideoUploadError('Пожалуйста, выберите видеофайл (MP4, WebM, MOV).');
      return;
    }

    setVideoUploadError(null);
    try {
      const videoBlobUrl = URL.createObjectURL(file);
      onUpdateSlide({
        ...currentSlide,
        videoUrl: videoBlobUrl,
        mediaType: 'video',
        videoSource: 'upload',
        videoLoop: currentSlide.videoLoop ?? true,
        videoMuted: currentSlide.videoMuted ?? true,
        imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
      });
    } catch (err: any) {
      setVideoUploadError('Не удалось прочитать видеофайл');
    }
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };

  // Video URL Handler
  const handleApplyVideoUrl = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) return;
    setVideoUploadError(null);
    onUpdateSlide({
      ...currentSlide,
      videoUrl: trimmed,
      mediaType: 'video',
      videoSource: 'url',
      videoLoop: currentSlide.videoLoop ?? true,
      videoMuted: currentSlide.videoMuted ?? true,
      imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
    });
    setVideoUrlInput('');
  };

  // Select Preset Video
  const handleSelectPresetVideo = (preset: VideoPreset) => {
    setVideoUploadError(null);
    onUpdateSlide({
      ...currentSlide,
      videoUrl: preset.url,
      mediaType: 'video',
      videoSource: 'preset',
      videoLoop: currentSlide.videoLoop ?? true,
      videoMuted: currentSlide.videoMuted ?? true,
      imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
    });
  };

  // Remove Video Handler
  const handleRemoveVideo = () => {
    onUpdateSlide({
      ...currentSlide,
      videoUrl: undefined,
      mediaType: currentSlide.imageUrl ? 'image' : undefined,
    });
  };

  // Remove Photo Handler
  const handleRemoveImage = () => {
    onUpdateSlide({
      ...currentSlide,
      imageUrl: undefined,
      mediaType: currentSlide.videoUrl ? 'video' : undefined,
    });
  };

  // Select photo from preset gallery
  const handleSelectPresetPhoto = (preset: EditorialPhotoPreset) => {
    onUpdateSlide({
      ...currentSlide,
      imageUrl: preset.url,
      imagePrompt: preset.description,
      imageSource: 'preset',
      mediaType: 'image',
      imageDisplayMode: currentSlide.imageDisplayMode || 'frame',
      imageOverlayDarkness: currentSlide.imageOverlayDarkness ?? 60,
    });
  };

  // Semantic visual suggestions for active slide
  const visualAnalysis = analyzeSlideAndSuggestPrompts(
    currentSlide,
    project.topic,
    project.angleName
  );

  return (
    <div className="flex-1 flex overflow-hidden select-none bg-neutral-950 text-neutral-100 min-h-0 w-full relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleVideoFileUpload}
        className="hidden"
      />

      {/* ========================================================
          1. CANVA LEFT DOCK (Vertical Icon Strip - Ultra Compact)
         ======================================================== */}
      <aside className="w-14 sm:w-16 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-2 z-30 select-none">
        <div className="space-y-1 w-full px-1">
          {/* Tab 1: Templates & Styles */}
          <button
            type="button"
            onClick={() => handleTabClick('templates')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono ${
              activeTab === 'templates' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Шаблоны & Стили (Canva Templates)"
            aria-label="Стили"
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="truncate">Стили</span>
          </button>

          {/* Tab 2: Text & Hooks */}
          <button
            type="button"
            onClick={() => handleTabClick('text')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono relative ${
              activeTab === 'text' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Текст & Хуки (Canva Text)"
            aria-label="Текст"
          >
            <Type className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-rose-400" />
            <span className="truncate">Текст</span>
            <span className="absolute top-1 right-1 text-[7px] font-mono px-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
              5
            </span>
          </button>

          {/* Tab 3: Media & Photos */}
          <button
            type="button"
            onClick={() => handleTabClick('media')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono ${
              activeTab === 'media' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Медиа: фото, видео, кадрирование"
            aria-label="Медиа"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-400" />
            <span className="truncate">Медиа</span>
          </button>

          {/* Tab 4: Elements & Widgets */}
          <button
            type="button"
            onClick={() => handleTabClick('elements')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono ${
              activeTab === 'elements' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Интерактивные виджеты (аудио, direct-диалог, чеклист, цифры)"
            aria-label="Виджеты"
          >
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-cyan-400" />
            <span className="truncate">Виджет</span>
          </button>

          {/* Tab 5: Instagram Caption */}
          <button
            type="button"
            onClick={() => handleTabClick('caption')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono ${
              activeTab === 'caption' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Подпись Instagram & Первый комментарий"
            aria-label="Подпись"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-emerald-400" />
            <span className="truncate">Пост</span>
          </button>

          {/* Tab 7: Viral Audit */}
          <button
            type="button"
            onClick={() => handleTabClick('audit')}
            className={`w-full flex flex-col items-center justify-center py-2 rounded-xl transition-all text-[9px] font-mono ${
              activeTab === 'audit' && isDrawerOpen
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
            }`}
            title="Quality Gate аудит 100 баллов"
            aria-label="Аудит"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-emerald-400" />
            <span className="truncate">Аудит</span>
          </button>
        </div>

        {/* Bottom Dock Action: New Project */}
        <div className="mt-auto pt-2 border-t border-neutral-800 w-full px-1">
          <button
            type="button"
            onClick={onNewProject}
            className="w-full flex flex-col items-center justify-center py-1.5 rounded-xl text-[8px] font-mono font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors"
            title="Создать новую карусель"
            aria-label="Новый проект"
          >
            <Plus className="w-3.5 h-3.5 mb-0.5" />
            <span>Новый</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. CANVA FLYOUT DRAWER (Sidebar next to dock)
         ======================================================== */}
      {isDrawerOpen && activeTab && (
        <div className="w-[340px] sm:w-[380px] max-w-[calc(100vw-72px)] shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 overflow-hidden shadow-2xl animate-fade-in">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                {activeTab === 'templates' && (
                  <>
                    <Palette className="w-4 h-4 text-rose-400" />
                    <span>Стили & Палитры</span>
                  </>
                )}
                {activeTab === 'text' && (
                  <>
                    <Type className="w-4 h-4 text-rose-400" />
                    <span>Текст & Смысл (# {currentSlide.slideNumber})</span>
                  </>
                )}
                {activeTab === 'media' && (
                  <>
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Медиа & ИИ Картинка</span>
                  </>
                )}
                {activeTab === 'elements' && (
                  <>
                    <Boxes className="w-4 h-4 text-cyan-400" />
                    <span>Виджеты & Элементы</span>
                  </>
                )}
                {activeTab === 'caption' && (
                  <>
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Подпись Instagram & CTA</span>
                  </>
                )}
                {activeTab === 'audit' && (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Quality Gate 100</span>
                  </>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Свернуть боковую панель"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: TEMPLATES & STYLES */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <StyleSelector
                  activeStyleId={activeStyleId}
                  onSelectStyle={onSelectStyle}
                  activeAutoMixPaletteId={activeAutoMixPaletteId}
                  onSelectAutoMixPalette={onSelectAutoMixPalette}
                  slides={project.slides}
                  activeSlideIndex={activeSlideIndex}
                  onSelectSlide={onSelectSlide}
                  onUpdateSlide={onUpdateSlide}
                />
              </div>
            )}

            {/* TAB 2: TEXT & HOOKS */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                {/* 1. Full Carousel AI Generator */}
                <div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl border border-rose-500/30 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Сгенерировать всю карусель</span>
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">
                      9 слайдов
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Создаст полный вирусный сценарий: обложка, боли, разборы, статистика и CTA.
                  </p>

                  {/* AI Status Badge */}
                  {aiStatus === 'ok' ? (
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Gemini 3.8 Flash активен · Живой контент</span>
                    </div>
                  ) : aiStatus === 'billing_required' ? (
                    <div className="text-[9px] text-amber-300 font-mono bg-amber-950/40 border border-amber-500/30 p-2 rounded leading-tight space-y-0.5">
                      <div className="font-bold text-amber-200">⚠️ Ошибка 403 от Google</div>
                      <div className="text-neutral-400">Для этого ключа нужен биллинг или новый проект в AI Studio.</div>
                    </div>
                  ) : aiStatus === 'missing' ? (
                    <div className="text-[9px] text-amber-400/90 font-mono bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded leading-tight">
                      ⚠️ Офлайн-шаблоны · Укажите GEMINI_API_KEY в Secrets
                    </div>
                  ) : null}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={quickGenTopic}
                      onChange={(e) => setQuickGenTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && quickGenTopic.trim() && onGenerate) {
                          onGenerate(quickGenTopic.trim());
                        }
                      }}
                      placeholder="Тема: 5 ошибок в продажах..."
                      className="flex-1 bg-black/60 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingProject || !quickGenTopic.trim()}
                      onClick={() => {
                        if (quickGenTopic.trim() && onGenerate) {
                          onGenerate(quickGenTopic.trim());
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {isGeneratingProject ? (
                        <span className="animate-spin text-xs">⏳</span>
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>Создать</span>
                    </button>
                  </div>
                </div>

                {/* 2. Slide-level AI Text Enhancers */}
                <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      Улучшить текст слайда #{activeSlideIndex + 1}:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEnhanceSlideText('sharpen')}
                      className="px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-200 text-left transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔥 Острее хук</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnhanceSlideText('shorten')}
                      className="px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-200 text-left transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>✂️ Сжать до сути</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnhanceSlideText('punchline')}
                      className="px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-200 text-left transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>💡 Добавить вывод</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnhanceSlideText('stat')}
                      className="px-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-200 text-left transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>📊 Добавить цифру</span>
                    </button>
                  </div>
                </div>

                {/* 3. 5 Viral Hook Presets for Cover */}
                {activeSlideIndex === 0 && (
                  <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                        <span>Хуки обложки (Слайд #1)</span>
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500">Только обложка</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-snug">
                      Клик по варианту ниже обновит заголовок и подзаголовок первой обложки:
                    </p>

                    <div className="space-y-2">
                      {project.hooks.map((hook, hIdx) => (
                        <div
                          key={hook.id}
                          onClick={() => onSelectHook(hIdx)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            project.activeHookIndex === hIdx
                              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-rose-300 font-bold">
                              {hook.type}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">
                              ★ {hook.score}/25
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white leading-snug line-clamp-2">
                            {hook.headline}
                          </div>
                          <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                            {hook.subline}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Element Inserters */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">
                    Добавить или восстановить текст:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {!isBlockVisible('kicker') && (
                      <button
                        type="button"
                        onClick={() => handleRestoreBlock('kicker')}
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-rose-400" />
                        <span>+ Кикер</span>
                      </button>
                    )}
                    {!isBlockVisible('highlight') && (
                      <button
                        type="button"
                        onClick={() => handleRestoreBlock('highlight')}
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Акцент</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Text Fields for Active Slide */}
                <div className="space-y-3 pt-1">
                  {/* Title Input */}
                  {isBlockVisible('title') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono text-neutral-400 uppercase">
                          Заголовок слайда:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock('title')}
                          className="text-neutral-500 hover:text-rose-400 text-[10px] font-mono"
                        >
                          ✕ Скрыть
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={currentSlide.title || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, title: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans leading-snug"
                        placeholder="Заголовок..."
                      />
                    </div>
                  )}

                  {/* Body Text Input */}
                  {isBlockVisible('body') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono text-neutral-400 uppercase">
                          Основной текст:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock('body')}
                          className="text-neutral-500 hover:text-rose-400 text-[10px] font-mono"
                        >
                          ✕ Скрыть
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={currentSlide.body || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, body: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans leading-relaxed"
                        placeholder="Раскройте мысль слайда..."
                      />
                    </div>
                  )}

                  {/* Highlight Input */}
                  {isBlockVisible('highlight') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono text-neutral-400 uppercase">
                          Акцентный тезис:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock('highlight')}
                          className="text-neutral-500 hover:text-rose-400 text-[10px] font-mono"
                        >
                          ✕ Скрыть
                        </button>
                      </div>
                      <input
                        type="text"
                        value={currentSlide.highlight || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, highlight: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-amber-200 focus:outline-none focus:border-neutral-600 font-sans"
                        placeholder="Ключевая мысль..."
                      />
                    </div>
                  )}

                  {/* Kicker Input */}
                  {isBlockVisible('kicker') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono text-neutral-400 uppercase">
                          Кикер / Рубрика:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock('kicker')}
                          className="text-neutral-500 hover:text-rose-400 text-[10px] font-mono"
                        >
                          ✕ Скрыть
                        </button>
                      </div>
                      <input
                        type="text"
                        value={currentSlide.kicker || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, kicker: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                        placeholder="РУБРИКА"
                      />
                    </div>
                  )}

                  {/* Direct Dialog Header / Sender Title Input */}
                  {(currentSlide.slideNumber === 4 ||
                    resolveSmartWidgetArchetype(currentSlide, totalSlides) === 'direct-dialog' ||
                    currentSlide.adaptiveStyleId === 'telegram-chat' ||
                    currentSlide.chatSenderTitle !== undefined) && (
                    <div className="space-y-1 p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-mono text-amber-300 uppercase flex items-center gap-1.5 font-bold">
                          <span>💬</span>
                          <span>Плашка диалога:</span>
                        </label>
                        <span className="text-[10px] font-mono text-neutral-500">В виджете</span>
                      </div>
                      <input
                        type="text"
                        value={currentSlide.chatSenderTitle ?? 'Прямой диалог'}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, chatSenderTitle: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                        placeholder="Прямой диалог"
                      />
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB 3: MEDIA (PHOTO & VIDEO) */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                {/* Media Type Sub-Segmented Selector */}
                <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setMediaSubTab('photo')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mediaSubTab === 'photo'
                        ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Фото / ИИ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSubTab('video')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mediaSubTab === 'video'
                        ? 'bg-amber-400 text-neutral-950 shadow-sm font-extrabold ring-1 ring-amber-300'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Видео</span>
                    {currentSlide.videoUrl && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Active Media Settings Card (shows when active type is attached) */}
                {((mediaSubTab === 'video' && currentSlide.videoUrl) ||
                  (mediaSubTab === 'photo' && currentSlide.imageUrl)) && (
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5 shadow-sm">
                    {/* Header: Status + Remove */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{mediaSubTab === 'video' ? 'Видео на слайде' : 'Фото на слайде'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={mediaSubTab === 'video' ? handleRemoveVideo : handleRemoveImage}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Удалить</span>
                      </button>
                    </div>

                    {/* Mode Toggle: Frame vs Background */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSlide({
                            ...currentSlide,
                            imageDisplayMode: 'frame',
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border flex items-center justify-center gap-1.5 ${
                          currentSlide.imageDisplayMode === 'frame'
                            ? 'bg-rose-950 text-rose-200 border-rose-600 font-bold'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        <Crop className="w-3 h-3" />
                        <span>В кадре</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSlide({
                            ...currentSlide,
                            imageDisplayMode: 'background',
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border flex items-center justify-center gap-1.5 ${
                          currentSlide.imageDisplayMode === 'background' || !currentSlide.imageDisplayMode
                            ? 'bg-rose-950 text-rose-200 border-rose-600 font-bold'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Фон слайда</span>
                      </button>
                    </div>

                    {/* Controls for Framed Mode */}
                    {currentSlide.imageDisplayMode === 'frame' && (
                      <div className="space-y-2 pt-1 border-t border-neutral-850">
                        {/* Height slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                            <span>Высота карточки:</span>
                            <span className="text-amber-300 font-bold">{currentSlide.imageFrameSettings?.height || 135} px</span>
                          </div>
                          <input
                            type="range"
                            min={80}
                            max={260}
                            step={5}
                            value={currentSlide.imageFrameSettings?.height || 135}
                            onChange={(e) =>
                              handleUpdateImageFrame({ height: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded"
                          />
                        </div>

                        {/* Quick Focal Crop buttons */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-neutral-400 block">Фокус кадрирования:</span>
                          <div className="grid grid-cols-3 gap-1">
                            {(['top', 'center', 'bottom'] as const).map((pos) => {
                              const isActive = (currentSlide.imageFrameSettings?.focalPoint || 'center') === pos;
                              return (
                                <button
                                  key={pos}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateImageFrame({
                                      focalPoint: pos,
                                      focalY: pos === 'top' ? 10 : pos === 'bottom' ? 90 : 50,
                                    })
                                  }
                                  className={`py-1 rounded text-[10px] font-mono transition-all border ${
                                    isActive
                                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300'
                                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                                  }`}
                                >
                                  {pos === 'top' ? 'Сверху' : pos === 'bottom' ? 'Снизу' : 'По центру'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Controls for Background Mode */}
                    {(currentSlide.imageDisplayMode === 'background' || !currentSlide.imageDisplayMode) && (
                      <div className="space-y-1 pt-1 border-t border-neutral-850">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Затемнение фона (Контраст):</span>
                          <span className="text-amber-300 font-bold">{currentSlide.imageOverlayDarkness ?? 60}%</span>
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={90}
                          step={5}
                          value={currentSlide.imageOverlayDarkness ?? 60}
                          onChange={(e) =>
                            onUpdateSlide({
                              ...currentSlide,
                              imageOverlayDarkness: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded"
                        />
                      </div>
                    )}

                    {/* Video-specific loop/mute toggles */}
                    {mediaSubTab === 'video' && (
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-[11px] font-mono text-neutral-300">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentSlide.videoLoop !== false}
                            onChange={(e) =>
                              onUpdateSlide({
                                ...currentSlide,
                                videoLoop: e.target.checked,
                              })
                            }
                            className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span>Зацикливать</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentSlide.videoMuted !== false}
                            onChange={(e) =>
                              onUpdateSlide({
                                ...currentSlide,
                                videoMuted: e.target.checked,
                              })
                            }
                            className="accent-amber-400 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span>Без звука</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================
                    SUBTAB 1: VIDEO OPTIONS
                   ======================================================== */}
                {mediaSubTab === 'video' && (
                  <div className="space-y-3">
                    {/* Upload Video & URL in one compact card */}
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Свой видеофайл</span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">MP4, WebM</span>
                      </div>

                      {videoUploadError && (
                        <div className="p-1.5 rounded bg-rose-950/40 border border-rose-800 text-[10px] text-rose-300">
                          {videoUploadError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-700 hover:border-amber-400/70 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        <span>Выбрать MP4 с устройства</span>
                      </button>

                      <div className="flex gap-1 pt-1">
                        <input
                          type="url"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="https://.../video.mp4"
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVideoUrl}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors shrink-0"
                        >
                          OK
                        </button>
                      </div>
                    </div>

                    {/* Curated Aesthetic Video Loops */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-neutral-400 uppercase">
                          Готовые видео-лупы (1 клик):
                        </span>
                        <span className="text-[9px] font-mono text-amber-400">Royalty-free</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {VIDEO_PRESETS.map((preset) => {
                          const isAttached = currentSlide.videoUrl === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPresetVideo(preset)}
                              className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                                isAttached
                                  ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400'
                                  : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-0.5">
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-amber-300 font-bold uppercase">
                                  {preset.category}
                                </span>
                                <span className="text-[9px] font-mono text-neutral-400">
                                  {preset.durationSec}s
                                </span>
                              </div>

                              <div className="text-xs font-bold text-white leading-tight my-1 truncate">
                                {preset.title}
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-neutral-800/80">
                                <span className={isAttached ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                                  {isAttached ? '✓ На слайде' : 'Прикрепить'}
                                </span>
                                <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================
                    SUBTAB 2: PHOTO & NANO BANANA AI
                   ======================================================== */}
                {mediaSubTab === 'photo' && (
                  <div className="space-y-3">
                    {/* Upload Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-700 hover:border-rose-400/70 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-rose-400" />
                      <span>Загрузить фото с устройства</span>
                    </button>

                    {/* AI Nano Banana Generator */}
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          🍌 Nano Banana AI
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400">ИИ Генерация</span>
                      </div>

                      <textarea
                        rows={2}
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                        placeholder="Опишите сцену для слайда..."
                      />

                      {genError && (
                        <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-800">
                          {genError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleGenerateNanoBanana()}
                        disabled={isGenerating}
                        className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                      >
                        {isGenerating ? (
                          <>
                            <span className="w-3 h-3 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                            <span>Генерация...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Сгенерировать в Nano Banana</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Curated Editorial Photo Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-neutral-400 uppercase block">
                        Журнальные кадры (Unsplash):
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {EDITORIAL_PHOTO_PRESETS.slice(0, 6).map((preset) => {
                          const isAttached = currentSlide.imageUrl === preset.url;
                          return (
                            <div
                              key={preset.id}
                              onClick={() => handleSelectPresetPhoto(preset)}
                              className={`group relative aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer shadow-sm transition-all ${
                                isAttached
                                  ? 'border-rose-400 ring-2 ring-rose-400/50'
                                  : 'border-neutral-800 hover:border-amber-400'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                                <span className="text-[8px] text-white font-mono truncate">
                                  {isAttached ? '✓ Выбрано' : preset.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ELEMENTS & WIDGETS */}
            {activeTab === 'elements' && (
              <div className="space-y-4">
                {/* Canva Sticker Section 1: Instagram Swipe Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400 uppercase block">
                      Свайп-стрелки Instagram (1 клик):
                    </span>
                    <span className="text-[9px] font-mono text-rose-400">Canva Elements</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      'Листать карусель →',
                      '➔ СВАЙП',
                      'ЛИСТАЙ ДАЛЬШЕ ➔',
                      'SWIPE FOR NEXT 👉',
                      'ЧИТАТЬ ВЫВОД →',
                      'СЛЕДУЮЩИЙ СЛАЙД ➔',
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => {
                          const hidden = currentSlide.hiddenBlocks || [];
                          onUpdateSlide({
                            ...currentSlide,
                            swipePrompt: promptText,
                            hiddenBlocks: hidden.filter((k) => k !== 'swipePrompt'),
                          });
                        }}
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-850 text-[10px] text-neutral-200 font-mono text-left transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{promptText}</span>
                        <span className="text-amber-400 text-xs shrink-0 ml-1">+</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canva Sticker Section 2: Creator Badges & Callout Stickers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400 uppercase block">
                      Плашки и наклейки (1 клик):
                    </span>
                    <span className="text-[9px] font-mono text-amber-400">Вирусные триггеры</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { icon: '🔥', label: 'ТОП ВЫВОД' },
                      { icon: '⚡', label: 'ВАЖНО ЗНАТЬ' },
                      { icon: '💡', label: 'ГЛАВНЫЙ СЕКРЕТ' },
                      { icon: '📌', label: 'СОХРАНИ В ЗАКЛАДКИ' },
                      { icon: '✓', label: 'ПРОВЕРЕНО 2026' },
                      { icon: '🎯', label: 'ФАКТ & ЦЕЛЬ' },
                      { icon: '⚠️', label: 'ТИПИЧНАЯ ОШИБКА' },
                      { icon: '💎', label: 'ЗОЛОТОЕ ПРАВИЛО' },
                    ].map((badge) => (
                      <button
                        key={badge.label}
                        type="button"
                        onClick={() => {
                          const hidden = currentSlide.hiddenBlocks || [];
                          onUpdateSlide({
                            ...currentSlide,
                            highlight: `${badge.icon} ${badge.label}: ${currentSlide.highlight || currentSlide.title || ''}`,
                            hiddenBlocks: hidden.filter((k) => k !== 'highlight'),
                          });
                        }}
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-rose-400/60 hover:bg-neutral-850 text-[10px] text-neutral-200 font-mono text-left transition-all flex items-center gap-1.5"
                      >
                        <span className="text-sm shrink-0">{badge.icon}</span>
                        <span className="truncate">{badge.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canva Sticker Section 3: Interactive Micro-widgets */}
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">
                    Интерактивные микро-виджеты:
                  </span>

                  {/* Widget 1: Audio player */}
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span>🎙️</span>
                        <span>Аудио-волна / Голосовое</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock('stats')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          isBlockVisible('stats')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isBlockVisible('stats') ? 'Активен' : '+ Добавить'}
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Эмулирует прослушивание голосового сообщения автора с эквалайзером.
                    </p>
                  </div>

                  {/* Widget 2: Direct Dialogue */}
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span>💬</span>
                        <span>Диалог в Direct</span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400">Слайд #4</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Отображает мысль в виде диалога с входящим вопросом и ответом автора.
                    </p>
                  </div>

                  {/* Widget 3: Checklist */}
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span>✓</span>
                        <span>Чеклист с галочками</span>
                      </span>
                      <span className="text-[9px] font-mono text-amber-400">Слайд #2, 7</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Строки основного текста автоматически трансформируются в пункты с галочками.
                    </p>
                  </div>

                  {/* Widget 4: Big Typographic Metric */}
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span>📊</span>
                        <span>Метрика & Цифра</span>
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400">Слайд #{currentSlide.slideNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={currentSlide.statNumber || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, statNumber: e.target.value })
                        }
                        placeholder="84%"
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                      />
                      <input
                        type="text"
                        value={currentSlide.statLabel || ''}
                        onChange={(e) =>
                          onUpdateSlide({ ...currentSlide, statLabel: e.target.value })
                        }
                        placeholder="ДОКАЗАТЕЛЬСТВО"
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: INSTAGRAM CAPTION */}
            {activeTab === 'caption' && (
              <CaptionView
                caption={project.caption}
                callToAction={project.callToAction}
                onUpdateCaption={onUpdateCaption}
                onUpdateCta={onUpdateCta}
              />
            )}

            {/* TAB 7: VIRAL AUDIT */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                        Quality Gate Score
                      </span>
                      <div className="text-2xl font-black font-mono text-white">
                        {project.qualityScore.total}/100
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onTriggerAudit}
                      disabled={isAuditing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-mono font-bold border border-emerald-800 flex items-center gap-1.5"
                    >
                      <RotateCcw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span>{isAuditing ? 'Аудит...' : 'Перепроверить'}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400">
                      <span>Идея и новизна:</span>
                      <span className="text-white font-bold">{project.qualityScore.breakdown.idea}/20</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Хук и обложка:</span>
                      <span className="text-white font-bold">{project.qualityScore.breakdown.cover}/15</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Драматургия 10 слайдов:</span>
                      <span className="text-white font-bold">{project.qualityScore.breakdown.scenario}/15</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Чистота текста:</span>
                      <span className="text-white font-bold">{project.qualityScore.breakdown.text}/15</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Арт-дирекшн & Визуал:</span>
                      <span className="text-white font-bold">{project.qualityScore.breakdown.visual}/15</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAnalysisModal}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-mono text-xs font-bold border border-neutral-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Полный аналитический отчет →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          3. CANVA CENTER STAGE (Main Canvas + Top Context Bar)
         ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Canva Stage Top Context Toolbar */}
        <div className="shrink-0 h-12 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between gap-2 z-10 min-w-0 overflow-x-auto no-scrollbar">
          {/* Left: Slide role and navigation */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onSelectSlide(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Предыдущий слайд"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-neutral-200">
                {activeSlideIndex + 1} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={() => onSelectSlide(Math.min(totalSlides - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === totalSlides - 1}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Следующий слайд"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono truncate text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-bold text-neutral-200">{currentSlide.role}</span>
              <span className="text-neutral-500">·</span>
              <span className="truncate">{currentSlide.roleName}</span>
            </div>
          </div>

          {/* Center: Quick AutoMix Palettes & Zoom */}
          <div className="hidden 2xl:flex items-center gap-3 shrink-0">
            {/* Quick Brand Palette Switcher */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] font-mono text-neutral-400 mr-0.5">Палитра:</span>
              {AUTO_MIX_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => {
                    if (activeStyleId !== 'smart-adaptive') onSelectStyle('smart-adaptive');
                    onSelectAutoMixPalette(pal.id);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    activeAutoMixPaletteId === pal.id
                      ? 'border-white scale-125 shadow-md ring-1 ring-white/50'
                      : 'border-neutral-700 opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: pal.accentHex }}
                  title={`${pal.nameRu} (Клик для применения)`}
                />
              ))}
            </div>

            {/* Canvas Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.max(70, z - 10))}
                className="px-2 py-0.5 text-neutral-400 hover:text-white rounded transition-colors"
                title="Уменьшить масштаб холста"
              >
                -
              </button>
              <span className="px-1 text-[11px] text-neutral-300 font-bold min-w-[36px] text-center">
                {canvasZoom}%
              </span>
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.min(130, z + 10))}
                className="px-2 py-0.5 text-neutral-400 hover:text-white rounded transition-colors"
                title="Увеличить масштаб холста"
              >
                +
              </button>
            </div>
          </div>

          {/* Right: View Mode Toggle, Safe Zones & Slideshow (Icon-First) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: 3 Modes (Canvas, Panorama, Instagram) */}
            <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'canvas'
                    ? 'bg-neutral-800 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Режим холста: прямое редактирование слайда"
                aria-label="Холст"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('panorama')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'panorama'
                    ? 'bg-neutral-800 text-rose-400 font-bold shadow ring-1 ring-rose-500/50'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Панорама: вся карусель в одну непрерывную ленту"
                aria-label="Панорама"
              >
                <Film className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('instagram')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'instagram'
                    ? 'bg-neutral-800 text-white font-bold shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Instagram: симулятор поста в мобильной ленте"
                aria-label="Instagram"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Safe Zones Toggle */}
            <button
              type="button"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                showSafeZones
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-xs'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
              title={showSafeZones ? 'Скрыть безопасные зоны 4:5' : 'Показать безопасные зоны 4:5'}
              aria-label="Безопасные зоны"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Slideshow Presentation Mode */}
            <button
              type="button"
              onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                isPlayingSlideshow
                  ? 'bg-rose-600 text-white border-rose-500 font-bold animate-pulse'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:text-white'
              }`}
              title={isPlayingSlideshow ? 'Остановить слайдшоу' : 'Автоматический просмотр карусели'}
              aria-label="Слайдшоу"
            >
              {isPlayingSlideshow ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Duplicate slide */}
            <button
              type="button"
              onClick={() => onDuplicateSlide(activeSlideIndex)}
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors"
              title="Дублировать текущий слайд"
              aria-label="Дублировать"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete slide */}
            {totalSlides > 2 && (
              <button
                type="button"
                onClick={() => onDeleteSlide(activeSlideIndex)}
                className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Удалить текущий слайд"
                aria-label="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Canvas Stage Body */}
        <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-6 bg-neutral-950/90 relative flex flex-col items-center justify-start sm:justify-center">
          {viewMode === 'canvas' ? (
            /* CLEAN CANVA CARD STAGE WITH DIRECT ON-CANVAS EDITING */
            <div
              className="relative max-h-full aspect-[4/5] w-full max-w-[min(450px,100%)] my-auto rounded-2xl shadow-2xl overflow-hidden border border-neutral-800 bg-neutral-950 transition-all duration-200 shrink-0"
              style={{
                height: 'min(580px, 100%)',
                transform: canvasZoom !== 100 ? `scale(${canvasZoom / 100})` : undefined,
                transformOrigin: 'center center',
              }}
            >
              <SlideCard
                domId={`preview-slide-${activeSlideIndex}`}
                slide={currentSlide}
                totalSlides={totalSlides}
                styleId={activeStyleId}
                autoMixPaletteId={activeAutoMixPaletteId}
                showSafeZones={showSafeZones}
                onDeleteBlock={handleDeleteBlock}
                onMoveBlock={handleMoveBlock}
                onReorderBlock={handleReorderBlock}
                showBlockDeleters={false}
                className="w-full h-full"
                onUpdateText={(field, val) => {
                  onUpdateSlide({
                    ...currentSlide,
                    [field]: val,
                  });
                }}
              />
            </div>
          ) : viewMode === 'panorama' ? (
            /* CANVA SEAMLESS PANORAMA MODE: ALL 10 SLIDES IN A CONTINUOUS HORIZONTAL RIBBON */
            <div className="w-full h-full flex flex-col justify-center overflow-x-auto overflow-y-hidden py-3 px-4 sm:px-6 no-scrollbar my-auto">
              <div className="text-center pb-2 shrink-0">
                <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full shadow">
                  🎞️ Бесшовная панорама карусели ({totalSlides} слайдов) · Кликните на слайд для фокуса
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-max mx-auto py-2 my-auto">
                {project.slides.map((s, idx) => {
                  const isSel = idx === activeSlideIndex;
                  return (
                    <div key={idx} className="flex items-center gap-3 shrink-0">
                      <div
                        onClick={() => onSelectSlide(idx)}
                        className={`relative max-h-[min(500px,100%)] h-full aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          isSel
                            ? 'ring-4 ring-rose-500 shadow-2xl scale-[1.02] z-20'
                            : 'opacity-85 hover:opacity-100 hover:scale-[1.01] border border-neutral-800 shadow-xl'
                        }`}
                        style={{ height: 'min(500px, 100%)' }}
                      >
                        {/* Slide Top Badge */}
                        <div className="absolute top-2 left-2 z-30 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur text-[10px] font-mono font-bold text-white border border-white/20 flex items-center gap-1.5 shadow">
                          <span className={isSel ? 'text-rose-400 font-extrabold' : 'text-neutral-400'}>
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-white truncate max-w-[120px]">
                            {s.role?.split('/')[1] || s.roleName || ''}
                          </span>
                        </div>

                        <SlideCard
                          slide={s}
                          totalSlides={totalSlides}
                          styleId={activeStyleId}
                          autoMixPaletteId={activeAutoMixPaletteId}
                          showSafeZones={showSafeZones}
                          className="w-full h-full"
                          onUpdateText={(field, val) => {
                            onUpdateSlide({
                              ...s,
                              [field]: val,
                            });
                          }}
                          onDeleteBlock={handleDeleteBlock}
                          onMoveBlock={handleMoveBlock}
                          onReorderBlock={handleReorderBlock}
                          showBlockDeleters={false}
                        />
                      </div>

                      {/* Visual Swipe Connector between slides */}
                      {idx < totalSlides - 1 && (
                        <div className="flex flex-col items-center justify-center text-neutral-500 font-mono text-xs select-none px-0.5 shrink-0">
                          <span className="text-base text-rose-400/80">➔</span>
                          <span className="text-[9px] uppercase tracking-wider text-neutral-500">Свайп</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* REALISTIC INSTAGRAM SIMULATOR STAGE */
            <div className="w-full max-w-[340px] flex items-center justify-center my-auto py-2 shrink-0">
              <InstagramSimulator
                slides={project.slides}
                activeSlideIndex={activeSlideIndex}
                onSelectSlide={onSelectSlide}
                styleId={activeStyleId}
                autoMixPaletteId={activeAutoMixPaletteId}
                caption={project.caption}
                onUpdateSlide={onUpdateSlide}
              />
            </div>
          )}
        </div>

        {/* ========================================================
            4. CANVA BOTTOM FILMSTRIP (Carousel Slides Timeline)
           ======================================================== */}
        <div className="shrink-0 bg-neutral-900 border-t border-neutral-800 flex flex-col z-20">
          {/* Filmstrip Header Bar */}
          <div className="h-6 px-3 bg-neutral-950/80 border-b border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-300">СЛАЙДЫ</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400 font-bold">{totalSlides}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFilmstripOpen(!isFilmstripOpen)}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
              title={isFilmstripOpen ? 'Свернуть ленту слайдов' : 'Развернуть ленту слайдов'}
            >
              <span>{isFilmstripOpen ? '⌄' : '⌃'}</span>
            </button>
          </div>

          {/* Filmstrip Slides Tray */}
          {isFilmstripOpen && (
            <div className="h-28 sm:h-32 p-2.5 overflow-x-auto flex items-center gap-2.5 select-none">
              {project.slides.map((s, idx) => {
                const isActive = idx === activeSlideIndex;

                return (
                  <div
                    key={s.slideNumber || idx}
                    onClick={() => onSelectSlide(idx)}
                    className={`group relative shrink-0 h-full aspect-[4/5] rounded-xl overflow-hidden cursor-pointer transition-all border flex flex-col ${
                      isActive
                        ? 'border-rose-500 ring-2 ring-rose-500/50 scale-102 shadow-lg'
                        : 'border-neutral-800 hover:border-neutral-600 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Live Slide Thumbnail */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none origin-top-left"
                      style={{ width: '263.15%', height: '263.15%', transform: 'scale(0.38)' }}
                    >
                      <SlideCard
                        slide={s}
                        totalSlides={totalSlides}
                        styleId={activeStyleId}
                        autoMixPaletteId={activeAutoMixPaletteId}
                        isThumbnail={true}
                      />
                    </div>

                    {/* Bottom Info Pill */}
                    <div className="absolute bottom-0 inset-x-0 bg-neutral-950/90 backdrop-blur border-t border-neutral-800 px-1.5 py-0.5 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-white">
                        #{idx + 1}
                      </span>
                      <span className="text-[7px] font-mono text-neutral-400 truncate max-w-[48px]">
                        {s.role}
                      </span>
                    </div>

                    {/* Quick Move Reordering Controls on Hover */}
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/95 border border-neutral-700 rounded p-0.5 shadow">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSlideOrder(idx, 'left');
                          }}
                          className="p-0.5 text-neutral-300 hover:text-white"
                          title="Сдвинуть влево"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < totalSlides - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSlideOrder(idx, 'right');
                          }}
                          className="p-0.5 text-neutral-300 hover:text-white"
                          title="Сдвинуть вправо"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Slide Button */}
              <button
                type="button"
                onClick={onAddSlide}
                className="shrink-0 h-full aspect-[4/5] rounded-xl border border-dashed border-neutral-700 hover:border-rose-500/80 bg-neutral-950/50 hover:bg-neutral-900 flex flex-col items-center justify-center text-neutral-400 hover:text-rose-300 transition-all group"
                title="Добавить новый слайд в карусель"
              >
                <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-bold">Добавить</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
