import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseFirestore } from "../firebase";
import type { Selection } from "../quiniela/config";

export type PodiumUser = {
  id: string;
  nombre: string;
  email: string;
  puntosTotales: number;
  ultimaJornada: number;
};

type GuardarQuinielaPayload = {
  uid: string;
  jornada: number;
  pronosticos: Selection[];
  puntosObtenidos?: number;
  estadoQuiniela?: "abierta" | "cerrada";
};

/**
 * Crea o actualiza el documento del usuario dentro de la colección `Usuarios`.
 * Si el usuario ya existe se conservan sus datos actuales.
 */
export const crearOActualizarUsuario = async (user: User): Promise<void> => {
  const userRef = doc(firebaseFirestore, "Usuarios", user.uid);

  const snapshot = await getDoc(userRef);
  const existingData = snapshot.exists() ? snapshot.data() : null;

  const nombreApellido =
    user.displayName?.trim() ||
    (typeof existingData?.nombreApellido === "string" ? existingData.nombreApellido : "") ||
    (user.email ? user.email.split("@")[0] : "");

  const basePayload = {
    nombreApellido,
    email: user.email ?? existingData?.email ?? "",
    rol: existingData?.rol ?? "usuario",
    puntos: typeof existingData?.puntos === "number" ? existingData.puntos : 0,
    ultimaJornada: typeof existingData?.ultimaJornada === "number" ? existingData.ultimaJornada : 0,
  };

  await setDoc(
    userRef,
    {
      ...basePayload,
      fechaCreacion: existingData?.fechaCreacion ?? serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Guarda la quiniela del usuario en la subcolección `Usuarios/{uid}/quinielas`.
 * El identificador del documento será `jornada_${jornada}` para que sea único por jornada.
 */
export const guardarQuiniela = async ({
  uid,
  jornada,
  pronosticos,
  puntosObtenidos = 0,
  estadoQuiniela = "abierta",
}: GuardarQuinielaPayload): Promise<void> => {
  if (pronosticos.length !== 9) {
    throw new Error("La quiniela debe incluir 9 pronósticos.");
  }

  const quinielaRef = doc(firebaseFirestore, "Usuarios", uid, "quinielas", `jornada_${jornada}`);

  await setDoc(quinielaRef, {
    jornada,
    pronosticos,
    puntosObtenidos,
    estadoQuiniela,
    fechaCreacion: serverTimestamp(),
  });

  const userRef = doc(firebaseFirestore, "Usuarios", uid);
  await updateDoc(userRef, { ultimaJornada: jornada });
};

export const obtenerUsuariosParaPodio = async (limitResult = 0): Promise<PodiumUser[]> => {
  const usuariosSnapshot = await getDocs(collection(firebaseFirestore, "Usuarios"));

  const usuarios = await Promise.all(
    usuariosSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const nombre = typeof data.nombreApellido === "string" && data.nombreApellido.trim().length > 0
        ? data.nombreApellido.trim()
        : typeof data.email === "string"
          ? data.email
          : "Participante";
      const email = typeof data.email === "string" ? data.email : "";
      const ultimaJornada = typeof data.ultimaJornada === "number" ? data.ultimaJornada : 0;

      let puntosTotales = typeof data.puntos === "number" ? data.puntos : 0;
      if (!puntosTotales) {
        const quinielasSnapshot = await getDocs(collection(firebaseFirestore, "Usuarios", docSnap.id, "quinielas"));
        puntosTotales = quinielasSnapshot.docs.reduce((acc, quinielaDoc) => {
          const quinielaData = quinielaDoc.data();
          const puntos = typeof quinielaData.puntosObtenidos === "number" ? quinielaData.puntosObtenidos : 0;
          return acc + puntos;
        }, 0);
      }

      return {
        id: docSnap.id,
        nombre,
        email,
        puntosTotales,
        ultimaJornada,
      } satisfies PodiumUser;
    })
  );

  const ordered = usuarios.sort((a, b) => {
    if (b.puntosTotales !== a.puntosTotales) {
      return b.puntosTotales - a.puntosTotales;
    }
    if (b.ultimaJornada !== a.ultimaJornada) {
      return b.ultimaJornada - a.ultimaJornada;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  if (limitResult > 0) {
    return ordered.slice(0, limitResult);
  }

  return ordered;
};
