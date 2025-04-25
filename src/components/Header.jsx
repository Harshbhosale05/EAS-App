import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

const Header = ({ title, showBackButton = true, showLogout = false, onBack, rightContent }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      
      // Clear guardian mode data
      localStorage.removeItem('guardianMode');
      localStorage.removeItem('wardUserId');
      
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  
  const toggleGuardianMode = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log("User not authenticated, redirecting to sign in");
      window.location.href = "/signin";
      return;
    }
    
    // Check if guardian mode is active
    const isGuardian = localStorage.getItem('guardianMode') === 'true';
    
    if (isGuardian) {
      console.log("Switching from guardian to user mode - redirecting to sign in");
      // Set a flag to indicate we want to switch back to user mode
      sessionStorage.setItem('switchToUserMode', 'true');
      window.location.href = "/signin";
    } else {
      console.log("Switching from user to guardian mode - redirecting to sign in");
      // Set a flag to indicate we want to switch to guardian mode
      sessionStorage.setItem('switchToGuardianMode', 'true');
      window.location.href = "/signin";
    }
  };
  
  // Get user's display name - use email if name not available
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  
  // Get user's profile photo URL or use placeholder
  const profilePhotoUrl = user?.photoURL || null;
  
  // Check if user is in guardian mode
  const isGuardian = localStorage.getItem('guardianMode') === 'true';
  
  return (
    <header className="sticky top-0 bg-white z-10 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={handleBack}
                className="p-1 mr-3 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {rightContent}
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {profilePhotoUrl ? (
                    <img 
                      src={profilePhotoUrl} 
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden md:block">{displayName}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    
                    {/* Guardian Mode Toggle Button */}
                    <button
                      onClick={() => {
                        toggleGuardianMode();
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                    >
                      <Shield size={16} className={`mr-2 ${isGuardian ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <span className={isGuardian ? 'text-indigo-600' : 'text-gray-700'}>
                        {isGuardian ? 'Switch to User Mode' : 'Switch to Guardian Mode'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              showLogout && (
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={20} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 