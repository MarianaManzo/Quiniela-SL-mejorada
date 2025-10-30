import {onRequest} from "firebase-functions/v1/https";
import {logger} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {CONSTANCY_BADGES_BY_ID} from "./badges";
import type {ConstancyBadgeId} from "./badges";

initializeApp();

const WEB_APP_URL = process.env.WEB_APP_URL ?? "https://somoslocalesfmx.com";
const REMINDERS_COLLECTION = "recordatorios" as const;
const MULTICAST_CHUNK_LIMIT = 500;

type ReminderState = "pendiente" | "enviando" | "enviado" | "error";

type ReminderDoc = {
  titulo?: unknown;
  mensaje?: unknown;
  url?: unknown;
  programadoPara?: Timestamp;
  estado?: ReminderState;
  ultimoIntento?: Timestamp;
  fechaEnvio?: Timestamp;
  entregados?: number;
  fallidos?: number;
  errorMensaje?: string;
};

type DeviceTokenRef = {
  uid: string;
  token: string;
};

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) {
    return [items];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const fetchAllDeviceTokens = async (): Promise<DeviceTokenRef[]> => {
  const db = getFirestore();
  const snapshot = await db.collectionGroup("devices").get();
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .map((docSnap) => {
      const token = docSnap.id;
      const uid = docSnap.ref.parent.parent?.id ?? null;
      if (!token || !uid) {
        return null;
      }
      return {uid, token};
    })
    .filter((entry): entry is DeviceTokenRef => Boolean(entry));
};

const cleanupInvalidTokens = async (invalid: DeviceTokenRef[]) => {
  if (invalid.length === 0) {
    return;
  }
  const db = getFirestore();
  await Promise.all(
    invalid.map(({uid, token}) =>
      db.doc(`Usuarios/${uid}/devices/${token}`).delete().catch(() => undefined),
    ),
  );
};

/**
 * HTTP endpoint para calcular puntos de una quiniela puntual.
 */
export const calcularPuntosUsuario = onRequest(async (req, res) => {
  const uid = (req.query.uid as string) ?? "";
  const jornadaParam = (req.query.jornada as string) ?? "";

  if (!uid || !jornadaParam) {
    res.status(400).send("Faltan parámetros uid o jornada");
    return;
  }

  const jornada = Number.parseInt(jornadaParam, 10);
  if (Number.isNaN(jornada)) {
    res.status(400).send("Parámetro jornada inválido");
    return;
  }

  const db = getFirestore();

  try {
    const quinielaByNumber = db.doc(`Usuarios/${uid}/quinielas/${jornada}`);
    const quinielaByName = db.doc(
      `Usuarios/${uid}/quinielas/jornada_${jornada}`,
    );
    const resultadosRef = db.doc(`jornadas/${jornada}`);

    const [snapNumber, snapName, resultadosSnap] = await Promise.all([
      quinielaByNumber.get(),
      quinielaByName.get(),
      resultadosRef.get(),
    ]);

    const quinielaDoc = snapNumber.exists ? snapNumber : snapName;
    const quinielaRef = snapNumber.exists
      ? quinielaByNumber
      : snapName.exists
        ? quinielaByName
        : null;

    if (!quinielaDoc || !quinielaRef) {
      res.status(404).send("Quiniela no encontrada");
      return;
    }

    if (!resultadosSnap.exists) {
      res.status(404).send("Resultados oficiales no encontrados");
      return;
    }

    const pronosticosRaw = quinielaDoc.get("pronosticos");
    const oficialesRaw = resultadosSnap.get("resultadosOficiales");
    const pronosticos = Array.isArray(pronosticosRaw) ? pronosticosRaw : [];
    const oficiales = Array.isArray(oficialesRaw) ? oficialesRaw : [];

    let puntos = 0;
    const limite = Math.min(pronosticos.length, oficiales.length);

    for (let i = 0; i < limite; i += 1) {
      const prono = (pronosticos[i] || "").toString().trim().toUpperCase();
      const oficial = (oficiales[i] || "").toString().trim().toUpperCase();
      if (prono === oficial) {
        puntos += 1;
      }
    }

    const previousPointsRaw = quinielaDoc.get("puntosObtenidos");
    const previousPoints =
      typeof previousPointsRaw === "number" && Number.isFinite(previousPointsRaw)
        ? previousPointsRaw
        : 0;
    const delta = puntos - previousPoints;

    await quinielaRef.update({
      puntosObtenidos: puntos,
      fechaActualizacion: FieldValue.serverTimestamp(),
      estadoQuiniela: "cerrada",
      quinielaEnviada: true,
    });

    const userRef = db.doc(`Usuarios/${uid}`);
    const userUpdates: Record<string, unknown> = {
      fechaActualizacion: FieldValue.serverTimestamp(),
      puntosjornada: puntos,
    };

    if (delta !== 0) {
      userUpdates.puntos = FieldValue.increment(delta);
    }

    await userRef.set(userUpdates, {merge: true});

    if (delta !== 0) {
      logger.info("Puntos del usuario actualizados", {uid, jornada, delta, total: puntos});
    }

    res.status(200).json({puntos});
  } catch (error) {
    console.error("Error al calcular puntos:", error);
    res.status(500).send("Error interno");
  }
});

type CloseSummary = {
  jornada: number;
  updated: number;
};

const closeExpiredJourneys = async (): Promise<{
  closedJourneys: CloseSummary[];
  checkedJourneys: number;
}> => {
  const db = getFirestore();
  const now = new Date();

  const jornadasSnapshot = await db
    .collection("jornadas")
    .where("fechaCierre", "<=", now)
    .get();

  if (jornadasSnapshot.empty) {
    logger.info("No hay jornadas con fecha de cierre vencida");
    return {closedJourneys: [], checkedJourneys: 0};
  }

  const summaries: CloseSummary[] = [];

  for (const jornadaDoc of jornadasSnapshot.docs) {
    const jornadaNumber = Number.parseInt(jornadaDoc.id, 10);
    if (Number.isNaN(jornadaNumber)) {
      logger.warn("Id de jornada inválido", jornadaDoc.id);
      continue;
    }

    const abiertosSnapshot = await db
      .collectionGroup("quinielas")
      .where("jornada", "==", jornadaNumber)
      .where("estadoQuiniela", "==", "abierta")
      .get();

    if (abiertosSnapshot.empty) {
      continue;
    }

    let batch = db.batch();
    let operations = 0;
    let updated = 0;

    for (const quinielaDoc of abiertosSnapshot.docs) {
      batch.update(quinielaDoc.ref, {
        estadoQuiniela: "cerrada",
        quinielaCerradaAutomaticamente: true,
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
      operations += 1;
      updated += 1;

      if (operations === 400) {
        await batch.commit();
        batch = db.batch();
        operations = 0;
      }
    }

    if (operations > 0) {
      await batch.commit();
    }

    summaries.push({jornada: jornadaNumber, updated});
    logger.info("Jornada cerrada automáticamente", {jornada: jornadaNumber, updated});
  }

  return {
    closedJourneys: summaries,
    checkedJourneys: jornadasSnapshot.size,
  };
};

export const cerrarQuinielasManualmente = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Método no permitido. Usa POST.");
    return;
  }

  try {
    const summary = await closeExpiredJourneys();
    res.status(200).json(summary);
  } catch (error) {
    logger.error("Error al cerrar quinielas manualmente", error);
    res.status(500).send("Error interno");
  }
});

