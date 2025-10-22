import { useEffect, useMemo, useState } from "react";
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
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import logoSomosLocales from "figma:asset/logo-somos-locales.png";
import "../styles/dashboard.css";

interface DashboardProps {
  user: UserProfile;
  onEnterQuiniela: () => void;
  onViewQuiniela?: (journeyCode: string) => void;
  onViewPodium?: () => void;
  journeyCode?: string;
  journeyCloseLabel?: string | null;
  journeyClosedLabel?: string | null;
  journeyClosed?: boolean;
  journeySubmittedAt?: string | null;
  previousJourneyClosedLabel?: string | null;
  previousJourneySubmittedAt?: string | null;
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

interface TournamentSectionState {
  id: string;
  collapsed: boolean;
}

type JourneyTone = "current" | "success" | "warning" | "upcoming";

interface JourneyCard {
  id: string;
  code: string;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  ctaLabel?: string;
  ctaMobileLabel?: string;
}

type StatusTagTone = "progress" | "neutral";

interface TournamentSection {
  id: string;
  appearance: "regular" | "elimination";
  title: string;
  subtitle?: string;
  statusTags: { id: string; label: string; tone: StatusTagTone }[];
  cards: JourneyCard[];
}

const COLLAPSED_SECTIONS = new Set(["regular", "liguilla"]);

const tournamentSections: TournamentSection[] = [
  {
    id: "regular",
    appearance: "regular",
    title: "Torneo Regular",
    statusTags: [
      { id: "progress", label: "Jornadas (10/17)", tone: "progress" },
    ],
    cards: [
      {
        id: "j17",
        code: "J17",
        statusLabel: "Próximamente",
        meta: "Publicamos el rol de juegos el 28 de octubre",
        tone: "upcoming",
      },
      {
        id: "j16",
        code: "J16",
        statusLabel: "Próximamente",
        meta: "Inicia el 20 de octubre",
        tone: "upcoming",
      },
      {
        id: "j15",
        code: "J15",
        statusLabel: "En curso",
        meta: "Cierra 12 de octubre · 18:00 h",
        tone: "current",
        ctaLabel: "Participar",
        ctaMobileLabel: "Participa",
      },
      {
        id: "j14",
        code: "J14",
        statusLabel: "Enviado",
        meta: "Pronóstico enviado el 05 de octubre",
        tone: "success",
      },
      {
        id: "j13",
        code: "J13",
        statusLabel: "Enviado",
        meta: "Resultado final publicado",
        tone: "success",
      },
      {
        id: "j12",
        code: "J12",
        statusLabel: "Enviado",
        meta: "Tu pronóstico quedó registrado",
        tone: "success",
      },
      {
        id: "j11",
        code: "J11",
        statusLabel: "Expirado",
        meta: "Cerró el 18 de septiembre",
        tone: "warning",
      },
      {
        id: "j10",
        code: "J10",
        statusLabel: "Expirado",
        meta: "Cerró el 11 de septiembre",
        tone: "warning",
      },
      {
        id: "j9",
        code: "J09",
        statusLabel: "Expirado",
        meta: "Repasa los resultados finales",
        tone: "warning",
      },
      {
        id: "j8",
        code: "J08",
        statusLabel: "Expirado",
        meta: "Cerró el 28 de agosto",
        tone: "warning",
      },
      {
        id: "j7",
        code: "J07",
        statusLabel: "Expirado",
        meta: "Cerró el 21 de agosto",
        tone: "warning",
      },
      {
        id: "j6",
        code: "J06",
        statusLabel: "Expirado",
        meta: "Cerró el 14 de agosto",
        tone: "warning",
      },
      {
        id: "j5",
        code: "J05",
        statusLabel: "Expirado",
        meta: "Cerró el 7 de agosto",
        tone: "warning",
      },
      {
        id: "j4",
        code: "J04",
        statusLabel: "Expirado",
        meta: "Cerró el 31 de julio",
        tone: "warning",
      },
      {
        id: "j3",
        code: "J03",
        statusLabel: "Expirado",
        meta: "Cerró el 24 de julio",
        tone: "warning",
      },
      {
        id: "j2",
        code: "J02",
        statusLabel: "Expirado",
        meta: "Cerró el 17 de julio",
        tone: "warning",
      },
      {
        id: "j1",
        code: "J01",
        statusLabel: "Expirado",
        meta: "Cerró el 10 de julio",
        tone: "warning",
      },
    ],
  },
  {
    id: "liguilla",
    appearance: "elimination",
    title: "Liguilla",
    subtitle: "4 jornadas por disputar",
    statusTags: [
      { id: "available", label: "Disponible pronto", tone: "neutral" },
    ],
    cards: [
      {
        id: "cuartos",
        code: "C1",
        statusLabel: "Próximamente",
        meta: "Publicamos llaves el 5 de noviembre",
        tone: "upcoming",
      },
      {
        id: "semis",
        code: "S1",
        statusLabel: "Próximamente",
        meta: "Se define tras cuartos",
        tone: "upcoming",
      },
      {
        id: "final",
        code: "F1",
        statusLabel: "Próximamente",
        meta: "La gran final se confirma en diciembre",
        tone: "upcoming",
      },
    ],
  },
];

export function Dashboard({
  user,
  onEnterQuiniela,
  onViewQuiniela,
  onViewPodium,
  journeyCode,
  journeyCloseLabel,
  journeyClosedLabel,
  journeyClosed = false,
  journeySubmittedAt,
  previousJourneyClosedLabel,
  previousJourneySubmittedAt,
}: DashboardProps) {
  const [sectionState, setSectionState] = useState<TournamentSectionState[]>(
    tournamentSections.map((section) => ({
      id: section.id,
      collapsed: COLLAPSED_SECTIONS.has(section.id),
    }))
  );
  const [topRanking, setTopRanking] = useState(
    TOP_RANKING.slice(0, 4).map((entry, index) => ({
      id: String(entry.id),
      name: entry.name,
      score: `${entry.points} pts`,
      position: index + 1,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    const loadRanking = async () => {
      try {
        const podium = await obtenerUsuariosParaPodio(4);
        if (cancelled || podium.length === 0) {
          return;
        }

        setTopRanking(
          podium.map((entry, index) => ({
            id: entry.id,
            name: entry.nombre,
            score: `${entry.puntosTotales} pts`,
            position: index + 1,
          }))
        );
      } catch (error) {
        console.error("No se pudo cargar el ranking destacado", error);
      }
    };

    void loadRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSectionCollapsed = (sectionId: string) => sectionState.find((state) => state.id === sectionId)?.collapsed;

  const toggleSection = (sectionId: string) => {
    setSectionState((prev) =>
      prev.map((entry) =>
        entry.id === sectionId ? { ...entry, collapsed: !entry.collapsed } : entry
      )
    );
  };

  const firstName = user.name.trim().split(" ")[0] || user.name;
  const hasSubmitted = Boolean(journeySubmittedAt);
  const journeyNumber = journeyCode ? Number.parseInt(journeyCode.replace(/\D/g, ''), 10) : null;
  const previousJourneyCode = journeyNumber && journeyNumber > 1 ? `J${String(journeyNumber - 1).padStart(2, '0')}` : null;
  const activeJourney = tournamentSections
    .find((section) => section.id === "regular")
    ?.cards.find((card) => card.tone === "current");
  const activeJourneyCode = journeyCode ?? activeJourney?.code ?? "";
  const heroButtonLabel = (
    hasSubmitted
      ? activeJourneyCode
        ? `Ver ${activeJourneyCode}`
        : "Ver"
      : journeyClosed
        ? activeJourneyCode
          ? `Expirada ${activeJourneyCode}`
          : "Expirada"
        : activeJourneyCode
          ? `Participar ${activeJourneyCode}`
          : "Participar"
  ).trim();
  const previousSubmitted = Boolean(previousJourneySubmittedAt);
  const heroActionDisabled = journeyClosed && !hasSubmitted;

  const heroCountdownVisible = !journeyClosed && !hasSubmitted && Boolean(journeyCloseLabel);
  const heroClosedMessage = journeyClosed && !hasSubmitted ? journeyClosedLabel ?? "La jornada está cerrada." : null;

  const formatDisplayDate = (date: Date): string => {
    const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
    const raw = dateFormatter.format(date).replace('.', '').toUpperCase().trim();
    const parts = raw.split(' ').filter(Boolean);
    const dayPart = parts[0] ?? raw;
    const monthPart = parts[1] ?? '';
    const time = date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return monthPart ? `${dayPart} ${monthPart} - ${time}` : `${dayPart} - ${time}`;
  };
  const formatSubmissionDate = (iso: string): string => formatDisplayDate(new Date(iso));

  const computedSections: TournamentSection[] = useMemo(() => {
    return tournamentSections.map((section) => {
      if (section.id !== "regular" || !journeyCode) {
        return section;
      }

      const cards = section.cards.map((card) => {
        if (card.code === journeyCode) {
          if (journeyClosed) {
            if (hasSubmitted && journeySubmittedAt) {
              return {
                ...card,
                tone: "success" as JourneyTone,
                statusLabel: "Enviado",
                meta: `Pronóstico enviado el ${formatSubmissionDate(journeySubmittedAt)}`,
                ctaLabel: "Ver",
                ctaMobileLabel: "Ver",
              };
            }
            const closedLabel = journeyClosedLabel ?? journeyCloseLabel ?? "La jornada cerró";
            return {
              ...card,
              tone: "warning" as JourneyTone,
              statusLabel: "Expirado",
              meta: closedLabel,
              ctaLabel: undefined,
              ctaMobileLabel: undefined,
            };
          }

          return {
            ...card,
            tone: "current" as JourneyTone,
            statusLabel: "En curso",
            meta: journeyCloseLabel ?? card.meta,
            ctaLabel: "Participar",
            ctaMobileLabel: "Participa",
          };
        }

        if (
          previousJourneyCode &&
          previousJourneyClosedLabel &&
          card.code === previousJourneyCode
        ) {
          if (previousSubmitted && previousJourneySubmittedAt) {
            return {
              ...card,
              tone: "success" as JourneyTone,
              statusLabel: "Enviado",
              meta: `Pronóstico enviado el ${formatSubmissionDate(previousJourneySubmittedAt)}`,
              ctaLabel: "Ver",
              ctaMobileLabel: "Ver",
            };
          }

          return {
            ...card,
            tone: "warning" as JourneyTone,
            statusLabel: "Expirado",
            meta: previousJourneyClosedLabel,
            ctaLabel: undefined,
            ctaMobileLabel: undefined,
          };
        }

        return card;
      });

      return {
        ...section,
        cards,
      };
    });
  }, [
    hasSubmitted,
    journeyClosed,
    journeyClosedLabel,
    journeyCloseLabel,
    journeyCode,
    journeySubmittedAt,
    previousJourneyClosedLabel,
    previousJourneySubmittedAt,
  ]);

  const handleHeroAction = () => {
    if (heroActionDisabled) {
      return;
    }
    if ((journeyClosed || hasSubmitted) && journeyCode) {
      onViewQuiniela?.(journeyCode);
      return;
    }
    onEnterQuiniela();
  };

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
            {heroCountdownVisible && journeyCloseLabel ? (
              <div className="hero-action__label" role="status">
                <Clock size={18} aria-hidden="true" />
                <span>{journeyCloseLabel}</span>
              </div>
            ) : null}
            {!heroCountdownVisible && heroClosedMessage ? (
              <div className="hero-action__label hero-action__label--muted" role="status">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>{heroClosedMessage}</span>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary hero-action__button"
              onClick={handleHeroAction}
              disabled={heroActionDisabled}
              aria-disabled={heroActionDisabled}
            >
              <span className="btn__label btn__label--desktop">{heroButtonLabel}</span>
              <span className="btn__label btn__label--mobile">{heroButtonLabel}</span>
              {!heroActionDisabled ? <ArrowRight size={18} /> : null}
            </button>
          </div>
        </div>

        <aside className="hero-card hero-card--ranking" aria-labelledby="hero-card-title">
          <span id="hero-card-title" className="hero-card__chip">
            <Trophy size={16} aria-hidden="true" />
            Pódium
          </span>
          <ul className="ranking-list ranking-list--featured">
            {topRanking.map((entry) => (
              <li key={entry.id} className="ranking-item">
                <span className="ranking-position">{entry.position}</span>
                <span className="ranking-name">{entry.name}</span>
                <span className="ranking-score">{entry.score}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary ranking-fullboard-button" onClick={() => onViewPodium?.()}>
            <span>Ver ranking completo</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </section>

      <section className="dashboard-section tournament-panel">
        <div className="tournament-panel__stack">
          {computedSections.map((section) => {
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
                              <span className="journey-card__cta-label journey-card__cta-label--desktop">
                                {card.ctaLabel}
                              </span>
                              <span className="journey-card__cta-label journey-card__cta-label--mobile">
                                {card.ctaMobileLabel ?? card.ctaLabel}
                              </span>
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
