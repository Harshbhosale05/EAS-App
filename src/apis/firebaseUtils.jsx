


import { getDatabase, ref, set, update, get, push, remove } from 'firebase/database';

const firebaseUtils = {
  // Update user's real-time location
  updateLocation: async (userId, location) => {
    const db = getDatabase();
    const locationRef = ref(db, `users/${userId}/location`);
    try {
      await update(locationRef, {
        ...location,
        timestamp: Date.now(),
        isActive: true,
      });
      
      // Also store in location history
      const historyRef = ref(db, `users/${userId}/locationHistory`);
      await push(historyRef, {
        ...location,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Firebase Location Update Error:', error);
      throw error; // Re-throw to handle in the component
    }
  },

  // Start a new trip
  startTrip: async (userId, tripData) => {
    const db = getDatabase();
    const tripRef = ref(db, `users/${userId}/activeTrip`);
    try {
      await set(tripRef, {
        ...tripData,
        startTime: Date.now(),
        status: 'active',
      });
    } catch (error) {
      console.error('Firebase Start Trip Error:', error);
      throw error;
    }
  },

  // End active trip
  endTrip: async (userId) => {
    const db = getDatabase();
    const activeTripRef = ref(db, `users/${userId}/activeTrip`);
    const tripsHistoryRef = ref(db, `users/${userId}/tripsHistory`);
    
    try {
      // Get current trip data
      const tripSnapshot = await get(activeTripRef);
      const tripData = tripSnapshot.val();
      
      if (tripData) {
        // Store in history
        await push(tripsHistoryRef, {
          ...tripData,
          endTime: Date.now(),
          status: 'completed',
        });
        
        // Clear active trip
        await remove(activeTripRef);
      }
    } catch (error) {
      console.error('Firebase End Trip Error:', error);
      throw error;
    }
  },

  // Update emergency contacts
  updateEmergencyContacts: async (userId, contacts) => {
    const db = getDatabase();
    const contactsRef = ref(db, `users/${userId}/emergencyContacts`);
    try {
      await set(contactsRef, contacts);
    } catch (error) {
      console.error('Firebase Update Contacts Error:', error);
      throw error;
    }
  },

  // Get user's active trip
  getActiveTrip: async (userId) => {
    const db = getDatabase();
    const tripRef = ref(db, `users/${userId}/activeTrip`);
    try {
      const snapshot = await get(tripRef);
      return snapshot.val();
    } catch (error) {
      console.error('Firebase Get Active Trip Error:', error);
      throw error;
    }
  },

  // Update trip status
  updateTripStatus: async (userId, status, additionalData = {}) => {
    const db = getDatabase();
    const tripRef = ref(db, `users/${userId}/activeTrip`);
    try {
      await update(tripRef, {
        status,
        lastUpdated: Date.now(),
        ...additionalData,
      });
    } catch (error) {
      console.error('Firebase Update Trip Status Error:', error);
      throw error;
    }
  },

  // Send SOS alert
  sendSOSAlert: async (userId, location) => {
    const db = getDatabase();
    const sosRef = ref(db, `users/${userId}/sos`);
    try {
      await set(sosRef, {
        location,
        timestamp: Date.now(),
        status: 'active',
        resolved: false,
      });
      
      // Also store in SOS history
      const sosHistoryRef = ref(db, `users/${userId}/sosHistory`);
      await push(sosHistoryRef, {
        location,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Firebase SOS Alert Error:', error);
      throw error;
    }
  },

  // Clear SOS alert
  clearSOSAlert: async (userId) => {
    const db = getDatabase();
    const sosRef = ref(db, `users/${userId}/sos`);
    try {
      await update(sosRef, {
        resolved: true,
        resolvedAt: Date.now(),
      });
    } catch (error) {
      console.error('Firebase Clear SOS Error:', error);
      throw error;
    }
  },

  // Get user's emergency contacts
  getEmergencyContacts: async (userId) => {
    const db = getDatabase();
    const contactsRef = ref(db, `users/${userId}/emergencyContacts`);
    try {
      const snapshot = await get(contactsRef);
      return snapshot.val();
    } catch (error) {
      console.error('Firebase Get Contacts Error:', error);
      throw error;
    }
  }
};

export default firebaseUtils;
