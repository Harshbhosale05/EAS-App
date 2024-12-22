import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from './firebase'; // Import Firebase app

const db = getFirestore(app);

export const addEmergencyContact = async (userId, contact) => {
  if (!userId) {
    throw new Error("User ID is required to add a contact.");
  }
  try {
    await addDoc(collection(db, "users", userId, "contacts"), contact);
    console.log("Contact added successfully");
  } catch (error) {
    console.error("Error adding contact: ", error);
    throw error;
  }
};
