import React, { useState, useEffect } from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import SignUpPage from './pages/signup';
import SignInPage from './pages/signin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import UserProfilePage from './pages/UserProfilePage';
import SafetySettingsPage from './pages/SafetySettingsPage';
import GuardianDashboard from './pages/GuardianDashboard';
import Footer from './components/Footer';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import TripMonitor from './components/TripMonitor';
import TripInProgress from './components/TripInProgress';

// Protected route component to ensure authentication
const ProtectedRoute = ({ children }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();

  if (!user) {
    // Redirect to signin page, but save the intended destination
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

// Guardian-only route component
const GuardianRoute = ({ children }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();
  const isGuardian = localStorage.getItem('guardianMode') === 'true';

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!isGuardian) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isGuardian, setIsGuardian] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Authentication listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Check if user is in guardian mode
      const guardianMode = localStorage.getItem('guardianMode') === 'true';
      setIsGuardian(guardianMode);
      setInitialLoad(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for changes to guardian mode
  useEffect(() => {
    const handleStorageChange = () => {
      const guardianMode = localStorage.getItem('guardianMode') === 'true';
      setIsGuardian(guardianMode);
    };
    
    // Add event listener for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // For debugging
  useEffect(() => {
    console.log("Authentication state:", { user: user?.uid, isGuardian, hasWardId: !!localStorage.getItem('wardUserId') });
  }, [user, isGuardian]);

  const userId = user ? user.uid : null;

  // If still loading, show nothing or a loader
  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      {/* Full-width web application layout */}
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className={`flex-1 ${user ? 'pb-16' : ''}`}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={user ? <Navigate to="/home" /> : <Navigate to="/signin" />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Firebase Auth action handling */}
            <Route path="/__/auth/action" element={<AuthActionHandler />} />
            
            {/* Protected routes for regular users */}
            <Route path="/home" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/trip" element={
              <ProtectedRoute>
                <TripMonitor userId={userId} />
              </ProtectedRoute>
            } />
            <Route path="/trip-in-progress" element={
              <ProtectedRoute>
                <TripInProgress userId={userId} />
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <EmergencyContactsPage userId={userId} />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfilePage userId={userId} />
              </ProtectedRoute>
            } />
            <Route path="/safety-settings" element={
              <ProtectedRoute>
                <SafetySettingsPage userId={userId} />
              </ProtectedRoute>
            } />
            
            {/* Guardian-only routes */}
            <Route path="/guardian-dashboard" element={
              <GuardianRoute>
                <GuardianDashboard />
              </GuardianRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {user && <Footer />}
        </div>
      </div>
    </Router>
  );
}

// Component to handle Firebase Auth actions from email links
const AuthActionHandler = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');
  
  // Redirect to the appropriate page based on action type
  if (mode === 'resetPassword') {
    return <Navigate to={`/reset-password${location.search}`} replace />;
  } else if (mode === 'verifyEmail') {
    return <Navigate to={`/verify-email${location.search}`} replace />;
  } else {
    // Unknown action, redirect to home
    return <Navigate to="/" replace />;
  }
};

export default App;
