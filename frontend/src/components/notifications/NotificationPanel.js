import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Heart, MessageCircle, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const { liveUpdates, clearUpdates } = useWebSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Load notifications from localStorage
      const saved = localStorage.getItem('notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Process live updates into notifications
    if (liveUpdates.length > 0) {
      const newNotifications = liveUpdates.map(update => ({
        id: update.id,
        type: update.type,
        message: getNotificationMessage(update),
        timestamp: update.timestamp,
        read: false,
        data: update.data
      }));

      setNotifications(prev => {
        const updated = [...newNotifications, ...prev].slice(0, 50);
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
    }
  }, [liveUpdates]);

  const getNotificationMessage = (update) => {
    switch (update.type) {
      case 'new_confession':
        return 'New confession posted';
      case 'new_reply':
        return 'New reply to your confession';
      case 'vote':
        return 'Someone liked your confession';
      case 'crisis':
        return 'Crisis support resources available';
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_confession':
        return <MessageCircle size={20} />;
      case 'new_reply':
        return <MessageCircle size={20} />;
      case 'vote':
        return <Heart size={20} />;
      case 'crisis':
        return <AlertTriangle size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_confession':
        return 'var(--accent)';
      case 'new_reply':
        return 'var(--success)';
      case 'vote':
        return 'var(--error)';
      case 'crisis':
        return 'var(--warning)';
      default:
        return 'var(--muted)';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
    clearUpdates();
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="notification-panel"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="notification-header">
          <div className="header-left">
            <Bell size={20} />
            <span className="header-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="action-button">
                <CheckCircle size={16} />
                Mark all read
              </button>
            )}
            <button onClick={clearAllNotifications} className="action-button">
              <Trash2 size={16} />
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <Bell size={48} />
              <h3>No notifications</h3>
              <p>We'll notify you when something important happens</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>

                {!notification.read && (
                  <div className="unread-indicator" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="delete-notification"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPanel;