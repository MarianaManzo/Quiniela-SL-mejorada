import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

import { firebaseApp } from "../firebase";

type NotificationStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "missing-key"
  | "prompt-skipped"
  | "error";

interface EnsureNotificationTokenResult {
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

export const ensureNotificationToken = async (): Promise<EnsureNotificationTokenResult> => {
  if (typeof window === "undefined" || !("Notification" in window) || !navigator?.serviceWorker) {
    return { status: "unsupported" };
  }

  const messaging = await messagingInstance;
  if (!messaging) {
    return { status: "unsupported" };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_WEB_PUSH_KEY;
  if (!vapidKey) {
    console.warn("Falta configurar VITE_FIREBASE_WEB_PUSH_KEY para las notificaciones push.");
    return { status: "missing-key" };
  }

  let permission = Notification.permission;

  if (permission === "default") {
    if (getSessionPrompted()) {
      return { status: "prompt-skipped" };
    }

    setSessionPrompted();
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { status: permission as NotificationStatus };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
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
