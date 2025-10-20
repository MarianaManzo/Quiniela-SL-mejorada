import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const calcularPuntos = functions.firestore
  .document("jornadas/{jornadaId}")
  .onWrite(async (change, context) => {
    const jornadaId = context.params.jornadaId;
    const afterData = change.after.exists ? change.after.data() : null;

    if (!afterData) {
      functions.logger.info(`Documento de jornada ${jornadaId} eliminado. No se recalcularán puntos.`);
      return null;
    }

    const oficiales = afterData.resultadosOficiales as string[] | undefined;
    if (!Array.isArray(oficiales) || oficiales.length !== 9) {
      functions.logger.warn(`Resultados oficiales incompletos para jornada ${jornadaId}.`);
      return null;
    }

    const jornadaNumero = Number(jornadaId);
    if (Number.isNaN(jornadaNumero)) {
      functions.logger.error(`ID de jornada inválido: ${jornadaId}`);
      return null;
    }

    const quinielasSnapshot = await db
      .collectionGroup("quinielas")
      .where("jornada", "==", jornadaNumero)
      .get();

    if (quinielasSnapshot.empty) {
      functions.logger.info(`No se encontraron quinielas para jornada ${jornadaNumero}.`);
      return null;
    }

    const batch = db.batch();

    quinielasSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const pronosticos = Array.isArray(data.pronosticos) ? data.pronosticos : [];
      const anterior = typeof data.puntosObtenidos === "number" ? data.puntosObtenidos : 0;

      let puntos = 0;
      for (let i = 0; i < oficiales.length; i += 1) {
        if (pronosticos[i] === oficiales[i]) {
          puntos += 1;
        }
      }

      const delta = puntos - anterior;

      batch.set(
        docSnap.ref,
        {
          puntosObtenidos: puntos,
          estadoQuiniela: "cerrada",
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const userRef = docSnap.ref.parent?.parent;
      if (userRef && delta !== 0) {
        batch.set(
          userRef,
          {
            puntos: admin.firestore.FieldValue.increment(delta),
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
            ultimaJornada: jornadaNumero,
          },
          { merge: true },
        );
      }
    });

    await batch.commit();
    functions.logger.info(`Puntos calculados para jornada ${jornadaNumero}`);
    return null;
  });
