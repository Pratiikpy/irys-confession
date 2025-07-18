import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Frown, Meh, Zap, Heart, AlertCircle, Sun, Cloud } from 'lucide-react';

const MoodIndicator = ({ mood, size = 'small', showLabel = true }) => {
  const moodConfig = {
    happy: {
      icon: Smile,
      color: '#fbbf24',
      label: 'Happy',
      gradient: 'from-yellow-400 to-orange-400'
    },
    sad: {
      icon: Frown,
      color: '#60a5fa',
      label: 'Sad',
      gradient: 'from-blue-400 to-blue-600'
    },
    anxious: {
      icon: AlertCircle,
      color: '#a78bfa',
      label: 'Anxious',
      gradient: 'from-purple-400 to-purple-600'
    },
    angry: {
      icon: Zap,
      color: '#f87171',
      label: 'Angry',
      gradient: 'from-red-400 to-red-600'
    },
    excited: {
      icon: Sun,
      color: '#34d399',
      label: 'Excited',
      gradient: 'from-green-400 to-emerald-500'
    },
    frustrated: {
      icon: Cloud,
      color: '#fb7185',
      label: 'Frustrated',
      gradient: 'from-pink-400 to-pink-600'
    },
    hopeful: {
      icon: Heart,
      color: '#22d3ee',
      label: 'Hopeful',
      gradient: 'from-cyan-400 to-cyan-600'
    },
    neutral: {
      icon: Meh,
      color: '#6b7280',
      label: 'Neutral',
      gradient: 'from-gray-400 to-gray-600'
    }
  };

  const config = moodConfig[mood] || moodConfig.neutral;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'mood-indicator-small',
    medium: 'mood-indicator-medium',
    large: 'mood-indicator-large'
  };

  return (
    <motion.div
      className={`mood-indicator ${sizeClasses[size]}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ '--mood-color': config.color }}
    >
      <div className="mood-icon">
        <Icon size={size === 'large' ? 24 : size === 'medium' ? 20 : 16} />
      </div>
      {showLabel && (
        <span className="mood-label">{config.label}</span>
      )}
    </motion.div>
  );
};

export default MoodIndicator;