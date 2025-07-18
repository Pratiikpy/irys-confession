import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Globe, Users } from 'lucide-react';
import AuthModal from '../auth/AuthModal';

const WelcomeSection = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Anonymous & Safe",
      description: "Share your thoughts without fear of judgment"
    },
    {
      icon: Globe,
      title: "Permanent Storage",
      description: "Your confessions are stored permanently on the blockchain"
    },
    {
      icon: Sparkles,
      title: "AI Enhanced",
      description: "AI-powered content moderation and crisis support"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with others through replies and conversations"
    }
  ];

  return (
    <>
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="welcome-hero">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img 
                src="/assets/irys-hero-illustration.jpg" 
                alt="Irys Network" 
                className="hero-image"
              />
            </motion.div>
            
            <div className="hero-text">
              <motion.h1
                className="hero-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Share Your Truth
                <span className="gradient-text"> Anonymously</span>
              </motion.h1>
              
              <motion.p
                className="hero-description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                A safe space for anonymous confessions, powered by blockchain technology 
                and enhanced with AI moderation for your protection.
              </motion.p>
              
              <motion.div
                className="hero-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                >
                  Get Started
                </button>
                <button 
                  onClick={() => {
                    document.querySelector('.fab')?.click();
                  }}
                  className="btn-secondary"
                >
                  Post Anonymously
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div 
          className="features-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            >
              <div className="feature-icon">
                <feature.icon size={24} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default WelcomeSection;