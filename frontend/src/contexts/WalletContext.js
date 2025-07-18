import React, { createContext, useContext, useState, useCallback } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { config, walletConfig } from '../config/web3'
import { authAPI } from '../utils/api'
import { toast } from 'react-hot-toast'

// Create query client
const queryClient = new QueryClient()

// Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  enableAnalytics: true,
  enableOnramp: true,
  ...walletConfig
})

// Wallet context
const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

// Internal wallet hook component
const WalletManager = ({ children }) => {
  const { address, isConnected, isConnecting, connector } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null
  })

  const authenticateWallet = useCallback(async (walletAddress) => {
    try {
      setIsAuthenticating(true)
      
      // Step 1: Get challenge from backend
      const challengeResponse = await authAPI.generateWalletChallenge(walletAddress)
      
      // Step 2: Sign the challenge message
      const signature = await signMessageAsync({
        message: challengeResponse.message
      })
      
      // Step 3: Verify signature with backend
      const authResponse = await authAPI.verifyWalletSignature({
        wallet_address: walletAddress,
        signature,
        message: challengeResponse.message,
        wallet_type: connector?.name?.toLowerCase() || 'unknown'
      })
      
      // Step 4: Store auth data
      if (authResponse.access_token) {
        localStorage.setItem('token', authResponse.access_token)
        setAuthState({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token
        })
        
        toast.success(`Welcome ${authResponse.user.username}!`)
        return authResponse
      }
      
    } catch (error) {
      console.error('Wallet authentication error:', error)
      
      let errorMessage = 'Authentication failed'
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Signature rejected by user'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [signMessageAsync, connector])

  const linkWalletToAccount = useCallback(async (walletAddress) => {
    try {
      setIsAuthenticating(true)
      
      // Generate challenge for linking
      const challengeResponse = await authAPI.generateWalletChallenge(walletAddress)
      
      // Sign the challenge
      const signature = await signMessageAsync({
        message: challengeResponse.message
      })
      
      // Link wallet to existing account
      await authAPI.linkWalletToAccount({
        wallet_address: walletAddress,
        signature,
        message: challengeResponse.message,
        wallet_type: connector?.name?.toLowerCase() || 'unknown'
      })
      
      toast.success('Wallet linked successfully!')
      return true
      
    } catch (error) {
      console.error('Wallet linking error:', error)
      
      let errorMessage = 'Failed to link wallet'
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Signature rejected by user'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [signMessageAsync, connector])

  const disconnectWallet = useCallback(() => {
    disconnect()
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    })
    localStorage.removeItem('token')
    toast.success('Wallet disconnected')
  }, [disconnect])

  const value = {
    // Wallet connection state
    address,
    isConnected,
    isConnecting,
    connector,
    
    // Authentication state
    isAuthenticating,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    
    // Actions
    authenticateWallet,
    linkWalletToAccount,
    disconnectWallet
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// Main provider component
export const WalletProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletManager>
          {children}
        </WalletManager>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default WalletProvider