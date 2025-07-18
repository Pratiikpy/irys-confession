import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { confessionAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Components
import ConfessionCard from '../components/confession/ConfessionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const ConfessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [confession, setConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfession();
  }, [id]);

  const fetchConfession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await confessionAPI.getById(id);
      setConfession(data);
    } catch (err) {
      console.error('Error fetching confession:', err);
      setError('Confession not found or may have been removed.');
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
      
      // Update local state
      setConfession(prev => ({
        ...prev,
        upvotes: voteType === 'upvote' ? prev.upvotes + 1 : prev.upvotes,
        downvotes: voteType === 'downvote' ? prev.downvotes + 1 : prev.downvotes
      }));
    } catch (err) {
      console.error('Error voting:', err);
      throw err;
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Anonymous Confession',
          text: confession.content.substring(0, 100) + '...',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="confession-page">
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <p className="loading-text">Loading confession...</p>
        </div>
      </div>
    );
  }

  if (error || !confession) {
    return (
      <div className="confession-page">
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
          title="Confession Not Found"
          description={error || "This confession may have been removed or doesn't exist."}
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
      className="confession-page"
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
        
        <div className="header-actions">
          <button 
            onClick={handleShare}
            className="action-button"
          >
            <Share2 size={16} />
            Share
          </button>
          
          {confession.gateway_url && (
            <a
              href={confession.gateway_url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button"
            >
              <ExternalLink size={16} />
              Verify
            </a>
          )}
        </div>
      </div>

      {/* Confession */}
      <div className="confession-container">
        <ConfessionCard
          confession={confession}
          onVote={handleVote}
          showActions={true}
          expanded={true}
        />
      </div>
    </motion.div>
  );
};

export default ConfessionPage;