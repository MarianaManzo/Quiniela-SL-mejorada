import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Trophy,
} from "lucide-react";
import iconEnCurso from "../Icon/en-curso.svg";
import iconEnviado from "../Icon/enviado.svg";
import iconExpirado from "../Icon/expirado.svg";
import iconProximamente from "../Icon/proximamente.svg";
import { ROLE_LABELS, type UserProfile } from "./LoginScreen";
import { TOP_RANKING } from "../data/podium";
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import "../styles/dashboard.css";

interface DashboardProps {
  user: UserProfile;
  onEnterQuiniela: (journeyNumber: number) => void;
  onViewQuiniela?: (journeyCode: string) => void;
  onViewPodium?: () => void;
  journeyCards: DashboardJourneyCard[];
  journeyCode?: string;
  journeyCloseLabel?: string | null;
  journeyClosedLabel?: string | null;
  journeyClosed?: boolean;
  journeySubmittedAt?: string | null;
  previousJourneyClosedLabel?: string | null;
  previousJourneySubmittedAt?: string | null;
  onPreviewBadge?: () => void;
}

interface TournamentSectionState {
  id: string;
  collapsed: boolean;
}

type JourneyTone = "current" | "success" | "warning" | "upcoming";

type JourneyCardAction = "participate" | "view" | null;

interface DashboardJourneyCard {
  id: string;
  code: string;
  number: number;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  action: JourneyCardAction;
}

