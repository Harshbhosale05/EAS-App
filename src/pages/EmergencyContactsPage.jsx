


import React, { useState, useEffect } from 'react';
import { fetchEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../firestoreFunctions';
import { Trash2, Loader2, UserPlus, Phone, Heart } from "lucide-react";

const EmergencyContactsPage = ({ userId }) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch contacts when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      const loadContacts = async () => {
        setLoading(true);
        try {
          const userContacts = await fetchEmergencyContacts(userId);
          setContacts(userContacts);
        } catch (err) {
          setError('Failed to fetch contacts.');
        } finally {
          setLoading(false);
        }
      };
      loadContacts();
    }
  }, [userId]);

  const handleAddContact = async () => {
    if (!contactName || !contactPhone || !relation) {
      setError("All fields are required.");
      return;
    }
    setError('');
    setIsSubmitting(true);

    const newContact = {
      name: contactName,
      phone: contactPhone,
      relation,
    };

    try {
      await addEmergencyContact(userId, newContact);
      setContacts((prev) => [...prev, { id: Date.now().toString(), ...newContact }]); // Update locally
      setContactName('');
      setContactPhone('');
      setRelation('');
    } catch (err) {
      setError('Failed to add contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    setLoading(true);
    try {
      await deleteEmergencyContact(userId, contactId);
      setContacts(contacts.filter((contact) => contact.id !== contactId));
    } catch (err) {
      setError('Failed to delete contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="border rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Emergency Contacts</h1>

        {error && (
          <div className="mb-6 p-4 border border-red-500 bg-red-50 rounded text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <UserPlus className="text-gray-400" size={20} />
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Phone className="text-gray-400" size={20} />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone number"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Heart className="text-gray-400" size={20} />
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Relationship"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <button
            onClick={handleAddContact}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4 inline-block" />
            )}
            Add Contact
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Added Emergency Contacts</h3>
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-gray-500">No contacts added yet</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                    <p className="text-sm text-gray-500">{contact.relation}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsPage;
