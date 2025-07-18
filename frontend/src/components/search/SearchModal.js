import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Hash, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../utils/api';

// Components
import Modal from '../common/Modal';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchTrendingTags();
      loadRecentSearches();
    }
  }, [isOpen]);

  const fetchTrendingTags = async () => {
    try {
      const data = await analyticsAPI.getTrendingTags(8);
      setTrendingTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  };

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      // Navigate to search page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleTagClick = (tag) => {
    handleSearch(`#${tag}`);
  };

  const handleRecentSearchClick = (search) => {
    handleSearch(search);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <motion.div
        className="search-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Search size={20} />
            Search Confessions
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search confessions, tags, or users..."
              className="search-input"
              autoFocus
              data-search-modal
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="clear-search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            type="submit"
            className="search-submit"
            disabled={!query.trim()}
          >
            Search
          </button>
        </form>

        {/* Search Content */}
        <div className="search-content">
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div className="search-section">
              <h3 className="section-title">
                <TrendingUp size={16} />
                Trending Topics
              </h3>
              <div className="trending-tags">
                {trendingTags.map(tag => (
                  <motion.button
                    key={tag.tag}
                    onClick={() => handleTagClick(tag.tag)}
                    className="trending-tag"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Hash size={14} />
                    <span>{tag.tag}</span>
                    <span className="tag-count">{tag.count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="search-section">
              <div className="section-header">
                <h3 className="section-title">
                  <Clock size={16} />
                  Recent Searches
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="clear-recent"
                >
                  Clear All
                </button>
              </div>
              <div className="recent-searches">
                {recentSearches.map((search, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="recent-search"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Search size={14} />
                    <span>{search}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          <div className="search-section">
            <h3 className="section-title">Search Tips</h3>
            <div className="search-tips">
              <div className="tip">
                <strong>Use hashtags:</strong> #love #life #work
              </div>
              <div className="tip">
                <strong>Search by mood:</strong> happy, sad, anxious
              </div>
              <div className="tip">
                <strong>Find by author:</strong> @username
              </div>
              <div className="tip">
                <strong>Use quotes:</strong> "exact phrase"
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default SearchModal;