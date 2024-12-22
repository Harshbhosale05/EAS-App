import React, { useState } from 'react';
import { FaHome, FaMapMarkerAlt, FaPhoneAlt, FaCog } from 'react-icons/fa'; // FontAwesome icons
import { Link, useNavigate } from 'react-router-dom'; // Link and navigation
import { getAuth, signOut } from 'firebase/auth'; // Firebase auth

const Footer = () => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        navigate('/'); // Redirect to the homepage
      })
      .catch((error) => {
        console.error('Error signing out:', error.message);
      });
  };

  return (
    <div style={styles.footerContainer}>
      {/* Navigation Links */}
      <Link to="/home" style={styles.footerItem}>
        <FaHome size={24} />
        <span>Home</span>
      </Link>
      <Link to="/trip" style={styles.footerItem}>
        <FaMapMarkerAlt size={24} />
        <span>Trip</span>
      </Link>
      <Link to="/contacts" style={styles.footerItem}>
        <FaPhoneAlt size={24} />
        <span>Contacts</span>
      </Link>
      <div
        style={styles.footerItem}
        onClick={() => setShowSettingsMenu(!showSettingsMenu)} // Toggle settings menu
      >
        <FaCog size={24} />
        <span>Settings</span>
      </div>

      {/* Dropdown Menu for Settings */}
      {showSettingsMenu && (
        <div style={styles.settingsMenu}>
          <button style={styles.settingsButton} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  footerContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#f1f1f1',
    padding: '10px 0',
    position: 'fixed',
    bottom: 0,
    width: '100%',
    borderTop: '1px solid #ddd',
  },
  footerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    textDecoration: 'none', // Remove underline from the link
    color: 'black', // Ensure the text color is visible
  },
  settingsMenu: {
    position: 'absolute',
    bottom: '50px',
    right: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    zIndex: 1000,
  },
  settingsButton: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#f1f1f1',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '100%',
    textAlign: 'left',
  },
};

export default Footer;
