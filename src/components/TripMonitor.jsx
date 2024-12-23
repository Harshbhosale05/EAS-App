// import React, { useState, useEffect, useRef } from 'react';
// import { MapPin, Navigation, Clock, Loader2 } from 'lucide-react';

// const OLA_API_KEY = 'FIiKDAZyAcwy-HWNL9lMsOsb9qn';
// const OLA_API_BASE_URL = 'https://api.krutrim.com/maps'; // Replace with the actual base URL

// const TripMonitor = ({ onLocationUpdate }) => {
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedDestination, setSelectedDestination] = useState(null);
//   const [safetyInterval, setSafetyInterval] = useState('5');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSearching, setIsSearching] = useState(false);
//   const [error, setError] = useState(null);
//   const [tripActive, setTripActive] = useState(false);
//   const searchTimeout = useRef(null);
//   const locationWatchId = useRef(null);

//   const searchPlaces = async (query) => {
//     if (!query) {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);
//     try {
//         const response = await fetch(`${OLA_API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
//             headers: {
//               Authorization: `Bearer ${OLA_API_KEY}`,
//               'Content-Type': 'application/json',
//             },
//           });
          

//       if (!response.ok) {
//         throw new Error('Failed to fetch search results');
//       }

//       const data = await response.json();
//       setSearchResults(data.results || []);
//     } catch (error) {
//       console.error('Search error:', error);
//       setError('Failed to search locations');
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleSearchInput = (value) => {
//     setSearchQuery(value);

//     if (searchTimeout.current) {
//       clearTimeout(searchTimeout.current);
//     }

//     searchTimeout.current = setTimeout(() => {
//       searchPlaces(value);
//     }, 300);
//   };

//   const getCurrentLocation = () => {
//     setIsLoading(true);
//     setError(null);

//     if (!navigator.geolocation) {
//       setError('Geolocation is not supported by your browser');
//       setIsLoading(false);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const location = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         };

//         try {
//             const response = await fetch(
//                 `${OLA_API_BASE_URL}/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`,
//                 {
//                   headers: {
//                     Authorization: `Bearer ${OLA_API_KEY}`,
//                     'Content-Type': 'application/json',
//                   },
//                 }
//               );
              
//           if (!response.ok) {
//             throw new Error('Failed to get address details');
//           }

//           const data = await response.json();
//           const locationWithAddress = {
//             ...location,
//             address: data.address || 'Location found',
//           };
//           setCurrentLocation(locationWithAddress);

//           if (onLocationUpdate) {
//             onLocationUpdate({
//               type: 'current',
//               data: locationWithAddress,
//             });
//           }
//         } catch (error) {
//           console.error('Reverse geocoding error:', error);
//           setCurrentLocation(location);

//           if (onLocationUpdate) {
//             onLocationUpdate({
//               type: 'current',
//               data: location,
//             });
//           }
//         }
//         setIsLoading(false);
//       },
//       (error) => {
//         setError('Unable to retrieve your location');
//         setIsLoading(false);
//       }
//     );
//   };

//   const startLocationTracking = () => {
//     if (!navigator.geolocation) {
//       setError('Geolocation is not supported by your browser');
//       return;
//     }

//     locationWatchId.current = navigator.geolocation.watchPosition(
//       (position) => {
//         const newLocation = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//           timestamp: new Date().toISOString(),
//         };
//         setCurrentLocation(newLocation);

//         if (onLocationUpdate) {
//           onLocationUpdate({
//             type: 'tracking',
//             data: {
//               ...newLocation,
//               destination: selectedDestination,
//               safetyInterval: parseInt(safetyInterval, 10),
//             },
//           });
//         }
//       },
//       (error) => {
//         setError('Error tracking location: ' + error.message);
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 5000,
//         maximumAge: 0,
//       }
//     );
//   };

//   const handleStartTrip = () => {
//     if (!currentLocation || !selectedDestination) {
//       setError('Please set both current location and destination');
//       return;
//     }
//     setTripActive(true);
//     startLocationTracking();
//   };

//   const handleStopTrip = () => {
//     if (locationWatchId.current) {
//       navigator.geolocation.clearWatch(locationWatchId.current);
//       locationWatchId.current = null;
//     }
//     setTripActive(false);

//     if (onLocationUpdate) {
//       onLocationUpdate({
//         type: 'tripEnd',
//         data: {
//           endTime: new Date().toISOString(),
//         },
//       });
//     }
//   };

//   useEffect(() => {
//     return () => {
//       if (searchTimeout.current) {
//         clearTimeout(searchTimeout.current);
//       }
//       if (locationWatchId.current) {
//         navigator.geolocation.clearWatch(locationWatchId.current);
//       }
//     };
//   }, []);

//   return (
//     <div className="container mx-auto p-4 max-w-lg border rounded shadow">
//       <h2 className="text-xl font-bold mb-4">Trip Monitor</h2>

//       <div className="space-y-4">
//         <div className="space-y-2">
//           <label className="block text-sm font-medium">Start Point</label>
//           <button
//             onClick={getCurrentLocation}
//             disabled={isLoading || tripActive}
//             className="w-full bg-gray-100 border px-4 py-2 rounded disabled:opacity-50"
//           >
//             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : <MapPin className="mr-2 h-4 w-4 inline" />}
//             {isLoading ? 'Getting Location...' : 'Use Current Location'}
//           </button>
//           {currentLocation && (
//             <div className="text-sm text-gray-500">
//               {currentLocation.address || `Lat: ${currentLocation.latitude.toFixed(6)}, Long: ${currentLocation.longitude.toFixed(6)}`}

//             </div>
//           )}
//         </div>

//         <div className="space-y-2 relative">
//           <label className="block text-sm font-medium">Destination</label>
//           <input
//             type="text"
//             placeholder="Search for a destination"
//             value={searchQuery}
//             onChange={(e) => handleSearchInput(e.target.value)}
//             disabled={tripActive}
//             className="w-full border px-4 py-2 rounded"
//           />
//           {searchResults.length > 0 && !tripActive && (
//             <div className="absolute bg-white border rounded mt-2 w-full max-h-40 overflow-auto">
//               {searchResults.map((place) => (
//                 <div
//                   key={place.id}
//                   className="p-2 hover:bg-gray-100 cursor-pointer"
//                   onClick={() => {
//                     setSelectedDestination(place);
//                     setSearchQuery(place.name || place.address);
//                     setSearchResults([]);
//                   }}
//                 >
//                   <div className="font-medium">{place.name}</div>
//                   <div className="text-sm text-gray-500">{place.address}</div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="space-y-2">
//           <label className="block text-sm font-medium">Safety Check Interval</label>
//           <select
//             value={safetyInterval}
//             onChange={(e) => setSafetyInterval(e.target.value)}
//             disabled={tripActive}
//             className="w-full border px-4 py-2 rounded"
//           >
//             <option value="5">Every 5 minutes</option>
//             <option value="10">Every 10 minutes</option>
//             <option value="15">Every 15 minutes</option>
//           </select>
//         </div>

//         {error && <div className="text-red-500 text-sm">{error}</div>}

//         <button
//           onClick={tripActive ? handleStopTrip : handleStartTrip}
//          className={`w-full px-4 py-2 rounded ${tripActive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}

//           disabled={!currentLocation || !selectedDestination}
//         >
//           {tripActive ? 'Stop Trip' : 'Start Trip'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TripMonitor;










import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Loader2, AlertTriangle } from 'lucide-react';

