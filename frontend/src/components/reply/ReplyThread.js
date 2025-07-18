import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, Flag, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { replyAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import ReplyForm from './ReplyForm';
import MoodIndicator from '../ai/MoodIndicator';

const ReplyCard = ({ reply, depth = 0, onReply, onVote }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.upvotes || 0);
  const [showActions, setShowActions] = useState(false);
  
  const { user } = useAuth();
  const maxDepth = 3;

  const handleLike = async () => {
    try {
      const newLiked = !isLiked;
      const voteType = newLiked ? 'upvote' : 'downvote';
      
      // Optimistic update
      setIsLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
      
      if (onVote) {
        await onVote(reply.id, voteType);
      } else {
        await replyAPI.vote(reply.id, {
          vote_type: voteType,
          user_address: user?.id || 'anonymous'
        });
      }
      
      toast.success(newLiked ? 'Liked!' : 'Unliked!');
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to vote');
    }
  };

  const handleReplySubmit = (newReply) => {
    if (onReply) {
      onReply(newReply);
    }
    setShowReplyForm(false);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const marginLeft = Math.min(depth * 20, maxDepth * 20);

  return (
    <motion.div
      className="reply-card"
      style={{ marginLeft: `${marginLeft}px` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Thread Line */}
      {depth > 0 && <div className="thread-line" />}

      {/* Reply Content */}
      <div className="reply-content">
        {/* Header */}
        <div className="reply-header">
          <div className="reply-author">
            <div className="author-avatar">
              <div className="avatar-placeholder">
                {reply.author?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
            <div className="author-info">
              <span className="author-name">{reply.author || 'Anonymous'}</span>
              <time className="reply-time">{formatDate(reply.timestamp)}</time>
            </div>
          </div>
          
          <div className="reply-actions-menu">
            <button
              onClick={() => setShowActions(!showActions)}
              className="actions-trigger"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showActions && (
              <div className="actions-dropdown">
                <button className="action-item">
                  <Flag size={14} />
                  Report
                </button>
                <button className="action-item">
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="reply-text">
          <p>{reply.content}</p>
        </div>

        {/* AI Enhancements */}
        {reply.ai_analysis?.enhancement?.mood && (
          <div className="reply-enhancements">
            <MoodIndicator mood={reply.ai_analysis.enhancement.mood} size="small" />
          </div>
        )}

        {/* Actions */}
        <div className="reply-actions">
          <button
            onClick={handleLike}
            className={`action-button ${isLiked ? 'liked' : ''}`}
          >
            <Heart size={14} className={isLiked ? 'filled' : ''} />
            <span>{likeCount}</span>
          </button>
          
          {depth < maxDepth && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="action-button"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <ReplyForm
          confessionId={reply.confession_id}
          parentReplyId={reply.id}
          onSubmit={handleReplySubmit}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* Nested Replies */}
      {reply.children && reply.children.length > 0 && (
        <div className="nested-replies">
          {reply.children.map((childReply) => (
            <ReplyCard
              key={childReply.id}
              reply={childReply}
              depth={depth + 1}
              onReply={onReply}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ReplyThread = ({ replies, onReply, onVote }) => {
  return (
    <div className="reply-thread">
      {replies.map((reply) => (
        <ReplyCard
          key={reply.id}
          reply={reply}
          depth={0}
          onReply={onReply}
          onVote={onVote}
        />
      ))}
    </div>
  );
};

export default ReplyThread;