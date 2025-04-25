import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SOSPage = () => {
  const [message, setMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState(['+8830752464']); 

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `Lat: ${position.coords.latitude.toFixed(6)}, Long: ${position.coords.longitude.toFixed(6)}`,
          };
          setCurrentLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleSendAlert = async () => {
    const locationMessage = currentLocation ? `My current location is: ${currentLocation.address}` : '';
    const fullMessage = `${message} ${locationMessage}`;
    try {
      await Promise.all(
        emergencyContacts.map((contact) =>
          axios.post("http://localhost:3001/send-sms", { message: fullMessage, recipient: contact })
        )
      );
      alert("Alert sent to your emergency contacts!");
    } catch (error) {
      console.error("Error sending alert:", error);
      alert("Failed to send alert.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            SOS
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sending Alert</h1>
          <p className="text-gray-500 mt-2">to your emergency contacts</p>
        </div>

        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Add Emergency Message (optional)</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <h2 className="text-xl font-semibold mb-4">Current Location</h2>
          <div className="p-3 bg-slate-50 rounded-md text-sm mb-4">
            {currentLocation ? currentLocation.address : 'Fetching location...'}
          </div>

          <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
          <ul className="list-disc list-inside mb-4">
            {emergencyContacts.map((contact, index) => (
              <li key={index} className="text-gray-700">{contact}</li>
            ))}
          </ul>

          <button
            onClick={handleSendAlert}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
          >
            Send Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default SOSPage;
