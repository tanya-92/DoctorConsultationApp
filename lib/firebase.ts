// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzYZcbor1y0EkTf7K5L_gpp7JetXGwSRs",
  authDomain: "doctor-consultation-68afa.firebaseapp.com",
  projectId: "doctor-consultation-68afa",
  storageBucket: "doctor-consultation-68afa.firebasestorage.app",
  messagingSenderId: "309729635495",
  appId: "1:309729635495:web:21a13444a6208a5d8dff82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
