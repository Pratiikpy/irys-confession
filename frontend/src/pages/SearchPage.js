import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, Hash, Calendar, User, Sparkles } from 'lucide-react';
import { confessionAPI, analyticsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Components
import ConfessionCard from '../components/confession/ConfessionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    mood: '',
    tags: [],
    author: '',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchTrendingTags();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const fetchTrendingTags = async () => {
    try {
      const data = await analyticsAPI.getTrendingTags(10);
      setTrendingTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (searchQuery) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchParams = {
        query: query.trim(),
        mood: filters.mood || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        author: filters.author || undefined,
        date_from: getDateFromRange(filters.dateRange),
        date_to: filters.dateRange === 'today' ? new Date() : undefined,
        sort_by: 'timestamp',
        order: 'desc'
      };

      const data = await confessionAPI.search(searchParams);
      setResults(data.confessions || []);
      
      // Save to recent searches
      saveRecentSearch(query.trim());
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getDateFromRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  };

  const handleVote = async (confessionId, voteType) => {
    try {
      await confessionAPI.vote(confessionId, {
        vote_type: voteType,
        user_address: user?.id || 'anonymous'
      });
      
      // Update local state
      setResults(prev => 
        prev.map(confession => 
          confession.id === confessionId || confession.tx_id === confessionId
            ? {
                ...confession,
                upvotes: voteType === 'upvote' ? confession.upvotes + 1 : confession.upvotes,
                downvotes: voteType === 'downvote' ? confession.downvotes + 1 : confession.downvotes
              }
            : confession
        )
      );
    } catch (err) {
      console.error('Error voting:', err);
      throw err;
    }
  };

  const handleTagClick = (tag) => {
    setQuery(`#${tag}`);
  };

  const handleRecentSearchClick = (searchQuery) => {
    setQuery(searchQuery);
  };

  const clearFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'tags' ? [] : ''
    }));
  };

  const addTag = (tag) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const hasActiveFilters = filters.mood || filters.tags.length > 0 || filters.author || filters.dateRange !== 'all';

  return (
    <motion.div 
      className="search-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Search Header */}
      <div className="search-header">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search confessions..."
              className="search-input"
              data-search-input
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="clear-search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            {hasActiveFilters && <span className="filter-indicator" />}
          </button>
        </div>

        {/* Search Filters */}
        {showFilters && (
          <motion.div
            className="search-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-row">
              <div className="filter-group">
                <label>Mood</label>
                <select
                  value={filters.mood}
                  onChange={(e) => setFilters(prev => ({ ...prev, mood: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Moods</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="anxious">Anxious</option>
                  <option value="angry">Angry</option>
                  <option value="excited">Excited</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Author</label>
                <input
                  type="text"
                  value={filters.author}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Username"
                  className="filter-input"
                />
              </div>
            </div>
            
            {/* Active Tags */}
            {filters.tags.length > 0 && (
              <div className="active-tags">
                <span className="tags-label">Tags:</span>
                <div className="tags-list">
                  {filters.tags.map(tag => (
                    <div key={tag} className="active-tag">
                      <span>#{tag}</span>
                      <button onClick={() => removeTag(tag)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ mood: '', tags: [], author: '', dateRange: 'all' })}
                className="clear-filters"
              >
                Clear All Filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Search Content */}
      <div className="search-content">
        {!query.trim() ? (
          <div className="search-suggestions">
            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <div className="suggestions-section">
                <h3 className="suggestions-title">
                  <Hash size={20} />
                  Trending Topics
                </h3>
                <div className="trending-tags">
                  {trendingTags.map(tag => (
                    <button
                      key={tag.tag}
                      onClick={() => handleTagClick(tag.tag)}
                      className="trending-tag"
                    >
                      <span>#{tag.tag}</span>
                      <span className="tag-count">{tag.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="suggestions-section">
                <h3 className="suggestions-title">
                  <Calendar size={20} />
                  Recent Searches
                </h3>
                <div className="recent-searches">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="recent-search"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search Tips */}
            <div className="suggestions-section">
              <h3 className="suggestions-title">
                <Sparkles size={20} />
                Search Tips
              </h3>
              <div className="search-tips">
                <div className="tip-item">
                  <strong>Use hashtags:</strong> #love #life #work
                </div>
                <div className="tip-item">
                  <strong>Search by mood:</strong> happy, sad, anxious
                </div>
                <div className="tip-item">
                  <strong>Find by author:</strong> @username
                </div>
                <div className="tip-item">
                  <strong>Use quotes:</strong> "exact phrase"
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="search-results">
            {/* Results Header */}
            <div className="results-header">
              <h2 className="results-title">
                Search Results for "{query}"
              </h2>
              <span className="results-count">
                {loading ? 'Searching...' : `${results.length} results`}
              </span>
            </div>
            
            {/* Results List */}
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner size="large" />
                <p className="loading-text">Searching confessions...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-list">
                {results.map((confession, index) => (
                  <motion.div
                    key={confession.id || confession.tx_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ConfessionCard
                      confession={confession}
                      onVote={handleVote}
                      showActions={true}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No results found"
                description={`No confessions found matching "${query}". Try different keywords or adjust your filters.`}
                action={{
                  label: "Clear Search",
                  onClick: () => setQuery('')
                }}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPage;