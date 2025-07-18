import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../../contexts/WalletContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  WalletIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const WalletConnection = ({ onSuccess, onClose, mode = 'auth' }) => {
  const [step, setStep] = useState('connect') // connect, authenticate, success
  const [error, setError] = useState(null)
  
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connector,
    isAuthenticating,
    isAuthenticated,
    user,
    authenticateWallet,
    linkWalletToAccount,
    disconnectWallet
  } = useWallet()
  
  const { user: authUser, isAuthenticated: isAuthUserAuthenticated } = useAuth()

  useEffect(() => {
    if (isConnected && address) {
      setStep('authenticate')
    }
  }, [isConnected, address])

  const handleConnect = async () => {
    try {
      setError(null)
      // Connection is handled by Web3Modal
      // This will be triggered by the useEffect above
    } catch (err) {
      setError(err.message || 'Failed to connect wallet')
    }
  }

  const handleAuthenticate = async () => {
    try {
      setError(null)
      
      if (mode === 'link' && !isAuthUserAuthenticated) {
        setError('Please log in first to link your wallet')
        return
      }
      
      if (mode === 'link') {
        await linkWalletToAccount(address)
        setStep('success')
      } else {
        await authenticateWallet(address)
        setStep('success')
      }
      
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
      
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setStep('connect')
    setError(null)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getWalletIcon = (connectorName) => {
    const name = connectorName?.toLowerCase()
    if (name?.includes('metamask')) return '🦊'
    if (name?.includes('coinbase')) return '🔵'
    if (name?.includes('walletconnect')) return '🔗'
    if (name?.includes('trust')) return '🛡️'
    if (name?.includes('rabby')) return '🐰'
    return '👛'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 max-w-md mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00D1FF]/10 rounded-xl">
            <WalletIcon className="w-6 h-6 text-[#00D1FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            {mode === 'link' ? 'Link Wallet' : 'Connect Wallet'}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {step === 'connect' && (
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            {mode === 'link' 
              ? 'Link your wallet to your account for enhanced security and blockchain features.'
              : 'Connect your wallet to create an account or sign in to your existing one.'
            }
          </p>

          <div className="space-y-3">
            <w3m-button 
              size="md" 
              label="Connect Wallet"
              loadingLabel="Connecting..."
            />
            
            <p className="text-xs text-gray-500 text-center">
              Supports MetaMask, Coinbase, WalletConnect, Trust Wallet, and more
            </p>
          </div>

          <div className="border-t border-[#333] pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Your wallet stays secure - we never access your private keys</span>
            </div>
          </div>
        </div>
      )}

      {step === 'authenticate' && isConnected && (
        <div className="space-y-4">
          <div className="p-4 bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Connected Wallet</span>
              <button
                onClick={handleDisconnect}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Disconnect
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getWalletIcon(connector?.name)}</span>
              <div>
                <p className="text-white font-medium">
                  {connector?.name || 'Unknown Wallet'}
                </p>
                <p className="text-sm text-gray-400">
                  {formatAddress(address)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full bg-[#00D1FF] hover:bg-[#00D1FF]/90 disabled:bg-[#00D1FF]/50 text-black font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  {mode === 'link' ? 'Linking...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  {mode === 'link' ? (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Link Wallet
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Sign Message
                    </>
                  )}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              {mode === 'link' 
                ? 'Sign a message to link your wallet to your account'
                : 'Sign a message to authenticate with your wallet'
              }
            </p>
          </div>
        </div>
      )}

      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {mode === 'link' ? 'Wallet Linked!' : 'Welcome!'}
            </h3>
            <p className="text-gray-300 text-sm">
              {mode === 'link' 
                ? 'Your wallet has been successfully linked to your account.'
                : `Welcome to Irys Confession Board, ${user?.username || 'user'}!`
              }
            </p>
          </div>

          <div className="pt-4 border-t border-[#333]">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="text-2xl">{getWalletIcon(connector?.name)}</span>
              <span>{formatAddress(address)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default WalletConnection