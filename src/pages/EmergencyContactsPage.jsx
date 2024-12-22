// import React, { useState } from 'react';
// import { addEmergencyContact } from '../firestoreFunctions'; // Ensure this path is correct

// const EmergencyContactsPage = ({ userId }) => {
//   const [contactName, setContactName] = useState('');
//   const [contactPhone, setContactPhone] = useState('');
//   const [relation, setRelation] = useState('');

//   const handleAddContact = async () => {
//     const contact = { name: contactName, phone: contactPhone, relation };
//     await addEmergencyContact(userId, contact);
//     setContactName('');
//     setContactPhone('');
//     setRelation('');
//   };

//   return (
//     <div>
//       <h2>Emergency Contacts</h2>
//       <div>
//         <label>Name</label>
//         <input 
//           value={contactName}
//           onChange={(e) => setContactName(e.target.value)}
//           placeholder="Enter contact name"
//           type="text"
//         />
//       </div>
//       <div>
//         <label>Phone</label>
//         <input 
//           value={contactPhone}
//           onChange={(e) => setContactPhone(e.target.value)}
//           placeholder="Enter contact phone"
//           type="text"
//         />
//       </div>
//       <div>
//         <label>Relation</label>
//         <input 
//           value={relation}
//           onChange={(e) => setRelation(e.target.value)}
//           placeholder="Enter relation to contact"
//           type="text"
//         />
//       </div>
//       <button onClick={handleAddContact}>Add Contact</button>
//     </div>
//   );
// };

// export default EmergencyContactsPage;








import React, { useState, useEffect } from 'react';
import { addEmergencyContact } from '../firestoreFunctions';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../firebase';

const db = getFirestore(app);

const EmergencyContactsPage = ({ userId }) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      if (!userId) {
        setError("User ID is not provided.");
        return;
      }
      setLoading(true);
      try {
        const contactsSnapshot = await getDocs(collection(db, 'users', userId, 'contacts'));
        const contactsList = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContacts(contactsList);
      } catch (err) {
        setError("Failed to fetch contacts.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [userId]);

  const handleAddContact = async () => {
    if (!contactName || !contactPhone || !relation) {
      setError("All fields are required.");
      return;
    }
    setError('');
    try {
      const contact = { name: contactName, phone: contactPhone, relation };
      await addEmergencyContact(userId, contact);
      setContacts(prev => [...prev, { ...contact, id: Date.now().toString() }]); // Temporary ID until fetched
      setContactName('');
      setContactPhone('');
      setRelation('');
    } catch (err) {
      setError("Failed to add contact.");
      console.error(err);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'contacts', contactId));
      setContacts(contacts.filter(contact => contact.id !== contactId));
    } catch (err) {
      setError("Failed to delete contact.");
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Emergency Contacts</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>Name</label>
        <input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Enter contact name"
          type="text"
        />
      </div>
      <div>
        <label>Phone</label>
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Enter contact phone"
          type="text"
        />
      </div>
      <div>
        <label>Relation</label>
        <input
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Enter relation to contact"
          type="text"
        />
      </div>
      <button onClick={handleAddContact}>Add Contact</button>

      <div>
        <h3>Added Emergency Contacts</h3>
        {loading ? (
          <p>Loading contacts...</p>
        ) : (
          <ul>
            {contacts.map(contact => (
              <li key={contact.id}>
                <span>{contact.name} - {contact.phone} - {contact.relation}</span>
                <button onClick={() => handleDeleteContact(contact.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmergencyContactsPage;
