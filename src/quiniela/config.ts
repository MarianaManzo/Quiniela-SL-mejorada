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
  | "TOL";

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

const JOURNEY18_MATCHES: MatchInfo[] = JOURNEY17_MATCHES.map((match, index) => ({
  ...match,
  id: `j18-match-${index + 1}`,
}));

export const JOURNEY_MATCHES: Record<number, MatchInfo[]> = {
  17: JOURNEY17_MATCHES,
  18: JOURNEY18_MATCHES,
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
  18: {
    seasonLabel: "APERTURA 2025",
    journeyTitle: "JORNADA 18",
  },
};

export const getJourneyHeader = (journeyNumber: number): { seasonLabel: string; journeyTitle: string } =>
  JOURNEY_HEADERS[journeyNumber] ?? JOURNEY_HEADERS[DEFAULT_JOURNEY_NUMBER];

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
