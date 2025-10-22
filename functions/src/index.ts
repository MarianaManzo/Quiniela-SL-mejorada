import {onRequest} from "firebase-functions/v1/https";
import {logger} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

initializeApp();

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
