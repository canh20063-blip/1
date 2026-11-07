import React, { useState, useEffect } from 'react';
import { SlideItem, VisualStyleId, AutoMixPaletteId } from '../types/carousel';
import { VISUAL_STYLES } from '../data/visualStyles';
import { AUTO_MIX_PALETTES, AutoMixPaletteConfig } from '../data/autoMixThemes';
import { ChevronLeft, GripVertical } from 'lucide-react';
import { SlideVideoPlayer } from './SlideVideoPlayer';

/**
 * Resolves the visual sub-style for a slide.
 * When smart-adaptive is selected, we maintain the UNIFIED brand identity canvas,
 * and adapt contextual visual widgets inside the slide.
 */
export function resolveSlideStyle(slide: SlideItem, chosenStyleId: VisualStyleId): VisualStyleId {
  if (slide.adaptiveStyleId && slide.adaptiveStyleId !== 'smart-adaptive') {
    return slide.adaptiveStyleId;
  }
  return chosenStyleId;
}

export type SmartWidgetArchetype =
  | 'cover'
  | 'checklist'
  | 'highlight-statement'
  | 'direct-dialog'
  | 'quote-thread'
  | 'data-metric'
  | 'audio-player'
  | 'manifesto'
  | 'cta-finale';

export function resolveSmartWidgetArchetype(slide: SlideItem, totalSlides: number): SmartWidgetArchetype {
  if (slide.slideNumber === 1) return 'cover';
  if (slide.slideNumber === totalSlides) return 'cta-finale';

  const combined = `${slide.title || ''} ${slide.body || ''} ${slide.highlight || ''} ${slide.kicker || ''} ${slide.role || ''} ${slide.roleName || ''}`.toLowerCase();

  // 1. Audio / Voice Memo
  if (
    slide.slideNumber === 8 ||
    combined.includes('голосовое') ||
    combined.includes('голосовая') ||
    combined.includes('аудио') ||
    combined.includes('диктофон') ||
    combined.includes('подкаст')
  ) {
    return 'audio-player';
  }

  // 2. Direct Chat & Dialogue
  if (
    slide.slideNumber === 4 ||
    (slide.comparisonBefore && slide.comparisonAfter) ||
    combined.includes('переписка') ||
    combined.includes('direct') ||
    combined.includes('директ') ||
    combined.includes('сообщение') ||
    combined.includes('клиент спросил') ||
    combined.includes('чат') ||
    combined.includes('диалог')
  ) {
    return 'direct-dialog';
  }

  // 3. Swiss Editorial Data & Statistics
  if (
    slide.slideNumber === 6 ||
    slide.statNumber ||
    slide.layoutVariant === 'data' ||
    combined.includes('%') ||
    combined.includes('статистик') ||
    combined.includes('данные') ||
    combined.includes('исследован') ||
    combined.includes('метрика')
  ) {
    return 'data-metric';
  }

  // 4. Checklist & Practical Insights
  if (
    slide.slideNumber === 2 ||
    slide.slideNumber === 7 ||
    slide.layoutVariant === 'checklist' ||
    combined.includes('чеклист') ||
    combined.includes('список') ||
    combined.includes('заметк') ||
    combined.includes('правило') ||
    combined.includes('инсайт')
  ) {
    return 'checklist';
  }

  // 5. Social Thread & Quote
  if (
    slide.slideNumber === 5 ||
    slide.layoutVariant === 'quote' ||
    combined.includes('твит') ||
    combined.includes('тред') ||
    combined.includes('тезис') ||
    combined.includes('мысль дня')
  ) {
    return 'quote-thread';
  }

  // 6. Climax / Manifesto
  if (
    slide.slideNumber === 9 ||
    slide.layoutVariant === 'statement' ||
    combined.includes('манифест') ||
    combined.includes('вывод') ||
    combined.includes('главное')
  ) {
    return 'manifesto';
  }

  return 'highlight-statement';
}

