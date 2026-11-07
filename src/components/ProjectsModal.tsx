import React, { useState, useEffect } from 'react';
import { CarouselProject } from '../types/carousel';
import {
  StoredProjectRecord,
  getAllSavedProjects,
  deleteProjectFromCatalog,
  duplicateProjectInCatalog,
  renameProjectInCatalog,
  syncProjectToCatalog,
} from '../utils/projectStorage';
import { VISUAL_STYLES } from '../data/visualStyles';
import {
  X,
  FolderOpen,
  PlusCircle,
  Trash2,
  Copy,
  Edit2,
  Check,
  Search,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string;
  onSelectProject: (project: CarouselProject) => void;
  onCreateNew: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  activeProjectId,
  onSelectProject,
  onCreateNew,
}) => {
  const [projects, setProjects] = useState<StoredProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const reloadProjects = () => {
    const list = getAllSavedProjects();
    setProjects(list);
  };

  useEffect(() => {
    if (isOpen) {
      reloadProjects();
      setEditingId(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleStartRename = (record: StoredProjectRecord) => {
    setEditingId(record.data.id);
    setEditTitleValue(record.meta.topic || record.data.topic);
  };

  const handleSaveRename = (projectId: string) => {
    if (!editTitleValue.trim()) return;
    renameProjectInCatalog(projectId, editTitleValue.trim());
    setEditingId(null);
    reloadProjects();
    showFeedback('Проект успешно переименован');
  };

  const handleDuplicate = (projectId: string) => {
    const cloned = duplicateProjectInCatalog(projectId);
    if (cloned) {
      reloadProjects();
      showFeedback('Создана копия проекта');
    }
  };

  const handleDelete = (projectId: string) => {
    const updated = deleteProjectFromCatalog(projectId);
    setProjects(updated);
    setDeletingId(null);
    showFeedback('Проект удален');
  };

  const handleExportBackup = () => {
    const all = getAllSavedProjects();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral_carousels_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Резервная копия сохранена на устройство');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((record) => {
            if (record.data && record.data.id) {
              syncProjectToCatalog(record.data);
            }
          });
          reloadProjects();
          showFeedback(`Успешно импортировано проектов: ${parsed.length}`);
        } else {
          showFeedback('Файл имеет неподходящий формат');
        }
      } catch (err) {
        showFeedback('Ошибка при чтении файла резервной копии');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const topic = (p.meta.topic || p.data.topic || '').toLowerCase();
    const cover = (p.meta.coverTitle || '').toLowerCase();
    const thesis = (p.meta.editorialThesis || '').toLowerCase();
    return topic.includes(q) || cover.includes(q) || thesis.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-brutal uppercase tracking-tight">
                  Мои проекты и карусели
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-mono font-bold">
                  {projects.length}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Все проекты сохраняются автоматически. Редактируйте, дублируйте или создавайте новые.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateNew}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Новая карусель</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Backup Actions */}
        <div className="p-3 sm:p-4 border-b border-neutral-800/80 bg-neutral-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по теме, заголовку обложки или тезису..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Backup buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportBackup}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono transition-colors flex items-center gap-1.5"
              title="Скачать все проекты файлом JSON"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Экспорт JSON</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Импорт JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Projects List Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
              <FolderOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-neutral-300 mb-1">
                {searchQuery ? 'Ничего не найдено по запросу' : 'Список проектов пуст'}
              </div>
              <div className="text-xs text-neutral-500 mb-4">
                {searchQuery
                  ? 'Попробуйте изменить поисковую фразу'
                  : 'Создайте первую вирусную карусель в студии или генераторе'}
              </div>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Создать карусель</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProjects.map((rec) => {
                const isCurrentActive = rec.data.id === activeProjectId;
                const styleMeta = VISUAL_STYLES.find((s) => s.id === rec.meta.visualStyleId);
                const isEditing = editingId === rec.data.id;
                const isDeleting = deletingId === rec.data.id;

                const formattedDate = new Date(rec.meta.updatedAt || rec.meta.createdAt).toLocaleString(
                  'ru-RU',
                  {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                return (
                  <div
                    key={rec.data.id}
                    className={`relative rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 group ${
                      isCurrentActive
                        ? 'bg-neutral-900 border-amber-500/60 ring-2 ring-amber-500/20 shadow-lg'
                        : 'bg-neutral-950/80 hover:bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Top Row: Style & Active Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-amber-300 border border-neutral-700 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-400" />
                          <span>{styleMeta?.nameRu.split('(')[0] || 'Стиль'}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono">
                          {rec.meta.slidesCount || rec.data.slides.length || 10} слайдов
                        </span>

                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Активный</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <span
                          className={`font-bold ${
                            rec.meta.qualityScore >= 90 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {rec.meta.qualityScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Content: Title / Topic & Hook */}
                    <div className="space-y-1.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(rec.data.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-amber-500 text-white text-xs font-bold focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(rec.data.id)}
                            className="p-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400"
                            title="Сохранить"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                            title="Отмена"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="text-sm font-bold text-white hover:text-amber-300 transition-colors line-clamp-2 cursor-pointer"
                            onClick={() => {
                              onSelectProject(rec.data);
                              onClose();
                            }}
                          >
                            {rec.meta.topic || rec.data.topic}
                          </h3>
                          <button
                            onClick={() => handleStartRename(rec)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-neutral-200 transition-opacity"
                            title="Переименовать проект"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-neutral-400 line-clamp-2 italic font-serif">
                        «{rec.meta.coverTitle || rec.data.slides[0]?.title}»
                      </p>
                    </div>

                    {/* Footer Row: Date & Actions */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{formattedDate}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-red-950/80 border border-red-800/80 rounded-lg p-1 animate-fade-in">
                            <span className="text-[10px] text-red-300 font-mono pl-1">Удалить?</span>
                            <button
                              onClick={() => handleDelete(rec.data.id)}
                              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold"
                            >
                              Да
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white text-[10px]"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDuplicate(rec.data.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Дублировать проект"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingId(rec.data.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                              title="Удалить проект"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                onSelectProject(rec.data);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-sm ${
                                isCurrentActive
                                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                              }`}
                            >
                              <span>{isCurrentActive ? 'В работе' : 'Открыть'}</span>
                              <span>→</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