// Basic UI Components
const Card = ({ className, children, ...props }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }) => (
  <div className={`p-4 border-b ${className || ''}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-lg font-semibold ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={`p-4 ${className || ''}`} {...props}>
    {children}
  </div>
);

const Button = ({ className, variant = 'default', children, disabled, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variants = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-500 text-white hover:bg-red-600'
  };
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${disabledStyle} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className, disabled, ...props }) => (
  <input
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className || ''}`}
    disabled={disabled}
    {...props}
  />
);

const Select = ({ children, value, onValueChange, className, disabled, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`relative ${className || ''}`} {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          value, 
          onValueChange, 
          isOpen, 
          setIsOpen,
          disabled 
        })
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className, isOpen, setIsOpen, disabled, ...props }) => (
  <button
    className={`w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'} ${className || ''}`}
    onClick={() => !disabled && setIsOpen(!isOpen)}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const SelectValue = ({ children, value, placeholder, ...props }) => (
  <span {...props}>{value ? children : placeholder}</span>
);

const SelectContent = ({ children, className, isOpen, onValueChange, setIsOpen, ...props }) => (
  isOpen && (
    <div 
      className={`absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg ${className || ''}`}
      {...props}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { 
          onValueChange: (value) => {
            onValueChange(value);
            setIsOpen(false);
          }
        })
      )}
    </div>
  )
);

