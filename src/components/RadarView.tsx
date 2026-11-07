import React from 'react';
import { TRENDING_TOPICS, TrendingTopicItem } from '../data/trendingTopics';
import { VisualStyleId } from '../types/carousel';
import { Radio, ArrowRight, Sparkles } from 'lucide-react';

interface RadarViewProps {
  onSelectTopic: (topic: string, styleId?: VisualStyleId) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({ onSelectTopic }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-bold text-white font-sans">
              Trend Radar (Банк проверенных массовых тем)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Темы с максимальным потенциалом распространения по 25-балльной редакционной шкале
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {TRENDING_TOPICS.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between hover:border-neutral-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {item.totalScore}/25 баллов
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug font-sans">
                {item.topic}
              </h3>

              <div className="p-2.5 bg-neutral-950 border border-neutral-850 rounded-lg text-xs text-neutral-300 mt-2 space-y-1">
                <span className="text-[10px] font-mono text-rose-400 block font-semibold">
                  Основной угол:
                </span>
                <p className="leading-snug">{item.primaryAngle}</p>
              </div>

              <div className="mt-2 text-[11px] text-neutral-400 space-y-1">
                <div>
                  <span className="text-neutral-500 font-mono">Целевая реакция:</span> {item.targetReaction}
                </div>
                <div>
                  <span className="text-neutral-500 font-mono">Визуальный язык:</span> {item.recommendedStyle}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTopic(item.topic)}
              className="w-full mt-2 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
            >
              <span>Запустить производство</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
