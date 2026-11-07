import React, { useState } from 'react';
import { BookOpen, Copy, Check, X, Terminal, ChevronRight } from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'handbook' | 'commands' | 'prompt'>('handbook');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const masterPromptText = `РОЛЬ:
Ты — VIRAL CAROUSEL ENGINE 2.0, редакционная система полного цикла для создания высококачественных Instagram-каруселей на массовые темы без нейросетевого шлейфа.
Совмещаешь компетенции: главного редактора медиа, исследователя-фактчекера, сценариста, контент-стратега и арт-директора.

МОДУЛИ ПРОИЗВОДСТВА:
M1 Trend Radar (поиск темы и информационного разрыва)
M2 Idea Lab (5 оригинальных углов: парадокс, конфликт, скрытая причина, разоблачение, практическое открытие)
M3 Evidence Engine (проверка источников, карточки доказательств)
M4 Virality Architect (механика распространения, 10-слайдовая дуга)
M5 Art Director (выбор из 8 визуальных стилей)
M6 Slide Studio (послайдовый сценарий и точные промпты)
M7 Quality Gate (100-балльная оценка, 7 тестов на отсутствие клише)
M8 Feedback Loop (анализ метрик после публикации)

ГЛАВНЫЙ КРИТЕРИЙ:
Карусель должна быть достойна публикации в сильном авторском медиа независимо от того, использовался ли при её создании искусственный интеллект.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(masterPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-white">База знаний VIRAL CAROUSEL OS 2.0</h3>
              <p className="text-xs text-neutral-400">Полный манифест, команды и управляющий промпт</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('handbook')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors ${
              activeTab === 'handbook' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Методология (8 Модулей)
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors ${
              activeTab === 'commands' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Команды управления
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors ${
              activeTab === 'prompt' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Мастер-промпт ENGINE 2.0
          </button>
        </div>

        {activeTab === 'handbook' && (
          <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="font-bold text-white uppercase font-mono text-[11px] block text-rose-400">
                1. Фундамент: единица контента, а не просто красивые слайды
              </span>
              <p>
                Карусель решает 4 задачи:
                1. Остановить скролл ленты.
                2. Продать следующий свайп.
                3. Оправдать потраченное время читателя.
                4. Создать непреодолимое желание поделиться в Direct или сохранить в закладки.
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="font-bold text-white uppercase font-mono text-[11px] block text-rose-400">
                2. Редакционный фильтр: 7 признаков шаблонности, которые мы уничтожаем
              </span>
              <ul className="space-y-1 list-disc list-inside text-neutral-400">
                <li>Универсальные вступления («В современном мире всё больше людей...»)</li>
                <li>Искусственная драматизация («Ты даже не представляешь, насколько глубока проблема»)</li>
                <li>Псевдоглубина («Путь к себе начинается с осознания потери связи...»)</li>
                <li>Бесконечные банальные антитезы («Дело не в деньгах, дело в свободе»)</li>
                <li>Стерильная правильность без живого человеческого наблюдения</li>
                <li>Повторение одной и той же мысли на 5 слайдах подряд</li>
                <li>Отсутствие конкретных цифр, фактов и проверяемых первоисточников.</li>
              </ul>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <span className="font-bold text-white uppercase font-mono text-[11px] block text-rose-400">
                3. 100-балльная шкала Quality Gate
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div>Идея: 20 баллов</div>
                <div>Обложка: 15 баллов</div>
                <div>Сценарий: 15 баллов</div>
                <div>Текст: 15 баллов</div>
                <div>Факты: 10 баллов</div>
                <div>Визуал: 15 баллов</div>
                <div>Шеринг: 5 баллов</div>
                <div>Исполнение: 5 баллов</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">НАЙДИ ТЕМЫ</span>
              <span className="text-neutral-400 text-[11px]">Исследует повестку и предлагает темы</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">РАЗРАБОТАЙ ИДЕЮ: [тема]</span>
              <span className="text-neutral-400 text-[11px]">Формирует 5 оригинальных углов</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">ИССЛЕДУЙ: [тема]</span>
              <span className="text-neutral-400 text-[11px]">Собирает карточки доказательств</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">СОЗДАЙ КАРУСЕЛЬ: [тема]</span>
              <span className="text-neutral-400 text-[11px]">Запускает полный цикл производства</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">ТОЛЬКО ВИЗУАЛ: [тема]</span>
              <span className="text-neutral-400 text-[11px]">Разрабатывает арт-дирекшн и промпты</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">РАЗНЕСИ КАРУСЕЛЬ</span>
              <span className="text-neutral-400 text-[11px]">Запускает независимый аудит критика</span>
            </div>
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
              <span className="text-rose-400 font-bold">РАЗБЕРИ РЕЗУЛЬТАТЫ</span>
              <span className="text-neutral-400 text-[11px]">Анализирует метрики и формулирует гипотезу</span>
            </div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-mono">Системный мастер-промпт VIRAL CAROUSEL ENGINE 2.0</span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Скопировано!' : 'Копировать промпт'}</span>
              </button>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {masterPromptText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
