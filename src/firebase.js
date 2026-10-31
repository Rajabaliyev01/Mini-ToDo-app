import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC5KrOFSlwk8Vj_mfCrAXNwWEzAyiFAd6M",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "todo-3b5b8.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "todo-3b5b8",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "todo-3b5b8.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "991713514302",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:991713514302:web:255db188e9f82edd7a926f",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4PZPY3RRKB"
};

// Firebase'ni ishga tushirish
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};
