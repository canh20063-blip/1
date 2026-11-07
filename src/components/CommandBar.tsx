import React, { useState } from 'react';
import { Search, Play, RefreshCw, Terminal, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { VisualStyleId } from '../types/carousel';
import { VISUAL_STYLES } from '../data/visualStyles';

interface CommandBarProps {
  onGenerate: (topic: string, styleId?: VisualStyleId) => void;
  onAudit: () => void;
  onLoadPilotCase: () => void;
  isLoading: boolean;
  activeStyleId: VisualStyleId;
  onSelectStyle: (id: VisualStyleId) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onGenerate,
  onAudit,
  onLoadPilotCase,
  isLoading,
  activeStyleId,
  onSelectStyle,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicInput.trim()) {
      onGenerate(topicInput.trim(), activeStyleId);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    switch (cmd) {
      case 'PILOT':
        onLoadPilotCase();
        break;
      case 'AUDIT':
        onAudit();
        break;
      case 'MONEY':
        setTopicInput('Почему люди продолжают работать там, где им неинтересно, хотя это приносит деньги');
        onGenerate('Почему люди продолжают работать там, где им неинтересно, хотя это приносит деньги', 'independent-magazine');
        break;
      case 'PREPARE':
        setTopicInput('Почему подготовка становится изощренным способом избегать реальных действий');
        onGenerate('Почему подготовка становится изощренным способом избегать реальных действий', 'dark-editorial');
        break;
      case 'DECISIONS':
        setTopicInput('Почему люди откладывают решение, которое внутренне уже приняли');
        onGenerate('Почему люди откладывают решение, которое внутренне уже приняли', 'contemporary-art');
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 space-y-2">
      {/* 1-Line Compact Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Введите тему для создания вирусной карусели..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Style Dropdown */}
        <select
          value={activeStyleId}
          onChange={(e) => onSelectStyle(e.target.value as VisualStyleId)}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none font-mono shrink-0 hidden sm:block"
        >
          {VISUAL_STYLES.map((st) => (
            <option key={st.id} value={st.id}>
              {st.nameRu}
            </option>
          ))}
        </select>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading || !topicInput.trim()}
          className="px-3.5 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-sm"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isLoading ? 'Генерация...' : 'Создать'}</span>
        </button>

        {/* Quick Presets Toggle */}
        <button
          type="button"
          onClick={() => setIsPresetsOpen(!isPresetsOpen)}
          className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 rounded-lg text-xs font-mono flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
          title="Открыть банк готовых тем"
        >
          <span>Темы</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isPresetsOpen ? 'rotate-180' : ''}`} />
        </button>
      </form>

      {/* Expandable Quick Preset Chips */}
      {isPresetsOpen && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-neutral-850 text-xs">
          <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">
            Пресеты:
          </span>

          <button
            onClick={() => handleQuickCommand('PILOT')}
            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-[11px] font-mono transition-colors"
          >
            ★ Кейс SMM 2026 (Раздел 25)
          </button>

          <button
            onClick={() => handleQuickCommand('MONEY')}
            className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] transition-colors"
          >
            Психология денег
          </button>

          <button
            onClick={() => handleQuickCommand('PREPARE')}
            className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] transition-colors"
          >
            Ловушка подготовки
          </button>

          <button
            onClick={() => handleQuickCommand('DECISIONS')}
            className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] transition-colors"
          >
            Отложенные решения
          </button>

          <button
            onClick={() => handleQuickCommand('AUDIT')}
            disabled={isLoading}
            className="ml-auto px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-neutral-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span>Аудит карусели</span>
          </button>
        </div>
      )}
    </div>
  );
};
