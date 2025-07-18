import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ 
  title, 
  description, 
  action, 
  illustration = "/assets/irys-tech-interface.jpg",
  size = "medium" 
}) => {
  const sizeClasses = {
    small: "empty-state-small",
    medium: "empty-state-medium", 
    large: "empty-state-large"
  };

  return (
    <motion.div 
      className={`empty-state ${sizeClasses[size]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-illustration">
        <img 
          src={illustration} 
          alt="Empty state" 
          className="empty-image"
        />
      </div>
      
      <div className="empty-content">
        <h3 className="empty-title">{title}</h3>
        <p className="empty-description">{description}</p>
        
        {action && (
          <motion.button
            className="empty-action btn-primary"
            onClick={action.onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {action.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;