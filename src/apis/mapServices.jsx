import axios from 'axios';

const API_KEY = 'AIzaSyD-jh-F8agx3RqRfGs0-wUDNMRP0t9Xzxs'; // Updated to Google Maps API key
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// Create axios instance with common config
const googleAxios = axios.create({
  baseURL: GOOGLE_MAPS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mapServices = {
  // Helper function to decode Google Maps polyline - moved to top since it's used by other functions
  decodePolyline: (encoded) => {
    if (!encoded) {
      return [];
    }
    
    const poly = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
    }

    return poly;
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const response = await googleAxios.get('/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: API_KEY
        }
      });

      if (!response.data || response.data.status !== 'OK') {
        throw new Error('No data received from reverse geocoding API or status not OK');
      }

      return {
        success: true,
        data: {
          address: response.data.results[0]?.formatted_address || 'Unknown location',
          results: response.data.results
        }
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
      const response = await googleAxios.get('/place/autocomplete/json', {
        params: {
          input: input.trim(),
          key: API_KEY,
          components: 'country:in', // Restrict to India
          types: '(cities)', // Search for cities
          language: 'en', // Results in English
          sessiontoken: Math.random().toString(36).substring(7) // Add session token for billing optimization
        }
      });

      if (!response.data || response.data.status !== 'OK') {
        throw new Error('No data received from autocomplete API or status not OK');
      }

      // Ensure predictions is always an array
      const predictions = response.data.predictions || [];

      // Get place details for each prediction to get the coordinates
      const predictionsWithCoords = await Promise.all(
        predictions.map(async (prediction) => {
          try {
            const placeDetails = await mapServices.getPlaceDetails(prediction.place_id);
            return {
              ...prediction,
              description: prediction.description || prediction.formatted_address || prediction.name || '',
              place_id: prediction.place_id,
              geometry: placeDetails.success ? placeDetails.data.geometry : null
            };
          } catch (error) {
            console.error('Error fetching place details:', error);
            return prediction;
          }
        })
      );

      return {
        success: true,
        data: {
          predictions: predictionsWithCoords
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

  getPlaceDetails: async (placeId) => {
    try {
      const response = await googleAxios.get('/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'geometry,formatted_address,name,place_id',
          key: API_KEY
        }
      });

      if (!response.data || response.data.status !== 'OK') {
        throw new Error('No data received from place details API or status not OK');
      }

      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('Place Details Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: null
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
        key: API_KEY
      };

      if (waypoints) {
        params.waypoints = Array.isArray(waypoints) ? waypoints.join('|') : waypoints;
      }

      const response = await googleAxios.get('/directions/json', {
        params
      });

      if (!response.data || response.data.status !== 'OK') {
        throw new Error('No data received from directions API or status not OK');
      }

      // Convert Google Maps format to match the expected format in our app
      const routes = response.data.routes.map(route => {
        const decodedPath = mapServices.decodePolyline(route.overview_polyline.points);
        return {
          ...route,
          geometry: {
            coordinates: decodedPath.map(point => [point.lng, point.lat])
          }
        };
      });

      return {
        success: true,
        data: {
          routes
        }
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

  getOptimalRoute: async (origin, destination) => {
    try {
      if (!origin || !destination) {
        throw new Error('Origin and destination are required');
      }

      const params = {
        origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        key: API_KEY,
        alternatives: true,
        mode: 'walking' // Walking is typically safer
      };

      const response = await googleAxios.get('/directions/json', {
        params
      });

      if (!response.data || response.data.status !== 'OK') {
        throw new Error('No data received from directions API or status not OK');
      }

      // Convert Google Maps format to match the expected format in our app
      const routes = response.data.routes.map(route => {
        const decodedPath = mapServices.decodePolyline(route.overview_polyline.points);
        return {
          ...route,
          geometry: {
            coordinates: decodedPath.map(point => [point.lng, point.lat])
          }
        };
      });

      return {
        success: true,
        data: {
          routes
        }
      };
    } catch (error) {
      console.error('Optimal Route Error:', error);
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