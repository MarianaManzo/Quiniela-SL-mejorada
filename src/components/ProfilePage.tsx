import { ArrowLeft, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { UserProfile } from "./LoginScreen";
import type { JourneyStat } from "../types/profile";
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import "../styles/profile.css";
import { CONSTANCY_BADGES } from "../data/constancyBadges";
import type { ConstancyBadgeDefinition, ConstancyBadgeTheme } from "../data/constancyBadges";

interface ProfilePageProps {
  user: UserProfile;
  journeyStats: JourneyStat[];
  totalJourneys: number;
  onBack?: () => void;
}

type RankingSnapshot = {
  position: number;
  points: number;
};

const RARITY_LABELS: Record<ConstancyBadgeDefinition["rarity"], string> = {
  comun: "Común",
  rara: "Rara",
  epica: "Épica",
  legendaria: "Legendaria",
  mitica: "Mítica",
  "mitica-ultra": "Mítica Ultra",
};

const LOCKED_BADGE_THEME: ConstancyBadgeTheme = {
  background: "linear-gradient(135deg, rgba(21, 24, 32, 0.95), rgba(15, 18, 24, 0.9))",
  border: "rgba(124, 134, 150, 0.3)",
  badgeBackground: "linear-gradient(135deg, rgba(34, 38, 48, 0.85), rgba(24, 27, 35, 0.85))",
  badgeColor: "rgba(196, 204, 216, 0.55)",
  accent: "rgba(152, 160, 176, 0.45)",
};

export function ProfilePage({ user, journeyStats, totalJourneys, onBack }: ProfilePageProps) {
  const [ranking, setRanking] = useState<RankingSnapshot | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [areBadgesCollapsed, setAreBadgesCollapsed] = useState(true);

  useEffect(() => {
    let active = true;
    const loadRanking = async () => {
      setIsRankingLoading(true);
      try {
        const podium = await obtenerUsuariosParaPodio();
        if (!active) {
          return;
        }
        const index = podium.findIndex((entry) => entry.email?.toLowerCase() === user.email.toLowerCase());
        if (index >= 0) {
          setRanking({ position: index + 1, points: podium[index].puntosTotales });
        } else {
          setRanking(null);
        }
      } catch (error) {
        console.error("No se pudo determinar la posición en el ranking", error);
        if (active) {
          setRanking(null);
        }
      } finally {
        if (active) {
          setIsRankingLoading(false);
        }
      }
    };

    void loadRanking();

    return () => {
      active = false;
    };
  }, [user.email]);

  const submittedStats = journeyStats.filter((stat) => stat.submitted);
  const completedJourneys = submittedStats.length;
  const totalPoints = submittedStats.reduce((acc, stat) => acc + (stat.points ?? 0), 0);
  const averageHits = completedJourneys > 0 ? totalPoints / completedJourneys : 0;
  const completionProgress = totalJourneys > 0 ? Math.min(completedJourneys / totalJourneys, 1) : 0;

  const constancyBadges = user.constancyBadges ?? {};
  const constancyStreak = user.constancyStreak ?? 0;

  const badgeStates = useMemo(
    () =>
      CONSTANCY_BADGES.map((badge) => {
        const badgeState = constancyBadges[badge.id];
        const unlocked = Boolean(badgeState);
        const progress = unlocked ? 1 : Math.min(constancyStreak / badge.threshold, 1);
        const remaining = Math.max(badge.threshold - constancyStreak, 0);

        return {
          badge,
          unlocked,
          unlockedAt: badgeState?.unlockedAt ?? null,
          progress,
          remaining,
        };
      }),
    [constancyBadges, constancyStreak],
  );

  const nextBadge = badgeStates.find((state) => !state.unlocked) ?? null;
  const unlockedBadgeCount = badgeStates.filter((state) => state.unlocked).length;
  const nextBadgeProgress = nextBadge ? Math.min(nextBadge.progress, 1) : 1;
  const badgeGridId = "profile-badge-grid";
  const nextBadgeLabel = nextBadge
    ? nextBadge.remaining <= 0
      ? "¡Insignia especial lista para desbloquear!"
      : `A ${nextBadge.remaining} quiniela${nextBadge.remaining === 1 ? '' : 's'} de desbloquear una insignia especial`
    : "¡MVP desbloqueado! No eres el mejor del mundo, pero sí del rumbo.";

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    [],
  );

  const positionLabel = isRankingLoading
    ? "Calculando…"
      : ranking
        ? `#${ranking.position}`
        : "#—";

  return (
    <div className="profile-page">
      <header className="profile-header">
        {onBack ? (
          <button
            type="button"
            className="profile-back-button"
            onClick={onBack}
            aria-label="Volver"
            title="Volver"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <section className="profile-summary-grid">
        <div className="profile-summary-card profile-summary-card--identity">
          <h2 className="profile-summary-card__title">{user.name}</h2>
          <div className="profile-summary-card__details">
            <div>
              <span className="profile-summary-card__label">Posición</span>
              <span className="profile-summary-card__value">{positionLabel}</span>
            </div>
            <div>
              <span className="profile-summary-card__label">Correo</span>
              <span className="profile-summary-card__value profile-email" title={user.email}>
                {user.email}
              </span>
            </div>
          </div>
        </div>
        <div className="profile-summary-card profile-summary-card--stat">
          <span className="profile-summary-card__label">Jornadas completadas</span>
          <div
            className="profile-circle-progress"
            style={{ "--progress": completionProgress } as CSSProperties}
          >
            <span className="profile-circle-progress__value">{completedJourneys}</span>
            <span className="profile-circle-progress__hint">de {totalJourneys}</span>
          </div>
          <p className="profile-summary-card__caption">{Math.round(completionProgress * 100)}% del torneo jugado</p>
        </div>
        <div className="profile-summary-card profile-summary-card--stat">
          <span className="profile-summary-card__label">Predicciones acertadas</span>
          <div className="profile-summary-card__stat-value">
            {Number.isFinite(averageHits) ? averageHits.toFixed(1) : "0.0"}
            <span className="profile-summary-card__stat-suffix">%</span>
          </div>
          <p className="profile-summary-card__caption">
            Promedio obtenido por jornada
          </p>
        </div>
      </section>

      <section className="profile-stats">
        <div className="profile-card profile-card--glass profile-stat profile-stat--badges">
          <div className="profile-stat__label">
            <span>Insignias coleccionables</span>
            <button
              type="button"
              className="profile-badge-toggle"
              onClick={() => {
                setAreBadgesCollapsed((prev) => !prev);
              }}
              aria-expanded={!areBadgesCollapsed}
              aria-controls={badgeGridId}
              aria-label={areBadgesCollapsed ? "Mostrar insignias" : "Ocultar insignias"}
            >
              {areBadgesCollapsed ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
            </button>
          </div>
          <div className="profile-badge-summary">
            <div className="profile-badge-summary__streak">
              <span className="profile-badge-summary__streak-value">{constancyStreak}</span>
              <span className="profile-badge-summary__streak-label">quinielas seguidas</span>
              <span className="profile-badge-summary__unlocked">
                {unlockedBadgeCount}/{CONSTANCY_BADGES.length} insignias
              </span>
            </div>
            <div className="profile-badge-progress">
              <div
                className="profile-badge-progress__bar"
                style={
                  {
                    "--badge-progress": nextBadgeProgress,
                  } as CSSProperties
                }
              />
              <span className="profile-badge-progress__label">{nextBadgeLabel}</span>
            </div>
          </div>
          <div
            className="profile-badge-grid"
            role="list"
            data-collapsed={areBadgesCollapsed ? "true" : undefined}
            id={badgeGridId}
          >
            {badgeStates.map(({ badge, unlocked, unlockedAt, progress, remaining }) => {
              const palette = unlocked ? badge.theme : LOCKED_BADGE_THEME;
              const styles: CSSProperties = {
                "--badge-card-bg": palette.background,
                "--badge-card-border": palette.border,
                "--badge-card-badge-bg": palette.badgeBackground,
                "--badge-card-badge-color": palette.badgeColor,
                "--badge-card-accent": palette.accent,
              } as CSSProperties;

              const imageSrc = unlocked && badge.image ? badge.image : null;

              return (
                <article
                  role="listitem"
                  key={badge.id}
                  className={`profile-badge-card${unlocked ? " profile-badge-card--unlocked" : " profile-badge-card--locked"}`}
                  style={styles}
                  aria-live="polite"
                >
                  {unlocked ? (
                    <>
                      <div className="profile-badge-card__media">
                        {imageSrc ? (
                          <img src={imageSrc} alt={badge.title} className="profile-badge-card__image" />
                        ) : (
                          <div className="profile-badge-card__icon" aria-hidden="true">
                            {badge.icon}
                          </div>
                        )}
                      </div>
                      <div className="profile-badge-card__text">
                        <span className={`profile-badge-card__rarity profile-badge-card__rarity--${badge.rarity}`}>
                          {RARITY_LABELS[badge.rarity]}
                        </span>
                        <p className="profile-badge-card__description">{badge.description}</p>
                      </div>
                    </>
                  ) : (
                    <div className="profile-badge-card__locked">
                      <span className="profile-badge-card__locked-icon" aria-hidden="true">
                        <Lock size={26} strokeWidth={2.2} />
                      </span>
                    </div>
                 )}
                 <div className="profile-badge-card__footer">
                    {!unlocked ? (
                      <>
                        <div className="profile-badge-card__progress profile-badge-card__progress--locked">
                          <span
                            className="profile-badge-card__progress-fill"
                            style={
                              {
                                "--badge-card-progress": progress,
                              } as CSSProperties
                            }
                            aria-hidden="true"
                          />
                        </div>
                        <span className="profile-badge-card__locked-progress profile-badge-card__locked-progress--footer">
                          Faltan {Math.max(remaining, 0)} quiniela{remaining === 1 ? '' : 's'}
                        </span>
                      </>
                    ) : null}
                    {unlocked ? (
                      <span className="profile-badge-card__threshold">{badge.threshold} quinielas seguidas</span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
