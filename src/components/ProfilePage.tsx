import { ArrowLeft, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { UserProfile } from "./LoginScreen";
import type { JourneyStat } from "../types/profile";
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import "../styles/profile.css";
import { CONSTANCY_BADGES } from "../data/constancyBadges";
import type { ConstancyBadgeDefinition } from "../data/constancyBadges";

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

export function ProfilePage({ user, journeyStats, totalJourneys, onBack }: ProfilePageProps) {
  const [ranking, setRanking] = useState<RankingSnapshot | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [isBadgesTooltipVisible, setIsBadgesTooltipVisible] = useState(false);
  const badgeInfoContainerRef = useRef<HTMLDivElement | null>(null);

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
  const nextBadgeLabel = nextBadge
    ? nextBadge.remaining <= 0
      ? `Listo para ${nextBadge.badge.title}`
      : `A ${nextBadge.remaining} quiniela${nextBadge.remaining === 1 ? '' : 's'} de ${nextBadge.badge.title}`
    : "¡GOAT Local desbloqueado! Eres leyenda de la quiniela.";

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    [],
  );

  useEffect(() => {
    if (!isBadgesTooltipVisible) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!badgeInfoContainerRef.current?.contains(event.target as Node)) {
        setIsBadgesTooltipVisible(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBadgesTooltipVisible(false);
      }
    };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isBadgesTooltipVisible]);

  const positionLabel = isRankingLoading
    ? "Calculando…"
      : ranking
        ? `#${ranking.position}`
        : "#—";

  return (
    <div className="profile-page">
      <header className="profile-header">
        {onBack ? (
          <button type="button" className="profile-back-button" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al dashboard
          </button>
        ) : null}
      </header>

      <section className="profile-card profile-card--table">
        <div className="profile-card__title-row">
          <h2>{user.name}</h2>
        </div>

        <div className="profile-summary-row">
          <div>
            <span>Posición</span>
            <strong className="profile-summary-value profile-summary-value--primary">{positionLabel}</strong>
          </div>
          <div>
            <span>Correo</span>
            <strong className="profile-summary-value profile-email" title={user.email}>
              {user.email}
            </strong>
          </div>
        </div>

      </section>

      <section className="profile-stats">
        <div className="profile-card profile-card--glass profile-stat">
          <div className="profile-stat__label">Jornadas completadas</div>
          <div
            className="profile-circle-progress"
            style={
              {
                "--progress": completionProgress,
              } as CSSProperties
            }
          >
            <span className="profile-circle-progress__value">{completedJourneys}</span>
            <span className="profile-circle-progress__hint">de {totalJourneys}</span>
          </div>
          <p className="profile-stat__caption">{Math.round(completionProgress * 100)}% del torneo jugado</p>
        </div>

        <div className="profile-card profile-card--glass profile-stat">
          <div className="profile-stat__label">Predicciones acertadas por jornada</div>
          <div className="profile-stat__value">{averageHits.toFixed(1)}</div>
          <p className="profile-stat__caption">
            Promedio obtenido en {completedJourneys > 0 ? `${completedJourneys} jornadas` : "aún sin envíos"}
          </p>
        </div>

        <div className="profile-card profile-card--glass profile-stat profile-stat--badges">
          <div className="profile-stat__label profile-stat__label--with-icon">
            <span>Insignias conseguidas</span>
            <div className="profile-badges__info" ref={badgeInfoContainerRef}>
              <button
                type="button"
                className="profile-badges__info-button"
                aria-label="Cómo ganar insignias"
                aria-expanded={isBadgesTooltipVisible}
                onClick={() => {
                  setIsBadgesTooltipVisible((prev) => !prev);
                }}
              >
                <Info size={16} aria-hidden="true" />
              </button>
              <div
                className="profile-tooltip"
                role="tooltip"
                data-visible={isBadgesTooltipVisible ? "true" : undefined}
              >
                <strong>¡Colecciona insignias!</strong>
                <span>
                  Envía tu quiniela en <em>tres jornadas consecutivas</em> para desbloquear una insignia especial.
                </span>
              </div>
            </div>
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
          <div className="profile-badge-grid">
            {badgeStates.map(({ badge, unlocked, unlockedAt, progress, remaining }) => {
              const styles: CSSProperties = {
                "--badge-card-bg": badge.theme.background,
                "--badge-card-border": badge.theme.border,
                "--badge-card-badge-bg": badge.theme.badgeBackground,
                "--badge-card-badge-color": badge.theme.badgeColor,
                "--badge-card-accent": badge.theme.accent,
              } as CSSProperties;

              const imageSrc = unlocked && badge.image ? badge.image : null;

              return (
                <article
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
                        <h3>{badge.title}</h3>
                        <span className={`profile-badge-card__rarity profile-badge-card__rarity--${badge.rarity}`}>
                          {RARITY_LABELS[badge.rarity]}
                        </span>
                        <p>{badge.description}</p>
                        <span className="profile-badge-card__threshold">{badge.threshold} quinielas seguidas</span>
                      </div>
                    </>
                  ) : (
                    <div className="profile-badge-card__locked">
                      <span className="profile-badge-card__locked-icon" aria-hidden="true">
                        🔒
                      </span>
                      <span className="profile-badge-card__locked-progress">
                        Faltan {Math.max(remaining, 0)} quiniela{remaining === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                  {!unlocked ? (
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
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
