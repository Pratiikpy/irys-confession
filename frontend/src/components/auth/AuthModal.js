import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { validateEmail, validateUsername, validatePassword } from '../../utils/helpers';

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const { login, register } = useAuth();

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (mode === 'register' && !validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    }

    if (mode === 'register' && formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'register' && !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result;
      
      if (mode === 'login') {
        result = await login({
          username: formData.username,
          password: formData.password
        });
      } else {
        result = await register({
          username: formData.username,
          email: formData.email || undefined,
          password: formData.password
        });
      }

      if (result.success) {
        handleClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'login' ? 'Sign In' : 'Create Account'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="error-state">
            {errors.general}
          </div>
        )}

        <Input
          name="username"
          label="Username"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
          icon={UserIcon}
          placeholder="Enter your username"
          autoComplete="username"
        />

        {mode === 'register' && (
          <Input
            name="email"
            label="Email (optional)"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            icon={EnvelopeIcon}
            placeholder="Enter your email"
            autoComplete="email"
          />
        )}

        <Input
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          icon={LockClosedIcon}
          placeholder="Enter your password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'register' && (
          <Input
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            icon={LockClosedIcon}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        )}

        <div className="flex flex-col space-y-3 pt-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            fullWidth
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center">
            <span className="text-gray-400 text-sm">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium ml-2"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
            <p>Your confessions are permanently stored on the Irys blockchain.</p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AuthModal;