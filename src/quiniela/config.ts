import type { UserProfile } from "../components/LoginScreen";

export type TeamCode =
  | "LEO"
  | "PAC"
  | "AME"
  | "TIG"
  | "TIJ"
  | "MON"
  | "PUM"
  | "ATL"
  | "CRU"
  | "SAN"
  | "NEC"
  | "JUA"
  | "MAZ"
  | "QRO"
  | "PUE"
  | "CHI"
  | "SLU"
  | "TOL"
  | "TBD1"
  | "TBD2"
  | "TBD3"
  | "TBD4"
  | "TBD5"
  | "TBD6"
  | "TBD7"
  | "TBD8";

export type Selection = "L" | "E" | "V";

export type MatchInfo = {
  id: string;
  day: "MIÉRCOLES" | "JUEVES" | "VIERNES" | "SÁBADO" | "DOMINGO";
  dateLabel: string;
  time: string;
  home: TeamCode;
  away: TeamCode;
  stadium: string;
  broadcast: string;
};

const JOURNEY17_MATCHES: MatchInfo[] = [
  {
    id: "chi-nec",
    day: "VIERNES",
    dateLabel: "31 OCT",
    time: "17:00 HRS",
    home: "CHI",
    away: "NEC",
    stadium: "ESTADIO AKRON",
    broadcast: "TUBI",
  },
  {
    id: "tol-pue",
    day: "VIERNES",
    dateLabel: "31 OCT",
    time: "17:00 HRS",
    home: "TOL",
    away: "PUE",
    stadium: "ESTADIO NEMESIO DIEZ",
    broadcast: "TUBI",
  },
  {
    id: "jua-qro",
    day: "VIERNES",
    dateLabel: "31 OCT",
    time: "19:00 HRS",
    home: "JUA",
    away: "QRO",
    stadium: "ESTADIO O. BENITO JUÁREZ",
    broadcast: "TUBI",
  },
  {
    id: "mon-atl",
    day: "VIERNES",
    dateLabel: "31 OCT",
    time: "21:00 HRS",
    home: "MON",
    away: "ATL",
    stadium: "ESTADIO BBVA",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "tij-pac",
    day: "VIERNES",
    dateLabel: "31 OCT",
    time: "21:00 HRS",
    home: "TIJ",
    away: "PAC",
    stadium: "ESTADIO CALIENTE",
    broadcast: "TUBI",
  },
  {
    id: "cru-tig",
    day: "SÁBADO",
    dateLabel: "01 NOV",
    time: "15:45 HRS",
    home: "CRU",
    away: "TIG",
    stadium: "NORIA CANCHA 1",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "slu-san",
    day: "SÁBADO",
    dateLabel: "01 NOV",
    time: "17:00 HRS",
    home: "SLU",
    away: "SAN",
    stadium: "ESTADIO ALFONSO LASTRAS",
    broadcast: "ESPN / DISNEY",
  },
  {
    id: "leo-pum",
    day: "SÁBADO",
    dateLabel: "01 NOV",
    time: "17:00 HRS",
    home: "LEO",
    away: "PUM",
    stadium: "ESTADIO NOU CAMP",
    broadcast: "TUBI",
  },
  {
    id: "maz-ame",
    day: "SÁBADO",
    dateLabel: "01 NOV",
    time: "19:00 HRS",
    home: "MAZ",
    away: "AME",
    stadium: "ESTADIO EL ENCANTO",
    broadcast: "TUBI",
  },
];

