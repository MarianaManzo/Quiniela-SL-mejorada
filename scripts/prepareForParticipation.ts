import admin from "firebase-admin";

const ALLOWED_JOURNEYS = new Set([17, 18]);

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const SOURCE_TEMPLATE_JOURNEY = 17;

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
    const journeyNumber = Number.parseInt(journeyDoc.id, 10);
    if (!ALLOWED_JOURNEYS.has(journeyNumber)) {
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

const sanitizeTemplateData = (data: FirebaseFirestore.DocumentData | undefined, journeyNumber: number) => {
  const base: Record<string, unknown> = {
    jornada: journeyNumber,
    resultadosOficiales: [],
    fechaActualizacion: serverTimestamp(),
  };

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

  if (journeyNumber !== SOURCE_TEMPLATE_JOURNEY) {
    base.resultadosOficiales = [];
  } else if (Array.isArray(data.resultadosOficiales)) {
    base.resultadosOficiales = data.resultadosOficiales;
  }

  return base;
};

const ensureAllowedJourneysExist = async (): Promise<void> => {
  const templateSnap = await db.collection("jornadas").doc(SOURCE_TEMPLATE_JOURNEY.toString()).get();
  const templateData = templateSnap.exists ? templateSnap.data() : undefined;

  for (const journeyNumber of ALLOWED_JOURNEYS) {
    const docRef = db.collection("jornadas").doc(journeyNumber.toString());
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const payload = sanitizeTemplateData(templateData, journeyNumber);
      await docRef.set(payload, { merge: true });
      console.log(`Se creó la jornada ${journeyNumber}.`);
      continue;
    }

    if (journeyNumber === SOURCE_TEMPLATE_JOURNEY) {
      const payload = sanitizeTemplateData(templateData, journeyNumber);
      await docRef.set(payload, { merge: true });
      console.log(`Se actualizó la jornada ${journeyNumber}.`);
    } else {
      await docRef.set(
        {
          jornada: journeyNumber,
          fechaActualizacion: serverTimestamp(),
        },
        { merge: true },
      );
      console.log(`Se mantuvo la jornada ${journeyNumber} sin sobrescribir contenido existente.`);
    }
  }
};

const main = async (): Promise<void> => {
  await wipeUserData();
  await pruneJourneys();
  await ensureAllowedJourneysExist();
  console.log("Base preparada para participación con jornadas 17 y 18 únicamente.");
};

main().catch((error) => {
  console.error("Error al preparar la base de datos:", error);
  process.exit(1);
});
