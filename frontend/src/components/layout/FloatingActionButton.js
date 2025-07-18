import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, MessageCircle, Search } from 'lucide-react';
import ComposeModal from '../confession/ComposeModal';

const FloatingActionButton = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: Edit,
      label: 'New Confession',
      action: () => setShowCompose(true),
      color: 'var(--accent)'
    },
    {
      icon: MessageCircle,
      label: 'Quick Reply',
      action: () => {
        // Find the latest confession and focus on its reply button
        const replyButton = document.querySelector('[data-reply-button]');
        if (replyButton) {
          replyButton.click();
        }
      },
      color: 'var(--success)'
    },
    {
      icon: Search,
      label: 'Search',
      action: () => {
        // Open search modal
        const searchTrigger = document.querySelector('[data-search-modal]');
        if (searchTrigger) {
          searchTrigger.click();
        }
      },
      color: 'var(--warning)'
    }
  ];

  return (
    <>
      <div className="fab-container">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fab-actions"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  className="fab-action"
                  style={{ backgroundColor: action.color }}
                  onClick={() => {
                    action.action();
                    setIsExpanded(false);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={action.label}
                >
                  <action.icon size={20} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className={`fab ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus size={24} />
        </motion.button>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
      />
    </>
  );
};

export default FloatingActionButton;