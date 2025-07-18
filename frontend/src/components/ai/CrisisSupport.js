import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, MessageCircle, ExternalLink, X, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';

const CrisisSupport = ({ isVisible, onClose, level = 'medium' }) => {
  const resources = [
    {
      name: 'Crisis Text Line',
      description: 'Free, confidential support 24/7',
      contact: 'Text HOME to 741741',
      icon: MessageCircle,
      type: 'text',
      url: 'https://www.crisistextline.org/'
    },
    {
      name: 'National Suicide Prevention Lifeline',
      description: 'Free and confidential emotional support',
      contact: 'Call 988',
      icon: Phone,
      type: 'call',
      url: 'https://suicidepreventionlifeline.org/'
    },
    {
      name: 'Crisis Chat',
      description: 'Online chat support',
      contact: 'Chat Now',
      icon: MessageCircle,
      type: 'chat',
      url: 'https://suicidepreventionlifeline.org/chat/'
    },
    {
      name: 'International Association for Suicide Prevention',
      description: 'Global crisis resources',
      contact: 'Find Local Help',
      icon: ExternalLink,
      type: 'link',
      url: 'https://www.iasp.info/resources/Crisis_Centres/'
    }
  ];

  const getTitle = () => {
    switch (level) {
      case 'critical':
        return 'Immediate Support Available';
      case 'high':
        return 'Help is Available';
      case 'medium':
        return 'You Are Not Alone';
      default:
        return 'Support Resources';
    }
  };

  const getMessage = () => {
    switch (level) {
      case 'critical':
        return 'If you are in immediate danger, please contact emergency services (911) or go to your nearest emergency room.';
      case 'high':
        return 'We noticed your message might indicate you\'re going through a difficult time. Please know that help is available and you don\'t have to face this alone.';
      case 'medium':
        return 'It takes courage to share your feelings. If you need someone to talk to, these resources are here to help.';
      default:
        return 'Professional support is available 24/7 if you need someone to talk to.';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <Modal isOpen={isVisible} onClose={onClose}>
          <motion.div
            className={`crisis-support ${level}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="crisis-header">
              <div className="crisis-icon">
                <Heart size={24} />
              </div>
              <h2 className="crisis-title">{getTitle()}</h2>
              <button onClick={onClose} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {/* Message */}
            <div className="crisis-message">
              <p>{getMessage()}</p>
            </div>

            {/* Emergency Notice */}
            {level === 'critical' && (
              <motion.div
                className="emergency-notice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <AlertTriangle size={20} />
                <div>
                  <strong>Emergency:</strong> If you are in immediate danger, call 911 or go to your nearest emergency room.
                </div>
              </motion.div>
            )}

            {/* Resources */}
            <div className="crisis-resources">
              <h3>Available Resources</h3>
              <div className="resources-grid">
                {resources.map((resource, index) => (
                  <motion.div
                    key={resource.name}
                    className="resource-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <div className="resource-icon">
                      <resource.icon size={20} />
                    </div>
                    <div className="resource-content">
                      <h4 className="resource-name">{resource.name}</h4>
                      <p className="resource-description">{resource.description}</p>
                      <div className="resource-contact">
                        <strong>{resource.contact}</strong>
                      </div>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Additional Support */}
            <div className="additional-support">
              <h3>Remember</h3>
              <ul className="support-list">
                <li>You are not alone in this</li>
                <li>Your feelings are valid and temporary</li>
                <li>Professional help is available 24/7</li>
                <li>Many people have felt this way and found help</li>
                <li>Treatment and support can make a difference</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="crisis-actions">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Continue to Post
              </button>
              <a
                href="https://suicidepreventionlifeline.org/chat/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageCircle size={16} />
                Get Help Now
              </a>
            </div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default CrisisSupport;