import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, type Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseFirestore } from "../firebase";
import { getJourneyDocId, getMatchesForJourney, type Selection } from "../quiniela/config";
import { CONSTANCY_BADGES } from "../data/constancyBadges";
import type { ConstancyBadgeId, ConstancyBadgeStateMap } from "../types/badges";

const BADGE_IDS = CONSTANCY_BADGES.map((badge) => badge.id);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const timestampToIso = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (isRecord(value) && typeof (value as Timestamp).toDate === "function") {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
};

const parseConstancyBadges = (raw: unknown): ConstancyBadgeStateMap => {
  if (!isRecord(raw)) {
    return {};
  }

  const result: ConstancyBadgeStateMap = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!BADGE_IDS.includes(key as ConstancyBadgeId) || !isRecord(value)) {
      return;
    }

    const streakRaw = value.streak;
    const thresholdRaw = value.threshold;
    const unlockedAtRaw = value.unlockedAt;

    result[key as ConstancyBadgeId] = {
      streak: typeof streakRaw === "number" ? streakRaw : 0,
      threshold: typeof thresholdRaw === "number" ? thresholdRaw : 0,
      unlockedAt: timestampToIso(unlockedAtRaw),
    };
  });

  return result;
};

export type FirestoreUserProfile = {
  nombreApellido: string;
  email: string;
  rol: string;
  puntos: number;
  ultimaJornada: number;
  pais?: string;
  codigoPais?: string;
  fechaNacimiento?: string;
  constancyStreak?: number;
  constancyLastJourney?: number;
  constancyBadges?: ConstancyBadgeStateMap;
};

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
  quinielaEnviada?: boolean;
};

export type GuardarQuinielaResult = {
  streak: number;
  lastJourney: number;
  unlockedBadges: ConstancyBadgeId[];
};

type RegistrarTokenDispositivoPayload = {
  uid: string;
  token: string;
  plataforma?: string | null;
  permiso?: string | null;
};

/**
 * Crea o actualiza el documento del usuario dentro de la colección `Usuarios`.
 * Si el usuario ya existe se conservan sus datos actuales.
 */
export const crearOActualizarUsuario = async (user: User): Promise<FirestoreUserProfile> => {
  const userRef = doc(firebaseFirestore, "Usuarios", user.uid);

  const snapshot = await getDoc(userRef);
  const existingData = snapshot.exists() ? snapshot.data() : null;

  const nombreApellido =
    user.displayName?.trim() ||
    (typeof existingData?.nombreApellido === "string" ? existingData.nombreApellido : "") ||
    (user.email ? user.email.split("@")[0] : "");

  const constancyStreak = typeof existingData?.constancyStreak === "number" ? existingData.constancyStreak : 0;
  const constancyLastJourney =
    typeof existingData?.constancyLastJourney === "number" ? existingData.constancyLastJourney : 0;
  const constancyBadgesRaw = isRecord(existingData?.constancyBadges) ? existingData.constancyBadges : {};

  const profilePayload: FirestoreUserProfile = {
    nombreApellido,
    email: user.email ?? existingData?.email ?? "",
    rol: existingData?.rol ?? "usuario",
    puntos: typeof existingData?.puntos === "number" ? existingData.puntos : 0,
    ultimaJornada: typeof existingData?.ultimaJornada === "number" ? existingData.ultimaJornada : 0,
    constancyStreak,
    constancyLastJourney,
    constancyBadges: parseConstancyBadges(constancyBadgesRaw),
  };

  if (typeof existingData?.pais === "string") {
    profilePayload.pais = existingData.pais;
  }
  if (typeof existingData?.codigoPais === "string") {
    profilePayload.codigoPais = existingData.codigoPais;
  }
  if (typeof existingData?.fechaNacimiento === "string") {
    profilePayload.fechaNacimiento = existingData.fechaNacimiento;
  }

  await setDoc(
    userRef,
    {
      ...profilePayload,
      constancyBadges: constancyBadgesRaw,
      fechaCreacion: existingData?.fechaCreacion ?? serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
    },
    { merge: true },
  );
  return profilePayload;
};

export const actualizarPerfilUsuario = async (
  uid: string,
  data: { pais?: string; codigoPais?: string; fechaNacimiento?: string | null },
): Promise<void> => {
  const userRef = doc(firebaseFirestore, "Usuarios", uid);

  const payload: Record<string, unknown> = {
    fechaActualizacion: serverTimestamp(),
  };

  if (typeof data.pais === "string") {
    payload.pais = data.pais;
  }
  if (typeof data.codigoPais === "string") {
    payload.codigoPais = data.codigoPais;
  }
  if (typeof data.fechaNacimiento === "string" || data.fechaNacimiento === null) {
    payload.fechaNacimiento = data.fechaNacimiento;
  }

  await updateDoc(userRef, payload);
};

