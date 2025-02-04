import React, { useState } from 'react';
import { Bell, Navigation, Shield, UserPlus, Radio, MapPin } from 'lucide-react';
import axios from 'axios';

const HomePage = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isRecording, setIsRecording] = useState(false);

  const handleSOS = async () => {
    const message = "Emergency! I need help. My current location is: [link to location]";
    const recipient = "+8830752464"; // Emergency contact number
    try {
      await axios.post("http://localhost:3001/send-sms", { message, recipient });
      alert("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen relative">
      {currentScreen === 'home' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">Safety Guard</h1>
            <Bell className="w-6 h-6" />
          </div>

          <div className="mb-8 text-center">
            <button
              className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg animate-pulse"
              onClick={handleSOS}
            >
              SOS
            </button>
            <p className="mt-2 text-gray-600">Press for Emergency</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="p-4 bg-white shadow-md rounded-lg flex flex-col items-center"
              onClick={() => setCurrentScreen('trip')}
            >
              <Navigation className="w-8 h-8 text-blue-500 mb-2" />
              <p>Start Trip</p>
            </div>

            <div
              className="p-4 bg-white shadow-md rounded-lg flex flex-col items-center"
              onClick={() => setCurrentScreen('contacts')}
            >
              <UserPlus className="w-8 h-8 text-green-500 mb-2" />
              <p>Contacts</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">Safety Features</h2>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>Motion Detection</span>
              </div>
              <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">Active</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500" />
                <span>Auto Recording</span>
              </div>
              <button
                className={`px-3 py-1 ${isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} rounded-full text-sm`}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add other screens if needed */}
    </div>
  );
};

export default HomePage;
