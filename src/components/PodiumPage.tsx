import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { PODIUM_ENTRIES } from "../data/podium";
import "../styles/podium.css";
import { obtenerUsuariosParaPodio, type PodiumUser } from "../services/firestoreService";

const PAGE_SIZE = 30;

type PodiumRow = {
  id: string;
  name: string;
  points: number;
  ultimaJornada?: number;
  email?: string;
};

const FALLBACK_ROWS: PodiumRow[] = PODIUM_ENTRIES.map((entry) => ({
  id: `fallback-${entry.id}`,
  name: entry.name,
  points: entry.points,
}));

export function PodiumPage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<PodiumRow[]>(FALLBACK_ROWS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchPodium = async () => {
      try {
        const snapshot = await obtenerUsuariosParaPodio();
        if (cancelled || snapshot.length === 0) {
          return;
        }

        setEntries(
          snapshot.map((row) => ({
            id: row.id,
            name: row.nombre,
            points: row.puntosTotales,
            ultimaJornada: row.ultimaJornada,
            email: row.email,
          }))
        );
      } catch (error) {
        console.error("No se pudo cargar el pódium desde Firestore", error);
      }
    };

    void fetchPodium();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return entries;
    }
    return entries.filter((entry) => entry.name.toLowerCase().includes(normalized));
  }, [entries, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth > 640) {
        setMobileSearchOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    if (isMobileSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const handleOpenMobileSearch = useCallback(() => {
    setMobileSearchOpen(true);
  }, []);

  const handleCloseMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    searchInputRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!isMobileSearchOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseMobileSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseMobileSearch, isMobileSearchOpen]);

  const handleDismissSearch = useCallback(() => {
    if (query) {
      setQuery("");
    }
    handleCloseMobileSearch();
  }, [handleCloseMobileSearch, query]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);

  return (
    <div className="podium-page">
      <div className="podium-header">
        <div className="podium-header__text">
          <h1 className="podium-title">Pódium</h1>
          <p className="podium-subtitle">
            Consulta el ranking completo de participantes. Actualizamos las posiciones al cierre de cada jornada.
          </p>
        </div>
      </div>

      <div className="podium-table" role="table" aria-label="Tabla de posiciones">
        <div
          className="podium-table__toolbar"
          data-mobile-search-open={isMobileSearchOpen ? "true" : "false"}
        >
          <h2 className="podium-table__title">Tabla de posiciones</h2>
          <button
            type="button"
            className="podium-search-toggle"
            onClick={handleOpenMobileSearch}
            aria-label="Buscar participante"
            aria-expanded={isMobileSearchOpen}
            aria-controls="podium-search"
          >
            <Search size={16} aria-hidden="true" />
          </button>
          <label className="podium-search" htmlFor="podium-search">
            <Search className="podium-search__icon" aria-hidden="true" size={16} />
            <input
              id="podium-search"
              type="search"
              placeholder="Buscar por nombre"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              ref={searchInputRef}
            />
            <button
              type="button"
              className="podium-search__dismiss"
              onClick={handleDismissSearch}
              aria-label={query ? "Limpiar y cerrar búsqueda" : "Cerrar búsqueda"}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </label>
        </div>
        <div className="podium-table__body">
          {visibleEntries.map(renderRow)}
          <div ref={sentinelRef} className="podium-sentinel" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function renderRow(entry: PodiumRow, index: number) {
  const rank = index + 1;
  const highlightRank = rank <= 3 ? rank : undefined;

  return (
    <div
      key={entry.id}
      className="podium-table__row"
      role="row"
      data-rank={highlightRank}
    >
      <span className="podium-table__cell podium-table__cell--position" role="cell">
        <span className="podium-position">{rank}</span>
      </span>
      <span className="podium-table__cell podium-table__cell--name" role="cell">
        <span className="podium-participant__name">{entry.name}</span>
        {entry.ultimaJornada ? (
          <span className="podium-participant__meta">Jornada {entry.ultimaJornada}</span>
        ) : null}
      </span>
      <span className="podium-table__cell podium-table__cell--points" role="cell">
        {entry.points} pts
      </span>
    </div>
  );
}
