import React, { useState, useEffect } from 'react';
import { Bell, Navigation, Shield, UserPlus, Radio, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { getAuth } from 'firebase/auth';

const HomePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email?.split('@')[0] || 'User');
    }
  }, []);

  const handleSOS = () => {
    // Vibrate pattern for emergency (if supported)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    
    navigate('/trip-in-progress', { 
      state: { 
        emergency: true,
        tripData: {
          origin: 'Current Location',
          destination: 'Emergency Services'
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header 
        title={`Hi, ${userName}`} 
        showBackButton={false}
        showLogout={true}
        rightContent={
          <button className="relative p-2 text-gray-500 hover:text-blue-500">
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        }
      />

      <main className="flex-1 p-4 pb-20">
        {/* Emergency SOS Button */}
        <div className="mb-8 flex flex-col items-center justify-center py-6">
          <button
            className="w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                      flex items-center justify-center text-white text-2xl font-bold shadow-lg 
                      transition-transform transform hover:scale-105 active:scale-95"
            onClick={handleSOS}
          >
            SOS
          </button>
          <p className="mt-3 text-gray-600 font-medium">Press for Emergency</p>
        </div>

        {/* Feature Cards */}
        <h2 className="text-lg font-bold mb-3 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center h-28
                      border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/trip')}
          >
            <Navigation className="w-8 h-8 text-blue-500 mb-2" />
            <p className="font-medium">Start Trip</p>
          </div>

          <div
            className="p-4 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center h-28
                      border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contacts')}
          >
            <UserPlus className="w-8 h-8 text-green-500 mb-2" />
            <p className="font-medium">Contacts</p>
          </div>
          
          <div
            className="p-4 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center h-28
                      border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <Users className="w-8 h-8 text-purple-500 mb-2" />
            <p className="font-medium">My Profile</p>
          </div>
          
          <div
            className="p-4 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center h-28
                      border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/safety-settings')}
          >
            <Shield className="w-8 h-8 text-indigo-500 mb-2" />
            <p className="font-medium">Safety Settings</p>
          </div>
        </div>

        {/* Safety Features */}
        <h2 className="text-lg font-bold mb-3 text-gray-800">Safety Features</h2>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Motion Detection</span>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
              Active
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <span className="font-medium">Auto Recording</span>
            </div>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                          ${isRecording 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