const SelectItem = ({ children, className, value, onValueChange, ...props }) => (
  <button
    className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${className || ''}`}
    onClick={() => onValueChange(value)}
    {...props}
  >
    {children}
  </button>
);

const Alert = ({ children, variant = 'destructive', className, ...props }) => (
  <div 
    className={`p-4 border rounded-md flex items-start space-x-2
    ${variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : ''} ${className || ''}`}
    {...props}
  >
    {children}
  </div>
);

const AlertDescription = ({ children, className, ...props }) => (
  <div className={`text-sm ${className || ''}`} {...props}>
    {children}
  </div>
);

const OLA_API_KEY = 'FIiKDAZyAcwy-HWNL9lMsOsb9qn';
const OLA_API_BASE_URL = 'https://api.krutrim.com/maps';

const TripMonitor = ({ userId, onTripStart, onTripEnd, onLocationUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [safetyInterval, setSafetyInterval] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const [tripStatus, setTripStatus] = useState(null);
  const searchTimeout = useRef(null);
  const locationWatchId = useRef(null);

  const searchPlaces = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${OLA_API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${OLA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search locations');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (value) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(value), 300);
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };

        try {
          const response = await fetch(
            `${OLA_API_BASE_URL}/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`,
            {
              headers: {
                Authorization: `Bearer ${OLA_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) throw new Error('Failed to get address details');
          const data = await response.json();

          const locationWithAddress = {
            ...location,
            address: data.address || 'Location found',
          };

          setCurrentLocation(locationWithAddress);
          if (onLocationUpdate) {
            onLocationUpdate({
              type: 'current',
              data: locationWithAddress,
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setCurrentLocation(location);
          if (onLocationUpdate) {
            onLocationUpdate({
              type: 'current',
              data: location,
            });
          }
        }
        setIsLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        setIsLoading(false);
      }
    );
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };

        setCurrentLocation(newLocation);
        if (onLocationUpdate) {
          onLocationUpdate({
            type: 'tracking',
            data: {
              ...newLocation,
              destination: selectedDestination,
              safetyInterval: parseInt(safetyInterval, 10),
            },
          });
        }
      },
      (error) => {
        setError('Error tracking location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleStartTrip = () => {
    if (!currentLocation || !selectedDestination) {
      setError('Please set both current location and destination');
      return;
    }

    setTripActive(true);
    setTripStatus('active');
    startLocationTracking();

    if (onTripStart) {
      onTripStart({
        startLocation: currentLocation,
        destination: selectedDestination,
        safetyInterval: parseInt(safetyInterval, 10),
        startTime: new Date().toISOString(),
      });
    }
  };

  const handleStopTrip = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }

    setTripActive(false);
    setTripStatus(null);

    if (onTripEnd) {
      onTripEnd({
        endTime: new Date().toISOString(),
        lastLocation: currentLocation,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            Trip Monitor
            {tripActive && <span className="text-sm text-green-500 ml-2">(Active)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Location Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Start Point
            </h3>
            <div className="space-y-2">
              <Button 
                onClick={getCurrentLocation} 
                disabled={tripActive}
                variant={currentLocation ? "outline" : "default"}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Use Current Location
              </Button>
              {currentLocation && (
                <div className="p-3 bg-slate-50 rounded-md text-sm">
                  {currentLocation.address || 
                    `Lat: ${currentLocation.latitude.toFixed(6)}, Long: ${currentLocation.longitude.toFixed(6)}`}
                </div>
              )}
            </div>
          </div>

          {/* Destination Search Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Destination
            </h3>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search destination"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  disabled={tripActive}
                  className="w-full"
                />
                {isSearching && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                )}
              </div>
              {searchResults.length > 0 && !tripActive && (
                <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-10 max-h-64 overflow-auto">
                  {searchResults.map((place) => (
                    <button
                      key={place.id}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                      onClick={() => {
                        setSelectedDestination(place);
                        setSearchQuery(place.name || place.address);
                        setSearchResults([]);
                      }}
                    >
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-gray-500">{place.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedDestination && (
              <div className="p-3 bg-slate-50 rounded-md text-sm">
                Selected: {selectedDestination.name || selectedDestination.address}
              </div>
            )}
          </div>

          {/* Safety Interval Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Safety Check Interval
            </h3>
            <Select
              value={safetyInterval}
              onValueChange={setSafetyInterval}
              disabled={tripActive}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="10">Every 10 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5 text-red-800" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Trip Control Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleStartTrip}
              disabled={tripActive || !currentLocation || !selectedDestination}
              variant="default"
              className="w-full"
            >
              Start Trip
            </Button>
            <Button
              onClick={handleStopTrip}
              disabled={!tripActive}
              variant="destructive"
              className="w-full"
            >
              Stop Trip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trip Status Section */}
      {tripActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Trip Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 rounded-md text-sm">
              <strong>Status:</strong> {tripStatus === 'active' ? 'Active' : 'Inactive'}
            </div>
            {currentLocation && (
              <div className="p-3 bg-slate-50 rounded-md text-sm">
                <strong>Last Known Location:</strong>{' '}
                {currentLocation.address || 
                  `Lat: ${currentLocation.latitude.toFixed(6)}, Long: ${currentLocation.longitude.toFixed(6)}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripMonitor;