import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const ID_PATTERN = /^jornada_(\d+)$/;

const parseJornada = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const migrate = async (): Promise<void> => {
  const usersSnapshot = await db.collection("Usuarios").get();

  console.log(`Procesando ${usersSnapshot.size} usuarios...`);

  for (const userDoc of usersSnapshot.docs) {
    const userRef = userDoc.ref;
    const quinielasRef = userRef.collection("quinielas");
    const quinielasSnapshot = await quinielasRef.get();

    if (quinielasSnapshot.empty) {
      continue;
    }

    console.log(`\nUsuario ${userRef.path} - ${quinielasSnapshot.size} quinielas`);

    for (const quinielaDoc of quinielasSnapshot.docs) {
      const { id } = quinielaDoc;
      const data = quinielaDoc.data();

      const jornadaValue = parseJornada(data.jornada);
      const match = ID_PATTERN.exec(id);

      if (match) {
        const jornadaId = match[1];
        const numero = jornadaValue ?? Number(jornadaId);
        const destinationRef = quinielasRef.doc(jornadaId);

        await destinationRef.set(
          {
            ...data,
            jornada: numero,
          },
          { merge: true },
        );

        await quinielaDoc.ref.delete();
        console.log(`  ${id} -> ${destinationRef.id} (jornada=${numero})`);
        continue;
      }

      if (jornadaValue !== null && jornadaValue !== data.jornada) {
        await quinielaDoc.ref.update({ jornada: jornadaValue });
        console.log(`  ${id} actualizado (jornada=${jornadaValue})`);
      }
    }

    const userData = userDoc.data();
    const ultimaJornada = parseJornada(userData.ultimaJornada);
    const puntosJornada = parseJornada(userData.puntosjornada);

    const updates: Record<string, number> = {};

    if (ultimaJornada !== null && ultimaJornada !== userData.ultimaJornada) {
      updates.ultimaJornada = ultimaJornada;
    }

    if (puntosJornada !== null && puntosJornada !== userData.puntosjornada) {
      updates.puntosjornada = puntosJornada;
    }

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
      console.log(`  Campos del usuario normalizados: ${JSON.stringify(updates)}`);
    }
  }

  console.log("\nMigración completada.");
};

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error durante la migración:", error);
    process.exit(1);
  });
