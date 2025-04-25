import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { app } from './firebase'; // Import Firebase app

const db = getFirestore(app);

// Fetch all contacts for a user
export const fetchEmergencyContacts = async (userId) => {
  if (!userId) {
    console.error("No userId provided");
    return [];
  }
  try {
    const contactsCollection = collection(db, "users", userId, "contacts");
    const snapshot = await getDocs(contactsCollection);
    console.log("Snapshot size: ", snapshot.size);
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched Contacts: ", contacts);
    return contacts;
  } catch (error) {
    console.error("Error fetching contacts: ", error.message);
    throw error;
  }
};

// Add a new contact for a user
export const addEmergencyContact = async (userId, contact) => {
  if (!userId) {
    throw new Error("User ID is required to add a contact.");
  }
  try {
    const contactsCollection = collection(db, "users", userId, "contacts");
    await addDoc(contactsCollection, contact);
    console.log("Contact added successfully");
  } catch (error) {
    console.error("Error adding contact: ", error);
    throw error;
  }
};

// Delete a contact for a user
export const deleteEmergencyContact = async (userId, contactId) => {
  if (!userId || !contactId) {
    throw new Error("User ID and Contact ID are required to delete a contact.");
  }
  try {
    const contactDoc = doc(db, "users", userId, "contacts", contactId);
    await deleteDoc(contactDoc);
    console.log("Contact deleted successfully");
  } catch (error) {
    console.error("Error deleting contact: ", error);
    throw error;
  }
};

