import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2, Share2, X } from 'lucide-react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Dashboard } from './components/Dashboard';
import { LoginScreen, type UserProfile } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { PodiumPage } from './components/PodiumPage';
import { ProfilePage } from './components/ProfilePage';
import AperturaJornada15 from './imports/AperturaJornada15';
import {
  QUINIELA_STORAGE_KEY,
  createEmptySelections,
  getJourneyHeader,
  getMatchesForJourney,
  type QuinielaSelections,
  type QuinielaSubmission,
  type Selection,
} from './quiniela/config';
import { firebaseAuth, firebaseFirestore } from './firebase';
import { useDownloadQuiniela } from './hooks/useDownloadQuiniela';
import { crearOActualizarUsuario, guardarQuiniela, registrarTokenDispositivo } from './services/firestoreService';
import { ensureNotificationToken, registerEnvMissingKeyListener, type NotificationStatus } from './services/messaging';
import { formatParticipantName, sanitizeDisplayName } from './utils/formatParticipantName';
import type { JourneyStat } from './types/profile';
import { notifyConstancyBadgeUnlock } from './services/notifications';
import { CONSTANCY_BADGES_BY_ID, CONSTANCY_BADGES, type ConstancyBadgeDefinition } from './data/constancyBadges';
import { BadgeCelebrationModal } from './components/BadgeCelebrationModal';

// Definición centralizada de la jornada mostrada
const CURRENT_JOURNEY = 17;
const BUILD_VERSION = 'V 33';
const QUICK_ACCESS_STORAGE_KEY = 'quiniela-quick-access-profile';
const DEFAULT_COUNTRY = 'México';
const DEFAULT_COUNTRY_CODE = 'MX';

const normalizeCountryCode = (value?: string | null): string => {
  if (!value) {
    return DEFAULT_COUNTRY_CODE;
  }
  const cleaned = value.trim();
  if (!cleaned) {
    return DEFAULT_COUNTRY_CODE;
  }
  return cleaned.slice(0, 2).toUpperCase();
};

const calculateAgeFromBirthdate = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

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
    country: DEFAULT_COUNTRY,
    countryCode: DEFAULT_COUNTRY_CODE,
    age: null,
    birthdate: null,
    constancyStreak: 0,
    constancyLastJourney: 0,
    constancyBadges: {},
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
  return `${prefix} el ${dayMonth} - ${time} hrs`;
};

const buildStartLabel = (date: Date): string => {
  const { dayMonth, time } = formatJourneyDateParts(date);
  return `Inicia el ${dayMonth} - ${time} hrs`;
};

const buildSubmittedLabel = (isoString: string | null): string => {
  if (!isoString) {
    return 'Pronóstico enviado';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Pronóstico enviado';
  }
  const { dayMonth, time } = formatJourneyDateParts(date);
  return `Pronóstico enviado el ${dayMonth} - ${time} hrs`;
};