interface JourneyCard {
  id: string;
  code: string;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  journeyNumber?: number;
  ctaLabel?: string;
  ctaMobileLabel?: string;
  action?: JourneyCardAction;
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

const DEFAULT_SECTION_ID = "regular";
const SECTION_DEFAULT_STATE: TournamentSectionState[] = [
  { id: "regular", collapsed: false },
  { id: "liguilla", collapsed: true },
];

export function Dashboard({
  user,
  onEnterQuiniela,
  onViewQuiniela,
  onViewPodium,
  journeyCards,
  journeyCode,
  journeyCloseLabel,
  journeyClosedLabel,
  journeyClosed = false,
  journeySubmittedAt,
  previousJourneyClosedLabel: _previousJourneyClosedLabel,
  previousJourneySubmittedAt: _previousJourneySubmittedAt,
  onPreviewBadge,
}: DashboardProps) {
  const [sectionState, setSectionState] = useState<TournamentSectionState[]>(SECTION_DEFAULT_STATE);
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

  const orderedJourneyCards = useMemo(() => {
    return [...journeyCards].sort((a, b) => b.number - a.number);
  }, [journeyCards]);

  const firstName = user.name.trim().split(" ")[0] || user.name;
  const hasSubmitted = Boolean(journeySubmittedAt);
  const activeJourneyCard = orderedJourneyCards.find((card) => card.code === journeyCode)
    ?? orderedJourneyCards.find((card) => card.tone === "current")
    ?? null;
  const activeJourneyCode = journeyCode ?? activeJourneyCard?.code ?? "";
  const heroActionType: JourneyCardAction | null = activeJourneyCard?.action ?? (hasSubmitted ? "view" : null);
  const heroButtonLabel = heroActionType === "view"
    ? activeJourneyCode
      ? `Ver ${activeJourneyCode}`
      : "Ver"
    : heroActionType === "participate"
      ? activeJourneyCode
        ? `Participar ${activeJourneyCode}`
        : "Participar"
      : journeyClosed
        ? activeJourneyCode
          ? `Expirada ${activeJourneyCode}`
          : "Expirada"
        : activeJourneyCode
          ? `Ver ${activeJourneyCode}`
          : "Ver";
  const heroActionDisabled = !heroActionType;

  const heroCountdownVisible = heroActionType === "participate" && Boolean(journeyCloseLabel);
  const heroClosedMessage = journeyClosed && heroActionType !== "view" ? journeyClosedLabel ?? "La jornada está cerrada." : null;
  const statusIcons: Record<JourneyTone, string | null> = {
    success: iconEnviado,
    warning: iconExpirado,
    upcoming: iconProximamente,
    current: iconEnCurso,
  };

  const computedSections: TournamentSection[] = useMemo(() => {
    const cards: JourneyCard[] = orderedJourneyCards.map((card) => ({
      id: card.id,
      code: card.code,
      statusLabel: card.statusLabel,
      meta: card.meta,
      tone: card.tone,
      journeyNumber: card.number,
      ctaLabel: card.action === "participate" ? "Participar" : undefined,
      ctaMobileLabel: card.action === "participate" ? "Participa" : undefined,
      action: card.action,
    }));

    const totalLabel = cards.length > 0 ? `Jornadas (${cards.length})` : "Sin jornadas";
    const totalTone: StatusTagTone = cards.length > 0 ? "progress" : "neutral";

    return [
      {
        id: DEFAULT_SECTION_ID,
        appearance: "regular",
        title: "Torneo Regular",
        statusTags: [
          { id: "progress", label: totalLabel, tone: totalTone },
        ],
        cards,
      },
      {
        id: "liguilla",
        appearance: "elimination",
        title: "Liguilla",
        statusTags: [{ id: "available", label: "Disponible pronto", tone: "neutral" }],
        cards: [
          {
            id: "liguilla-cuartos",
            code: "C1",
            statusLabel: "Próximamente",
            meta: "Publicamos llaves el 5 de noviembre",
            tone: "upcoming",
          },
          {
            id: "liguilla-semis",
            code: "S1",
            statusLabel: "Próximamente",
            meta: "Se define tras cuartos",
            tone: "upcoming",
          },
          {
            id: "liguilla-final",
            code: "F1",
            statusLabel: "Próximamente",
            meta: "La gran final se confirma en diciembre",
            tone: "upcoming",
          },
        ],
      },
    ];
  }, [orderedJourneyCards]);

  const handleHeroAction = () => {
    if (!heroActionType) {
      return;
    }

    if (heroActionType === "view") {
      const targetCode = activeJourneyCode || orderedJourneyCards[0]?.code;
      if (targetCode) {
        onViewQuiniela?.(targetCode);
      }
      return;
    }

    const targetJourneyNumber = activeJourneyCard?.number ?? orderedJourneyCards[0]?.number ?? null;
    if (targetJourneyNumber === null) {
      return;
    }

    onEnterQuiniela(targetJourneyNumber);
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
            <div className="hero-action__buttons">
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
              {onPreviewBadge ? (
                <button type="button" className="btn btn-secondary hero-action__preview" onClick={onPreviewBadge}>
                  Vista previa insignia
                </button>
              ) : null}
            </div>
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
                    <article
                      key={card.id}
                      className={`journey-card journey-card--${card.tone}`}
                      data-tone={card.tone}
                    >
                      <header className="journey-card__header">
                        <div className="journey-card__main">
                          <span className="journey-card__code">{card.code}</span>
                          <span className="journey-card__status-tag" data-tone={card.tone}>
                            <span className="journey-card__status-icon" aria-hidden="true">
                              {statusIcons[card.tone] ? (
                                <img src={statusIcons[card.tone] ?? iconEnCurso} alt="" />
                              ) : null}
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
                              onClick={() => {
                                if (card.journeyNumber !== undefined) {
                                  onEnterQuiniela(card.journeyNumber);
                                }
                              }}
                              style={{ borderRadius: "18px" }}
                            >
                              <span className="journey-card__cta-label journey-card__cta-label--desktop">
                                {card.ctaLabel}
                              </span>
                              <span className="journey-card__cta-label journey-card__cta-label--mobile">
                                {card.ctaMobileLabel ?? card.ctaLabel}
                              </span>
                            </button>
                          ) : null}
                          {card.action === "view" ? (
                            <button
                              type="button"
                              className="journey-card__link journey-card__link--inline"
                              onClick={() => onViewQuiniela?.(card.code)}
                              style={{ borderRadius: "18px" }}
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
