import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB4fCVOyxAWBKuKE9VtGsdcq-Ay_gRRThc",
  authDomain: "somos-locales-femx.firebaseapp.com",
  projectId: "somos-locales-femx",
  storageBucket: "somos-locales-femx.firebasestorage.app",
  messagingSenderId: "923976377151",
  appId: "1:923976377151:web:a5e3dc2fc644a53b6ea98a",
  measurementId: "G-VL61R8MT9J",
};

export const firebaseApp = initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;

export const analyticsReady = typeof window !== "undefined"
  ? isSupported()
      .then((supported) => {
        if (!supported) {
          return null;
        }
        analyticsInstance = getAnalytics(firebaseApp);
        return analyticsInstance;
      })
      .catch((error) => {
        console.warn("Firebase Analytics no está disponible en este dispositivo", error);
        return null;
      })
  : Promise.resolve(null);

export const firebaseAnalytics = analyticsInstance;
