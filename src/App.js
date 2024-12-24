import React, { useState, useEffect } from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import SignUpPage from './pages/signup';
import SignInPage from './pages/signin';
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import Footer from './components/Footer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
//import TripMonitor from './components/TripMonitor';
import OlaTripMonitor from './components/OlaTripMonitor';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const userId = user ? user.uid : null;

  return (
    <Router>
      <div style={{ paddingBottom: '60px' }}>
        <Routes>
          <Route path="/" element={<SignUpPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route
            path="/trip"
            element={
              user ? (
                <OlaTripMonitor userId={userId} />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route
            path="/contacts"
            element={
              user ? (
                <EmergencyContactsPage userId={userId} />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
