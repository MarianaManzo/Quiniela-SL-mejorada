import { useEffect, useRef, useState } from "react";
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [user, currentView]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleDocumentKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKey);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKey);
    };
  }, [isUserMenuOpen]);

  const handleBrandClick = user ? onNavigateToDashboard : onShowLogin ?? (() => {});

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
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
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <button
          type="button"
          className="navbar__brand"
          onClick={handleBrandClick}
          aria-label="Somos Locales"
        >
          <img src={logoSomosLocales} alt="Somos Locales" className="navbar__logo" />
        </button>

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
        </div>

        <div className="navbar__controls">
          {user ? (
            <div className="navbar__profile" ref={userMenuRef}>
              <button
                type="button"
                className="navbar__avatar"
                onClick={handleToggleUserMenu}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label={`Perfil de ${user.name}`}
              >
                {getInitials(user.name)}
              </button>
              <div className="navbar__profile-menu" role="menu" data-open={isUserMenuOpen}>
                <div className="navbar__profile-summary">
                  <span className="navbar__profile-name">{user.name}</span>
                  <span className="navbar__profile-role">{ROLE_LABELS[user.role]}</span>
                </div>
                {onSignOut ? (
                  <button type="button" className="navbar__profile-action" role="menuitem" onClick={handleSignOutClick}>
                    Cerrar sesión
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <span className="navbar__hint">Inicia sesión para acceder a la quiniela</span>
          )}

          <button
            type="button"
            className="navbar__menu-toggle"
            onClick={handleToggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="navbar-links"
          >
            <span className="navbar__menu-icon" />
          </button>
        </div>
      </div>
    </nav>
  );
}
