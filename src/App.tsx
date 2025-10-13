import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { Dashboard } from './components/Dashboard';
import { LoginScreen, type UserProfile } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import {
  QUINIELA_STORAGE_KEY,
  createEmptySelections,
  type QuinielaSelections,
  type QuinielaSubmission,
  type Selection,
} from './quiniela/config';

// Definición centralizada de la jornada mostrada
const CURRENT_JOURNEY = 15;

// Carga lazy del componente principal para mejorar performance
const AperturaJornada15 = lazy(() => import('./imports/AperturaJornada15'));

type StoredSubmissions = Record<string, QuinielaSubmission | (Omit<QuinielaSubmission, 'journey'> & { journey?: number })>;

const readStoredSubmissions = (): StoredSubmissions => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(QUINIELA_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as StoredSubmissions;
  } catch (error) {
    console.error('No se pudieron leer las quinielas almacenadas', error);
    return {};
  }
};

const loadSubmissionForUser = (email: string): QuinielaSubmission | null => {
  const submissions = readStoredSubmissions();
  const submission = submissions[email];

  if (!submission || submission.journey !== CURRENT_JOURNEY) {
    return null;
  }

  return submission;
};

const persistSubmissionForUser = (email: string, submission: QuinielaSubmission) => {
  if (typeof window === 'undefined') {
    return;
  }

  const submissions = readStoredSubmissions();
  submissions[email] = submission;
  window.localStorage.setItem(QUINIELA_STORAGE_KEY, JSON.stringify(submissions));
};

