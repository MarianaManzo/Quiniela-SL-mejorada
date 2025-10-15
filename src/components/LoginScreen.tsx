import { FormEvent, useMemo, useState } from "react";
import type { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";
import logoSomosLocales from "figma:asset/logo-somos-locales.png";
import "../styles/login.css";
import { firebaseAuth, googleAuthProvider } from "../firebase";

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
  onLogin?: (user: UserProfile) => void;
}

function getFirebaseErrorMessage(error: FirebaseError, mode: AuthMode) {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-closed-by-user': 'La ventana de inicio de sesión se cerró antes de finalizar.',
    'auth/cancelled-popup-request': 'Ya hay una ventana de inicio abierta.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Intenta de nuevo.',
  };

  if (messages[error.code]) {
    return messages[error.code];
  }

  return mode === 'register'
    ? 'No pudimos crear tu cuenta. Intenta nuevamente.'
    : 'No pudimos iniciar sesión. Revisa tus datos e intenta nuevamente.';
}

type AuthMode = 'login' | 'register';

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameError = useMemo(() => {
    if (mode === 'login') {
      return null;
    }

    const value = name.trim();
    if (!value) {
      return 'Ingresa tu nombre completo.';
    }

    if (value.length < 4) {
      return 'El nombre es demasiado corto.';
    }

    if (value.split(' ').filter(Boolean).length < 2) {
      return 'Escribe nombre y apellido.';
    }

    return null;
  }, [name, mode]);

  const emailError = useMemo(() => {
    const value = email.trim();
    if (!value) {
      return 'Ingresa tu correo.';
    }

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_PATTERN.test(value)) {
      return 'Escribe un correo válido.';
    }

    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password.trim()) {
      return 'Ingresa tu contraseña.';
    }

    if (password.trim().length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return null;
  }, [password]);

  const isFormValid = (mode === 'login' || !nameError) && !emailError && !passwordError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (!isFormValid) {
      setFormMessage('Revisa la información antes de continuar.');
      return;
    }

    setFormMessage(null);
    setIsSubmitting(true);

    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();
      const displayName = name.trim();
      const shouldUpdateName = displayName.length > 0;

      const credential =
        mode === 'register'
          ? await createUserWithEmailAndPassword(firebaseAuth, emailTrimmed, passwordTrimmed)
          : await signInWithEmailAndPassword(firebaseAuth, emailTrimmed, passwordTrimmed);

      if (mode === 'register' && shouldUpdateName) {
        await updateProfile(credential.user, { displayName });
      } else if (mode === 'login' && shouldUpdateName && !credential.user.displayName) {
        await updateProfile(credential.user, { displayName });
      }

      const resolvedName = credential.user.displayName?.trim()
        || (shouldUpdateName ? displayName : '')
        || emailTrimmed.split('@')[0];

      onLogin?.({
        name: resolvedName,
        email: credential.user.email ?? emailTrimmed,
        role: 'aficion',
      });

      setFormMessage(null);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setFormMessage(getFirebaseErrorMessage(firebaseError, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormMessage(null);
    setIsSubmitting(true);

    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        onLogin?.({
          name: currentUser.displayName ?? currentUser.email ?? 'Participante',
          email: currentUser.email ?? '',
          role: 'aficion',
        });
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;

      if (firebaseError.code === 'auth/popup-blocked' || firebaseError.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          return;
        } catch (redirectError) {
          setFormMessage(getFirebaseErrorMessage(redirectError as FirebaseError, 'login'));
        }
      } else {
        setFormMessage(getFirebaseErrorMessage(firebaseError, 'login'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setFormMessage(null);
    setTouched({ name: false, email: false, password: false });
    setPassword('');
    if (mode === 'register') {
      setName('');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" aria-label="Formulario de acceso a la quiniela">
        <div className="login-header">
          <img src={logoSomosLocales} alt="Somos Locales" className="login-logo" />
          <h1 className="login-title">Bienvenidos</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
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
                data-invalid={touched.name && Boolean(nameError) ? 'true' : undefined}
              />
              {touched.name && nameError ? (
                <span className="login-field__error" role="alert">
                  {nameError}
                </span>
              ) : null}
            </div>
          ) : null}

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
              data-invalid={touched.email && Boolean(emailError) ? 'true' : undefined}
            />
            {touched.email && emailError ? (
              <span className="login-field__error" role="alert">
                {emailError}
              </span>
            ) : null}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              className="login-input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPassword(nextValue);
                if (touched.password) {
                  setFormMessage(null);
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              aria-invalid={touched.password && Boolean(passwordError)}
              data-invalid={touched.password && Boolean(passwordError) ? 'true' : undefined}
            />
            {touched.password && passwordError ? (
              <span className="login-field__error" role="alert">
                {passwordError}
              </span>
            ) : null}
          </div>

          <div className="login-actions">
            <button type="submit" className="btn btn-primary login-submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Cargando…' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
            </button>
            <button type="button" className="login-toggle" onClick={toggleMode}>
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
            {formMessage ? <span className="login-note login-note--error" role="alert">{formMessage}</span> : null}
          </div>
        </form>

        <div className="login-social">
          <span className="login-social__title">O ingresa con</span>
          <div className="login-social__buttons">
            <button type="button" className="login-social__button" onClick={handleGoogleLogin} disabled={isSubmitting}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
