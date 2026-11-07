import React, { useState } from 'react';
import { CarouselProject, VisualStyleId } from '../types/carousel';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, X, FileText, Image, Code2 } from 'lucide-react';
import { resolveSlideStyle } from './SlideCard';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
  activeSlideIndex: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSlideIndex,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(project.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const generateMarkdown = () => {
    let md = `# ${project.topic}\n\n`;
    md += `**Редакционный угол:** ${project.angleName}\n`;
    md += `**Механизм вирусности:** ${project.viralityMechanic}\n`;
    const styleLabel =
      project.visualStyleId === 'smart-adaptive'
        ? `👑 Режиссерский автомикс (Автосмешивание)`
        : project.visualStyleId;
    md += `**Стиль:** ${styleLabel}\n\n`;
    md += `## Слайды карусели\n\n`;
    project.slides.forEach((s) => {
      const isVisible = (k: string) => !s.hiddenBlocks?.includes(k);
      md += `### Слайд ${s.slideNumber}: ${isVisible('title') ? s.title : '(Заголовок скрыт)'}\n`;
      if (isVisible('roleName')) md += `*Роль:* ${s.role} (${s.roleName})\n`;
      if (isVisible('kicker') && s.kicker) md += `*Кикер:* ${s.kicker}\n`;
      if (project.visualStyleId === 'smart-adaptive') {
        md += `*Автомикс стиль:* \`${resolveSlideStyle(s, project.visualStyleId)}\`\n`;
      }
      if (isVisible('body') && s.body) md += `\n${s.body}\n\n`;
      if (isVisible('highlight') && s.highlight) md += `> **Акцент:** ${s.highlight}\n\n`;
      if (isVisible('stats') && s.statNumber) md += `*Метрика:* **${s.statNumber}** — ${s.statLabel || ''}\n\n`;
      if (isVisible('comparison') && s.comparisonBefore) md += `*Сравнение:* До: ${s.comparisonBefore} | После: ${s.comparisonAfter}\n\n`;
      if (isVisible('image') && s.imageUrl) md += `*Визуал:* \`${s.visualPrompt || s.imagePrompt || 'Изображение прикреплено'}\`\n\n`;
      if (isVisible('footnote') && s.footnote) md += `*Сноска:* ${s.footnote}\n\n`;
      md += `---\n\n`;
    });
    md += `## Подпись к публикации\n\n${project.caption}\n\n`;
    md += `**CTA:** ${project.callToAction}\n`;
    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadCurrentSlide = async () => {
    const el = document.getElementById(`preview-slide-${activeSlideIndex}`) || document.querySelector(`[id^="preview-slide-"]`);
    if (!el) {
      setExportError('Элемент слайда не найден для экспорта');
      setTimeout(() => setExportError(null), 3000);
      return;
    }
    setIsExportingImage(true);
    setExportError(null);
    try {
      const dataUrl = await toPng(el as HTMLElement, {
        pixelRatio: 2, // High resolution (retina)
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `slide-${activeSlideIndex + 1}-${project.visualStyleId}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess(`Слайд #${activeSlideIndex + 1} успешно сохранён в PNG!`);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err: any) {
      console.error('Export slide error:', err);
      setExportError('Не удалось экспортировать изображение');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Экспорт пакета публикации</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Готовые материалы для публикации в Instagram и сохранения в архив
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {exportSuccess && (
          <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {exportError && (
          <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <X className="w-4 h-4 text-rose-400" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Action 1: Download Slide Image */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-semibold text-neutral-200">
                Экспорт активного слайда (#{activeSlideIndex + 1}) в PNG
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-500">1080 × 1350 (4:5)</span>
          </div>
          <p className="text-xs text-neutral-400">
            Рендерит текущий слайд в ультравысоком разрешении без интерфейсных плашек.
          </p>
          <button
            onClick={handleDownloadCurrentSlide}
            disabled={isExportingImage}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors border border-neutral-700 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingImage ? 'Рендеринг PNG...' : `Скачать слайд #${activeSlideIndex + 1} в PNG`}</span>
          </button>
        </div>

        {/* Action 2: Instagram Caption */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-neutral-200">
                Подпись для публикации (Instagram Caption)
              </span>
            </div>
            <button
              onClick={handleCopyCaption}
              className="text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-850 border border-neutral-750"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCaption ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line font-sans">
            {project.caption}
          </div>
        </div>

        {/* Action 3: Markdown Full Package */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-neutral-200">
                Полный редакционный сценарий (Markdown)
              </span>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-850 border border-neutral-750"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarkdown ? 'Скопировано!' : 'Копировать'}</span>
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Включает структуру 10 слайдов, визуальные промпты, источники, подпись и призыв к действию.
          </p>
        </div>
      </div>
    </div>
  );
};