// Componente de loading simple
function LoadingSpinner() {
  return (
    <div className="w-[1080px] h-[1080px] flex items-center justify-center bg-gradient-to-br from-blue-600 via-green-500 to-yellow-400">
      <div className="text-white text-2xl font-bold animate-pulse">
        {`Cargando Jornada ${CURRENT_JOURNEY}...`}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'quiniela'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<QuinielaSelections>(() => createEmptySelections());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const completedSelections = useMemo(
    () => Object.values(quinielaSelections).filter((value): value is Selection => value !== null).length,
    [quinielaSelections]
  );
  const totalMatches = useMemo(() => Object.keys(quinielaSelections).length, [quinielaSelections]);
  const isSubmitDisabled = isSaving || completedSelections < totalMatches || isReadOnlyView;
  const showToast = useCallback((message: string, tone: 'success' | 'error') => {
    if (typeof window === 'undefined') {
      setToast({ message, tone });
      return;
    }

    setToast({ message, tone });

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setQuinielaSelections(createEmptySelections());
      setLastSubmittedAt(null);
      setSaveError(null);
      setToast(null);
      setIsReadOnlyView(false);
      return;
    }

    const stored = loadSubmissionForUser(user.email);
    if (stored) {
      setQuinielaSelections({ ...stored.selections });
      setLastSubmittedAt(stored.submittedAt);
    } else {
      setQuinielaSelections(createEmptySelections());
      setLastSubmittedAt(null);
    }

    setSaveError(null);
    setIsReadOnlyView(false);
  }, [user, createEmptySelections]);

  const handleDownload = useCallback(async () => {
    const node = canvasRef.current;
    const shell = canvasShellRef.current;

    if (!node || !shell || isDownloading) {
      return;
    }

    const previousScale = shell.style.getPropertyValue('--canvas-scale');

    try {
      setIsDownloading(true);

      shell.setAttribute('data-exporting', 'true');
      shell.style.setProperty('--canvas-scale', '1');

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (typeof document !== 'undefined' && 'fonts' in document) {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
      }

      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        width: 1080,
        height: 1080,
        canvasWidth: 1080,
        canvasHeight: 1080,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `jornada-${CURRENT_JOURNEY}.jpg`;
      link.click();
    } catch (error) {
      console.error('Error al exportar la imagen como JPG', error);
      window.alert('No se pudo descargar la imagen. Revisa la consola para más detalles.');
    } finally {
      shell.removeAttribute('data-exporting');

      if (previousScale) {
        shell.style.setProperty('--canvas-scale', previousScale);
      } else {
        shell.style.removeProperty('--canvas-scale');
      }

      setIsDownloading(false);
    }
  }, [isDownloading]);

  const handleSignOut = useCallback(() => {
    setIsDownloading(false);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(null);
    setSaveError(null);
    setIsSaving(false);
    setToast(null);
    setIsShareOpen(false);
    setIsReadOnlyView(false);
    setUser(null);
    setView('dashboard');
  }, [createEmptySelections]);

  const handleBackToDashboard = useCallback(() => {
    setIsDownloading(false);
    setView('dashboard');
    setIsReadOnlyView(false);
  }, []);

  const handleEnterQuiniela = useCallback(() => {
    setView('quiniela');
    setIsReadOnlyView(false);
  }, []);

  const handleSelectionChange = useCallback(
    (matchId: string, value: Selection) => {
      if (isReadOnlyView) {
        return;
      }

      setQuinielaSelections((prev) => ({ ...prev, [matchId]: value }));
      setSaveError(null);
    },
    [isReadOnlyView]
  );

  const handleSubmitQuiniela = useCallback(() => {
    if (isReadOnlyView) {
      showToast('Esta quiniela es de solo lectura.', 'error');
      return;
    }

    if (!user) {
      setSaveError('Inicia sesión para enviar tu quiniela.');
      showToast('Inicia sesión para enviar tu quiniela.', 'error');
      return;
    }

    if (completedSelections < totalMatches) {
      setSaveError('Completa todos los partidos antes de enviar.');
      showToast('Completa todos los partidos antes de enviar.', 'error');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const submission: QuinielaSubmission = {
      user,
      selections: { ...quinielaSelections },
      submittedAt: new Date().toISOString(),
      journey: CURRENT_JOURNEY,
    };

    try {
      persistSubmissionForUser(user.email, submission);
      setLastSubmittedAt(submission.submittedAt);
      showToast('Pronóstico enviado correctamente.', 'success');
    } catch (error) {
      console.error('Error al guardar la quiniela', error);
      setSaveError('No se pudo guardar tu quiniela. Intenta de nuevo.');
      showToast('No se pudo guardar tu quiniela. Intenta de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [user, completedSelections, totalMatches, quinielaSelections, showToast, isReadOnlyView]);

  const handleViewSubmission = useCallback(
    (journeyCode: string) => {
      if (!user) {
        showToast('Inicia sesión para ver la quiniela.', 'error');
        return;
      }

      const journeyNumber = parseInt(journeyCode.replace(/\D/g, ''), 10);
      const stored = loadSubmissionForUser(user.email);

      if (!stored || Number.isNaN(journeyNumber) || stored.journey !== journeyNumber) {
        showToast('No encontramos esa quiniela guardada.', 'error');
        return;
      }

      setQuinielaSelections({ ...stored.selections });
      setLastSubmittedAt(stored.submittedAt);
      setIsReadOnlyView(true);
      setView('quiniela');
      setSaveError(null);
    },
    [user, showToast]
  );

  const handleShareOpen = useCallback(() => {
    if (typeof document !== 'undefined') {
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        shareDialogRef.current?.focus();
      });
    }

    setIsShareOpen(true);
  }, []);

  const handleShareClose = useCallback(() => {
    setIsShareOpen(false);
    if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
      lastFocusedElementRef.current = null;
    }
  }, []);

  const handleShareSelect = useCallback(
    (channel: 'whatsapp' | 'instagram') => {
      const messages: Record<typeof channel, string> = {
        whatsapp: 'Listo, abre WhatsApp para compartir.',
        instagram: 'Listo, usa Instagram Stories para compartir.',
      };

      showToast(messages[channel], 'success');
      handleShareClose();
    },
    [handleShareClose, showToast]
  );

  if (!user) {
    return (
      <LoginScreen
        onLogin={(profile) => {
          setUser(profile);
          setView('dashboard');
        }}
      />
    );
  }

  const currentView = view;
  const toastBanner = toast ? (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast--${toast.tone}`}>
        {toast.message}
      </div>
    </div>
  ) : null;
  const quinielaView = (
    <div className="quiniela-surface">
      <div className="download-wrapper">
        <div className="canvas-toolbar">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="download-button back-button font-['Albert_Sans:Bold',_sans-serif]"
          >
            <span className="button-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
                <line x1="9" y1="12" x2="21" y2="12" />
              </svg>
            </span>
            Regresar
          </button>
          <div className="canvas-toolbar__actions">
            <button
              type="button"
              onClick={handleShareOpen}
              className="icon-button share-icon"
              aria-label="Compartir"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="icon-button download-icon"
              aria-label={isDownloading ? 'Generando JPG' : 'Descargar JPG'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {saveError ? (
          <span className="submission-status submission-status--error canvas-toolbar__error">{saveError}</span>
        ) : null}

        <div ref={canvasShellRef} className="canvas-shell">
          <div className="canvas-stage">
            <div
              ref={canvasRef}
              className="canvas-wrapper"
            >
              <Suspense fallback={<LoadingSpinner />}>
                <AperturaJornada15
                  selections={quinielaSelections}
                  onSelect={handleSelectionChange}
                  isReadOnly={isReadOnlyView}
                />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="canvas-actions">
          <div className="canvas-actions__buttons">
            <button
              type="button"
              onClick={handleSubmitQuiniela}
              disabled={isSubmitDisabled}
              className="download-button submit-button font-['Albert_Sans:Bold',_sans-serif]"
            >
              {isSaving ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isShareOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={handleShareClose}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            onClick={(event) => event.stopPropagation()}
            ref={shareDialogRef}
            tabIndex={-1}
          >
            <div className="modal__header">
              <h2 id="share-title">Compartir pronóstico</h2>
              <button type="button" className="modal__close" onClick={handleShareClose} aria-label="Cerrar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="modal__subtitle">Selecciona dónde quieres compartir tu quiniela.</p>
            <div className="share-grid">
              <button
                type="button"
                className="share-target share-target--whatsapp"
                onClick={() => handleShareSelect('whatsapp')}
                aria-label="Compartir en WhatsApp"
              >
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M20.46 3.54A11.82 11.82 0 0 0 12 .5 11.94 11.94 0 0 0 .06 12.05a11.8 11.8 0 0 0 1.6 5.94L.1 23.5l5.7-1.48a11.9 11.9 0 0 0 5.63 1.43h.01A11.94 11.94 0 0 0 12 0h.05a11.9 11.9 0 0 0 8.41-3.54ZM12.06 21.4a10 10 0 0 1-5.1-1.4l-.36-.21-3.38.88.9-3.29-.23-.34a10 10 0 1 1 8.18 4.36Zm5.49-7.56c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.76.97-.93 1.17-.34.22-.64.07a8.14 8.14 0 0 1-2.39-1.48 9.17 9.17 0 0 1-1.69-2.12c-.18-.3 0-.46.13-.61s.3-.34.45-.52a2 2 0 0 0 .3-.52.57.57 0 0 0-.02-.54c-.07-.15-.67-1.6-.92-2.2s-.49-.5-.67-.51H8.4a1.12 1.12 0 0 0-.8.37 3.26 3.26 0 0 0-1 2.44 5.68 5.68 0 0 0 1.17 3.02 12.9 12.9 0 0 0 4.79 4.74 16.3 16.3 0 0 0 1.57.72 3.78 3.78 0 0 0 1.74.11 2.84 2.84 0 0 0 1.86-1.3 2.3 2.3 0 0 0 .16-1.3c-.07-.11-.27-.18-.57-.33Z" />
                </svg>
              </button>
              <button
                type="button"
                className="share-target share-target--instagram"
                onClick={() => handleShareSelect('instagram')}
                aria-label="Compartir en Instagram Stories"
              >
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M12 7.09A4.91 4.91 0 1 0 16.91 12 4.91 4.91 0 0 0 12 7.09Zm0 8.07A3.16 3.16 0 1 1 15.16 12 3.16 3.16 0 0 1 12 15.16Zm6.23-8.41a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15Zm3.27 1.17a5.69 5.69 0 0 0-1.56-4 5.73 5.73 0 0 0-4-1.56c-1.58-.09-6.32-.09-7.9 0a5.72 5.72 0 0 0-4 1.56 5.69 5.69 0 0 0-1.56 4c-.09 1.58-.09 6.32 0 7.9a5.69 5.69 0 0 0 1.56 4 5.73 5.73 0 0 0 4 1.56c1.58.09 6.32.09 7.9 0a5.69 5.69 0 0 0 4-1.56 5.69 5.69 0 0 0 1.56-4c.09-1.58.09-6.31 0-7.89ZM20.57 18a3.38 3.38 0 0 1-1.9 1.9c-1.32.52-4.44.4-5.67.4s-4.36.11-5.67-.4A3.38 3.38 0 0 1 5.43 18c-.52-1.32-.4-4.44-.4-5.67s-.11-4.36.4-5.67a3.38 3.38 0 0 1 1.9-1.9c1.32-.52 4.44-.4 5.67-.4s4.36-.11 5.67.4a3.38 3.38 0 0 1 1.9 1.9c.52 1.32.4 4.44.4 5.67s.11 4.37-.4 5.67Z" />
                </svg>
              </button>
            </div>
            <button type="button" className="modal__secondary" onClick={handleShareClose}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      {toastBanner}
      {view === 'dashboard' ? (
        <div className="dashboard-page">
          <Navbar
            user={user}
            currentView={currentView}
            onNavigateToDashboard={handleBackToDashboard}
            onNavigateToQuiniela={handleEnterQuiniela}
            onSignOut={handleSignOut}
          />
          <Dashboard user={user} onEnterQuiniela={handleEnterQuiniela} onViewQuiniela={handleViewSubmission} />
        </div>
      ) : (
        quinielaView
      )}
    </>
  );
}
