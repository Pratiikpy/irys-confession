import React from 'react';
import { motion } from 'framer-motion';
import { Filter, TrendingUp, Clock, RefreshCw, Sparkles } from 'lucide-react';

const FilterBar = ({ activeFilter, onFilterChange, onRefresh }) => {
  const filters = [
    { 
      id: 'all', 
      label: 'All', 
      icon: Filter,
      description: 'Latest confessions' 
    },
    { 
      id: 'trending', 
      label: 'Trending', 
      icon: TrendingUp,
      description: 'Popular right now' 
    },
    { 
      id: 'recent', 
      label: 'Recent', 
      icon: Clock,
      description: 'Just posted' 
    },
    { 
      id: 'ai-enhanced', 
      label: 'AI Enhanced', 
      icon: Sparkles,
      description: 'AI-moderated content' 
    }
  ];

  return (
    <motion.div 
      className="filter-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="filter-container">
        <div className="filter-buttons">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`filter-button ${activeFilter === filter.id ? 'active' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={filter.description}
              >
                <Icon size={16} />
                <span>{filter.label}</span>
              </motion.button>
            );
          })}
        </div>
        
        <div className="filter-actions">
          <motion.button
            onClick={onRefresh}
            className="refresh-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;