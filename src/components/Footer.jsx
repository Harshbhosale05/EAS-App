import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, UserIcon, SettingsIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if user is in guardian mode
  const isGuardian = localStorage.getItem('guardianMode') === 'true';
  
  // Determine which nav items to show based on guardian mode
  const navItems = isGuardian 
    ? [
        { path: '/guardian-dashboard', icon: <HomeIcon size={20} />, label: 'Dashboard' },
        { path: '/profile', icon: <UserIcon size={20} />, label: 'Profile' },
      ]
    : [
        { path: '/home', icon: <HomeIcon size={20} />, label: 'Home' },
        { path: '/trip', icon: <MapPinIcon size={20} />, label: 'Trip' },
        { path: '/contacts', icon: <PhoneIcon size={20} />, label: 'Contacts' },
        { path: '/profile', icon: <UserIcon size={20} />, label: 'Profile' },
        { path: '/safety-settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
      ];

  return (
    <footer className="fixed-footer">
      <div className="max-w-7xl mx-auto">
        <nav className="footer-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`footer-nav-item ${
                currentPath === item.path 
                  ? 'footer-nav-item-active' 
                  : 'footer-nav-item-inactive'
              }`}
            >
              <div className="footer-nav-icon">
                {item.icon}
              </div>
              <span className="footer-nav-label">{item.label}</span>
              {currentPath === item.path && (
                <div className="footer-nav-indicator"></div>
              )}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
