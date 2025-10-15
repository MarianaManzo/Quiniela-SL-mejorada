import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Instagram, MessageCircle } from 'lucide-react';
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

type SnapshotResult = { blob: Blob; mimeType: 'image/png'; extension: 'png' };
const SNAPSHOT_MIN_SIZE_BYTES = 700 * 1024;
const SNAPSHOT_MAX_SIZE_BYTES = 1024 * 1024;
const SNAPSHOT_BASE_DIMENSION = 1080;

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
  const [quinielaSelections, setQuinielaSelections] = useState<QuinielaSelections>(() => createEmptySelections());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const snapshotCacheRef = useRef<{ data: SnapshotResult | null; promise: Promise<SnapshotResult> | null }>(
    { data: null, promise: null }
  );
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [showSelectionErrors, setShowSelectionErrors] = useState(false);
  const completedSelections = useMemo(
    () => Object.values(quinielaSelections).filter((value): value is Selection => value !== null).length,
    [quinielaSelections]
  );
  const totalMatches = useMemo(() => Object.keys(quinielaSelections).length, [quinielaSelections]);
  const needsMoreSelections = completedSelections < totalMatches;
  const isSubmitDisabled = isSaving || isReadOnlyView;
  const isBusy = isDownloading || isSharingImage || isSaving;
  const isIOSDevice = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const userAgent = navigator.userAgent?.toLowerCase() ?? '';
    const platform = navigator.platform?.toLowerCase() ?? '';
    const maxTouchPoints = navigator.maxTouchPoints ?? 0;

    const isClassicIOS = /iphone|ipad|ipod/.test(userAgent) || /iphone|ipad|ipod/.test(platform);
    const isIPadOS13OrNewer = userAgent.includes('macintosh') && maxTouchPoints > 1;

    return isClassicIOS || isIPadOS13OrNewer;
  }, []);
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

  const hideSubmitTooltip = useCallback(() => {}, []);

  useEffect(() => {
    if (!user) {
      setQuinielaSelections(createEmptySelections());
      setLastSubmittedAt(null);
      setToast(null);
      setIsReadOnlyView(false);
      setShowSelectionErrors(false);
      hideSubmitTooltip();
      return;
    }

    const stored = loadSubmissionForUser(user.email);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(stored?.submittedAt ?? null);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [user, createEmptySelections, hideSubmitTooltip]);

  useEffect(() => {
    snapshotCacheRef.current = { data: null, promise: null };
  }, [quinielaSelections, user?.name, isReadOnlyView]);

  const generateSnapshot = useCallback(async (): Promise<SnapshotResult> => {
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
        return;
      }

      try {
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

    const produceSnapshot = async (pixelRatio: number): Promise<SnapshotResult> => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await waitForFonts();

      const clone = node.cloneNode(true) as HTMLElement;
      clone.style.position = 'static';
      clone.style.transform = 'none';
      clone.style.width = `${SNAPSHOT_BASE_DIMENSION}px`;
      clone.style.height = `${SNAPSHOT_BASE_DIMENSION}px`;
      clone.style.maxWidth = 'unset';
      clone.style.maxHeight = 'unset';
      clone.style.borderRadius = '0';
      clone.style.overflow = 'hidden';

      if (typeof window !== 'undefined') {
        const computed = window.getComputedStyle(node);
        clone.style.background = computed.background || '#fafAF9';
        clone.style.backgroundColor = computed.backgroundColor || '#fafaf9';
        clone.style.backgroundImage = computed.backgroundImage;
        clone.style.backgroundSize = computed.backgroundSize;
        clone.style.backgroundPosition = computed.backgroundPosition;
        clone.style.backgroundRepeat = computed.backgroundRepeat;
        clone.style.fontFamily = computed.fontFamily;
      }

      const sandbox = document.createElement('div');
      sandbox.style.position = 'fixed';
      sandbox.style.left = '-2000px';
      sandbox.style.top = '0';
      sandbox.style.width = `${SNAPSHOT_BASE_DIMENSION}px`;
      sandbox.style.height = `${SNAPSHOT_BASE_DIMENSION}px`;
      sandbox.style.pointerEvents = 'none';
      sandbox.style.zIndex = '-1';
      sandbox.appendChild(clone);
      document.body.appendChild(sandbox);

      try {
        await waitForImages(clone);

        const dataUrl = await toPng(clone, {
          width: SNAPSHOT_BASE_DIMENSION,
          height: SNAPSHOT_BASE_DIMENSION,
          canvasWidth: SNAPSHOT_BASE_DIMENSION,
          canvasHeight: SNAPSHOT_BASE_DIMENSION,
          pixelRatio,
          backgroundColor: '#fafaf9',
          cacheBust: true,
          useCORS: true,
        });

        const response = await fetch(dataUrl);
        const blob = await response.blob();

        return { blob, mimeType: 'image/png', extension: 'png' };
      } finally {
        if (sandbox.parentNode) {
          sandbox.parentNode.removeChild(sandbox);
        }
      }
    };

    const basePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const candidateRatios = [Math.max(2.2, basePixelRatio * 2), Math.max(2.8, basePixelRatio * 2.6), 3.4, 4, 4.5];

    let lastResult: SnapshotResult | null = null;

    for (const ratio of candidateRatios) {
      const cappedRatio = Math.min(ratio, 5);
      lastResult = await produceSnapshot(cappedRatio);

      if (lastResult.blob.size < SNAPSHOT_MIN_SIZE_BYTES) {
        continue;
      }

      if (lastResult.blob.size <= SNAPSHOT_MAX_SIZE_BYTES) {
        return lastResult;
      }

      const reductionSteps = [0.92, 0.85];
      for (const factor of reductionSteps) {
        const adjustedRatio = Math.max(2, cappedRatio * factor);
        const adjustedResult = await produceSnapshot(adjustedRatio);
        if (
          adjustedResult.blob.size >= SNAPSHOT_MIN_SIZE_BYTES &&
          adjustedResult.blob.size <= SNAPSHOT_MAX_SIZE_BYTES
        ) {
          return adjustedResult;
        }
        lastResult = adjustedResult;
      }

      if (lastResult.blob.size <= SNAPSHOT_MAX_SIZE_BYTES) {
        return lastResult;
      }
    }

    if (!lastResult) {
      throw new Error('No se pudo generar la imagen de la quiniela.');
    }

    return lastResult;
  }, []);

  const exportQuinielaSnapshot = useCallback(async () => {
    const cached = snapshotCacheRef.current;

    if (cached.data) {
      return cached.data;
    }

    if (!cached.promise) {
      cached.promise = generateSnapshot()
        .then((result) => {
          snapshotCacheRef.current = { data: result, promise: null };
          return result;
        })
        .catch((error) => {
          snapshotCacheRef.current = { data: null, promise: null };
          throw error;
        });
    }

    return cached.promise;
  }, [generateSnapshot]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const { blob, extension, mimeType } = await exportQuinielaSnapshot();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `jornada-${CURRENT_JOURNEY}.${extension}`;
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
        if (showSelectionErrors) {
          const allCompleted = Object.values(next).every((selection) => selection !== null);
          if (allCompleted) {
            setShowSelectionErrors(false);
            hideSubmitTooltip();
          }
        }
        return next;
      });
    },
    [isReadOnlyView, showSelectionErrors, hideSubmitTooltip]
  );

  const handleSubmitQuiniela = useCallback(() => {
    if (isReadOnlyView) {
      showToast('Esta quiniela es de solo lectura.', 'error');
      return;
    }

    if (!user) {
      showToast('Inicia sesión para enviar tu quiniela.', 'error');
      return;
    }

    if (needsMoreSelections) {
      showToast('Completa todos los partidos antes de enviar.', 'error');
      setShowSelectionErrors(true);
      hideSubmitTooltip();
      return;
    }

    setIsSaving(true);

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
      setIsReadOnlyView(true);
      showToast('Pronóstico enviado correctamente.', 'success');
    } catch (error) {
      console.error('Error al guardar la quiniela', error);
      showToast('No se pudo guardar tu quiniela. Intenta de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [user, needsMoreSelections, quinielaSelections, showToast, isReadOnlyView, hideSubmitTooltip]);

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
    exportQuinielaSnapshot().catch((error) => {
      console.warn('No se pudo preparar la imagen al abrir el modal de compartir.', error);
    });
  }, [exportQuinielaSnapshot]);

  const handleShareClose = useCallback(() => {
    setIsShareOpen(false);
    if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
      lastFocusedElementRef.current = null;
    }
  }, []);

  const tryNativeShare = useCallback(
    async (file: File, blobUrl: string) => {
      if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
        return false;
      }

      if ('canShare' in navigator && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Quiniela Somos Locales',
            text: 'Pronóstico generado con la Quiniela Somos Locales.',
            files: [file],
          });
          return true;
        } catch (error) {
          if ((error as DOMException)?.name === 'AbortError') {
            return true;
          }
          console.warn('No se pudo compartir archivo directamente, intentamos con URL.', error);
        }
      }

      try {
        await navigator.share({
          title: 'Quiniela Somos Locales',
          text: 'Pronóstico generado con la Quiniela Somos Locales.',
          url: blobUrl,
        });
        return true;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') {
          return true;
        }
        console.warn('No se pudo compartir usando URL.', error);
      }

      return false;
    },
    []
  );

  const downloadImageFallback = useCallback((blob: Blob, fileName: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  }, []);

  const handleShareSelect = useCallback(
    async (channel: 'whatsapp' | 'instagram') => {
      if (isSharingImage) {
        return;
      }

      let blobUrl: string | null = null;

      try {
        setIsSharingImage(true);

        const { blob, extension, mimeType } = await exportQuinielaSnapshot();
        const fileName = `quiniela-${CURRENT_JOURNEY}.${extension}`;
        const file = new File([blob], fileName, { type: mimeType });
        blobUrl = URL.createObjectURL(blob);

        const shared = await tryNativeShare(file, blobUrl);

        if (shared) {
          showToast('Imagen compartida correctamente.', 'success');
          return;
        }

        if (navigator.clipboard?.write) {
          try {
            const data = new ClipboardItem({ [mimeType]: blob });
            await navigator.clipboard.write([data]);
            showToast('Imagen copiada al portapapeles. Ábrela en Instagram o WhatsApp y pégala.', 'success');
            return;
          } catch (clipboardError) {
            console.warn('No se pudo copiar al portapapeles, usamos descarga como fallback.', clipboardError);
          }
        }

        downloadImageFallback(blob, fileName);
        showToast('Descargamos la imagen para que la compartas manualmente.', 'success');
      } catch (error) {
        console.error('No se pudo preparar la imagen para compartir', error);
        showToast('No pudimos compartir la imagen. Intenta nuevamente.', 'error');
      } finally {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        setIsSharingImage(false);
        handleShareClose();
      }
    },
    [downloadImageFallback, exportQuinielaSnapshot, handleShareClose, isSharingImage, showToast, tryNativeShare]
  );

  const handleShareButtonClick = useCallback(async () => {
    if (isSharingImage) {
      return;
    }

    const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    if (!canUseNativeShare) {
      handleShareOpen();
      return;
    }

    let blobUrl: string | null = null;

    try {
      setIsSharingImage(true);
      const { blob, extension, mimeType } = await exportQuinielaSnapshot();
      const fileName = `quiniela-${CURRENT_JOURNEY}.${extension}`;
      const file = new File([blob], fileName, { type: mimeType });
      blobUrl = URL.createObjectURL(blob);

      const shared = await tryNativeShare(file, blobUrl);

      if (shared) {
        showToast('Imagen compartida correctamente.', 'success');
        return;
      }

      downloadImageFallback(blob, fileName);
      showToast('Descargamos la imagen para que la compartas manualmente.', 'success');
    } catch (error) {
      console.error('No se pudo usar el menú de compartir nativo', error);
      showToast('No pudimos abrir el menú de compartir. Usa otra opción.', 'error');
      handleShareOpen();
    } finally {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setIsSharingImage(false);
    }
  }, [downloadImageFallback, exportQuinielaSnapshot, handleShareOpen, isSharingImage, showToast, tryNativeShare]);

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
              onClick={handleShareButtonClick}
              className="icon-button share-icon"
              aria-label="Compartir"
              disabled={isSharingImage}
              aria-busy={isSharingImage}
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
              participantName={user?.name}
            />
        </Suspense>
          </div>
        </div>
      </div>

      <div className="canvas-frame__footer">
        <div className="submit-button-wrapper">
          <button
            type="button"
            onClick={handleSubmitQuiniela}
            disabled={isSubmitDisabled}
            aria-disabled={needsMoreSelections || isReadOnlyView}
            className="btn btn-primary submit-button"
          >
            {isSaving ? 'Enviando…' : isReadOnlyView ? 'Enviada' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isBusy ? (
        <div className="global-loading" role="status" aria-live="polite">
          <div className="global-loading__spinner" aria-hidden="true" />
          <span className="global-loading__label">Preparando tu quiniela…</span>
        </div>
      ) : null}
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
