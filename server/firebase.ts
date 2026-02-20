import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgPu2vu1QeH76l7CLuJXQxzpsmuOfGjpM",
  authDomain: "boss-bot-b3858.firebaseapp.com",
  projectId: "boss-bot-b3858",
  storageBucket: "boss-bot-b3858.firebasestorage.app",
  appId: "1:626207302410:web:9599d4fafe9937d0e990f3",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);