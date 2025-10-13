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
  day: "VIERNES" | "SÁBADO" | "DOMINGO";
  dateLabel: string;
  time: string;
  home: TeamCode;
  away: TeamCode;
  stadium: string;
  broadcast: string;
};

export const MATCHES: MatchInfo[] = [
  {
    id: "leo-pac",
    day: "VIERNES",
    dateLabel: "10 OCT",
    time: "17:00 HRS",
    home: "LEO",
    away: "PAC",
    stadium: "ESTADIO NOU CAMP",
    broadcast: "TUBI",
  },
  {
    id: "ame-tig",
    day: "VIERNES",
    dateLabel: "10 OCT",
    time: "19:00 HRS",
    home: "AME",
    away: "TIG",
    stadium: "CIUDAD DE LOS DEPORTES",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "tij-mon",
    day: "VIERNES",
    dateLabel: "10 OCT",
    time: "21:00 HRS",
    home: "TIJ",
    away: "MON",
    stadium: "ESTADIO CALIENTE",
    broadcast: "TUBI",
  },
  {
    id: "pum-atl",
    day: "SÁBADO",
    dateLabel: "11 OCT",
    time: "12:00 HRS",
    home: "PUM",
    away: "ATL",
    stadium: "OLÍMPICO UNIVERSITARIO",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "cru-san",
    day: "SÁBADO",
    dateLabel: "11 OCT",
    time: "15:45 HRS",
    home: "CRU",
    away: "SAN",
    stadium: "NORIA CANCHA 1",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "nec-jua",
    day: "SÁBADO",
    dateLabel: "11 OCT",
    time: "19:00 HRS",
    home: "NEC",
    away: "JUA",
    stadium: "ESTADIO VICTORIA",
    broadcast: "LMXF YOUTUBE / VIX",
  },
  {
    id: "maz-qro",
    day: "SÁBADO",
    dateLabel: "11 OCT",
    time: "21:00 HRS",
    home: "MAZ",
    away: "QRO",
    stadium: "ESTADIO EL ENCANTO",
    broadcast: "TUBI",
  },
  {
    id: "pue-chi",
    day: "DOMINGO",
    dateLabel: "12 OCT",
    time: "11:00 HRS",
    home: "PUE",
    away: "CHI",
    stadium: "ESTADIO CUAUHTÉMOC",
    broadcast: "TUBI",
  },
  {
    id: "slu-tol",
    day: "DOMINGO",
    dateLabel: "12 OCT",
    time: "17:00 HRS",
    home: "SLU",
    away: "TOL",
    stadium: "ESTADIO ALFONSO LASTRAS",
    broadcast: "ESPN / DISNEY",
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
