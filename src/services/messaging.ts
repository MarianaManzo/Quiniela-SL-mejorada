import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

import { firebaseApp } from "../firebase";

const FALLBACK_WEB_PUSH_KEY = "BAOEBCGak4MkDn-bgUSye4XVUJOUFtF6xzIkX-SFMYyQ6Nd408_hm_OU6GvTwdv_D2_5nefpin4flOU9Jipo5RQ";

const getWebPushKey = (): string | undefined => {
  const envKey = import.meta.env.VITE_FIREBASE_WEB_PUSH_KEY;

  if (envKey && envKey.trim().length > 0) {
    return envKey;
  }

  if (import.meta.env.PROD) {
    return FALLBACK_WEB_PUSH_KEY;
  }

  return undefined;
};

const waitForServiceWorkerRegistration = async (timeoutMs = 7000): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !navigator?.serviceWorker) {
    return null;
  }

  try {
    const readyPromise = navigator.serviceWorker.ready
      .then((registration) => registration)
      .catch(() => null);

    const timeoutPromise = new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    });

    const registration = await Promise.race([readyPromise, timeoutPromise]);
    if (registration) {
      return registration;
    }
  } catch {
    // ignore errors from ready promise
  }

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      return existingRegistration;
    }
  } catch {
    // ignore errors from getRegistration
  }

  if (import.meta.env.PROD) {
    try {
      const newRegistration = await navigator.serviceWorker.register("/service-worker.js");
      return newRegistration;
    } catch (error) {
      console.warn("No se pudo registrar el Service Worker desde messaging", error);
    }
  }

  return null;
};

export type NotificationStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "missing-key"
  | "prompt-skipped"
  | "error";

export interface EnsureNotificationTokenResult {
  status: NotificationStatus;
  token?: string;
  error?: unknown;
}

const PROMPT_SESSION_FLAG = "somos-locales-fcm-prompted";

const getSessionPrompted = (): boolean => {
  try {
    return sessionStorage.getItem(PROMPT_SESSION_FLAG) === "true";
  } catch {
    return false;
  }
};

const setSessionPrompted = () => {
  try {
    sessionStorage.setItem(PROMPT_SESSION_FLAG, "true");
  } catch {
    // ignore storage errors
  }
};

const messagingInstance: Promise<Messaging | null> =
  typeof window !== "undefined"
    ? isSupported()
        .then((supported) => (supported ? getMessaging(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null);

const onEnvMissingKey: (() => void)[] = [];

export const registerEnvMissingKeyListener = (listener: () => void): (() => void) => {
  onEnvMissingKey.push(listener);
  return () => {
    const index = onEnvMissingKey.indexOf(listener);
    if (index >= 0) {
      onEnvMissingKey.splice(index, 1);
    }
  };
};

export const ensureNotificationToken = async (
  forcePrompt = false,
): Promise<EnsureNotificationTokenResult> => {
  if (typeof window === "undefined" || !("Notification" in window) || !navigator?.serviceWorker) {
    return { status: "unsupported" };
  }

  const messaging = await messagingInstance;
  if (!messaging) {
    return { status: "unsupported" };
  }

  const vapidKey = getWebPushKey();
  if (!vapidKey) {
    console.warn("VITE_FIREBASE_WEB_PUSH_KEY no está definido.");
    onEnvMissingKey.forEach((listener) => listener());
    return { status: "missing-key" };
  }

  let permission = Notification.permission;

  if (permission === "default") {
    if (!forcePrompt && getSessionPrompted()) {
      return { status: "prompt-skipped" };
    }

    setSessionPrompted();
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { status: permission as NotificationStatus };
  }

  try {
    const registration = await waitForServiceWorkerRegistration();
    if (!registration) {
      return {
        status: "error",
        error: new Error("No se pudo preparar el Service Worker para notificaciones. Recarga e inténtalo de nuevo."),
      };
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { status: "error", error: new Error("No se recibió un token válido de FCM.") };
    }

    return { status: "granted", token };
  } catch (error) {
    console.error("No se pudo obtener el token de notificaciones push", error);
    return { status: "error", error };
  }
};

export const subscribeToForegroundMessages = async (
  handler: Parameters<typeof onMessage>[1],
): Promise<() => void> => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const messaging = await messagingInstance;
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, handler);
};
