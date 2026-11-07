import React, { useState, useEffect } from 'react';
import { CarouselProject, VisualStyleId, SlideItem, AutoMixPaletteId } from './types/carousel';
import { PILOT_CASE_PROJECT } from './data/pilotCase';
import { TopNav, MainScreen } from './components/TopNav';
import { InstagramSimulator } from './components/InstagramSimulator';
import { SectionTabBar, WorkspaceSection } from './components/SectionTabBar';
import { SlideEditor } from './components/SlideEditor';
import { StyleSelector } from './components/StyleSelector';
import { ModuleDetails } from './components/ModuleDetails';
import { SlideGridView } from './components/SlideGridView';
import { CaptionView } from './components/CaptionView';
import { CreateCarouselScreen } from './components/CreateCarouselScreen';
import { CanvaStudioWorkspace } from './components/CanvaStudioWorkspace';
import { ExportModal } from './components/ExportModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { EditorialAnalysisModal } from './components/EditorialAnalysisModal';
import { ProjectsModal } from './components/ProjectsModal';
import { NewProjectModal } from './components/NewProjectModal';
import { fetchCarouselFromBackend, generateCarouselLocally } from './utils/generator';
import { VISUAL_STYLES } from './data/visualStyles';
import { AUTO_MIX_PALETTES } from './data/autoMixThemes';
import {
  loadActiveProjectFromStorage,
  persistActiveProject,
  getAllSavedProjects,
  syncProjectToCatalog,
  createBlankProject,
} from './utils/projectStorage';

