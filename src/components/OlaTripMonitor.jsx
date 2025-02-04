import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapServices from '../apis/mapServices';
import axios from 'axios';

const OLA_API_KEY = 'T40W6FLKInLU1rWLNNx9nbevI5Sf18nWQaMWzBoR';
const OLA_API_BASE_URL = 'https://api.olamaps.io';

const OlaTripMonitor = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [safetyInterval, setSafetyInterval] = useState('5');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const searchTimeout = useRef(null);
  const navigate = useNavigate();

  const searchPlaces = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await mapServices.autocomplete(query);
      if (response.success) {
        setSearchResults(response.data.predictions);
      } else {
        setError(response.error);
      }
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
          const response = await mapServices.reverseGeocode(location.latitude, location.longitude);
          if (response.success) {
            const locationWithAddress = {
              ...location,
              address: response.data.address || 'Location found',
            };
            setCurrentLocation(locationWithAddress);
          } else {
            setCurrentLocation(location);
            setError(response.error);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setCurrentLocation(location);
        }
        setIsLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        setIsLoading(false);
      }
    );
  };

  const handleCheckInCall = async () => {
    const recipient = "+8830752464"; // Emergency contact number
    try {
      await axios.post("http://localhost:3001/make-call", { recipient });
      alert("Call initiated!");
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to initiate call.");
    }
  };

  const handleStartTrip = () => {
    if (!currentLocation || !selectedDestination) {
      setError('Please set both current location and destination');
      return;
    }

    setTripActive(true);
    handleCheckInCall(); // Initiate safety check-in call when the trip starts
    // Start trip logic here
    navigate('/trip-in-progress', {
      state: {
        currentLocation,
        selectedDestination: {
          ...selectedDestination,
          latitude: selectedDestination.geometry.location.lat,
          longitude: selectedDestination.geometry.location.lng,
        },
        safetyInterval,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trip Monitor</h3>

        {/* Start Point Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>Start Point</span>
          </h3>
          <div className="space-y-2">
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              {isLoading ? 'Loading...' : 'Use Current Location'}
            </button>
            {currentLocation && (
              <div className="p-3 bg-slate-50 rounded-md text-sm">
                {currentLocation.address || 
                  `Lat: ${currentLocation.latitude.toFixed(6)}, Long: ${currentLocation.longitude.toFixed(6)}`}
              </div>
            )}
          </div>
        </div>

        {/* Destination Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>Destination</span>
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search destination"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}
          </div>
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
              {searchResults.map((place) => (
                <li
                  key={place.place_id}
                  onClick={() => {
                    setSelectedDestination(place);
                    setSearchQuery(place.description);
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {place.description}
                </li>
              ))}
            </ul>
          )}
          {selectedDestination && (
            <div className="p-3 bg-slate-50 rounded-md text-sm">
              Selected: {selectedDestination.description}
            </div>
          )}
        </div>

        {/* Safety Check Interval Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>Safety Check Interval</span>
          </h3>
          <select
            value={safetyInterval}
            onChange={(e) => setSafetyInterval(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">Every 5 minutes</option>
            <option value="10">Every 10 minutes</option>
            <option value="15">Every 15 minutes</option>
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Trip Control Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleStartTrip}
            disabled={tripActive || !currentLocation || !selectedDestination}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Start Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default OlaTripMonitor;
