import React, { useState, useEffect } from 'react';
import { Shield, Bell, Volume2, MapPin, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserProfileAndSettings, saveSafetySettings, getDefaultSafetySettings } from '../utils/userSettings';

const SafetySettingsPage = ({ userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [safetySettings, setSafetySettings] = useState(getDefaultSafetySettings());

  useEffect(() => {
    const fetchSafetySettings = async () => {
      if (!userId) {
        setError('User not authenticated. Please sign in to view settings.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const userData = await getUserProfileAndSettings(userId);
        
        if (userData.error && userData.error !== "User data not found") {
          setError(userData.error || 'Failed to load safety settings. Please try again.');
        } else {
          // Clear any previous errors
          setError('');
        }
        
        // Set safety settings
        if (userData.safetySettings && Object.keys(userData.safetySettings).length > 0) {
          setSafetySettings(prev => ({
            ...prev,
            ...userData.safetySettings
          }));
        }
        
        console.log("Loaded safety settings:", userData.safetySettings);
      } catch (err) {
        console.error("Error in safety settings loading process:", err);
        setError('Failed to load safety settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSafetySettings();
  }, [userId]);
  
  const handleSettingChange = (name, value) => {
    setSafetySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDistressKeywordsChange = (e) => {
    const keywordsString = e.target.value;
    const keywordsArray = keywordsString.split(',').map(word => word.trim()).filter(word => word);
    handleSettingChange('distressKeywords', keywordsArray);
  };
  
  const saveSettings = async () => {
    if (!userId) {
      setError('You need to be signed in to save settings.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await saveSafetySettings(userId, safetySettings);
      
      if (result.success) {
        setSuccessMessage('Safety settings updated successfully!');
        setError('');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error("Error saving safety settings:", err);
      setError(`Failed to save settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const renderSlider = (name, value, min, max, step, unit = "") => (
    <div className="flex items-center mt-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleSettingChange(name, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <span className="ml-2 text-sm text-gray-700">{value}{unit}</span>
    </div>
  );
  
  const renderToggle = (name, value, label, icon) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        {icon}
        <span className="text-sm text-gray-700 ml-2">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer"
          checked={value}
          onChange={() => handleSettingChange(name, !value)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Safety Settings</h1>
        <p className="text-gray-500">Configure your safety preferences and alert options</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 border border-red-500 bg-red-50 rounded text-red-500">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 border border-green-500 bg-green-50 rounded text-green-500">
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Emergency Alert Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="text-red-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Emergency Alert Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Message
                </label>
                <textarea
                  value={safetySettings.emergencyMessageText}
                  onChange={(e) => handleSettingChange('emergencyMessageText', e.target.value)}
                  className="w-full border rounded px-3 py-2 h-24"
                  placeholder="This message will be sent to your emergency contacts"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SOS Button Press Delay (seconds)
                </label>
                {renderSlider('sosButtonPressDelay', safetySettings.sosButtonPressDelay, 1, 5, 0.5, "s")}
                <p className="text-xs text-gray-500 mt-1">
                  How long you need to hold the SOS button to activate emergency mode
                </p>
              </div>
              
              {renderToggle(
                'autoAlertEmergencyContacts', 
                safetySettings.autoAlertEmergencyContacts, 
                "Auto-alert Emergency Contacts", 
                <Bell className="text-gray-500" size={16} />
              )}
            </div>
          </div>
          
          {/* Monitoring Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="text-orange-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Monitoring Settings</h2>
            </div>
            
            <div className="space-y-4">
              {renderToggle(
                'motionDetectionEnabled', 
                safetySettings.motionDetectionEnabled, 
                "Motion Detection", 
                <Shield className="text-gray-500" size={16} />
              )}
              
              {renderToggle(
                'voiceDetectionEnabled', 
                safetySettings.voiceDetectionEnabled, 
                "Voice Command Detection", 
                <Volume2 className="text-gray-500" size={16} />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distress Keywords
                </label>
                <input
                  type="text"
                  value={safetySettings.distressKeywords.join(', ')}
                  onChange={handleDistressKeywordsChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Separate with commas (e.g. help, emergency)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When these words are detected in your voice, the app may trigger safety protocols
                </p>
              </div>
            </div>
          </div>
          
          {/* Trip Monitoring Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPin className="text-blue-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Trip Monitoring</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Safety Check Interval (minutes)
                </label>
                {renderSlider('defaultSafetyCheckInterval', safetySettings.defaultSafetyCheckInterval, 5, 60, 5, "min")}
                <p className="text-xs text-gray-500 mt-1">
                  How often the app will check if you're safe during a monitored trip
                </p>
              </div>
              
              {renderToggle(
                'routeDeviationAlerts', 
                safetySettings.routeDeviationAlerts, 
                "Route Deviation Alerts", 
                <MapPin className="text-gray-500" size={16} />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ETA Buffer (minutes)
                </label>
                {renderSlider('estimatedArrivalTimeBuffer', safetySettings.estimatedArrivalTimeBuffer, 5, 30, 5, "min")}
                <p className="text-xs text-gray-500 mt-1">
                  How much extra time is allowed before alerting contacts that you're late
                </p>
              </div>
            </div>
          </div>
          
          {/* Privacy & Recording Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="text-green-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Privacy & Recording</h2>
            </div>
            
            <div className="space-y-4">
              {renderToggle(
                'shareLocationWithContacts', 
                safetySettings.shareLocationWithContacts, 
                "Share Location with Emergency Contacts", 
                <MapPin className="text-gray-500" size={16} />
              )}
              
              {renderToggle(
                'autoRecordAudio', 
                safetySettings.autoRecordAudio, 
                "Auto-Record Audio During Emergency", 
                <Volume2 className="text-gray-500" size={16} />
              )}
              
              {renderToggle(
                'autoRecordVideo', 
                safetySettings.autoRecordVideo, 
                "Auto-Record Video During Emergency", 
                <Volume2 className="text-gray-500" size={16} />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Recording Duration (seconds)
                </label>
                {renderSlider('recordingDuration', safetySettings.recordingDuration, 30, 300, 30, "s")}
              </div>
            </div>
          </div>
          
          {/* Fake Call Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="text-purple-500 mr-2" size={20} />
              <h2 className="text-xl font-semibold">Fake Call Settings</h2>
            </div>
            
            <div className="space-y-4">
              {renderToggle(
                'fakeCallEnabled', 
                safetySettings.fakeCallEnabled, 
                "Enable Fake Calls Feature", 
                <Bell className="text-gray-500" size={16} />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Caller Name
                </label>
                <input
                  type="text"
                  value={safetySettings.defaultCallerName}
                  onChange={(e) => handleSettingChange('defaultCallerName', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fake Call Volume
                </label>
                {renderSlider('fakeCallVolume', safetySettings.fakeCallVolume, 0, 100, 5, "%")}
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
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetySettingsPage; 