const LIGUILLA_CUARTOS_MATCHES: MatchInfo[] = [
  {
    id: "cf-1",
    day: "MIÉRCOLES",
    dateLabel: "12 NOV",
    time: "19:00 HRS",
    home: "TBD1",
    away: "TBD2",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
  {
    id: "cf-2",
    day: "MIÉRCOLES",
    dateLabel: "12 NOV",
    time: "21:00 HRS",
    home: "TBD3",
    away: "TBD4",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
  {
    id: "cf-3",
    day: "JUEVES",
    dateLabel: "13 NOV",
    time: "19:00 HRS",
    home: "TBD5",
    away: "TBD6",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
  {
    id: "cf-4",
    day: "JUEVES",
    dateLabel: "13 NOV",
    time: "21:00 HRS",
    home: "TBD7",
    away: "TBD8",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
];

const LIGUILLA_SEMIS_MATCHES: MatchInfo[] = [
  {
    id: "sf-1",
    day: "MIÉRCOLES",
    dateLabel: "19 NOV",
    time: "20:00 HRS",
    home: "TBD1",
    away: "TBD2",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
  {
    id: "sf-2",
    day: "JUEVES",
    dateLabel: "20 NOV",
    time: "20:00 HRS",
    home: "TBD3",
    away: "TBD4",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
];

const LIGUILLA_FINAL_MATCHES: MatchInfo[] = [
  {
    id: "final",
    day: "DOMINGO",
    dateLabel: "30 NOV",
    time: "18:00 HRS",
    home: "TBD1",
    away: "TBD2",
    stadium: "Por confirmar",
    broadcast: "Por confirmar",
  },
];

export const LIGUILLA_STAGE_METADATA = {
  CF: {
    order: 18,
    code: "CF",
    label: "Cuartos de final",
    description: "Llaves de cuartos publicadas al cierre de la jornada 17.",
    header: {
      seasonLabel: "Liguilla 2025",
      journeyTitle: "Cuartos de final",
    },
  },
  SF: {
    order: 19,
    code: "SF",
    label: "Semifinal",
    description: "Cruces definidos después de los cuartos de final.",
    header: {
      seasonLabel: "Liguilla 2025",
      journeyTitle: "Semifinal",
    },
  },
  F: {
    order: 20,
    code: "F",
    label: "Final",
    description: "La gran final se anunciará tras las semifinales.",
    header: {
      seasonLabel: "Liguilla 2025",
      journeyTitle: "Final",
    },
  },
} as const;

type LiguillaStageKey = keyof typeof LIGUILLA_STAGE_METADATA;

const LIGUILLA_STAGE_LIST = Object.entries(LIGUILLA_STAGE_METADATA).map(([id, meta]) => ({
  id,
  ...meta,
}));

const JOURNEY_DOC_ORDER_MAP: Record<string, number> = {
  "17": 17,
};

LIGUILLA_STAGE_LIST.forEach((stage) => {
  JOURNEY_DOC_ORDER_MAP[stage.id] = stage.order;
  JOURNEY_DOC_ORDER_MAP[stage.code] = stage.order;
});

const JOURNEY_ORDER_DOC_MAP: Record<number, string> = Object.entries(JOURNEY_DOC_ORDER_MAP).reduce(
  (acc, [docId, order]) => {
    acc[order] = docId;
    return acc;
  },
  {} as Record<number, string>
);

export const VISIBLE_JOURNEY_ORDERS = [17, ...LIGUILLA_STAGE_LIST.map((stage) => stage.order)];

export const JOURNEY_MATCHES: Record<number, MatchInfo[]> = {
  17: JOURNEY17_MATCHES,
  18: LIGUILLA_CUARTOS_MATCHES,
  19: LIGUILLA_SEMIS_MATCHES,
  20: LIGUILLA_FINAL_MATCHES,
};

export const DEFAULT_JOURNEY_NUMBER = 17;

export const MATCHES: MatchInfo[] = JOURNEY_MATCHES[DEFAULT_JOURNEY_NUMBER];

export const getMatchesForJourney = (journeyNumber: number): MatchInfo[] =>
  JOURNEY_MATCHES[journeyNumber] ?? JOURNEY_MATCHES[DEFAULT_JOURNEY_NUMBER];

export const JOURNEY_HEADERS: Record<
  number,
  {
    seasonLabel: string;
    journeyTitle: string;
  }
> = {
  17: {
    seasonLabel: "APERTURA 2025",
    journeyTitle: "JORNADA 17",
  },
};

LIGUILLA_STAGE_LIST.forEach((stage) => {
  JOURNEY_HEADERS[stage.order] = stage.header;
});

export const getJourneyHeader = (journeyNumber: number): { seasonLabel: string; journeyTitle: string } =>
  JOURNEY_HEADERS[journeyNumber] ?? JOURNEY_HEADERS[DEFAULT_JOURNEY_NUMBER];

export const getJourneyCodeLabel = (journeyNumber: number): string => {
  const stage = LIGUILLA_STAGE_LIST.find((entry) => entry.order === journeyNumber);
  if (stage) {
    return stage.code;
  }
  return `J${journeyNumber.toString().padStart(2, "0")}`;
};

export const getStageMetaByDocId = (docId: string) => {
  const normalized = docId.trim().toUpperCase();
  return (LIGUILLA_STAGE_METADATA as Record<string, (typeof LIGUILLA_STAGE_METADATA)[LiguillaStageKey]>)[normalized] ?? null;
};

export const getStageMetaByOrder = (order: number) =>
  LIGUILLA_STAGE_LIST.find((stage) => stage.order === order) ?? null;

export const resolveJourneyOrder = (id: string): number | null => {
  if (!id) {
    return null;
  }

  const normalized = id.trim().toUpperCase();
  if (normalized in JOURNEY_DOC_ORDER_MAP) {
    return JOURNEY_DOC_ORDER_MAP[normalized];
  }

  const numericId = Number.parseInt(normalized, 10);
  if (!Number.isNaN(numericId)) {
    return numericId;
  }

  const match = normalized.match(/\d+/);
  if (match) {
    const parsed = Number.parseInt(match[0], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

export const getJourneyDocId = (journeyNumber: number): string => {
  const docId = JOURNEY_ORDER_DOC_MAP[journeyNumber];
  if (docId) {
    return docId;
  }
  return journeyNumber.toString();
};

export const isLiguillaOrder = (journeyNumber: number): boolean =>
  LIGUILLA_STAGE_LIST.some((stage) => stage.order === journeyNumber);

export const isLiguillaDocId = (docId: string): boolean => Boolean(getStageMetaByDocId(docId));

export type QuinielaSelections = Record<string, Selection | null>;

export const createEmptySelections = (journeyNumber: number = DEFAULT_JOURNEY_NUMBER): QuinielaSelections =>
  getMatchesForJourney(journeyNumber).reduce<QuinielaSelections>((acc, match) => {
    acc[match.id] = null;
    return acc;
  }, {});

export type QuinielaSubmission = {
  user: UserProfile;
  selections: QuinielaSelections;
  submittedAt: string;
  journey: number;
};

export const QUINIELA_STORAGE_KEY = "quiniela-submissions";
