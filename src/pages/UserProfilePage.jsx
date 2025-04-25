import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Settings, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserProfileAndSettings, saveUserProfile, getDefaultUserProfile } from '../utils/userSettings';

const UserProfilePage = ({ userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userProfile, setUserProfile] = useState(getDefaultUserProfile());
  const [safetyPreferences, setSafetyPreferences] = useState({
    motionDetection: true,
    autoRecording: false,
    safetyCheckInterval: 15, // in minutes
    autoAlertContacts: true,
    shareLocationWithContacts: true,
    distressKeyword: 'help',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError('User not authenticated. Please sign in to view profile.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const userData = await getUserProfileAndSettings(userId);
        
        if (userData.error && userData.error !== "User data not found") {
          setError(userData.error || 'Failed to load profile information. Please try again.');
        } else {
          // Clear any previous errors
          setError('');
        }

        // Set profile data
        if (userData.profile && Object.keys(userData.profile).length > 0) {
          setUserProfile(prev => ({
            ...prev,
            ...userData.profile
          }));
        }
        
        // Set safety preferences
        if (userData.safetyPreferences && Object.keys(userData.safetyPreferences).length > 0) {
          setSafetyPreferences(prev => ({
            ...prev,
            ...userData.safetyPreferences
          }));
        }
        
        console.log("Loaded user profile data:", userData);
      } catch (err) {
        console.error("Error in profile loading process:", err);
        setError('Failed to load profile information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSafetyPrefChange = (name, value) => {
    setSafetyPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveProfile = async () => {
    if (!userId) {
      setError('You need to be signed in to save your profile.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await saveUserProfile(userId, userProfile, safetyPreferences);
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setError('');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error("Error saving user profile:", err);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const renderSlider = (name, value, min, max, step) => (
    <div className="flex items-center mt-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleSafetyPrefChange(name, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <span className="ml-2 text-sm text-gray-700">{value} min</span>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-gray-500">Manage your personal information and safety preferences</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 border border-red-500 bg-red-50 rounded text-red-500">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 border border-green-500 bg-green-50 rounded text-green-600">
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="text-blue-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={userProfile.displayName}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={userProfile.phoneNumber}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={userProfile.address}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>
          
          {/* Medical Information Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="text-red-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Medical Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select
                  name="bloodType"
                  value={userProfile.bloodType}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={userProfile.allergies}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Separate with commas"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Information (visible to emergency responders)
                </label>
                <textarea
                  name="medicalInfo"
                  value={userProfile.medicalInfo}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2 h-24"
                  placeholder="Include any relevant medical conditions, medications, etc."
                />
              </div>
            </div>
          </div>
          
          {/* Emergency Settings Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="text-green-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Emergency Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Emergency Message
                </label>
                <textarea
                  name="emergencyMessage"
                  value={userProfile.emergencyMessage}
                  onChange={handleProfileChange}
                  className="w-full border rounded px-3 py-2 h-24"
                  placeholder="This message will be sent to your emergency contacts"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distress Keyword (triggers emergency when spoken)
                </label>
                <input
                  type="text"
                  name="distressKeyword"
                  value={safetyPreferences.distressKeyword}
                  onChange={(e) => handleSafetyPrefChange('distressKeyword', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Safety Check Interval
                </label>
                {renderSlider('safetyCheckInterval', safetyPreferences.safetyCheckInterval, 5, 60, 5)}
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Bell className="text-gray-500 mr-2" size={16} />
                  <span className="text-sm text-gray-700">Auto-alert Emergency Contacts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={safetyPreferences.autoAlertContacts}
                    onChange={() => handleSafetyPrefChange('autoAlertContacts', !safetyPreferences.autoAlertContacts)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <User className="text-gray-500 mr-2" size={16} />
                  <span className="text-sm text-gray-700">Share Location with Contacts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={safetyPreferences.shareLocationWithContacts}
                    onChange={() => handleSafetyPrefChange('shareLocationWithContacts', !safetyPreferences.shareLocationWithContacts)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Settings className="text-gray-500 mr-2" size={16} />
                  <span className="text-sm text-gray-700">Motion Detection</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={safetyPreferences.motionDetection}
                    onChange={() => handleSafetyPrefChange('motionDetection', !safetyPreferences.motionDetection)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Settings className="text-gray-500 mr-2" size={16} />
                  <span className="text-sm text-gray-700">Auto Recording During Emergency</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={safetyPreferences.autoRecording}
                    onChange={() => handleSafetyPrefChange('autoRecording', !safetyPreferences.autoRecording)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => navigate('/home')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={saveProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage; 