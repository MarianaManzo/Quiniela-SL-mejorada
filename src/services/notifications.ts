import { httpsCallable } from "firebase/functions";
import { firebaseFunctions } from "../firebase";
import type { ConstancyBadgeId } from "../types/badges";

type NotifyBadgePayload = {
  badgeId: ConstancyBadgeId;
};

type NotifyBadgeResponse = {
  delivered: number;
};

const notifyConstancyCallable = httpsCallable<NotifyBadgePayload, NotifyBadgeResponse>(
  firebaseFunctions,
  "notificarInsigniaConstancia",
);

export const notifyConstancyBadgeUnlock = async (badgeId: ConstancyBadgeId): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await notifyConstancyCallable({ badgeId });
  } catch (error) {
    console.warn("No se pudo enviar la notificación de insignia", error);
  }
};
