import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { ConstancyBadgeDefinition } from "../data/constancyBadges";
import "../styles/badgeCelebration.css";

interface BadgeCelebrationModalProps {
  badge: ConstancyBadgeDefinition;
  onClose: () => void;
}

export function BadgeCelebrationModal({ badge, onClose }: BadgeCelebrationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, index) => {
        const left = Math.random() * 22 + (index % 5);
        const height = 560 + Math.random() * 420;
        const drift = 160 + Math.random() * 480;
        const delay = (index % 12) * 90;
        const duration = 1400 + (index % 8) * 120;

        return {
          key: index,
          style: {
            "--confetti-left": `${left}%`,
            "--confetti-height": `${height}px`,
            "--confetti-drift": `${drift}px`,
            "--confetti-delay": `${delay}ms`,
            "--confetti-duration": `${duration}ms`,
          } as CSSProperties,
        };
      }),
    [],
  );

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [onClose]);

  return (
    <div className="badge-celebration">
      <div className="badge-celebration__backdrop" />
      <div className="badge-celebration__dialog" role="dialog" aria-modal="true" aria-labelledby="badge-title">
        <div className="badge-celebration__confetti" aria-hidden="true">
          <div className="badge-celebration__launcher" />
          {pieces.map(({ key, style }) => (
            <span
              key={key}
              className={`badge-celebration__confetti-piece badge-celebration__confetti-piece--${(key % 5) + 1}`}
              style={style}
            />
          ))}
        </div>
        <div className="badge-celebration__halo" aria-hidden="true" />

        <figure className="badge-celebration__media">
          {badge.image ? (
            <img src={badge.image} alt={badge.title} className="badge-celebration__image" />
          ) : (
            <span className="badge-celebration__icon" aria-hidden="true">
              {badge.icon}
            </span>
          )}
        </figure>

        <header className="badge-celebration__header">
          <span className={`badge-celebration__rarity badge-celebration__rarity--${badge.rarity}`}>
            {badge.rarity.toUpperCase()}
          </span>
          <h2 id="badge-title" className="badge-celebration__title">
            ¡Nueva insignia!
          </h2>
          <p className="badge-celebration__name">{badge.title}</p>
        </header>

        <p className="badge-celebration__message">{badge.notificationMessage}</p>

        <button
          ref={closeButtonRef}
          type="button"
          className="badge-celebration__button"
          onClick={onClose}
        >
          Seguir jugando
        </button>
      </div>
    </div>
  );
}
