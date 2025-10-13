import { useEffect, useMemo, useRef, useState } from "react";

import { PODIUM_ENTRIES, type PodiumEntry } from "../data/podium";
import "../styles/podium.css";

interface PodiumPageProps {
  onBack: () => void;
}

const PAGE_SIZE = 30;

export function PodiumPage({ onBack }: PodiumPageProps) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return PODIUM_ENTRIES;
    }
    return PODIUM_ENTRIES.filter((entry) =>
      `${entry.name} ${entry.team} ${entry.city}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  useEffect(() => {
    if (!sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredEntries.length));
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredEntries.length]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);

  const metrics = useMemo(() => {
    if (!filteredEntries.length) {
      return { topScore: 0, average: 0 };
    }
    const topScore = filteredEntries[0]?.points ?? 0;
    const average = Math.round(
      filteredEntries.reduce((sum, item) => sum + item.points, 0) / filteredEntries.length
    );
    return { topScore, average };
  }, [filteredEntries]);

  return (
    <div className="podium-page">
      <div className="podium-header">
        <div className="podium-header__text">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Volver al dashboard
          </button>
          <h1 className="podium-title">Pódium Somos Locales</h1>
          <p className="podium-subtitle">
            Consulta el ranking completo de participantes. Actualizamos las posiciones al cierre de cada jornada.
          </p>
        </div>
        <div className="podium-metrics">
          <div className="podium-metric">
            <span className="podium-metric__label">Puntaje líder</span>
            <span className="podium-metric__value">{metrics.topScore} pts</span>
          </div>
          <div className="podium-metric">
            <span className="podium-metric__label">Promedio general</span>
            <span className="podium-metric__value">{metrics.average} pts</span>
          </div>
          <div className="podium-metric">
            <span className="podium-metric__label">Integrantes</span>
            <span className="podium-metric__value">{filteredEntries.length.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="podium-toolbar">
        <label className="podium-search" htmlFor="podium-search">
          <span className="podium-search__icon" aria-hidden="true">🔍</span>
          <input
            id="podium-search"
            type="search"
            placeholder="Buscar por nombre, equipo o ciudad"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="podium-table" role="table" aria-label="Ranking Somos Locales completo">
        <div className="podium-table__head" role="row">
          <span className="podium-table__cell" role="columnheader">#</span>
          <span className="podium-table__cell" role="columnheader">Participante</span>
          <span className="podium-table__cell" role="columnheader">Equipo</span>
          <span className="podium-table__cell" role="columnheader">Ciudad</span>
          <span className="podium-table__cell podium-table__cell--points" role="columnheader">
            Puntos
          </span>
        </div>
        <div className="podium-table__body">
          {visibleEntries.map(renderRow)}
          <div ref={sentinelRef} className="podium-sentinel" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function renderRow(entry: PodiumEntry, index: number) {
  return (
    <div key={entry.id} className="podium-table__row" role="row">
      <span className="podium-table__cell" role="cell">{index + 1}</span>
      <span className="podium-table__cell" role="cell">
        <span className="podium-participant__name">{entry.name}</span>
        <span className="podium-participant__meta">ID {entry.id.toString().padStart(4, "0")}</span>
      </span>
      <span className="podium-table__cell" role="cell">{entry.team}</span>
      <span className="podium-table__cell" role="cell">{entry.city}</span>
      <span className="podium-table__cell podium-table__cell--points" role="cell">
        {entry.points}
      </span>
    </div>
  );
}
