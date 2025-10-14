import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Trophy,
} from "lucide-react";
import { ROLE_LABELS, type UserProfile } from "./LoginScreen";
import { TOP_RANKING } from "../data/podium";
import logoSomosLocales from "figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png";
import "../styles/dashboard.css";

interface DashboardProps {
  user: UserProfile;
  onEnterQuiniela: () => void;
  onViewQuiniela?: (journeyCode: string) => void;
  onViewPodium?: () => void;
}

const communityNotes = [
  "Toda la pasión de la grada se siente en cada pronóstico.",
  "Prepara tus datos, suma intuición y juega con corazón local.",
  "Tu voz inspira a más fans a vivir el fútbol femenil.",
];

const tips = [
  "Revisa la energía con la que llegan tus equipos a la jornada.",
  "Activa recordatorios 30 minutos antes de que cierre la quiniela.",
  "Comparte tus picks en el grupo de la comunidad Somos Locales.",
];

const ranking = TOP_RANKING.slice(0, 4).map((entry, index) => ({
  id: entry.id,
  name: entry.name,
  score: `${entry.points} pts`,
  position: index + 1,
}));

interface TournamentSectionState {
  id: string;
  collapsed: boolean;
}

const COLLAPSED_SECTIONS = new Set(["regular", "liguilla"]);

const tournamentSections = [
  {
    id: "regular",
    appearance: "regular" as const,
    title: "Torneo Regular",
    statusTags: [
      { id: "progress", label: "Jornadas (10/17)", tone: "progress" as const },
    ],
    cards: [
      {
        id: "j17",
        code: "J17",
        statusLabel: "Próximamente",
        meta: "Publicamos el rol de juegos el 28 de octubre",
        tone: "upcoming" as const,
      },
      {
        id: "j16",
        code: "J16",
        statusLabel: "Próximamente",
        meta: "Inicia el 20 de octubre",
        tone: "upcoming" as const,
      },
      {
        id: "j15",
        code: "J15",
        statusLabel: "En curso",
        meta: "Cierra 12 de octubre · 18:00 h",
        tone: "current" as const,
        ctaLabel: "Participar",
      },
      {
        id: "j14",
        code: "J14",
        statusLabel: "Enviado",
        meta: "Pronóstico enviado el 05 de octubre",
        tone: "success" as const,
      },
      {
        id: "j13",
        code: "J13",
        statusLabel: "Enviado",
        meta: "Resultado final publicado",
        tone: "success" as const,
      },
      {
        id: "j12",
        code: "J12",
        statusLabel: "Enviado",
        meta: "Tu pronóstico quedó registrado",
        tone: "success" as const,
      },
      {
        id: "j11",
        code: "J11",
        statusLabel: "Expirado",
        meta: "Cerró el 18 de septiembre",
        tone: "warning" as const,
      },
      {
        id: "j10",
        code: "J10",
        statusLabel: "Expirado",
        meta: "Cerró el 11 de septiembre",
        tone: "warning" as const,
      },
      {
        id: "j9",
        code: "J09",
        statusLabel: "Expirado",
        meta: "Repasa los resultados finales",
        tone: "warning" as const,
      },
      {
        id: "j8",
        code: "J08",
        statusLabel: "Expirado",
        meta: "Cerró el 28 de agosto",
        tone: "warning" as const,
      },
      {
        id: "j7",
        code: "J07",
        statusLabel: "Expirado",
        meta: "Cerró el 21 de agosto",
        tone: "warning" as const,
      },
      {
        id: "j6",
        code: "J06",
        statusLabel: "Expirado",
        meta: "Cerró el 14 de agosto",
        tone: "warning" as const,
      },
      {
        id: "j5",
        code: "J05",
        statusLabel: "Expirado",
        meta: "Cerró el 7 de agosto",
        tone: "warning" as const,
      },
      {
        id: "j4",
        code: "J04",
        statusLabel: "Expirado",
        meta: "Cerró el 31 de julio",
        tone: "warning" as const,
      },
      {
        id: "j3",
        code: "J03",
        statusLabel: "Expirado",
        meta: "Cerró el 24 de julio",
        tone: "warning" as const,
      },
      {
        id: "j2",
        code: "J02",
        statusLabel: "Expirado",
        meta: "Cerró el 17 de julio",
        tone: "warning" as const,
      },
      {
        id: "j1",
        code: "J01",
        statusLabel: "Expirado",
        meta: "Cerró el 10 de julio",
        tone: "warning" as const,
      },
    ],
  },
  {
    id: "liguilla",
    appearance: "elimination" as const,
    title: "Liguilla",
    subtitle: "4 jornadas por disputar",
    statusTags: [
      { id: "available", label: "Disponible pronto", tone: "neutral" as const },
    ],
    cards: [
      {
        id: "cuartos",
        code: "C1",
        statusLabel: "Próximamente",
        meta: "Publicamos llaves el 5 de noviembre",
        tone: "upcoming" as const,
      },
      {
        id: "semis",
        code: "S1",
        statusLabel: "Próximamente",
        meta: "Se define tras cuartos",
        tone: "upcoming" as const,
      },
      {
        id: "final",
        code: "F1",
        statusLabel: "Próximamente",
        meta: "La gran final se confirma en diciembre",
        tone: "upcoming" as const,
      },
    ],
  },
];