export const notificarInsigniaConstancia = onCall(async (request) => {
  const uid = request.auth?.uid;
  const badgeIdRaw = request.data?.badgeId;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para enviar notificaciones.");
  }

  if (typeof badgeIdRaw !== "string") {
    throw new HttpsError("invalid-argument", "Se requiere un identificador de insignia válido.");
  }

  const badgeId = badgeIdRaw as ConstancyBadgeId;
  const badge = CONSTANCY_BADGES_BY_ID[badgeId];
  if (!badge) {
    throw new HttpsError("invalid-argument", "Insignia desconocida.");
  }

  const db = getFirestore();
  const devicesSnapshot = await db.collection(`Usuarios/${uid}/devices`).get();

  if (devicesSnapshot.empty) {
    logger.info("Sin dispositivos para notificar insignia", {uid, badgeId: badge.id});
    return {delivered: 0};
  }

  const tokens = devicesSnapshot.docs.map((docSnap) => docSnap.id).filter(Boolean);

  if (tokens.length === 0) {
    return {delivered: 0};
  }

  const message = {
    tokens,
    notification: {
      title: `${badge.title} desbloqueada`,
      body: badge.notificationMessage,
    },
    data: {
      url: `${WEB_APP_URL}/profile`,
      badgeId,
      badgeTitle: badge.title,
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        icon: `${WEB_APP_URL}/icons/icon-192.png`,
        badge: `${WEB_APP_URL}/icons/notification-small.png`,
      },
      fcmOptions: {
        link: `${WEB_APP_URL}/profile`,
      },
    },
  } as const;

  const response = await getMessaging().sendEachForMulticast(message);

  const invalidTokens: string[] = [];
  response.responses.forEach((single, index) => {
    if (!single.success && single.error?.code === "messaging/registration-token-not-registered") {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length > 0) {
    await Promise.all(
      invalidTokens.map((token) => db.doc(`Usuarios/${uid}/devices/${token}`).delete().catch(() => undefined)),
    );
  }

  logger.info("Notificación de insignia enviada", {
    uid,
    badgeId,
    delivered: response.successCount,
    failed: response.failureCount,
  });

  return {delivered: response.successCount};
});

/**
 * Procesa recordatorios almacenados en la colección `recordatorios` y envía una notificación
 * push a todos los dispositivos registrados cuando el campo `programadoPara` es alcanzado.
 *
 * Estructura sugerida para cada documento de la colección:
 * {
 *   titulo: "Recordatorio jornada",
 *   mensaje: "Ya puedes registrar tus pronósticos",
 *   url: "https://tusitio.com/dashboard", // opcional, default dashboard
 *   programadoPara: <Timestamp>,
 *   estado: "pendiente" | "enviando" | "enviado" | "error"
 * }
 */
