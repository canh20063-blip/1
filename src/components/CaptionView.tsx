import React, { useState } from 'react';
import { Copy, Check, FileText, Share2, Sparkles } from 'lucide-react';

interface CaptionViewProps {
  caption: string;
  callToAction: string;
  onUpdateCaption?: (newCaption: string) => void;
  onUpdateCta?: (newCta: string) => void;
}

export const CaptionView: React.FC<CaptionViewProps> = ({
  caption,
  callToAction,
  onUpdateCaption,
  onUpdateCta,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
            Упаковка публикации
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">
            Подпись для Instagram (Caption & CTA)
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-colors border border-neutral-700 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Скопировано!' : 'Копировать подпись'}</span>
        </button>
      </div>

      {/* Primary CTA callout */}
      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
        <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
          Единый целевой призыв к действию (CTA):
        </span>
        <p className="text-xs text-neutral-200 font-medium font-sans">
          «{callToAction}»
        </p>
      </div>

      {/* Caption Textarea / View */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono text-[11px]">
          <span>Текст подписи ({caption.length} символов):</span>
          <span className="text-neutral-500">Без шаблонного эмодзи-спама</span>
        </div>
        <textarea
          rows={10}
          value={caption}
          onChange={(e) => onUpdateCaption && onUpdateCaption(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300 leading-relaxed font-sans focus:outline-none focus:border-neutral-700 resize-none"
        />
      </div>

      {/* Publishing Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono">
        <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
          <span className="text-rose-400 font-bold block mb-0.5">✓ Первая строка</span>
          Служит вторичным хуком в ленте Explore
        </div>
        <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded">
          <span className="text-emerald-400 font-bold block mb-0.5">✓ Личные сообщения</span>
          Призыв переслать коллеге стимулирует алгоритм DMs
        </div>
      </div>
    </div>
  );
};