const parseJourneyNumber = (id: string): number | null => {
  if (!id) {
    return null;
  }

  const numericId = Number.parseInt(id, 10);
  if (!Number.isNaN(numericId)) {
    return numericId;
  }

  const match = id.match(/\d+/);
  if (match) {
    const parsed = Number.parseInt(match[0], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

type UserStoredSubmissions = Record<number, QuinielaSubmission>;
type StoredSubmissions = Record<string, UserStoredSubmissions>;

const PUSH_TOKEN_STORAGE_PREFIX = 'somos-locales-fcm-token:';

const getStoredPushToken = (uid: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(`${PUSH_TOKEN_STORAGE_PREFIX}${uid}`);
  } catch {
    return null;
  }
};

const setStoredPushToken = (uid: string, token: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(`${PUSH_TOKEN_STORAGE_PREFIX}${uid}`, token);
  } catch {
    // ignore storage errors
  }
};

const useSyncDeviceToken = (
  firebaseUser: FirebaseUser | null,
): ((token: string, status: NotificationStatus) => Promise<void>) => {
  return useCallback(
    async (token: string, status: NotificationStatus) => {
      if (!firebaseUser) {
        return;
      }

      const storedToken = getStoredPushToken(firebaseUser.uid);
      if (storedToken === token) {
        return;
      }

      try {
        await registrarTokenDispositivo({
          uid: firebaseUser.uid,
          token,
          permiso: status,
          plataforma: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
        });
        setStoredPushToken(firebaseUser.uid, token);
      } catch (error) {
        console.error('No se pudo registrar el token de notificaciones push', error);
      }
    },
    [firebaseUser],
  );
};

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

const ensureUserSubmissionStore = (store: StoredSubmissions, email: string): UserStoredSubmissions => {
  const entryRaw = store[email] as unknown;
  if (typeof entryRaw === 'object' && entryRaw !== null) {
    if ('journey' in (entryRaw as Record<string, unknown>)) {
      const single = entryRaw as QuinielaSubmission;
      const journeyNumber = typeof single.journey === 'number' ? single.journey : CURRENT_JOURNEY;
      const migrated: UserStoredSubmissions = {
        [journeyNumber]: {
          ...single,
          journey: journeyNumber,
          selections: { ...single.selections },
        },
      };
      store[email] = migrated;
      return migrated;
    }

    return entryRaw as UserStoredSubmissions;
  }
  const next: UserStoredSubmissions = {};
  store[email] = next;
  return next;
};

const loadSubmissionForUser = (email: string, journey: number): QuinielaSubmission | null => {
  const submissions = readStoredSubmissions();
  const userStore = submissions[email];
  if (!userStore) {
    return null;
  }

  return userStore[journey] ?? null;
};

const loadSubmissionsForUser = (email: string): UserStoredSubmissions => {
  const submissions = readStoredSubmissions();
  const entryRaw = submissions[email];
  if (!entryRaw) {
    return {};
  }

  const result: UserStoredSubmissions = {};

  const maybeSingle = entryRaw as unknown;
  if (typeof maybeSingle === 'object' && maybeSingle !== null && 'journey' in maybeSingle) {
    const single = maybeSingle as QuinielaSubmission;
    if (single.selections) {
      const journeyNumber = typeof single.journey === 'number' ? single.journey : CURRENT_JOURNEY;
      result[journeyNumber] = {
        ...single,
        journey: journeyNumber,
        selections: { ...single.selections },
      };
    }
    return result;
  }

  Object.entries(entryRaw as UserStoredSubmissions).forEach(([journeyKey, submission]) => {
    if (!submission || !submission.selections) {
      return;
    }

    const journeyNumber = Number(journeyKey);
    const resolvedJourney = Number.isNaN(journeyNumber) ? submission.journey ?? CURRENT_JOURNEY : journeyNumber;

    result[resolvedJourney] = {
      ...submission,
      journey: resolvedJourney,
      selections: { ...submission.selections },
    };
  });

  return result;
};

const persistSubmissionForUser = (email: string, journey: number, submission: QuinielaSubmission) => {
  if (typeof window === 'undefined') {
    return;
  }

  const submissions = readStoredSubmissions();
  const userStore = ensureUserSubmissionStore(submissions, email);
  userStore[journey] = {
    ...submission,
    selections: { ...submission.selections },
  };
  window.localStorage.setItem(QUINIELA_STORAGE_KEY, JSON.stringify(submissions));
};

const normalizeSelection = (value: unknown): Selection | null => {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (upper === 'L' || upper === 'E' || upper === 'V') {
      return upper as Selection;
    }
  }

  return null;
};

const buildSelectionsFromPronosticos = (values: unknown, journeyNumber: number): QuinielaSelections | null => {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const matches = getMatchesForJourney(journeyNumber);
  const result = createEmptySelections(journeyNumber);

  matches.forEach((match, index) => {
    const selection = normalizeSelection(values[index]);
    if (selection) {
      result[match.id] = selection;
    }
  });

  return result;
};

const hasCompletedSelections = (selections: QuinielaSelections | null): boolean =>
  selections ? Object.values(selections).every((value) => value !== null) : false;

type QuinielaDocData = {
  pronosticos?: unknown;
  estadoQuiniela?: unknown;
  quinielaEnviada?: unknown;
  fechaActualizacion?: unknown;
  fechaCreacion?: unknown;
  puntosObtenidos?: unknown;
};

type JornadaDocData = {
  fechaInicio?: unknown;
  fechaApertura?: unknown;
  fechaCierre?: unknown;
  resultadosOficiales?: unknown;
  titulo?: unknown;
};

type JourneyRecord = {
  id: string;
  number: number;
  fechaInicio: Date | null;
  fechaCierre: Date | null;
  resultadosOficiales: Selection[];
  rawData: JornadaDocData;
};

type JourneyTone = 'current' | 'success' | 'warning' | 'upcoming';
type JourneyCardAction = 'participate' | 'view' | null;

type JourneyCardViewModel = {
  id: string;
  code: string;
  number: number;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  action: JourneyCardAction;
  submittedAt: string | null;
};

const VISIBLE_JOURNEY_NUMBERS = [17, 18] as const;
const VISIBLE_JOURNEY_SET = new Set<number>(VISIBLE_JOURNEY_NUMBERS);
const ORDERED_VISIBLE_JOURNEYS = [...VISIBLE_JOURNEY_NUMBERS].sort((a, b) => a - b);
const FORCED_PARTICIPATION_JOURNEYS = VISIBLE_JOURNEY_NUMBERS.length;
const DEFAULT_FORCED_JOURNEY_META = "Cierra el 31 OCT - 14:59 hrs";
const PARTICIPATION_OVERRIDE_JOURNEYS = new Set<number>([CURRENT_JOURNEY]);
const PARTICIPATION_OVERRIDE_META = "EN CURSO PARA PARTICIPAR";

const findPreviousVisibleJourney = (journeyNumber: number): number | null => {
  const index = ORDERED_VISIBLE_JOURNEYS.indexOf(journeyNumber);
  return index > 0 ? ORDERED_VISIBLE_JOURNEYS[index - 1] : null;
};

