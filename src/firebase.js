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
import { getAnalytics } from "firebase/analytics";
import { getAuth, browserLocalPersistence } from "firebase/auth";

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
const analytics = getAnalytics(app);

// Set authentication persistence
const auth = getAuth(app);
auth.setPersistence(browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

// Export the app and auth objects for use in other files
export { app, auth };
