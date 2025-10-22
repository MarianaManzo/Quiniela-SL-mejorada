import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const [, , sourceArg, targetArg, closeAtArg] = process.argv;

if (!targetArg) {
  console.error("Uso: npx tsx scripts/openJourney.ts <jornadaOrigen> <jornadaDestino> [ISO_fecha_cierre]");
  process.exit(1);
}

const sourceJourney = Number.parseInt(sourceArg ?? "15", 10);
const targetJourney = Number.parseInt(targetArg, 10);

if (Number.isNaN(sourceJourney) || Number.isNaN(targetJourney)) {
  console.error("Los parámetros de jornada deben ser números válidos.");
  process.exit(1);
}

const targetDocId = targetJourney.toString();
const sourceDocId = sourceJourney.toString();

const parseCloseDate = (value: string | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    console.warn(
      `No se pudo interpretar la fecha de cierre "${value}". Usa un ISO como 2025-10-15T19:00:00-05:00`,
    );
    return null;
  }

  return parsed;
};

const closeDate = parseCloseDate(closeAtArg);

const createEmptyPronosticos = (base: unknown): ("L" | "E" | "V" | null)[] => {
  if (Array.isArray(base) && base.length === 9) {
    return base.map(() => null);
  }

  return Array.from({length: 9}, () => null);
};

const openJourneyForUsers = async (): Promise<void> => {
  const usersSnap = await db.collection("Usuarios").get();
  console.log(`Procesando ${usersSnap.size} usuarios…`);

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
      {merge: true},
    );

    console.log(`Usuario ${userId}: jornada ${targetDocId} lista`);
  }
};

const ensureJourneyDocument = async (): Promise<void> => {
  const journeyRef = db.collection("jornadas").doc(targetDocId);
  const existingSnap = await journeyRef.get();
  const updates: Record<string, unknown> = {};

  if (closeDate) {
    updates.fechaCierre = admin.firestore.Timestamp.fromDate(closeDate);
  }

  if (!existingSnap.exists) {
    updates.resultadosOficiales = [];
  }

  if (Object.keys(updates).length > 0) {
    await journeyRef.set(
      {
        ...updates,
        fechaActualizacion: serverTimestamp(),
      },
      {merge: true},
    );
  }
};

openJourneyForUsers()
  .then(ensureJourneyDocument)
  .then(() => {
    console.log(`Jornada ${targetDocId} preparada correctamente.`);
    if (closeDate) {
      console.log(`Fecha de cierre registrada: ${closeDate.toISOString()}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("No se pudo preparar la nueva jornada", error);
    process.exit(1);
  });
