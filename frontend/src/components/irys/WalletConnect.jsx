/**
 * MetaMask Wallet Connection Component
 * Handles Web3Modal integration for wallet connection
 */
import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { toast } from 'react-hot-toast'

export function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, error } = useConnect()
  const { disconnect } = useDisconnect()

  // Get MetaMask connector
  const metaMaskConnector = connectors.find(
    connector => connector.name.toLowerCase().includes('metamask') || 
                connector.id.toLowerCase().includes('metamask')
  ) || connectors[0] // Fallback to first connector

  const handleConnect = async () => {
    try {
      await connect({ connector: metaMaskConnector })
      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast.error('Failed to connect wallet')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success('Wallet disconnected')
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="wallet-info bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-sm">Connected:</span>
            <span className="text-white font-mono text-sm">{formatAddress(address)}</span>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.6 12.6c0-1.4-.4-2.7-1.2-3.8L17.9 6c-.8-1.1-2-1.8-3.4-1.8H9.5c-1.4 0-2.6.7-3.4 1.8L3.6 8.8c-.8 1.1-1.2 2.4-1.2 3.8v.8c0 2.9 2.4 5.2 5.3 5.2h.6c.5 0 1-.4 1-1v-2.4c0-.5-.4-1-1-1h-.6c-1.8 0-3.3-1.5-3.3-3.2v-.8c0-.9.3-1.7.8-2.4l2.5-2.8c.5-.6 1.2-1 2-1h5c.8 0 1.5.4 2 1l2.5 2.8c.5.7.8 1.5.8 2.4v.8c0 1.8-1.5 3.2-3.3 3.2h-.6c-.5 0-1 .4-1 1v2.4c0 .5.4 1 1 1h.6c2.9 0 5.3-2.3 5.3-5.2v-.8z"/>
            </svg>
            Connect MetaMask
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-400 text-sm max-w-xs">
          Connection failed: {error.message}
        </div>
      )}
    </div>
  )
}

export default WalletConnect