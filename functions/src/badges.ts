export type ConstancyBadgeId =
  | "recien-convocado"
  | "debut-sonado"
  | "ni-la-lluvia-me-frena"
  | "sin-romper-el-ritmo"
  | "ya-me-lo-tome-personal"
  | "de-aqui-no-me-mueven"
  | "goat-local";

interface ConstancyBadgeDefinition {
  id: ConstancyBadgeId;
  title: string;
  threshold: number;
  notificationMessage: string;
}

export const CONSTANCY_BADGES: ConstancyBadgeDefinition[] = [
  {
    id: "recien-convocado",
    title: "Recién Convocado",
    threshold: 2,
    notificationMessage:
      "🧢 ¡Recién Convocado! Ya entraste al juego, " +
      "no hay vuelta atrás 💛⚽️",
  },
  {
    id: "debut-sonado",
    title: "Debut Soñado",
    threshold: 5,
    notificationMessage:
      "🎉 5 seguidas. ¡Debut soñado! " +
      "Vas directo a la titularidad 🔥",
  },
  {
    id: "ni-la-lluvia-me-frena",
    title: "Ni la Lluvia Me Frena",
    threshold: 8,
    notificationMessage:
      "🌧️ 8 seguidas. Ni la lluvia ni el VAR " +
      "te detienen 🌩️🔥",
  },
  {
    id: "sin-romper-el-ritmo",
    title: "Sin Romper el Ritmo",
    threshold: 11,
    notificationMessage:
      "🎶 11 seguidas. Sigues el ritmo perfecto, " +
      "¡ni fuera de lugar te frena! 🎯",
  },
  {
    id: "ya-me-lo-tome-personal",
    title: "Ya Me lo Tomé Personal",
    threshold: 14,
    notificationMessage:
      "💥 14 seguidas. Ya te lo tomaste personal, " +
      "nadie te saca del once ✨",
  },
  {
    id: "de-aqui-no-me-mueven",
    title: "De Aquí No Me Mueven",
    threshold: 18,
    notificationMessage:
      "🛡️ 18 seguidas. Imposible moverte, " +
      "eres puro compromiso ⚡️",
  },
  {
    id: "goat-local",
    title: "MVP",
    threshold: 21,
    notificationMessage:
      "🐐 ¡MVP desbloqueado! 21 seguidas. " +
      "No eres el mejor del mundo, pero sí del rumbo 🏆🔥",
  },
];

export const CONSTANCY_BADGES_BY_ID =
  CONSTANCY_BADGES.reduce<Record<ConstancyBadgeId, ConstancyBadgeDefinition>>(
    (acc, badge) => {
      acc[badge.id] = badge;
      return acc;
    },
    {} as Record<ConstancyBadgeId, ConstancyBadgeDefinition>,
  );
