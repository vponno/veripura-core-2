import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA80wb0r7T1eeQyGbJMbtVZukG5uUuaggM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "veripura-connect-live.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "veripura-connect-live",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "veripura-connect-live.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "249189264102",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:249189264102:web:92944fb8c2a2e62824a927"
};

import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
