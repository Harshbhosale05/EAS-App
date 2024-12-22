import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Add this line
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import SignUpPage from './pages/signup';
import SignInPage from './pages/signin';
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import Footer from './components/Footer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthProvider } from "./AuthContext";


ReactDOM.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("root")
);

function App() {
  const [user, setUser] = useState(null); // State to track the authenticated user

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update the user state when the authentication state changes
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const userId = user ? user.uid : null; // Extract userId if logged in

  return (
    <Router>
      <div style={{ paddingBottom: '60px' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Footer />} />
          <Route path="/home" element={<HomePage />} />


          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* Protected Route */}
          <Route
            path="/contacts"
            element={
              user ? (
                <EmergencyContactsPage userId={userId} />
              ) : (
                <Navigate to="/signin" replace /> // Redirect to Sign-In if not authenticated
              )
            }
          />
        </Routes>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
