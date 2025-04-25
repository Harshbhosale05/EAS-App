import React, { useState, useEffect, useRef } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';
import mapServices from '../apis/mapServices';

const LocationSearch = ({ onPlaceSelected, currentLocation }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchBoxRef = useRef(null);

  // Handle place selection from the search box
  const handlePlacesChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      
      if (places && places.length > 0) {
        const place = places[0];
        const locationData = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || place.name,
          name: place.name,
          viewport: place.geometry.viewport ? {
            north: place.geometry.viewport.getNorthEast().lat(),
            east: place.geometry.viewport.getNorthEast().lng(),
            south: place.geometry.viewport.getSouthWest().lat(),
            west: place.geometry.viewport.getSouthWest().lng()
          } : null
        };
        
        onPlaceSelected(locationData);
        setError(null);
      } else {
        setError('Please select a valid location from the suggestions');
      }
    }
  };

  // Handle manual search input
  const handleSearchInput = async (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (!value.trim()) {
      setError(null);
      return;
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      {isLoading ? (
        <div className="relative">
          <input
            type="text"
            placeholder="Loading location search..."
            disabled
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
          />
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        </div>
      ) : (
        <StandaloneSearchBox
          onLoad={ref => {
            searchBoxRef.current = ref;
          }}
          onPlacesChanged={handlePlacesChanged}
        >
          <input
            type="text"
            placeholder="Search for a location"
            value={searchInput}
            onChange={handleSearchInput}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </StandaloneSearchBox>
      )}
    </div>
  );
};

export default LocationSearch; 