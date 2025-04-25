import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, Shield, ArrowLeft, Phone, MessageSquare, Info, Heart, UserPlus, CheckCircle, AlertCircle, AlertOctagon } from 'lucide-react';
import { getFirestore, doc, updateDoc, getDoc, Timestamp, collection, getDocs, addDoc } from 'firebase/firestore';
import '../styles/tripMonitor.css';
import { getUserProfileAndSettings } from '../utils/userSettings';
import Header from './Header';

// Fix: 'directions' is not a valid library, it's part of the core API
const libraries = ['places'];

// Get Google Maps API key from environment variables or use a fallback
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const TripInProgress = ({ userId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore();
  
  // Get trip data from location state wrapped in useMemo
  const tripData = React.useMemo(() => location.state?.tripData || {}, [location.state]);
  const directionsData = React.useMemo(() => location.state?.directions || null, [location.state]);
  
  // Extract text values from complex objects to prevent rendering errors
  const originAddress = React.useMemo(() => 
    typeof tripData.origin === 'object' ? tripData.origin?.address || 'Unknown origin' : String(tripData.origin || 'Unknown origin'),
    [tripData.origin]
  );
  
  const destinationAddress = React.useMemo(() => 
    typeof tripData.destination === 'object' ? tripData.destination?.address || 'Unknown destination' : String(tripData.destination || 'Unknown destination'),
    [tripData.destination]
  );
  
  const distanceText = React.useMemo(() => 
    typeof tripData.distance === 'object' ? tripData.distance?.text || 'Calculating...' : String(tripData.distance || 'Calculating...'),
    [tripData.distance]
  );
  
  const durationText = React.useMemo(() => 
    typeof tripData.duration === 'object' ? tripData.duration?.text || 'Calculating...' : String(tripData.duration || 'Calculating...'),
    [tripData.duration]
  );
  
  // Google Maps Setup
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State
  const [directions, setDirections] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [remainingDistance, setRemainingDistance] = useState(distanceText);
  const [remainingTime, setRemainingTime] = useState(durationText);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('Trip in progress. Stay safe!');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [tripStatus, setTripStatus] = useState('active');
  const [safetyCheckCounter, setSafetyCheckCounter] = useState(15 * 60); // 15 minutes in seconds
  const [isDeviating, setIsDeviating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userSafetySettings, setUserSafetySettings] = useState(null);
  const [customSafetyCheckInterval, setCustomSafetyCheckInterval] = useState(15 * 60); // Default 15 minutes in seconds
  const [previousDistance, setPreviousDistance] = useState(null);
  const [deviationThreshold, setDeviationThreshold] = useState(200); // meters
  const [distanceIncreaseThreshold, setDistanceIncreaseThreshold] = useState(1000); // meters (1km)
  const [lastLocationUpdate, setLastLocationUpdate] = useState(Date.now());
  const [lastPosition, setLastPosition] = useState(null);
  const [stagnationThreshold, setStagnationThreshold] = useState(10 * 60 * 1000); // 10 minutes in milliseconds
  const [alertCountdown, setAlertCountdown] = useState(0);
  const [alertType, setAlertType] = useState(null); // 'stagnation', 'deviation', 'distance-increase'
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Refs
  const mapRef = useRef(null);
  const watchPositionId = useRef(null);
  const timerRef = useRef(null);

  // Define triggerSafetyCheck before it's used
  const triggerSafetyCheck = useCallback(() => {
    setSuccessMessage('Safety Check: Are you still okay? Tap to confirm.');
    
    // If auto-alert is enabled in user settings and no confirmation in 60 seconds, send alert
    if (userSafetySettings?.autoAlertEmergencyContacts) {
      console.log("Auto-alert is enabled. Will send alert if no confirmation in 60 seconds.");
      // In a real app, you would set a timeout to alert contacts if the user doesn't confirm
      // setTimeout(() => sendEmergencyAlert(), 60000);
    }
  }, [userSafetySettings, setSuccessMessage]);

  // Set up safety check timer
  useEffect(() => {
    // Update every second
    timerRef.current = setInterval(() => {
      setSafetyCheckCounter(prev => {
        // If counter reaches 0, trigger safety check
        if (prev <= 0) {
          triggerSafetyCheck();
          return customSafetyCheckInterval; // Reset to user's custom interval
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [customSafetyCheckInterval, triggerSafetyCheck]);

  // Get user's emergency contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (!userId) return;
      
      try {
        // Fetch contacts from the "contacts" subcollection
        const contactsCollection = collection(db, "users", userId, "contacts");
        const snapshot = await getDocs(contactsCollection);
        const contactsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched emergency contacts:", contactsList);
        setEmergencyContacts(contactsList);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('Unable to load emergency contacts. Some features may be limited.');
      }
    };
    
    fetchContacts();
  }, [db, userId]);

  // Track location updates in Firestore for guardian monitoring
  const updateTripLocation = useCallback(async (position) => {
    if (!tripData.tripId) return;
    
    try {
      const db = getFirestore();
      
      // Update trip document with current location
      await updateDoc(doc(db, 'trips', tripData.tripId), {
        currentLocation: position,
        lastUpdated: Timestamp.now()
      });
      
      // Save location to user's location history
      if (userId) {
        await addDoc(collection(db, 'users', userId, 'locations'), {
          latitude: position.lat,
          longitude: position.lng,
          timestamp: Timestamp.now(),
          tripId: tripData.tripId
        });
      }
    } catch (err) {
      console.error('Error updating trip location:', err);
    }
  }, [tripData.tripId, userId]);

  // Add notification for guardian
  const notifyGuardian = useCallback(async (notificationType, title, message) => {
    if (!userId) return;
    
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        type: notificationType, // 'emergency', 'safeZone', 'trip', 'safety'
        title,
        message,
        timestamp: Timestamp.now(),
        read: false
      });
      
      console.log(`Guardian notification sent: ${title}`);
    } catch (err) {
      console.error('Error sending guardian notification:', err);
    }
  }, [userId]);

  // Define a function to trigger the alert countdown
  const startAlertCountdown = useCallback((type) => {
    setAlertType(type);
    setAlertCountdown(10); // 10 seconds countdown
    setShowAlertModal(true);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setAlertCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Trigger alert when countdown reaches 0
          setShowAlertModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Store interval ID for cleanup
    return countdownInterval;
  }, []);
  
  // Function to cancel alert
  const cancelAlert = useCallback(() => {
    setShowAlertModal(false);
    setAlertCountdown(0);
    setAlertType(null);
  }, []);
  
  // Send emergency alert - wrap in useCallback to avoid dependency issues
  const sendEmergencyAlert = useCallback(async (alertReason = "") => {
    if (emergencyContacts.length === 0) {
      setError('No emergency contacts found. Please add contacts in your profile.');
        return;
      }

    // Use custom emergency message if available
    let customMessage = userProfile?.emergencyMessage || "I need help! This is an emergency.";
    
    // Add alert reason to the message if provided
    if (alertReason) {
      customMessage = `${customMessage} Alert triggered due to: ${alertReason}`;
    }
    
    // Notify guardians through the app
    notifyGuardian('emergency', 'Emergency Alert!', customMessage);
    
    // Update trip status to emergency
    if (tripData.tripId && !tripData.tripId.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'trips', tripData.tripId), {
          status: 'emergency',
          emergencyTriggeredAt: Timestamp.now(),
          emergencyMessage: customMessage,
          alertReason: alertReason
        });
        
        setTripStatus('emergency');
        
        // Construct a message with location data for the UI
        const locationStr = currentPosition 
          ? `${currentPosition.lat},${currentPosition.lng}` 
          : 'unknown';
        
        // Send alerts to all emergency contacts
        emergencyContacts.forEach(contact => {
          // Format phone number for WhatsApp (remove any non-numeric characters)
          const whatsappNumber = contact.phone.replace(/\D/g, '');
          
          // Construct the WhatsApp message
          const whatsappMessage = encodeURIComponent(
            `${customMessage}\n\n` +
            `Location: https://maps.google.com/?q=${locationStr}\n\n` +
            `This is an automated emergency alert from the EAS App.`
          );
          
          // Create WhatsApp URL
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
          
          // Open WhatsApp in a new tab
          window.open(whatsappUrl, '_blank');
          
          // Log the alert for debugging
          console.log(`Sending emergency alert to ${contact.name}: ${customMessage}\nLocation: https://maps.google.com/?q=${locationStr}`);
        });
        
        setSuccessMessage('Emergency alert sent to your contacts via WhatsApp!');
        
      } catch (err) {
        console.error('Error setting emergency status:', err);
        setError('Failed to send emergency alert. Please try again or call emergency services directly.');
      }
    } else {
      // For local trips, simulate the alert
      setTripStatus('emergency');
      
      // Send WhatsApp messages even in local mode
      emergencyContacts.forEach(contact => {
        const whatsappNumber = contact.phone.replace(/\D/g, '');
        const locationStr = currentPosition 
          ? `${currentPosition.lat},${currentPosition.lng}` 
          : 'unknown';
        
        const whatsappMessage = encodeURIComponent(
          `${customMessage}\n\n` +
          `Location: https://maps.google.com/?q=${locationStr}\n\n` +
          `This is an automated emergency alert from the EAS App.`
        );
        
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');
      });
      
      setSuccessMessage('Emergency alert sent to your contacts via WhatsApp! (Simulated in offline mode)');
    }
  }, [currentPosition, db, emergencyContacts, tripData.tripId, userProfile, notifyGuardian]);

  // Check for location stagnation
  const checkLocationStagnation = useCallback((currentPos) => {
    const now = Date.now();
    
    // Skip if we don't have a previous position yet
    if (!lastPosition) {
      setLastPosition(currentPos);
      setLastLocationUpdate(now);
        return;
    }
    
    // Calculate distance between current and last position
    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(currentPos.lat, currentPos.lng),
      new window.google.maps.LatLng(lastPosition.lat, lastPosition.lng)
    );
    
    // If position has changed significantly (more than 30 meters), update last position
    if (distance > 30) {
      setLastPosition(currentPos);
      setLastLocationUpdate(now);
      return;
    }
    
    // Check if time passed since last significant movement exceeds threshold
    const timeSinceUpdate = now - lastLocationUpdate;
    if (timeSinceUpdate > stagnationThreshold) {
      console.log(`Location unchanged for ${timeSinceUpdate/60000} minutes, triggering alert countdown`);
      
      // Notify guardian of stagnation
      notifyGuardian('safety', 'Location Stagnation Alert', 
        `${userProfile?.displayName || 'User'} has not moved for over 10 minutes. Current location may require attention.`);
      
      const intervalId = startAlertCountdown('stagnation');
      
      // After countdown completes, send alert if not canceled
      setTimeout(() => {
        if (alertType === 'stagnation') {
          sendEmergencyAlert("No movement detected for over 10 minutes");
          clearInterval(intervalId);
          
          // Reset the stagnation timer
          setLastLocationUpdate(now);
        }
      }, 10000);
    }
  }, [lastPosition, lastLocationUpdate, stagnationThreshold, startAlertCountdown, sendEmergencyAlert, alertType, userProfile, notifyGuardian]);
  
  // Check if user is deviating from route
  const checkRouteDeviation = useCallback((currentPos) => {
    if (!directions || !currentPos || !directions.routes || !directions.routes[0]) {
      console.log("Cannot check deviation: missing directions or position data");
      return;
    }
    
    try {
      // Calculate current distance to destination
      const destination = directions.routes[0].legs[directions.routes[0].legs.length - 1].end_location;
      const currentDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(currentPos.lat, currentPos.lng),
        destination
      );

      // Check if distance is increasing significantly
      if (previousDistance !== null) {
        const distanceIncrease = currentDistance - previousDistance;
        if (distanceIncrease > distanceIncreaseThreshold) {
          console.log(`Distance increased by ${distanceIncrease}m, triggering alert countdown`);
          
          // Notify guardian of increasing distance
          notifyGuardian('trip', 'Route Deviation Alert', 
            `${userProfile?.displayName || 'User'} appears to be moving away from their destination.`);
          
          const intervalId = startAlertCountdown('distance-increase');
          
          // After countdown completes, send alert if not canceled
          setTimeout(() => {
            if (alertType === 'distance-increase') {
              sendEmergencyAlert("Distance to destination increased significantly");
              clearInterval(intervalId);
            }
          }, 10000);
          
      return;
        }
      }

      // Update previous distance
      setPreviousDistance(currentDistance);

      // Check route deviation using bounds
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add all points on the route to the bounds
      if (directions.routes[0].overview_path) {
        directions.routes[0].overview_path.forEach(point => {
          bounds.extend(point);
        });
      } else {
        console.log("No overview_path available, using leg points");
        directions.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
          if (leg.steps) {
            leg.steps.forEach(step => {
              bounds.extend(step.start_location);
              bounds.extend(step.end_location);
            });
          }
        });
      }
      
      // Add deviation threshold buffer
      const buffer = deviationThreshold / 111320; // Convert meters to degrees (approximate)
      bounds.extend(new window.google.maps.LatLng(
        currentPos.lat + buffer,
        currentPos.lng + buffer
      ));
      bounds.extend(new window.google.maps.LatLng(
        currentPos.lat - buffer,
        currentPos.lng - buffer
      ));
      
      const isInRoute = bounds.contains(new window.google.maps.LatLng(currentPos.lat, currentPos.lng));
      
      if (!isInRoute && !isDeviating) {
        setIsDeviating(true);
        setError('You appear to be deviating from your planned route.');
        
        // Notify guardian of route deviation
        notifyGuardian('trip', 'Route Deviation Alert', 
          `${userProfile?.displayName || 'User'} is deviating from their planned route.`);
        
        // Trigger alert countdown if auto-alert is enabled
        if (userSafetySettings?.autoAlertEmergencyContacts) {
          console.log("Auto-alert enabled, starting alert countdown for route deviation");
          const intervalId = startAlertCountdown('deviation');
          
          // After countdown completes, send alert if not canceled
          setTimeout(() => {
            if (alertType === 'deviation') {
              sendEmergencyAlert("Route deviation detected");
              clearInterval(intervalId);
            }
          }, 10000);
        }
      } else if (isInRoute && isDeviating) {
        setIsDeviating(false);
        setError('');
        
        // Notify guardian of return to route
        notifyGuardian('trip', 'Back on Route', 
          `${userProfile?.displayName || 'User'} has returned to their planned route.`);
      }
    } catch (err) {
      console.error("Error checking route deviation:", err);
    }
  }, [directions, isDeviating, previousDistance, deviationThreshold, distanceIncreaseThreshold, userSafetySettings, sendEmergencyAlert, startAlertCountdown, alertType, userProfile, notifyGuardian]);

  // Watch user's position for real-time updates
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    // Notify guardians that trip has started
    if (tripData.tripId) {
      notifyGuardian('trip', 'Trip Started', 
        `${userProfile?.displayName || 'User'} has started a trip to ${tripData.destination?.address || 'a destination'}.`);
    }
    
    // Start watching position
    watchPositionId.current = navigator.geolocation.watchPosition(
          (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setCurrentPosition(pos);
        
        // Update trip status in Firestore
        if (tripData.tripId) {
          updateTripLocation(pos);
        }
        
        // Check if user is deviating from route
        if (directions) {
          checkRouteDeviation(pos);
          
          // Check for location stagnation
          checkLocationStagnation(pos);
        }
        
        // Clear any location-related errors
        if (error && error.includes('location')) {
          setError('');
        }
      },
      (err) => {
        console.error('Error getting location:', err);
        
        // Provide more specific error messages based on the error code
        if (err.code === 1) {
          // Permission denied
          setError('Location access was denied. To track your trip location, please enable location permissions in your browser settings and refresh the page.');
        } else if (err.code === 2) {
          // Position unavailable
          setError('Unable to determine your location. Please check if your device\'s location services are enabled.');
        } else if (err.code === 3) {
          // Timeout
          setError('Location request timed out. Your trip is still active but location updates may be delayed.');
        } else {
          setError('Unable to access your location. Please check your device settings.');
        }
          },
          {
            enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
    
    // Clean up
    return () => {
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [directions, tripData.tripId, checkRouteDeviation, updateTripLocation, error, checkLocationStagnation, notifyGuardian, userProfile, tripData.destination]);
  
  // Calculate remaining distance and time
  const updateTripProgress = useCallback(() => {
    if (!directions || !currentPosition) return;
    
    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: currentPosition.lat, lng: currentPosition.lng },
        destination: tripData.destination,
        travelMode: window.google.maps.TravelMode[tripData.travelMode || 'DRIVING'],
      }, (result, status) => {
        if (status === 'OK') {
          setRemainingDistance(result.routes[0].legs[0].distance.text);
          setRemainingTime(result.routes[0].legs[0].duration.text);
        }
      });
    } catch (err) {
      console.error('Error updating trip progress:', err);
    }
  }, [currentPosition, directions, tripData.destination, tripData.travelMode]);
  
  // Handle trip completion
  const completeTrip = async () => {
    if (!tripData.tripId) {
      navigate('/home');
      return;
    }
    
    try {
      if (!tripData.tripId.startsWith('local-')) {
        // Update trip status to completed in Firestore
        await updateDoc(doc(db, 'trips', tripData.tripId), {
          status: 'completed',
          endTime: Timestamp.now(),
          actualDuration: {
            value: Math.floor((Date.now() - tripData.startTime.toDate().getTime()) / 1000),
            text: formatTimeRemaining(Math.floor((Date.now() - tripData.startTime.toDate().getTime()) / 1000))
          }
        });
        
        // Notify guardians of trip completion
        notifyGuardian('trip', 'Trip Completed', 
          `${userProfile?.displayName || 'User'} has completed their trip to ${tripData.destination?.address || 'their destination'}.`);
      }
      
      setSuccessMessage('Trip completed successfully!');
      setTimeout(() => {
    navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Error completing trip:', err);
      setError('Failed to update trip status. Please try again.');
    }
  };
  
  // Add proper formatting for the safety check countdown
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle map load
  const handleMapLoad = (map) => {
    mapRef.current = map;
    
    // Recenter button
    const centerButton = document.createElement("button");
    centerButton.textContent = "Center on My Location";
    centerButton.className = "custom-map-control-button";
    map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(centerButton);
    
    centerButton.addEventListener("click", () => {
      if (currentPosition) {
        map.panTo(currentPosition);
        map.setZoom(15);
      }
    });
  };

  // Initialize directions when map is loaded
  useEffect(() => {
    if (isLoaded && directionsData && !directions) {
      const convertToGoogleMapsDirections = async () => {
        try {
          // Create a DirectionsService
          const directionsService = new window.google.maps.DirectionsService();

          // Get the origin and destination from the tripData
          const origin = tripData.origin ? { 
            lat: tripData.origin.lat, 
            lng: tripData.origin.lng 
          } : null;
          
          const destination = tripData.destination ? { 
            lat: tripData.destination.lat, 
            lng: tripData.destination.lng 
          } : null;

          if (!origin || !destination) {
            console.error('Missing origin or destination data');
          return;
          }

          // Request directions from Google Maps API
          const result = await directionsService.route({
            origin,
            destination,
            travelMode: tripData.travelMode || 'DRIVING',
          });

          setDirections(result);
    } catch (error) {
          console.error('Error recreating directions:', error);
          setError('Failed to load directions. Please try again.');
        }
      };

      convertToGoogleMapsDirections();
    }
  }, [isLoaded, directionsData, directions, tripData]);

  // Update progress when current position changes
  useEffect(() => {
    if (isLoaded && currentPosition && tripData.destination) {
      updateTripProgress();
    }
  }, [currentPosition, isLoaded, tripData.destination, updateTripProgress]);

  // Add this useEffect hook to load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;
      
      try {
        const userData = await getUserProfileAndSettings(userId);
        if (!userData.error) {
          setUserProfile(userData.profile || null);
          setUserSafetySettings(userData.safetySettings || null);
          console.log("Loaded user settings for TripInProgress:", userData);
          
          // Apply user settings
          if (userData.safetySettings) {
            const settings = userData.safetySettings;
            
            // Apply safety check interval
            if (settings.defaultSafetyCheckInterval) {
              // Convert minutes to seconds for the timer
              setCustomSafetyCheckInterval(settings.defaultSafetyCheckInterval * 60);
              setSafetyCheckCounter(settings.defaultSafetyCheckInterval * 60);
            }
          }
        }
      } catch (err) {
        console.error("Error loading user settings:", err);
      }
    };
    
    loadUserSettings();
  }, [userId]);

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
    <div className="flex flex-col h-full bg-gray-50">
      <Header 
        title="Trip in Progress" 
        onBack={() => {
          if (window.confirm('Are you sure you want to end this trip?')) {
            completeTrip();
          }
        }}
        rightContent={
          <button 
            onClick={completeTrip}
            className="text-red-500 font-medium text-sm px-3 py-1 rounded-lg hover:bg-red-50"
          >
            End Trip
          </button>
        }
      />

      <main className="flex-1 p-4 pb-20 w-full">
        <div className="container mx-auto">
          {/* Map Container - Full Width */}
          <div className="w-full h-80 mb-6 bg-gray-200 rounded-xl overflow-hidden shadow-md">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={15}
                center={currentPosition || (tripData.origin && {
                  lat: tripData.origin.lat,
                  lng: tripData.origin.lng
                })}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  fullscreenControl: true,
                }}
                onLoad={handleMapLoad}
              >
                {currentPosition && (
                  <Marker
                    position={currentPosition}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#4285F4',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                  />
                )}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#4285F4',
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="space-y-3 mb-6">
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 flex items-center">
                <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 flex items-center">
                <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Content Grid - Two columns on desktop, one column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Trip Details Card */}
              <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Trip Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Destination</p>
                    <p className="font-medium text-gray-800">{destinationAddress}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Distance Remaining</p>
                      <p className="font-medium text-blue-900 text-lg">{remainingDistance}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
                      <p className="font-medium text-blue-900 text-lg">{remainingTime}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Safety Check Card */}
              <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                  <Clock size={20} className="mr-2" />
                  Safety Check
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Next safety check in:</p>
                      <p className="font-bold text-green-700 text-xl font-mono">{formatTimeRemaining(safetyCheckCounter)}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-1000" 
                        style={{ width: `${(safetyCheckCounter / customSafetyCheckInterval) * 100}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-center">Tap "I'm Safe" to reset the timer</p>
                  </div>
                  
                  <button
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 
                                transition duration-200 flex items-center justify-center font-medium shadow-sm"
                    onClick={() => setSafetyCheckCounter(customSafetyCheckInterval)}
                  >
                    <Shield size={18} className="mr-2" />
                    I'm Safe
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Emergency Contact Card */}
              <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <Phone size={20} className="mr-2" />
                  Emergency Contacts
                </h3>
                
                <div className="space-y-3">
                  {emergencyContacts && emergencyContacts.length > 0 ? (
                    emergencyContacts.map(contact => (
                      <div key={contact.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center">
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
                    ))
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg bg-gray-50 text-center">
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
              </div>

              {/* Emergency Card */}
              <div className="p-5 bg-white rounded-xl shadow-sm border border-red-200">
                <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center">
                  <AlertOctagon size={20} className="mr-2" />
                  Emergency
                </h3>
                
                <button
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 
                              transition duration-200 flex items-center justify-center font-medium shadow-sm"
                  onClick={sendEmergencyAlert}
                >
                  <AlertTriangle size={18} className="mr-2" />
                  Send SOS Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripInProgress;




