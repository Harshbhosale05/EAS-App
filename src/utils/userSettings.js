import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Helper function to check authentication
const ensureAuthenticated = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error("No authenticated user found");
    throw new Error("User not authenticated. Please sign in again.");
  }
  
  return currentUser.uid;
};

// Central location for retrieving user profile and settings
export const getUserProfileAndSettings = async (userId) => {
  if (!userId) {
    try {
      // Try to get current user if userId not provided
      userId = ensureAuthenticated();
    } catch (err) {
      console.error("Authentication error:", err.message);
      return { profile: null, safetySettings: null, error: err.message };
    }
  }
  
  try {
    const db = getFirestore();
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return {
        profile: userData.profile || {},
        safetySettings: userData.safetySettings || {},
        safetyPreferences: userData.safetyPreferences || {},
        error: null
      };
    } else {
      console.log("User document does not exist, creating default user document");
      
      // Create an empty user document if it doesn't exist
      try {
        await setDoc(userDocRef, {
          profile: getDefaultUserProfile(),
          safetySettings: getDefaultSafetySettings(),
          safetyPreferences: {}
        });
        
        return {
          profile: getDefaultUserProfile(),
          safetySettings: getDefaultSafetySettings(),
          safetyPreferences: {},
          error: null
        };
      } catch (err) {
        console.error("Error creating user document:", err);
        return {
          profile: getDefaultUserProfile(),
          safetySettings: getDefaultSafetySettings(),
          safetyPreferences: {},
          error: `Failed to create user data: ${err.message}`
        };
      }
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    return {
      profile: getDefaultUserProfile(),
      safetySettings: getDefaultSafetySettings(),
      safetyPreferences: {},
      error: `Failed to load user data: ${err.message}`
    };
  }
};

// Save user profile
export const saveUserProfile = async (userId, profileData, safetyPreferences) => {
  if (!userId) {
    try {
      // Try to get current user if userId not provided
      userId = ensureAuthenticated();
    } catch (err) {
      console.error("Authentication error:", err.message);
      return { success: false, error: err.message };
    }
  }
  
  try {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.uid !== userId) {
      return { success: false, error: "You can only update your own profile" };
    }
    
    const db = getFirestore();
    const userDocRef = doc(db, "users", userId);
    
    // First check if the document exists
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      // Create the document with the full structure
      await setDoc(userDocRef, {
        profile: profileData,
        safetyPreferences: safetyPreferences,
        safetySettings: getDefaultSafetySettings()
      });
    } else {
      // Update existing document
      await setDoc(userDocRef, {
        profile: profileData,
        safetyPreferences: safetyPreferences
      }, { merge: true });
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error("Error saving user profile:", err);
    if (err.code === 'permission-denied') {
      return { success: false, error: "Permission denied. Make sure you're signed in and have access to update your profile." };
    }
    return { success: false, error: `Failed to save profile: ${err.message}` };
  }
};

// Save safety settings
export const saveSafetySettings = async (userId, safetySettings) => {
  if (!userId) {
    try {
      // Try to get current user if userId not provided
      userId = ensureAuthenticated();
    } catch (err) {
      console.error("Authentication error:", err.message);
      return { success: false, error: err.message };
    }
  }
  
  try {
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.uid !== userId) {
      return { success: false, error: "You can only update your own settings" };
    }
    
    const db = getFirestore();
    const userDocRef = doc(db, "users", userId);
    
    // First check if the document exists
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      // Create the document with the full structure
      await setDoc(userDocRef, {
        safetySettings: safetySettings,
        profile: getDefaultUserProfile(),
        safetyPreferences: {}
      });
    } else {
      // Update existing document
      await setDoc(userDocRef, {
        safetySettings: safetySettings
      }, { merge: true });
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error("Error saving safety settings:", err);
    if (err.code === 'permission-denied') {
      return { success: false, error: "Permission denied. Make sure you're signed in and have access to update your settings." };
    }
    return { success: false, error: `Failed to save settings: ${err.message}` };
  }
};

// Get default safety settings when no user settings exist
export const getDefaultSafetySettings = () => {
  return {
    // Alert settings
    emergencyMessageText: 'I need help! This is an emergency.',
    sosButtonPressDelay: 3,
    autoAlertEmergencyContacts: true,
    
    // Monitoring settings
    motionDetectionEnabled: true,
    voiceDetectionEnabled: true,
    distressKeywords: ['help', 'emergency', 'sos'],
    
    // Trip monitoring
    defaultSafetyCheckInterval: 15,
    routeDeviationAlerts: true,
    estimatedArrivalTimeBuffer: 10,
    
    // Privacy settings
    shareLocationWithContacts: true,
    autoRecordAudio: false,
    autoRecordVideo: false,
    recordingDuration: 60,
    
    // Fake call settings
    fakeCallEnabled: true,
    fakeCallVolume: 80,
    defaultCallerName: 'Mom',
  };
};

// Get default profile settings when no user profile exists
export const getDefaultUserProfile = () => {
  return {
    displayName: '',
    phoneNumber: '',
    emergencyMessage: 'I need help! This is an emergency.',
    medicalInfo: '',
    address: '',
    bloodType: '',
    allergies: '',
  };
}; 