const resolveSubmissionMetadata = (journeyNumber: number, data: QuinielaDocData | undefined) => {
  if (!data) {
    return {
      submitted: false,
      submittedAt: null as string | null,
      selections: null as QuinielaSelections | null,
      puntosObtenidos: 0,
    };
  }

  const rawEstado = typeof data.estadoQuiniela === 'string' ? data.estadoQuiniela.toLowerCase() : '';
  const selections = buildSelectionsFromPronosticos(data.pronosticos, journeyNumber);
  const submittedStates = new Set(['enviada', 'cerrada', 'cerrado']);
  const submitted = submittedStates.has(rawEstado) || Boolean(data.quinielaEnviada);
  const submittedAt = submitted
    ? toIsoString(data.fechaActualizacion ?? data.fechaCreacion) ?? new Date().toISOString()
    : null;
  const puntosObtenidos =
    typeof data.puntosObtenidos === 'number' && Number.isFinite(data.puntosObtenidos) ? data.puntosObtenidos : 0;

  return {
    submitted,
    submittedAt,
    selections,
    puntosObtenidos,
  };
};

// Componente de loading simple
function LoadingSpinner() {
  return (
    <div className="w-[1080px] h-[1080px] flex items-center justify-center bg-gradient-to-br from-blue-600 via-green-500 to-yellow-400">
      <div className="text-white text-2xl font-bold animate-pulse">
        Cargando jornada…
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'quiniela' | 'podium' | 'profile'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [quinielaSelections, setQuinielaSelections] = useState<QuinielaSelections>(() => createEmptySelections(CURRENT_JOURNEY));
  const [draftSelectionsByJourney, setDraftSelectionsByJourney] = useState<Record<number, QuinielaSelections>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeJourneyNumber, setActiveJourneyNumber] = useState<number>(CURRENT_JOURNEY);
  const [journeyCloseDate, setJourneyCloseDate] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const previousJourneyNumber = findPreviousVisibleJourney(activeJourneyNumber);
  const activeJourneyMatches = useMemo(() => getMatchesForJourney(activeJourneyNumber), [activeJourneyNumber]);
  const activeJourneyHeader = useMemo(() => getJourneyHeader(activeJourneyNumber), [activeJourneyNumber]);
  const [previousJourneyCloseDate, setPreviousJourneyCloseDate] = useState<Date | null>(null);
  const [currentSubmissionAt, setCurrentSubmissionAt] = useState<string | null>(null);
  const [previousSubmissionAt, setPreviousSubmissionAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [showSelectionErrors, setShowSelectionErrors] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [manualSaveDataUrl, setManualSaveDataUrl] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<JourneyRecord[]>([]);
  const [userQuinielasMap, setUserQuinielasMap] = useState<Record<number, QuinielaDocData>>({});
  const [badgeCelebrations, setBadgeCelebrations] = useState<ConstancyBadgeDefinition[]>([]);
  const dismissBadgeCelebration = useCallback(() => {
    setBadgeCelebrations((prev) => prev.slice(1));
  }, []);
  const handlePreviewBadge = useCallback(() => {
    const sampleBadge = CONSTANCY_BADGES[CONSTANCY_BADGES.length - 1] ?? CONSTANCY_BADGES[0];
    if (!sampleBadge) {
      return;
    }
    setBadgeCelebrations((prev) => [...prev, sampleBadge]);
  }, []);
  const initialNotificationPermission =
    (typeof Notification !== 'undefined' ? Notification.permission : 'default') as NotificationStatus;
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(initialNotificationPermission);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const syncDeviceToken = useSyncDeviceToken(firebaseUser);
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
  const storedSubmissions = useMemo(
    () => (user ? loadSubmissionsForUser(user.email) : {}),
    [user, lastSubmittedAt],
  );
  const journeyCards = useMemo<JourneyCardViewModel[]>(() => {
    if (journeys.length === 0) {
      return [];
    }

    const applyParticipationOverride = (card: JourneyCardViewModel): JourneyCardViewModel => {
      if (!PARTICIPATION_OVERRIDE_JOURNEYS.has(card.number)) {
        return card;
      }

      return {
        ...card,
        statusLabel: 'En curso',
        meta: PARTICIPATION_OVERRIDE_META,
        tone: 'current',
        action: 'participate',
      };
    };

    let cards = journeys
      .filter((journey) => VISIBLE_JOURNEY_SET.has(journey.number))
      .map((journey) => {
        const code = `J${journey.number.toString().padStart(2, '0')}`;
        const submissionMeta = resolveSubmissionMetadata(
          journey.number,
          userQuinielasMap[journey.number]
        );
        const localSubmissionRaw = storedSubmissions[journey.number];
        const localSubmission =
          localSubmissionRaw && hasCompletedSelections(localSubmissionRaw.selections) ? localSubmissionRaw : null;
        const submittedAt = submissionMeta.submittedAt ?? localSubmission?.submittedAt ?? null;
        const effectiveSubmitted = submissionMeta.submitted || Boolean(localSubmission);

        let tone: JourneyTone = 'upcoming';
        let statusLabel = 'Próximamente';
        let action: JourneyCardAction = null;
        let meta = journey.fechaInicio ? buildStartLabel(journey.fechaInicio) : 'Próximamente';

        if (effectiveSubmitted) {
          tone = 'success';
          statusLabel = 'Enviado';
          meta = buildSubmittedLabel(submittedAt);
          action = 'view';
        } else if (journey.fechaInicio && now.getTime() < journey.fechaInicio.getTime()) {
          tone = 'upcoming';
          statusLabel = 'Próximamente';
          meta = buildStartLabel(journey.fechaInicio);
        } else if (journey.fechaCierre && now.getTime() >= journey.fechaCierre.getTime()) {
          tone = 'warning';
          statusLabel = 'Expirado';
          meta = buildCloseLabel('Cerró', journey.fechaCierre);
        } else {
          tone = 'current';
          statusLabel = 'En curso';
          meta = journey.fechaCierre ? buildCloseLabel('Cierra', journey.fechaCierre) : 'Jornada en curso';
          action = 'participate';
        }

        return {
          id: `journey-${journey.number}`,
          code,
          number: journey.number,
          statusLabel,
          meta,
          tone,
          action,
          submittedAt,
        } satisfies JourneyCardViewModel;
      })
      .sort((a, b) => b.number - a.number);

    cards = cards.map(applyParticipationOverride);

    const upcomingJourneyNumber = CURRENT_JOURNEY + 1;
    const hasUpcoming = cards.some((card) => card.number === upcomingJourneyNumber);

    if (!hasUpcoming && VISIBLE_JOURNEY_SET.has(upcomingJourneyNumber)) {
      cards = cards.concat({
        id: `journey-${upcomingJourneyNumber}`,
        code: `J${upcomingJourneyNumber.toString().padStart(2, '0')}`,
        number: upcomingJourneyNumber,
        statusLabel: 'Próximamente',
        meta: 'Publicamos el rol de juegos muy pronto',
        tone: 'upcoming',
        action: null,
        submittedAt: null,
      });
    }

    return cards.map(applyParticipationOverride).sort((a, b) => b.number - a.number);
  }, [journeys, now, storedSubmissions, userQuinielasMap]);
  const getExportData = useCallback(() => ({
    selections: quinielaSelections,
    participantName: participantDisplayName,
    journey: activeJourneyNumber,
  }), [quinielaSelections, participantDisplayName, activeJourneyNumber]);

  const {
    isPreparingDownload,
    isPreparingShare,
    error: downloadError,
    downloadAsJpg,
    getDataUrl,
    resetError: resetDownloadError,
    resetState: resetDownloadState,
  } = useDownloadQuiniela({ journey: activeJourneyNumber, getExportData });
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
    const jornadasRef = collection(firebaseFirestore, 'jornadas');

    const unsubscribe = onSnapshot(
      jornadasRef,
      (snapshot) => {
        const records: JourneyRecord[] = snapshot.docs
          .map((docSnap) => {
            const number = parseJourneyNumber(docSnap.id);
            if (number === null) {
              return null;
            }

            const data = docSnap.data() as JornadaDocData;
            const fechaInicio = toDate(data?.fechaInicio ?? data?.fechaApertura ?? null);
            const fechaCierre = toDate(data?.fechaCierre ?? null);
            const resultados =
              Array.isArray(data?.resultadosOficiales) && data.resultadosOficiales.length > 0
                ? (data.resultadosOficiales.map((value) => normalizeSelection(value)) as Selection[])
                : [];

            return {
              id: docSnap.id,
              number,
              fechaInicio,
              fechaCierre,
              resultadosOficiales: resultados.filter((value): value is Selection => Boolean(value)),
              rawData: data,
            } satisfies JourneyRecord;
          })
          .filter((value): value is JourneyRecord => value !== null)
          .sort((a, b) => b.number - a.number);

        setJourneys(records);
      },
      (error) => {
        console.error('No se pudieron cargar las jornadas desde Firestore', error);
        setJourneys([]);
      },
    );

    return () => unsubscribe();
  }, []);
