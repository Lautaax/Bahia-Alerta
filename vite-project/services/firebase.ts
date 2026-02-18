
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase (Debes reemplazar esto con tus credenciales de Firebase Console)
// Si no tienes una, crea un proyecto en console.firebase.google.com
const firebaseConfig = {
apiKey: "AIzaSyC0KiTEw-qilNdVPfHYg7sTjrvZZlj-4Y8",
  authDomain: "alertsmapbb.firebaseapp.com",
  projectId: "alertsmapbb",
  storageBucket: "alertsmapbb.firebasestorage.app",
  messagingSenderId: "1004775926138",
  appId: "1:1004775926138:web:041a6830a8457ee0378ec3",
  measurementId: "G-C3NDKSWHMG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