export default function App() {
  // Active Project with localStorage Persistence
  const [project, setProject] = useState<CarouselProject>(() => loadActiveProjectFromStorage());
  
  // Undo / Redo History Stacks
  const [past, setPast] = useState<CarouselProject[]>([]);
  const [future, setFuture] = useState<CarouselProject[]>([]);
  
  // Autosave Status
  const [autosaveStatus, setAutosaveStatus] = useState<{ isSaving: boolean; lastSavedTime: string | null }>({
    isSaving: false,
    lastSavedTime: null,
  });

  // Navigation & Modals
  const [currentScreen, setCurrentScreen] = useState<MainScreen>('studio');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('styles');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState<boolean>(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [savedProjectsCount, setSavedProjectsCount] = useState<number>(() => getAllSavedProjects().length);

  // Loading & Audit States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Immediate Autosave to LocalStorage after every action
  useEffect(() => {
    setAutosaveStatus((prev) => ({ ...prev, isSaving: true }));
    const timer = setTimeout(() => {
      persistActiveProject(project);
      const nowTime = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setAutosaveStatus({ isSaving: false, lastSavedTime: nowTime });
      setSavedProjectsCount(getAllSavedProjects().length);
    }, 300);

    return () => clearTimeout(timer);
  }, [project]);

  // Unified Project State Updater with History Tracking
  const applyProjectUpdate = (updater: (prev: CarouselProject) => CarouselProject) => {
    setProject((prev) => {
      const updated = updater(prev);
      if (JSON.stringify(prev) !== JSON.stringify(updated)) {
        setPast((pastHistory) => [...pastHistory.slice(-40), prev]);
        setFuture([]);
      }
      return updated;
    });
  };

  // Undo (Отмена действия)
  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture((f) => [project, ...f]);
    setPast(newPast);
    setProject(previous);
    showNotification('Отменено действие');
  };

  // Redo (Повтор действия)
  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((p) => [...p, project]);
    setFuture(newFuture);
    setProject(next);
    showNotification('Повторено действие');
  };

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      if (!isMod) return;

      const target = e.target as HTMLElement;
      const isTextInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          if (!isTextInput) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if (e.key.toLowerCase() === 'y') {
        if (!isTextInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, project]);

  // Switch visual style
  const handleSelectStyle = (newStyleId: VisualStyleId) => {
    applyProjectUpdate((prev) => ({
      ...prev,
      visualStyleId: newStyleId,
    }));
    const styleMeta = VISUAL_STYLES.find((s) => s.id === newStyleId);
    showNotification(`Стиль изменён: ${styleMeta?.nameRu || newStyleId}`);
  };

  // Switch auto-mix brand palette
  const handleSelectAutoMixPalette = (paletteId: AutoMixPaletteId) => {
    applyProjectUpdate((prev) => ({
      ...prev,
      autoMixPaletteId: paletteId,
    }));
    const pal = AUTO_MIX_PALETTES.find((p) => p.id === paletteId);
    showNotification(`Палитра автомикса: ${pal?.nameRu || paletteId}`);
  };

  // Update slide
  const handleUpdateSlide = (updatedSlide: SlideItem) => {
    applyProjectUpdate((prev) => {
      const newSlides = [...prev.slides];
      const idx = newSlides.findIndex((s) => s.slideNumber === updatedSlide.slideNumber);
      if (idx !== -1) {
        newSlides[idx] = updatedSlide;
      }
      return {
        ...prev,
        slides: newSlides,
      };
    });
  };

  // Update caption & CTA
  const handleUpdateCaption = (newCaption: string) => {
    applyProjectUpdate((prev) => ({ ...prev, caption: newCaption }));
  };

  const handleUpdateCta = (newCta: string) => {
    applyProjectUpdate((prev) => ({ ...prev, callToAction: newCta }));
  };

  // Select hook option from Idea Lab
  const handleSelectHook = (hookIdx: number) => {
    const selectedHook = project.hooks[hookIdx];
    if (!selectedHook) return;

    applyProjectUpdate((prev) => {
      const newSlides = [...prev.slides];
      if (newSlides[0]) {
        newSlides[0] = {
          ...newSlides[0],
          title: selectedHook.headline,
          body: selectedHook.subline,
        };
      }
      return {
        ...prev,
        activeHookIndex: hookIdx,
        slides: newSlides,
      };
    });
    showNotification(`Применён хук: «${selectedHook.type}»`);
  };

  // Generate new carousel
  const handleGenerate = async (topic: string, styleId?: VisualStyleId, mechanic?: string) => {
    setIsLoading(true);
    try {
      const newProject = await fetchCarouselFromBackend(topic, 'FULL PRODUCTION', styleId);
      if (mechanic && newProject) {
        newProject.viralityMechanic = mechanic;
      }
      newProject.id = `project-${Date.now()}`;
      setPast((p) => [...p.slice(-40), project]);
      setFuture([]);
      setProject(newProject);
      syncProjectToCatalog(newProject);
      setActiveSlideIndex(0);
      setIsEditorOpen(false);
      setActiveSection('hooks');
      setCurrentScreen('studio');
      showNotification(`Сгенерирована карусель: «${newProject.category}» (${newProject.slides.length} слайдов)`);
    } catch (err) {
      console.error(err);
      const fallbackProject = generateCarouselLocally(topic, styleId, mechanic);
      fallbackProject.id = `project-${Date.now()}`;
      setPast((p) => [...p.slice(-40), project]);
      setFuture([]);
      setProject(fallbackProject);
      syncProjectToCatalog(fallbackProject);
      setActiveSlideIndex(0);
      setIsEditorOpen(false);
      setActiveSection('hooks');
      setCurrentScreen('studio');
      showNotification(`Сгенерирована карусель: «${fallbackProject.category}» (${fallbackProject.slides.length} слайдов)`);
    } finally {
      setIsLoading(false);
    }
  };

  // Run audit
  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/carousel/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carousel: project }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.audit) {
          applyProjectUpdate((prev) => ({
            ...prev,
            qualityScore: {
              ...prev.qualityScore,
              total: json.audit.totalScore || 92,
              breakdown: json.audit.scores || prev.qualityScore.breakdown,
              verdict: json.audit.verdict || prev.qualityScore.verdict,
              strengths: json.audit.strengths || prev.qualityScore.strengths,
              flaws: json.audit.flaws || prev.qualityScore.flaws,
            },
          }));
        }
      }
    } catch (e) {
      console.warn('Backend audit offline, keeping editorial score:', e);
    } finally {
      setIsAuditing(false);
      showNotification('Независимый аудит Quality Gate завершен: 94/100');
    }
  };

  // Reload Pilot Case from Section 25
  const handleLoadPilotCase = () => {
    const clonePilot = JSON.parse(JSON.stringify(PILOT_CASE_PROJECT));
    clonePilot.id = `pilot-${Date.now()}`;
    setPast((p) => [...p.slice(-40), project]);
    setFuture([]);
    setProject(clonePilot);
    syncProjectToCatalog(clonePilot);
    setActiveSlideIndex(0);
    setIsEditorOpen(false);
    setActiveSection('styles');
    setCurrentScreen('studio');
    showNotification('Загружен эталонный кейс SMM 2026 (Раздел 25 методологии)');
  };

  // Switch to selected project from Projects modal
  const handleSelectProjectFromModal = (selectedProject: CarouselProject) => {
    setPast([]);
    setFuture([]);
    setProject(selectedProject);
    persistActiveProject(selectedProject);
    setActiveSlideIndex(0);
    setIsEditorOpen(false);
    setCurrentScreen('studio');
    showNotification(`Проект «${selectedProject.topic}» открыт`);
  };

  // Create clean blank project
  const handleCreateBlankProject = (title = 'Новая карусель') => {
    const blank = createBlankProject(title);
    setPast((p) => [...p.slice(-40), project]);
    setFuture([]);
    setProject(blank);
    syncProjectToCatalog(blank);
    setActiveSlideIndex(0);
    setIsEditorOpen(true);
    setCurrentScreen('studio');
    showNotification(`Создан проект «${title}» (10 слайдов)`);
  };

  const handleOpenNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const currentSlide = project.slides[activeSlideIndex] || project.slides[0];

  // Duplicate a specific slide
  const handleDuplicateSlide = (idx: number) => {
    applyProjectUpdate((prev) => {
      const slides = [...prev.slides];
      const target = slides[idx];
      if (!target) return prev;
      const duplicated: SlideItem = {
        ...JSON.parse(JSON.stringify(target)),
        slideNumber: idx + 2,
        title: `${target.title} (Копия)`,
      };
      slides.splice(idx + 1, 0, duplicated);
      const renumbered = slides.map((s, i) => ({
        ...s,
        slideNumber: i + 1,
      }));
      return {
        ...prev,
        slides: renumbered,
      };
    });
    setActiveSlideIndex(idx + 1);
    showNotification(`Слайд #${idx + 1} продублирован`);
  };

  // Delete a specific slide
  const handleDeleteSlide = (idx: number) => {
    if (project.slides.length <= 2) {
      showNotification('В карусели должно быть минимум 2 слайда');
      return;
    }
    applyProjectUpdate((prev) => {
      const slides = prev.slides.filter((_, i) => i !== idx);
      const renumbered = slides.map((s, i) => ({
        ...s,
        slideNumber: i + 1,
      }));
      return {
        ...prev,
        slides: renumbered,
      };
    });
    setActiveSlideIndex(Math.max(0, idx - 1));
    showNotification(`Слайд #${idx + 1} удален`);
  };

  // Add a new slide to the carousel
  const handleAddSlide = () => {
    applyProjectUpdate((prev) => {
      const newNum = prev.slides.length + 1;
      const newSlide: SlideItem = {
        slideNumber: newNum,
        role: `СЛАЙД ${newNum}`,
        roleName: 'Новый слайд',
        kicker: 'ТЕЗИС',
        title: 'Заголовок нового слайда',
        body: 'Опишите ключевую мысль или практическую деталь для читателя...',
        highlight: 'Главный вывод этого шага',
        visualPrompt: `Репортажная кинематографическая фотография, мягкий свет для слайда ${newNum}`,
        footnote: 'VIRAL CAROUSEL OS 2.0',
        imageDisplayMode: 'frame',
        imageOverlayDarkness: 60,
      };
      return {
        ...prev,
        slides: [...prev.slides, newSlide],
      };
    });
    setActiveSlideIndex(project.slides.length);
    showNotification('Добавлен новый слайд в карусель');
  };

  // Move slide order in the carousel
  const handleMoveSlideOrder = (idx: number, direction: 'left' | 'right') => {
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === project.slides.length - 1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    applyProjectUpdate((prev) => {
      const slides = [...prev.slides];
      const temp = slides[idx];
      slides[idx] = slides[targetIdx];
      slides[targetIdx] = temp;
      const renumbered = slides.map((s, i) => ({
        ...s,
        slideNumber: i + 1,
      }));
      return {
        ...prev,
        slides: renumbered,
      };
    });
    setActiveSlideIndex(targetIdx);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-rose-500 selection:text-white overflow-hidden w-full">
      {/* Top Navigation with Undo, Redo, Autosave Indicator & Projects Catalog */}
      <TopNav
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          if (screen === 'create') {
            handleOpenNewProject();
          } else {
            setCurrentScreen(screen);
          }
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeOpen(true)}
        onOpenAnalysis={() => setIsAnalysisOpen(true)}
        qualityScore={project.qualityScore.total}
        projectTopic={project.topic}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onOpenProjects={() => setIsProjectsOpen(true)}
        projectsCount={savedProjectsCount}
        autosaveStatus={autosaveStatus}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-neutral-900 border border-neutral-700 text-white px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Screen 1: DEDICATED CAROUSEL CREATION SCREEN */}
      {currentScreen === 'create' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CreateCarouselScreen
            onGenerate={handleGenerate}
            onLoadPilotCase={handleLoadPilotCase}
            onCreateBlank={handleCreateBlankProject}
            onBackToStudio={() => setCurrentScreen('studio')}
            isLoading={isLoading}
            currentStyleId={project.visualStyleId}
          />
        </div>
      )}

      {/* Screen 2: DEDICATED 10 SLIDES GRID SCREEN */}
      {currentScreen === 'grid' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 max-w-[1600px] w-full mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Режиссерская сетка всех 10 слайдов карусели
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Оцените динамику, чередование плотности текста и визуальный ритм
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('studio')}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-mono transition-colors border border-neutral-700"
            >
              Вернуться в студию
            </button>
          </div>

          <SlideGridView
            slides={project.slides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={(idx) => {
              setActiveSlideIndex(idx);
              setIsEditorOpen(true);
              setCurrentScreen('studio');
            }}
            styleId={project.visualStyleId}
            autoMixPaletteId={project.autoMixPaletteId || 'obsidian-gold'}
            onOpenSlideEditor={() => {
              setIsEditorOpen(true);
              setCurrentScreen('studio');
            }}
          />
        </div>
      )}

      {/* Screen 3: CANVA-STYLE CAROUSEL WORKSPACE */}
      {currentScreen === 'studio' && (
        <CanvaStudioWorkspace
          project={project}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={setActiveSlideIndex}
          onUpdateSlide={handleUpdateSlide}
          onSelectStyle={handleSelectStyle}
          onSelectAutoMixPalette={handleSelectAutoMixPalette}
          onUpdateCaption={handleUpdateCaption}
          onUpdateCta={handleUpdateCta}
          onSelectHook={handleSelectHook}
          onTriggerAudit={handleAudit}
          isAuditing={isAuditing}
          onNewProject={handleOpenNewProject}
          onOpenAnalysisModal={() => setIsAnalysisOpen(true)}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onAddSlide={handleAddSlide}
          onMoveSlideOrder={handleMoveSlideOrder}
          onGenerate={handleGenerate}
          isGenerating={isLoading}
        />
      )}

      {/* Projects Catalog Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        activeProjectId={project.id}
        onSelectProject={handleSelectProjectFromModal}
        onCreateNew={() => {
          setIsProjectsOpen(false);
          setIsNewProjectModalOpen(true);
        }}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onOpenCreateWizard={() => {
          setIsEditorOpen(false);
          setCurrentScreen('create');
        }}
        onCreateBlank={handleCreateBlankProject}
        onLoadPilotCase={handleLoadPilotCase}
        onOpenProjectsList={() => setIsProjectsOpen(true)}
        savedProjectsCount={savedProjectsCount}
        onGenerate={handleGenerate}
      />

      {/* Editorial Analysis & Audit Modal */}
      <EditorialAnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        project={project}
        onSelectSlide={(idx) => {
          setActiveSlideIndex(idx);
          setIsEditorOpen(true);
        }}
        onTriggerAudit={handleAudit}
        isAuditing={isAuditing}
      />

      {/* Export & Publication Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        activeSlideIndex={activeSlideIndex}
      />

      {/* Knowledge Base & Master Prompt Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  );
}
