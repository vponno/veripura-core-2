import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase Project config or ensure env vars are set
const firebaseConfig = {
    apiKey: "AIzaSyA80wb0r7T1eeQyGbJMbtVZukG5uUuaggM",
    authDomain: "veripura-connect-live.firebaseapp.com",
    projectId: "veripura-connect-live",
    storageBucket: "veripura-connect-live.firebasestorage.app",
    messagingSenderId: "249189264102",
    appId: "1:249189264102:web:92944fb8c2a2e62824a927"
};

import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
