import {onRequest} from "firebase-functions/v1/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

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

    await quinielaRef.update({
      puntosObtenidos: puntos,
      fechaActualizacion: new Date(),
      estadoQuiniela: "cerrada",
    });

    res.status(200).json({puntos});
  } catch (error) {
    console.error("Error al calcular puntos:", error);
    res.status(500).send("Error interno");
  }
});
