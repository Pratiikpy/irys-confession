import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, ExternalLink, ChevronDown, ChevronUp, 
         Flag, Shield, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { confessionAPI, replyAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import ReplyThread from '../reply/ReplyThread';
import ReplyForm from '../reply/ReplyForm';
import AIAnalysisIndicator from '../ai/AIAnalysisIndicator';
import CrisisAlert from '../ai/CrisisAlert';
import MoodIndicator from '../ai/MoodIndicator';

const ConfessionCard = ({ 
  confession, 
  onVote, 
  showActions = true, 
  expanded = false,
  onExpand 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.upvotes || 0);
  const [showReplies, setShowReplies] = useState(expanded);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has voted on this confession
    const userVote = localStorage.getItem(`vote_${confession.id || confession.tx_id}`);
    if (userVote === 'upvote') {
      setIsLiked(true);
    }
  }, [confession.id, confession.tx_id]);

  useEffect(() => {
    // Show crisis alert if needed
    if (confession.crisis_level && ['high', 'critical'].includes(confession.crisis_level)) {
      setShowCrisisAlert(true);
    }
  }, [confession.crisis_level]);

  const handleLike = async () => {
    try {
      const newLiked = !isLiked;
      const voteType = newLiked ? 'upvote' : 'downvote';
      
      // Optimistic update
      setIsLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
      
      // Store vote in localStorage
      localStorage.setItem(`vote_${confession.id || confession.tx_id}`, voteType);
      
      if (onVote) {
        await onVote(confession.id || confession.tx_id, voteType);
      }
      
      toast.success(newLiked ? 'Liked!' : 'Unliked!');
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to vote');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/confession/${confession.tx_id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Anonymous Confession',
          text: confession.content.substring(0, 100) + '...',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      setLoadingReplies(true);
      try {
        const repliesData = await replyAPI.getByConfession(confession.id || confession.tx_id);
        setReplies(repliesData.replies || []);
      } catch (error) {
        console.error('Error loading replies:', error);
        toast.error('Failed to load replies');
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleReplySubmit = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    setShowReplyForm(false);
    toast.success('Reply posted!');
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getTrendingIndicator = () => {
    const score = (confession.upvotes || 0) + (confession.reply_count || 0) * 2;
    if (score > 50) return 'high';
    if (score > 20) return 'medium';
    return 'low';
  };

  return (
    <>
      <motion.div 
        className={`confession-card ${confession.crisis_level ? 'crisis-' + confession.crisis_level : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
      >
        {/* Crisis Alert */}
        {showCrisisAlert && (
          <CrisisAlert 
            level={confession.crisis_level}
            onClose={() => setShowCrisisAlert(false)}
          />
        )}

        <div className="confession-content">
          {/* Header */}
          <div className="confession-header">
            <div className="author-info">
              <div className="author-avatar">
                <div className="avatar-placeholder">
                  {confession.author?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              </div>
              <div className="author-details">
                <span className="author-name">{confession.author || 'Anonymous'}</span>
                <time className="confession-time">
                  {formatDate(confession.timestamp)}
                </time>
              </div>
            </div>
            
            <div className="confession-badges">
              {confession.verified && (
                <div className="verified-badge">
                  <Shield size={12} />
                  <span>Verified</span>
                </div>
              )}
              
              {confession.ai_analysis && (
                <AIAnalysisIndicator analysis={confession.ai_analysis} />
              )}
              
              {getTrendingIndicator() === 'high' && (
                <div className="trending-badge">
                  <TrendingUp size={12} />
                  <span>Trending</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="confession-text">
            <p>{confession.content}</p>
          </div>

          {/* AI Enhancement Indicators */}
          {confession.mood && (
            <div className="confession-enhancements">
              <MoodIndicator mood={confession.mood} />
              
              {confession.tags && confession.tags.length > 0 && (
                <div className="confession-tags">
                  {confession.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                  {confession.tags.length > 3 && (
                    <span className="tag-more">
                      +{confession.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="confession-actions">
              <div className="action-group">
                <motion.button
                  onClick={handleLike}
                  className={`action-button vote-button ${isLiked ? 'liked' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart size={16} className={isLiked ? 'filled' : ''} />
                  <span>{likeCount}</span>
                </motion.button>
                
                <motion.button
                  onClick={handleToggleReplies}
                  className="action-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  data-reply-button
                >
                  <MessageCircle size={16} />
                  <span>{confession.reply_count || 0}</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="action-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span>Reply</span>
                </motion.button>
              </div>

              <div className="action-group">
                <motion.button
                  onClick={handleShare}
                  className="action-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 size={16} />
                </motion.button>
                
                {confession.gateway_url && (
                  <motion.a
                    href={confession.gateway_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ExternalLink size={16} />
                  </motion.a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <motion.div
            className="reply-form-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ReplyForm
              confessionId={confession.id || confession.tx_id}
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
            />
          </motion.div>
        )}

        {/* Replies */}
        {showReplies && (
          <motion.div
            className="replies-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="replies-header">
              <h4>Replies</h4>
              <button 
                onClick={handleToggleReplies}
                className="collapse-button"
              >
                <ChevronUp size={16} />
              </button>
            </div>
            
            {loadingReplies ? (
              <div className="replies-loading">
                <div className="loading-spinner" />
                <span>Loading replies...</span>
              </div>
            ) : replies.length > 0 ? (
              <ReplyThread replies={replies} />
            ) : (
              <div className="no-replies">
                <p>No replies yet. Be the first to respond!</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default ConfessionCard;