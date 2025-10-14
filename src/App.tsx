import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ClipboardCheck, Instagram, MessageCircle } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toPng } from 'html-to-image';
import { Dashboard } from './components/Dashboard';
import { LoginScreen, type UserProfile } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { PodiumPage } from './components/PodiumPage';
import {
  QUINIELA_STORAGE_KEY,
  createEmptySelections,
  type QuinielaSelections,
  type QuinielaSubmission,
  type Selection,
} from './quiniela/config';
import { firebaseAuth } from './firebase';

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
  const [view, setView] = useState<'dashboard' | 'quiniela' | 'podium'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const canvasShellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isClipboardImageSupported, setIsClipboardImageSupported] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<QuinielaSelections>(() => createEmptySelections());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const submitTooltipTimeoutRef = useRef<number | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [showSelectionErrors, setShowSelectionErrors] = useState(false);
  const [showSubmitTooltip, setShowSubmitTooltip] = useState(false);
  const completedSelections = useMemo(
    () => Object.values(quinielaSelections).filter((value): value is Selection => value !== null).length,
    [quinielaSelections]
  );
  const totalMatches = useMemo(() => Object.keys(quinielaSelections).length, [quinielaSelections]);
  const needsMoreSelections = completedSelections < totalMatches;
  const isSubmitDisabled = isSaving || isReadOnlyView;
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
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName?.trim();
        const email = firebaseUser.email ?? '';
        const fallbackName = email ? email.split('@')[0] : 'Participante';
        setUser({
          name: displayName && displayName.length > 0 ? displayName : fallbackName,
          email,
          role: 'aficion',
        });
        setView((current) => (current === 'quiniela' || current === 'podium' ? current : 'dashboard'));
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setIsClipboardImageSupported(false);
      return;
    }

    const supported = typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write);
    setIsClipboardImageSupported(supported);
  }, []);

  const hideSubmitTooltip = useCallback(() => {
    if (typeof window !== 'undefined' && submitTooltipTimeoutRef.current) {
      window.clearTimeout(submitTooltipTimeoutRef.current);
      submitTooltipTimeoutRef.current = null;
    }
    setShowSubmitTooltip(false);
  }, []);

  const triggerSubmitTooltip = useCallback(() => {
    if (typeof window === 'undefined') {
      setShowSubmitTooltip(true);
      return;
    }

    hideSubmitTooltip();
    setShowSubmitTooltip(true);
    submitTooltipTimeoutRef.current = window.setTimeout(() => {
      setShowSubmitTooltip(false);
      submitTooltipTimeoutRef.current = null;
    }, 2600);
  }, [hideSubmitTooltip]);

  useEffect(() => () => hideSubmitTooltip(), [hideSubmitTooltip]);

  useEffect(() => {
    if (!user) {
      setQuinielaSelections(createEmptySelections());
      setLastSubmittedAt(null);
      setSaveError(null);
      setToast(null);
      setIsReadOnlyView(false);
      setShowSelectionErrors(false);
      hideSubmitTooltip();
      return;
    }

    const stored = loadSubmissionForUser(user.email);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(stored?.submittedAt ?? null);
    setSaveError(null);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [user, createEmptySelections, hideSubmitTooltip]);

  const exportQuinielaSnapshot = useCallback(async () => {
    const node = canvasRef.current;

    if (!node) {
      throw new Error('No se encontró el contenedor de la quiniela para exportar.');
    }

    const waitForFonts = async () => {
      if (typeof document === 'undefined') {
        return;
      }

      const fontFaceSet = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (!fontFaceSet) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return;
      }

      try {
        await Promise.all([
          fontFaceSet.load('400 16px "Antonio"'),
          fontFaceSet.load('700 16px "Antonio"'),
          fontFaceSet.load('400 16px "Albert Sans"'),
          fontFaceSet.load('700 16px "Barlow Condensed"'),
        ]);
        await fontFaceSet.ready;
      } catch (error) {
        console.warn('No se pudieron precargar todas las fuentes antes de exportar.', error);
      }
    };

    const waitForImages = async (root: HTMLElement) => {
      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth !== 0) {
            return Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            const handleResolve = () => {
              img.removeEventListener('load', handleResolve);
              img.removeEventListener('error', handleResolve);
              resolve();
            };
            img.addEventListener('load', handleResolve, { once: true });
            img.addEventListener('error', handleResolve, { once: true });
          });
        })
      );
    };

    let sandbox: HTMLDivElement | null = null;

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await waitForFonts();

      const clone = node.cloneNode(true) as HTMLElement;
      clone.style.position = 'static';
      clone.style.transform = 'scale(1)';
      clone.style.width = '1080px';
      clone.style.height = '1080px';
      clone.style.borderRadius = '0';

      if (typeof window !== 'undefined') {
        const computed = window.getComputedStyle(node);
        clone.style.background = computed.background || '#fafaf9';
        clone.style.backgroundColor = computed.backgroundColor || '#fafaf9';
        clone.style.backgroundImage = computed.backgroundImage;
        clone.style.backgroundSize = computed.backgroundSize;
        clone.style.backgroundPosition = computed.backgroundPosition;
        clone.style.backgroundRepeat = computed.backgroundRepeat;
        clone.style.fontFamily = computed.fontFamily;
      }

      sandbox = document.createElement('div');
      sandbox.style.position = 'fixed';
      sandbox.style.left = '-9999px';
      sandbox.style.top = '0';
      sandbox.style.width = '1080px';
      sandbox.style.height = '1080px';
      sandbox.style.zIndex = '-1';
      sandbox.appendChild(clone);
      document.body.appendChild(sandbox);

      await waitForImages(clone);

      const pngDataUrl = await toPng(clone, {
        width: 1080,
        height: 1080,
        canvasWidth: 1080,
        canvasHeight: 1080,
        pixelRatio: 2,
        backgroundColor: '#fafaf9',
        cacheBust: true,
        useCORS: true,
      });

      const image = new Image();
      image.crossOrigin = 'anonymous';
      const imageLoaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = (event) => reject(event);
      });
      image.src = pngDataUrl;
      await imageLoaded;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1080;
      exportCanvas.height = 1080;
      const context = exportCanvas.getContext('2d');
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas para exportar.');
      }
      context.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob((result) => resolve(result), 'image/jpeg', 0.98)
      );

      if (!blob) {
        throw new Error('No se pudo generar el archivo JPEG.');
      }

      return blob;
    } finally {
      if (sandbox && sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const blob = await exportQuinielaSnapshot();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `jornada-${CURRENT_JOURNEY}.jpg`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error al exportar la imagen como JPG', error);
      window.alert('No se pudo descargar la imagen. Revisa la consola para más detalles.');
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, exportQuinielaSnapshot]);

  const handleSignOut = useCallback(async () => {
    setIsDownloading(false);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(null);
    setSaveError(null);
    setIsSaving(false);
    setToast(null);
    setIsShareOpen(false);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();

    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('No se pudo cerrar sesión en Firebase', error);
      showToast('No pudimos cerrar sesión. Intenta de nuevo.', 'error');
    }
  }, [createEmptySelections, hideSubmitTooltip, showToast]);

  const handleBackToDashboard = useCallback(() => {
    setIsDownloading(false);
    setView('dashboard');
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [hideSubmitTooltip]);

  const handleEnterQuiniela = useCallback(() => {
    setQuinielaSelections(createEmptySelections());
    setSaveError(null);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    setView('quiniela');
  }, [createEmptySelections, hideSubmitTooltip]);

  const handleEnterPodium = useCallback(() => {
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    setView('podium');
  }, [hideSubmitTooltip]);

  const handleSelectionChange = useCallback(
    (matchId: string, value: Selection) => {
      if (isReadOnlyView) {
        return;
      }

      setQuinielaSelections((prev) => {
        const next = { ...prev, [matchId]: value };
        if (showSelectionErrors || showSubmitTooltip) {
          const allCompleted = Object.values(next).every((selection) => selection !== null);
          if (allCompleted) {
            setShowSelectionErrors(false);
            hideSubmitTooltip();
          }
        }
        return next;
      });
      setSaveError(null);
    },
    [isReadOnlyView, showSelectionErrors, showSubmitTooltip, hideSubmitTooltip]
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

    if (needsMoreSelections) {
      setSaveError('Completa todos los partidos antes de enviar.');
      showToast('Completa todos los partidos antes de enviar.', 'error');
      setShowSelectionErrors(true);
      triggerSubmitTooltip();
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
      setShowSelectionErrors(false);
      hideSubmitTooltip();
      showToast('Pronóstico enviado correctamente.', 'success');
    } catch (error) {
      console.error('Error al guardar la quiniela', error);
      setSaveError('No se pudo guardar tu quiniela. Intenta de nuevo.');
      showToast('No se pudo guardar tu quiniela. Intenta de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [user, needsMoreSelections, quinielaSelections, showToast, isReadOnlyView, triggerSubmitTooltip, hideSubmitTooltip]);

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
      setShowSelectionErrors(false);
      hideSubmitTooltip();
    },
    [user, showToast, hideSubmitTooltip]
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
    async (channel: 'whatsapp' | 'instagram' | 'copy') => {
      if (isSharingImage) {
        return;
      }

      try {
        setIsSharingImage(true);

        const blob = await exportQuinielaSnapshot();
        const fileName = `quiniela-${CURRENT_JOURNEY}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        if (channel === 'copy') {
          if (!isClipboardImageSupported) {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(blobUrl);
            showToast('Tu dispositivo no soporta copiar imágenes. La descargamos para ti.', 'error');
            return;
          }

          try {
            const data = new ClipboardItem({ 'image/jpeg': blob });
            await navigator.clipboard.write([data]);
            showToast('Imagen copiada al portapapeles. Pégala donde quieras.', 'success');
            return;
          } catch (error) {
            console.warn('No se pudo copiar la imagen al portapapeles, usamos descarga como fallback.', error);
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(blobUrl);
            showToast('No pudimos copiar la imagen. La descargamos para que la compartas.', 'error');
            return;
          }
        }

        if (typeof navigator !== 'undefined' && 'canShare' in navigator && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Quiniela Somos Locales',
            text: 'Pronóstico generado con la Quiniela Somos Locales.',
          });
          showToast('Imagen compartida correctamente.', 'success');
        } else if (navigator.clipboard?.write) {
          const data = new ClipboardItem({ 'image/jpeg': blob });
          await navigator.clipboard.write([data]);
          showToast('Imagen copiada al portapapeles. Ábrela en Instagram o WhatsApp y pégala.', 'success');
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(blobUrl);
          showToast('Descargamos la imagen para que la compartas manualmente.', 'success');
        }
      } catch (error) {
        console.error('No se pudo preparar la imagen para compartir', error);
        showToast('No pudimos compartir la imagen. Intenta nuevamente.', 'error');
      } finally {
        setIsSharingImage(false);
        handleShareClose();
      }
    },
    [exportQuinielaSnapshot, handleShareClose, isSharingImage, showToast]
  );

  if (!authReady) {
    return null;
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(_profile) => {
          setView('dashboard');
        }}
      />
    );
  }

  const currentView = view;
  const toastBanner = toast ? (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast--${toast.tone}`}>
        <span className="toast__icon" aria-hidden="true">
          {toast.tone === 'success' ? '✔︎' : '⚠︎'}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  ) : null;
  const quinielaView = (
    <div className="quiniela-surface">
      <div className="canvas-frame">
        <div className="canvas-frame__toolbar">
          <div className="canvas-frame__group">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="icon-button back-button"
              aria-label="Regresar al dashboard"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="canvas-frame__group">
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
          <span className="submission-status submission-status--error canvas-frame__alert">{saveError}</span>
        ) : null}

        <div ref={canvasShellRef} className="canvas-shell">
          <div
            ref={canvasRef}
            className="canvas-wrapper"
          >
            <Suspense fallback={<LoadingSpinner />}>
          <AperturaJornada15
            selections={quinielaSelections}
            onSelect={handleSelectionChange}
            isReadOnly={isReadOnlyView}
            showSelectionErrors={showSelectionErrors}
          />
        </Suspense>
          </div>
        </div>
      </div>

      <div className="canvas-frame__footer">
        <div
          className="submit-button-wrapper"
          data-visible={showSubmitTooltip ? 'true' : undefined}
        >
          <button
            type="button"
            onClick={handleSubmitQuiniela}
            disabled={isSubmitDisabled}
            aria-disabled={needsMoreSelections}
            className="btn btn-primary submit-button"
          >
            {isSaving ? 'Enviando…' : 'Enviar'}
          </button>
          {showSubmitTooltip ? (
            <div className="submit-button-tooltip" role="tooltip">
              Completa la quiniela para continuar
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isShareOpen ? (
        <div className="modal-backdrop modal-backdrop--share" role="presentation" onClick={handleShareClose}>
          <div
            className="modal modal--share"
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
                disabled={isSharingImage}
                aria-busy={isSharingImage}
              >
                <MessageCircle size={24} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="share-target share-target--instagram"
                onClick={() => handleShareSelect('instagram')}
                aria-label="Compartir en Instagram Stories"
                disabled={isSharingImage}
                aria-busy={isSharingImage}
              >
                <Instagram size={24} strokeWidth={1.6} aria-hidden="true" />
              </button>
              {isClipboardImageSupported ? (
                <button
                  type="button"
                  className="share-target share-target--copy"
                  onClick={() => handleShareSelect('copy')}
                  aria-label="Copiar imagen al portapapeles"
                  disabled={isSharingImage}
                  aria-busy={isSharingImage}
                >
                  <ClipboardCheck size={24} strokeWidth={1.6} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {toastBanner}
      {view === 'dashboard' ? (
        <div className="dashboard-shell">
          <Navbar
            user={user}
            currentView={currentView}
            onNavigateToDashboard={handleBackToDashboard}
            onNavigateToQuiniela={handleEnterQuiniela}
            onNavigateToPodium={handleEnterPodium}
            onSignOut={handleSignOut}
          />
          <Dashboard
            user={user}
            onEnterQuiniela={handleEnterQuiniela}
            onViewQuiniela={handleViewSubmission}
            onViewPodium={handleEnterPodium}
          />
        </div>
      ) : (
        view === 'podium' ? (
          <div className="dashboard-shell">
            <Navbar
              user={user}
              currentView={currentView}
              onNavigateToDashboard={handleBackToDashboard}
              onNavigateToPodium={handleEnterPodium}
              onSignOut={handleSignOut}
            />
            <PodiumPage />
          </div>
        ) : (
          quinielaView
        )
      )}
    </>
  );
}
