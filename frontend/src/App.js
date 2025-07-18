import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Page Components
import HomePage from './pages/HomePage';
import ConfessionPage from './pages/ConfessionPage';
import UserProfile from './pages/UserProfile';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Modal Components
import AuthModal from './components/auth/AuthModal';
import ComposeModal from './components/confession/ComposeModal';
import SearchModal from './components/search/SearchModal';

// Global Styles
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <div className="app">
              {/* Background Pattern */}
              <div className="app-background" />
              
              {/* Header */}
              <Header />
              
              {/* Main Layout */}
              <div className="app-layout">
                {/* Sidebar - Hidden on mobile */}
                <div className="sidebar-container">
                  <Sidebar />
                </div>
                
                {/* Main Content Area */}
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/confession/:id" element={<ConfessionPage />} />
                    <Route path="/user/:username" element={<UserProfile />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                </main>
                
                {/* Right Sidebar - Desktop only */}
                <div className="right-sidebar">
                  <div className="trending-panel">
                    <h3 className="panel-title">Trending Topics</h3>
                    {/* Trending topics will be populated here */}
                  </div>
                  
                  <div className="stats-panel">
                    <h3 className="panel-title">Platform Stats</h3>
                    {/* Platform stats will be populated here */}
                  </div>
                </div>
              </div>
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--card)',
                    color: 'var(--text)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                  success: {
                    style: {
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: 'var(--success)',
                    },
                  },
                  error: {
                    style: {
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--error)',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;