export const procesarRecordatorios = onSchedule("* * * * *", async () => {
  const db = getFirestore();
  const now = Timestamp.now();

  const snapshot = await db
    .collection(REMINDERS_COLLECTION)
    .where("estado", "==", "pendiente")
    .where("programadoPara", "<=", now)
    .orderBy("programadoPara", "asc")
    .limit(10)
    .get();

  if (snapshot.empty) {
    logger.debug("Sin recordatorios pendientes en este ciclo");
    return;
  }

  const tokens = await fetchAllDeviceTokens();

  if (tokens.length === 0) {
    await Promise.all(
      snapshot.docs.map((docSnap) =>
        docSnap.ref.update({
          estado: "enviado",
          entregados: 0,
          fallidos: 0,
          fechaEnvio: FieldValue.serverTimestamp(),
          ultimoIntento: FieldValue.serverTimestamp(),
          errorMensaje: "Sin dispositivos registrados para enviar recordatorios.",
        }),
      ),
    );
    logger.info("Recordatorios marcados como enviados pero sin dispositivos registrados", {
      remindersChecked: snapshot.size,
    });
    return;
  }

  let remindersSent = 0;
  const invalidTokens: DeviceTokenRef[] = [];

  for (const docSnap of snapshot.docs) {
    const reminderData = docSnap.data() as ReminderDoc;
    const programadoPara = reminderData.programadoPara?.toDate();

    if (!programadoPara) {
      await docSnap.ref.update({
        estado: "error",
        ultimoIntento: FieldValue.serverTimestamp(),
        errorMensaje: "Campo programadoPara inválido o ausente.",
      });
      continue;
    }

    const title =
      typeof reminderData.titulo === "string" && reminderData.titulo.trim().length > 0
        ? reminderData.titulo.trim()
        : "Recordatorio Somos Locales";
    const body =
      typeof reminderData.mensaje === "string" && reminderData.mensaje.trim().length > 0
        ? reminderData.mensaje.trim()
        : "No olvides registrar tus pronósticos.";
    const targetUrl =
      typeof reminderData.url === "string" && reminderData.url.trim().length > 0
        ? reminderData.url.trim()
        : `${WEB_APP_URL}/dashboard`;

    const movedToProcessing = await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(docSnap.ref);
      const freshData = freshSnap.data() as ReminderDoc | undefined;
      if (!freshSnap.exists || freshData?.estado !== "pendiente") {
        return false;
      }
      const freshProgramado = freshData.programadoPara?.toDate();
      if (!freshProgramado || freshProgramado.getTime() > Date.now()) {
        return false;
      }
      transaction.update(docSnap.ref, {
        estado: "enviando",
        ultimoIntento: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (!movedToProcessing) {
      continue;
    }

    try {
      let delivered = 0;
      let failed = 0;

      for (const chunk of chunkArray(tokens, MULTICAST_CHUNK_LIMIT)) {
        const chunkTokens = chunk.map((entry) => entry.token);
        if (chunkTokens.length === 0) {
          continue;
        }

        const response = await getMessaging().sendEachForMulticast({
          tokens: chunkTokens,
          notification: {
            title,
            body,
          },
          data: {
            url: targetUrl,
            reminderId: docSnap.id,
          },
          webpush: {
            headers: {
              Urgency: "high",
            },
            notification: {
              icon: `${WEB_APP_URL}/icons/icon-192.png`,
              badge: `${WEB_APP_URL}/icons/notification-small.png`,
            },
            fcmOptions: {
              link: targetUrl,
            },
          },
        });

        delivered += response.successCount;
        failed += response.failureCount;

        response.responses.forEach((single, index) => {
          if (
            !single.success &&
            single.error?.code === "messaging/registration-token-not-registered"
          ) {
            const tokenRef = chunk[index];
            if (tokenRef) {
              invalidTokens.push(tokenRef);
            }
          }
        });
      }

      remindersSent += 1;
      await docSnap.ref.update({
        estado: "enviado",
        entregados: delivered,
        fallidos: failed,
        fechaEnvio: FieldValue.serverTimestamp(),
        ultimoIntento: FieldValue.serverTimestamp(),
        errorMensaje: FieldValue.delete(),
      });
    } catch (error) {
      logger.error("Error al enviar recordatorio", {
        reminderId: docSnap.id,
        error,
      });
      await docSnap.ref.update({
        estado: "error",
        errorMensaje:
          error instanceof Error ? error.message : "Error desconocido al enviar el recordatorio.",
        ultimoIntento: FieldValue.serverTimestamp(),
      });
    }
  }

  await cleanupInvalidTokens(invalidTokens);

  logger.info("Recordatorios procesados", {
    remindersChecked: snapshot.size,
    remindersSent,
    tokensChecked: tokens.length,
    invalidTokens: invalidTokens.length,
  });
});
