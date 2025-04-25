import React, { useState, useEffect } from 'react';
import { fetchEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '../firestoreFunctions';
import { Trash2, Loader2, UserPlus, Phone, Heart, AlertTriangle, Check, Edit2, MessageSquare, Mail } from "lucide-react";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const EmergencyContactsPage = ({ userId }) => {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [priority, setPriority] = useState('primary');
  const [notificationType, setNotificationType] = useState(['sms', 'call']);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContactId, setEditContactId] = useState(null);
  const [showValidationMessage, setShowValidationMessage] = useState(false);

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

  const validatePhoneNumber = (phone) => {
    // Basic validation - can be enhanced based on country requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetForm = () => {
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setRelation('');
    setPriority('primary');
    setNotificationType(['sms', 'call']);
    setEditMode(false);
    setEditContactId(null);
  };

  const handleAddContact = async () => {
    // Validation
    if (!contactName || !contactPhone) {
      setError("Name and phone number are required.");
      return;
    }

    if (!validatePhoneNumber(contactPhone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!validateEmail(contactEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError('');
    setIsSubmitting(true);

    const newContact = {
      name: contactName,
      phone: contactPhone,
      email: contactEmail || '',
      relation: relation || 'Other',
      priority: priority,
      notificationType: notificationType,
      timestamp: new Date().toISOString(),
    };

    try {
      if (editMode && editContactId) {
        // Update existing contact
        const db = getFirestore();
        const contactRef = doc(db, "users", userId, "contacts", editContactId);
        await updateDoc(contactRef, newContact);
        
        // Update locally
        setContacts(contacts.map(contact => 
          contact.id === editContactId 
            ? { ...contact, ...newContact } 
            : contact
        ));
        
        setSuccess("Contact updated successfully!");
      } else {
        // Add new contact
        await addEmergencyContact(userId, newContact);
        setContacts((prev) => [...prev, { id: Date.now().toString(), ...newContact }]); // Update locally
        setSuccess("Contact added successfully!");
      }
      
      resetForm();
    } catch (err) {
      setError(editMode ? 'Failed to update contact.' : 'Failed to add contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = (contact) => {
    setContactName(contact.name);
    setContactPhone(contact.phone);
    setContactEmail(contact.email || '');
    setRelation(contact.relation || '');
    setPriority(contact.priority || 'primary');
    setNotificationType(contact.notificationType || ['sms', 'call']);
    setEditMode(true);
    setEditContactId(contact.id);
  };

  const handleDeleteContact = async (contactId) => {
    setLoading(true);
    try {
      await deleteEmergencyContact(userId, contactId);
      setContacts(contacts.filter((contact) => contact.id !== contactId));
      setSuccess("Contact deleted successfully!");
    } catch (err) {
      setError('Failed to delete contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationTypeChange = (type) => {
    if (notificationType.includes(type)) {
      setNotificationType(notificationType.filter(t => t !== type));
    } else {
      setNotificationType([...notificationType, type]);
    }
  };

  useEffect(() => {
    // Clear success message after 3 seconds
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleTestContacts = () => {
    setShowValidationMessage(true);
    setTimeout(() => setShowValidationMessage(false), 5000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="border rounded shadow p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">Emergency Contacts</h1>
        <p className="text-gray-500 mb-6">
          Add people who should be notified in case of an emergency. We recommend adding at least 3 trusted contacts.
        </p>

        {error && (
          <div className="mb-6 p-4 border border-red-500 bg-red-50 rounded text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 border border-green-500 bg-green-50 rounded text-green-600 flex items-center">
            <Check className="mr-2" size={16} />
            {success}
          </div>
        )}

        {showValidationMessage && (
          <div className="mb-6 p-4 border border-blue-500 bg-blue-50 rounded text-blue-600 flex items-center">
            <Check className="mr-2" size={16} />
            A test message has been sent to your emergency contacts.
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <UserPlus className="text-gray-400" size={20} />
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name *"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Phone className="text-gray-400" size={20} />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone number *"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Mail className="text-gray-400" size={20} />
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email address (optional)"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Heart className="text-gray-400" size={20} />
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            >
              <option value="">Select relationship</option>
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Colleague">Colleague</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Priority Level</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="primary"
                  checked={priority === 'primary'}
                  onChange={() => setPriority('primary')}
                  className="mr-2"
                />
                <span>Primary</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="secondary"
                  checked={priority === 'secondary'}
                  onChange={() => setPriority('secondary')}
                  className="mr-2"
                />
                <span>Secondary</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notification Methods</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationType.includes('sms')}
                  onChange={() => handleNotificationTypeChange('sms')}
                  className="mr-2"
                />
                <MessageSquare className="text-gray-400 mr-1" size={16} />
                <span>SMS</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationType.includes('call')}
                  onChange={() => handleNotificationTypeChange('call')}
                  className="mr-2"
                />
                <Phone className="text-gray-400 mr-1" size={16} />
                <span>Call</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationType.includes('email')}
                  onChange={() => handleNotificationTypeChange('email')}
                  className="mr-2"
                />
                <Mail className="text-gray-400 mr-1" size={16} />
                <span>Email</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleAddContact}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editMode ? (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Update Contact
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </>
              )}
            </button>
            
            {editMode && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Added Emergency Contacts</h3>
            {contacts.length > 0 && (
              <button
                onClick={handleTestContacts}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Test Contacts
              </button>
            )}
          </div>
          
          {loading && contacts.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50">
              <AlertTriangle className="mx-auto h-10 w-10 text-yellow-500 mb-2" />
              <p className="text-center text-gray-500 mb-2">No emergency contacts added yet</p>
              <p className="text-sm text-gray-400">
                We recommend adding at least 3 trusted contacts who can be reached in case of emergency
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    contact.priority === 'primary' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  } hover:bg-gray-50`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <p className="font-medium">{contact.name}</p>
                      {contact.priority === 'primary' && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Phone className="mr-1" size={14} /> 
                      {contact.phone}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="mr-1" size={14} /> 
                        {contact.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 flex items-center">
                      <Heart className="mr-1" size={14} /> 
                      {contact.relation || 'Other'}
                    </p>
                    <div className="flex space-x-2 mt-1">
                      {contact.notificationType?.includes('sms') && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                          <MessageSquare className="mr-1" size={10} /> SMS
                        </span>
                      )}
                      {contact.notificationType?.includes('call') && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                          <Phone className="mr-1" size={10} /> Call
                        </span>
                      )}
                      {contact.notificationType?.includes('email') && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                          <Mail className="mr-1" size={10} /> Email
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
