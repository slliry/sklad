import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDW4jP9DLDyh8qSYN_PIzzdH5SuAp-CEG0",
  authDomain: "luxsclad.firebaseapp.com",
  projectId: "luxsclad",
  storageBucket: "luxsclad.firebasestorage.app",
  messagingSenderId: "75642006425",
  appId: "1:75642006425:web:095cc56d8e5f1ebbea8108",
  measurementId: "G-VJEC8DW9SY"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Инициализируем Auth
const auth = getAuth(app);

// Устанавливаем персистентность в памяти для React Native
setPersistence(auth, inMemoryPersistence)
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Инициализируем Firestore
const firestore = getFirestore(app);

export { auth, firestore };
export default app;