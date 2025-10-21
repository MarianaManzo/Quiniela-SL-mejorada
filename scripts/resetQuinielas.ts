import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

(async () => {
  const usuarios = await db.collection("Usuarios").get();

  for (const doc of usuarios.docs) {
    console.log(`Limpiando usuario ${doc.id}`);

    const quinielas = await doc.ref.collection("quinielas").get();
    for (const q of quinielas.docs) {
      await q.ref.delete();
    }

    await doc.ref.set(
      {
        puntos: 0,
        ultimaJornada: 0,
      },
      { merge: true },
    );
  }

  const jornadas = await db.collection("jornadas").get();
  for (const jornada of jornadas.docs) {
    await jornada.ref.delete();
  }

  console.log("Reset completo");
  process.exit(0);
})();
