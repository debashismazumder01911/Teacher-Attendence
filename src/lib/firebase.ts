import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAORiYOU_NOqh_637wE-GrLxuWfbWVWB_o",
  authDomain: "inlaid-truck-6jkjx.firebaseapp.com",
  projectId: "inlaid-truck-6jkjx",
  storageBucket: "inlaid-truck-6jkjx.firebasestorage.app",
  messagingSenderId: "137508846970",
  appId: "1:137508846970:web:7576fc54f7e4a957d12ac3"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID
export const db = getFirestore(app, "ai-studio-teacherattendanc-f39c1889-7802-4620-a9fa-20f429bdd4dd");
