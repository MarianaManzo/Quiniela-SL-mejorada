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

export const MATCHES: MatchInfo[] = [
  {
    id: "atl-ame",
    day: "MIÉRCOLES",
    dateLabel: "15 OCT",
    time: "19:00 HRS",
    home: "ATL",
    away: "AME",
    stadium: "ESTADIO JALISCO",
    broadcast: "TUBI",
  },
  {
    id: "pum-jua",
    day: "JUEVES",
    dateLabel: "16 OCT",
    time: "18:00 HRS",
    home: "PUM",
    away: "JUA",
    stadium: "OLÍMPICO UNIVERSITARIO",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "qro-cru",
    day: "VIERNES",
    dateLabel: "17 OCT",
    time: "17:00 HRS",
    home: "QRO",
    away: "CRU",
    stadium: "ESTADIO OLÍMPICO ALAMEDA",
    broadcast: "TUBI",
  },
  {
    id: "nec-tol",
    day: "VIERNES",
    dateLabel: "17 OCT",
    time: "17:00 HRS",
    home: "NEC",
    away: "TOL",
    stadium: "ESTADIO VICTORIA",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "san-maz",
    day: "VIERNES",
    dateLabel: "17 OCT",
    time: "19:00 HRS",
    home: "SAN",
    away: "MAZ",
    stadium: "ESTADIO TSM CORONA",
    broadcast: "TUBI",
  },
  {
    id: "tig-slu",
    day: "SÁBADO",
    dateLabel: "18 OCT",
    time: "12:00 HRS",
    home: "TIG",
    away: "SLU",
    stadium: "ESTADIO UNIVERSITARIO",
    broadcast: "FOX SPORTS",
  },
  {
    id: "pue-tij",
    day: "DOMINGO",
    dateLabel: "19 OCT",
    time: "12:00 HRS",
    home: "PUE",
    away: "TIJ",
    stadium: "ESTADIO CUAUHTÉMOC",
    broadcast: "TUBI",
  },
  {
    id: "mon-leo",
    day: "DOMINGO",
    dateLabel: "19 OCT",
    time: "17:00 HRS",
    home: "MON",
    away: "LEO",
    stadium: "ESTADIO BBVA",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "pac-chi",
    day: "DOMINGO",
    dateLabel: "19 OCT",
    time: "19:00 HRS",
    home: "PAC",
    away: "CHI",
    stadium: "ESTADIO HIDALGO",
    broadcast: "TUBI",
  },
];

export type QuinielaSelections = Record<string, Selection | null>;

export const createEmptySelections = (): QuinielaSelections =>
  MATCHES.reduce<QuinielaSelections>((acc, match) => {
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
