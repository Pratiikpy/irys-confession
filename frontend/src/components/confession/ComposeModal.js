import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Sparkles, AlertTriangle, Heart, Globe, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { confessionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

// Components
import Modal from '../common/Modal';
import AIWritingAssistant from '../ai/AIWritingAssistant';
import CrisisSupport from '../ai/CrisisSupport';
import MoodIndicator from '../ai/MoodIndicator';

const ComposeModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tags, setTags] = useState([]);
  const [mood, setMood] = useState('');

  const { user } = useAuth();
  const MAX_CHARS = 280;

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setContent('');
      setIsPublic(true);
      setAiAnalysis(null);
      setShowCrisisSupport(false);
      setShowAdvanced(false);
      setTags([]);
      setMood('');
    }
  }, [isOpen]);

  const handleAIAnalysis = (analysis) => {
    setAiAnalysis(analysis);
    
    // Handle crisis detection
    if (analysis.crisis_level && ['high', 'critical'].includes(analysis.crisis_level)) {
      setShowCrisisSupport(true);
    }
    
    // Set AI-suggested mood and tags
    if (analysis.mood) {
      setMood(analysis.mood);
    }
    if (analysis.tags && analysis.tags.length > 0) {
      setTags(analysis.tags);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter a confession');
      return;
    }

    if (content.length > MAX_CHARS) {
      toast.error(`Confession must be ${MAX_CHARS} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const confessionData = {
        content: content.trim(),
        is_public: isPublic,
        author: user?.username || 'anonymous',
        mood: mood || null,
        tags: tags || []
      };

      const response = await confessionAPI.create(confessionData);
      
      if (response.status === 'success') {
        toast.success('🎉 Confession posted successfully!');
        
        if (onSubmit) {
          // Pass the confession data from the response
          onSubmit(response.confession || response.data || {
            id: response.id,
            content: confessionData.content,
            author: confessionData.author,
            timestamp: new Date().toISOString(),
            is_public: confessionData.is_public,
            upvotes: 0,
            downvotes: 0,
            reply_count: 0,
            mood: confessionData.mood,
            tags: confessionData.tags
          });
        }
        
        onClose();
      } else {
        throw new Error(response.message || 'Failed to post confession');
      }
      
    } catch (error) {
      console.error('Error submitting confession:', error);
      toast.error(error.message || 'Failed to post confession');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="large">
        <motion.div
          className="compose-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">
              <Sparkles size={20} />
              New Confession
            </h2>
            <button onClick={onClose} className="modal-close">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="compose-form">
            {/* AI Writing Assistant */}
            <AIWritingAssistant
              content={content}
              onAnalysis={handleAIAnalysis}
            />

            {/* Text Area */}
            <div className="textarea-container">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts anonymously..."
                className="compose-textarea"
                maxLength={MAX_CHARS}
                rows={6}
                autoFocus
              />
              <div className="char-count">
                <span className={content.length > MAX_CHARS * 0.9 ? 'warning' : ''}>
                  {content.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* AI Analysis Display */}
            {aiAnalysis && (
              <div className="ai-analysis-display">
                <div className="analysis-header">
                  <Sparkles size={16} />
                  <span>AI Analysis</span>
                </div>
                
                <div className="analysis-content">
                  {aiAnalysis.mood && (
                    <div className="analysis-item">
                      <MoodIndicator mood={aiAnalysis.mood} />
                      <span>Mood: {aiAnalysis.mood}</span>
                    </div>
                  )}
                  
                  {aiAnalysis.tags && aiAnalysis.tags.length > 0 && (
                    <div className="analysis-item">
                      <span>Suggested tags:</span>
                      <div className="suggested-tags">
                        {aiAnalysis.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiAnalysis.viral_score && (
                    <div className="analysis-item">
                      <span>Engagement potential:</span>
                      <div className="viral-meter">
                        <div 
                          className="viral-fill"
                          style={{ width: `${aiAnalysis.viral_score * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(aiAnalysis.viral_score * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Options */}
            <div className="compose-options">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="advanced-toggle"
              >
                Advanced Options
              </button>
              
              {showAdvanced && (
                <motion.div
                  className="advanced-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Custom Tags */}
                  <div className="option-group">
                    <label>Custom Tags:</label>
                    <input
                      type="text"
                      placeholder="Add tags (comma separated)"
                      value={tags.join(', ')}
                      onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                      className="tags-input"
                    />
                  </div>

                  {/* Mood Selection */}
                  <div className="option-group">
                    <label>Mood:</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="mood-select"
                    >
                      <option value="">Auto-detect</option>
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
                </motion.div>
              )}
            </div>

            {/* Privacy Toggle */}
            <div className="privacy-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="toggle-checkbox"
                />
                <div className="toggle-switch">
                  <div className="toggle-icon">
                    {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                  </div>
                </div>
                <span className="toggle-text">
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </label>
              
              <div className="privacy-description">
                {isPublic 
                  ? 'Everyone can see this confession' 
                  : 'Only you have the link to this confession'
                }
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="cancel-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || content.length > MAX_CHARS}
                className="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post Confession
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </Modal>

      {/* Crisis Support Modal */}
      <CrisisSupport
        isVisible={showCrisisSupport}
        onClose={() => setShowCrisisSupport(false)}
      />
    </>
  );
};

export default ComposeModal;