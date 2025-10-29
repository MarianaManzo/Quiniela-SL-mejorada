import admin from "firebase-admin";

type Selection = "L" | "E" | "V";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const [, , sourceArg, ...targetsArg] = process.argv;

const sourceJourney = Number.parseInt(sourceArg ?? "17", 10);
if (Number.isNaN(sourceJourney)) {
  console.error("La jornada de origen debe ser un número válido.");
  process.exit(1);
}

const DEFAULT_TARGETS = Array.from({ length: 18 }, (_, index) => index + 1);

const targetJourneys = targetsArg.length
  ? targetsArg
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => !Number.isNaN(value))
  : DEFAULT_TARGETS;

if (!targetJourneys.length) {
  console.error("No hay jornadas destino válidas.");
  process.exit(1);
}

const uniqueTargets = Array.from(new Set(targetJourneys)).filter((value) => value > 0);

const createEmptyPronosticos = (base: unknown): (Selection | null)[] => {
  if (Array.isArray(base) && base.length === 9) {
    return base.map(() => null);
  }

  return Array.from({ length: 9 }, () => null);
};

const resolveTimestampValue = (value: unknown): admin.firestore.Timestamp | admin.firestore.FieldValue => {
  if (value instanceof admin.firestore.Timestamp) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as Record<string, unknown>) &&
    typeof (value as admin.firestore.Timestamp).toDate === "function"
  ) {
    try {
      const coerced = value as admin.firestore.Timestamp;
      return coerced;
    } catch {
      // ignored, fallback to server timestamp below.
    }
  }

  return serverTimestamp();
};

const ensureJourneyDocument = async (
  targetJourney: number,
  defaults: { fechaApertura?: admin.firestore.Timestamp; fechaCierre?: admin.firestore.Timestamp },
): Promise<void> => {
  const targetDocId = targetJourney.toString();
  const journeyRef = db.collection("jornadas").doc(targetDocId);
  const snapshot = await journeyRef.get();
  const updates: Record<string, unknown> = {
    fechaActualizacion: serverTimestamp(),
  };

  if (!snapshot.exists) {
    updates.resultadosOficiales = [];
  }

  if (!snapshot.exists || snapshot.get("fechaApertura") == null) {
    updates.fechaApertura = defaults.fechaApertura ?? serverTimestamp();
  }

  if (!snapshot.exists || snapshot.get("fechaCierre") == null) {
    updates.fechaCierre = defaults.fechaCierre ?? serverTimestamp();
  }

  await journeyRef.set(updates, { merge: true });
  console.log(`Documento de jornada ${targetJourney} listo.`);
};

const cloneJourneyForUsers = async (targetJourney: number): Promise<void> => {
  if (targetJourney === sourceJourney) {
    console.log(`La jornada ${targetJourney} es la de origen, se omite.`);
    return;
  }

  const sourceDocId = sourceJourney.toString();
  const targetDocId = targetJourney.toString();

  const usersSnap = await db.collection("Usuarios").get();
  console.log(`Clonando jornada ${sourceDocId} -> ${targetDocId} para ${usersSnap.size} usuarios…`);

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const quinielasRef = userDoc.ref.collection("quinielas");
    const sourceSnap = await quinielasRef.doc(sourceDocId).get();

    if (!sourceSnap.exists) {
      console.warn(`El usuario ${userId} no tiene la jornada ${sourceDocId}, se omite.`);
      continue;
    }

    const sourceData = sourceSnap.data() ?? {};
    const pronosticosBase = createEmptyPronosticos(sourceData.pronosticos);

    await quinielasRef.doc(targetDocId).set(
      {
        jornada: targetJourney,
        pronosticos: pronosticosBase,
        estadoQuiniela: "abierta",
        quinielaEnviada: false,
        puntosObtenidos: 0,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
      },
      { merge: true },
    );
  }

  console.log(`Jornada ${targetDocId} abierta para usuarios.`);
};

const main = async (): Promise<void> => {
  console.log(`Usando jornada ${sourceJourney} como plantilla…`);

  const sourceDocId = sourceJourney.toString();
  const sourceJourneySnap = await db.collection("jornadas").doc(sourceDocId).get();
  const sourceData = sourceJourneySnap.exists ? sourceJourneySnap.data() ?? {} : {};
  const defaultFechaApertura = resolveTimestampValue(sourceData?.fechaApertura);
  const defaultFechaCierre = resolveTimestampValue(sourceData?.fechaCierre);

  for (const targetJourney of uniqueTargets) {
    await ensureJourneyDocument(targetJourney, {
      fechaApertura:
        defaultFechaApertura instanceof admin.firestore.Timestamp ? defaultFechaApertura : undefined,
      fechaCierre:
        defaultFechaCierre instanceof admin.firestore.Timestamp ? defaultFechaCierre : undefined,
    });
    await cloneJourneyForUsers(targetJourney);
  }

  console.log("Proceso completado.");
};

main().catch((error) => {
  console.error("No se pudo completar el proceso:", error);
  process.exit(1);
});
