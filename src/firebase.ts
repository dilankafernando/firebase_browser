import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyB-YkQPdjlPLysFgNk7NbT6r4EK7OdIZO4",
  authDomain: "lionmenu-7bd79.firebaseapp.com",
  projectId: "lionmenu-7bd79",
  storageBucket: "lionmenu-7bd79.appspot.com",
  messagingSenderId: "984918116721",
  appId: "1:984918116721:web:1acd535878d72337e84ed0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db }; 