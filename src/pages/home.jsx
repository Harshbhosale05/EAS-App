import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, MapPin, Bell, Users, Heart } from "lucide-react";
import { useAuth } from "../contexts/authContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Mock data - in a real app, this would come from backend
const recentAlerts = [
  {
    id: 1,
    type: "safe",
    message: "You arrived safely at Coffee Shop",
    time: "10:30 AM",
    date: "Today",
  },
  {
    id: 2,
    type: "info",
    message: "Trip started to Downtown Mall",
    time: "9:15 AM",
    date: "Today",
  },
  {
    id: 3,
    type: "warning",
    message: "You missed a check-in",
    time: "Yesterday",
    date: "5:45 PM",
  },
];

// Mock trusted contacts data
const trustedContacts = [
  { id: 1, name: "Mom", phone: "+1234567890", relationship: "Family" },
  { id: 2, name: "John", phone: "+0987654321", relationship: "Friend" },
];

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user's first name from email or profile if available
    if (user && user.email) {
      const emailName = user.email.split("@")[0];
      // Capitalize first letter
      setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }
  }, [user]);

  const handleStartTrip = () => {
    navigate("/trip");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Sahyatri" showBackButton={false} />

      <main className="flex-1 max-w-4xl mx-auto p-6 w-full">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Welcome to Sahyatri, {userName}</h1>
              <p className="opacity-90 mb-4">Your trusted safety companion is active and monitoring.</p>
              
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm inline-block">
                <div className="flex items-center">
                  <Shield className="mr-2 text-green-300" size={20} />
                  <span className="font-medium">Safety Status: <span className="text-green-300">Protected</span></span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/assets/images/security-shield.svg" 
                alt="Security" 
                className="w-24 h-24"
                onError={(e) => {
                  e.target.style.display = 'none';
                }} 
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white/90 text-sm italic">
              "Your safety is our priority. Sahyatri stands guard so you can move with confidence, 
              knowing you're never truly alone on your journey."
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleStartTrip}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
            >
              <MapPin className="text-blue-600 mb-2" size={28} />
              <span className="font-medium text-gray-800">Start Trip</span>
              <span className="text-xs text-gray-500 mt-1">Plan your journey</span>
            </button>
            
            <button 
              onClick={() => navigate("/contacts")}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
            >
              <Users className="text-purple-600 mb-2" size={28} />
              <span className="font-medium text-gray-800">Guardians</span>
              <span className="text-xs text-gray-500 mt-1">Manage contacts</span>
            </button>
            
            <button 
              onClick={() => navigate("/alerts")}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
            >
              <Bell className="text-orange-500 mb-2" size={28} />
              <span className="font-medium text-gray-800">Alerts</span>
              <span className="text-xs text-gray-500 mt-1">View notifications</span>
            </button>
            
            <button 
              onClick={() => navigate("/profile")}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
            >
              <Shield className="text-green-600 mb-2" size={28} />
              <span className="font-medium text-gray-800">Safety Profile</span>
              <span className="text-xs text-gray-500 mt-1">Update settings</span>
            </button>
          </div>
        </section>
        
        {/* Safety Affirmation Card */}
        <section className="mb-8 bg-purple-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-start">
            <Heart className="text-purple-600 mr-3 flex-shrink-0 mt-1" size={22} />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Your Safety Companion</h3>
              <p className="text-gray-600 text-sm">
                Sahyatri is constantly watching over you. Whether you're commuting, traveling to a new location, 
                or out for the evening, we're right here with you. Your safety is our mission, and we're honored 
                to be your trusted companion on every journey.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Real-time tracking</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">SOS alerts</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Guardian notifications</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Safety check-ins</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentAlerts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 flex items-start">
                    <div className={`p-2 rounded-full mr-3 flex-shrink-0 
                      ${alert.type === 'safe' ? 'bg-green-100 text-green-600' : 
                       alert.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                       'bg-blue-100 text-blue-600'}`}
                    >
                      {alert.type === 'safe' ? (
                        <Shield size={18} />
                      ) : alert.type === 'warning' ? (
                        <Bell size={18} />
                      ) : (
                        <MapPin size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{alert.message}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span>{alert.date}</span>
                        <span className="mx-1">•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </section>

        {/* Trusted Contacts */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Guardians</h2>
            <button 
              onClick={() => navigate("/contacts")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Manage
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {trustedContacts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {trustedContacts.map((contact) => (
                  <div key={contact.id} className="p-4 flex items-center">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                      <Users size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{contact.name}</p>
                      <p className="text-gray-500 text-sm">{contact.relationship}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No guardians added yet</p>
                <button
                  onClick={() => navigate("/contacts/add")}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Add Guardian
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage; 