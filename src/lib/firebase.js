import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA9zBNz9R4Y5rVRhPGZoCHqsPC9wRne5uk",
    authDomain: "siminbupjung-blog.firebaseapp.com",
    projectId: "siminbupjung-blog",
    storageBucket: "siminbupjung-blog.firebasestorage.app",
    messagingSenderId: "68915786798",
    appId: "1:68915786798:web:ec7ba2cfab6c5338629bbf",
    measurementId: "G-PYFSV2BN8L"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };
