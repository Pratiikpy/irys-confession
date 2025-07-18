import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, MessageCircle, Heart, Hash, Calendar, Globe } from 'lucide-react';
import { analyticsAPI } from '../utils/api';

// Components
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, tagsData] = await Promise.all([
        analyticsAPI.getStats(),
        analyticsAPI.getTrendingTags(20)
      ]);
      
      setStats(statsData);
      setTrendingTags(tagsData.tags || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const getGrowthIndicator = (current, previous) => {
    if (!previous || previous === 0) return null;
    const growth = ((current - previous) / previous) * 100;
    return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <p className="loading-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="analytics-page">
        <EmptyState
          title="Analytics Unavailable"
          description={error || "Unable to load analytics data at this time."}
          action={{
            label: "Try Again",
            onClick: fetchAnalytics
          }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="analytics-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="page-title">
            <BarChart3 size={32} />
            Platform Analytics
          </h1>
          <p className="page-description">
            Real-time insights into platform activity and engagement
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="metric-icon">
            <MessageCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.total_confessions)}</div>
            <div className="metric-label">Total Confessions</div>
            <div className="metric-growth">
              {stats.last_24h?.confessions && (
                <span className="growth-indicator positive">
                  +{stats.last_24h.confessions} today
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.total_users)}</div>
            <div className="metric-label">Total Users</div>
            <div className="metric-growth">
              {stats.last_24h?.new_users && (
                <span className="growth-indicator positive">
                  +{stats.last_24h.new_users} today
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="metric-icon">
            <Globe size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.public_confessions)}</div>
            <div className="metric-label">Public Confessions</div>
            <div className="metric-growth">
              <span className="growth-indicator neutral">
                {Math.round((stats.public_confessions / stats.total_confessions) * 100)}% public
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="metric-icon">
            <Hash size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatNumber(stats.total_replies)}</div>
            <div className="metric-label">Total Replies</div>
            <div className="metric-growth">
              <span className="growth-indicator neutral">
                {stats.total_confessions > 0 ? 
                  (stats.total_replies / stats.total_confessions).toFixed(1) : 0
                } avg per confession
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className="analytics-content">
        {/* Mood Distribution */}
        <motion.div
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="section-header">
            <h3 className="section-title">Mood Distribution</h3>
            <p className="section-description">Most common emotional states in confessions</p>
          </div>
          
          <div className="mood-chart">
            {stats.mood_distribution && stats.mood_distribution.length > 0 ? (
              <div className="mood-bars">
                {stats.mood_distribution.map((mood, index) => (
                  <div key={mood._id} className="mood-bar-container">
                    <div className="mood-info">
                      <span className="mood-name">{mood._id || 'Unknown'}</span>
                      <span className="mood-count">{mood.count}</span>
                    </div>
                    <div className="mood-bar">
                      <div
                        className="mood-fill"
                        style={{
                          width: `${(mood.count / stats.mood_distribution[0].count) * 100}%`,
                          backgroundColor: getMoodColor(mood._id)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart">
                <p>No mood data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Trending Tags */}
        <motion.div
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="section-header">
            <h3 className="section-title">Trending Tags</h3>
            <p className="section-description">Most popular tags in the last 7 days</p>
          </div>
          
          <div className="trending-tags-grid">
            {trendingTags.length > 0 ? (
              trendingTags.map((tag, index) => (
                <motion.div
                  key={tag.tag}
                  className="trending-tag-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                >
                  <div className="tag-rank">#{index + 1}</div>
                  <div className="tag-content">
                    <div className="tag-name">#{tag.tag}</div>
                    <div className="tag-stats">
                      <span className="tag-count">{formatNumber(tag.count)} posts</span>
                      <TrendingUp size={16} className="trending-icon" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-tags">
                <p>No trending tags available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Platform Health */}
        <motion.div
          className="analytics-section full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <div className="section-header">
            <h3 className="section-title">Platform Health</h3>
            <p className="section-description">Real-time platform status and performance</p>
          </div>
          
          <div className="health-metrics">
            <div className="health-item">
              <div className="health-icon">
                <div className="status-dot connected" />
              </div>
              <div className="health-content">
                <div className="health-label">System Status</div>
                <div className="health-value">Operational</div>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                <Globe size={20} />
              </div>
              <div className="health-content">
                <div className="health-label">Irys Network</div>
                <div className="health-value">Connected</div>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                <BarChart3 size={20} />
              </div>
              <div className="health-content">
                <div className="health-label">API Response</div>
                <div className="health-value">< 100ms</div>
              </div>
            </div>
            
            <div className="health-item">
              <div className="health-icon">
                <Users size={20} />
              </div>
              <div className="health-content">
                <div className="health-label">Active Users</div>
                <div className="health-value">{formatNumber(stats.last_24h?.new_users || 0)}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const getMoodColor = (mood) => {
  const colors = {
    happy: '#fbbf24',
    sad: '#60a5fa',
    anxious: '#a78bfa',
    angry: '#f87171',
    excited: '#34d399',
    frustrated: '#fb7185',
    hopeful: '#22d3ee',
    neutral: '#6b7280'
  };
  return colors[mood] || colors.neutral;
};

export default AnalyticsPage;