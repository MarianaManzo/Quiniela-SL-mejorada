import { useEffect, useState } from "react";
import { type UserProfile } from "./LoginScreen";
import logoSomosLocales from "../assets/logo-somos-locales.png?inline";
import { BellRing, LogOut } from "lucide-react";
import type { NotificationStatus } from "../services/messaging";
import "../styles/navbar.css";

interface NavbarProps {
  user: UserProfile | null;
  currentView: "login" | "dashboard" | "quiniela" | "podium" | "profile";
  onNavigateToDashboard: () => void;
  onNavigateToPodium?: () => void;
  onNavigateToQuiniela?: () => void;
  onNavigateToProfile?: () => void;
  onSignOut?: () => void;
  onShowLogin?: () => void;
  notificationStatus?: NotificationStatus;
  onEnableNotifications?: () => void;
  notificationLoading?: boolean;
}

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) {
    return "LL";
  }

  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  const firstInitial = parts[0]?.[0]?.toUpperCase() ?? "";
  const secondSource =
    parts.length >= 2
      ? parts[parts.length - 1]
      : cleaned.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const secondInitial = secondSource?.[0]?.toUpperCase() ?? "";

  const resolvedFirst = firstInitial || "L";
  const resolvedSecond = secondInitial || resolvedFirst || "L";

  return `${resolvedFirst}${resolvedSecond}`;
}

export function Navbar({
  user,
  currentView,
  onNavigateToDashboard,
  onNavigateToPodium,
  onNavigateToProfile,
  onSignOut,
  onShowLogin,
  notificationStatus = "default",
  onEnableNotifications,
  notificationLoading,
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

  const handleNavigatePodium = () => {
    if (!user) {
      return;
    }

    onNavigateToPodium?.();
    setIsMenuOpen(false);
  };

  const handleSignOutClick = () => {
    if (onSignOut) {
      onSignOut();
    }
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (!user) {
      return;
    }
    onNavigateToProfile?.();
    setIsMenuOpen(false);
  };

  const isNotificationEnabled = notificationStatus === "granted";
  const notificationUnavailable =
    notificationStatus === "unsupported" || notificationStatus === "missing-key";
  const notificationBlocked = notificationStatus === "denied";
  const canToggleNotifications = Boolean(onEnableNotifications) && !notificationUnavailable && !notificationBlocked;
  const notificationButtonDisabled = notificationLoading || !canToggleNotifications;
  const notificationTitle = (() => {
    if (notificationLoading) {
      return "Activando notificaciones";
    }
    if (notificationBlocked) {
      return "Notificaciones bloqueadas en el navegador";
    }
    if (notificationUnavailable) {
      return "Notificaciones no disponibles";
    }
    return isNotificationEnabled ? "Notificaciones activadas" : "Activar notificaciones";
  })();

  const handleNotificationsClick = () => {
    if (notificationButtonDisabled || !onEnableNotifications) {
      return;
    }
    onEnableNotifications();
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
            data-active={currentView === "podium"}
            onClick={handleNavigatePodium}
            disabled={!user}
          >
            Pódium
          </button>
          {user && onSignOut ? (
            <button
              type="button"
              className="navbar__link navbar__link--signout"
              onClick={handleSignOutClick}
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>

        <div className="navbar__controls">
          {user ? (
            <button
              type="button"
              className="navbar__icon-button navbar__icon-button--notifications"
              data-active={isNotificationEnabled ? "true" : undefined}
              onClick={handleNotificationsClick}
              title={notificationTitle}
              aria-pressed={isNotificationEnabled}
              aria-busy={notificationLoading || undefined}
              disabled={notificationButtonDisabled}
            >
              <BellRing size={18} aria-hidden="true" />
              {notificationBlocked ? <span className="sr-only">Notificaciones bloqueadas</span> : null}
            </button>
          ) : null}
          {user ? (
            <div className="navbar__profile">
              <button
                type="button"
                className="navbar__avatar"
                onClick={handleProfileClick}
                aria-label={`Abrir perfil de ${user.name}`}
                data-active={currentView === "profile" ? "true" : undefined}
              >
                {getInitials(user.name)}
              </button>
            </div>
          ) : (
            <span className="navbar__hint">Inicia sesión para acceder a la quiniela</span>
          )}

          {user && onSignOut ? (
            <button
              type="button"
              className="navbar__icon-button navbar__icon-button--signout"
              onClick={handleSignOutClick}
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          ) : null}

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
