// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAlZhuVqar-r2tEPLYnsLq2zUj0zVnegME",
//   authDomain: "eas-fc7fd.firebaseapp.com",
//   projectId: "eas-fc7fd",
//   storageBucket: "eas-fc7fd.appspot.com", // Corrected storage bucket URL
//   messagingSenderId: "485155029957",
//   appId: "1:485155029957:web:90057a7aa9cbea07f601ac",
//   measurementId: "G-QWF5QS6VBM",
//   databaseURL: "https://eas-fc7fd-default-rtdb.firebaseio.com", // Ensure this URL matches your Firebase project
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// // Export the app object for use in other files
// export { app };









// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlZhuVqar-r2tEPLYnsLq2zUj0zVnegME",
  authDomain: "eas-fc7fd.firebaseapp.com",
  projectId: "eas-fc7fd",
  storageBucket: "eas-fc7fd.appspot.com",
  messagingSenderId: "485155029957",
  appId: "1:485155029957:web:90057a7aa9cbea07f601ac",
  measurementId: "G-QWF5QS6VBM",
  databaseURL: "https://eas-fc7fd-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  // Set the client ID for the Google OAuth flow
  client_id: '847114483472-bqpfvlhv7plvebkf8u7vpv5e43hvvhbr.apps.googleusercontent.com',
  // Request user's profile information
  prompt: 'select_account',
  // Request access to user's profile and email
  scope: 'profile email'
});

// Set default authentication persistence
auth.setPersistence(browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

// Export Firebase services for use in other files
export { app, auth, db, googleProvider };
