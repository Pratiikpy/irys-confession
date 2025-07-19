/**
 * Post Confession Component
 * Allows users to create and submit confessions to Irys blockchain
 */
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { irysService } from '../../services/irysService'

export function PostConfession({ onNewPost }) {
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [posting, setPosting] = useState(false)
  const { address, isConnected } = useAccount()

  const maxLength = 500
  const remainingChars = maxLength - content.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter a confession')
      return
    }

    if (content.length > maxLength) {
      toast.error(`Confession too long (${content.length}/${maxLength} characters)`)
      return
    }

    setPosting(true)
    
    try {
      // Initialize Irys service if needed
      if (!irysService.isReady()) {
        toast.info('Initializing blockchain connection...')
        // For now, we'll simulate the wallet connection
        // In the actual implementation, we'll need to get the wallet object from wagmi
        await irysService.initialize(window.ethereum)
      }

      const confessionData = {
        content: content.trim(),
        isPrivate,
        author: address,
        timestamp: new Date().toISOString(),
        type: 'confession'
      }

      toast.info('Uploading to Irys blockchain...')
      const result = await irysService.uploadConfession(confessionData, address)
      
      // Create confession object for local display
      const confession = {
        ...confessionData,
        txId: result.txId,
        viewUrl: result.viewUrl,
        explorerUrl: result.explorerUrl,
        comments: [],
        votes: 0,
        id: result.txId // Use transaction ID as unique identifier
      }

      // Add to local state for immediate display
      if (onNewPost) {
        onNewPost(confession)
      }

      // Clear form
      setContent('')
      setIsPrivate(false)
      
      
      toast.success(
        <div className="text-left">
          <div className="font-semibold text-green-300 mb-1">🎉 Confession Stored on Blockchain!</div>
          <div className="text-sm text-gray-300 mb-2">Your anonymous confession is now permanently stored on Irys devnet.</div>
          <div className="text-xs text-gray-400 bg-gray-800 rounded p-2 font-mono">
            TX: {result.txId}
          </div>
          <div className="flex gap-2 mt-2">
            <a 
              href={result.viewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs underline"
            >
              View on Explorer →
            </a>
            <a 
              href={`https://gateway.irys.xyz/${result.txId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-xs underline"
            >
              View Raw Data →
            </a>
          </div>
        </div>
      )
      
    } catch (error) {
      console.error('Failed to post confession:', error)
      toast.error(`Failed to post confession: ${error.message}`)
    } finally {
      setPosting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="post-form-wrapper bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">
            Please connect your MetaMask wallet to post anonymous confessions to the blockchain
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="post-form-wrapper bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white mb-2">Share Your Anonymous Confession</h2>
        <p className="text-gray-400 text-sm">
          Your confession will be permanently stored on Irys blockchain. Your wallet address will be shown as your anonymous identifier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your anonymous confession... Everything you write here will be permanently stored on the blockchain."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            rows={4}
            maxLength={maxLength}
            required
          />
          <div className={`absolute bottom-3 right-3 text-xs ${remainingChars < 50 ? 'text-yellow-400' : remainingChars < 20 ? 'text-red-400' : 'text-gray-500'}`}>
            {remainingChars} chars left
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300 text-sm">
              Private (encrypted before blockchain upload)
            </span>
          </label>

          <button
            type="submit"
            disabled={posting || !content.trim() || content.length > maxLength}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {posting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Posting to Blockchain...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Post to Blockchain
              </>
            )}
          </button>
        </div>

        {isPrivate && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-yellow-300 text-xs">
                <div className="font-semibold">Private Mode Enabled</div>
                <div>Your confession will be encrypted before being stored on the blockchain</div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default PostConfession