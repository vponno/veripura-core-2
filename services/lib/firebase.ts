import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "veripura-f92a5.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "veripura-f92a5",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "veripura-f92a5-uploads",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "487093021373",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:487093021373:web:14c39cc3a58196621da5d4",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-QY4T240SHL"
};

import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