export function Dashboard({ user, onEnterQuiniela, onViewQuiniela, onViewPodium }: DashboardProps) {
  const [sectionState, setSectionState] = useState<TournamentSectionState[]>(
    tournamentSections.map((section) => ({
      id: section.id,
      collapsed: COLLAPSED_SECTIONS.has(section.id),
    }))
  );

  const isSectionCollapsed = (sectionId: string) => sectionState.find((state) => state.id === sectionId)?.collapsed;

  const toggleSection = (sectionId: string) => {
    setSectionState((prev) =>
      prev.map((entry) =>
        entry.id === sectionId ? { ...entry, collapsed: !entry.collapsed } : entry
      )
    );
  };

  const firstName = user.name.trim().split(" ")[0] || user.name;
  const activeJourney = tournamentSections
    .find((section) => section.id === "regular")
    ?.cards.find((card) => card.tone === "current");
  const activeJourneyNumber = activeJourney?.code ? activeJourney.code.replace(/[^0-9]/g, "") : "";
  const participateLabel = activeJourney?.code
    ? `Participa en jornada ${activeJourney.code}`
    : "Participa en jornada";

  return (
    <div className="dashboard-page">
      <section className="dashboard-section dashboard-hero">
        <div className="hero-banner">
          <span className="hero-badge">
            <Flag size={16} aria-hidden="true" />
            Quiniela
          </span>
          <h1 className="hero-title">Hola {firstName}, la quiniela te espera</h1>
          <p className="hero-text">
            Sumemos voz a la liga femenil con intuición y juego limpio. Completa tu pronóstico, compártelo con tu equipo
            y celebremos cada gol juntas.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onEnterQuiniela}>
              {participateLabel}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <aside className="hero-card hero-card--ranking" aria-labelledby="hero-card-title">
          <span id="hero-card-title" className="hero-card__chip">
            <Trophy size={16} aria-hidden="true" />
            Pódium
          </span>
          <ul className="ranking-list ranking-list--featured">
            {ranking.map((entry) => (
              <li key={entry.id} className="ranking-item">
                <span className="ranking-position">{entry.position}</span>
                <span className="ranking-name">{entry.name}</span>
                <span className="ranking-score">{entry.score}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary ranking-fullboard-button" onClick={() => onViewPodium?.()}>
            Ver ranking completo
          </button>
        </aside>
      </section>

      <section className="dashboard-section tournament-panel">
        <div className="tournament-panel__stack">
          {tournamentSections.map((section) => {
            const collapsed = Boolean(isSectionCollapsed(section.id));

            return (
              <article
                key={section.id}
                className="tournament-panel__block"
                data-collapsed={collapsed}
                data-scheme={section.appearance}
              >
                <header className="tournament-panel__header">
                  <div className="tournament-panel__title-group">
                    <h2 className="tournament-panel__title">{section.title}</h2>
                    <p className="tournament-panel__subtitle" data-hidden={Boolean(section.subtitle)}>
                      {section.subtitle}
                    </p>
                  </div>

                  <div className="tournament-panel__header-actions">
                    <div className="tournament-panel__tags">
                      {section.statusTags.map((tag) => (
                        <span key={tag.id} className="tournament-tag" data-tone={tag.tone}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="tournament-panel__action"
                      onClick={() => toggleSection(section.id)}
                      aria-label={collapsed ? "Expandir sección" : "Contraer sección"}
                    >
                      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                </header>

              <div className="tournament-panel__grid" data-hidden={collapsed}>
                {section.cards.map((card) => {
                  return (
                    <article key={card.id} className="journey-card" data-tone={card.tone}>
                      <header className="journey-card__header">
                        <div className="journey-card__main">
                          <span className="journey-card__code">{card.code}</span>
                          <span className="journey-card__status-tag" data-tone={card.tone}>
                            <span className="journey-card__status-icon" aria-hidden="true">
                              {card.tone === "success" ? (
                                <Check size={14} />
                              ) : card.tone === "warning" ? (
                                <AlertTriangle size={14} />
                              ) : card.tone === "upcoming" ? (
                                <Clock size={14} />
                              ) : (
                                <CalendarClock size={14} />
                              )}
                            </span>
                            <span>{card.statusLabel}</span>
                          </span>
                        </div>
                        <div className="journey-card__actions" data-empty={
                          !(card.ctaLabel || card.tone === "success")
                        }>
                          {card.ctaLabel ? (
                            <button
                              type="button"
                              className="journey-card__cta"
                              data-tone={card.tone}
                              onClick={onEnterQuiniela}
                            >
                              {card.ctaLabel}
                            </button>
                          ) : null}
                          {card.tone === "success" ? (
                            <button
                              type="button"
                              className="journey-card__link journey-card__link--inline"
                              onClick={() => onViewQuiniela?.(card.code)}
                            >
                              Ver
                            </button>
                          ) : null}
                        </div>
                      </header>
                    </article>
                  );
                })}
              </div>
            </article>
          );
          })}

        </div>
      </section>
    </div>
  );
}
