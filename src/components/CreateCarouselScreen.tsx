import React, { useState } from 'react';
import { VisualStyleId, OperationalMode } from '../types/carousel';
import { VISUAL_STYLES } from '../data/visualStyles';
import { TRENDING_TOPICS, TrendingTopicItem } from '../data/trendingTopics';
import { Sparkles, ArrowRight, ArrowLeft, Play, Radio, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

interface CreateCarouselScreenProps {
  onGenerate: (topic: string, styleId?: VisualStyleId, mechanic?: string) => Promise<void>;
  onLoadPilotCase: () => void;
  onCreateBlank?: (title?: string) => void;
  onBackToStudio: () => void;
  isLoading: boolean;
  currentStyleId: VisualStyleId;
}

export const CreateCarouselScreen: React.FC<CreateCarouselScreenProps> = ({
  onGenerate,
  onLoadPilotCase,
  onCreateBlank,
  onBackToStudio,
  isLoading,
  currentStyleId,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<VisualStyleId>(currentStyleId);
  const [selectedMechanic, setSelectedMechanic] = useState<string>('«Я знаю человека, которому это нужно отправить»');
  const [selectedMode, setSelectedMode] = useState<OperationalMode>('FULL PRODUCTION');
  const [loadingStep, setLoadingStep] = useState(0);

  const MECHANICS = [
    { id: 'dm', title: '«Я знаю, кому отправить в DMs»', desc: 'Помогает читателю выразить мысль коллеге или другу' },
    { id: 'relatable', title: '«Это буквально про меня»', desc: 'Узнавание скрытой боли, внутреннего конфликта, привычки' },
    { id: 'insight', title: '«Я этого не знал»', desc: 'Неожиданное объяснение, проверенное исследование, механизм' },
    { id: 'practical', title: '«Теперь я могу это применить»', desc: 'Инструкция, алгоритм, модель принятия решений' },
    { id: 'debate', title: '«Я не согласен — хочу обсудить»', desc: 'Аргументированный вызов укоренившемуся мифу' },
  ];

  const MODES: { id: OperationalMode; label: string; desc: string }[] = [
    { id: 'FULL PRODUCTION', label: 'Полный цикл (M1–M8)', desc: 'Идея → Сценарий → Визуал → Аудит' },
    { id: 'CONCEPT', label: 'Только концепции (M2)', desc: '5 оригинальных углов и хуков' },
    { id: 'DEEP RESEARCH', label: 'Фактчекинг (M3)', desc: 'Поиск источников и доказательств' },
    { id: 'DESIGN ONLY', label: 'Арт-дирекшн (M5)', desc: 'Подбор визуального стиля и промптов' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topicInput.trim() || isLoading) return;

    // Simulate pipeline steps animation
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 450);

    try {
      await onGenerate(topicInput.trim(), selectedStyle, selectedMechanic);
    } finally {
      clearInterval(interval);
      setLoadingStep(0);
    }
  };

  const handleSelectTrending = (item: TrendingTopicItem) => {
    setTopicInput(item.topic);
    if (item.id === 'smm-rules-2026') {
      onLoadPilotCase();
      return;
    }
    const matchedStyle = VISUAL_STYLES.find((s) => s.name.toLowerCase().includes(item.recommendedStyle.toLowerCase().split(' ')[0]));
    if (matchedStyle) {
      setSelectedStyle(matchedStyle.id);
    }
  };

  const PIPELINE_STEPS = [
    'M1: Анализ трендов и информационного разрыва...',
    'M2: Разработка 5 оригинальных углов и хуков...',
    'M3: Верификация источников и карточек фактов...',
    'M4: Проектирование 10-слайдовой дуги удержания...',
    'M5: Арт-дирекшн и настройка визуального языка...',
    'M6: Написание сценария без нейросетевых клише...',
    'M7: Независимый аудит Quality Gate (100 баллов)...',
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top Header of Creation Screen */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-900/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться в студию</span>
          </button>
          <div className="hidden sm:block">
            <span className="text-xs font-mono text-rose-400 font-bold uppercase">
              Мастер создания карусели
            </span>
            <span className="text-xs text-neutral-400 block -mt-0.5">
              VIRAL CAROUSEL ENGINE 2.0 · 8-модульный редакторский пайплайн
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateBlank && (
            <button
              type="button"
              onClick={() => onCreateBlank('Новая карусель')}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 hover:border-neutral-600 text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <span>+ Чистый шаблон (с нуля)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLoadPilotCase}
            className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <span>★ Эталонный кейс SMM 2026</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport (Two Columns) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 min-h-0 overflow-y-auto max-w-[1600px] w-full mx-auto">
        {/* Left Column: Input Form & Settings (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Topic Input Box */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Тема карусели</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-500">
                Любая массовая, психологическая, бизнес или общественная тема
              </span>
            </div>

            <textarea
              rows={3}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Например: Почему люди продолжают работать там, где им неинтересно, хотя это приносит деньги..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-sans leading-relaxed resize-none"
            />

            {/* Virality Mechanic Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-mono text-neutral-400 uppercase block">
                Механизм вирусного распространения (почему постом поделятся):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MECHANICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMechanic(m.title)}
                    className={`p-2 rounded-lg text-left text-xs transition-all border ${
                      selectedMechanic === m.title
                        ? 'bg-neutral-800 border-neutral-500 text-white font-medium shadow-sm'
                        : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="font-semibold truncate">{m.title}</div>
                    <div className="text-[10px] text-neutral-500 truncate mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selector with UGC spotlight */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-neutral-400 uppercase block">
                  Визуальный стиль арт-дирекшна:
                </label>
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  👑 Режиссерский автомикс + {VISUAL_STYLES.length - 1} стилей
                </span>
              </div>

              {/* Flagship Smart-Adaptive Quick Selection Banner */}
              <div
                onClick={() => setSelectedStyle('smart-adaptive')}
                className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                  selectedStyle === 'smart-adaptive'
                    ? 'bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                    : 'bg-neutral-950/80 border-amber-500/30 hover:border-amber-400/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                      👑 ТОП ВЫБОР
                    </span>
                    <span className="text-xs font-bold text-white">
                      Режиссерский автомикс (Автосмешивание)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Не нужно выбирать стиль: визуал каждого слайда динамически подстраивается под текст (обложка, заметка iOS, чат, цифры, аудио)
                  </p>
                </div>
                <div className="shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedStyle === 'smart-adaptive'
                        ? 'bg-amber-400 text-neutral-950 shadow'
                        : 'bg-neutral-900 text-amber-400 border border-amber-400/40'
                    }`}
                  >
                    {selectedStyle === 'smart-adaptive' ? '✓ Выбрано' : 'Выбрать'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {VISUAL_STYLES.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  const isSmart = st.id === 'smart-adaptive';

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2 rounded-lg text-left text-xs transition-all border relative flex flex-col justify-between ${
                        isSelected
                          ? isSmart
                            ? 'bg-amber-950/50 border-amber-400 text-white font-semibold ring-1 ring-amber-400/60 shadow-sm'
                            : 'bg-neutral-800 border-rose-500 text-white font-semibold ring-1 ring-rose-500/50 shadow-sm'
                          : isSmart
                          ? 'bg-neutral-950 border-amber-500/40 text-amber-300 hover:bg-neutral-850'
                          : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="truncate font-medium text-neutral-100">{st.nameRu}</span>
                        {st.badge && (
                          <span
                            className={`text-[8px] font-mono px-1 py-0.2 rounded border shrink-0 ${
                              isSmart
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                                : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                            }`}
                          >
                            {st.badge.replace('🔥 ', '').replace('👑 ', '')}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-neutral-500 truncate font-mono">{st.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-mono text-neutral-400 uppercase block">
                Режим работы:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MODES.map((md) => (
                  <button
                    key={md.id}
                    type="button"
                    onClick={() => setSelectedMode(md.id)}
                    className={`p-1.5 rounded-lg text-center text-xs transition-all border ${
                      selectedMode === md.id
                        ? 'bg-neutral-800 border-rose-500/80 text-rose-300 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <div className="font-mono text-[10px]">{md.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Big Launch Button */}
            <div className="pt-2">
              <button
                onClick={() => handleSubmit()}
                disabled={isLoading || !topicInput.trim()}
                className="w-full py-3 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Сборка карусели в процессе...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Запустить конвейер VIRAL CAROUSEL OS 2.0</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading Pipeline Step Display */}
            {isLoading && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-400 font-bold">ЭТАП ПРОИЗВОДСТВА:</span>
                  <span className="text-neutral-400">{loadingStep + 1} из 7</span>
                </div>
                <div className="text-xs text-neutral-200 font-mono">
                  {PIPELINE_STEPS[loadingStep] || PIPELINE_STEPS[0]}
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${((loadingStep + 1) / 7) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trending Radar Bank (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider">
                Банк проверенных тем (Trend Radar)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">Клик для выбора</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1">
            {TRENDING_TOPICS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectTrending(item)}
                className="p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.totalScore}/25 баллов
                  </span>
                </div>

                <h4 className="text-xs font-bold text-neutral-100 group-hover:text-rose-300 transition-colors leading-snug">
                  {item.topic}
                </h4>

                <div className="text-[11px] text-neutral-400 leading-tight">
                  <span className="text-neutral-500 font-mono">Угол:</span> {item.primaryAngle}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-[10px] text-neutral-500 font-mono">
                  <span>Стиль: {item.recommendedStyle}</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Выбрать тему →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
