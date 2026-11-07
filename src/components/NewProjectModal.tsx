import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FilePlus,
  Award,
  FolderOpen,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateWizard: () => void;
  onCreateBlank: (title: string) => void;
  onLoadPilotCase: () => void;
  onOpenProjectsList: () => void;
  savedProjectsCount: number;
  onGenerate?: (topic: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateWizard,
  onCreateBlank,
  onLoadPilotCase,
  onOpenProjectsList,
  savedProjectsCount,
  onGenerate,
}) => {
  const [aiTopic, setAiTopic] = useState('');
  const [aiStatus, setAiStatus] = useState<'ok' | 'billing_required' | 'invalid_key' | 'missing' | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((r) => r.json())
        .then((d) => setAiStatus(d.geminiLiveStatus || (d.hasGeminiKey ? 'ok' : 'missing')))
        .catch(() => setAiStatus('missing'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiTopic.trim()) {
      if (onGenerate) {
        onGenerate(aiTopic.trim());
      }
      onClose();
    }
  };

  const handleCreateBlankClick = () => {
    onCreateBlank('Новая карусель');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Создать новую карусель
              </h2>
              <p className="text-xs text-neutral-400">
                Сгенерируйте с ИИ под вашу тему или начните с чистого холста
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 3 Visual Creation Options */}
        <div className="p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
          {/* Option 1: AI Master Generator */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-rose-950/30 border border-rose-500/40 shadow-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Генерация всей карусели по теме
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    РЕКОМЕНДУЕМ
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Создает законченный сценарий (9 слайдов, статистика, факты, алгоритм и CTA) с адаптивным визуальным стилем.
                </p>
              </div>
            </div>

            {/* AI Engine Status Badge */}
            {aiStatus === 'ok' ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 3.8 Flash активен · Живая ИИ-генерация авторского контента</span>
              </div>
            ) : aiStatus === 'billing_required' ? (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>⚠️ Ключ подключен, но Google вернул ошибку 403</span>
                </div>
                <p className="text-neutral-400 leading-snug">
                  Для этого проекта недоступен Free Tier: нужно создать ключ в <b className="text-white">новом проекте</b> или привязать биллинг на <span className="text-rose-400 font-mono">aistudio.google.com/billing</span>.
                </p>
              </div>
            ) : aiStatus === 'missing' ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-300">
                <div className="flex items-center gap-1.5">
                  <span>⚠️ Режим шаблонов</span>
                  <span className="text-neutral-400">· Для уникального ИИ укажите GEMINI_API_KEY в панели Secrets</span>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleAiSubmit} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Введите тему (например: Как дизайнеру поднять чек до $5000)..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-400 font-sans"
                />
                <button
                  type="submit"
                  disabled={!aiTopic.trim()}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold transition-all shadow shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Создать (9 слайдов)</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateWizard();
                }}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 underline flex items-center gap-1"
              >
                <span>Или открыть расширенный конструктор (выбор стиля, виральной механики, банк трендов) →</span>
              </button>
            </form>
          </div>

          {/* Option 2: Blank Template */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Пустой черновик без текста
                </span>
                <span className="text-[11px] text-neutral-400">
                  Чистая сетка из 10 слайдов для ручного наполнения
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateBlankClick}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono transition-colors shrink-0"
            >
              Создать пустую
            </button>
          </div>

          {/* Option 3: Benchmark Pilot Case */}
          <div
            onClick={() => {
              onClose();
              onLoadPilotCase();
            }}
            className="group p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-amber-500/50 cursor-pointer transition-all hover:shadow flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 transition-colors block">
                  Загрузить эталонный кейс SMM 2026
                </span>
                <span className="text-[11px] text-neutral-500">
                  Проверенная карусель (94 балла Quality Gate) по методологии Раздела 25
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 shrink-0 flex items-center gap-1">
              <span>Загрузить</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Modal Footer: Quick Link to Saved Projects */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProjectsList();
            }}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-amber-300 font-mono transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Или открыть сохраненный проект ({savedProjectsCount}) →</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
