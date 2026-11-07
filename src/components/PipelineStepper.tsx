import React from 'react';
import { Radio, Lightbulb, ShieldCheck, Compass, Palette, LayoutGrid, CheckCircle2, RefreshCcw } from 'lucide-react';

export type ModuleKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8';

interface ModuleItem {
  key: ModuleKey;
  id: string;
  name: string;
  nameRu: string;
  desc: string;
  icon: React.ElementType;
}

export const MODULES: ModuleItem[] = [
  { key: 'm1', id: 'M1', name: 'Trend Radar', nameRu: 'Радар трендов', desc: 'Поиск тем с потенциалом', icon: Radio },
  { key: 'm2', id: 'M2', name: 'Idea Lab', nameRu: 'Лаборатория идей', desc: '5 оригинальных углов', icon: Lightbulb },
  { key: 'm3', id: 'M3', name: 'Evidence Engine', nameRu: 'Фактчекинг & База', desc: 'Проверка источников', icon: ShieldCheck },
  { key: 'm4', id: 'M4', name: 'Virality Architect', nameRu: 'Архитектор вирусности', desc: 'Механики и цели', icon: Compass },
  { key: 'm5', id: 'M5', name: 'Art Director', nameRu: 'Арт-дирекшн', desc: '8 визуальных стилей', icon: Palette },
  { key: 'm6', id: 'M6', name: 'Slide Studio', nameRu: 'Студия слайдов', desc: 'Сценарий и промпты', icon: LayoutGrid },
  { key: 'm7', id: 'M7', name: 'Quality Gate', nameRu: 'Контроль качества', desc: '100-балльный аудит', icon: CheckCircle2 },
  { key: 'm8', id: 'M8', name: 'Feedback Loop', nameRu: 'Петля аналитики', desc: 'Метрики и гипотезы', icon: RefreshCcw },
];

interface PipelineStepperProps {
  activeModule: ModuleKey;
  onSelectModule: (key: ModuleKey) => void;
  qualityScore: number;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  activeModule,
  onSelectModule,
  qualityScore,
}) => {
  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Конвейер VIRAL CAROUSEL OS 2.0
          </span>
          <span className="text-xs font-mono text-neutral-600">·</span>
          <span className="text-xs text-neutral-400">8 этапов производства</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500">Редакционный балл:</span>
          <span className={`font-bold ${qualityScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {qualityScore}/100
          </span>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.key;
          return (
            <button
              key={mod.key}
              onClick={() => onSelectModule(mod.key)}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-neutral-800 border-neutral-600 text-white shadow-sm ring-1 ring-neutral-500'
                  : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {mod.id}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-neutral-500'}`} />
              </div>
              <div className="text-xs font-semibold truncate leading-tight">{mod.nameRu}</div>
              <div className="text-[10px] text-neutral-500 truncate mt-0.5">{mod.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
