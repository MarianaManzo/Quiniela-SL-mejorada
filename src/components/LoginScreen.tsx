import { FormEvent, useMemo, useState } from "react";
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
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false });

  const nameError = useMemo(() => {
    const value = name.trim();
    if (!value) {
      return "Ingresa tu nombre completo.";
    }

    if (value.length < 4) {
      return "El nombre es demasiado corto.";
    }

    if (value.split(" ").filter(Boolean).length < 2) {
      return "Escribe nombre y apellido.";
    }

    return null;
  }, [name]);

  const emailError = useMemo(() => {
    const value = email.trim();
    if (!value) {
      return "Ingresa tu correo.";
    }

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_PATTERN.test(value)) {
      return "Escribe un correo válido.";
    }

    return null;
  }, [email]);

  const isFormValid = !nameError && !emailError;

  const handleQuickAccess = () => {
    setFormMessage(null);
    setTouched({ name: false, email: false });
    onLogin({
      name: "Invitada Somos Locales",
      email: "demo@somoslocales.mx",
      role: "invitado",
    });
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    const mockProfiles: Record<typeof provider, UserProfile> = {
      google: {
        name: "Usuario Google",
        email: "google.user@somoslocales.mx",
        role: "aficion",
      },
      facebook: {
        name: "Fan Facebook",
        email: "facebook.fan@somoslocales.mx",
        role: "aficion",
      },
    };

    setFormMessage(null);
    setTouched({ name: false, email: false });
    onLogin(mockProfiles[provider]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true });

    if (!isFormValid) {
      setFormMessage("Revisa la información antes de continuar.");
      return;
    }

    setFormMessage(null);
    onLogin({
      name: name.trim(),
      email: email.trim(),
      role: "aficion",
    });
  };

  return (
    <div className="login-page">
      <div className="login-card" aria-label="Formulario de acceso a la quiniela">
        <div className="login-header">
          <img src={logoSomosLocales} alt="Somos Locales" className="login-logo" />
          <h1 className="login-title">Bienvenidos</h1>
        </div>

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
              onChange={(event) => {
                const nextValue = event.target.value;
                setName(nextValue);
                if (touched.name) {
                  setFormMessage(null);
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              aria-invalid={touched.name && Boolean(nameError)}
              data-invalid={touched.name && Boolean(nameError) ? "true" : undefined}
            />
            {touched.name && nameError ? (
              <span className="login-field__error" role="alert">
                {nameError}
              </span>
            ) : null}
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
              onChange={(event) => {
                const nextValue = event.target.value;
                setEmail(nextValue);
                if (touched.email) {
                  setFormMessage(null);
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              aria-invalid={touched.email && Boolean(emailError)}
              data-invalid={touched.email && Boolean(emailError) ? "true" : undefined}
            />
            {touched.email && emailError ? (
              <span className="login-field__error" role="alert">
                {emailError}
              </span>
            ) : null}
          </div>

          <div className="login-actions">
            <button type="button" className="login-quick-access" onClick={handleQuickAccess}>
              Acceso rápido (demo)
            </button>
            <button type="submit" className="btn btn-primary login-submit" disabled={!isFormValid}>
              Entrar
            </button>
            {formMessage ? <span className="login-note login-note--error" role="alert">{formMessage}</span> : null}
          </div>
        </form>

        <div className="login-social">
          <span className="login-social__title">O ingresa con</span>
          <div className="login-social__buttons">
            <button type="button" className="login-social__button" onClick={() => handleSocialLogin("google")}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Google
            </button>
            <button type="button" className="login-social__button" onClick={() => handleSocialLogin("facebook")}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" alt="Facebook" />
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
