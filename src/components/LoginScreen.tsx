import { FormEvent, useState } from "react";
import logoSomosLocales from "figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png";
import "../styles/login.css";

export interface UserProfile {
  name: string;
  email: string;
  role: "aficion" | "staff" | "invitado";
}

export const ROLE_LABELS: Record<UserProfile["role"], string> = {
  aficion: "Afición Somos Locales",
  staff: "Staff Somos Locales",
  invitado: "Invitado especial",
};

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserProfile["role"]>("aficion");
  const [error, setError] = useState<string | null>(null);

  const handleQuickAccess = () => {
    onLogin({
      name: "Invitada Somos Locales",
      email: "demo@somoslocales.mx",
      role: "invitado",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Completa tu nombre y correo para continuar.");
      return;
    }

    setError(null);
    onLogin({
      name: name.trim(),
      email: email.trim(),
      role,
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-badge">
          <img src={logoSomosLocales} alt="Somos Locales" className="login-logo" />
        </span>
        <h1 className="login-title">Inicia sesión para tu quiniela</h1>
        <p className="login-text">
          Conecta tu perfil para guardar resultados, seguir tu ranking y compartir la emoción con la comunidad Somos
          Locales.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="login-name">
              Nombre completo
            </label>
            <input
              id="login-name"
              className="login-input"
              type="text"
              placeholder="Ej. Mariana López"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">
              Correo electrónico
            </label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              placeholder="nombre@somoslocales.mx"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-role">
              Rol
            </label>
            <select
              id="login-role"
              className="login-select"
              value={role}
              onChange={(event) => setRole(event.target.value as UserProfile["role"])}
            >
              <option value="aficion">Afición</option>
              <option value="staff">Staff Somos Locales</option>
              <option value="invitado">Invitado especial</option>
            </select>
          </div>

          <div className="login-actions">
            <button type="button" className="login-quick-access" onClick={handleQuickAccess}>
              Acceso rápido (demo)
            </button>
            <button type="submit" className="login-submit">
              Entrar
            </button>
            {error ? <span className="login-note">{error}</span> : null}
            <span className="login-note">
              Tus datos se utilizan únicamente para personalizar la quiniela y compartir resultados en el ranking.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
