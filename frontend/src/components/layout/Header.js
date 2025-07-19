import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, Menu, X, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useWallet } from '../../contexts/WalletContext';
import AuthModal from '../auth/AuthModal';
import SearchModal from '../search/SearchModal';
import NotificationPanel from '../notifications/NotificationPanel';

const Header = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { isAuthenticated, user, logout } = useAuth();
  const { connected, liveUpdates } = useWebSocket();
  const { isConnected, address, connector } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const unreadNotifications = liveUpdates.filter(update => 
    update.type === 'crisis' || update.type === 'reply'
  ).length;

  return (
    <>
      <motion.header 
        className="app-header"
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="header-container">
          {/* Left Section - Logo & Navigation */}
          <div className="header-left">
            <Link to="/" className="logo-link">
              <div className="logo-container">
                <div className="irys-logo">
                  <img 
                    src="/assets/irys-blockchain-logo.jpg" 
                    alt="Irys" 
                    className="logo-image"
                  />
                </div>
                <span className="logo-text">Confessions</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/analytics" className="nav-link">
                Analytics
              </Link>
            </nav>
          </div>

          {/* Center Section - Search */}
          <div className="header-center">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="search-trigger"
            >
              <Search size={18} />
              <span className="search-placeholder">Search confessions...</span>
            </button>
          </div>

          {/* Right Section - Actions */}
          <div className="header-right">
            {/* WebSocket Status */}
            <div className="connection-status">
              <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
              <span className="status-text mobile-hidden">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="header-button"
                >
                  <Bell size={18} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">{unreadNotifications}</span>
                  )}
                </button>

                {/* User Menu */}
                <div className="user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="user-button"
                  >
                    <div className="user-avatar">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <span className="user-name mobile-hidden">{user?.username}</span>
                  </button>

                  {showUserMenu && (
                    <motion.div
                      className="user-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link 
                        to={`/user/${user?.username}`}
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        Profile
                      </Link>
                      <Link 
                        to="/settings"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item logout"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="auth-button"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="mobile-menu-button"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Link to="/" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              Home
            </Link>
            <Link to="/analytics" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              Analytics
            </Link>
            {!isAuthenticated && (
              <button 
                onClick={() => {
                  setShowAuthModal(true);
                  setShowMobileMenu(false);
                }}
                className="mobile-auth-button"
              >
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </motion.header>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel 
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};

export default Header;