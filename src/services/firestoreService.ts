import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseFirestore } from "../firebase";
import type { Selection } from "../quiniela/config";

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