useEffect(() => {
  const currentJourney = journeys.find((journey) => journey.number === activeJourneyNumber);
  setJourneyCloseDate(currentJourney?.fechaCierre ?? null);

  if (previousJourneyNumber && previousJourneyNumber > 0) {
    const previousJourney = journeys.find((journey) => journey.number === previousJourneyNumber);
    setPreviousJourneyCloseDate(previousJourney?.fechaCierre ?? null);
  } else {
    setPreviousJourneyCloseDate(null);
  }
}, [journeys, activeJourneyNumber, previousJourneyNumber]);

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
    setUserQuinielasMap({});
    return undefined;
  }

  const quinielasRef = collection(firebaseFirestore, 'Usuarios', firebaseUser.uid, 'quinielas');

  const unsubscribe = onSnapshot(
    quinielasRef,
    (snapshot) => {
      const map: Record<number, QuinielaDocData> = {};

      snapshot.forEach((docSnap) => {
        const journeyNumber = parseJourneyNumber(docSnap.id);
        if (journeyNumber === null) {
          return;
        }
        map[journeyNumber] = docSnap.data() as QuinielaDocData;
      });

      setUserQuinielasMap(map);
    },
    (error) => {
      console.error('No se pudieron cargar las quinielas del usuario', error);
      setUserQuinielasMap({});
    },
  );

  return () => {
    unsubscribe();
  };
}, [firebaseUser]);

