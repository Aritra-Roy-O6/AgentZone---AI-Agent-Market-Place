// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3W_w2-DKQYC-ZX9C1suA6rOL5pE5iAeI",
  authDomain: "moneymentor-cc776.firebaseapp.com",
  projectId: "moneymentor-cc776",
  storageBucket: "moneymentor-cc776.firebasestorage.app",
  messagingSenderId: "89266457316",
  appId: "1:89266457316:web:591772f4cf4df26ef53af1",
  measurementId: "G-EDWMJLX3BX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);