import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { 
  Lock, 
  Mail, 
  Shield, 
  ArrowRight, 
  AlignJustify 
} from 'lucide-react';
import { getFirestore, getDocs, collection, doc, getDoc } from "firebase/firestore";
import Header from "../components/Header";

// Custom Google icon component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 0, 0)">
      <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="#4285F4"/>
    </g>
  </svg>
);

const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGuardianMode, setIsGuardianMode] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Check if user is trying to switch modes
  useEffect(() => {
    // Check for switch to user mode
    const switchToUserMode = sessionStorage.getItem('switchToUserMode') === 'true';
    
    // Check for switch to guardian mode
    const switchToGuardianMode = sessionStorage.getItem('switchToGuardianMode') === 'true';
    
    if (switchToUserMode || switchToGuardianMode) {
      setIsSwitchingMode(true);
      setIsGuardianMode(switchToGuardianMode);
      
      // Clear the session storage flags
      sessionStorage.removeItem('switchToUserMode');
      sessionStorage.removeItem('switchToGuardianMode');
      
      // Sign out current user to force re-authentication
      const auth = getAuth();
      signOut(auth).then(() => {
        console.log("Signed out for mode switching");
      }).catch((error) => {
        console.error("Error signing out:", error);
      });
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const auth = getAuth();
      
      // Set persistence based on remember me option
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;
      
      console.log("User authenticated:", { userId, isGuardianMode });
      
      // Check if user is signing in as a guardian
      if (isGuardianMode) {
        // Set guardian mode in localStorage
        localStorage.setItem('guardianMode', 'true');
        localStorage.setItem('wardUserId', userId);
        
        console.log("Guardian mode enabled, navigating to dashboard");
        
        // Force a reload to ensure all components pick up the localStorage changes
        window.location.href = '/guardian-dashboard';
      } else {
        // Regular user login - clear any guardian mode data
        localStorage.removeItem('guardianMode');
        localStorage.removeItem('wardUserId');
        
        console.log("Regular mode, navigating to home");
        
        // Navigate to home page
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const auth = getAuth();
      
      // Set persistence based on remember me option
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const provider = new GoogleAuthProvider();
      // The OAuth 2.0 client ID is set in the Firebase console
      // We don't need to specify it here as it's configured in the Firebase project
      
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userId = user.uid;
      
      console.log("User authenticated with Google:", { userId, isGuardianMode });
      
      // Check if user is signing in as a guardian
      if (isGuardianMode) {
        // Set guardian mode in localStorage
        localStorage.setItem('guardianMode', 'true');
        localStorage.setItem('wardUserId', userId);
        
        console.log("Guardian mode enabled, navigating to dashboard");
        
        // Force a reload to ensure all components pick up the localStorage changes
        window.location.href = '/guardian-dashboard';
      } else {
        // Regular user login - clear any guardian mode data
        localStorage.removeItem('guardianMode');
        localStorage.removeItem('wardUserId');
        
        console.log("Regular mode, navigating to home");
        
        // Navigate to home page
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Sign In" 
        showBackButton={false}
        showLogout={false}
      />
      
      <main className="max-w-4xl mx-auto p-6 flex flex-col">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back to AlertMate</h1>
          <p className="text-gray-600">Your trusted companion, always by your side</p>
          
          <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100 mx-auto max-w-xl">
            <p className="text-blue-700 italic">
              "With Sahyatri, you're never alone on your journey. 
              We're here to ensure your safety, every step of the way."
            </p>
          </div>
          
          {isSwitchingMode && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 font-medium">
              {isGuardianMode ? 
                "Please re-authenticate to switch to Guardian Mode" : 
                "Please re-authenticate to switch to User Mode"}
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 flex items-start">
            <Lock size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-sm">
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  id="guardian-mode" 
                  checked={isGuardianMode}
                  onChange={(e) => setIsGuardianMode(e.target.checked)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  htmlFor="guardian-mode" 
                  className={`block overflow-hidden h-5 rounded-full cursor-pointer ${isGuardianMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                ></label>
              </div>
              <div className="flex items-center">
                <Shield size={18} className={`mr-2 ${isGuardianMode ? 'text-indigo-600' : 'text-gray-500'}`} />
                <label htmlFor="guardian-mode" className="text-sm text-gray-700 cursor-pointer">
                  Sign in as Guardian
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white shadow-sm flex items-center justify-center
                        ${isGuardianMode 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></span>
              ) : (
                <ArrowRight size={18} className="mr-2" />
              )}
              {isGuardianMode ? 'Sign In as Guardian' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="w-full border-t border-gray-300"></div>
            <div className="px-3 text-sm text-gray-500">Or continue with</div>
            <div className="w-full border-t border-gray-300"></div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50"
            >
              <GoogleIcon />
              <span className="ml-2">Sign in with Google</span>
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:text-blue-800">
              Sign Up
            </Link>
          </p>
          <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
            Sahyatri is committed to your safety. We continuously monitor and protect you,
            so you can focus on living life to the fullest.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;
