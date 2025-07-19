/**
 * Main Irys Confession App Component
 * Central app for blockchain-based anonymous confessions
 */
import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { toast, Toaster } from 'react-hot-toast'
import WalletConnect from './WalletConnect'
import PostConfession from './PostConfession'
import ConfessionCard from './ConfessionCard'
import { irysService } from '../../services/irysService'

export function IrysConfessionApp() {
  console.log('IrysConfessionApp component rendering...')
  
  const { address, isConnected } = useAccount()
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [irysInfo, setIrysInfo] = useState(null)

  // Load real confessions from backend/blockchain
  const loadRealConfessions = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual backend API call to get blockchain confessions
      // const response = await fetch('/api/irys/confessions')
      // const confessions = await response.json()
      // setConfessions(confessions)
      
      // For now, start with empty array - all confessions will come from real blockchain posts
      setConfessions([])
    } catch (error) {
      console.error('Failed to load confessions:', error)
      setConfessions([])
    } finally {
      setLoading(false)
    }
  }

  // Initialize real data
  useEffect(() => {
    loadRealConfessions()
  }, [])

  // Get Irys node info when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadIrysInfo()
    }
  }, [isConnected, address])

  const loadIrysInfo = async () => {
    try {
      if (irysService.isReady()) {
        const info = await irysService.getNodeInfo()
        setIrysInfo(info)
      }
    } catch (error) {
      console.error('Failed to load Irys info:', error)
    }
  }

  const handleNewConfession = (confession) => {
    setConfessions(prev => [confession, ...prev])
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="irys-confession-app min-h-screen bg-black text-white">
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151'
          }
        }}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Anonymous Confessions
              </h1>
              <p className="text-gray-400 mt-1">
                Powered by Irys Blockchain • Permanent & Decentralized
              </p>
            </div>
            <WalletConnect />
          </div>

          {/* Irys Info */}
          {isConnected && irysInfo && (
            <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Irys Network Status</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>Network: {irysInfo.network}</span>
                    <span>Balance: {irysInfo.balance} {irysInfo.currency}</span>
                    <span>Connected: {formatAddress(address)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message for Non-Connected Users */}
        {!isConnected && (
          <div className="text-center mb-8 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Share Anonymous Confessions</h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Connect your MetaMask wallet to post anonymous confessions that are permanently stored on the Irys blockchain. 
                Your identity remains anonymous, but your thoughts become immortal.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-blue-400 mb-2">🔗</div>
                <h3 className="font-semibold text-white text-sm">Blockchain Permanent</h3>
                <p className="text-gray-400 text-xs">All confessions stored permanently on Irys devnet</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-purple-400 mb-2">👤</div>
                <h3 className="font-semibold text-white text-sm">Anonymous Identity</h3>
                <p className="text-gray-400 text-xs">Only your wallet address is shown as identifier</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-green-400 mb-2">💬</div>
                <h3 className="font-semibold text-white text-sm">Interactive Comments</h3>
                <p className="text-gray-400 text-xs">Comment and engage with other confessions</p>
              </div>
            </div>
          </div>
        )}

        {/* Post Confession Form - Only show when wallet is connected */}
        {isConnected ? (
          <div className="mb-8">
            <PostConfession onNewPost={handleNewConfession} />
          </div>
        ) : (
          <div className="mb-8 bg-gray-900/50 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">MetaMask Connection Required</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You must connect your MetaMask wallet before you can post confessions to the blockchain.
              This ensures secure, anonymous, and permanent storage of your thoughts.
            </p>
            <div className="text-sm text-gray-500">
              🔒 No posting without wallet connection
            </div>
          </div>
        )}

        {/* Confessions Feed - Only show when wallet is connected */}
        {isConnected ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Recent Confessions ({confessions.length})
              </h2>
              <div className="text-sm text-gray-400">
                Latest confessions first
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading confessions from blockchain...</p>
              </div>
            ) : confessions.length > 0 ? (
              <div className="space-y-6">
                {confessions.map((confession) => (
                  <ConfessionCard 
                    key={confession.id || confession.txId} 
                    confession={confession} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Confessions Yet</h3>
                <p className="text-gray-400">
                  Be the first to share an anonymous confession on the blockchain
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-900/30 border border-gray-700 rounded-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet to View Confessions</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Anonymous confessions are only visible to connected MetaMask users. 
              Connect your wallet to join the community and view all confessions stored on the blockchain.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              <span>Powered by </span>
              <a 
                href="https://irys.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Irys Network
              </a>
              <span> • Permanent Data Storage</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://devnet.irys.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Explorer
              </a>
              <a 
                href="https://docs.irys.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default IrysConfessionApp