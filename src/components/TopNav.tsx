import React from 'react';
import {
  Download,
  PlusCircle,
  Layout,
  LayoutGrid,
  BookOpen,
  ShieldCheck,
  Undo2,
  Redo2,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';

export type MainScreen = 'studio' | 'create' | 'grid';

interface TopNavProps {
  currentScreen: MainScreen;
  onSelectScreen: (screen: MainScreen) => void;
  onOpenExport: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenAnalysis: () => void;
  qualityScore: number;
  projectTopic: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenProjects: () => void;
  projectsCount: number;
  autosaveStatus: {
    isSaving: boolean;
    lastSavedTime: string | null;
  };
}

export const TopNav: React.FC<TopNavProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenExport,
  onOpenKnowledgeBase,
  onOpenAnalysis,
  qualityScore,
  projectTopic,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenProjects,
  projectsCount,
  autosaveStatus,
}) => {
  return (
    <header className="flex items-center justify-between gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur shrink-0 z-40 select-none w-full min-w-0">
      {/* Zone 1: Wordmark & Undo/Redo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectScreen('studio');
          }}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold tracking-tight text-white font-brutal uppercase hover:text-neutral-200 transition-colors"
          title="Viral Carousel OS"
        >
          <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px] font-black font-mono shadow-sm">
            V
          </span>
          <span className="hidden sm:inline font-bold">VIRAL OS</span>
        </a>

        {/* Undo / Redo Quick Action Controls */}
        <div className="flex items-center gap-0.5 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 sm:p-1.5 rounded-md transition-all flex items-center justify-center ${
              canUndo
                ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer active:scale-95'
                : 'text-neutral-600 cursor-not-allowed opacity-40'
            }`}
            title={canUndo ? 'Отменить (Ctrl+Z)' : 'Нечего отменять'}
            aria-label="Отменить"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 sm:p-1.5 rounded-md transition-all flex items-center justify-center ${
              canRedo
                ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer active:scale-95'
                : 'text-neutral-600 cursor-not-allowed opacity-40'
            }`}
            title={canRedo ? 'Повторить (Ctrl+Y)' : 'Нечего повторять'}
            aria-label="Повторить"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Autosave Status Indicator */}
        <div
          className="hidden xl:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-900/80 border border-neutral-800/80 text-[10px] font-mono text-neutral-400"
          title={autosaveStatus.isSaving ? 'Сохранение...' : `Автосохранено ${autosaveStatus.lastSavedTime || 'сейчас'}`}
        >
          {autosaveStatus.isSaving ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
      </div>

      {/* Zone 2: Navigation & Projects buttons (Icon-First) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-neutral-400 overflow-x-auto no-scrollbar shrink-0">
        {/* Projects Catalog Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors whitespace-nowrap shrink-0 text-xs font-mono font-bold"
          title="Каталог сохранённых проектов"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="tabular-nums font-mono">{projectsCount}</span>
        </button>

        {/* Screen: Studio */}
        <button
          onClick={() => onSelectScreen('studio')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 border text-xs ${
            currentScreen === 'studio'
              ? 'bg-neutral-800 text-white border-neutral-700 font-semibold shadow-sm'
              : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-900'
          }`}
          title="Редактор холста карусели"
        >
          <Layout className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden md:inline">Студия</span>
        </button>

        {/* Screen: Create */}
        <button
          onClick={() => onSelectScreen('create')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 border text-xs font-semibold ${
            currentScreen === 'create'
              ? 'bg-rose-950/80 text-rose-200 border-rose-800 shadow-sm'
              : 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 border-rose-900/60'
          }`}
          title="Создать новую карусель через ИИ или с чистого листа"
        >
          <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Создать</span>
        </button>

        {/* Screen: Grid */}
        <button
          onClick={() => onSelectScreen('grid')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 border text-xs ${
            currentScreen === 'grid'
              ? 'bg-neutral-800 text-white border-neutral-700 font-semibold shadow-sm'
              : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-900'
          }`}
          title="Сетка режиссуры всех 10 слайдов"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden md:inline">Сетка</span>
        </button>

        {/* Manifesto / Guide */}
        <button
          onClick={onOpenKnowledgeBase}
          className="hidden 2xl:flex items-center gap-1 px-2 py-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors whitespace-nowrap shrink-0 text-xs"
          title="Редакционный манифест"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Zone 3: Primary action & score (Icon-First & Compact) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onOpenAnalysis}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 hover:border-neutral-700 transition-colors text-xs font-mono"
          title="Quality Gate аудит 100 баллов и фактчекинг"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span
            className={`font-bold tabular-nums ${
              qualityScore >= 90 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {qualityScore}
          </span>
        </button>

        <button
          onClick={onOpenExport}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Экспорт готовой карусели (ZIP, PNG, текст)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Экспорт</span>
        </button>
      </div>
    </header>
  );
};
