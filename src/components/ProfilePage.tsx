import { ArrowLeft, Info, Medal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { UserProfile } from "./LoginScreen";
import type { JourneyStat } from "../types/profile";
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import "../styles/profile.css";

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

export function ProfilePage({ user, journeyStats, totalJourneys, onBack }: ProfilePageProps) {
  const [ranking, setRanking] = useState<RankingSnapshot | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(true);

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

  const badgeInfo = useMemo(() => {
    let streak = 0;
    let badges = 0;
    const ordered = [...journeyStats].sort((a, b) => a.journeyNumber - b.journeyNumber);

    ordered.forEach((stat) => {
      if (stat.submitted) {
        streak += 1;
        if (streak === 3) {
          badges += 1;
          streak = 0;
        }
      } else {
        streak = 0;
      }
    });

    return {
      badges,
      streak,
      progressPercent: (streak / 3) * 100,
    };
  }, [journeyStats]);

  const positionLabel = isRankingLoading
    ? "Calculando…"
      : ranking
        ? `#${ranking.position}`
        : "#—";

  const badgeIcons = badgeInfo.badges > 0 ? Array.from({ length: badgeInfo.badges }) : [];

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
            <span className="profile-badges__info" title="Cada vez que envías tu quiniela en 3 jornadas consecutivas recibes una nueva insignia.">
              <Info size={16} aria-hidden="true" />
            </span>
          </div>
          {badgeIcons.length > 0 ? (
            <div className="profile-badges">
              {badgeIcons.map((_, index) => (
                <div
                  key={`badge-${index}`}
                  className="profile-badge"
                  data-animated={index === badgeIcons.length - 1 ? "true" : undefined}
                >
                  <Medal size={20} aria-hidden="true" />
                  {index === badgeIcons.length - 1 ? (
                    <span className="profile-badge__spark" aria-hidden="true">
                      <Sparkles size={14} />
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-badges profile-badges--empty">
              <Medal size={24} aria-hidden="true" />
              <span>Aún sin insignias</span>
            </div>
          )}
          <div className="profile-badge-progress">
            <div
              className="profile-badge-progress__bar"
              style={
                {
                  "--badge-progress": badgeInfo.progressPercent / 100,
                } as CSSProperties
              }
            />
            <span className="profile-badge-progress__label">
              {badgeInfo.streak}/3 quinielas ·{" "}
              {badgeInfo.streak === 0 ? "¡Nueva insignia desbloqueada!" : `A ${3 - badgeInfo.streak} de la siguiente`}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