interface SlideCardProps {
  slide: SlideItem;
  totalSlides: number;
  styleId: VisualStyleId;
  autoMixPaletteId?: AutoMixPaletteId;
  showSafeZones?: boolean;
  domId?: string;
  className?: string;
  isThumbnail?: boolean;
  onDeleteBlock?: (blockKey: string) => void;
  onMoveBlock?: (blockKey: string, direction: 'up' | 'down') => void;
  onReorderBlock?: (sourceKey: string, targetKey: string, position: 'before' | 'after') => void;
  showBlockDeleters?: boolean;
  onUpdateText?: (field: 'title' | 'body' | 'highlight' | 'kicker' | 'roleName' | 'chatSenderTitle' | 'footnote' | 'statNumber' | 'statLabel', value: string) => void;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  totalSlides,
  styleId,
  autoMixPaletteId = 'obsidian-gold',
  showSafeZones = false,
  domId,
  className = '',
  isThumbnail = false,
  onDeleteBlock,
  onMoveBlock,
  onReorderBlock,
  showBlockDeleters = false,
  onUpdateText,
}) => {
  const effectiveStyleId = resolveSlideStyle(slide, styleId);
  const currentStyle = VISUAL_STYLES.find((s) => s.id === effectiveStyleId) || VISUAL_STYLES[0];

  // Track which block is currently clicked/focused by the user.
  // Move, delete and edit toolbars ONLY show for this specific selected block!
  const [selectedBlockKey, setSelectedBlockKey] = useState<string | null>(null);

  // Dynamic Alignment & Snap Guides state during block dragging
  const [draggingBlockKey, setDraggingBlockKey] = useState<string | null>(null);
  const [dragOverTargetKey, setDragOverTargetKey] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [pointerGuideCoords, setPointerGuideCoords] = useState<{
    xPercent: number;
    yPercent: number;
    isNearVCenter: boolean;
    isNearHCenter: boolean;
    isNearLeftMargin: boolean;
    isNearRightMargin: boolean;
  } | null>(null);

  // Card-level drag event handlers for global alignment guides
  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingBlockKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const cardRect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - cardRect.left;
    const relY = e.clientY - cardRect.top;
    const xPercent = Math.max(0, Math.min(100, Math.round((relX / cardRect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((relY / cardRect.height) * 100)));

    setPointerGuideCoords({
      xPercent,
      yPercent,
      isNearVCenter: Math.abs(xPercent - 50) <= 6,
      isNearHCenter: Math.abs(yPercent - 50) <= 6,
      isNearLeftMargin: Math.abs(xPercent - 10) <= 4,
      isNearRightMargin: Math.abs(xPercent - 90) <= 4,
    });
  };

  const handleCardDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setPointerGuideCoords(null);
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceKey = draggingBlockKey || e.dataTransfer.getData('text/plain');
    const targetKey = dragOverTargetKey;
    const position = dragOverPosition || 'after';

    if (sourceKey && targetKey && sourceKey !== targetKey) {
      if (onReorderBlock) {
        onReorderBlock(sourceKey, targetKey, position);
      } else if (onMoveBlock) {
        onMoveBlock(sourceKey, position === 'before' ? 'up' : 'down');
      }
    }

    setDraggingBlockKey(null);
    setDragOverTargetKey(null);
    setDragOverPosition(null);
    setPointerGuideCoords(null);
  };

  const handleDragStart = (e: React.DragEvent, blockKey: string) => {
    e.dataTransfer.setData('text/plain', blockKey);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingBlockKey(blockKey);
    setSelectedBlockKey(blockKey);
  };

  const handleBlockDragOver = (e: React.DragEvent<HTMLDivElement>, blockKey: string) => {
    if (!draggingBlockKey || draggingBlockKey === blockKey) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const position: 'before' | 'after' = relY < rect.height / 2 ? 'before' : 'after';

    setDragOverTargetKey(blockKey);
    setDragOverPosition(position);

    const cardElem = document.getElementById(domId || `preview-slide-${slide.slideNumber - 1}`);
    if (cardElem) {
      const cardRect = cardElem.getBoundingClientRect();
      const xPercent = Math.max(0, Math.min(100, Math.round(((e.clientX - cardRect.left) / cardRect.width) * 100)));
      const yPercent = Math.max(0, Math.min(100, Math.round(((e.clientY - cardRect.top) / cardRect.height) * 100)));
      setPointerGuideCoords({
        xPercent,
        yPercent,
        isNearVCenter: Math.abs(xPercent - 50) <= 6,
        isNearHCenter: Math.abs(yPercent - 50) <= 6,
        isNearLeftMargin: Math.abs(xPercent - 10) <= 4,
        isNearRightMargin: Math.abs(xPercent - 90) <= 4,
      });
    }
  };

  const handleBlockDragLeave = () => {
    // Keep active target until drop or next block
  };

  const handleDragEnd = () => {
    setDraggingBlockKey(null);
    setDragOverTargetKey(null);
    setDragOverPosition(null);
    setPointerGuideCoords(null);
  };

  // Inline WYSIWYG Editable Text component for Canva-like direct typing on canvas
  const InlineEditableText: React.FC<{
    value?: string;
    field: 'title' | 'body' | 'highlight' | 'kicker' | 'roleName' | 'chatSenderTitle' | 'footnote' | 'statNumber' | 'statLabel';
    className?: string;
    multiline?: boolean;
    placeholder?: string;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span';
  }> = ({ value = '', field, className = '', multiline = false, placeholder = '', as: Tag = 'div' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(value);

    useEffect(() => {
      setLocalText(value);
    }, [value]);

    if (isThumbnail || !onUpdateText) {
      return <Tag className={className}>{value || placeholder}</Tag>;
    }

    const handleCommit = () => {
      setIsEditing(false);
      if (localText !== value) {
        onUpdateText(field, localText);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        handleCommit();
      }
      if (e.key === 'Escape') {
        setLocalText(value);
        setIsEditing(false);
      }
    };

    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            autoFocus
            rows={Math.max(2, Math.min(5, localText.split('\n').length + 1))}
            value={localText}
            onChange={(e) => {
              setLocalText(e.target.value);
              onUpdateText(field, e.target.value);
            }}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`w-full bg-black/70 ring-2 ring-amber-400 rounded p-1.5 text-white resize-none outline-none z-30 shadow-2xl ${className}`}
            placeholder={placeholder}
          />
        );
      }
      return (
        <input
          autoFocus
          type="text"
          value={localText}
          onChange={(e) => {
            setLocalText(e.target.value);
            onUpdateText(field, e.target.value);
          }}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`w-full bg-black/70 ring-2 ring-amber-400 rounded px-1.5 py-0.5 text-white outline-none z-30 shadow-2xl ${className}`}
          placeholder={placeholder}
        />
      );
    }

    const isSelected = selectedBlockKey === field;

    return (
      <Tag
        onClick={(e) => {
          e.stopPropagation();
          if (isSelected) {
            // Second click on already selected element enters inline edit mode
            setIsEditing(true);
          } else {
            // First click selects this block, showing its move/delete toolbar
            setSelectedBlockKey(field);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={`group/editable cursor-pointer relative rounded px-0.5 -mx-0.5 transition-all ${
          isSelected ? 'ring-1 ring-amber-400/80 bg-amber-400/10' : ''
        } ${className}`}
        title={isSelected ? 'Кликните ещё раз для редактирования текста' : 'Нажмите для выбора блока'}
      >
        {value || <span className="opacity-40 italic">{placeholder || 'Нажмите для ввода...'}</span>}
        {isSelected && (
          <span className="ml-1 text-[9px] text-amber-300 font-mono inline-block">
            ✎
          </span>
        )}
      </Tag>
    );
  };

  // Check if a block is hidden
  const isBlockVisible = (key: string): boolean => {
    if (slide.hiddenBlocks && slide.hiddenBlocks.includes(key)) {
      return false;
    }
    return true;
  };

  // Interactive block wrapper that displays deletion, reordering and dynamic alignment guides
  const BlockWrapper: React.FC<{
    blockKey: string;
    label: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ blockKey, label, children, className = '' }) => {
    if (isThumbnail) {
      return <div className={className}>{children}</div>;
    }

    const hasActions = Boolean(onDeleteBlock || onMoveBlock || onReorderBlock);
    if (!hasActions) {
      return <div className={className}>{children}</div>;
    }

    const isSelected = selectedBlockKey === blockKey;
    const isBeingDragged = draggingBlockKey === blockKey;
    const isTarget = dragOverTargetKey === blockKey && draggingBlockKey !== blockKey;

    return (
      <div
        draggable={!isThumbnail}
        onDragStart={(e) => handleDragStart(e, blockKey)}
        onDragOver={(e) => handleBlockDragOver(e, blockKey)}
        onDragLeave={handleBlockDragLeave}
        onDrop={(e) => handleCardDrop(e)}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBlockKey(isSelected ? null : blockKey);
        }}
        className={`group/block relative transition-all duration-150 select-none ${
          isBeingDragged
            ? 'opacity-30 scale-[0.98] ring-2 ring-dashed ring-rose-400 rounded-lg cursor-grabbing'
            : isSelected
            ? 'ring-2 ring-amber-400/90 rounded-lg bg-amber-400/[0.05] z-30 cursor-grab'
            : 'rounded transition-all cursor-grab hover:ring-1 hover:ring-neutral-700/80'
        } ${className}`}
        title={isSelected ? 'Кликните вне блока, чтобы снять выбор' : `Потяните блок для выравнивания или нажмите для опций «${label}»`}
      >
        {/* Dynamic Snap Insertion Guide Line (appears between blocks when dragging) */}
        {isTarget && (
          <div
            className={`absolute inset-x-0 ${
              dragOverPosition === 'before' ? '-top-2' : '-bottom-2'
            } h-1 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,1)] z-50 animate-pulse flex items-center justify-center pointer-events-none`}
          >
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[7.5px] font-mono font-black shadow-lg uppercase tracking-wider flex items-center gap-1">
              <span>✦</span>
              <span>Выравнивание с «{label}»</span>
            </span>
          </div>
        )}

        {children}

        {/* Floating action toolbar: ONLY appears when THIS specific block is clicked */}
        {isSelected && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1 right-1 z-40 flex items-center gap-1 bg-neutral-900/95 border border-amber-400/80 rounded-lg px-1.5 py-0.5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Drag Handle Grip */}
            <span
              draggable={true}
              onDragStart={(e) => handleDragStart(e, blockKey)}
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 rounded cursor-grab active:cursor-grabbing transition-colors"
              title="Потяните блок для выравнивания по динамическим направляющим"
              aria-label="Перетащить блок"
            >
              <GripVertical className="w-3 h-3" />
            </span>

            {/* Block name pill */}
            <span className="text-[9px] font-mono text-amber-300 font-bold px-1.5 py-0.2 bg-amber-400/15 rounded mr-0.5">
              {label}
            </span>

            {/* Move Up */}
            {onMoveBlock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBlock(blockKey, 'up');
                }}
                className="p-1 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded transition-colors"
                title={`Переместить «${label}» выше`}
                aria-label="Вверх"
              >
                <svg className="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {/* Move Down */}
            {onMoveBlock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBlock(blockKey, 'down');
                }}
                className="p-1 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded transition-colors"
                title={`Переместить «${label}» ниже`}
                aria-label="Вниз"
              >
                <svg className="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Delete / Hide block */}
            {onDeleteBlock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBlockKey(null);
                  onDeleteBlock(blockKey);
                }}
                className="p-1 hover:bg-rose-900/80 text-rose-400 hover:text-white rounded transition-colors border-l border-neutral-700/80 pl-1.5 ml-0.5"
                title={`Скрыть блок «${label}»`}
                aria-label={`Скрыть блок ${label}`}
              >
                <svg className="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Close toolbar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockKey(null);
              }}
              className="p-0.5 text-neutral-400 hover:text-white rounded text-[10px] ml-0.5 font-mono"
              title="Готово (закрыть)"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  // Source & Fact-Check Evidence Badge resolver
  const getSourceBadgeMeta = (text?: string, type?: SlideItem['sourceType']) => {
    const raw = (text || '').toLowerCase();

    if (
      type === 'data' ||
      (!type &&
        (raw.includes('данны') ||
          raw.includes('статистик') ||
          raw.includes('метрик') ||
          raw.includes('benchmark') ||
          raw.includes('цифр')))
    ) {
      return {
        icon: '📊',
        label: 'ДАННЫЕ',
        darkBg: 'bg-cyan-950/70 border-cyan-700/80 text-cyan-300',
        lightBg: 'bg-cyan-100 border-cyan-300 text-cyan-900',
        accentColor: 'text-cyan-400',
      };
    }
    if (
      type === 'research' ||
      (!type &&
        (raw.includes('исследован') ||
          raw.includes('отчет') ||
          raw.includes('study') ||
          raw.includes('анализ') ||
          raw.includes('sparktoro') ||
          raw.includes('buffer')))
    ) {
      return {
        icon: '📚',
        label: 'ИССЛЕДОВАНИЕ',
        darkBg: 'bg-indigo-950/70 border-indigo-700/80 text-indigo-300',
        lightBg: 'bg-indigo-100 border-indigo-300 text-indigo-900',
        accentColor: 'text-indigo-400',
      };
    }
    if (
      type === 'expert' ||
      (!type &&
        (raw.includes('mosseri') ||
          raw.includes('head of') ||
          raw.includes('эксперт') ||
          raw.includes('интервью') ||
          raw.includes('автор')))
    ) {
      return {
        icon: '💬',
        label: 'ЭКСПЕРТ',
        darkBg: 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300',
        lightBg: 'bg-emerald-100 border-emerald-300 text-emerald-900',
        accentColor: 'text-emerald-400',
      };
    }
    if (
      type === 'factcheck' ||
      (!type &&
        (raw.includes('фактчек') ||
          raw.includes('стандарт') ||
          raw.includes('правило') ||
          raw.includes('редполитик') ||
          raw.includes('фильтр')))
    ) {
      return {
        icon: '🛡️',
        label: 'ФАКТЧЕК',
        darkBg: 'bg-rose-950/70 border-rose-700/80 text-rose-300',
        lightBg: 'bg-rose-100 border-rose-300 text-rose-900',
        accentColor: 'text-rose-400',
      };
    }
    return {
      icon: '🔗',
      label: 'ИСТОЧНИК',
      darkBg: 'bg-amber-950/70 border-amber-700/80 text-amber-300',
      lightBg: 'bg-amber-100 border-amber-300 text-amber-900',
      accentColor: 'text-amber-400',
    };
  };

  const renderFootnoteEvidence = (_isLight: boolean = false) => {
    return null;
  };

  // Check media presence and active states
  const hasVideo = Boolean(slide.videoUrl);
  const hasImage = Boolean(slide.imageUrl);
  const isMediaBlockVisible = isBlockVisible('image') || isBlockVisible('media');

  // Full-bleed background media flags
  const isBgVideoActive = hasVideo && (slide.imageDisplayMode === 'background' || !slide.imageDisplayMode) && isMediaBlockVisible;
  const isBgImageActive = !hasVideo && hasImage && slide.imageDisplayMode !== 'frame' && isMediaBlockVisible;
  const isBgMediaActive = isBgVideoActive || isBgImageActive;

  // Inline framed media block with customizable size, aspect ratio, crop alignment, and zoom
  const renderFramedMedia = () => {
    if ((!hasVideo && !hasImage) || slide.imageDisplayMode !== 'frame' || !isMediaBlockVisible) return null;

    const frame = slide.imageFrameSettings || {};
    const heightPx = frame.height ?? (isThumbnail ? 70 : 135);
    const aspect = frame.aspectRatio || 'auto';
    const focal = frame.focalPoint || 'center';
    const focalY = frame.focalY ?? (focal === 'top' ? 10 : focal === 'bottom' ? 90 : 50);
    const focalX = frame.focalX ?? 50;
    const zoom = frame.zoom ?? 100;
    const radius = frame.borderRadius || 'md';

    const radiusClass =
      radius === 'none'
        ? 'rounded-none'
        : radius === 'sm'
        ? 'rounded-md'
        : radius === 'lg'
        ? 'rounded-2xl'
        : radius === 'full'
        ? 'rounded-full'
        : 'rounded-xl';

    const aspectClass =
      aspect === '16:9'
        ? 'aspect-video'
        : aspect === '4:3'
        ? 'aspect-[4/3]'
        : aspect === '1:1'
        ? 'aspect-square'
        : aspect === '4:5'
        ? 'aspect-[4/5]'
        : '';

    return (
      <BlockWrapper blockKey="image" label={hasVideo ? "Видео" : "Визуал"}>
        {hasVideo ? (
          <div
            className={`relative w-full ${radiusClass} overflow-hidden border border-white/10 shadow-md shrink-0 bg-neutral-900/80 my-1 ${aspectClass}`}
            style={{
              height: aspect === 'auto' ? `${heightPx}px` : undefined,
              maxHeight: '340px',
            }}
          >
            <SlideVideoPlayer
              videoUrl={slide.videoUrl!}
              poster={slide.videoPoster}
              loop={slide.videoLoop !== false}
              defaultMuted={slide.videoMuted !== false}
              isBackground={false}
              isThumbnail={isThumbnail}
              focalPoint={focal}
              focalY={focalY}
              focalX={focalX}
              zoom={zoom}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div
            className={`relative w-full ${radiusClass} overflow-hidden border border-white/10 shadow-md shrink-0 bg-neutral-900/80 my-1 ${aspectClass}`}
            style={{
              height: aspect === 'auto' ? `${heightPx}px` : undefined,
              maxHeight: '340px',
            }}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover select-none transition-all duration-150"
              style={{
                objectPosition: `${focalX}% ${focalY}%`,
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: `${focalX}% ${focalY}%`,
              }}
              referrerPolicy="no-referrer"
            />
            {slide.imageSource === 'nano-banana' && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/75 backdrop-blur text-[7px] font-mono text-amber-300 border border-amber-400/30 pointer-events-none">
                🍌 Nano Banana
              </div>
            )}
          </div>
        )}
      </BlockWrapper>
    );
  };

  const isSmartAdaptive = effectiveStyleId === 'smart-adaptive';
  const autoMixPalette = AUTO_MIX_PALETTES.find((p) => p.id === autoMixPaletteId) || AUTO_MIX_PALETTES[0];

  // Helper to dynamically order blocks if slide.blockOrder is present
  const renderOrderedBlocks = (
    blocks: { key: string; render: () => React.ReactNode }[]
  ) => {
    if (!slide.blockOrder || slide.blockOrder.length === 0) {
      return blocks.map((b) => <React.Fragment key={b.key}>{b.render()}</React.Fragment>);
    }

    const sorted = [...blocks].sort((a, b) => {
      const idxA = slide.blockOrder!.indexOf(a.key);
      const idxB = slide.blockOrder!.indexOf(b.key);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sorted.map((b) => <React.Fragment key={b.key}>{b.render()}</React.Fragment>);
  };

  // Renders the unified brand identity with contextual smart widgets
  const renderSmartAdaptiveContent = () => {
    const archetype = resolveSmartWidgetArchetype(slide, totalSlides);
    const pClass = isThumbnail ? 'p-2' : 'p-3.5 sm:p-4';
    const kickerSize = isThumbnail ? 'text-[8px]' : 'text-[9px] sm:text-[10px]';
    const titleSize = isThumbnail
      ? 'text-[10px] leading-tight line-clamp-3'
      : 'text-xs sm:text-sm font-bold leading-snug';
    const bodySize = isThumbnail
      ? 'text-[8px] leading-tight line-clamp-3'
      : 'text-[10px] sm:text-[11px] leading-relaxed line-clamp-4 sm:line-clamp-5';
    const highlightSize = isThumbnail ? 'text-[8px] py-0.5 px-1' : 'text-[10px] sm:text-[11px] py-1 px-2';
    const footnoteSize = isThumbnail ? 'text-[7px]' : 'text-[8px] sm:text-[9px]';
    const statSize = isThumbnail ? 'text-lg' : 'text-2xl sm:text-3xl';

    return (
      <div
        className={`h-full flex flex-col justify-between ${pClass} relative z-10 overflow-hidden ${
          isBgMediaActive ? 'bg-transparent' : ''
        }`}
      >
        {/* Top Header Area (Only if custom kicker is provided, no cookie-cutter template line) */}
        {slide.kicker?.trim() && isBlockVisible('kicker') ? (
          <div className="flex items-center justify-between pb-1 shrink-0">
            <BlockWrapper blockKey="kicker" label="Кикер" className="truncate max-w-[85%]">
              <InlineEditableText
                value={slide.kicker}
                field="kicker"
                className={`${kickerSize} font-mono font-medium tracking-wider text-neutral-400 truncate block`}
                as="span"
              />
            </BlockWrapper>
          </div>
        ) : null}

        {/* Dynamic Contextual Widget Body Area */}
        <div className="my-auto space-y-2 overflow-hidden py-1">
          {/* ARCHETYPE 1: COVER HERO (Slide 1) */}
          {archetype === 'cover' && (
            <div className="space-y-2 text-left">
              {renderOrderedBlocks([
                {
                  key: 'roleName',
                  render: () =>
                    isBlockVisible('roleName') && slide.roleName ? (
                      <BlockWrapper blockKey="roleName" label="Бейдж роли" className="inline-block">
                        <InlineEditableText
                          value={slide.roleName}
                          field="roleName"
                          className={`inline-block px-2 py-0.5 rounded-full ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border text-[8px] sm:text-[9px] font-mono font-bold tracking-wider uppercase ${autoMixPalette.accentText}`}
                          as="span"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <InlineEditableText
                          value={slide.title}
                          field="title"
                          className={`${titleSize} font-extrabold uppercase tracking-tight ${autoMixPalette.textPrimary} font-brutal leading-tight`}
                          as="h2"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <InlineEditableText
                          value={slide.highlight}
                          field="highlight"
                          multiline={true}
                          className={`${highlightSize} ${autoMixPalette.widgetBg} ${autoMixPalette.accentBorder} border-l-2 rounded-r p-2 ${autoMixPalette.textSecondary} font-medium block`}
                          as="div"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <InlineEditableText
                          value={slide.body}
                          field="body"
                          multiline={true}
                          className={`${bodySize} ${autoMixPalette.textSecondary} font-sans whitespace-pre-line block`}
                          as="p"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'swipePrompt',
                  render: () =>
                    isBlockVisible('swipePrompt') ? (
                      <BlockWrapper blockKey="swipePrompt" label="Листать карусель" className="inline-block">
                        <div className="pt-0.5 flex items-center gap-1.5 text-[9px] font-mono font-bold">
                          <span className={autoMixPalette.accentText}>{slide.swipePrompt || 'Листать карусель →'}</span>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 2: AUDIO WAVEFORM MEMO (Slide 8 or voice memo) */}
          {archetype === 'audio-player' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'stats',
                  render: () =>
                    isBlockVisible('stats') ? (
                      <BlockWrapper blockKey="stats" label="Аудио плеер">
                        <div
                          className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-xl p-2 sm:p-2.5 space-y-1.5 shadow-sm`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border flex items-center justify-center shrink-0`}
                            >
                              <span className={`text-[8px] font-bold ${autoMixPalette.accentText}`}>▶</span>
                            </div>
                            {/* Soundwave bars */}
                            <div className="flex-1 flex items-center gap-0.5 h-4">
                              {[40, 75, 95, 30, 85, 100, 60, 45, 90, 85, 50, 80, 95, 35, 70, 85, 55, 35, 75, 50].map(
                                (h, i) => (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-full transition-all"
                                    style={{
                                      height: `${h}%`,
                                      backgroundColor:
                                        i < 8 ? autoMixPalette.accentHex : 'rgba(150, 150, 150, 0.35)',
                                    }}
                                  />
                                )
                              )}
                            </div>
                            <span className="text-[8px] font-mono text-neutral-400 shrink-0">0:43</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 px-0.5">
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${autoMixPalette.accentText} bg-current animate-pulse`}
                              />
                              <span>Голосовая мысль автора</span>
                            </span>
                            <span>1.0x</span>
                          </div>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <InlineEditableText
                          value={slide.title}
                          field="title"
                          className={`${titleSize} font-bold ${autoMixPalette.textPrimary} leading-snug`}
                          as="h2"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <InlineEditableText
                          value={slide.body}
                          field="body"
                          multiline={true}
                          className={`${bodySize} ${autoMixPalette.textSecondary} italic leading-relaxed whitespace-pre-line block`}
                          as="p"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <InlineEditableText
                          value={slide.highlight}
                          field="highlight"
                          multiline={true}
                          className={`${highlightSize} ${autoMixPalette.widgetBg} border-l-2 ${autoMixPalette.accentBorder} rounded-r p-1.5 text-neutral-200 font-medium block`}
                          as="div"
                        />
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 3: DIRECT CHAT DIALOGUE (Slide 4 or discussion) */}
          {archetype === 'direct-dialog' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'incoming-dialog',
                  render: () =>
                    (isBlockVisible('title') || isBlockVisible('body') || isBlockVisible('image')) ? (
                      <div
                        className={`max-w-[94%] ${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border p-2 sm:p-2.5 rounded-xl rounded-tl-xs shadow-sm space-y-1`}
                      >
                        <div className="flex items-center justify-between text-[8px] text-neutral-400 pb-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-4 h-4 rounded-full ${autoMixPalette.accentBg} flex items-center justify-center text-[7px] font-bold ${autoMixPalette.accentText}`}
                            >
                              💬
                            </div>
                            <InlineEditableText
                              value={slide.chatSenderTitle || 'Прямой диалог'}
                              field="chatSenderTitle"
                              className="font-medium text-neutral-300 inline-block text-[8px]"
                              as="span"
                              placeholder="Прямой диалог"
                            />
                          </div>
                          <span>15:40</span>
                        </div>

                        {renderOrderedBlocks([
                          {
                            key: 'title',
                            render: () =>
                              isBlockVisible('title') && slide.title ? (
                                <BlockWrapper blockKey="title" label="Заголовок">
                                  <InlineEditableText
                                    value={slide.title}
                                    field="title"
                                    className={`${titleSize} font-bold ${autoMixPalette.textPrimary}`}
                                    as="h2"
                                  />
                                </BlockWrapper>
                              ) : null,
                          },
                          {
                            key: 'image',
                            render: () => renderFramedMedia(),
                          },
                          {
                            key: 'body',
                            render: () =>
                              isBlockVisible('body') && slide.body ? (
                                <BlockWrapper blockKey="body" label="Основной текст">
                                  <InlineEditableText
                                    value={slide.body}
                                    field="body"
                                    multiline={true}
                                    className={`${bodySize} ${autoMixPalette.textSecondary} whitespace-pre-line block`}
                                    as="p"
                                  />
                                </BlockWrapper>
                              ) : null,
                          },
                        ])}
                      </div>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Ответ в Direct" className="ml-auto max-w-[85%]">
                        <div
                          className={`bg-neutral-800/95 border ${autoMixPalette.accentBorder} p-2 rounded-xl rounded-tr-xs shadow-sm space-y-0.5`}
                        >
                          <InlineEditableText
                            value={slide.highlight}
                            field="highlight"
                            multiline={true}
                            className="text-[9px] sm:text-[10px] font-semibold leading-snug text-neutral-100 block"
                            as="p"
                          />
                          <div
                            className={`flex items-center justify-end gap-1 text-[8px] ${autoMixPalette.accentText} pt-0.5`}
                          >
                            <span>15:42</span>
                            <span className="font-bold">✓✓</span>
                          </div>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 4: CHECKLIST & KEY RULES (Slide 2, 7) */}
          {archetype === 'checklist' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <h2 className={`${titleSize} font-bold ${autoMixPalette.textPrimary} tracking-tight`}>
                          {slide.title}
                        </h2>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Чеклист">
                        <div
                          className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-xl p-2 sm:p-2.5 space-y-1.5`}
                        >
                          {slide.body
                            .split('\n')
                            .filter(Boolean)
                            .map((line, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span
                                  className={`w-3.5 h-3.5 rounded-full ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border flex items-center justify-center shrink-0 mt-0.5 text-[8px] font-bold ${autoMixPalette.accentText}`}
                                >
                                  ✓
                                </span>
                                <p className={`${bodySize} ${autoMixPalette.textSecondary} leading-snug`}>
                                  {line}
                                </p>
                              </div>
                            ))}
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <div
                          className={`px-2 py-1 rounded-lg ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border text-[9px] sm:text-[10px] font-medium text-neutral-200 flex items-center gap-1.5`}
                        >
                          <span className={autoMixPalette.accentText}>★</span>
                          <span>{slide.highlight}</span>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 5: DATA METRIC (Slide 6 or data layout) */}
          {archetype === 'data-metric' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <h2 className={`${titleSize} font-bold ${autoMixPalette.textPrimary}`}>
                          {slide.title}
                        </h2>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'stats',
                  render: () =>
                    isBlockVisible('stats') && (slide.statNumber || slide.statLabel) ? (
                      <BlockWrapper blockKey="stats" label="Метрика / Цифра">
                        <div
                          className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-xl p-3 text-center space-y-1`}
                        >
                          <div
                            className={`${statSize} font-extrabold font-mono ${autoMixPalette.accentText} tracking-tight leading-none`}
                          >
                            {slide.statNumber || '74%'}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider font-mono text-neutral-400">
                            {slide.statLabel || 'ДОКАЗАТЕЛЬНАЯ БАЗА'}
                          </div>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <p
                          className={`${bodySize} ${autoMixPalette.textSecondary} whitespace-pre-line text-center sm:text-left`}
                        >
                          {slide.body}
                        </p>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <div className={`text-center text-[9px] font-mono ${autoMixPalette.accentText}`}>
                          «{slide.highlight}»
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 6: QUOTE THREAD (Slide 5) */}
          {archetype === 'quote-thread' && (
            <div className={`border-l-2 ${autoMixPalette.accentBorder} pl-2.5 space-y-2 py-0.5`}>
              <div className="flex items-center gap-1.5 text-[8px] font-mono text-neutral-400">
                <span className={`font-bold ${autoMixPalette.accentText}`}>@viral.carousel.os</span>
                <span>· тред</span>
                <span className={autoMixPalette.accentText}>☑</span>
              </div>

              {renderOrderedBlocks([
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <h2 className={`${titleSize} font-bold ${autoMixPalette.textPrimary}`}>
                          {slide.title}
                        </h2>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <p className={`${bodySize} ${autoMixPalette.textSecondary} whitespace-pre-line leading-relaxed`}>
                          {slide.body}
                        </p>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <div
                          className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-lg p-2 text-[9px] sm:text-[10px] text-neutral-200 font-medium`}
                        >
                          «{slide.highlight}»
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 7: MANIFESTO / STATEMENT (Slide 9) */}
          {archetype === 'manifesto' && (
            <div className="space-y-2 text-left">
              {renderOrderedBlocks([
                {
                  key: 'kicker',
                  render: () =>
                    isBlockVisible('kicker') ? (
                      <BlockWrapper blockKey="kicker" label="Кикер">
                        <span className={`text-[8px] font-mono uppercase tracking-wider ${autoMixPalette.accentText} font-bold`}>
                          // ГЛАВНЫЙ ВЫВОД КАРУСЕЛИ
                        </span>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <h2 className={`${titleSize} font-bold ${autoMixPalette.textPrimary} leading-snug`}>
                          {slide.title}
                        </h2>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <p className={`${bodySize} ${autoMixPalette.textSecondary} leading-relaxed whitespace-pre-line`}>
                          {slide.body}
                        </p>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <div
                          className={`${highlightSize} ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border rounded-lg text-neutral-100 font-semibold`}
                        >
                          ★ {slide.highlight}
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* ARCHETYPE 8: CTA FINALE (Slide 10) */}
          {archetype === 'cta-finale' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'roleName',
                  render: () =>
                    isBlockVisible('roleName') ? (
                      <BlockWrapper blockKey="roleName" label="Бейдж роли" className="inline-block">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full ${autoMixPalette.accentBg} ${autoMixPalette.accentBorder} border text-[8px] font-mono font-bold tracking-wider uppercase ${autoMixPalette.accentText}`}
                        >
                          РЕШЕНИЕ & ДЕЙСТВИЕ
                        </span>
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <InlineEditableText
                          value={slide.title}
                          field="title"
                          className={`${titleSize} font-extrabold uppercase ${autoMixPalette.textPrimary} font-brutal`}
                          as="h2"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <InlineEditableText
                          value={slide.body}
                          field="body"
                          multiline={true}
                          className={`${bodySize} ${autoMixPalette.textSecondary} whitespace-pre-line block`}
                          as="p"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') ? (
                      <BlockWrapper blockKey="highlight" label="Призыв к действию">
                        <div className="space-y-1.5 pt-1">
                          <div
                            className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-lg p-2 flex items-center justify-between text-[9px] text-neutral-200`}
                          >
                            <span>🔖 Сохраните в закладки</span>
                            <span className={`font-mono font-bold ${autoMixPalette.accentText}`}>СОХРАНИТЬ</span>
                          </div>
                          <div
                            className={`${autoMixPalette.widgetBg} ${autoMixPalette.widgetBorder} border rounded-lg p-2 flex items-center justify-between text-[9px] text-neutral-200`}
                          >
                            <span>↗ Отправьте в Direct коллеге</span>
                            <span className={`font-mono font-bold ${autoMixPalette.accentText}`}>ОТПРАВИТЬ</span>
                          </div>
                        </div>
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}

          {/* DEFAULT FALLBACK: HIGHLIGHT STATEMENT */}
          {archetype === 'highlight-statement' && (
            <div className="space-y-2">
              {renderOrderedBlocks([
                {
                  key: 'title',
                  render: () =>
                    isBlockVisible('title') && slide.title ? (
                      <BlockWrapper blockKey="title" label="Заголовок">
                        <InlineEditableText
                          value={slide.title}
                          field="title"
                          className={`${titleSize} font-bold ${autoMixPalette.textPrimary}`}
                          as="h2"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'image',
                  render: () => renderFramedMedia(),
                },
                {
                  key: 'highlight',
                  render: () =>
                    isBlockVisible('highlight') && slide.highlight ? (
                      <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                        <InlineEditableText
                          value={slide.highlight}
                          field="highlight"
                          multiline={true}
                          className={`${highlightSize} ${autoMixPalette.widgetBg} ${autoMixPalette.accentBorder} border-l-2 text-neutral-200 font-medium block p-1.5 rounded-r`}
                          as="div"
                        />
                      </BlockWrapper>
                    ) : null,
                },
                {
                  key: 'body',
                  render: () =>
                    isBlockVisible('body') && slide.body ? (
                      <BlockWrapper blockKey="body" label="Основной текст">
                        <InlineEditableText
                          value={slide.body}
                          field="body"
                          multiline={true}
                          className={`${bodySize} ${autoMixPalette.textSecondary} whitespace-pre-line block`}
                          as="p"
                        />
                      </BlockWrapper>
                    ) : null,
                },
              ])}
            </div>
          )}
        </div>

        {/* Clean Bottom Footer Bar (Slide Index + Swipe CTA) */}
        {isBlockVisible('swipePrompt') && (
          <div
            className={`pt-1.5 border-t ${
              !autoMixPalette.isLight ? 'border-neutral-800/70' : 'border-stone-300'
            } flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}
          >
            <span className="text-[8px] text-neutral-500 font-mono tracking-wider">
              {slide.slideNumber.toString().padStart(2, '0')}/{totalSlides.toString().padStart(2, '0')}
            </span>
            <BlockWrapper blockKey="swipePrompt" label="SWIPE">
              <span
                className={`${autoMixPalette.accentText} font-bold uppercase tracking-wider shrink-0 text-[9px]`}
              >
                {slide.slideNumber === totalSlides ? 'ФИНАЛ 🔖' : 'SWIPE →'}
              </span>
            </BlockWrapper>
          </div>
        )}
      </div>
    );
  };

  // Specific visual treatment per style with strict responsive containment
  const renderSlideContent = () => {
    // Sizing tokens based on preview vs thumbnail
    const pClass = isThumbnail ? 'p-2' : 'p-3.5 sm:p-4';
    const kickerSize = isThumbnail ? 'text-[8px]' : 'text-[9px] sm:text-[10px]';
    const titleSize = isThumbnail ? 'text-[10px] leading-tight line-clamp-3' : 'text-xs sm:text-sm font-bold leading-snug';
    const bodySize = isThumbnail ? 'text-[8px] leading-tight line-clamp-3' : 'text-[10px] sm:text-[11px] leading-relaxed line-clamp-4 sm:line-clamp-5';
    const highlightSize = isThumbnail ? 'text-[8px] py-0.5 px-1' : 'text-[10px] sm:text-[11px] py-1 px-2';
    const footnoteSize = isThumbnail ? 'text-[7px]' : 'text-[8px] sm:text-[9px]';
    const statSize = isThumbnail ? 'text-lg' : 'text-2xl sm:text-3xl';

    switch (effectiveStyleId) {
      case 'editorial-brutalism':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 overflow-hidden ${isBgMediaActive ? 'bg-transparent' : ''}`}>
            {/* Top Bar (Only if custom kicker provided) */}
            {slide.kicker?.trim() && isBlockVisible('kicker') ? (
              <div className="flex items-center justify-between pb-1 shrink-0">
                <BlockWrapper blockKey="kicker" label="Кикер" className="truncate max-w-[85%]">
                  <span className={`${kickerSize} font-mono tracking-widest text-neutral-400 uppercase font-medium truncate block`}>
                    {slide.kicker}
                  </span>
                </BlockWrapper>
              </div>
            ) : null}

            {/* Main Content Area */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              {isBlockVisible('title') && slide.title && (
                <BlockWrapper blockKey="title" label="Заголовок">
                  <h2 className={`${titleSize} font-extrabold text-neutral-100 font-brutal uppercase tracking-tight`}>
                    {slide.title}
                  </h2>
                </BlockWrapper>
              )}

              {renderFramedMedia()}

              {isBlockVisible('highlight') && slide.highlight && (
                <BlockWrapper blockKey="highlight" label="Акцентная мысль">
                  <div className={`${highlightSize} bg-red-950/40 border-l-2 border-red-500 text-red-200 font-medium`}>
                    {slide.highlight}
                  </div>
                </BlockWrapper>
              )}

              {isBlockVisible('body') && slide.body && (
                <BlockWrapper blockKey="body" label="Основной текст">
                  <p className={`${bodySize} text-neutral-300 font-sans whitespace-pre-line`}>
                    {slide.body}
                  </p>
                </BlockWrapper>
              )}

              {isBlockVisible('stats') && slide.statNumber && (
                <BlockWrapper blockKey="stats" label="Метрика / Цифра">
                  <div className="pt-1 border-t border-neutral-800">
                    <div className={`${statSize} font-extrabold font-mono text-red-500 tracking-tight leading-none`}>
                      {slide.statNumber}
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wider font-mono truncate">
                      {slide.statLabel}
                    </div>
                  </div>
                </BlockWrapper>
              )}

              {isBlockVisible('comparison') && slide.comparisonBefore && slide.comparisonAfter && !isThumbnail && (
                <BlockWrapper blockKey="comparison" label="Сравнение">
                  <div className="grid grid-cols-1 gap-1 pt-1 text-[10px]">
                    <div className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400">
                      <span className="text-[8px] text-red-400 uppercase font-mono block">Вчера</span>
                      <span className="line-clamp-1">{slide.comparisonBefore}</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 border border-red-900/60 text-neutral-200">
                      <span className="text-[8px] text-red-400 uppercase font-mono block">Сегодня</span>
                      <span className="line-clamp-1">{slide.comparisonAfter}</span>
                    </div>
                  </div>
                </BlockWrapper>
              )}
            </div>

            {/* Clean Footer Bar */}
            {isBlockVisible('swipePrompt') && (
              <div className={`pt-1.5 border-t border-neutral-800/80 flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
                <span className="text-neutral-500 text-[8px] uppercase">{slide.slideNumber}/{totalSlides}</span>
                <BlockWrapper blockKey="swipePrompt" label="SWIPE">
                  <span className="text-red-500 font-bold uppercase tracking-wider shrink-0 text-[9px]">SWIPE →</span>
                </BlockWrapper>
              </div>
            )}
          </div>
        );

      case 'independent-magazine':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 ${isBgMediaActive ? 'text-stone-100 bg-transparent' : 'text-stone-900'} overflow-hidden`}>
            {/* Top Bar (Only if custom kicker provided) */}
            {slide.kicker?.trim() ? (
              <div className="flex items-center justify-between pb-1 shrink-0">
                <span className={`${kickerSize} tracking-widest uppercase font-serif text-stone-500 font-medium truncate max-w-[85%]`}>
                  {slide.kicker}
                </span>
              </div>
            ) : null}

            {/* Main Content Area */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} font-normal font-editorial ${isBgMediaActive ? 'text-white' : 'text-stone-950'}`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`italic font-serif ${isBgMediaActive ? 'text-stone-200 border-amber-400' : 'text-stone-700 border-amber-800'} ${highlightSize} border-l pl-2`}>
                  «{slide.highlight}»
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} ${isBgMediaActive ? 'text-stone-200' : 'text-stone-700'} font-sans whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}

              {slide.statNumber && (
                <div className="py-1 flex items-baseline gap-2">
                  <span className={`${statSize} font-editorial ${isBgMediaActive ? 'text-amber-400' : 'text-amber-900'} font-bold leading-none`}>
                    {slide.statNumber}
                  </span>
                  <span className={`text-[9px] ${isBgMediaActive ? 'text-stone-300' : 'text-stone-600'} font-serif leading-tight truncate`}>
                    {slide.statLabel}
                  </span>
                </div>
              )}

              {slide.comparisonBefore && slide.comparisonAfter && !isThumbnail && (
                <div className="space-y-1 pt-1 text-[10px]">
                  <div className={`p-1 ${isBgMediaActive ? 'bg-black/40 border-white/10 text-stone-300' : 'bg-stone-200/50 border-stone-300 text-stone-600'} border truncate`}>
                    {slide.comparisonBefore}
                  </div>
                  <div className={`p-1 ${isBgMediaActive ? 'bg-white/10 border-amber-400/30 text-white' : 'bg-stone-100 border-amber-900/30 text-stone-900'} border font-medium truncate`}>
                    {slide.comparisonAfter}
                  </div>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t ${isBgMediaActive ? 'border-white/20 text-stone-400' : 'border-stone-300 text-stone-500'} flex items-center justify-between ${footnoteSize} font-serif shrink-0 gap-2`}>
              <span className="text-[8px] uppercase tracking-wider">{slide.slideNumber} / {totalSlides}</span>
              <span className="italic shrink-0 text-[9px]">Свайп ·</span>
            </div>
          </div>
        );

      case 'swiss-editorial':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 ${isBgMediaActive ? 'text-zinc-100 bg-transparent' : 'text-gray-900 bg-white'} overflow-hidden`}>
            {/* Top Bar (Only if custom kicker provided) */}
            {slide.kicker?.trim() ? (
              <div className="flex items-center justify-between pb-1 text-[9px] font-mono shrink-0">
                <span className="font-medium text-neutral-400 uppercase tracking-wider truncate">{slide.kicker}</span>
              </div>
            ) : null}

            {/* Main Content Area */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} tracking-tight ${isBgMediaActive ? 'text-white' : 'text-gray-950'} font-sans`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`${highlightSize} ${isBgMediaActive ? 'bg-blue-950/60 border-blue-400 text-blue-200' : 'bg-blue-50/80 border-blue-200 text-blue-900'} border font-medium`}>
                  {slide.highlight}
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} ${isBgMediaActive ? 'text-zinc-200' : 'text-gray-700'} font-sans whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}

              {slide.statNumber && (
                <div className={`p-1.5 ${isBgMediaActive ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded`}>
                  <div className={`${statSize} font-bold font-mono text-blue-500 tracking-tight leading-none`}>
                    {slide.statNumber}
                  </div>
                  <div className={`text-[9px] ${isBgMediaActive ? 'text-zinc-400' : 'text-gray-600'} font-mono mt-0.5 truncate`}>
                    {slide.statLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t ${isBgMediaActive ? 'border-white/20 text-zinc-400' : 'border-gray-200 text-gray-500'} flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className="text-[8px] text-zinc-500 uppercase">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-blue-500 font-semibold shrink-0 text-[9px]">SWIPE ➔</span>
            </div>
          </div>
        );

      case 'dark-editorial':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-zinc-100 ${isBgMediaActive ? 'bg-transparent' : 'bg-[#0a0a0c]'} overflow-hidden`}>
            {/* Top Bar (Only if custom kicker provided) */}
            {slide.kicker?.trim() ? (
              <div className="flex items-center justify-between pb-1 shrink-0">
                <span className={`${kickerSize} tracking-widest uppercase font-mono text-zinc-500 font-medium truncate max-w-[85%]`}>
                  {slide.kicker}
                </span>
              </div>
            ) : null}

            {/* Main Content Area */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} font-medium font-editorial text-zinc-100`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`${highlightSize} text-zinc-300 font-sans border-l-2 border-zinc-500 pl-2`}>
                  {slide.highlight}
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} text-zinc-400 font-sans whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}

              {slide.statNumber && (
                <div className="pt-1">
                  <div className={`${statSize} font-editorial text-zinc-200 font-normal leading-none`}>
                    {slide.statNumber}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-sans mt-0.5 tracking-wide truncate">
                    {slide.statLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t border-zinc-900 flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className="text-zinc-600 text-[8px]">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-zinc-400 shrink-0 text-[9px]">Свайп →</span>
            </div>
          </div>
        );

      case 'archival-collage':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 ${isBgMediaActive ? 'text-stone-100 bg-transparent' : 'text-stone-900 bg-[#eae4d9]'} overflow-hidden`}>
            {/* Vintage Header */}
            <div className={`flex items-center justify-between border-b ${isBgMediaActive ? 'border-white/20' : 'border-stone-400'} pb-1.5 shrink-0`}>
              <span className={`${kickerSize} font-mono tracking-widest ${isBgMediaActive ? 'text-rose-400 border-rose-400' : 'text-rose-900 border-rose-900'} uppercase font-bold border px-1 py-0.2 truncate`}>
                АРХИВ № {slide.slideNumber}
              </span>
              <span className={`${kickerSize} font-mono ${isBgMediaActive ? 'text-stone-400' : 'text-stone-600'} shrink-0`}>
                2026-X
              </span>
            </div>

            {/* Content with Vintage Vibe */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} font-normal font-curatorial ${isBgMediaActive ? 'text-white' : 'text-stone-950'}`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`${highlightSize} ${isBgMediaActive ? 'bg-black/50 border-rose-400 text-stone-200' : 'bg-stone-300/60 border-rose-900 text-stone-800'} border-l-2 font-mono`}>
                  {slide.highlight}
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} ${isBgMediaActive ? 'text-stone-200' : 'text-stone-800'} font-mono whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}

              {slide.statNumber && (
                <div className={`p-1 ${isBgMediaActive ? 'bg-black/50 border-white/20' : 'bg-stone-300/40 border-stone-500'} border border-dashed rounded`}>
                  <div className={`${statSize} font-bold font-mono ${isBgMediaActive ? 'text-rose-400' : 'text-rose-900'} leading-none`}>
                    {slide.statNumber}
                  </div>
                  <div className={`text-[9px] ${isBgMediaActive ? 'text-stone-300' : 'text-stone-700'} font-mono truncate`}>
                    {slide.statLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t ${isBgMediaActive ? 'border-white/20 text-stone-400' : 'border-stone-400 text-stone-600'} flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className="text-[8px] font-mono text-stone-500">{slide.slideNumber}/{totalSlides}</span>
              <span className={`uppercase ${isBgMediaActive ? 'text-rose-400' : 'text-rose-900'} font-bold shrink-0 text-[9px]`}>Дальше ▷</span>
            </div>
          </div>
        );

      case 'native-internet':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-neutral-100 ${isBgMediaActive ? 'bg-transparent' : 'bg-[#18181b]'} overflow-hidden`}>
            {/* Social Top */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="text-[10px] font-medium text-neutral-300 truncate">@viral.carousel.os</span>
              </div>
              <span className={`${kickerSize} font-mono text-neutral-500 shrink-0`}>
                {slide.slideNumber}/{totalSlides}
              </span>
            </div>

            {/* Native Notes */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <span className="text-[9px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded-sm inline-block">
                {slide.kicker || 'ЗАМЕТКА'}
              </span>

              <h2 className={`${titleSize} font-bold font-sans text-neutral-50`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`${highlightSize} bg-neutral-900/90 rounded border border-neutral-800 text-emerald-300 font-mono`}>
                  {slide.highlight}
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} text-neutral-300 font-sans whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t border-neutral-800 flex items-center justify-between ${footnoteSize} shrink-0 gap-2`}>
              <span className="text-[8px] text-neutral-500 font-mono">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-emerald-400 font-mono shrink-0 text-[9px]">swipe ➔</span>
            </div>
          </div>
        );

      case 'ios-notes':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-neutral-100 ${isBgMediaActive ? 'bg-transparent' : 'bg-[#1c1c1e]'} overflow-hidden font-sans`}>
            {/* iOS Notes Navigation Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-[10px] shrink-0">
              <div className="flex items-center gap-0.5 text-amber-400 font-medium">
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Заметки</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400 font-mono text-[9px]">
                <span>{slide.slideNumber}/{totalSlides}</span>
                <span className="text-amber-400 font-medium">Готово</span>
              </div>
            </div>

            {/* Date stamp */}
            <div className="text-[8px] text-neutral-500 text-center py-0.5 font-mono">
              {slide.kicker || 'Сегодня, 19:42'}
            </div>

            {/* Main Note content */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <div className="flex items-baseline gap-1">
                <h2 className={`${titleSize} font-bold text-neutral-50 leading-snug tracking-tight`}>
                  {slide.title}
                </h2>
                <span className="w-0.5 h-3.5 bg-amber-400 animate-pulse shrink-0 rounded-full inline-block"></span>
              </div>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`${highlightSize} bg-amber-400/20 text-amber-200 border-l-2 border-amber-400 rounded-r py-1 px-2 font-medium`}>
                  {slide.highlight}
                </div>
              )}

              {slide.body && (
                <div className="space-y-1">
                  {slide.body.split('\n').map((line, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-amber-400/70 shrink-0 mt-0.5 flex items-center justify-center">
                        {lIdx === 0 && <span className="w-1 h-1 rounded-full bg-amber-400"></span>}
                      </span>
                      <p className={`${bodySize} text-neutral-300`}>{line}</p>
                    </div>
                  ))}
                </div>
              )}

              {slide.statNumber && (
                <div className="p-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center gap-2">
                  <span className={`${statSize} font-bold text-amber-400 font-mono leading-none`}>
                    {slide.statNumber}
                  </span>
                  <span className="text-[9px] text-neutral-400 truncate">{slide.statLabel}</span>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1 border-t border-neutral-800/80 flex items-center justify-between ${footnoteSize} shrink-0 gap-2`}>
              <span className="text-[8px] text-neutral-500 font-mono">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-amber-400 font-medium shrink-0 text-[9px]">Свайп →</span>
            </div>
          </div>
        );

      case 'telegram-chat':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-slate-100 ${isBgMediaActive ? 'bg-transparent' : 'bg-[#0f172a]'} overflow-hidden font-sans`}>
            {/* Telegram Chat Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                  АС
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] font-semibold text-white flex items-center gap-1">
                    <InlineEditableText
                      value={slide.chatSenderTitle || 'Александр // SMM'}
                      field="chatSenderTitle"
                      className="text-[10px] font-semibold text-white inline-block"
                      as="span"
                      placeholder="Имя контакта"
                    />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-[8px] text-slate-400">был(а) только что</div>
                </div>
              </div>
              <span className={`${kickerSize} font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded`}>
                {slide.slideNumber}/{totalSlides}
              </span>
            </div>

            {/* Dialogue area with authentic bubbles */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              {/* Incoming message bubble */}
              <div className="max-w-[92%] bg-[#1e293b]/90 text-slate-100 p-2 sm:p-2.5 rounded-xl rounded-tl-xs border border-slate-700/60 shadow-sm space-y-1 relative">
                {/* Reply Quote bar */}
                <div className="pl-1.5 border-l-2 border-sky-400 text-[8px] sm:text-[9px] bg-slate-900/60 p-1 rounded-r">
                  <span className="text-sky-400 font-bold block">{slide.kicker || 'Входящий инсайт'}</span>
                  <span className="text-slate-400 truncate block">«Как это работает на самом деле»</span>
                </div>

                <h2 className={`${titleSize} font-bold text-white pt-0.5`}>
                  {slide.title}
                </h2>

                {renderFramedMedia()}

                <p className={`${bodySize} text-slate-300 whitespace-pre-line`}>
                  {slide.body}
                </p>

                <div className="flex items-center justify-end gap-1 text-[8px] text-slate-400 pt-0.5">
                  <span>15:42</span>
                </div>
              </div>

              {/* Highlight / Outgoing message response */}
              {slide.highlight && (
                <div className="ml-auto max-w-[85%] bg-sky-600 text-white p-2 rounded-xl rounded-tr-xs shadow-sm space-y-0.5">
                  <p className="text-[9px] sm:text-[10px] font-semibold leading-snug">{slide.highlight}</p>
                  <div className="flex items-center justify-end gap-1 text-[8px] text-sky-200">
                    <span>15:43</span>
                    <span className="text-sky-200 font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1 border-t border-slate-800/80 flex items-center justify-between ${footnoteSize} shrink-0 gap-2`}>
              <span className="text-[8px] text-slate-500 font-mono">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-sky-400 font-semibold shrink-0 text-[9px]">Переслать →</span>
            </div>
          </div>
        );

      case 'twitter-x-thread':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-neutral-100 ${isBgImageActive ? 'bg-transparent' : 'bg-[#000000]'} overflow-hidden font-sans`}>
            {/* Twitter Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-850 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[9px] font-bold text-neutral-200">
                  X
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-white truncate max-w-[90px]">Viral OS</span>
                  <span className="text-sky-400 text-[10px]">☑</span>
                  <span className="text-[9px] text-neutral-500 font-mono">@viral_os · 2ч</span>
                </div>
              </div>
              <span className={`${kickerSize} font-mono text-neutral-500`}>
                {slide.slideNumber}/{totalSlides}
              </span>
            </div>

            {/* Post body with vertical thread line */}
            <div className="my-auto pl-2.5 border-l-2 border-neutral-800 ml-1 space-y-2 overflow-hidden py-1">
              <span className="text-[8px] font-mono text-sky-400 uppercase tracking-wide">
                {slide.kicker || '🧵 ТРЕД / 10'}
              </span>

              <h2 className={`${titleSize} font-bold text-white leading-snug`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.body && (
                <p className={`${bodySize} text-neutral-300 whitespace-pre-line leading-relaxed`}>
                  {slide.body}
                </p>
              )}

              {slide.highlight && (
                <div className="p-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-200 text-[9px] sm:text-[10px]">
                  <span className="text-sky-400 font-mono block text-[8px] uppercase">Цитата:</span>
                  «{slide.highlight}»
                </div>
              )}
            </div>

            {/* Twitter Interaction Stats */}
            <div className="pt-1.5 border-t border-neutral-850 flex items-center justify-between text-[9px] text-neutral-400 font-mono shrink-0">
              <span className="hover:text-sky-400 flex items-center gap-1">💬 428</span>
              <span className="hover:text-emerald-400 flex items-center gap-1">🔁 1.8K</span>
              <span className="hover:text-rose-400 flex items-center gap-1 text-rose-400">❤️ 14.2K</span>
              <span className="hover:text-amber-400 flex items-center gap-1 text-amber-400">🔖 5.1K</span>
            </div>
          </div>
        );

      case 'moleskine-journal':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 ${isBgMediaActive ? 'text-stone-100 bg-transparent' : 'text-stone-900 bg-[#f6f2e9]'} overflow-hidden font-sans`}>
            {/* Washi tape visual on top right */}
            <div className="absolute top-1 right-3 w-12 h-3.5 bg-amber-200/80 border border-amber-300/60 rotate-2 rounded-xs shadow-xs pointer-events-none z-20"></div>

            {/* Journal Header */}
            <div className={`flex items-center justify-between border-b ${isBgImageActive ? 'border-white/20 text-stone-300' : 'border-stone-300 text-stone-700'} pb-1.5 shrink-0`}>
              <span className={`${kickerSize} font-mono tracking-wider uppercase ${isBgImageActive ? 'text-amber-400' : 'text-amber-900'} font-bold`}>
                {slide.kicker || 'ДНЕВНИК'} · СТР. {slide.slideNumber}
              </span>
              <span className={`${kickerSize} font-mono ${isBgImageActive ? 'text-stone-400' : 'text-stone-500'}`}>
                2026 / ОС
              </span>
            </div>

            {/* Ruled Paper / Note lines content */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} font-editorial ${isBgImageActive ? 'text-white' : 'text-stone-950'} font-normal leading-snug`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`inline-block ${isBgImageActive ? 'bg-amber-400/30 text-amber-200' : 'bg-yellow-200/70 text-stone-900'} px-2 py-0.5 rounded-xs font-serif text-[10px] italic shadow-xs`}>
                  ★ {slide.highlight}
                </div>
              )}

              {slide.body && (
                <p className={`${bodySize} ${isBgImageActive ? 'text-stone-200 border-white/20' : 'text-stone-800 border-stone-300'} font-sans leading-relaxed whitespace-pre-line border-l pl-2`}>
                  {slide.body}
                </p>
              )}

              {slide.statNumber && (
                <div className={`p-1.5 ${isBgImageActive ? 'bg-black/50 border-white/20' : 'bg-stone-200/60 border-stone-400/60'} border rounded`}>
                  <span className={`${statSize} font-bold font-mono ${isBgImageActive ? 'text-amber-400' : 'text-amber-900'} leading-none`}>
                    {slide.statNumber}
                  </span>
                  <span className={`text-[9px] ${isBgImageActive ? 'text-stone-300' : 'text-stone-700'} font-serif block mt-0.5 truncate`}>{slide.statLabel}</span>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1 border-t ${isBgImageActive ? 'border-white/20 text-stone-400' : 'border-stone-300 text-stone-600'} flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className={`text-[8px] font-serif ${isBgImageActive ? 'text-stone-400' : 'text-stone-500'}`}>{slide.slideNumber}/{totalSlides}</span>
              <span className={`italic ${isBgImageActive ? 'text-amber-400' : 'text-amber-900'} font-serif shrink-0 text-[9px]`}>Листать →</span>
            </div>
          </div>
        );

      case 'voice-memo':
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-neutral-100 ${isBgMediaActive ? 'bg-transparent' : 'bg-[#121316]'} overflow-hidden font-sans`}>
            {/* Studio Header with Recording Dot */}
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className={`${kickerSize} font-mono font-bold uppercase text-neutral-300 tracking-wider`}>
                  {slide.kicker || 'ГОЛОСОВАЯ ЗАПИСЬ'}
                </span>
              </div>
              <span className={`${kickerSize} font-mono text-neutral-500`}>
                {slide.slideNumber}/{totalSlides}
              </span>
            </div>

            {/* Audio Waveform Player Bar */}
            <div className="p-1.5 sm:p-2 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold">▶</span>
                </div>
                {/* Waveform bars */}
                <div className="flex-1 flex items-center gap-0.5 h-4">
                  {[40, 70, 95, 30, 80, 100, 60, 40, 85, 90, 50, 75, 95, 35, 65, 80, 55, 30, 70, 45].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${i < 8 ? 'bg-rose-500' : 'bg-neutral-700'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <span className="text-[8px] font-mono text-neutral-400 shrink-0">0:43</span>
              </div>
            </div>

            {/* Spoken Word Transcription */}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <span className="text-[8px] font-mono text-rose-400 uppercase tracking-wider block">
                Расшифровка аудио:
              </span>

              <h2 className={`${titleSize} font-bold text-white leading-snug`}>
                «{slide.title}»
              </h2>

              {renderFramedMedia()}

              {slide.body && (
                <p className={`${bodySize} text-neutral-300 whitespace-pre-line leading-relaxed italic`}>
                  {slide.body}
                </p>
              )}

              {slide.highlight && (
                <div className={`${highlightSize} bg-rose-950/40 border-l-2 border-rose-500 text-rose-200 font-medium`}>
                  {slide.highlight}
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className={`pt-1 border-t border-neutral-800/80 flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className="text-[8px] text-neutral-500 font-mono">{slide.slideNumber}/{totalSlides}</span>
              <span className="text-rose-400 font-medium shrink-0 text-[9px]">Слушать →</span>
            </div>
          </div>
        );

      default:
        // Fallback / Documentary / Contemporary Art
        return (
          <div className={`h-full flex flex-col justify-between ${pClass} relative z-10 text-neutral-100 ${isBgMediaActive ? 'bg-transparent' : ''} overflow-hidden`}>
            {slide.kicker?.trim() ? (
              <div className="flex items-center justify-between pb-1 text-[9px] font-mono text-neutral-400 shrink-0">
                <span className="truncate max-w-[85%]">{slide.kicker}</span>
              </div>
            ) : null}
            <div className="my-auto space-y-2 overflow-hidden py-1">
              <h2 className={`${titleSize} font-bold font-sans`}>
                {slide.title}
              </h2>

              {renderFramedMedia()}

              {slide.highlight && (
                <div className={`text-amber-400 ${highlightSize} font-medium border-l-2 border-amber-400 pl-2`}>
                  {slide.highlight}
                </div>
              )}
              {slide.body && (
                <p className={`${bodySize} text-neutral-300 whitespace-pre-line`}>
                  {slide.body}
                </p>
              )}
            </div>
            {/* Clean Footer Bar */}
            <div className={`pt-1.5 border-t border-neutral-800 flex items-center justify-between ${footnoteSize} font-mono shrink-0 gap-2`}>
              <span className="text-neutral-500 text-[8px] font-mono">{slide.slideNumber}/{totalSlides}</span>
              <span className="shrink-0 text-[9px]">Свайп →</span>
            </div>
          </div>
        );
    }
  };

  const outerBgClass = isBgMediaActive
    ? 'bg-neutral-950'
    : isSmartAdaptive
    ? autoMixPalette.bgClass
    : currentStyle.bgClass;

  const outerBorderStyle = isSmartAdaptive
    ? autoMixPalette.isLight
      ? 'border border-stone-300 shadow-xl'
      : 'border border-neutral-800/80 shadow-2xl'
    : currentStyle.borderStyle;

  return (
    <div
      id={domId}
      onClick={() => setSelectedBlockKey(null)}
      onDragOver={handleCardDragOver}
      onDragLeave={handleCardDragLeave}
      onDrop={handleCardDrop}
      className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xl transition-all duration-300 select-none ${outerBgClass} ${outerBorderStyle} ${className}`}
    >
      {/* Background Video Layer (when active) */}
      {isBgVideoActive && slide.videoUrl && (
        <SlideVideoPlayer
          videoUrl={slide.videoUrl}
          poster={slide.videoPoster}
          loop={slide.videoLoop !== false}
          defaultMuted={slide.videoMuted !== false}
          isBackground={true}
          isThumbnail={isThumbnail}
          focalPoint={slide.imageFrameSettings?.focalPoint}
          focalY={slide.imageFrameSettings?.focalY}
          focalX={slide.imageFrameSettings?.focalX}
          zoom={slide.imageFrameSettings?.zoom}
          overlayDarkness={slide.imageOverlayDarkness ?? 60}
        />
      )}

      {/* Background Image Layer (when active) */}
      {isBgImageActive && slide.imageUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src={slide.imageUrl}
            alt=""
            className="w-full h-full object-cover select-none transition-all duration-150"
            style={{
              objectPosition: `${slide.imageFrameSettings?.focalX ?? 50}% ${slide.imageFrameSettings?.focalY ?? (slide.imageFrameSettings?.focalPoint === 'top' ? 10 : slide.imageFrameSettings?.focalPoint === 'bottom' ? 90 : 50)}%`,
            }}
            referrerPolicy="no-referrer"
          />
          {/* Dynamic Contrast Protection Gradient Overlay */}
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${(slide.imageOverlayDarkness ?? 60) / 100})`,
              backgroundImage:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.78) 100%)',
            }}
          />
          {/* Source pill */}
          {slide.imageSource === 'nano-banana' && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[7px] font-mono text-amber-300 border border-amber-400/30 z-10">
              🍌 Nano Banana
            </div>
          )}
          {slide.imageSource === 'preset' && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[7px] font-mono text-cyan-300 border border-cyan-400/30 z-10">
              📸 Медиатека
            </div>
          )}
        </div>
      )}

      {/* Visual content - Unified brand identity with contextual smart widgets or legacy mono-style */}
      {isSmartAdaptive ? renderSmartAdaptiveContent() : renderSlideContent()}

      {/* Subtle paper / film grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay z-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* ========================================================
          DYNAMIC SMART ALIGNMENT GUIDES OVERLAY (Canva Snap Guides)
         ======================================================== */}
      {draggingBlockKey && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none animate-in fade-in duration-100">
          {/* Subtle magnetic alignment grid background watermark */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(244,63,94,0.5) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* 1. Vertical Center Axis Line (X = 50%) */}
          {pointerGuideCoords?.isNearVCenter && (
            <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-75">
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-mono font-bold shadow-lg flex items-center gap-1 border border-white/30">
                <span>⇋</span>
                <span>ЦЕНТР X · 50%</span>
              </div>
            </div>
          )}

          {/* 2. Horizontal Center Axis Line (Y = 50%) */}
          {pointerGuideCoords?.isNearHCenter && (
            <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-75">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]" />
              <div className="absolute top-1/2 right-2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-mono font-bold shadow-lg flex items-center gap-1 border border-white/30">
                <span>⇅</span>
                <span>ЦЕНТР Y · 50%</span>
              </div>
            </div>
          )}

          {/* 3. Left Margin Guide Line (X = 10%) */}
          {pointerGuideCoords?.isNearLeftMargin && (
            <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-75">
              <div className="absolute top-0 bottom-0 left-[10%] w-[1.5px] border-l-2 border-dashed border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              <div className="absolute top-3 left-[10%] -translate-x-1/2 px-1.5 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 text-[7.5px] font-mono font-bold shadow-md">
                <span>⇤ КРАЙ (10%)</span>
              </div>
            </div>
          )}

          {/* 4. Right Margin Guide Line (X = 90%) */}
          {pointerGuideCoords?.isNearRightMargin && (
            <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-75">
              <div className="absolute top-0 bottom-0 right-[10%] w-[1.5px] border-r-2 border-dashed border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              <div className="absolute top-3 right-[10%] translate-x-1/2 px-1.5 py-0.5 rounded bg-cyan-950/95 border border-cyan-400 text-cyan-300 text-[7.5px] font-mono font-bold shadow-md">
                <span>(90%) КРАЙ ⇥</span>
              </div>
            </div>
          )}

          {/* 5. Live Coordinates & Magnet Alignment HUD */}
          {pointerGuideCoords && (
            <div className="absolute bottom-2 left-2 z-50 flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-950/95 border border-neutral-700/80 backdrop-blur shadow-2xl text-[8px] font-mono text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>X: <strong className="text-white">{pointerGuideCoords.xPercent}%</strong></span>
              <span className="text-neutral-500">·</span>
              <span>Y: <strong className="text-white">{pointerGuideCoords.yPercent}%</strong></span>
              {(pointerGuideCoords.isNearVCenter || pointerGuideCoords.isNearHCenter) && (
                <span className="px-1 py-0.2 rounded bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50">
                  МАГНИТ ✓
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instagram Safe Zone Overlays (Toggleable) */}
      {showSafeZones && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Top UI Overlay: Profile bar, audio, back button (14% height) */}
          <div className="absolute top-0 inset-x-0 h-[14%] bg-rose-500/20 border-b border-dashed border-rose-500/70 flex items-center justify-center">
            <span className="text-[9px] font-mono text-rose-300 bg-neutral-950/80 px-1.5 py-0.2 rounded uppercase">
              Верхняя зона UI
            </span>
          </div>

          {/* Bottom UI Overlay: Action icons, caption preview, dots (16% height) */}
          <div className="absolute bottom-0 inset-x-0 h-[16%] bg-rose-500/20 border-t border-dashed border-rose-500/70 flex items-center justify-center">
            <span className="text-[9px] font-mono text-rose-300 bg-neutral-950/80 px-1.5 py-0.2 rounded uppercase">
              Нижняя зона UI
            </span>
          </div>

          {/* Right Action Margin */}
          <div className="absolute top-[14%] bottom-[16%] right-0 w-[10%] bg-amber-500/10 border-l border-dashed border-amber-500/50 flex items-center justify-center">
            <span className="text-[8px] font-mono text-amber-300 rotate-90 whitespace-nowrap">
              Боковая
            </span>
          </div>

          {/* Safe readable zone marker */}
          <div className="absolute top-[14%] bottom-[16%] left-0 right-[10%] border border-emerald-500/40 flex items-start justify-end p-1.5">
            <span className="text-[8px] font-mono text-emerald-400 bg-neutral-950/80 px-1 py-0.2 rounded">
              Зона чтения ✓
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
