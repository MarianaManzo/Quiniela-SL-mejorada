import type { ConstancyBadgeId, ConstancyBadgeRarity } from "../types/badges";

export interface ConstancyBadgeTheme {
  background: string;
  border: string;
  badgeBackground: string;
  badgeColor: string;
  accent: string;
}

export interface ConstancyBadgeDefinition {
  id: ConstancyBadgeId;
  title: string;
  threshold: number;
  description: string;
  rarity: ConstancyBadgeRarity;
  icon: string;
  notificationMessage: string;
  theme: ConstancyBadgeTheme;
  image?: string | null;
}

export const CONSTANCY_BADGES: ConstancyBadgeDefinition[] = [
  {
    id: "recien-convocado",
    title: "Recién Convocado",
    threshold: 2,
    description: "Apenas aprendiste las reglas, pero ya estás dentro.",
    rarity: "comun",
    icon: "🧢",
    notificationMessage: "🧢 ¡Recién Convocado! Ya entraste al juego, no hay vuelta atrás 💛⚽️",
    theme: {
      background: "linear-gradient(135deg, rgba(46,49,60,0.95), rgba(29,31,38,0.92))",
      border: "rgba(255,255,255,0.18)",
      badgeBackground: "linear-gradient(135deg, rgba(83,86,97,0.85), rgba(66,68,78,0.85))",
      badgeColor: "#f1f5f9",
      accent: "#f6d433",
    },
    image: "/Insignias/1-recienconvocado.png",
  },
  {
    id: "debut-sonado",
    title: "Debut Soñado",
    threshold: 5,
    description: "Primera mini-racha seria. Ya eres parte del vestidor.",
    rarity: "rara",
    icon: "🎉",
    notificationMessage: "🎉 ¡5 seguidas. ¡Debut soñado! Vas directo a la titularidad 🔥",
    theme: {
      background: "linear-gradient(135deg, rgba(53,38,78,0.92), rgba(30,20,54,0.9))",
      border: "rgba(190,145,255,0.6)",
      badgeBackground: "linear-gradient(135deg, rgba(110,57,190,0.8), rgba(64,28,128,0.8))",
      badgeColor: "#fbe7ff",
      accent: "#bf9eff",
    },
    image: "/Insignias/2-Debutsoñado.png",
  },
  {
    id: "ni-la-lluvia-me-frena",
    title: "Ni la Lluvia Me Frena",
    threshold: 8,
    description: "Participas llueva, truene o haya final del Tri.",
    rarity: "epica",
    icon: "🌧️",
    notificationMessage: "🌧️ 8 seguidas. Ni la lluvia ni el VAR te detienen 🌩️🔥",
    theme: {
      background: "linear-gradient(135deg, rgba(20,39,62,0.95), rgba(12,24,40,0.92))",
      border: "rgba(126,198,255,0.55)",
      badgeBackground: "linear-gradient(135deg, rgba(47,84,122,0.85), rgba(22,56,92,0.85))",
      badgeColor: "#bfe2ff",
      accent: "#7ec6ff",
    },
    image: "/Insignias/3-Noparessiguesigue.png",
  },
  {
    id: "sin-romper-el-ritmo",
    title: "Sin Romper el Ritmo",
    threshold: 11,
    description: "Ya eres una máquina de constancia: puro flow quinielero.",
    rarity: "epica",
    icon: "🎶",
    notificationMessage: "🎶 11 seguidas. Sigues el ritmo perfecto, ¡ni fuera de lugar te frena! 🎯",
    theme: {
      background: "linear-gradient(135deg, rgba(70,30,84,0.95), rgba(36,11,44,0.92))",
      border: "rgba(216,173,255,0.55)",
      badgeBackground: "linear-gradient(135deg, rgba(116,48,140,0.85), rgba(73,24,90,0.85))",
      badgeColor: "#f7e0ff",
      accent: "#e2adff",
    },
    image: "/Insignias/4-NadaMeDetiene.png",
  },
  {
    id: "ya-me-lo-tome-personal",
    title: "Ya Me lo Tomé Personal",
    threshold: 14,
    description: "Dijiste “ya no falto ni una”, y lo cumpliste (por ahora).",
    rarity: "legendaria",
    icon: "💥",
    notificationMessage: "💥 14 seguidas. Ya te lo tomaste personal, nadie te saca del once ✨",
    theme: {
      background: "linear-gradient(135deg, rgba(72,42,8,0.95), rgba(47,24,4,0.9))",
      border: "rgba(255,216,137,0.65)",
      badgeBackground: "linear-gradient(135deg, rgba(150,97,30,0.88), rgba(105,64,18,0.85))",
      badgeColor: "#ffe7bb",
      accent: "#ffcf5d",
    },
    image: "/Insignias/5-yaMeLoTomePersonal.png",
  },
  {
    id: "de-aqui-no-me-mueven",
    title: "De Aquí No Me Mueven",
    threshold: 18,
    description: "Ni puente, ni vacaciones, ni excusas: sigues firme.",
    rarity: "mitica",
    icon: "🛡️",
    notificationMessage: "🛡️ 18 seguidas. Imposible moverte, eres puro compromiso ⚡️",
    theme: {
      background: "linear-gradient(135deg, rgba(24,36,78,0.96), rgba(13,24,56,0.92))",
      border: "rgba(160,188,255,0.55)",
      badgeBackground: "linear-gradient(135deg, rgba(52,82,158,0.88), rgba(28,49,112,0.88))",
      badgeColor: "#d6e2ff",
      accent: "#9db6ff",
    },
    image: "/Insignias/6-Dequinomemueven.png",
  },
  {
    id: "goat-local",
    title: "GOAT Local",
    threshold: 21,
    description: "Completaste toda la temporada. Constancia nivel leyenda.",
    rarity: "mitica-ultra",
    icon: "🐐",
    notificationMessage: "🐐 ¡GOAT Local desbloqueado! 21 seguidas. Eres historia de la quiniela 🏆🔥",
    theme: {
      background: "linear-gradient(135deg, rgba(94,72,12,0.98), rgba(58,42,6,0.95))",
      border: "rgba(255,232,170,0.75)",
      badgeBackground: "linear-gradient(135deg, rgba(210,168,52,0.95), rgba(164,121,35,0.9))",
      badgeColor: "#fff6d3",
      accent: "#ffe082",
    },
    image: "/Insignias/7-Mvp.png",
  },
];

export const CONSTANCY_BADGES_BY_ID = CONSTANCY_BADGES.reduce<Record<ConstancyBadgeId, ConstancyBadgeDefinition>>(
  (acc, badge) => {
    acc[badge.id] = badge;
    return acc;
  },
  {} as Record<ConstancyBadgeId, ConstancyBadgeDefinition>,
);
