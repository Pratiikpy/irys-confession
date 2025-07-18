import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Plus, ExternalLink, X, Filter, TrendingUp, Clock } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Confession Card Component
const ConfessionCard = ({ confession, onVote }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.upvotes || 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    try {
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
      
      if (onVote) {
        await onVote(confession.tx_id, newLiked ? 'upvote' : 'downvote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/#/c/${confession.tx_id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="confession-card">
      <div className="confession-content">
        <p className="confession-text">{confession.content}</p>
        
        <div className="confession-meta">
          <time className="confession-time">
            {formatDate(confession.timestamp)}
          </time>
          
          <div className="confession-badges">
            {confession.verified && (
              <div className="verified-badge">
                <div className="verified-dot"></div>
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>

        <div className="confession-actions">
          <div className="vote-actions">
            <button
              onClick={handleLike}
              className={`vote-button ${liked ? 'liked' : ''}`}
            >
              <Heart className={`vote-icon ${liked ? 'filled' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button className="action-button">
              <MessageCircle className="action-icon" />
              <span>Reply</span>
            </button>
          </div>

          <div className="share-actions">
            <button onClick={handleShare} className="share-button">
              <Share2 className="share-icon" />
            </button>
            
            <a
              href={confession.gateway_url}
              target="_blank"
              rel="noopener noreferrer"
              className="external-button"
            >
              <ExternalLink className="external-icon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compose Modal Component
const ComposeModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_CHARS = 280;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter a confession');
      return;
    }

    if (content.length > MAX_CHARS) {
      alert(`Confession must be ${MAX_CHARS} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API}/confessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          is_public: isPublic,
          author: 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit confession');
      }

      const result = await response.json();
      
      alert('🎉 Confession posted successfully!');
      onSubmit(result);
      setContent('');
      setIsPublic(true);
      onClose();
      
    } catch (error) {
      console.error('Error submitting confession:', error);
      alert('Failed to post confession');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Confession</h2>
          <button onClick={onClose} className="modal-close">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="textarea-container">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts anonymously..."
              className="confession-textarea"
              maxLength={MAX_CHARS}
            />
            <div className="char-count">
              {content.length}/{MAX_CHARS}
            </div>
          </div>

          <div className="public-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-text">Make public</span>
            </label>
            
            <div className="toggle-description">
              {isPublic ? 'Everyone can see this' : 'Only you have the link'}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="submit-button"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Filter Bar Component
const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock }
  ];

  return (
    <div className="filter-bar">
      {filters.map(filter => {
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`filter-button ${activeFilter === filter.id ? 'active' : ''}`}
          >
            <Icon className="filter-icon" />
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="irys-logo">🌐</div>
        </div>
        
        <div className="header-center">
          <h1 className="app-title">Confessions</h1>
        </div>
        
        <div className="header-right">
          {/* Future: Profile, Share, etc. */}
        </div>
      </div>
    </header>
  );
};

// Floating Action Button
const Fab = ({ onClick }) => {
  return (
    <button onClick={onClick} className="fab">
      <Plus className="fab-icon" />
    </button>
  );
};

// Main App Component
function App() {
  const [confessions, setConfessions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    fetchNetworkInfo();
    fetchConfessions();
  }, [activeFilter]);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch(`${API}/irys/network-info`);
      if (response.ok) {
        const data = await response.json();
        setNetworkInfo(data);
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      let endpoint = `${API}/confessions/public?limit=50`;
      
      if (activeFilter === 'trending') {
        endpoint = `${API}/trending?limit=20`;
      }
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setConfessions(data.confessions || data);
      }
    } catch (error) {
      console.error('Error fetching confessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConfession = (newConfession) => {
    // Add to the beginning of the list
    setConfessions(prev => [newConfession, ...prev]);
    setIsModalOpen(false);
  };

  const handleVote = async (txId, voteType) => {
    try {
      const response = await fetch(`${API}/confessions/${txId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote_type: voteType,
          user_address: 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // Refresh confessions to get updated vote counts
      fetchConfessions();
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <FilterBar 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        
        {networkInfo && (
          <div className="network-info">
            <span className="network-badge">
              🌐 {networkInfo.network} network
            </span>
          </div>
        )}
        
        <div className="confessions-feed">
          {loading ? (
            <div className="loading-state">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))}
            </div>
          ) : confessions.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No confessions yet</p>
              <p className="empty-subtitle">
                Be the first to share your thoughts
              </p>
            </div>
          ) : (
            confessions.map((confession) => (
              <ConfessionCard
                key={confession.tx_id}
                confession={confession}
                onVote={handleVote}
              />
            ))
          )}
        </div>
      </main>

      <Fab onClick={() => setIsModalOpen(true)} />
      
      <ComposeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewConfession}
      />
    </div>
  );
}

export default App;