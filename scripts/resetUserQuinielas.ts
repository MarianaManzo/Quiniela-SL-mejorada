import admin from "firebase-admin";

type Selection = "L" | "E" | "V";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const [, , userIdArg, totalJourneysArg] = process.argv;

if (!userIdArg) {
  console.error("Uso: npx tsx scripts/resetUserQuinielas.ts <uid> [totalJornadas=18]");
  process.exit(1);
}

const totalJourneys = Number.parseInt(totalJourneysArg ?? "18", 10);

if (Number.isNaN(totalJourneys) || totalJourneys <= 0) {
  console.error("El número total de jornadas debe ser un entero positivo.");
  process.exit(1);
}

const buildEmptyPronosticos = (): (Selection | null)[] => Array.from({ length: 9 }, () => null);

const resetUserJourneys = async (): Promise<void> => {
  const userRef = db.collection("Usuarios").doc(userIdArg);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    console.error(`No existe el documento Usuarios/${userIdArg}`);
    process.exit(1);
  }

  const batch = db.batch();
  const quinielasRef = userRef.collection("quinielas");

  // Limpiamos cualquier quiniela extra para evitar residuos.
  const existingSnap = await quinielasRef.get();
  existingSnap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  for (let journey = 1; journey <= totalJourneys; journey += 1) {
    const docRef = quinielasRef.doc(journey.toString());
    batch.set(
      docRef,
      {
        jornada: journey,
        pronosticos: buildEmptyPronosticos(),
        estadoQuiniela: "abierta",
        quinielaEnviada: false,
        puntosObtenidos: 0,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`Se reiniciaron ${totalJourneys} jornadas para el usuario ${userIdArg}.`);
};

resetUserJourneys().catch((error) => {
  console.error("No se pudo reiniciar las quinielas del usuario:", error);
  process.exit(1);
});
