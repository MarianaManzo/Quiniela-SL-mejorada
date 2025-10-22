import admin from "firebase-admin";

type Selection = "L" | "E" | "V";

type QuinielaSeed = {
  jornada: number;
  pronosticos: Selection[];
};

type UsuarioSeed = {
  uid: string;
  nombreApellido: string;
  email: string;
  quinielas: QuinielaSeed[];
};

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const usuarios: UsuarioSeed[] = [
  {
    uid: "uid_luisa",
    nombreApellido: "Luisa Martínez",
    email: "luisa@example.com",
    quinielas: [
      {
        jornada: 13,
        pronosticos: ["L", "E", "V", "L", "V", "L", "E", "V", "L"],
      },
      {
        jornada: 14,
        pronosticos: ["E", "L", "L", "V", "L", "V", "L", "E", "E"],
      },
      {
        jornada: 15,
        pronosticos: ["L", "L", "V", "V", "E", "E", "L", "E", "V"],
      },
    ],
  },
  {
    uid: "uid_carlos",
    nombreApellido: "Carlos Ortega",
    email: "carlos@example.com",
    quinielas: [
      {
        jornada: 13,
        pronosticos: ["L", "V", "V", "E", "V", "L", "L", "V", "L"],
      },
      {
        jornada: 14,
        pronosticos: ["V", "E", "L", "L", "L", "E", "E", "E", "L"],
      },
      {
        jornada: 15,
        pronosticos: ["L", "E", "E", "V", "V", "E", "V", "L", "V"],
      },
    ],
  },
  {
    uid: "uid_ana",
    nombreApellido: "Ana Torres",
    email: "ana@example.com",
    quinielas: [
      {
        jornada: 13,
        pronosticos: ["L", "E", "L", "L", "V", "E", "V", "L", "E"],
      },
      {
        jornada: 14,
        pronosticos: ["E", "E", "E", "V", "E", "V", "L", "L", "V"],
      },
      {
        jornada: 15,
        pronosticos: ["V", "L", "E", "V", "E", "E", "L", "E", "L"],
      },
    ],
  },
];

const resultadosPorJornada: Record<number, Selection[]> = {
  13: ["L", "E", "V", "L", "V", "L", "E", "V", "L"],
  14: ["E", "E", "L", "V", "L", "V", "L", "E", "V"],
  15: ["L", "L", "E", "V", "V", "E", "L", "L", "V"],
};

const obtenerMaxJornada = (quinielas: QuinielaSeed[]): number =>
  quinielas.reduce((max, actual) => Math.max(max, actual.jornada), 0);

const puntosEsperados = (pronosticos: Selection[], oficiales: Selection[]): number =>
  pronosticos.reduce((acumulado, valor, index) => (valor === oficiales[index] ? acumulado + 1 : acumulado), 0);

(async () => {
  try {
    console.log("Creando usuarios y quinielas de prueba…");

    for (const usuario of usuarios) {
      const userRef = db.collection("Usuarios").doc(usuario.uid);

      // Limpiamos quinielas previas del usuario para evitar duplicados si se corre varias veces.
      const quinielasPrevias = await userRef.collection("quinielas").get();
      for (const quiniela of quinielasPrevias.docs) {
        await quiniela.ref.delete();
      }

      await userRef.set(
        {
          email: usuario.email,
          nombreApellido: usuario.nombreApellido,
          puntos: 0,
          puntosjornada: 0,
          ultimaJornada: obtenerMaxJornada(usuario.quinielas),
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp(),
        },
        { merge: true },
      );

      for (const quiniela of usuario.quinielas) {
        if (quiniela.pronosticos.length !== 9) {
          throw new Error(
            `La quiniela de ${usuario.uid} para la jornada ${quiniela.jornada} no tiene 9 pronósticos.`,
          );
        }

        await userRef.collection("quinielas").doc(quiniela.jornada.toString()).set(
          {
            jornada: quiniela.jornada,
            pronosticos: quiniela.pronosticos,
            puntosObtenidos: 0,
            estadoQuiniela: "abierta",
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    console.log("Registrando resultados oficiales para cada jornada…");

    for (const [jornadaStr, resultados] of Object.entries(resultadosPorJornada)) {
      const jornada = Number(jornadaStr);

      if (resultados.length !== 9) {
        throw new Error(`La jornada ${jornada} debe tener exactamente 9 resultados oficiales.`);
      }

      await db.collection("jornadas").doc(jornadaStr).set(
        {
          resultadosOficiales: resultados,
          fechaCierre: serverTimestamp(),
        },
        { merge: true },
      );
    }

    console.log("Seed completado. La Cloud Function calculará los puntos en cuanto procese los cambios.");

    console.log("\nTotales esperados por usuario (para comparar con el pódium):");
    for (const usuario of usuarios) {
      const total = usuario.quinielas.reduce((acc, quiniela) => {
        const oficiales = resultadosPorJornada[quiniela.jornada];
        return oficiales ? acc + puntosEsperados(quiniela.pronosticos, oficiales) : acc;
      }, 0);

      console.log(`- ${usuario.nombreApellido} (${usuario.email}): ${total} puntos totales`);
    }

    console.log(
      "\nRecuerda desplegar o iniciar la Cloud Function `calcularPuntos` para que los campos `puntos` y `puntosjornada` se actualicen.",
    );

    process.exit(0);
  } catch (error) {
    console.error("No se pudo completar el proceso de seed:", error);
    process.exit(1);
  }
})();
