import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { confessionAPI } from '../utils/api';

// Components
import ConfessionCard from '../components/confession/ConfessionCard';
import FilterBar from '../components/layout/FilterBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import WelcomeSection from '../components/home/WelcomeSection';
import EmptyState from '../components/common/EmptyState';

const HomePage = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(null);
  
  const { isAuthenticated, user } = useAuth();
  const { liveUpdates, clearUpdates } = useWebSocket();

  useEffect(() => {
    fetchConfessions();
  }, [activeFilter]);

  useEffect(() => {
    // Handle real-time updates
    if (liveUpdates.length > 0) {
      const confessionUpdates = liveUpdates.filter(update => 
        update.type === 'confession' && activeFilter === 'all'
      );
      
      if (confessionUpdates.length > 0) {
        confessionUpdates.forEach(update => {
          setConfessions(prev => [update.data, ...prev]);
        });
        clearUpdates();
      }
    }
  }, [liveUpdates, activeFilter, clearUpdates]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (activeFilter === 'trending') {
        data = await confessionAPI.getTrending({ limit: 20 });
      } else {
        data = await confessionAPI.getPublic({ limit: 50 });
      }
      
      setConfessions(data.confessions || []);
    } catch (err) {
      console.error('Error fetching confessions:', err);
      setError('Failed to load confessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (confessionId, voteType) => {
    try {
      await confessionAPI.vote(confessionId, {
        vote_type: voteType,
        user_address: user?.id || 'anonymous'
      });
      
      // Update local state immediately for better UX
      setConfessions(prev => 
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

  const handleRefresh = () => {
    fetchConfessions();
  };

  return (
    <div className="home-page">
      {/* Welcome Section for new users */}
      {!isAuthenticated && (
        <WelcomeSection />
      )}

      {/* Filter Bar */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={handleRefresh}
      />

      {/* Confessions Feed */}
      <div className="confessions-feed">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p className="loading-text">Loading confessions...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        ) : confessions.length === 0 ? (
          <EmptyState
            title="No confessions yet"
            description="Be the first to share your thoughts with the world"
            action={{
              label: "Create First Confession",
              onClick: () => {
                // This will be handled by the FloatingActionButton
                document.querySelector('.fab')?.click();
              }
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {confessions.map((confession, index) => (
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;