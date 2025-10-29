export type ConstancyBadgeId =
  | "recien-convocado"
  | "debut-sonado"
  | "ni-la-lluvia-me-frena"
  | "sin-romper-el-ritmo"
  | "ya-me-lo-tome-personal"
  | "de-aqui-no-me-mueven"
  | "goat-local";

export type ConstancyBadgeRarity =
  | "comun"
  | "rara"
  | "epica"
  | "legendaria"
  | "mitica"
  | "mitica-ultra";

export interface ConstancyBadgeState {
  unlockedAt: string | null;
  streak: number;
  threshold: number;
}

export type ConstancyBadgeStateMap = Partial<Record<ConstancyBadgeId, ConstancyBadgeState>>;
