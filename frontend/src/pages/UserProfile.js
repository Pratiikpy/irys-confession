import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Calendar, Heart, MessageCircle, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confessionAPI } from '../utils/api';

// Components
import ConfessionCard from '../components/confession/ConfessionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('confessions');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you'd have a user profile endpoint
      // For now, we'll simulate with current user data
      if (isOwnProfile && currentUser) {
        setUser(currentUser);
        
        // Fetch user's confessions
        const confessionsData = await confessionAPI.getPublic({
          limit: 50,
          author: currentUser.username
        });
        setConfessions(confessionsData.confessions || []);
      } else {
        setError('User profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (confessionId, voteType) => {
    try {
      await confessionAPI.vote(confessionId, {
        vote_type: voteType,
        user_address: currentUser?.id || 'anonymous'
      });
      
      // Update local state
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'confessions', label: 'Confessions', icon: MessageCircle },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award }
  ];

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-profile">
        <div className="page-header">
          <button 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
        
        <EmptyState
          title="Profile Not Found"
          description={error || "This user profile doesn't exist or isn't accessible."}
          action={{
            label: "Go Home",
            onClick: () => navigate('/')
          }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="user-profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="page-header">
        <button 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        
        {isOwnProfile && (
          <button 
            onClick={() => navigate('/settings')}
            className="settings-button"
          >
            <Settings size={16} />
            Settings
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-large">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <span>{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-name">{user.username}</h1>
          <p className="profile-bio">{user.bio || 'No bio available'}</p>
          
          <div className="profile-meta">
            <div className="meta-item">
              <Calendar size={16} />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
            
            {user.email && (
              <div className="meta-item">
                <span>{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MessageCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{user.stats?.confession_count || 0}</span>
            <span className="stat-label">Confessions</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Heart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{user.stats?.total_upvotes || 0}</span>
            <span className="stat-label">Upvotes</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{user.reputation?.score || 0}</span>
            <span className="stat-label">Reputation</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{user.stats?.follower_count || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'confessions' && (
          <div className="confessions-list">
            {confessions.length > 0 ? (
              confessions.map((confession, index) => (
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
              ))
            ) : (
              <EmptyState
                title="No confessions yet"
                description={isOwnProfile ? "You haven't posted any confessions yet." : "This user hasn't posted any confessions yet."}
                action={isOwnProfile ? {
                  label: "Create Your First Confession",
                  onClick: () => document.querySelector('.fab')?.click()
                } : null}
              />
            )}
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="stats-content">
            <div className="stats-detailed">
              <h3>Detailed Statistics</h3>
              <div className="stats-list">
                <div className="stats-item">
                  <span className="stats-label">Total Confessions:</span>
                  <span className="stats-value">{user.stats?.confession_count || 0}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Total Upvotes:</span>
                  <span className="stats-value">{user.stats?.total_upvotes || 0}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Total Downvotes:</span>
                  <span className="stats-value">{user.stats?.total_downvotes || 0}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Reputation Score:</span>
                  <span className="stats-value">{user.reputation?.score || 0}</span>
                </div>
                <div className="stats-item">
                  <span className="stats-label">Reputation Level:</span>
                  <span className="stats-value">{user.reputation?.level || 'Newcomer'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="achievements-content">
            <div className="achievements-grid">
              {user.reputation?.badges && user.reputation.badges.length > 0 ? (
                user.reputation.badges.map((badge, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">
                      <Award size={32} />
                    </div>
                    <div className="achievement-content">
                      <h4 className="achievement-title">{badge.name}</h4>
                      <p className="achievement-description">{badge.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No achievements yet"
                  description="Keep contributing to earn achievements and badges!"
                  size="small"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserProfile;