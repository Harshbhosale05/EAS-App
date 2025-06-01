import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs, onSnapshot, query, where, orderBy, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Map, User, Shield, MapPin, Clock, MessageSquare, Bell, Home, AlertTriangle, Zap, Phone, X, Check, Settings, Trash2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import MetricsCard from '../components/MetricsCard';

const GuardianDashboard = () => {
  const navigate = useNavigate();
  const [wardId, setWardId] = useState(localStorage.getItem('wardUserId') || null);
  const [wardProfile, setWardProfile] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [wardLocation, setWardLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [showSafeZoneModal, setShowSafeZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState(500);
  const [newZoneAddress, setNewZoneAddress] = useState('');
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [statsSummary, setStatsSummary] = useState({
    tripsCompleted: 0,
    alertsTriggered: 0,
    averageTripTime: 0
  });

  // Check authentication and guardian status
  useEffect(() => {
    const auth = getAuth();
    const checkGuardianStatus = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        console.log("No authenticated user found, redirecting to signin");
        navigate('/signin');
        return;
      }
      
      // Get wardId from localStorage - this should have been set during sign in
      let guardianWardId = localStorage.getItem('wardUserId');
      
      // If no wardId is found but we're in guardian mode, use the current user's ID
      if (!guardianWardId && localStorage.getItem('guardianMode') === 'true') {
        console.log("No ward ID found but guardian mode is enabled, using own ID");
        guardianWardId = user.uid;
        localStorage.setItem('wardUserId', guardianWardId);
      }
      
      // If we still don't have a wardId, redirect to home
      if (!guardianWardId) {
        console.log("No ward ID and not in guardian mode, redirecting to home");
        localStorage.removeItem('guardianMode');
        navigate('/home');
        return;
      }
      
      // Set the wardId in the component state
      setWardId(guardianWardId);
      
      // Ensure guardian mode is set in localStorage
      localStorage.setItem('guardianMode', 'true');
      
      // Check if the current user is accessing their own data as guardian
      const isSelfGuardian = user.uid === guardianWardId;
      console.log("Self guardian mode:", isSelfGuardian);
      
      // Load ward profile
      try {
        setLoading(true);
        const db = getFirestore();
        const wardDoc = await getDoc(doc(db, "users", guardianWardId));
        
        if (wardDoc.exists()) {
          // Extract profile data safely
          const userData = wardDoc.data();
          const profileData = userData?.profile || {};
          
          setWardProfile({
            id: guardianWardId,
            ...profileData
          });
          
          console.log("Loaded profile data:", profileData);
        } else {
          console.log("No user document found, attempting to create default");
          setError('Could not find user profile information. Please make sure you have created a profile.');
        }
      } catch (err) {
        console.error("Error loading ward profile:", err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkGuardianStatus();
  }, [navigate, wardId]);

  // Load active trip data if available
  useEffect(() => {
    if (!wardId) return;
    
    const db = getFirestore();
    const tripsRef = collection(db, "trips");
    const q = query(
      tripsRef,
      where("userId", "==", wardId),
      where("status", "in", ["active", "emergency"]),
      orderBy("startTime", "desc")
    );
    
    try {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const tripData = querySnapshot.docs[0].data();
          setActiveTrip({
            id: querySnapshot.docs[0].id,
            ...tripData,
            startTime: tripData.startTime?.toDate() || new Date(),
            estimatedEndTime: tripData.estimatedEndTime?.toDate() || null
          });
          
          // If we have a location from the trip, update wardLocation
          if (tripData.currentLocation) {
            setWardLocation(tripData.currentLocation);
          }
        } else {
          setActiveTrip(null);
        }
      }, (error) => {
        console.error("Error fetching active trip:", error);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up trip listener:", err);
      setError("Couldn't load trip data. Please check your permissions.");
    }
  }, [wardId]);

  // Load latest location data
  useEffect(() => {
    if (!wardId) return;
    
    const db = getFirestore();
    const locationsRef = collection(db, "users", wardId, "locations");
    const q = query(locationsRef, orderBy("timestamp", "desc"));
    
    try {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const locationData = querySnapshot.docs[0].data();
          setWardLocation({
            lat: locationData.latitude,
            lng: locationData.longitude,
            timestamp: locationData.timestamp?.toDate() || new Date()
          });
          
          // Update location history
          const history = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              lat: data.latitude,
              lng: data.longitude,
              timestamp: data.timestamp?.toDate() || new Date()
            };
          });
          setLocationHistory(history);
        }
      }, (error) => {
        console.error("Error fetching location data:", error);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up location listener:", err);
    }
  }, [wardId]);

  // Load safe zones
  useEffect(() => {
    if (!wardId) return;
    
    const db = getFirestore();
    const zonesRef = collection(db, "users", wardId, "safeZones");
    
    try {
      const unsubscribe = onSnapshot(zonesRef, (querySnapshot) => {
        const zones = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSafeZones(zones);
      }, (error) => {
        console.error("Error fetching safe zones:", error);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up safe zones listener:", err);
    }
  }, [wardId]);

  // Load notifications
  useEffect(() => {
    if (!wardId) return;
    
    const db = getFirestore();
    const notificationsRef = collection(db, "users", wardId, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"));
    
    try {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setNotifications(notifs);
      }, (error) => {
        console.error("Error fetching notifications:", error);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
    }
  }, [wardId]);

  // Load trip statistics
  useEffect(() => {
    const fetchTripStats = async () => {
      if (!wardId) return;
      
      try {
        const db = getFirestore();
        const tripsRef = collection(db, "trips");
        const q = query(
          tripsRef,
          where("userId", "==", wardId),
          where("status", "==", "completed")
        );
        
        const querySnapshot = await getDocs(q);
        const trips = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate statistics
        const completedCount = trips.length;
        let totalTripTime = 0;
        let alertCount = 0;
        
        trips.forEach(trip => {
          if (trip.endTime && trip.startTime) {
            const start = trip.startTime.toDate ? trip.startTime.toDate() : new Date(trip.startTime);
            const end = trip.endTime.toDate ? trip.endTime.toDate() : new Date(trip.endTime);
            totalTripTime += (end - start) / (1000 * 60); // Convert to minutes
          }
          
          if (trip.alertsTriggered) {
            alertCount += trip.alertsTriggered;
          }
        });
        
        const avgTripTime = completedCount > 0 ? Math.round(totalTripTime / completedCount) : 0;
        
        setStatsSummary({
          tripsCompleted: completedCount,
          alertsTriggered: alertCount,
          averageTripTime: avgTripTime
        });
      } catch (error) {
        console.error("Error fetching trip statistics:", error);
      }
    };
    
    fetchTripStats();
  }, [wardId]);

  // Initialize Google Map when component mounts
  useEffect(() => {
    if (window.google && !mapLoaded) {
      initializeMap();
    } else if (!window.google) {
      // Load Google Maps script if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCrb573DEWbfmIG7iaG3KW4gbFB20zmmCE&libraries=places,geometry`;
      script.async = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    }
  }, [mapLoaded]);

  const initializeMap = () => {
    const mapElement = document.getElementById('guardian-map');
    if (!mapElement) return;
    
    const newMap = new window.google.maps.Map(mapElement, {
      center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    
    setMap(newMap);
    setMapLoaded(true);
  };

  // Update map with ward location and safe zones when they change
  useEffect(() => {
    if (!map || !wardLocation) return;
    
    // Clear existing markers
    if (window.wardMarker) {
      window.wardMarker.setMap(null);
    }
    
    if (window.pathPolyline) {
      window.pathPolyline.setMap(null);
    }
    
    // Add ward marker
    window.wardMarker = new window.google.maps.Marker({
      position: { lat: wardLocation.lat, lng: wardLocation.lng },
      map: map,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: wardProfile?.displayName || 'Location'
    });
    
    // Center map on current location
    map.setCenter({ lat: wardLocation.lat, lng: wardLocation.lng });
    
    // Draw recent path if we have location history
    if (locationHistory.length > 1) {
      const recentLocations = locationHistory.slice(0, 10); // Last 10 locations
      const path = recentLocations.map(loc => ({ lat: loc.lat, lng: loc.lng }));
      
      window.pathPolyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
      });
    }
    
    // Check if user is in any safe zone
    if (safeZones.length > 0) {
      let inSafeZone = false;
      
      safeZones.forEach(zone => {
        const center = { lat: zone.latitude, lng: zone.longitude };
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(wardLocation.lat, wardLocation.lng),
          new window.google.maps.LatLng(center.lat, center.lng)
        );
        
        if (distance <= zone.radius) {
          inSafeZone = true;
        }
      });
      
      // You could display an indicator if the ward is in a safe zone
      const statusElement = document.getElementById('safe-zone-status');
      if (statusElement) {
        if (inSafeZone) {
          statusElement.classList.add('in-zone');
        } else {
          statusElement.classList.remove('in-zone');
        }
      }
    }
  }, [map, wardLocation, safeZones, locationHistory, wardProfile]);

  // Draw safe zones on map
  useEffect(() => {
    if (!map || !safeZones.length) return;
    
    // Clear existing safe zone circles
    if (window.safeZoneCircles) {
      window.safeZoneCircles.forEach(circle => circle.setMap(null));
    }
    
    window.safeZoneCircles = safeZones.map(zone => {
      return new window.google.maps.Circle({
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4CAF50',
        fillOpacity: 0.2,
        map: map,
        center: { lat: zone.latitude, lng: zone.longitude },
        radius: zone.radius,
        clickable: true
      });
    });
  }, [map, safeZones]);

  // Add a new safe zone
  const addSafeZone = async () => {
    if (!newZoneName || !newZoneAddress || !wardId) {
      setError('Please provide a name and address for the safe zone.');
      return;
    }
    
    try {
      // Geocode the address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: newZoneAddress }, async (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          
          const db = getFirestore();
          await addDoc(collection(db, "users", wardId, "safeZones"), {
            name: newZoneName,
            address: newZoneAddress,
            latitude: location.lat(),
            longitude: location.lng(),
            radius: newZoneRadius,
            createdAt: Timestamp.now()
          });
          
          // Reset form and close modal
          setNewZoneName('');
          setNewZoneAddress('');
          setNewZoneRadius(500);
          setShowSafeZoneModal(false);
        } else {
          setError('Could not find the location. Please check the address.');
        }
      });
    } catch (err) {
      console.error("Error adding safe zone:", err);
      setError('Failed to add safe zone. Please try again.');
    }
  };

  // Delete a safe zone
  const deleteSafeZone = async (zoneId) => {
    if (!wardId || !zoneId) return;
    
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "users", wardId, "safeZones", zoneId));
    } catch (err) {
      console.error("Error deleting safe zone:", err);
      setError('Failed to delete safe zone.');
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date to readable format
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate time difference in minutes
  const getTimeDifference = (time1, time2) => {
    if (!time1 || !time2) return 'N/A';
    
    const date1 = time1 instanceof Date ? time1 : new Date(time1);
    const date2 = time2 instanceof Date ? time2 : new Date(time2);
    const diffMs = Math.abs(date2 - date1);
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    return `${diffMins} min`;
  };

  // Determine if location is stale (older than 5 minutes)
  const isLocationStale = () => {
    if (!wardLocation || !wardLocation.timestamp) return true;
    
    const now = new Date();
    const locationTime = wardLocation.timestamp instanceof Date 
      ? wardLocation.timestamp 
      : new Date(wardLocation.timestamp);
    
    const diffMinutes = (now - locationTime) / (1000 * 60);
    return diffMinutes > 5;
  };

  // Call the ward
  const callWard = () => {
    if (wardProfile && wardProfile.phoneNumber) {
      window.location.href = `tel:${wardProfile.phoneNumber}`;
    } else {
      setError('No phone number available for this user.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold">Guardian Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {wardProfile && (
              <div className="flex items-center">
                <User className="text-gray-500 mr-2" size={20} />
                <span className="font-medium">Monitoring: {wardProfile.displayName || "Your Profile"}</span>
              </div>
            )}
            
            <button 
              onClick={() => {
                // Navigate to sign-in page to re-authenticate
                navigate('/signin');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Switch to User Mode
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column - Map */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map and Location */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Map className="mr-2 text-blue-500" size={20} />
                    Location Tracking
                  </h2>
                  <div 
                    id="safe-zone-status" 
                    className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm flex items-center"
                  >
                    <Home className="mr-1" size={14} />
                    {safeZones.length > 0 ? 'Safe Zone Status' : 'No Safe Zones Set'}
                  </div>
                </div>
                
                <div className="relative">
                  <div id="guardian-map" className="h-96 w-full"></div>
                  
                  {!wardLocation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80">
                      <div className="text-center p-4">
                        <MapPin className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-gray-600">No location data available.</p>
                        <p className="text-sm text-gray-500 mt-1">Location will appear when data is shared.</p>
                      </div>
                    </div>
                  )}
                  
                  {wardLocation && (
                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
                      <div className="flex items-center mb-2">
                        <MapPin className="text-blue-500 mr-2" size={16} />
                        <span className="font-medium">Current Location</span>
                        {isLocationStale() && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Stale
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Lat: {wardLocation.lat.toFixed(6)}, Lng: {wardLocation.lng.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last updated: {formatTime(wardLocation.timestamp)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 flex justify-between">
                  <button
                    onClick={() => setShowSafeZoneModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                  >
                    <Home className="mr-2" size={16} />
                    Add Safe Zone
                  </button>
                  
                  <button
                    onClick={callWard}
                    className={`px-4 py-2 ${wardProfile?.phoneNumber ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded flex items-center`}
                    disabled={!wardProfile?.phoneNumber}
                  >
                    <Phone className="mr-2" size={16} />
                    Call {wardProfile?.displayName || 'User'}
                  </button>
                </div>
              </div>
              
              {/* Active Trip Info */}
              {activeTrip ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="border-b p-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Zap className="mr-2 text-orange-500" size={20} />
                      Active Trip
                      {activeTrip.status === 'emergency' && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          Emergency Mode
                        </span>
                      )}
                    </h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium">{activeTrip.origin?.address || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-medium">{activeTrip.destination?.address || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Started At</p>
                        <p className="font-medium">{formatTime(activeTrip.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Est. Arrival</p>
                        <p className="font-medium">{formatTime(activeTrip.estimatedEndTime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center">
                        <Clock className="text-gray-500 mr-2" size={16} />
                        <span className="text-sm">
                          Trip Duration: {getTimeDifference(activeTrip.startTime, new Date())}
                        </span>
                      </div>
                      
                      {activeTrip.distance && activeTrip.duration && (
                        <div className="text-sm text-gray-600">
                          {activeTrip.distance.text} • {activeTrip.duration.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <Map className="mx-auto text-gray-400 mb-2" size={40} />
                  <h3 className="text-lg font-medium text-gray-500">No Active Trip</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {wardProfile?.displayName || 'The user'} is not currently on a monitored trip.
                  </p>
                </div>
              )}
              
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <MetricsCard 
                  title="Trips Completed" 
                  value={statsSummary.tripsCompleted} 
                  icon={<Map className="text-blue-500" size={18} />} 
                  trend={5} 
                  className="bg-white"
                />
                <MetricsCard 
                  title="Avg Trip Duration" 
                  value={statsSummary.averageTripTime} 
                  icon={<Clock className="text-green-500" size={18} />} 
                  trend={-2} 
                  className="bg-white"
                />
                <MetricsCard 
                  title="Alert Events" 
                  value={statsSummary.alertsTriggered} 
                  icon={<Bell className="text-red-500" size={18} />} 
                  trend={-10} 
                  className="bg-white"
                />
              </div>
            </div>
            
            {/* Right column - Safe Zones & Notifications */}
            <div className="space-y-6">
              {/* Safe Zones */}
              <div className="bg-white rounded-lg shadow">
                <div className="border-b p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Home className="mr-2 text-green-500" size={20} />
                    Safe Zones
                  </h2>
                  <span className="text-sm text-gray-500">
                    {safeZones.length} zone{safeZones.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="p-4">
                  {safeZones.length === 0 ? (
                    <div className="text-center py-6">
                      <Home className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-500">No safe zones defined yet.</p>
                      <button
                        onClick={() => setShowSafeZoneModal(true)}
                        className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200"
                      >
                        + Add a safe zone
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {safeZones.map(zone => (
                        <div key={zone.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{zone.name}</h3>
                              <p className="text-sm text-gray-600">{zone.address}</p>
                              <p className="text-xs text-gray-500 mt-1">Radius: {zone.radius}m</p>
                            </div>
                            <button
                              onClick={() => deleteSafeZone(zone.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete safe zone"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notifications */}
              <div className="bg-white rounded-lg shadow max-h-96 flex flex-col">
                <div className="border-b p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Bell className="mr-2 text-orange-500" size={20} />
                    Notifications
                  </h2>
                  <span className="text-sm text-gray-500">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="overflow-y-auto flex-grow">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6">
                      <Bell className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-500">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start mb-2">
                            {notification.type === 'emergency' && <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={18} />}
                            {notification.type === 'safeZone' && <Home className="text-green-500 mr-2 flex-shrink-0" size={18} />}
                            {notification.type === 'trip' && <Map className="text-blue-500 mr-2 flex-shrink-0" size={18} />}
                            {notification.type === 'safety' && <Shield className="text-orange-500 mr-2 flex-shrink-0" size={18} />}
                            <div className="flex-grow">
                              <h3 className="font-medium">{notification.title}</h3>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{formatDate(notification.timestamp)} • {formatTime(notification.timestamp)}</span>
                            {notification.read ? (
                              <span className="flex items-center text-green-500">
                                <Check size={12} className="mr-1" /> Read
                              </span>
                            ) : (
                              <span className="flex items-center text-blue-500">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Profile Card */}
              {wardProfile && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-3 flex items-center">
                    <User className="mr-2 text-blue-500" size={20} />
                    User Profile
                  </h2>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{wardProfile.displayName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{wardProfile.phoneNumber || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{wardProfile.address || 'Not provided'}</p>
                    </div>
                    
                    {wardProfile.medicalInfo && (
                      <div>
                        <p className="text-sm text-gray-500">Medical Information</p>
                        <p className="text-sm">{wardProfile.medicalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Add Safe Zone Modal */}
      {showSafeZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Safe Zone</h3>
              <button 
                onClick={() => setShowSafeZoneModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. Home, School, Work"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newZoneAddress}
                  onChange={(e) => setNewZoneAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter full address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius (meters)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={newZoneRadius}
                    onChange={(e) => setNewZoneRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none"
                  />
                  <span className="ml-2 text-sm text-gray-700">{newZoneRadius}m</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowSafeZoneModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addSafeZone}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                >
                  <Home className="mr-2" size={16} />
                  Add Safe Zone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianDashboard; 