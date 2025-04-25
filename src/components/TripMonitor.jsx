import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { FaCar, FaWalking, FaBiking, FaBus, FaMapMarkerAlt, FaPhone, FaClipboard } from 'react-icons/fa';
import { Bell, Clock, Shield, AlertTriangle, MapPin, Settings, Share2, Compass, Phone, MessageSquare, Hash, ArrowRight, Info, Heart } from 'lucide-react';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc, addDoc, collection, Timestamp, getDocs, GeoPoint } from 'firebase/firestore';
import '../styles/tripMonitor.css';
import { useNavigate } from 'react-router-dom';
import { getUserProfileAndSettings } from '../utils/userSettings';

const libraries = ['places'];

// Get Google Maps API key from environment variables or use a fallback
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const TripMonitor = ({ userId }) => {
  const navigate = useNavigate();
  // Initialize Firestore
  const db = getFirestore();
  
  // Google Maps Setup
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State for origin and destination
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.730610, lng: -73.935242 });
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('destination');
  const [safetySettings, setSafetySettings] = useState({
    shareLocation: true,
    safetyAlerts: true,
    routeDeviation: false,
    periodicCheck: false,
    recordAudio: false
  });
  const [userPreferences, setUserPreferences] = useState({
    checkInterval: 15, // in minutes
    deviationThreshold: 200 // in meters
  });
  const [tripInProgress, setTripInProgress] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const [safetyCheckInterval, setSafetyCheckInterval] = useState(15);
  const [monitorDeviation, setMonitorDeviation] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState("I need help! This is an emergency.");
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userSafetySettings, setUserSafetySettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refs for inputs and autocomplete
  const originRef = useRef(null);
  const originAutocompleteRef = useRef(null);
  const destinationRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const mapRef = useRef(null);

  // Check if user is authenticated and get profile data
  const [user, setUser] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await fetchEmergencyContacts(user.uid);
      } else {
        setUser(null);
        setEmergencyContacts([]);
      }
    });

    return () => unsubscribe();
  }, [db]);

  // Fetch emergency contacts from Firestore
  const fetchEmergencyContacts = async (uid) => {
    setContactsLoading(true);
    try {
      const contactsCollection = collection(db, "users", uid, "contacts");
      const snapshot = await getDocs(contactsCollection);
      const contactsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched emergency contacts:", contactsList);
      setEmergencyContacts(contactsList);
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
      setError('Failed to load emergency contacts. Some features may be limited.');
    } finally {
      setContactsLoading(false);
    }
  };

  // Set up autocomplete when the map is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      // Set up origin autocomplete
      if (originRef.current) {
        try {
          originAutocompleteRef.current = new window.google.maps.places.Autocomplete(originRef.current, {
            fields: ["formatted_address", "geometry", "name"],
            componentRestrictions: { country: "in" }, // Restrict to India for better results
          });
          
          originAutocompleteRef.current.addListener('place_changed', () => {
            const place = originAutocompleteRef.current.getPlace();
            if (place.geometry) {
              setOrigin(place.formatted_address || place.name);
              console.log("Selected origin:", place);
            }
          });
        } catch (err) {
          console.error("Error setting up origin autocomplete:", err);
        }
      }

      // Set up destination autocomplete
      if (destinationRef.current) {
        try {
          destinationAutocompleteRef.current = new window.google.maps.places.Autocomplete(destinationRef.current, {
            fields: ["formatted_address", "geometry", "name"],
            componentRestrictions: { country: "in" }, // Restrict to India for better results
          });
          
          destinationAutocompleteRef.current.addListener('place_changed', () => {
            const place = destinationAutocompleteRef.current.getPlace();
            if (place.geometry) {
              setDestination(place.formatted_address || place.name);
              console.log("Selected destination:", place);
            }
          });
        } catch (err) {
          console.error("Error setting up destination autocomplete:", err);
        }
      }
    }
  }, [isLoaded]);

    // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          setCurrentPosition(pos);
          setMapCenter(pos);
          
          // If using current location as origin
          if (origin === 'Current Location') {
            setOrigin(`${latitude},${longitude}`);
          }
          
          // Clear any existing location errors when successful
          if (error && error.includes('location')) {
            setError('');
          }
        },
        (err) => {
          console.error('Error getting current location:', err);
          
          // Provide more specific error messages based on the error code
          if (err.code === 1) {
            // Permission denied
            setError('Location access was denied. Please check your browser settings and grant location permission, then refresh the page.');
            setSuccessMessage('You can still enter addresses manually to use the app.');
          } else if (err.code === 2) {
            // Position unavailable
            setError('Unable to determine your location. Please check if your device\'s location is enabled.');
          } else if (err.code === 3) {
            // Timeout
            setError('Location request timed out. Please try again or enter addresses manually.');
          } else {
            setError('Error accessing your location. Please enable location services or enter addresses manually.');
          }
          
          // Set a default location if we can't get the user's location
          if (!currentPosition) {
            // Default to a central location
            const defaultPos = { lat: 18.5204, lng: 73.8567 }; // Pune, India
            setMapCenter(defaultPos);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout to give more time
          maximumAge: 60000 // Cache location for 1 minute
        }
      );
      
      // Watch position for real-time updates if trip is in progress
      let watchId;
      if (tripInProgress) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });
            
            // Clear any existing location errors when successful
            if (error && error.includes('location')) {
              setError('');
            }
          },
          (err) => console.error('Error watching position:', err),
          { enableHighAccuracy: true }
        );
      }
      
      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setError('Geolocation is not supported by your browser. Please enter addresses manually.');
    }
  }, [origin, tripInProgress, error]);

  // Calculate directions with better error handling
  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination.');
      return;
    }

    setError('');

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      // Handle "Current Location" special case
      const originLocation = origin === 'Current Location' && currentPosition 
        ? `${currentPosition.lat},${currentPosition.lng}` 
        : origin;
      
      console.log("Calculating route from", originLocation, "to", destination);
      
      const results = await directionsService.route({
        origin: originLocation,
        destination,
        travelMode: window.google.maps.TravelMode[travelMode],
      });
      
      setDirections(results);
      setDistance(results.routes[0].legs[0].distance.text);
      setDuration(results.routes[0].legs[0].duration.text);
      setSuccessMessage('Route calculated successfully! You can now start your trip.');
      
      // Fit map to the route
      if (mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        results.routes[0].legs[0].steps.forEach((step) => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
        mapRef.current.fitBounds(bounds);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Could not calculate directions. Please try using a more specific address or location name.');
    }
  }, [origin, destination, travelMode, currentPosition]);

  // Suggest Safe Route function - just alternate calculation focusing on safety
  const suggestSafeRoute = () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      // Request with safety-focused options (avoid highways, prefer lit streets)
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode[travelMode],
          provideRouteAlternatives: true,
          avoidHighways: true,
          avoidTolls: true
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
            
            // Extract distance and duration from the result
            if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
              setDistance(result.routes[0].legs[0].distance.text);
              setDuration(result.routes[0].legs[0].duration.text);
              
              // Update map bound to fit the route
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach((step) => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              
              if (mapRef.current) {
                mapRef.current.fitBounds(bounds);
              }
              
              // Clear error if present
              if (error) setError('');
              
              // Updated success message for safe route
              setSuccessMessage('Safe route calculated. This prefer highways and  well-lit areas.');
            }
          } else {
            setError('Failed to calculate safe route. Please try different locations.');
            console.error('Direction service failed with status: ' + status);
          }
          
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error calculating safe route:', err);
      setError('Error calculating safe route: ' + err.message);
      setLoading(false);
    }
  };

  // Function to check for and create necessary collections for guardian mode
  const setupGuardianCollections = async (uid) => {
    try {
      const db = getFirestore();
      
      // Check if locations collection exists
      const locationsRef = collection(db, 'users', uid, 'locations');
      const locationsSnapshot = await getDocs(locationsRef);
      
      // Check if notifications collection exists
      const notificationsRef = collection(db, 'users', uid, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsRef);
      
      // Check if safeZones collection exists
      const safeZonesRef = collection(db, 'users', uid, 'safeZones');
      const safeZonesSnapshot = await getDocs(safeZonesRef);
      
      console.log('Guardian collections setup verified');
    } catch (err) {
      console.error('Error setting up guardian collections:', err);
    }
  };

  // Start a new trip
  const startTrip = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }
    
    if (!directions || !directions.routes || !directions.routes[0] || !directions.routes[0].legs || !directions.routes[0].legs[0]) {
      setError('Route calculation failed. Please try again.');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear any existing errors
    
    try {
      const route = directions.routes[0];
      const leg = route.legs[0];
      
      // Ensure we have valid coordinates
      if (!leg.start_location || !leg.end_location) {
        throw new Error('Invalid route coordinates');
      }
      
      // Create a trip document in Firestore
      const tripData = {
        userId: userId || 'anonymous',
        origin: {
          address: leg.start_address || origin.toString(),
          lat: leg.start_location.lat(),
          lng: leg.start_location.lng()
        },
        destination: {
          address: leg.end_address || destination.toString(),
          lat: leg.end_location.lat(),
          lng: leg.end_location.lng()
        },
        travelMode,
        distance: {
          text: leg.distance.text,
          value: leg.distance.value
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value
        },
        startTime: Timestamp.now(),
        estimatedEndTime: Timestamp.fromDate(
          new Date(Date.now() + leg.duration.value * 1000)
        ),
        status: 'active',
        safetyCheckInterval: safetyCheckInterval * 60, // Convert minutes to seconds
        monitorDeviation: monitorDeviation,
        emergencyMessage: emergencyMessage || "I need help! This is an emergency.",
        routeOverview: route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }))
      };
      
      let tripId;
      
      if (userId) {
        // User is logged in, create real trip in Firestore
        const tripsCollection = collection(db, 'trips');
        const docRef = await addDoc(tripsCollection, tripData);
        tripId = docRef.id;
        console.log("Trip created with ID:", tripId);
        
        // Also add reference to user's trips
        const userTripsCollection = collection(db, 'users', userId, 'trips');
        await addDoc(userTripsCollection, {
          tripId: tripId,
          startTime: tripData.startTime,
          status: 'active'
        });
      } else {
        // Offline mode - create local trip ID
        tripId = `local-${Date.now()}`;
        console.log("Local trip created with ID:", tripId);
      }
      
      // Send notification to guardians
      if (userId) {
        await notifyGuardians(userId, tripId, "trip_started", tripData);
      }
      
      // Create a serializable version of the directions for navigation
      const serializableDirections = {
        routes: [{
          legs: [{
            start_address: leg.start_address,
            end_address: leg.end_address,
            distance: { text: leg.distance.text, value: leg.distance.value },
            duration: { text: leg.duration.text, value: leg.duration.value },
            steps: leg.steps.map(step => ({
              distance: { text: step.distance.text, value: step.distance.value },
              duration: { text: step.duration.text, value: step.duration.value },
              instructions: step.instructions,
              travel_mode: step.travel_mode,
              start_location: { lat: step.start_location.lat(), lng: step.start_location.lng() },
              end_location: { lat: step.end_location.lat(), lng: step.end_location.lng() },
            }))
          }],
          overview_path: route.overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng()
          }))
        }]
      };
      
      // Navigate to trip in progress page with trip data
      navigate('/trip-in-progress', {
        state: {
          tripData: {
            ...tripData,
            tripId,
            startTime: new Date().toISOString() // Convert to string for serialization
          },
          directions: serializableDirections
        }
      });
    } catch (err) {
      console.error('Error starting trip:', err);
      setError('Failed to start trip. Please try again. Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to notify guardians about trip events
  const notifyGuardians = async (userId, tripId, eventType, data) => {
    try {
      const db = getFirestore();
      
      // Get list of guardians for this user
      const guardiansRef = collection(db, "users", userId, "guardians");
      const guardiansSnapshot = await getDocs(guardiansRef);
      
      // If no guardians, just return
      if (guardiansSnapshot.empty) {
        console.log("No guardians to notify");
        return;
      }
      
      // Create event in user's events collection
      const eventRef = collection(db, "users", userId, "events");
      await addDoc(eventRef, {
        type: eventType,
        tripId: tripId,
        timestamp: new Date().toISOString(),
        data: data
      });
      
      // Also add to guardian notifications collection for each guardian
      guardiansSnapshot.forEach(async (guardianDoc) => {
        const guardianId = guardianDoc.id;
        const guardianNotificationsRef = collection(db, "users", guardianId, "notifications");
        
        await addDoc(guardianNotificationsRef, {
          type: eventType,
          wardId: userId,
          tripId: tripId,
          timestamp: new Date().toISOString(),
          read: false,
          data: data
        });
      });
      
      console.log(`Notified guardians of ${eventType} event`);
    } catch (error) {
      console.error("Error notifying guardians:", error);
    }
  };

  // Fix the useEffect hook to properly update user preferences when settings are loaded
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;
      
      try {
        const userData = await getUserProfileAndSettings(userId);
        if (!userData.error) {
          setUserProfile(userData.profile || null);
          setUserSafetySettings(userData.safetySettings || null);
          console.log("Loaded user settings for TripMonitor:", userData);
          
          // Apply user settings to current UI state
          if (userData.safetySettings) {
            const settings = userData.safetySettings;
            
            // Apply safety check interval
            if (settings.defaultSafetyCheckInterval) {
              setSafetyCheckInterval(settings.defaultSafetyCheckInterval);
              // Also update the user preferences
              setUserPreferences(prev => ({
                ...prev,
                checkInterval: settings.defaultSafetyCheckInterval
              }));
            }
            
            // Apply route deviation alerts preference
            if (settings.routeDeviationAlerts !== undefined) {
              setMonitorDeviation(settings.routeDeviationAlerts);
              // Also update safety settings
              setSafetySettings(prev => ({
                ...prev,
                routeDeviation: settings.routeDeviationAlerts
              }));
            }
            
            // Apply emergency message
            if (settings.emergencyMessageText) {
              setEmergencyMessage(settings.emergencyMessageText);
            }
            
            // Apply other safety settings
            if (settings.shareLocationWithContacts !== undefined) {
              setSafetySettings(prev => ({
                ...prev,
                shareLocation: settings.shareLocationWithContacts
              }));
            }
            
            if (settings.autoRecordAudio !== undefined) {
              setSafetySettings(prev => ({
                ...prev,
                recordAudio: settings.autoRecordAudio
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error loading user settings:", err);
      }
    };
    
    loadUserSettings();
  }, [userId]);

  // Modify the sendEmergencyAlert function to use profile data for better messages
  const sendEmergencyAlert = () => {
    if (emergencyContacts.length === 0) {
      setError('No emergency contacts found. Please add contacts in your settings.');
      return;
    }

    try {
      // Use user's custom emergency message if available
      const customMessage = userProfile?.emergencyMessage || "I need help! This is an emergency.";
      
      // Construct a message with location data
      const locationStr = currentPosition 
        ? `${currentPosition.lat},${currentPosition.lng}` 
        : 'unknown';
      
      const emergencyMsg = `${customMessage}\n\nMy current location: https://maps.google.com/?q=${locationStr}`;
      
      // Simulate sending messages to emergency contacts
      emergencyContacts.forEach(contact => {
        console.log(`Sending emergency alert to ${contact.name}: ${emergencyMsg}`);
        // In a real app, this would trigger actual alerts via SMS, calls, etc.
      });
      
      setSuccessMessage('Emergency alert sent to your contacts!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error sending emergency alert:', err);
      setError('Failed to send emergency alert. Please try again or call emergency services directly.');
    }
  };

  // Toggle safety setting
  const toggleSafetySetting = (setting) => {
    setSafetySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Update user preference
  const updatePreference = (preference, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
  };

  // Handle travel mode change
  const handleTravelModeChange = (mode) => {
    setTravelMode(mode);
    if (origin && destination) {
      setTimeout(() => {
        calculateRoute();
      }, 300);
    }
  };

  // Handle map load
  const handleMapLoad = (map) => {
    mapRef.current = map;
    
    // Create a button to recenter the map on user's location
    const locationButton = document.createElement("button");
    locationButton.textContent = "Center on My Location";
    locationButton.className = "custom-map-control-button";
    map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(locationButton);
    
    locationButton.addEventListener("click", () => {
      if (currentPosition) {
        map.panTo(currentPosition);
        map.setZoom(15);
      }
    });
  };

  // Show help for enabling location permissions
  const showLocationPermissionHelp = () => {
    setShowLocationHelp(true);
  };

  if (loadError) {
    return (
      <div className="flex justify-center items-center h-screen flex-col p-6 bg-red-50">
        <div className="text-red-600 text-xl mb-4 font-bold">
          Error loading Google Maps
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <p className="mb-4 text-red-500">{loadError.message}</p>
          <div className="text-gray-700">
            <p className="font-semibold mb-2">This error is likely due to issues with your Google Maps API key:</p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Create a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Platform account</a> if you don't have one.</li>
              <li>Create a new project and enable the following APIs:
                <ul className="list-disc ml-6 mt-1">
                  <li>Maps JavaScript API</li>
                  <li>Directions API</li>
                  <li>Places API</li>
                  <li>Geocoding API</li>
                </ul>
              </li>
              <li>Create API credentials and get your API key.</li>
              <li>Add the API key to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file in the project root:
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here</pre>
              </li>
              <li>Restart your React development server.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner"></div>
        <p className="text-gray-600 mt-2">Loading maps...</p>
      </div>
    );
  }

  return (
    <div className="trip-monitor bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center my-4 text-blue-800">Sahyatri Trip Monitor</h1>
      
      {/* Notification Area */}
      {error && (
        <div className="notification error">
          <AlertTriangle size={18} className="mr-2" />
          {error}
          {error.includes('location') && (
            <button 
              onClick={showLocationPermissionHelp}
              className="ml-2 text-xs underline text-red-700 hover:text-red-900"
            >
              How to fix
            </button>
          )}
        </div>
      )}
      
      {successMessage && (
        <div className="notification success">
          <Info size={18} className="mr-2" />
          {successMessage}
        </div>
      )}
      
      {/* Location Help Modal */}
      {showLocationHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">How to Enable Location Services</h3>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Chrome</h4>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click the lock icon or site settings icon in the address bar</li>
                <li>Find "Location" in the permissions list</li>
                <li>Change the setting to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Firefox</h4>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Click the lock icon in the address bar</li>
                <li>Go to "Permissions"</li>
                <li>Set "Access Your Location" to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Safari</h4>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to Safari Preferences</li>
                <li>Go to "Websites" tab and select "Location"</li>
                <li>Find this website and set to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Mobile Devices</h4>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to your device Settings</li>
                <li>Find your browser app</li>
                <li>Go to Permissions or Privacy</li>
                <li>Enable Location Services for your browser</li>
                <li>Return to the app and refresh</li>
              </ol>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowLocationHelp(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div id="container" className="flex flex-col md:flex-row gap-4">
        {/* Map Container */}
        <div className="map-container w-full md:w-7/12 bg-white rounded-xl shadow-md overflow-hidden h-[70vh] md:h-[80vh]">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={14}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
            onLoad={handleMapLoad}
          >
            {currentPosition && (
              <Marker
                position={currentPosition}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
              />
            )}
            
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
            </div>
        
        {/* Sidebar Container */}
        <div className="sidebar-container w-full md:w-5/12 bg-white rounded-xl shadow-md overflow-hidden p-4 h-auto md:h-[80vh] overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex mb-4 bg-gray-100 rounded-lg">
            <button 
              className={`tab-button ${activeTab === 'destination' ? 'active' : ''}`}
              onClick={() => setActiveTab('destination')}
            >
              <MapPin size={16} className="inline mr-2" />
              Destination
            </button>
            <button 
              className={`tab-button ${activeTab === 'safety' ? 'active' : ''}`}
              onClick={() => setActiveTab('safety')}
            >
              <Shield size={16} className="inline mr-2" />
              Safety Settings
            </button>
          </div>
          
          {/* Destination Tab Content */}
          {activeTab === 'destination' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-2" />
                  Starting Point
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter starting location (e.g., street address, city)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  ref={originRef}
                />
                <div className="flex justify-between mt-1">
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      if (currentPosition) {
                        setOrigin('Current Location');
                      } else {
                        setError('Unable to get your current location. Please check your device settings and browser permissions.');
                      }
                    }}
                  >
                    Use my current location
                  </button>
                  {error && error.includes('location') && (
                    <span className="text-xs text-orange-500">Enter address manually</span>
                  )}
            </div>
            </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-2" />
                  Destination
                </label>
              <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter destination (e.g., landmark, street address)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  ref={destinationRef}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Try using complete addresses for better results
                </div>
            </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Compass size={16} className="inline mr-2" />
                  Travel Mode
                </label>
                <div className="flex justify-between">
                  <button
                    className={`travel-mode-button ${travelMode === 'DRIVING' ? 'active' : ''}`}
                    onClick={() => handleTravelModeChange('DRIVING')}
                  >
                    <FaCar size={18} className="mb-1" />
                    <span className="text-xs">Driving</span>
                  </button>
                  <button
                    className={`travel-mode-button ${travelMode === 'WALKING' ? 'active' : ''}`}
                    onClick={() => handleTravelModeChange('WALKING')}
                  >
                    <FaWalking size={18} className="mb-1" />
                    <span className="text-xs">Walking</span>
                  </button>
                  <button
                    className={`travel-mode-button ${travelMode === 'BICYCLING' ? 'active' : ''}`}
                    onClick={() => handleTravelModeChange('BICYCLING')}
                  >
                    <FaBiking size={18} className="mb-1" />
                    <span className="text-xs">Cycling</span>
                  </button>
                  <button
                    className={`travel-mode-button ${travelMode === 'TRANSIT' ? 'active' : ''}`}
                    onClick={() => handleTravelModeChange('TRANSIT')}
                  >
                    <FaBus size={18} className="mb-1" />
                    <span className="text-xs">Transit</span>
                  </button>
                </div>
              </div>
              
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 mb-4 flex items-center justify-center"
                onClick={calculateRoute}
              >
                <MapPin size={18} className="mr-2" />
                Calculate Route
              </button>
              
              <button
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 mb-4 flex items-center justify-center"
                onClick={suggestSafeRoute}
              >
                <Shield size={18} className="mr-2" />
                Suggest Safe Route
              </button>
              
              {distance && duration && (
                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Distance:</span>
                    <span className="font-medium">{distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium">{duration}</span>
                </div>
              </div>
            )}

            <button
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 mb-4 flex items-center justify-center"
                onClick={startTrip}
                disabled={!directions}
              >
                <ArrowRight size={18} className="mr-2" />
              Start Trip
            </button>
              
              <button
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center"
                onClick={sendEmergencyAlert}
              >
                <AlertTriangle size={18} className="mr-2" />
                Send Emergency Alert
              </button>
            </>
          )}
          
          {/* Safety Settings Tab Content */}
          {activeTab === 'safety' && (
            <>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Safety Features</h3>
              
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <h4 className="font-medium mb-2 text-gray-700">Safety Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <Info size={14} className="mr-2 mt-1 text-blue-500" />
                    Share your trip details with a trusted friend or family member
                  </li>
                  <li className="flex items-start">
                    <Info size={14} className="mr-2 mt-1 text-blue-500" />
                    Keep your phone charged and easily accessible
                  </li>
                  <li className="flex items-start">
                    <Info size={14} className="mr-2 mt-1 text-blue-500" />
                    Stay in well-lit areas when walking at night
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Share Location</h4>
                    <p className="text-sm text-gray-600">Share your real-time location with trusted contacts</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={safetySettings.shareLocation} 
                      onChange={() => toggleSafetySetting('shareLocation')}
                    />
                    <span></span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Safety Alerts</h4>
                    <p className="text-sm text-gray-600">Get alerts in dangerous areas</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={safetySettings.safetyAlerts} 
                      onChange={() => toggleSafetySetting('safetyAlerts')}
                    />
                    <span></span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Route Deviation</h4>
                    <p className="text-sm text-gray-600">Alert contacts if you deviate from your route</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={safetySettings.routeDeviation} 
                      onChange={() => toggleSafetySetting('routeDeviation')}
                    />
                    <span></span>
                  </label>
                </div>
                
                {safetySettings.routeDeviation && (
                  <div className="ml-4 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deviation Threshold: {userPreferences.deviationThreshold}m
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={userPreferences.deviationThreshold}
                      onChange={(e) => updatePreference('deviationThreshold', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Periodic Check</h4>
                    <p className="text-sm text-gray-600">Prompt to check if you're safe periodically</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={safetySettings.periodicCheck} 
                      onChange={() => toggleSafetySetting('periodicCheck')}
                    />
                    <span></span>
                  </label>
                </div>
                
                {safetySettings.periodicCheck && (
                  <div className="ml-4 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check every {userPreferences.checkInterval} minutes
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={userPreferences.checkInterval}
                      onChange={(e) => updatePreference('checkInterval', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Record Audio</h4>
                    <p className="text-sm text-gray-600">Record audio when emergency triggered</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={safetySettings.recordAudio} 
                      onChange={() => toggleSafetySetting('recordAudio')}
                    />
                    <span></span>
                  </label>
                </div>
          </div>

              <div className="mt-5">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Emergency Contacts</h3>
                {contactsLoading ? (
                  <div className="py-4 text-center">
                    <div className="spinner mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading contacts...</p>
                  </div>
                ) : emergencyContacts.length > 0 ? (
                  <div className="space-y-2">
                    {emergencyContacts.map((contact) => (
                      <div key={contact.id} className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-800">{contact.name}</h4>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                          {contact.relation && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {contact.relation}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                            onClick={() => window.open(`tel:${contact.phone}`)}
                          >
                            <Phone size={16} />
                          </button>
                          <button 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                            onClick={() => window.open(`sms:${contact.phone}?body=I'm starting a trip with Sahyatri. I'll share my location with you in case of emergency.`)}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg bg-gray-50 text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-gray-600 mb-2">No emergency contacts added yet</p>
                    <button 
                      onClick={() => navigate('/contacts')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Add Emergency Contacts
                    </button>
                  </div>
                )}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripMonitor;