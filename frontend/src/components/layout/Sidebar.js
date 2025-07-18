import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash, BarChart3, Users, Globe } from 'lucide-react';
import { analyticsAPI } from '../../utils/api';

const Sidebar = () => {
  const [trendingTags, setTrendingTags] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      const [tagsData, statsData] = await Promise.all([
        analyticsAPI.getTrendingTags(10),
        analyticsAPI.getStats()
      ]);
      
      setTrendingTags(tagsData.tags || []);
      setPlatformStats(statsData);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
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
    return num.toString();
  };

  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Trending Topics */}
      <div className="sidebar-section">
        <div className="section-header">
          <TrendingUp size={20} />
          <h3>Trending Topics</h3>
        </div>
        
        <div className="trending-list">
          {loading ? (
            <div className="loading-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-tag" />
              ))}
            </div>
          ) : trendingTags.length > 0 ? (
            trendingTags.map((tag, index) => (
              <motion.button
                key={tag.tag}
                className="trending-tag"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  // Navigate to search with this tag
                  const searchModal = document.querySelector('[data-search-modal]');
                  if (searchModal) {
                    searchModal.click();
                    // Set the tag in search after a brief delay
                    setTimeout(() => {
                      const searchInput = document.querySelector('[data-search-input]');
                      if (searchInput) {
                        searchInput.value = `#${tag.tag}`;
                        searchInput.dispatchEvent(new Event('input'));
                      }
                    }, 100);
                  }
                }}
              >
                <Hash size={14} />
                <span className="tag-name">{tag.tag}</span>
                <span className="tag-count">{formatNumber(tag.count)}</span>
              </motion.button>
            ))
          ) : (
            <div className="empty-trending">
              <p>No trending topics yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="sidebar-section">
        <div className="section-header">
          <BarChart3 size={20} />
          <h3>Platform Stats</h3>
        </div>
        
        <div className="stats-grid">
          {loading ? (
            <div className="loading-skeleton">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-stat" />
              ))}
            </div>
          ) : platformStats ? (
            <>
              <div className="stat-item">
                <div className="stat-icon">
                  <Globe size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{formatNumber(platformStats.total_confessions)}</span>
                  <span className="stat-label">Confessions</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">
                  <Users size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{formatNumber(platformStats.total_users)}</span>
                  <span className="stat-label">Users</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">
                  <TrendingUp size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{formatNumber(platformStats.last_24h?.confessions || 0)}</span>
                  <span className="stat-label">Today</span>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">
                  <Hash size={16} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{formatNumber(platformStats.total_replies)}</span>
                  <span className="stat-label">Replies</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-stats">
              <p>Stats unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* Network Status */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="network-status">
            <div className="status-dot" />
            <span>Irys Network</span>
          </div>
        </div>
        
        <div className="network-info">
          <div className="network-item">
            <span className="network-label">Network:</span>
            <span className="network-value">Devnet</span>
          </div>
          <div className="network-item">
            <span className="network-label">Status:</span>
            <span className="network-value connected">Connected</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;