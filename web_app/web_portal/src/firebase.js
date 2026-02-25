import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8gx6JzexoivdbxCrv0AhpTCEhGqIuumA",
  authDomain: "rekap-pad.firebaseapp.com",
  projectId: "rekap-pad",
  storageBucket: "rekap-pad.firebasestorage.app",
  messagingSenderId: "1043512873996",
  appId: "1:1043512873996:web:b4469b951c7314d40f8a29",
  measurementId: "G-SHRDV9S4S3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
