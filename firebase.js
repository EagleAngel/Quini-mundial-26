import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCNacKTUsTEFyIuxS9Fky-yKzx5vjoyxs",
  authDomain: "quini-fam.firebaseapp.com",
  projectId: "quini-fam",
  storageBucket: "quini-fam.firebasestorage.app",
  messagingSenderId: "487568062317",
  appId: "1:487568062317:web:8d1c4a0ebf008d4da34c64",
  measurementId: "G-MQ6ENRH14B"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

window.db = db;
window.firestoreCollection = collection;
window.firestoreGetDocs = getDocs;
window.firestoreAddDoc = addDoc;
window.firestoreOnSnapshot = onSnapshot;

console.log("Firebase conectado");
