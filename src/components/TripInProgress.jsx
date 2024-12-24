import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import mapServices from '../apis/mapServices';

const API_KEY = 'T40W6FLKInLU1rWLNNx9nbevI5Sf18nWQaMWzBoR';

const TripInProgress = ({ userId }) => {
  const location = useLocation();
  const { currentLocation, selectedDestination, safetyInterval } = location.state || {};
  const [nextSafetyCheck, setNextSafetyCheck] = useState(safetyInterval * 60); // in seconds
  const [route, setRoute] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TripInProgress component mounted');
    console.log('Current Location:', currentLocation);
    console.log('Selected Destination:', selectedDestination);

    const interval = setInterval(() => {
      setNextSafetyCheck((prev) => (prev > 0 ? prev - 1 : safetyInterval * 60));
    }, 1000);

    const fetchRoute = async () => {
      try {
        const response = await mapServices.getDirections(
          { lat: currentLocation.latitude, lng: currentLocation.longitude },
          { lat: selectedDestination.latitude, lng: selectedDestination.longitude }
        );
        if (response.success) {
          const coordinates = response.data.routes[0].geometry.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
          setRoute(coordinates);
          console.log('Route fetched:', coordinates);
        } else {
          console.error('Failed to fetch route:', response.error);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();

    const olaMaps = new window.OlaMaps({ apiKey: API_KEY });
    const myMap = olaMaps.init({
      style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: 'map',
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 13,
    });

    myMap.on('load', () => {
      console.log('Map loaded');

      // Add start marker
      olaMaps.addMarker({ offset: [0, -10], anchor: 'bottom' })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(myMap);
      console.log('Start marker added');

      // Add end marker
      olaMaps.addMarker({ offset: [0, -10], anchor: 'bottom' })
        .setLngLat([selectedDestination.longitude, selectedDestination.latitude])
        .addTo(myMap);
      console.log('End marker added');

      // Add info windows
      const startPopup = olaMaps.addPopup({ offset: [0, -30], anchor: 'bottom' })
        .setText('Start Location');
      olaMaps.addMarker({ offset: [0, -10], anchor: 'bottom' })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .setPopup(startPopup)
        .addTo(myMap);

      const endPopup = olaMaps.addPopup({ offset: [0, -30], anchor: 'bottom' })
        .setText('Destination');
      olaMaps.addMarker({ offset: [0, -10], anchor: 'bottom' })
        .setLngLat([selectedDestination.longitude, selectedDestination.latitude])
        .setPopup(endPopup)
        .addTo(myMap);

      // Add route
      if (route.length > 0) {
        const polyline = new window.OlaMaps.Polyline({ path: route, color: 'blue' });
        polyline.addTo(myMap);
        console.log('Route added:', polyline);
      }

      // Add geolocate control
      const geolocate = olaMaps.addGeolocateControls({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      });
      myMap.addControl(geolocate);

      geolocate.on('geolocate', (event) => {
        console.log('A geolocate event has occurred', event);
      });

      geolocate.on('error', () => {
        console.log('An error event has occurred.');
      });
    });

    return () => {
      console.log('TripInProgress component unmounted');
      clearInterval(interval);
    };
  }, [safetyInterval, currentLocation, selectedDestination, route]);

  const handleEndTrip = () => {
    console.log('Ending trip');
    // End trip logic here
    navigate('/home');
  };

  const handleSafeRoute = async () => {
    try {
      const response = await mapServices.getOptimalRoute(
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: selectedDestination.latitude, lng: selectedDestination.longitude }
      );
      if (response.success) {
        const coordinates = response.data.routes[0].geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
        setRoute(coordinates);
        console.log('Safe route fetched:', coordinates);
      } else {
        console.error('Failed to fetch safe route:', response.error);
      }
    } catch (error) {
      console.error('Error fetching safe route:', error);
    }
  };

  if (!currentLocation || !selectedDestination) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h3 className="text-lg font-semibold">Trip in Progress</h3>
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-md text-sm">
          Next safety check in: {Math.floor(nextSafetyCheck / 60)}:{nextSafetyCheck % 60}
        </div>
        <div className="p-3 bg-slate-50 rounded-md text-sm" id="map" style={{ height: '300px', width: '100%' }}></div>
        <button
          onClick={handleEndTrip}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-md"
        >
          End Trip
        </button>
        <button
          onClick={handleSafeRoute}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Suggest Safe Route
        </button>
      </div>
    </div>
  );
};

export default TripInProgress;




