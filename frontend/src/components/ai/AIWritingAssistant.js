import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { debounce } from 'lodash';

const AIWritingAssistant = ({ content, onAnalysis }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Debounced analysis function
  const debouncedAnalyze = useCallback(
    debounce(async (text) => {
      if (!text || text.length < 10) {
        setAnalysis(null);
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Simulate AI analysis - in real app, this would call the backend
        const mockAnalysis = {
          mood: detectMood(text),
          tags: extractTags(text),
          viral_score: calculateViralScore(text),
          engagement_prediction: predictEngagement(text),
          crisis_level: detectCrisis(text),
          content_quality: analyzeQuality(text),
          suggestions: generateSuggestions(text)
        };

        setAnalysis(mockAnalysis);
        
        if (onAnalysis) {
          onAnalysis(mockAnalysis);
        }
      } catch (err) {
        setError('Analysis failed. Please try again.');
        console.error('AI Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000),
    [onAnalysis]
  );

  useEffect(() => {
    debouncedAnalyze(content);
    
    return () => {
      debouncedAnalyze.cancel();
    };
  }, [content, debouncedAnalyze]);

  // Mock AI analysis functions
  const detectMood = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) return 'happy';
    if (lowerText.includes('sad') || lowerText.includes('cry') || lowerText.includes('depressed')) return 'sad';
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous')) return 'anxious';
    if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('furious')) return 'angry';
    if (lowerText.includes('hope') || lowerText.includes('optimistic') || lowerText.includes('positive')) return 'hopeful';
    if (lowerText.includes('frustrated') || lowerText.includes('annoyed')) return 'frustrated';
    return 'neutral';
  };

  const extractTags = (text) => {
    const commonTags = ['life', 'love', 'work', 'family', 'friends', 'health', 'money', 'school', 'relationship'];
    const lowerText = text.toLowerCase();
    return commonTags.filter(tag => lowerText.includes(tag)).slice(0, 3);
  };

  const calculateViralScore = (text) => {
    let score = 0;
    
    // Length factor
    if (text.length > 100 && text.length < 200) score += 0.3;
    
    // Emotional words
    const emotionalWords = ['amazing', 'terrible', 'incredible', 'shocking', 'unbelievable'];
    emotionalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 0.2;
    });
    
    // Questions
    if (text.includes('?')) score += 0.1;
    
    // Personal pronouns
    if (text.includes('I ') || text.includes('my ')) score += 0.2;
    
    return Math.min(score, 1);
  };

  const predictEngagement = (text) => {
    const score = calculateViralScore(text);
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  };

  const detectCrisis = (text) => {
    const crisisWords = ['suicide', 'kill myself', 'end it all', 'can\'t go on', 'self harm'];
    const lowerText = text.toLowerCase();
    
    for (const word of crisisWords) {
      if (lowerText.includes(word)) {
        return 'high';
      }
    }
    
    const warningWords = ['depressed', 'hopeless', 'worthless', 'alone', 'empty'];
    for (const word of warningWords) {
      if (lowerText.includes(word)) {
        return 'medium';
      }
    }
    
    return 'none';
  };

  const analyzeQuality = (text) => {
    let score = 0;
    
    // Length
    if (text.length > 50) score += 25;
    if (text.length > 100) score += 25;
    
    // Spelling/grammar (simplified)
    if (text.includes('.') || text.includes('!') || text.includes('?')) score += 25;
    
    // Readability
    const words = text.split(' ').length;
    if (words > 10) score += 25;
    
    return Math.min(score, 100);
  };

  const generateSuggestions = (text) => {
    const suggestions = [];
    
    if (text.length < 50) {
      suggestions.push('Consider adding more detail to increase engagement');
    }
    
    if (!text.includes('?') && !text.includes('!')) {
      suggestions.push('Add emotion with punctuation to make it more engaging');
    }
    
    if (text.split(' ').length < 5) {
      suggestions.push('Longer confessions tend to get more responses');
    }
    
    return suggestions;
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#fbbf24',
      sad: '#60a5fa',
      anxious: '#a78bfa',
      angry: '#f87171',
      excited: '#34d399',
      frustrated: '#fb7185',
      hopeful: '#22d3ee',
      neutral: '#6b7280'
    };
    return colors[mood] || colors.neutral;
  };

  const getEngagementColor = (prediction) => {
    const colors = {
      high: '#22c55e',
      medium: '#f59e0b',
      low: '#6b7280'
    };
    return colors[prediction] || colors.low;
  };

  if (!content || content.length < 10) {
    return (
      <div className="ai-assistant placeholder">
        <div className="assistant-header">
          <Sparkles size={16} />
          <span>AI Writing Assistant</span>
        </div>
        <p className="assistant-placeholder">
          Start typing to get AI-powered insights and suggestions...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="ai-assistant"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="assistant-header">
        <div className="header-left">
          <Sparkles size={16} />
          <span>AI Analysis</span>
        </div>
        <div className="header-right">
          {isAnalyzing && (
            <div className="analyzing-indicator">
              <div className="spinner" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="analysis-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <motion.div
          className="analysis-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Mood Detection */}
          <div className="analysis-item">
            <div className="item-header">
              <div className="mood-indicator" style={{ backgroundColor: getMoodColor(analysis.mood) }} />
              <span className="item-label">Mood</span>
            </div>
            <div className="item-value">{analysis.mood}</div>
          </div>

          {/* Suggested Tags */}
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="analysis-item">
              <div className="item-header">
                <span className="item-label">Suggested Tags</span>
              </div>
              <div className="item-value">
                <div className="tags-container">
                  {analysis.tags.map(tag => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Viral Potential */}
          <div className="analysis-item">
            <div className="item-header">
              <TrendingUp size={16} />
              <span className="item-label">Engagement Potential</span>
            </div>
            <div className="item-value">
              <div className="viral-meter">
                <div 
                  className="viral-fill"
                  style={{ 
                    width: `${analysis.viral_score * 100}%`,
                    backgroundColor: getEngagementColor(analysis.engagement_prediction)
                  }}
                />
              </div>
              <span className="viral-score">
                {Math.round(analysis.viral_score * 100)}% ({analysis.engagement_prediction})
              </span>
            </div>
          </div>

          {/* Quality Score */}
          <div className="analysis-item">
            <div className="item-header">
              <CheckCircle size={16} />
              <span className="item-label">Content Quality</span>
            </div>
            <div className="item-value">
              <div className="quality-meter">
                <div 
                  className="quality-fill"
                  style={{ 
                    width: `${analysis.content_quality}%`,
                    backgroundColor: analysis.content_quality > 75 ? '#22c55e' : 
                                   analysis.content_quality > 50 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="quality-score">{analysis.content_quality}%</span>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="analysis-item suggestions">
              <div className="item-header">
                <Brain size={16} />
                <span className="item-label">Suggestions</span>
              </div>
              <div className="item-value">
                <ul className="suggestions-list">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Crisis Detection Warning */}
          {analysis.crisis_level && analysis.crisis_level !== 'none' && (
            <div className={`analysis-item crisis-warning ${analysis.crisis_level}`}>
              <div className="item-header">
                <AlertCircle size={16} />
                <span className="item-label">Content Advisory</span>
              </div>
              <div className="item-value">
                <p>
                  {analysis.crisis_level === 'high' 
                    ? 'This content may indicate crisis. Support resources will be provided.'
                    : 'This content may indicate distress. Consider adding support resources.'
                  }
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIWritingAssistant;