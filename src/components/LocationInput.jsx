import React, { useState } from 'react';
import mapServices from '../apis/mapServices';

const LocationInput = ({ onLocationSelect }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await mapServices.autocomplete(query);
      
      // Check if response exists and has predictions
      if (response && Array.isArray(response.predictions)) {
        setSuggestions(response.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete Error:', err);
      setError('Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSelect = (suggestion) => {
    onLocationSelect(suggestion);
    setInput(suggestion.description || '');
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Search for a destination"
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      />

      {loading && (
        <div className="absolute right-3 top-2">
          <span className="text-gray-400">Loading...</span>
        </div>
      )}

      {error && (
        <div className="mt-1 text-red-500 text-sm">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;