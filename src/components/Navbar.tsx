import { useEffect, useState } from "react";
import { ROLE_LABELS, type UserProfile } from "./LoginScreen";
import logoSomosLocales from "figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png";
import "../styles/navbar.css";

interface NavbarProps {
  user: UserProfile | null;
  currentView: "login" | "dashboard" | "quiniela";
  onNavigateToDashboard: () => void;
  onNavigateToQuiniela: () => void;
  onSignOut?: () => void;
  onShowLogin?: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .padEnd(2, "L");
}

export function Navbar({
  user,
  currentView,
  onNavigateToDashboard,
  onNavigateToQuiniela,
  onSignOut,
  onShowLogin,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [user, currentView]);

  const handleBrandClick = user ? onNavigateToDashboard : onShowLogin ?? (() => {});

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavigateDashboard = () => {
    onNavigateToDashboard();
    setIsMenuOpen(false);
  };

  const handleNavigateQuiniela = () => {
    onNavigateToQuiniela();
    setIsMenuOpen(false);
  };

  const handleSignOutClick = () => {
    if (onSignOut) {
      onSignOut();
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__head">
          <button
            type="button"
            className="navbar__brand"
            onClick={handleBrandClick}
            aria-label="Somos Locales"
          >
            <img src={logoSomosLocales} alt="Somos Locales" className="navbar__logo" />
          </button>

          <button
            type="button"
            className="navbar__menu-toggle"
            onClick={handleToggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="navbar-links"
          >
            <span className="navbar__menu-icon" />
          </button>

          {user ? (
            <span className="navbar__avatar">{getInitials(user.name)}</span>
          ) : (
            <span className="navbar__hint">Inicia sesión para acceder a la quiniela</span>
          )}
        </div>

        <div
          id="navbar-links"
          className="navbar__links"
          data-open={isMenuOpen}
        >
          <button
            type="button"
            className="navbar__link"
            data-active={currentView === "dashboard"}
            onClick={handleNavigateDashboard}
            disabled={!user}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="navbar__link"
            data-active={currentView === "quiniela"}
            onClick={handleNavigateQuiniela}
            disabled={!user}
          >
            Quiniela
          </button>
          {user && onSignOut ? (
            <button type="button" className="navbar__link navbar__link--signout" onClick={handleSignOutClick}>
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
