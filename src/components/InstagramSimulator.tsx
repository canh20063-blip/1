import React, { useState } from 'react';
import { SlideItem, VisualStyleId, AutoMixPaletteId } from '../types/carousel';
import { SlideCard, resolveSlideStyle, resolveSmartWidgetArchetype } from './SlideCard';
import { VISUAL_STYLES } from '../data/visualStyles';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Palette,
  Edit3,
  X,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface InstagramSimulatorProps {
  slides: SlideItem[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  styleId: VisualStyleId;
  caption: string;
  autoMixPaletteId?: AutoMixPaletteId;
  onOpenStyleTab?: () => void;
  isEditorOpen?: boolean;
  onToggleEditor?: () => void;
  onUpdateSlide?: (updatedSlide: SlideItem) => void;
}

const BLOCK_NAMES: Record<string, string> = {
  title: 'Заголовок',
  body: 'Текст',
  highlight: 'Акцент',
  kicker: 'Кикер',
  roleName: 'Бейдж роли',
  image: 'Визуал',
  footnote: 'Источник & Фактчек',
  stats: 'Метрика',
  comparison: 'Сравнение',
  swipePrompt: 'SWIPE',
};

export const InstagramSimulator: React.FC<InstagramSimulatorProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  styleId,
  caption,
  autoMixPaletteId = 'obsidian-gold',
  onOpenStyleTab,
  isEditorOpen = false,
  onToggleEditor,
  onUpdateSlide,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showBlockDeleters, setShowBlockDeleters] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const currentSlide = slides[activeSlideIndex] || slides[0];
  const currentStyle = VISUAL_STYLES.find((s) => s.id === styleId) || VISUAL_STYLES[0];
  const effectiveSlideStyleId = resolveSlideStyle(currentSlide, styleId);
  const effectiveSlideStyle = VISUAL_STYLES.find((s) => s.id === effectiveSlideStyleId) || currentStyle;
  const smartArchetype = resolveSmartWidgetArchetype(currentSlide, slides.length);

  const handleDeleteBlock = (blockKey: string) => {
    if (!onUpdateSlide) return;
    const currentHidden = currentSlide.hiddenBlocks || [];
    if (!currentHidden.includes(blockKey)) {
      onUpdateSlide({
        ...currentSlide,
        hiddenBlocks: [...currentHidden, blockKey],
      });
    }
  };

  const handleRestoreBlock = (blockKey: string) => {
    if (!onUpdateSlide) return;
    const currentHidden = currentSlide.hiddenBlocks || [];
    onUpdateSlide({
      ...currentSlide,
      hiddenBlocks: currentHidden.filter((k) => k !== blockKey),
    });
  };

  const handleRestoreAllBlocks = () => {
    if (!onUpdateSlide) return;
    onUpdateSlide({
      ...currentSlide,
      hiddenBlocks: [],
    });
  };

  const handleMoveBlock = (blockKey: string, direction: 'up' | 'down') => {
    if (!onUpdateSlide) return;
    const defaultOrder = ['kicker', 'roleName', 'title', 'image', 'highlight', 'body', 'stats', 'comparison', 'footnote', 'swipePrompt'];
    const currentOrder = currentSlide.blockOrder && currentSlide.blockOrder.length > 0
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

  const handlePrev = () => {
    if (activeSlideIndex > 0) {
      onSelectSlide(activeSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeSlideIndex < slides.length - 1) {
      onSelectSlide(activeSlideIndex + 1);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[340px] select-none">
      {/* Top Controls Strip */}
      <div className="w-full flex items-center justify-between gap-1.5 mb-2 text-xs">
        {styleId === 'smart-adaptive' ? (
          <button
            onClick={onOpenStyleTab}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-mono transition-colors shrink-0 shadow-sm"
            title="Автосмешивание активно: стиль каждого слайда адаптируется динамически"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold text-amber-300">Автомикс:</span>
            <span className="truncate max-w-[85px] text-white">
              {effectiveSlideStyle.nameRu.replace('👑 ', '').split('(')[0].trim()}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenStyleTab}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[11px] font-mono transition-colors shrink-0"
            title="Сменить визуальный стиль"
          >
            <Palette className="w-3 h-3 text-rose-400" />
            <span className="truncate max-w-[100px]">{currentStyle.nameRu}</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          {/* Delete Blocks Mode Toggle */}
          <button
            onClick={() => setShowBlockDeleters(!showBlockDeleters)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${
              showBlockDeleters
                ? 'bg-rose-600 text-white border border-rose-500 font-bold shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
            title={showBlockDeleters ? 'Скрыть кнопки удаления блоков' : 'Включить режим быстрого удаления блоков со слайда'}
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>{showBlockDeleters ? 'Удаление' : 'Блоки'}</span>
          </button>

          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${
              showSafeZones
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
            title="Включить отображение безопасных зон интерфейса Instagram"
          >
            <Eye className="w-3 h-3" />
            <span>Зоны</span>
          </button>

          {onToggleEditor && (
            <button
              onClick={onToggleEditor}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors border shadow-sm ${
                isEditorOpen
                  ? 'bg-neutral-800 text-white border-neutral-600'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 font-semibold'
              }`}
              title={isEditorOpen ? 'Закрыть редактор' : 'Открыть редактор этого слайда'}
            >
              {isEditorOpen ? (
                <>
                  <X className="w-3 h-3" />
                  <span>Закрыть</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" />
                  <span>Редактор</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-[28px] p-2.5 shadow-xl relative">
        {/* Notch / Speaker */}
        <div className="w-20 h-3 bg-neutral-950 rounded-full mx-auto mb-1.5 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-neutral-800 mr-1.5"></div>
          <div className="w-8 h-1 rounded-full bg-neutral-800"></div>
        </div>

        {/* Instagram Profile Header */}
        <div className="flex items-center justify-between px-1.5 py-1.5 border-b border-neutral-800/80 mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center text-[10px] font-bold font-brutal text-white">
                V
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-neutral-200 block leading-tight">
                viral.carousel.os
              </span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="text-[9px] text-neutral-400 font-mono">
                  {currentSlide.role}
                </span>
                {styleId === 'smart-adaptive' && (
                  <span className="text-[8px] font-mono px-1 py-0 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    👑 {smartArchetype === 'cover' ? 'Обложка' : smartArchetype === 'audio-player' ? 'Аудио' : smartArchetype === 'direct-dialog' ? 'Чат Direct' : smartArchetype === 'checklist' ? 'Чеклист' : smartArchetype === 'data-metric' ? 'Цифры' : smartArchetype === 'quote-thread' ? 'Тред' : smartArchetype === 'manifesto' ? 'Манифест' : 'CTA Финал'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="text-neutral-400 hover:text-white p-0.5">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4:5 Slide Canvas */}
        <div className="relative group">
          <SlideCard
            slide={currentSlide}
            totalSlides={slides.length}
            styleId={styleId}
            autoMixPaletteId={autoMixPaletteId}
            showSafeZones={showSafeZones}
            domId={`preview-slide-${activeSlideIndex}`}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            showBlockDeleters={showBlockDeleters}
          />

          {/* Nav arrows overlay */}
          {activeSlideIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-950/70 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur shadow transition-all z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {activeSlideIndex < slides.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-950/70 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur shadow transition-all z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Slide counter pill */}
          <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] font-mono text-white/90 z-10 pointer-events-none">
            {activeSlideIndex + 1}/{slides.length}
          </div>
        </div>

        {/* Instagram Action Bar */}
        <div className="flex items-center justify-between px-1 py-1.5 mt-0.5 text-neutral-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-white'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            </button>
            <button className="hover:text-white">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="hover:text-white text-emerald-400" title="Отправить в Direct">
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSlide(idx)}
                className={`transition-all rounded-full ${
                  idx === activeSlideIndex
                    ? 'w-1.5 h-1.5 bg-blue-500'
                    : 'w-1 h-1 bg-neutral-600 hover:bg-neutral-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Bookmark */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`transition-colors ${isSaved ? 'text-amber-400' : 'hover:text-white'}`}
            title="Сохранить в закладки"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Caption Snippet */}
        <div className="px-1 text-[10px] text-neutral-400 leading-tight font-sans">
          <span className="font-bold text-neutral-200 mr-1">viral.carousel.os</span>
          {isCaptionExpanded ? (
            <span className="whitespace-pre-line text-neutral-300">{caption}</span>
          ) : (
            <span>
              {caption.slice(0, 65)}...{' '}
              <button
                onClick={() => setIsCaptionExpanded(true)}
                className="text-neutral-500 hover:text-neutral-300 font-medium"
              >
                ещё
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Slide Navigation Buttons [1]..[10] directly under phone */}
      <div className="w-full mt-2.5 flex items-center justify-between gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-lg">
        <button
          onClick={handlePrev}
          disabled={activeSlideIndex === 0}
          className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Предыдущий слайд"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {slides.map((s, idx) => (
            <button
              key={s.slideNumber}
              onClick={() => onSelectSlide(idx)}
              className={`w-5 h-5 rounded text-[10px] font-mono font-semibold transition-all flex items-center justify-center ${
                idx === activeSlideIndex
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {s.slideNumber}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={activeSlideIndex === slides.length - 1}
          className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Следующий слайд"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hidden blocks restore dock if any block is deleted on current slide */}
      {currentSlide.hiddenBlocks && currentSlide.hiddenBlocks.length > 0 && (
        <div className="w-full mt-2 p-2 rounded-xl bg-neutral-900 border border-rose-900/40 text-[10px] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Trash2 className="w-3 h-3" />
              <span>Скрыто блоков ({currentSlide.hiddenBlocks.length}):</span>
            </span>
            <button
              onClick={handleRestoreAllBlocks}
              className="text-[9px] text-neutral-400 hover:text-white underline font-mono flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Вернуть все</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {currentSlide.hiddenBlocks.map((b) => (
              <button
                key={b}
                onClick={() => handleRestoreBlock(b)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1 text-[9px] font-mono transition-colors group"
                title={`Вернуть блок «${BLOCK_NAMES[b] || b}» на слайд`}
              >
                <span className="text-emerald-400 group-hover:scale-110 transition-transform font-bold">+</span>
                <span>{BLOCK_NAMES[b] || b}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
