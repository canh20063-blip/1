import React from 'react';
import {
  Edit3,
  Palette,
  Lightbulb,
  FileText,
  X,
  ShieldCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';

export type WorkspaceSection = 'styles' | 'hooks' | 'caption';

interface SectionItem {
  id: WorkspaceSection;
  label: string;
  badge?: string;
  icon: React.ElementType;
}

const SECTIONS: SectionItem[] = [
  { id: 'styles', label: 'Стили & Автомикс', badge: '👑 ТОП', icon: Palette },
  { id: 'hooks', label: 'Хуки заголовка (M2)', badge: '5', icon: Lightbulb },
  { id: 'caption', label: 'Подпись & CTA', icon: FileText },
];

interface SectionTabBarProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  activeSlideNumber: number;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
  onOpenAnalysis: () => void;
  qualityScore: number;
  onNewProject?: () => void;
}

export const SectionTabBar: React.FC<SectionTabBarProps> = ({
  activeSection,
  onSelectSection,
  activeSlideNumber,
  isEditorOpen,
  onToggleEditor,
  onOpenAnalysis,
  qualityScore,
  onNewProject,
}) => {
  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 flex items-center justify-between gap-1.5 select-none overflow-x-auto">
      {/* Left side: Post Editing Controls ONLY */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1. Dedicated Toggle Button for Slide Editor */}
        <button
          onClick={onToggleEditor}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap shrink-0 border ${
            isEditorOpen
              ? 'bg-rose-950/90 text-rose-200 border-rose-700 font-bold shadow-sm ring-1 ring-rose-500'
              : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border-neutral-700 font-medium'
          }`}
          title={isEditorOpen ? 'Закрыть редактор слайда' : 'Открыть редактор слайда'}
        >
          {isEditorOpen ? (
            <>
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>✕ Закрыть редактор (#{activeSlideNumber})</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-rose-400" />
              <span>✏️ Редактор слайда #{activeSlideNumber}</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-neutral-800 shrink-0 mx-0.5" />

        {/* 2. Direct Editorial Tools (Styles, Hooks, Caption) */}
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = !isEditorOpen && activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => {
                onSelectSection(sec.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 border ${
                isActive
                  ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm font-semibold ring-1 ring-neutral-500'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border-neutral-800/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-neutral-500'}`} />
              <span>{sec.label}</span>
              {sec.badge && (
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                  }`}
                >
                  {sec.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right side: New Project Button & Editorial Analysis */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {onNewProject && (
          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500 shadow-sm transition-all whitespace-nowrap active:scale-95"
            title="Создать новую карусель (Новый проект)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Новый проект</span>
            <span className="sm:hidden">+ Проект</span>
          </button>
        )}

        <button
          onClick={onOpenAnalysis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-all whitespace-nowrap shadow-sm group"
          title="Открыть скрытые блоки анализа: Quality Gate, фактчекинг, дуга вирусности и прогноз метрик"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Анализ & аудит</span>
          <span className="sm:hidden">Аудит</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-emerald-300 tabular-nums">
            {qualityScore}/100
          </span>
          <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
