import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2, Share2, X } from 'lucide-react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Dashboard } from './components/Dashboard';
import { LoginScreen, type UserProfile } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { PodiumPage } from './components/PodiumPage';
import AperturaJornada15 from './imports/AperturaJornada15';
import {
  MATCHES,
  QUINIELA_STORAGE_KEY,
  createEmptySelections,
  type QuinielaSelections,
  type QuinielaSubmission,
  type Selection,
} from './quiniela/config';
import { firebaseAuth, firebaseFirestore } from './firebase';
import { useDownloadQuiniela } from './hooks/useDownloadQuiniela';
import { crearOActualizarUsuario, guardarQuiniela } from './services/firestoreService';
import { formatParticipantName, sanitizeDisplayName } from './utils/formatParticipantName';

// Definición centralizada de la jornada mostrada
const CURRENT_JOURNEY = 16;
const BUILD_VERSION = 'V 21';
const QUICK_ACCESS_STORAGE_KEY = 'quiniela-quick-access-profile';

const shouldShowDebugGrid = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('grid') === '1';
};

const createQuickAccessProfile = (): UserProfile => {
  const uniqueSegment = Math.random().toString(36).slice(2, 8);
  return {
    name: 'Invitado rápido',
    email: `invitado-${uniqueSegment}@quiniela.demo`,
    role: 'invitado',
  };
};