/**
 * Guarda la quiniela del usuario en la subcolección `Usuarios/{uid}/quinielas`.
 * El identificador del documento se define como el número de jornada en texto.
 */
export const guardarQuiniela = async ({
  uid,
  jornada,
  pronosticos,
  puntosObtenidos = 0,
  estadoQuiniela = "abierta",
  quinielaEnviada,
}: GuardarQuinielaPayload): Promise<GuardarQuinielaResult> => {
  const expectedMatches = getMatchesForJourney(jornada).length;
  if (expectedMatches > 0 && pronosticos.length !== expectedMatches) {
    throw new Error(`La quiniela debe incluir ${expectedMatches} pronósticos.`);
  }

  const journeyDocId = getJourneyDocId(jornada);
  const quinielaRef = doc(firebaseFirestore, "Usuarios", uid, "quinielas", journeyDocId);

  await setDoc(quinielaRef, {
    jornada,
    pronosticos,
    puntosObtenidos,
    estadoQuiniela,
    quinielaEnviada: typeof quinielaEnviada === "boolean" ? quinielaEnviada : estadoQuiniela !== "abierta",
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp(),
  });

  const userRef = doc(firebaseFirestore, "Usuarios", uid);
  const userDataSnapshot = await getDoc(userRef);
  const userData = userDataSnapshot.exists() ? userDataSnapshot.data() : null;

  const previousUltimaJornada =
    typeof userData?.ultimaJornada === "number" ? userData.ultimaJornada : 0;
  const previousStreak = typeof userData?.constancyStreak === "number" ? userData.constancyStreak : 0;
  const previousLastJourney =
    typeof userData?.constancyLastJourney === "number" ? userData.constancyLastJourney : 0;
  const constancyBadgesRaw = isRecord(userData?.constancyBadges) ? userData.constancyBadges : {};
  const alreadyUnlockedIds = new Set(
    Object.keys(constancyBadgesRaw).filter((key): key is ConstancyBadgeId =>
      BADGE_IDS.includes(key as ConstancyBadgeId),
    ),
  );

  let updatedStreak = previousStreak;
  let updatedLastJourney = previousLastJourney;
  let shouldUpdateStreak = false;

  if (previousLastJourney <= 0) {
    shouldUpdateStreak = true;
    updatedStreak = 1;
    updatedLastJourney = jornada;
  } else if (jornada > previousLastJourney) {
    shouldUpdateStreak = true;
    updatedStreak = jornada === previousLastJourney + 1 ? previousStreak + 1 : 1;
    updatedLastJourney = jornada;
  } else if (jornada === previousLastJourney) {
    updatedStreak = previousStreak;
    updatedLastJourney = previousLastJourney;
  }

  const unlockedBadges: ConstancyBadgeId[] = [];
  const updates: Record<string, unknown> = {
    ultimaJornada: Math.max(previousUltimaJornada, jornada),
    fechaActualizacion: serverTimestamp(),
  };

  if (shouldUpdateStreak) {
    updates.constancyStreak = updatedStreak;
    updates.constancyLastJourney = updatedLastJourney;
  }

  if (shouldUpdateStreak || !alreadyUnlockedIds.size) {
    CONSTANCY_BADGES.forEach((badge) => {
      if (updatedStreak >= badge.threshold && !alreadyUnlockedIds.has(badge.id)) {
        unlockedBadges.push(badge.id);
        updates[`constancyBadges.${badge.id}`] = {
          unlockedAt: serverTimestamp(),
          streak: updatedStreak,
          threshold: badge.threshold,
        };
      }
    });
  }

  await updateDoc(userRef, updates);

  return {
    streak: shouldUpdateStreak ? updatedStreak : previousStreak,
    lastJourney: shouldUpdateStreak ? updatedLastJourney : previousLastJourney,
    unlockedBadges,
  };
};

export const registrarTokenDispositivo = async ({
  uid,
  token,
  plataforma,
  permiso,
}: RegistrarTokenDispositivoPayload): Promise<void> => {
  const deviceRef = doc(firebaseFirestore, "Usuarios", uid, "devices", token);

  const resolvedPlatform = plataforma ?? (typeof navigator !== "undefined"
    ? navigator.userAgent ?? navigator.platform ?? "web"
    : "web");
  const resolvedPermission = permiso ?? (typeof Notification !== "undefined" ? Notification.permission : null);

  await setDoc(
    deviceRef,
    {
      token,
      plataforma: resolvedPlatform,
      permiso: resolvedPermission,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true },
  );
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

export const guardarResultadosOficiales = async (jornada: number, resultados: Selection[]): Promise<void> => {
  if (resultados.length !== 9) {
    throw new Error("Los resultados oficiales deben incluir 9 marcadores.");
  }

  const resultadosRef = doc(firebaseFirestore, "jornadas", jornada.toString());

  await setDoc(resultadosRef, {
    resultadosOficiales: resultados,
    fechaCierre: serverTimestamp(),
  });
};
