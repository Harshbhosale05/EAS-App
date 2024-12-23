import axios from 'axios';

const API_KEY = 'FIiKDAZyAcwy-HWNL9lMsOsb9qn';
const BASE_URL = 'https://api.olamaps.io';

// Create axios instance with common config
const olaAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mapServices = {
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await olaAxios.get('/places/v1/reverse-geocode', {
        params: {
          latlng: `${lat},${lng}`,
          api_key: API_KEY
        },
        headers: { 
          'X-Request-Id': 'ReverseGeocode'
        }
      });

      if (!response.data) {
        throw new Error('No data received from reverse geocoding API');
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: null
      };
    }
  },

  autocomplete: async (input) => {
    if (!input || input.trim().length === 0) {
      return {
        success: true,
        data: {
          predictions: []
        }
      };
    }

    try {
      const response = await olaAxios.get('/places/v1/autocomplete', {
        params: {
          input: input.trim(),
          api_key: API_KEY
        },
        headers: { 
          'X-Request-Id': 'Autocomplete'
        }
      });

      if (!response.data) {
        throw new Error('No data received from autocomplete API');
      }

      // Ensure predictions is always an array
      const predictions = response.data.predictions || [];

      return {
        success: true,
        data: {
          predictions: predictions.map(prediction => ({
            ...prediction,
            description: prediction.description || prediction.formatted_address || prediction.name || '',
            place_id: prediction.place_id || prediction.id || String(Math.random())
          }))
        }
      };
    } catch (error) {
      console.error('Autocomplete Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: {
          predictions: []
        }
      };
    }
  },

  getDirections: async (origin, destination, waypoints = null) => {
    try {
      if (!origin || !destination) {
        throw new Error('Origin and destination are required');
      }

      const params = {
        origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        api_key: API_KEY
      };

      if (waypoints) {
        params.waypoints = Array.isArray(waypoints) ? waypoints.join('|') : waypoints;
      }

      const response = await olaAxios.post('/routing/v1/directions', null, {
        params,
        headers: { 
          'X-Request-Id': 'GetDirections'
        }
      });

      if (!response.data) {
        throw new Error('No data received from directions API');
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Directions Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: null
      };
    }
  },

  // Helper method to format coordinates
  formatCoordinates: (lat, lng) => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat.toFixed(6)},${lng.toFixed(6)}`;
    }
    return null;
  },

  // Helper method to validate coordinates
  validateCoordinates: (lat, lng) => {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }
};

export default mapServices;