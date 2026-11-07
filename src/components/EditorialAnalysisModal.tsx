import React, { useState, useEffect } from 'react';
import { CarouselProject } from '../types/carousel';
import { ModuleDetails } from './ModuleDetails';
import { ModuleKey } from './PipelineStepper';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Compass,
  RefreshCcw,
  Radio,
  Sparkles,
  Layers,
  FileCheck,
} from 'lucide-react';

interface EditorialAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
  onSelectSlide: (index: number) => void;
  onTriggerAudit?: () => void;
  isAuditing?: boolean;
}

type AnalysisTab = 'quality' | 'evidence' | 'virality' | 'analytics' | 'radar';

export const EditorialAnalysisModal: React.FC<EditorialAnalysisModalProps> = ({
  isOpen,
  onClose,
  project,
  onSelectSlide,
  onTriggerAudit,
  isAuditing = false,
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('quality');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'quality' as AnalysisTab,
      label: 'Quality Gate (M7)',
      badge: `${project.qualityScore.total}/100`,
      icon: CheckCircle2,
    },
    {
      id: 'evidence' as AnalysisTab,
      label: 'Фактчекинг (M3)',
      badge: `${project.evidence.length}`,
      icon: ShieldCheck,
    },
    {
      id: 'virality' as AnalysisTab,
      label: 'Вирусность & Дуга (M4)',
      icon: Compass,
    },
    {
      id: 'analytics' as AnalysisTab,
      label: 'Прогноз метрик (M8)',
      icon: RefreshCcw,
    },
    {
      id: 'radar' as AnalysisTab,
      label: 'Trend Radar (M1)',
      icon: Radio,
    },
  ];

  const mapTabToModule: Record<AnalysisTab, ModuleKey> = {
    quality: 'm7',
    evidence: 'm3',
    virality: 'm4',
    analytics: 'm8',
    radar: 'm1',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-850 border border-neutral-750 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="analysis-modal-title"
                  className="text-base sm:text-lg font-bold text-white tracking-tight"
                >
                  Редакционный анализ & аудит
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 tabular-nums">
                  {project.qualityScore.total}/100 Quality Gate
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Диагностика качества, фактчекинг, драматургия и прогноз охвата публикации
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onTriggerAudit && (
              <button
                onClick={onTriggerAudit}
                disabled={isAuditing}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAuditing ? 'Аудит...' : 'Перепроверить'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-5 py-2.5 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto select-none shrink-0">
          <span className="text-[11px] font-mono text-neutral-500 uppercase shrink-0 mr-1">
            Разделы анализа:
          </span>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm font-semibold ring-1 ring-neutral-500'
                    : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border-neutral-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          <ModuleDetails
            activeModule={mapTabToModule[activeTab]}
            project={project}
            onSelectHook={() => {}}
            onSelectSlide={(idx) => {
              onSelectSlide(idx);
              onClose();
            }}
            onTriggerAudit={onTriggerAudit}
            isAuditing={isAuditing}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Аналитические модули изолированы от холста редактирования карусели</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors border border-neutral-700"
          >
            Вернуться к редактуре
          </button>
        </div>
      </div>
    </div>
  );
};
