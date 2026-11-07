import React, { useState } from 'react';
import { VisualStyleId, AutoMixPaletteId, SlideItem } from '../types/carousel';
import { VISUAL_STYLES } from '../data/visualStyles';
import { AUTO_MIX_PALETTES } from '../data/autoMixThemes';
import { resolveSlideStyle } from './SlideCard';
import { Check, Sparkles, Palette, Crown } from 'lucide-react';

interface StyleSelectorProps {
  activeStyleId: VisualStyleId;
  onSelectStyle: (styleId: VisualStyleId) => void;
  activeAutoMixPaletteId?: AutoMixPaletteId;
  onSelectAutoMixPalette?: (paletteId: AutoMixPaletteId) => void;
  slides?: SlideItem[];
  activeSlideIndex?: number;
  onSelectSlide?: (index: number) => void;
  onUpdateSlide?: (updatedSlide: SlideItem) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  activeStyleId,
  onSelectStyle,
  activeAutoMixPaletteId = 'obsidian-gold',
  onSelectAutoMixPalette,
  slides = [],
  activeSlideIndex = 0,
  onUpdateSlide,
}) => {
  // Scope mode: 'all' (apply to all 10 slides) or 'current' (only to active slide)
  const [applyScope, setApplyScope] = useState<'all' | 'current'>('all');

  const currentSlide = slides[activeSlideIndex] || slides[0];
  const effectiveStyleId = currentSlide ? resolveSlideStyle(currentSlide, activeStyleId) : activeStyleId;

  const handleChooseStyle = (styleId: VisualStyleId) => {
    if (applyScope === 'all') {
      onSelectStyle(styleId);
      // Reset individual overrides so the style applies to the whole carousel
      if (slides.length > 0 && onUpdateSlide) {
        slides.forEach((s) => {
          if (s.adaptiveStyleId) {
            onUpdateSlide({
              ...s,
              adaptiveStyleId: undefined,
            });
          }
        });
      }
    } else {
      // Only for current slide
      if (currentSlide && onUpdateSlide) {
        onUpdateSlide({
          ...currentSlide,
          adaptiveStyleId: styleId === activeStyleId ? undefined : styleId,
        });
      }
    }
  };

  return (
    <div className="space-y-3.5 select-none text-neutral-100">
      {/* 1. BRAND COLOR PALETTES (ЦВЕТА БРЕНДА) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Палитра карусели</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-400">1 клик для всех слайдов</span>
        </div>

        {/* Compact color swatches */}
        <div className="grid grid-cols-5 gap-1.5">
          {AUTO_MIX_PALETTES.map((pal) => {
            const isSelected = activeAutoMixPaletteId === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => {
                  if (activeStyleId !== 'smart-adaptive') {
                    onSelectStyle('smart-adaptive');
                  }
                  if (onSelectAutoMixPalette) {
                    onSelectAutoMixPalette(pal.id);
                  }
                }}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-neutral-850 border-white ring-2 ring-white/50 shadow-md'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 opacity-80 hover:opacity-100'
                }`}
                title={`${pal.nameRu}: ${pal.desc}`}
              >
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm flex items-center justify-center mb-1"
                  style={{ backgroundColor: pal.accentHex }}
                >
                  {isSelected && <Check className="w-3 h-3 text-neutral-950 stroke-[3]" />}
                </div>
                <span className="text-[8.5px] font-mono font-semibold truncate w-full text-center text-neutral-300">
                  {pal.nameRu.split('&')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SCOPE TOGGLE (КУДА ПРИМЕНИТЬ) */}
      <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono">
        <button
          type="button"
          onClick={() => setApplyScope('all')}
          className={`flex-1 py-1.5 rounded text-center transition-colors font-bold ${
            applyScope === 'all'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Ко всей карусели ({slides.length || 10})
        </button>
        <button
          type="button"
          onClick={() => setApplyScope('current')}
          className={`flex-1 py-1.5 rounded text-center transition-colors font-bold ${
            applyScope === 'current'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Только слайд #{activeSlideIndex + 1}
        </button>
      </div>

      {/* 3. VISUAL STYLES LIST (СПИСОК СТИЛЕЙ) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
          <span>Стиль оформления:</span>
          <span>{VISUAL_STYLES.length} готовых стилей</span>
        </div>

        <div className="space-y-1.5 max-h-[calc(100vh-310px)] overflow-y-auto pr-0.5">
          {VISUAL_STYLES.map((style) => {
            const isCurrentActive =
              applyScope === 'all'
                ? activeStyleId === style.id
                : effectiveStyleId === style.id;
            const isSmart = style.id === 'smart-adaptive';

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleChooseStyle(style.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                  isCurrentActive
                    ? isSmart
                      ? 'bg-amber-950/30 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-neutral-850 border-white ring-1 ring-white/40 shadow-md'
                    : 'bg-neutral-950/70 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Style Badge / Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSmart
                        ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    {isSmart ? (
                      <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {style.nameRu.split('(')[0].trim()}
                      </span>
                      {isSmart && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[8px] font-mono font-bold shrink-0">
                          ТОП
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {style.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right Status Indicator */}
                <div className="shrink-0">
                  {isCurrentActive ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center opacity-40 hover:opacity-100" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
