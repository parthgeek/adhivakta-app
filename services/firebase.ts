import { initializeApp } from "firebase/app";
import {
    getAuth,
    initializeAuth,
    GoogleAuthProvider,
    // @ts-ignore - getReactNativePersistence exists in firebase/auth
    getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyAEtH9iOjf_KcRIY4iPMmqQBe3p48Ffxqg",
    authDomain: "adhivakta-f584f.firebaseapp.com",
    projectId: "adhivakta-f584f",
    storageBucket: "adhivakta-f584f.appspot.com",
    messagingSenderId: "915129812927",
    appId: "1:915129812927:web:7d47f3544408afbbbe030a",
    measurementId: "G-SCLBXLE5XX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