const ensureDisplayName = (value: string): string => {
  const cleaned = sanitizeDisplayName(value);
  return cleaned.length > 0 ? cleaned : 'Invitado rápido';
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

const toIsoString = (value: unknown): string | null => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

const formatJourneyDateParts = (date: Date): { dayMonth: string; time: string } => {
  const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
  const raw = dateFormatter.format(date).replace('.', '').toUpperCase().trim();
  const parts = raw.split(' ').filter(Boolean);
  const dayPart = parts[0] ?? raw;
  const monthPart = parts[1] ?? '';
  const time = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dayMonth = monthPart ? `${dayPart} ${monthPart}` : dayPart;
  return { dayMonth, time };
};

const buildCloseLabel = (prefix: 'Cierra' | 'Cerró', date: Date): string => {
  const { dayMonth, time } = formatJourneyDateParts(date);
  return `${prefix} el ${dayMonth} - ${time}`;
};

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

  if (!submission) {
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<QuinielaSelections>(() => createEmptySelections());
  const [isSaving, setIsSaving] = useState(false);
  const [journeyCloseDate, setJourneyCloseDate] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const previousJourneyNumber = CURRENT_JOURNEY - 1;
  const [previousJourneyCloseDate, setPreviousJourneyCloseDate] = useState<Date | null>(null);
  const [currentSubmissionAt, setCurrentSubmissionAt] = useState<string | null>(null);
  const [previousSubmissionAt, setPreviousSubmissionAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [showSelectionErrors, setShowSelectionErrors] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [manualSaveDataUrl, setManualSaveDataUrl] = useState<string | null>(null);
  const journeyClosed = useMemo(() => {
    if (!journeyCloseDate) {
      return false;
    }
    return now.getTime() >= journeyCloseDate.getTime();
  }, [journeyCloseDate, now]);
  const journeyCloseLabel = useMemo(() => {
    if (!journeyCloseDate) {
      return null;
    }
    return buildCloseLabel('Cierra', journeyCloseDate);
  }, [journeyCloseDate]);
  const journeyClosedLabel = useMemo(() => {
    if (!journeyCloseDate) {
      return null;
    }
    return buildCloseLabel('Cerró', journeyCloseDate);
  }, [journeyCloseDate]);
  const previousJourneyClosedLabel = useMemo(() => {
    if (!previousJourneyCloseDate) {
      return null;
    }
    return buildCloseLabel('Cerró', previousJourneyCloseDate);
  }, [previousJourneyCloseDate]);
  const currentJourneySubmittedAt = currentSubmissionAt ?? lastSubmittedAt;
  const previousJourneySubmittedAt = previousSubmissionAt;
  const showDebugGrid = useMemo(() => shouldShowDebugGrid(), []);
  const participantDisplayName = useMemo(
    () => formatParticipantName(user?.name, user?.email),
    [user?.name, user?.email],
  );
  const getExportData = useCallback(() => ({
    selections: quinielaSelections,
    participantName: participantDisplayName,
  }), [quinielaSelections, participantDisplayName]);

  const {
    isPreparingDownload,
    isPreparingShare,
    error: downloadError,
    downloadAsJpg,
    getDataUrl,
    resetError: resetDownloadError,
    resetState: resetDownloadState,
  } = useDownloadQuiniela({ journey: CURRENT_JOURNEY, getExportData });
  const completedSelections = useMemo(
    () => Object.values(quinielaSelections).filter((value): value is Selection => value !== null).length,
    [quinielaSelections]
  );
  const totalMatches = useMemo(() => Object.keys(quinielaSelections).length, [quinielaSelections]);
  const needsMoreSelections = completedSelections < totalMatches;
  const isSubmitDisabled = isSaving || isReadOnlyView || journeyClosed;
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
    if (typeof window === 'undefined') {
      return;
    }

    const unsubscribeFns: Array<() => void> = [];

    const journeyRef = doc(firebaseFirestore, 'jornadas', CURRENT_JOURNEY.toString());
    unsubscribeFns.push(
      onSnapshot(
        journeyRef,
        (snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : undefined;
          setJourneyCloseDate(toDate((data as { fechaCierre?: unknown } | undefined)?.fechaCierre));
        },
        (error) => {
          console.error('No se pudo obtener la fecha de cierre de la jornada', error);
          setJourneyCloseDate(null);
        },
      ),
    );

    if (previousJourneyNumber > 0) {
      const previousRef = doc(firebaseFirestore, 'jornadas', previousJourneyNumber.toString());
      unsubscribeFns.push(
        onSnapshot(
          previousRef,
          (snapshot) => {
            const data = snapshot.exists() ? snapshot.data() : undefined;
            setPreviousJourneyCloseDate(toDate((data as { fechaCierre?: unknown } | undefined)?.fechaCierre));
          },
          (error) => {
            console.error('No se pudo obtener la fecha de cierre de la jornada previa', error);
            setPreviousJourneyCloseDate(null);
          },
        ),
      );
    } else {
      setPreviousJourneyCloseDate(null);
    }

    return () => {
      unsubscribeFns.forEach((fn) => fn());
    };
  }, [previousJourneyNumber]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateNow = () => setNow(new Date());
    updateNow();
    const intervalId = window.setInterval(updateNow, 60000);
    return () => window.clearInterval(intervalId);
  }, []);
  useEffect(() => {
    if (!firebaseUser) {
      setCurrentSubmissionAt(null);
      setPreviousSubmissionAt(null);
      return undefined;
    }

    const unsubscribeFns: Array<() => void> = [];

    const currentQuinielaRef = doc(
      firebaseFirestore,
      'Usuarios',
      firebaseUser.uid,
      'quinielas',
      CURRENT_JOURNEY.toString(),
    );

    unsubscribeFns.push(
      onSnapshot(currentQuinielaRef, (snapshot) => {
        if (!snapshot.exists()) {
          setCurrentSubmissionAt(null);
          setIsReadOnlyView(false);
          return;
        }

        const data = snapshot.data() as {
          estadoQuiniela?: string;
          quinielaEnviada?: boolean;
          fechaActualizacion?: unknown;
          fechaCreacion?: unknown;
        };

        const submitted = data?.estadoQuiniela !== 'abierta' || Boolean(data?.quinielaEnviada);
        const submittedAt = submitted ? toIsoString(data?.fechaActualizacion ?? data?.fechaCreacion) : null;

        setIsReadOnlyView(submitted);
        setCurrentSubmissionAt(submittedAt);
      }),
    );

    if (previousJourneyNumber > 0) {
      const previousQuinielaRef = doc(
        firebaseFirestore,
        'Usuarios',
        firebaseUser.uid,
        'quinielas',
        previousJourneyNumber.toString(),
      );

      unsubscribeFns.push(
        onSnapshot(previousQuinielaRef, (snapshot) => {
          if (!snapshot.exists()) {
            setPreviousSubmissionAt(null);
            return;
          }

          const data = snapshot.data() as {
            estadoQuiniela?: string;
            quinielaEnviada?: boolean;
            fechaActualizacion?: unknown;
            fechaCreacion?: unknown;
          };

          const submitted = data?.estadoQuiniela !== 'abierta' || Boolean(data?.quinielaEnviada);
          const submittedAt = submitted ? toIsoString(data?.fechaActualizacion ?? data?.fechaCreacion) : null;
          setPreviousSubmissionAt(submittedAt);
        }),
      );
    } else {
      setPreviousSubmissionAt(null);
    }

    return () => {
      unsubscribeFns.forEach((fn) => fn());
    };
  }, [firebaseUser, previousJourneyNumber]);
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
      if (authUser) {
        const displayName = authUser.displayName?.trim();
        const email = authUser.email ?? '';
        const fallbackName = displayName && displayName.length > 0
          ? displayName
          : email
            ? email.split('@')[0]
            : 'Participante';

        setFirebaseUser(authUser);
        setUser({
          name: fallbackName,
          email,
          role: 'aficion',
        });

        void crearOActualizarUsuario(authUser)
          .then((profileData) => {
            if (!isMounted) {
              return;
            }
            const resolvedName = profileData.nombreApellido?.trim()?.length
              ? profileData.nombreApellido.trim()
              : fallbackName;
            const resolvedEmail = profileData.email?.trim()?.length ? profileData.email : email;
            const resolvedRole: UserProfile['role'] =
              profileData.rol === 'staff' || profileData.rol === 'invitado'
                ? profileData.rol
                : 'aficion';

            setUser({
              name: resolvedName,
              email: resolvedEmail,
              role: resolvedRole,
            });
          })
          .catch((error) => {
            console.error('No se pudo sincronizar el usuario en Firestore', error);
          });

        setView((current) => (current === 'quiniela' || current === 'podium' ? current : 'dashboard'));
      } else {
        setFirebaseUser(null);
        setUser(null);
        setView('login');
      }
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!downloadError) {
      return;
    }

    showToast(downloadError, 'error');
    resetDownloadError();
  }, [downloadError, resetDownloadError, showToast]);

  useEffect(() => {
    if (currentSubmissionAt) {
      setLastSubmittedAt(currentSubmissionAt);
    }
  }, [currentSubmissionAt]);

  const hideSubmitTooltip = useCallback(() => {}, []);
  const handleQuickAccess = useCallback(() => {
    let profile: UserProfile | null = null;

    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(QUICK_ACCESS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserProfile>;
          if (parsed && typeof parsed.name === 'string' && typeof parsed.email === 'string') {
            const role: UserProfile['role'] =
              parsed.role === 'aficion' || parsed.role === 'staff' || parsed.role === 'invitado'
                ? parsed.role
                : 'invitado';
            profile = {
              name: ensureDisplayName(parsed.name),
              email: parsed.email,
              role,
            };
          }
        }
      } catch (error) {
        console.warn('No se pudo recuperar el perfil de acceso rápido.', error);
      }
    }

    if (!profile) {
      const generated = createQuickAccessProfile();
      profile = {
        ...generated,
        name: ensureDisplayName(generated.name),
      };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            QUICK_ACCESS_STORAGE_KEY,
            JSON.stringify(profile),
          );
        } catch (error) {
          console.warn('No se pudo guardar el perfil de acceso rápido.', error);
        }
      }
    } else if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          QUICK_ACCESS_STORAGE_KEY,
          JSON.stringify(profile),
        );
      } catch (error) {
        console.warn('No se pudo guardar el perfil de acceso rápido.', error);
      }
    }

    setUser(profile);
    setView('dashboard');
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    resetDownloadState();
    setIsShareOpen(false);
    setManualSaveDataUrl(null);
    setAuthReady(true);
  }, [hideSubmitTooltip, resetDownloadState]);

  useEffect(() => {
    if (!user) {
      setQuinielaSelections(createEmptySelections());
      setLastSubmittedAt(null);
      setToast(null);
      setIsReadOnlyView(false);
      setShowSelectionErrors(false);
      hideSubmitTooltip();
      resetDownloadState();
      setIsShareOpen(false);
      setManualSaveDataUrl(null);
      setCurrentSubmissionAt(null);
      setPreviousSubmissionAt(null);
      setPreviousJourneyCloseDate(null);
      return;
    }

    const stored = loadSubmissionForUser(user.email);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(stored?.submittedAt ?? null);
    setIsReadOnlyView(Boolean(stored && stored.journey === CURRENT_JOURNEY));
    setCurrentSubmissionAt(stored && stored.journey === CURRENT_JOURNEY ? stored.submittedAt : null);
    setPreviousSubmissionAt(stored && stored.journey === previousJourneyNumber ? stored.submittedAt : null);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [user, createEmptySelections, hideSubmitTooltip, resetDownloadState, previousJourneyNumber]);

  const handleSignOut = useCallback(async () => {
    resetDownloadState();
    setManualSaveDataUrl(null);
    setQuinielaSelections(createEmptySelections());
    setLastSubmittedAt(null);
    setIsSaving(false);
    setToast(null);
    setIsShareOpen(false);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    setView('login');
    setUser(null);
    setFirebaseUser(null);

    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('No se pudo cerrar sesión en Firebase', error);
      showToast('No pudimos cerrar sesión. Intenta de nuevo.', 'error');
    }
  }, [createEmptySelections, hideSubmitTooltip, resetDownloadState, showToast]);

  const handleBackToDashboard = useCallback(() => {
    resetDownloadState();
    setManualSaveDataUrl(null);
    setIsShareOpen(false);
    setView('dashboard');
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [hideSubmitTooltip, resetDownloadState]);

  const handleEnterQuiniela = useCallback(() => {
    setQuinielaSelections(createEmptySelections());
    resetDownloadState();
    setManualSaveDataUrl(null);
    setIsShareOpen(false);
    setIsReadOnlyView(journeyClosed);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    setView('quiniela');
  }, [createEmptySelections, hideSubmitTooltip, journeyClosed, resetDownloadState]);

  const handleEnterPodium = useCallback(() => {
    resetDownloadState();
    setManualSaveDataUrl(null);
    setIsShareOpen(false);
    setIsReadOnlyView(false);
    setShowSelectionErrors(false);
    hideSubmitTooltip();
    setView('podium');
  }, [hideSubmitTooltip, resetDownloadState]);

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

  const handleSubmitQuiniela = useCallback(async () => {
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

    if (journeyClosed) {
      showToast('La jornada está cerrada y ya no admite envíos.', 'error');
      setIsReadOnlyView(true);
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
      if (firebaseUser) {
        const pronosticos = MATCHES.map((match) => submission.selections[match.id]) as Selection[];
        await guardarQuiniela({
          uid: firebaseUser.uid,
          jornada: CURRENT_JOURNEY,
          pronosticos,
          estadoQuiniela: 'cerrada',
        });
      }

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
  }, [
    firebaseUser,
    user,
    needsMoreSelections,
    quinielaSelections,
    showToast,
    isReadOnlyView,
    hideSubmitTooltip,
    journeyClosed,
  ]);

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

  const handleDownloadJpg = useCallback(async () => {
    setIsShareOpen(false);
    setManualSaveDataUrl(null);
    try {
      const outcome = await downloadAsJpg();
      if (outcome.status === 'downloaded') {
        showToast('Descargamos tu quiniela en formato JPG.', 'success');
      } else {
        setManualSaveDataUrl(outcome.dataUrl);
        setIsShareOpen(true);
        showToast('Mantén presionada la imagen para guardarla manualmente.', 'success');
      }
    } catch {
      try {
        const dataUrl = await getDataUrl();
        setManualSaveDataUrl(dataUrl);
        setIsShareOpen(true);
      } catch {
        // El hook se encarga de notificar el error.
      }
    }
  }, [downloadAsJpg, getDataUrl, showToast]);

  const handleOpenManualSave = useCallback(async () => {
    try {
      const dataUrl = await getDataUrl();
      setManualSaveDataUrl(dataUrl);
      setIsShareOpen(true);
      showToast('Mantén presionada la imagen para guardarla manualmente.', 'success');
    } catch {
      resetDownloadError();
    }
  }, [getDataUrl, resetDownloadError, showToast]);

  const handleCloseManualSave = useCallback(() => {
    setIsShareOpen(false);
    setManualSaveDataUrl(null);
  }, []);

  if (!authReady && !user) {
    return null;
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(_profile) => {
          setView('dashboard');
        }}
        onQuickAccess={handleQuickAccess}
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
  const manualSaveModal =
    isShareOpen && manualSaveDataUrl ? (
      <div className="manual-save-modal" role="dialog" aria-modal="true" onClick={handleCloseManualSave}>
        <div className="manual-save-modal__backdrop" />
        <div
          className="manual-save-modal__content"
          role="document"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="manual-save-modal__header">
            <h2 className="manual-save-modal__title">Guarda tu quiniela</h2>
            <button
              type="button"
              className="manual-save-modal__dismiss"
              onClick={handleCloseManualSave}
              aria-label="Cerrar modal de guardado manual"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="manual-save-modal__hint">Mantén presionada la imagen y elige “Guardar en Fotos”.</p>
          <div className="manual-save-modal__preview">
            <img src={manualSaveDataUrl} alt="Vista previa de la quiniela generada" />
          </div>
          <div className="manual-save-modal__actions">
            <button type="button" className="btn btn-secondary manual-save-modal__close" onClick={handleCloseManualSave}>
              Cerrar
            </button>
          </div>
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
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleOpenManualSave}
              className="icon-button share-icon"
              aria-label="Compartir o guardar manualmente"
              title="Compartir o guardar manualmente"
              disabled={isPreparingShare}
              aria-busy={isPreparingShare}
            >
              {isPreparingShare ? (
                <Loader2 size={18} aria-hidden="true" className="icon-spinner icon-spinner--accent" />
              ) : (
                <Share2 size={18} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadJpg}
              className="icon-button download-icon"
              aria-label="Descargar quiniela en JPG"
              title="Descargar quiniela en JPG"
              disabled={isPreparingDownload}
              aria-busy={isPreparingDownload}
            >
              {isPreparingDownload ? <Loader2 size={18} aria-hidden="true" className="icon-spinner" /> : <Download size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div
          className="canvas-shell"
        >
          <div
            className="canvas-wrapper"
          >
            <AperturaJornada15
              selections={quinielaSelections}
              onSelect={handleSelectionChange}
              isReadOnly={isReadOnlyView}
              showSelectionErrors={showSelectionErrors}
              participantName={participantDisplayName}
              showGrid={showDebugGrid}
            />
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
      {toastBanner}
      {manualSaveModal}
      <div className="build-badge" aria-hidden="true">
        Versión {BUILD_VERSION}
      </div>
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
            journeyCode={`J${CURRENT_JOURNEY.toString().padStart(2, '0')}`}
            journeyCloseLabel={journeyCloseLabel}
            journeyClosedLabel={journeyClosedLabel}
            journeyClosed={journeyClosed}
            journeySubmittedAt={currentJourneySubmittedAt}
            previousJourneyClosedLabel={previousJourneyClosedLabel}
            previousJourneySubmittedAt={previousJourneySubmittedAt}
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
