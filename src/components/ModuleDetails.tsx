import React from 'react';
import { ModuleKey } from './PipelineStepper';
import { CarouselProject, HookOption } from '../types/carousel';
import { VISUAL_STYLES } from '../data/visualStyles';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Layers, BarChart3, Sparkles } from 'lucide-react';

interface ModuleDetailsProps {
  activeModule: ModuleKey;
  project: CarouselProject;
  onSelectHook: (index: number) => void;
  onSelectSlide: (index: number) => void;
  onTriggerAudit?: () => void;
  isAuditing?: boolean;
}

export const ModuleDetails: React.FC<ModuleDetailsProps> = ({
  activeModule,
  project,
  onSelectHook,
  onSelectSlide,
  onTriggerAudit,
  isAuditing = false,
}) => {
  const currentStyle = VISUAL_STYLES.find((s) => s.id === project.visualStyleId) || VISUAL_STYLES[0];

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* M1: Trend Radar */}
      {activeModule === 'm1' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 1 // M1</span>
              <h3 className="text-base font-bold text-white mt-0.5">Trend Radar (Исследование темы)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Оценка темы: 24/25
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase">Исследуемая тема</span>
              <p className="text-sm font-semibold text-neutral-200">{project.topic}</p>
              <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-850">
                <span className="font-medium text-neutral-300">Категория:</span> {project.category}
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase">Информационный разрыв</span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Сравнение того, что аудитория уже слышала сотни раз (стереотипы о регулярном постинге), с тем, что в действительности определяет ранжирование и поведение пользователей в 2026 году.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
            <span className="text-xs font-mono text-neutral-400 uppercase">Редакционный тезис проекта</span>
            <p className="text-sm font-medium text-neutral-200 leading-relaxed font-sans">
              «{project.editorialThesis}»
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
              <div className="text-[10px] text-neutral-500 uppercase">Интерес</div>
              <div className="text-base font-bold text-white mt-1">5/5</div>
            </div>
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
              <div className="text-[10px] text-neutral-500 uppercase">Актуальность</div>
              <div className="text-base font-bold text-white mt-1">5/5</div>
            </div>
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
              <div className="text-[10px] text-neutral-500 uppercase">Эмоция</div>
              <div className="text-base font-bold text-white mt-1">5/5</div>
            </div>
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
              <div className="text-[10px] text-neutral-500 uppercase">Вирусность</div>
              <div className="text-base font-bold text-white mt-1">5/5</div>
            </div>
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
              <div className="text-[10px] text-neutral-500 uppercase">Глубина</div>
              <div className="text-base font-bold text-white mt-1">4/5</div>
            </div>
          </div>
        </div>
      )}

      {/* M2: Idea Lab & Hooks */}
      {activeModule === 'm2' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 2 // M2</span>
              <h3 className="text-base font-bold text-white mt-0.5">Idea Lab (5 оригинальных углов и вариантов обложки)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Выбран угол: {project.angleName}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-2">5 вариантов обложек (тест первого слайда):</h4>
            <div className="space-y-2">
              {project.hooks.map((hook, idx) => {
                const isActive = idx === project.activeHookIndex;
                return (
                  <button
                    key={hook.id}
                    onClick={() => onSelectHook(idx)}
                    className={`w-full p-3 rounded-lg text-left transition-all border flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-neutral-800 border-neutral-500 ring-1 ring-neutral-400 text-white'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-rose-400">
                          {hook.type}
                        </span>
                        <span className="text-xs font-bold">{hook.headline}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-snug">{hook.subline}</p>
                      <p className="text-[11px] text-neutral-500 italic pt-1">Обоснование: {hook.rationale}</p>
                    </div>
                    <div className="shrink-0 text-right font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{hook.score}/25</span>
                      {isActive && <span className="block text-[10px] text-neutral-400 mt-1">Активна</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-2">Альтернативные углы подачи:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {project.alternativeAngles.map((alt, i) => (
                <div key={i} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs space-y-1">
                  <span className="font-semibold text-neutral-200 block">{alt.title}</span>
                  <p className="text-neutral-400">{alt.angle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* M3: Evidence Engine */}
      {activeModule === 'm3' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 3 // M3</span>
              <h3 className="text-base font-bold text-white mt-0.5">Evidence Engine (Карточки доказательств и фактчекинг)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Все факты проверены ✓
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {project.evidence.map((ev) => (
              <div key={ev.id} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-neutral-100">{ev.claim}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
                    {ev.reliability}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-neutral-850">
                  <div>
                    <span className="text-neutral-500 font-mono text-[10px] block">Источник:</span>
                    <span className="text-neutral-300 font-medium">{ev.source}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-mono text-[10px] block">Тип & Дата:</span>
                    <span className="text-neutral-300">{ev.sourceType} · {ev.date}</span>
                  </div>
                </div>

                <div className="text-xs text-neutral-400 pt-1">
                  <span className="text-neutral-500 font-mono text-[10px] block">Ограничение вывода:</span>
                  {ev.limitations}
                </div>

                <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded text-[11px] text-neutral-300 font-mono">
                  <span className="text-rose-400 font-semibold">Решение редактора:</span> {ev.editorAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* M4: Virality Architect */}
      {activeModule === 'm4' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 4 // M4</span>
              <h3 className="text-base font-bold text-white mt-0.5">Virality Architect (Механики распространения)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Главная цель: {project.viralityGoal}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase">Ключевой механизм вирусности</span>
              <p className="text-sm font-semibold text-rose-400">{project.viralityMechanic}</p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Пост сформулирован так, чтобы помочь читателю выразить мысль, которую сложно сформулировать самостоятельно, и отправить её коллеге или партнеру в Direct.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="text-xs font-mono text-neutral-400 uppercase">Целевая аудитория</span>
              <p className="text-sm font-semibold text-neutral-200">{project.targetAudience}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Люди с высоким уровнем критического мышления, уставшие от однотипных советов и ищущие подтвержденную систему.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
            <span className="text-xs font-mono text-neutral-400 uppercase">Драматургическая дуга (10 слайдов)</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {project.slides.map((s) => (
                <button
                  key={s.slideNumber}
                  onClick={() => onSelectSlide(s.slideNumber - 1)}
                  className="p-2 bg-neutral-900 border border-neutral-800 rounded text-left hover:border-neutral-600 transition-colors"
                >
                  <span className="text-[10px] font-mono text-rose-400 block font-bold">Слайд {s.slideNumber}</span>
                  <span className="text-[11px] font-medium text-neutral-200 truncate block mt-0.5">{s.roleName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* M5: Art Director */}
      {activeModule === 'm5' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 5 // M5</span>
              <h3 className="text-base font-bold text-white mt-0.5">Art Director (Визуальная концепция и стиль)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Стиль: {currentStyle.name}
            </span>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-100">{currentStyle.nameRu}</span>
              <span className="text-xs font-mono text-neutral-400">{currentStyle.name}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {project.visualStyleRationale}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-850 text-xs">
              <div>
                <span className="text-neutral-500 font-mono text-[10px] block">Палитра:</span>
                <span className="text-neutral-300">{currentStyle.paletteDescription}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-mono text-[10px] block">Типографика:</span>
                <span className="text-neutral-300">{currentStyle.typographyDescription}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* M6: Slide Studio */}
      {activeModule === 'm6' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 6 // M6</span>
              <h3 className="text-base font-bold text-white mt-0.5">Slide Studio (Полный сценарий и промпты)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              Всего слайдов: {project.slides.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {project.slides.map((s, idx) => (
              <div
                key={s.slideNumber}
                onClick={() => onSelectSlide(idx)}
                className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">#{s.slideNumber}</span>
                    <span className="text-neutral-400 font-mono text-[11px]">[{s.role}]</span>
                    <span className="font-semibold text-neutral-200">{s.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">Клик для редактирования →</span>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-1">{s.body}</p>
                <div className="text-[11px] text-neutral-500 font-mono truncate">
                  <span className="text-neutral-400">Промпт:</span> {s.visualPrompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* M7: Quality Gate */}
      {activeModule === 'm7' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 7 // M7</span>
              <h3 className="text-base font-bold text-white mt-0.5">Quality Gate (100-балльный редакционный аудит)</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-emerald-400 font-mono">
                {project.qualityScore.total}/100
              </span>
              {onTriggerAudit && (
                <button
                  onClick={onTriggerAudit}
                  disabled={isAuditing}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors border border-neutral-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAuditing ? 'Аудит...' : 'Запустить независимый аудит'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Breakdown Scoreboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Сила идеи</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.idea}/20</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Обложка & Хук</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.cover}/15</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Сценарий & Дуга</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.scenario}/15</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Качество текста</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.text}/15</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Доказательность</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.evidence}/10</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Арт-дирекшн</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.visual}/15</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Распространение</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.virality}/5</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
              <span className="text-neutral-500 block text-[10px]">Исполнение</span>
              <span className="text-sm font-bold text-neutral-200">{project.qualityScore.breakdown.execution}/5</span>
            </div>
          </div>

          {/* 7 Anti-Template Checks */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2.5">
            <span className="text-xs font-mono uppercase text-neutral-400">Редакционный фильтр (Проверка на нейросетевой шлейф)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Очищен от «в современном мире» и ИИ-воды</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Нет псевдоглубины и пустых цитат</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Нет искусственной драматизации и кликбейта</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Разнообразный ритм предложений и синтаксис</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Все утверждения опираются на факты</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Каждый слайд продвигает мысль вперед</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
              <span className="font-semibold text-emerald-400 block font-mono">Сильные стороны:</span>
              <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                {project.qualityScore.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
              <span className="font-semibold text-amber-400 block font-mono">Точки контроля:</span>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                {project.qualityScore.flaws.map((flaw, i) => (
                  <li key={i}>{flaw}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* M8: Feedback Loop */}
      {activeModule === 'm8' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">Модуль 8 // M8</span>
              <h3 className="text-base font-bold text-white mt-0.5">Feedback Loop (Петля аналитики и гипотезы)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Статус: Анализ завершён
            </span>
          </div>

          {project.feedbackMetrics && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-neutral-500 block text-[10px]">Охват (Reach)</span>
                  <span className="text-base font-bold text-white">{project.feedbackMetrics.reach.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-neutral-500 block text-[10px]">Неподписчики</span>
                  <span className="text-base font-bold text-emerald-400">{project.feedbackMetrics.nonFollowerShare}%</span>
                </div>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-neutral-500 block text-[10px]">Отправки в DMs</span>
                  <span className="text-base font-bold text-rose-400">{project.feedbackMetrics.shares.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-neutral-500 block text-[10px]">Сохранения</span>
                  <span className="text-base font-bold text-amber-400">{project.feedbackMetrics.saves.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <span className="text-xs font-mono text-neutral-400 uppercase">Редакционный диагноз результатов</span>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {project.feedbackMetrics.diagnosis}
                </p>
              </div>

              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <span className="text-xs font-mono text-neutral-400 uppercase">Следующий тест / Гипотеза</span>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans font-medium">
                  {project.feedbackMetrics.nextHypothesis}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
