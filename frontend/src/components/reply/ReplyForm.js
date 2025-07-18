import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { replyAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ReplyForm = ({ confessionId, parentReplyId = null, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const MAX_CHARS = 280;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (content.length > MAX_CHARS) {
      toast.error(`Reply must be ${MAX_CHARS} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const replyData = {
        content: content.trim(),
        parent_reply_id: parentReplyId
      };

      const response = await replyAPI.create(confessionId, replyData);
      
      if (response.status === 'success') {
        toast.success('Reply posted successfully!');
        
        if (onSubmit) {
          onSubmit({
            id: response.id,
            content: content.trim(),
            author: user?.username || 'anonymous',
            author_id: user?.id,
            timestamp: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            parent_reply_id: parentReplyId
          });
        }
        
        setContent('');
        if (onCancel) {
          onCancel();
        }
      } else {
        throw new Error(response.message || 'Failed to post reply');
      }
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(error.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="reply-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="reply-form-container">
        <div className="reply-input-container">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Reply ${parentReplyId ? 'to this comment' : 'to this confession'}...`}
            className="reply-textarea"
            rows={3}
            maxLength={MAX_CHARS}
            disabled={isSubmitting}
          />
          <div className="reply-char-count">
            <span className={content.length > MAX_CHARS * 0.9 ? 'warning' : ''}>
              {content.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="reply-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-reply"
            disabled={isSubmitting}
          >
            <X size={16} />
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-reply"
            disabled={isSubmitting || !content.trim() || content.length > MAX_CHARS}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner" />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Reply
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReplyForm;