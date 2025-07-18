import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', color = 'var(--accent)', className = '' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <motion.div
      className={`loading-spinner ${sizeClasses[size]} ${className}`}
      style={{ '--spinner-color': color }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <div className="spinner-ring" />
    </motion.div>
  );
};

export default LoadingSpinner;