// js/config.js
// Inicialização do Firebase — exporta app, auth e db para o resto do sistema.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoqc8NcgLAQqclCFY-q_PcxATIE0FqU_E",
  authDomain: "starcord-ee336.firebaseapp.com",
  projectId: "starcord-ee336",
  storageBucket: "starcord-ee336.firebasestorage.app",
  messagingSenderId: "166227286926",
  appId: "1:166227286926:web:8cafd28b2eda5fbaf0e2df",
  measurementId: "G-E06X0P832W"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
