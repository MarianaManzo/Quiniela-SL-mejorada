import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const JORNADA = Number(process.argv[2]);

if (Number.isNaN(JORNADA)) {
  console.error("Debes indicar la jornada (número).");
  process.exit(1);
}

(async () => {
  const quinielasSnapshot = await db.collectionGroup("quinielas").get();
  const batch = db.batch();

  quinielasSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.jornada === JORNADA) {
      batch.set(
        docSnap.ref,
        {
          puntosObtenidos: 0,
          estadoQuiniela: "abierta",
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const userRef = docSnap.ref.parent?.parent;
      if (userRef) {
        batch.update(userRef, {
          puntos: 0,
          ultimaJornada: 0,
        });
      }
    }
  });

  await batch.commit();
  console.log(`Reiniciadas quinielas y puntajes para la jornada ${JORNADA}`);
  process.exit(0);
})();
