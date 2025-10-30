import admin from "firebase-admin";

const ALLOWED_JOURNEY_IDS = new Set(["17", "CF", "SF", "F"]);
const STAGE_DEFINITIONS: Record<
  string,
  {
    etapa: string;
    descripcion: string;
    orden: number;
  }
> = {
  CF: {
    etapa: "Cuartos de final",
    descripcion: "Llaves de cuartos publicadas al cierre de la jornada 17.",
    orden: 18,
  },
  SF: {
    etapa: "Semifinal",
    descripcion: "Cruces definidos una vez concluidos los cuartos de final.",
    orden: 19,
  },
  F: {
    etapa: "Final",
    descripcion: "La gran final se anunciará tras las semifinales.",
    orden: 20,
  },
};

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const SOURCE_TEMPLATE_JOURNEY = "17";

const deleteCollectionDocs = async (collectionRef: FirebaseFirestore.CollectionReference, batchSize = 250): Promise<void> => {
  let lastSnapshot = await collectionRef.orderBy(admin.firestore.FieldPath.documentId()).limit(batchSize).get();

  while (!lastSnapshot.empty) {
    const batch = db.batch();
    lastSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();

    const lastDoc = lastSnapshot.docs[lastSnapshot.docs.length - 1];
    lastSnapshot = await collectionRef
      .orderBy(admin.firestore.FieldPath.documentId())
      .startAfter(lastDoc.id)
      .limit(batchSize)
      .get();
  }
};

const wipeUserData = async (): Promise<void> => {
  const usersSnap = await db.collection("Usuarios").get();
  console.log(`Eliminando ${usersSnap.size} usuarios y sus quinielas…`);

  for (const userDoc of usersSnap.docs) {
    const quinielasRef = userDoc.ref.collection("quinielas");
    await deleteCollectionDocs(quinielasRef);

    const subCollections = await userDoc.ref.listCollections();
    for (const subcollection of subCollections) {
      if (subcollection.id === "quinielas") {
        continue;
      }
      await deleteCollectionDocs(subcollection);
    }

    await userDoc.ref.delete();
  }

  console.log("Usuarios eliminados correctamente.");
};

const pruneJourneys = async (): Promise<void> => {
  const journeysSnap = await db.collection("jornadas").get();
  console.log(`Revisando ${journeysSnap.size} documentos de jornadas…`);

  const batch = db.batch();
  let pendingWrites = 0;

  journeysSnap.docs.forEach((journeyDoc) => {
    const journeyId = journeyDoc.id;
    if (!ALLOWED_JOURNEY_IDS.has(journeyId)) {
      batch.delete(journeyDoc.ref);
      pendingWrites += 1;
    }
  });

  if (pendingWrites > 0) {
    await batch.commit();
    console.log(`Se eliminaron ${pendingWrites} jornadas fuera del rango permitido.`);
  } else {
    console.log("No había jornadas adicionales para eliminar.");
  }
};

const sanitizeTemplateData = (data: FirebaseFirestore.DocumentData | undefined, journeyId: string) => {
  const base: Record<string, unknown> = {
    jornada: journeyId,
    resultadosOficiales: [],
    fechaActualizacion: serverTimestamp(),
    orden: 17,
  };

  if (journeyId !== SOURCE_TEMPLATE_JOURNEY) {
    base.resultadosOficiales = [];
    base.tipo = "liguilla";
    const stage = STAGE_DEFINITIONS[journeyId];
    if (stage) {
      base.etapa = stage.etapa;
      base.descripcion = stage.descripcion;
      base.orden = stage.orden;
    }
    base.fechaApertura = serverTimestamp();
    base.fechaCierre = serverTimestamp();
    return base;
  }

  if (!data) {
    base.fechaApertura = serverTimestamp();
    base.fechaCierre = serverTimestamp();
    return base;
  }

  const allowedFields = [
    "titulo",
    "subtitulo",
    "descripcion",
    "fechaInicio",
    "fechaApertura",
    "fechaCierre",
    "liga",
    "temporada",
  ] as const;

  for (const field of allowedFields) {
    if (data[field] != null) {
      base[field] = data[field];
    }
  }

  if (Array.isArray(data.resultadosOficiales)) {
    base.resultadosOficiales = data.resultadosOficiales;
  }

  return base;
};

const ensureAllowedJourneysExist = async (): Promise<void> => {
  const templateSnap = await db.collection("jornadas").doc(SOURCE_TEMPLATE_JOURNEY).get();
  const templateData = templateSnap.exists ? templateSnap.data() : undefined;

  for (const journeyId of ALLOWED_JOURNEY_IDS) {
    const docRef = db.collection("jornadas").doc(journeyId);
    const snapshot = await docRef.get();

    const payload = sanitizeTemplateData(templateData, journeyId);
    await docRef.set(payload, { merge: true });
    console.log(`${snapshot.exists ? "Se actualizó" : "Se creó"} la jornada ${journeyId}.`);
  }
};

const main = async (): Promise<void> => {
  await wipeUserData();
  await pruneJourneys();
  await ensureAllowedJourneysExist();
  console.log("Base preparada para participación con jornada 17 y etapas de liguilla (CF, SF, F).");
};

main().catch((error) => {
  console.error("Error al preparar la base de datos:", error);
  process.exit(1);
});