useEffect(() => {
  if (!firebaseUser) {
    setNotificationStatus(
      (typeof Notification !== 'undefined' ? Notification.permission : 'default') as NotificationStatus,
    );
    return;
  }

  if (typeof Notification === 'undefined') {
    setNotificationStatus('unsupported');
    return;
  }

  const currentPermission = Notification.permission as NotificationStatus;
  if (currentPermission !== 'granted') {
    setNotificationStatus(currentPermission);

    const handleMissingKey = () => {
      setNotificationStatus('missing-key');
    };
    const unsubscribeMissingKey = registerEnvMissingKeyListener(handleMissingKey);
    return () => {
      unsubscribeMissingKey();
    };
  }

  let cancelled = false;

  const register = async () => {
    const result = await ensureNotificationToken(false);
    if (cancelled) {
      return;
    }
    setNotificationStatus((prev) => {
      if (result.status === 'error' && Notification.permission === 'granted') {
        return prev === 'granted' ? 'granted' : 'error';
      }
      return result.status;
    });
    if (result.status === 'granted' && result.token) {
      await syncDeviceToken(result.token, result.status);
    }
  };

  register();

  const handleMissingKey = () => {
    setNotificationStatus('missing-key');
  };

  const unsubscribeMissingKey = registerEnvMissingKeyListener(handleMissingKey);

  return () => {
    cancelled = true;
    unsubscribeMissingKey();
  };
}, [firebaseUser, syncDeviceToken]);

useEffect(() => {
  if (!firebaseUser) {
    setIsReadOnlyView(false);
    setCurrentSubmissionAt(null);
    setPreviousSubmissionAt(null);
    return;
  }

  const currentMeta = resolveSubmissionMetadata(activeJourneyNumber, userQuinielasMap[activeJourneyNumber]);
  setIsReadOnlyView(currentMeta.submitted);
  setCurrentSubmissionAt(currentMeta.submittedAt ?? null);
  if (currentMeta.submittedAt) {
    setLastSubmittedAt(currentMeta.submittedAt);
  } else if (!currentMeta.submitted) {
    setLastSubmittedAt(null);
  }

  if (previousJourneyNumber && previousJourneyNumber > 0) {
    const previousMeta = resolveSubmissionMetadata(previousJourneyNumber, userQuinielasMap[previousJourneyNumber]);
    setPreviousSubmissionAt(previousMeta.submittedAt ?? null);
  } else {
    setPreviousSubmissionAt(null);
  }
}, [activeJourneyNumber, firebaseUser, previousJourneyNumber, userQuinielasMap]);

  const handleEnableNotifications = useCallback(async () => {
    if (!firebaseUser) {
      showToast('Inicia sesión para activar las notificaciones.', 'error');
      return;
    }

    setIsNotificationLoading(true);

    try {
      const result = await ensureNotificationToken(true);
      setNotificationStatus(result.status);

      if (result.status === 'granted' && result.token) {
        await syncDeviceToken(result.token, result.status);
        showToast('Notificaciones activadas correctamente.', 'success');
      } else if (result.status === 'denied') {
        showToast('Debes permitir las notificaciones desde la configuración del navegador.', 'error');
      } else if (result.status === 'unsupported') {
        showToast('Este dispositivo no soporta notificaciones push.', 'error');
      } else if (result.status === 'missing-key') {
        showToast('Falta configurar la clave de notificaciones.', 'error');
      } else if (result.status === 'error') {
        showToast('No pudimos activar las notificaciones. Intenta de nuevo.', 'error');
      }
    } catch (error) {
      console.error('No se pudo activar las notificaciones', error);
      showToast('No pudimos activar las notificaciones. Intenta de nuevo.', 'error');
    } finally {
      setIsNotificationLoading(false);
    }
  }, [firebaseUser, showToast, syncDeviceToken]);


useEffect(() => {
  if (!user) {
    return;
  }

  const currentMeta = resolveSubmissionMetadata(activeJourneyNumber, userQuinielasMap[activeJourneyNumber]);
  if (currentMeta.submitted && currentMeta.selections && hasCompletedSelections(currentMeta.selections)) {
    const submission: QuinielaSubmission = {
      user,
      selections: currentMeta.selections,
      submittedAt: currentMeta.submittedAt ?? new Date().toISOString(),
      journey: activeJourneyNumber,
    };
    persistSubmissionForUser(user.email, activeJourneyNumber, submission);
  }
}, [activeJourneyNumber, user, userQuinielasMap]);

