import { guardarResultadosOficiales } from "../src/services/firestoreService";

const jornada = Number(process.argv[2]);
const resultadosArg = process.argv[3];

if (Number.isNaN(jornada)) {
  console.error("Debes indicar la jornada, por ejemplo: npx tsx scripts/guardarResultados.ts 15 L,E,V,L,L,E,V,L,E");
  process.exit(1);
}

if (!resultadosArg) {
  console.error("Debes indicar los resultados separados por comas, por ejemplo: L,E,V,L,L,E,V,L,E");
  process.exit(1);
}

const resultados = resultadosArg.split(",").map((valor) => valor.trim().toUpperCase());

if (resultados.length !== 9) {
  console.error("Debes proporcionar exactamente 9 resultados.");
  process.exit(1);
}

(async () => {
  try {
    await guardarResultadosOficiales(jornada, resultados as any);
    console.log(`Resultados oficiales guardados para la jornada ${jornada}`);
    process.exit(0);
  } catch (error) {
    console.error("No se pudieron guardar los resultados oficiales", error);
    process.exit(1);
  }
})();
