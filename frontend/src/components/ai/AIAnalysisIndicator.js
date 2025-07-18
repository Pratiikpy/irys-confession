import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AIAnalysisIndicator = ({ analysis, compact = true }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!analysis) return null;

  const getStatusIcon = () => {
    const moderation = analysis.moderation;
    const enhancement = analysis.enhancement;

    if (moderation?.recommended_action === 'remove') {
      return <AlertTriangle size={14} />;
    } else if (moderation?.recommended_action === 'flag') {
      return <Shield size={14} />;
    } else if (moderation?.recommended_action === 'approve') {
      return <CheckCircle size={14} />;
    } else if (enhancement) {
      return <Sparkles size={14} />;
    }
    
    return <Info size={14} />;
  };

  const getStatusColor = () => {
    const moderation = analysis.moderation;
    
    if (moderation?.recommended_action === 'remove') {
      return '#ef4444';
    } else if (moderation?.recommended_action === 'flag') {
      return '#f59e0b';
    } else if (moderation?.recommended_action === 'approve') {
      return '#22c55e';
    }
    
    return '#00d1ff';
  };

  const getStatusText = () => {
    const moderation = analysis.moderation;
    
    if (moderation?.recommended_action === 'remove') {
      return 'Blocked';
    } else if (moderation?.recommended_action === 'flag') {
      return 'Flagged';
    } else if (moderation?.recommended_action === 'approve') {
      return 'Approved';
    }
    
    return 'AI Enhanced';
  };

  return (
    <div className="ai-analysis-indicator">
      <motion.button
        className="analysis-badge"
        style={{ color: getStatusColor() }}
        onClick={() => setShowDetails(!showDetails)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {getStatusIcon()}
        {!compact && <span>{getStatusText()}</span>}
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="analysis-details"
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="details-header">
              <Sparkles size={16} />
              <span>AI Analysis</span>
            </div>

            {/* Moderation Analysis */}
            {analysis.moderation && (
              <div className="analysis-section">
                <h4>Content Moderation</h4>
                <div className="analysis-items">
                  <div className="analysis-item">
                    <span className="item-label">Status:</span>
                    <span className="item-value">{getStatusText()}</span>
                  </div>
                  <div className="analysis-item">
                    <span className="item-label">Confidence:</span>
                    <span className="item-value">
                      {Math.round((analysis.moderation.confidence || 0) * 100)}%
                    </span>
                  </div>
                  {analysis.moderation.reasoning && (
                    <div className="analysis-item">
                      <span className="item-label">Reasoning:</span>
                      <span className="item-value">{analysis.moderation.reasoning}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhancement Analysis */}
            {analysis.enhancement && (
              <div className="analysis-section">
                <h4>Content Enhancement</h4>
                <div className="analysis-items">
                  {analysis.enhancement.mood && (
                    <div className="analysis-item">
                      <span className="item-label">Mood:</span>
                      <span className="item-value">{analysis.enhancement.mood}</span>
                    </div>
                  )}
                  {analysis.enhancement.category && (
                    <div className="analysis-item">
                      <span className="item-label">Category:</span>
                      <span className="item-value">{analysis.enhancement.category}</span>
                    </div>
                  )}
                  {analysis.enhancement.viral_score && (
                    <div className="analysis-item">
                      <span className="item-label">Viral Score:</span>
                      <span className="item-value">
                        {Math.round(analysis.enhancement.viral_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Crisis Detection */}
            {analysis.moderation?.crisis_level && analysis.moderation.crisis_level !== 'none' && (
              <div className="analysis-section crisis">
                <h4>Crisis Detection</h4>
                <div className="analysis-items">
                  <div className="analysis-item">
                    <span className="item-label">Level:</span>
                    <span className="item-value crisis-level">
                      {analysis.moderation.crisis_level}
                    </span>
                  </div>
                  {analysis.moderation.support_resources && (
                    <div className="analysis-item">
                      <span className="item-label">Support:</span>
                      <span className="item-value">Resources provided</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {analysis.enhancement?.tags && analysis.enhancement.tags.length > 0 && (
              <div className="analysis-section">
                <h4>Auto-Generated Tags</h4>
                <div className="tags-container">
                  {analysis.enhancement.tags.map(tag => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAnalysisIndicator;