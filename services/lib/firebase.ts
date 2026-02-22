import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "***REMOVED***",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "veripura-f92a5.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "veripura-f92a5",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "veripura-f92a5.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "487093021373",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:487093021373:web:942fc9bc2944794f1da5d4",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VNV3C394FQ"
};

import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
