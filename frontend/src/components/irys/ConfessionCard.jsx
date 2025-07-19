/**
 * Confession Card Component
 * Displays individual confessions with comments and blockchain verification
 */
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { irysService } from '../../services/irysService'

export function ConfessionCard({ confession }) {
  const [comments, setComments] = useState(confession.comments || [])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const { address, isConnected } = useAccount()

  const maxCommentLength = 200

  const formatAddress = (addr) => {
    if (!addr) return 'Anonymous'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return 'Unknown time'
    }
  }

  const handleAddComment = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (newComment.length > maxCommentLength) {
      toast.error(`Comment too long (${newComment.length}/${maxCommentLength} characters)`)
      return
    }

    setCommentSubmitting(true)

    try {
      const commentData = {
        content: newComment.trim(),
        author: address,
        timestamp: new Date().toISOString(),
        parentTxId: confession.txId,
        type: 'comment'
      }

      toast.info('Posting comment to blockchain...')
      const result = await irysService.uploadComment(
        commentData, 
        confession.txId, 
        address
      )

      const comment = {
        ...commentData,
        txId: result.txId,
        viewUrl: result.viewUrl,
        explorerUrl: result.explorerUrl,
        id: result.txId
      }

      setComments(prevComments => [...prevComments, comment])
      setNewComment('')
      
      toast.success(
        <div>
          <div className="font-semibold">Comment posted to blockchain!</div>
          <div className="text-sm opacity-75">TX: {result.txId.slice(0, 12)}...</div>
        </div>
      )

    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error(`Failed to post comment: ${error.message}`)
    } finally {
      setCommentSubmitting(false)
    }
  }

  return (
    <div className="confession-card bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {confession.author ? confession.author.slice(2, 4).toUpperCase() : 'AN'}
            </span>
          </div>
          <div>
            <div className="text-gray-300 font-medium">
              {formatAddress(confession.author)}
            </div>
            <div className="text-gray-500 text-xs">
              {formatTimestamp(confession.timestamp)}
            </div>
          </div>
        </div>

        <a 
          href={confession.viewUrl || confession.explorerUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on Irys
        </a>
      </div>

      {/* Content */}
      <div className="confession-content">
        <p className="text-white leading-relaxed">
          {confession.content}
        </p>
        
        {confession.isPrivate && (
          <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/20 border border-yellow-600/30 rounded text-yellow-300 text-xs">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private
          </div>
        )}
      </div>

      {/* Actions & Blockchain Proof */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        {/* Left side - Comments button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">Comments ({comments.length})</span>
        </button>

        {/* Right side - Blockchain verification */}
        <div className="flex items-center gap-3">
          {/* Blockchain Proof Badge */}
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-600/30 rounded-lg px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-xs font-medium">✓ Permanently Stored</span>
          </div>
          
          {/* Transaction ID Display */}
          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg px-3 py-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs font-mono">
              TX: {confession.txId ? `${confession.txId.slice(0, 8)}...` : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Blockchain Explorer Links Row */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <div className="text-xs text-gray-500">
          🔗 This confession is permanently stored on Irys blockchain
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={confession.viewUrl || confession.explorerUrl || `https://devnet.irys.xyz/${confession.txId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Irys
          </a>
          <a 
            href={`https://gateway.irys.xyz/${confession.txId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Raw Data
          </a>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section space-y-4 pt-4 border-t border-gray-800">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <div key={comment.id || index} className="comment bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {comment.author ? comment.author.slice(2, 4).toUpperCase() : 'AN'}
                        </span>
                      </div>
                      <span className="text-gray-300 text-sm">
                        {formatAddress(comment.author)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTimestamp(comment.timestamp)}
                      </span>
                    </div>
                    
                    {comment.viewUrl && (
                      <a 
                        href={comment.viewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Irys
                      </a>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          {isConnected ? (
            <div className="add-comment space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment to the blockchain..."
                  maxLength={maxCommentLength}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {maxCommentLength - newComment.length}
                </div>
              </div>
              
              <button
                onClick={handleAddComment}
                disabled={commentSubmitting || !newComment.trim() || newComment.length > maxCommentLength}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {commentSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
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
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                Connect your wallet to post comments
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConfessionCard