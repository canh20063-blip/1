import React from 'react';
import { SlideItem, VisualStyleId, AutoMixPaletteId } from '../types/carousel';
import { SlideCard, resolveSmartWidgetArchetype } from './SlideCard';

interface SlideGridViewProps {
  slides: SlideItem[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  styleId: VisualStyleId;
  autoMixPaletteId?: AutoMixPaletteId;
  onOpenSlideEditor: () => void;
}

export const SlideGridView: React.FC<SlideGridViewProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  styleId,
  autoMixPaletteId = 'obsidian-gold',
  onOpenSlideEditor,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <span>Режиссура всех {slides.length} слайдов</span>
            {styleId === 'smart-adaptive' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                👑 Единый автомикс 2.0
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {styleId === 'smart-adaptive'
              ? 'Единая цветовая айдентика бренда на всех 10 слайдах + нативные виджеты (аудио, чаты, чеклисты, цифры)'
              : 'Оцените визуальный ритм, чередование плотности текста и логику развития мысли'}
          </p>
        </div>
        <div className="text-xs font-mono text-neutral-400">
          Кликните на любой слайд для фокусировки
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {slides.map((slide, idx) => {
          const isSelected = idx === activeSlideIndex;
          const archetype = resolveSmartWidgetArchetype(slide, slides.length);

          const archetypeLabels: Record<string, string> = {
            cover: 'Обложка',
            'audio-player': 'Аудио',
            'direct-dialog': 'Чат Direct',
            checklist: 'Чеклист',
            'data-metric': 'Цифры',
            'quote-thread': 'Тред',
            manifesto: 'Манифест',
            'cta-finale': 'CTA Финал',
            'highlight-statement': 'Акцент',
          };

          return (
            <div
              key={slide.slideNumber}
              onClick={() => onSelectSlide(idx)}
              className={`group cursor-pointer rounded-xl transition-all relative ${
                isSelected
                  ? 'ring-2 ring-rose-500 scale-[1.02]'
                  : 'hover:opacity-90 opacity-80 hover:scale-[1.01]'
              }`}
            >
              <div className="pointer-events-none">
                <SlideCard
                  slide={slide}
                  totalSlides={slides.length}
                  styleId={styleId}
                  autoMixPaletteId={autoMixPaletteId}
                  isThumbnail={true}
                />
              </div>

              {/* Overlay Badge */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-20 pointer-events-none">
                <div className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono text-white font-bold border border-white/10 truncate">
                  #{slide.slideNumber} {slide.roleName}
                </div>
                {styleId === 'smart-adaptive' && (
                  <div className="px-1 py-0.5 rounded bg-amber-400/25 backdrop-blur text-[8px] font-mono text-amber-200 font-medium border border-amber-400/40 shrink-0">
                    {archetypeLabels[archetype] || 'Виджет'}
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-rose-500/10 pointer-events-none rounded-xl border border-rose-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