// Ya no mostramos toasts para notificaciones en primer plano; el sistema gestiona los avisos push.
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
          country: DEFAULT_COUNTRY,
          countryCode: DEFAULT_COUNTRY_CODE,
          age: null,
          birthdate: null,
          constancyStreak: 0,
          constancyLastJourney: 0,
          constancyBadges: {},
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
            const resolvedCountry = profileData.pais?.trim()?.length ? profileData.pais.trim() : DEFAULT_COUNTRY;
            const resolvedCountryCode = normalizeCountryCode(profileData.codigoPais);
            const resolvedBirthdate = profileData.fechaNacimiento ?? null;
            const resolvedAge = calculateAgeFromBirthdate(resolvedBirthdate);
            const resolvedConstancyStreak =
              typeof profileData.constancyStreak === 'number' ? profileData.constancyStreak : 0;
            const resolvedConstancyLastJourney =
              typeof profileData.constancyLastJourney === 'number' ? profileData.constancyLastJourney : 0;
            const resolvedConstancyBadges = profileData.constancyBadges ?? {};

            setUser({
              name: resolvedName,
              email: resolvedEmail,
              role: resolvedRole,
              country: resolvedCountry,
              countryCode: resolvedCountryCode,
              age: resolvedAge,
              birthdate: resolvedBirthdate,
              constancyStreak: resolvedConstancyStreak,
              constancyLastJourney: resolvedConstancyLastJourney,
              constancyBadges: resolvedConstancyBadges,
            });
          })
          .catch((error) => {
            console.error('No se pudo sincronizar el usuario en Firestore', error);
          });

        setView((current) => (current === 'quiniela' || current === 'podium' || current === 'profile' ? current : 'dashboard'));
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
              country: parsed.country ?? DEFAULT_COUNTRY,
              countryCode: normalizeCountryCode(parsed.countryCode),
              age: typeof parsed.age === 'number' ? parsed.age : null,
              birthdate: parsed.birthdate ?? null,
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
      setQuinielaSelections(createEmptySelections(CURRENT_JOURNEY));
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
      setDraftSelectionsByJourney({});
      setActiveJourneyNumber(CURRENT_JOURNEY);
      return;
    }

    const storedMap = loadSubmissionsForUser(user.email);
    const storedForActive = storedMap[activeJourneyNumber];
    const storedForPrevious = previousJourneyNumber ? storedMap[previousJourneyNumber] : undefined;

    setDraftSelectionsByJourney(
      Object.fromEntries(
        Object.entries(storedMap).map(([journey, submission]) => [
          Number(journey),
          { ...submission.selections },
        ]),
      ),
    );

    if (storedForActive && hasCompletedSelections(storedForActive.selections)) {
      setQuinielaSelections({ ...storedForActive.selections });
      setLastSubmittedAt(storedForActive.submittedAt ?? null);
      setIsReadOnlyView(true);
      setCurrentSubmissionAt(storedForActive.submittedAt ?? null);
    } else {
      setQuinielaSelections(createEmptySelections(activeJourneyNumber));
      setLastSubmittedAt(null);
      setIsReadOnlyView(false);
      setCurrentSubmissionAt(null);
    }

    setPreviousSubmissionAt(
      storedForPrevious && hasCompletedSelections(storedForPrevious.selections)
        ? storedForPrevious.submittedAt ?? null
        : null,
    );
    setShowSelectionErrors(false);
    hideSubmitTooltip();
  }, [
    user,
    activeJourneyNumber,
    createEmptySelections,
    hideSubmitTooltip,
    resetDownloadState,
    previousJourneyNumber,
  ]);

  const handleSignOut = useCallback(async () => {
    resetDownloadState();
    setManualSaveDataUrl(null);
    setQuinielaSelections(createEmptySelections(CURRENT_JOURNEY));
    setDraftSelectionsByJourney({});
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
    setActiveJourneyNumber(CURRENT_JOURNEY);

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

  const handleOpenProfileView = useCallback(() => {
    resetDownloadState();
    setManualSaveDataUrl(null);
    setIsShareOpen(false);
    setView('profile');
  }, [resetDownloadState]);


  const handleEnterQuiniela = useCallback(
    async (journeyNumber: number) => {
      resetDownloadState();
      setManualSaveDataUrl(null);
      setIsShareOpen(false);
      setShowSelectionErrors(false);
      hideSubmitTooltip();

      setDraftSelectionsByJourney((prev) => ({
        ...prev,
        [activeJourneyNumber]: { ...quinielaSelections },
      }));

      const journeyRecord = journeys.find((journey) => journey.number === journeyNumber);
      const targetCloseDate = journeyRecord?.fechaCierre ?? null;
      const targetClosed = targetCloseDate ? now.getTime() >= targetCloseDate.getTime() : false;

      let nextSelections = draftSelectionsByJourney[journeyNumber]
        ? { ...draftSelectionsByJourney[journeyNumber] }
        : createEmptySelections(journeyNumber);
      let nextReadOnly = targetClosed;
      let submissionDetected = false;
      let submissionTimestamp: string | null = null;

      if (firebaseUser) {
        try {
          const quinielaRef = doc(
            firebaseFirestore,
            'Usuarios',
            firebaseUser.uid,
            'quinielas',
            journeyNumber.toString(),
          );
          const snapshot = await getDoc(quinielaRef);

          if (snapshot.exists()) {
            const meta = resolveSubmissionMetadata(journeyNumber, snapshot.data() as QuinielaDocData);
            if (meta.selections) {
              nextSelections = { ...meta.selections };
            }
            if (meta.submitted) {
              nextReadOnly = true;
              submissionDetected = true;
              submissionTimestamp = meta.submittedAt ?? new Date().toISOString();
            }
          }
        } catch (error) {
          console.error('No se pudo recuperar la quiniela almacenada antes de abrir el formulario', error);
        }
      }

      if (!submissionDetected && user) {
        const stored = loadSubmissionForUser(user.email, journeyNumber);
        if (stored && hasCompletedSelections(stored.selections)) {
          nextSelections = { ...stored.selections };
          nextReadOnly = true;
          submissionDetected = true;
          submissionTimestamp = stored.submittedAt ?? null;
        }
      }

      setDraftSelectionsByJourney((prev) => ({
        ...prev,
        [journeyNumber]: nextSelections,
      }));
      setActiveJourneyNumber(journeyNumber);
      setQuinielaSelections(nextSelections);
      setIsReadOnlyView(nextReadOnly);
      setView('quiniela');

      if (submissionTimestamp) {
        setCurrentSubmissionAt(submissionTimestamp);
        setLastSubmittedAt(submissionTimestamp);
      } else if (!submissionDetected) {
        setCurrentSubmissionAt(null);
        setLastSubmittedAt(null);
      }

      if (submissionDetected && !targetClosed) {
        showToast('Esta jornada ya fue enviada. Mostramos la versión guardada.', 'success');
      }
    },
    [
      activeJourneyNumber,
      createEmptySelections,
      draftSelectionsByJourney,
      firebaseUser,
      hideSubmitTooltip,
      journeys,
      now,
      quinielaSelections,
      resetDownloadState,
      showToast,
      user,
    ],
  );

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
        setDraftSelectionsByJourney((draft) => ({
          ...draft,
          [activeJourneyNumber]: next,
        }));
        return next;
      });
    },
    [activeJourneyNumber, isReadOnlyView, showSelectionErrors, hideSubmitTooltip]
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
      journey: activeJourneyNumber,
    };

    try {
      let badgeResult: Awaited<ReturnType<typeof guardarQuiniela>> | null = null;
      if (firebaseUser) {
        const matches = getMatchesForJourney(activeJourneyNumber);
        const pronosticos = matches.map((match) => submission.selections[match.id]) as Selection[];
        badgeResult = await guardarQuiniela({
          uid: firebaseUser.uid,
          jornada: activeJourneyNumber,
          pronosticos,
          estadoQuiniela: 'enviada',
        });
      }

      persistSubmissionForUser(user.email, activeJourneyNumber, submission);
      setLastSubmittedAt(submission.submittedAt);
      setShowSelectionErrors(false);
      hideSubmitTooltip();
      setIsReadOnlyView(true);
      setDraftSelectionsByJourney((prev) => ({
        ...prev,
        [activeJourneyNumber]: { ...submission.selections },
      }));
      showToast('Pronóstico enviado correctamente.', 'success');

      if (badgeResult) {
        const unlockedDefinitions = badgeResult.unlockedBadges
          .map((badgeId) => CONSTANCY_BADGES_BY_ID[badgeId])
          .filter((definition): definition is ConstancyBadgeDefinition => Boolean(definition));

        setUser((prev) => {
          if (!prev) {
            return prev;
          }

          const nextBadges = { ...prev.constancyBadges };
          unlockedDefinitions.forEach((definition) => {
            nextBadges[definition.id] = {
              unlockedAt: new Date().toISOString(),
              streak: badgeResult.streak,
              threshold: definition.threshold,
            };
          });

          return {
            ...prev,
            constancyStreak: badgeResult.streak,
            constancyLastJourney: badgeResult.lastJourney,
            constancyBadges: nextBadges,
          };
        });

        if (badgeResult.unlockedBadges.length > 0) {
          setBadgeCelebrations((prev) => [...prev, ...unlockedDefinitions]);
          unlockedDefinitions.forEach((definition) => {
            showToast(definition.notificationMessage, 'success');
            void notifyConstancyBadgeUnlock(definition.id);
          });
        }
      }
    } catch (error) {
      console.error('Error al guardar la quiniela', error);
      showToast('No se pudo guardar tu quiniela. Intenta de nuevo.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    activeJourneyNumber,
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
    async (journeyCode: string) => {
      if (!user) {
        showToast('Inicia sesión para ver la quiniela.', 'error');
        return;
      }

      const journeyNumber = parseInt(journeyCode.replace(/\D/g, ''), 10);
      if (Number.isNaN(journeyNumber)) {
        showToast('No encontramos esa quiniela guardada.', 'error');
        return;
      }

      try {
        let remoteSelections: QuinielaSelections | null = null;
        let submittedAt: string | null = null;

        if (firebaseUser) {
          const quinielaRef = doc(
            firebaseFirestore,
            'Usuarios',
            firebaseUser.uid,
            'quinielas',
            journeyNumber.toString(),
          );
          const snapshot = await getDoc(quinielaRef);

          if (snapshot.exists()) {
            const meta = resolveSubmissionMetadata(journeyNumber, snapshot.data() as QuinielaDocData);
            remoteSelections = meta.selections;
            submittedAt = meta.submittedAt ?? null;
          }
        }

        if (!remoteSelections) {
          const storedFallback = loadSubmissionForUser(user.email, journeyNumber);
          if (storedFallback) {
            remoteSelections = storedFallback.selections;
            submittedAt = storedFallback.submittedAt;
          }
        }

        if (!remoteSelections || !hasCompletedSelections(remoteSelections)) {
          showToast('La quiniela guardada no tiene pronósticos válidos.', 'error');
          return;
        }

        const finalSubmittedAt = submittedAt ?? new Date().toISOString();

        const submission: QuinielaSubmission = {
          user,
          selections: remoteSelections,
          submittedAt: finalSubmittedAt,
          journey: journeyNumber,
        };

        persistSubmissionForUser(user.email, journeyNumber, submission);

        setActiveJourneyNumber(journeyNumber);
        setDraftSelectionsByJourney((prev) => ({
          ...prev,
          [journeyNumber]: { ...remoteSelections },
        }));
        setQuinielaSelections({ ...remoteSelections });
        setLastSubmittedAt(finalSubmittedAt);
        setCurrentSubmissionAt(finalSubmittedAt);
        setIsReadOnlyView(true);
        setView('quiniela');
        setShowSelectionErrors(false);
        hideSubmitTooltip();
      } catch (error) {
        console.error('No se pudo cargar la quiniela', error);
        showToast('No se pudo cargar la quiniela. Intenta de nuevo.', 'error');
      }
    },
    [firebaseUser, hideSubmitTooltip, showToast, user]
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

  const journeyStats = useMemo<JourneyStat[]>(() =>
    Object.entries(userQuinielasMap)
      .map(([journeyNumber, data]) => {
        const meta = resolveSubmissionMetadata(Number(journeyNumber), data);
        return {
          journeyNumber: Number(journeyNumber),
          submitted: meta.submitted,
          submittedAt: meta.submittedAt,
          points: meta.puntosObtenidos,
        } as JourneyStat;
      })
      .filter((stat) => VISIBLE_JOURNEY_SET.has(stat.journeyNumber))
      .sort((a, b) => a.journeyNumber - b.journeyNumber),
  [userQuinielasMap]);

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
              matches={activeJourneyMatches}
              seasonLabel={activeJourneyHeader.seasonLabel}
              journeyTitle={activeJourneyHeader.journeyTitle}
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

  if (view === 'quiniela') {
    return (
      <>
        {toastBanner}
        {manualSaveModal}
        <div className="build-badge" aria-hidden="true">
          Versión {BUILD_VERSION}
        </div>
        {quinielaView}
      </>
    );
  }

  let mainContent: JSX.Element = (
    <Dashboard
      user={user}
      onEnterQuiniela={handleEnterQuiniela}
      onViewQuiniela={handleViewSubmission}
      onViewPodium={handleEnterPodium}
      journeyCards={journeyCards}
      journeyCode={`J${activeJourneyNumber.toString().padStart(2, '0')}`}
      journeyCloseLabel={journeyCloseLabel}
      journeyClosedLabel={journeyClosedLabel}
      journeyClosed={journeyClosed}
      journeySubmittedAt={currentJourneySubmittedAt}
      previousJourneyClosedLabel={previousJourneyClosedLabel}
      previousJourneySubmittedAt={previousJourneySubmittedAt}
      onPreviewBadge={handlePreviewBadge}
    />
  );

  if (view === 'podium') {
    mainContent = <PodiumPage />;
  } else if (view === 'profile') {
    mainContent = (
      <ProfilePage
        user={user}
        totalJourneys={FORCED_PARTICIPATION_JOURNEYS}
        journeyStats={journeyStats}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <>
      {badgeCelebrations.length > 0 ? (
        <BadgeCelebrationModal badge={badgeCelebrations[0]} onClose={dismissBadgeCelebration} />
      ) : null}
      {toastBanner}
      {manualSaveModal}
      <div className="build-badge" aria-hidden="true">
        Versión {BUILD_VERSION}
      </div>
      <div className="dashboard-shell">
        <Navbar
          user={user}
          currentView={currentView}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigateToPodium={handleEnterPodium}
          onSignOut={handleSignOut}
          notificationStatus={notificationStatus}
          onEnableNotifications={handleEnableNotifications}
          notificationLoading={isNotificationLoading}
          onNavigateToProfile={handleOpenProfileView}
        />
        {mainContent}
      </div>
    </>
  );
}
