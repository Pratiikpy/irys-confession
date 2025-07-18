import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Phone, MessageCircle } from 'lucide-react';

const CrisisAlert = ({ level = 'medium', onClose }) => {
  const getAlertConfig = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Immediate Help Available',
          message: 'This content indicates you may be in crisis. Please reach out for immediate support.',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-500/50',
          textColor: 'text-red-100',
          urgency: 'high'
        };
      case 'high':
        return {
          title: 'Support Resources Available',
          message: 'We noticed you might be going through a tough time. Help is available.',
          bgColor: 'bg-orange-900/20',
          borderColor: 'border-orange-500/50',
          textColor: 'text-orange-100',
          urgency: 'medium'
        };
      default:
        return {
          title: 'Support Available',
          message: 'If you need someone to talk to, crisis support is available 24/7.',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-500/50',
          textColor: 'text-yellow-100',
          urgency: 'low'
        };
    }
  };

  const config = getAlertConfig();

  return (
    <motion.div
      className={`crisis-alert ${config.bgColor} ${config.borderColor} ${config.textColor} border rounded-lg p-4 mb-4 relative`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <div className="crisis-icon">
          <AlertTriangle size={20} className="text-current" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{config.title}</h4>
          <p className="text-xs mb-3">{config.message}</p>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.open('tel:988', '_blank')}
              className="flex items-center gap-1 text-xs bg-current/20 hover:bg-current/30 px-2 py-1 rounded transition-colors"
            >
              <Phone size={12} />
              Call 988
            </button>
            
            <button
              onClick={() => window.open('https://suicidepreventionlifeline.org/chat/', '_blank')}
              className="flex items-center gap-1 text-xs bg-current/20 hover:bg-current/30 px-2 py-1 rounded transition-colors"
            >
              <MessageCircle size={12} />
              Chat Support
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-current/20 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default CrisisAlert;