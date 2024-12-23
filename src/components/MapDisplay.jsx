import React, { useState, useEffect } from 'react';
import mapServices from '../apis/mapServices';
import firebaseUtils from '../apis/firebaseUtils';

const MapDisplay = ({ userId }) => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [route, setRoute] = useState(null);

  const updateUserLocation = (lat, lng) => {
    setLocation({ lat, lng });
    firebaseUtils.updateLocation(userId, { lat, lng });
  };

  const fetchRoute = async (origin, destination) => {
    const routeData = await mapServices.getDirections(origin, destination);
    setRoute(routeData);
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude);
      },
      (error) => console.error('Location Error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div>
      {/* Render Map and Route */}
      <div id="map"></div>
      {route && <pre>{JSON.stringify(route, null, 2)}</pre>}
    </div>
  );
};

export default MapDisplay;
