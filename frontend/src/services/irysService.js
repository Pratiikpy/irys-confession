/**
 * Irys Service for Blockchain Storage
 * Handles all interactions with Irys devnet for permanent data storage
 */
import { WebUploader } from '@irys/web-upload'
import { WebEthereum } from '@irys/web-upload-ethereum'

export class IrysService {
  constructor() {
    this.irys = null
    this.isInitialized = false
  }

  /**
   * Initialize Irys client with wallet connection
   * @param {Object} wallet - Ethereum wallet object
   * @returns {Promise<Object>} Initialized Irys client
   */
  async initialize(wallet) {
    try {
      this.irys = await WebUploader(WebEthereum)
        .withWallet(wallet)
        .withRpc('https://rpc.ankr.com/eth_sepolia') // Sepolia testnet RPC
        .devnet() // Use Irys devnet for testing
      
      this.isInitialized = true
      console.log('Irys service initialized successfully')
      return this.irys
    } catch (error) {
      console.error('Failed to initialize Irys service:', error)
      throw new Error(`Irys initialization failed: ${error.message}`)
    }
  }

  /**
   * Upload a confession to Irys blockchain
   * @param {Object} confessionData - Confession content and metadata
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Upload result with transaction ID and URLs
   */
  async uploadConfession(confessionData, walletAddress) {
    if (!this.isInitialized || !this.irys) {
      throw new Error('Irys service not initialized. Please connect wallet first.')
    }

    try {
      const tags = [
        { name: 'App', value: 'IrysConfessionBoard' },
        { name: 'Type', value: 'confession' },
        { name: 'Author', value: walletAddress },
        { name: 'Timestamp', value: Date.now().toString() },
        { name: 'Version', value: '1.0' }
      ]

      // Add privacy tag if confession is private
      if (confessionData.isPrivate) {
        tags.push({ name: 'Privacy', value: 'private' })
      }

      const dataToUpload = {
        ...confessionData,
        uploadedAt: new Date().toISOString(),
        blockchain: 'irys-devnet'
      }

      console.log('Uploading confession to Irys...', { tags, dataSize: JSON.stringify(dataToUpload).length })
      const receipt = await this.irys.upload(JSON.stringify(dataToUpload), { tags })
      
      return {
        txId: receipt.id,
        viewUrl: `https://devnet.irys.xyz/${receipt.id}`,
        explorerUrl: `https://devnet.irys.xyz/tx/${receipt.id}`,
        success: true
      }
    } catch (error) {
      console.error('Failed to upload confession to Irys:', error)
      throw new Error(`Confession upload failed: ${error.message}`)
    }
  }

  /**
   * Upload a comment to Irys blockchain
   * @param {Object} commentData - Comment content and metadata
   * @param {string} parentTxId - Transaction ID of parent confession
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Upload result with transaction ID and URLs
   */
  async uploadComment(commentData, parentTxId, walletAddress) {
    if (!this.isInitialized || !this.irys) {
      throw new Error('Irys service not initialized. Please connect wallet first.')
    }

    try {
      const tags = [
        { name: 'App', value: 'IrysConfessionBoard' },
        { name: 'Type', value: 'comment' },
        { name: 'Parent', value: parentTxId },
        { name: 'Author', value: walletAddress },
        { name: 'Timestamp', value: Date.now().toString() },
        { name: 'Version', value: '1.0' }
      ]

      const dataToUpload = {
        ...commentData,
        parentTxId,
        uploadedAt: new Date().toISOString(),
        blockchain: 'irys-devnet'
      }

      console.log('Uploading comment to Irys...', { parentTxId, tags })
      const receipt = await this.irys.upload(JSON.stringify(dataToUpload), { tags })
      
      return {
        txId: receipt.id,
        viewUrl: `https://devnet.irys.xyz/${receipt.id}`,
        explorerUrl: `https://devnet.irys.xyz/tx/${receipt.id}`,
        success: true
      }
    } catch (error) {
      console.error('Failed to upload comment to Irys:', error)
      throw new Error(`Comment upload failed: ${error.message}`)
    }
  }

  /**
   * Get Irys node info and balance
   * @returns {Promise<Object>} Node information and user balance
   */
  async getNodeInfo() {
    if (!this.isInitialized || !this.irys) {
      throw new Error('Irys service not initialized')
    }

    try {
      const balance = await this.irys.getBalance()
      return {
        balance: balance.toString(),
        currency: 'ETH',
        network: 'devnet',
        nodeUrl: 'https://devnet.irys.xyz'
      }
    } catch (error) {
      console.error('Failed to get Irys node info:', error)
      return {
        balance: '0',
        currency: 'ETH',
        network: 'devnet',
        error: error.message
      }
    }
  }

  /**
   * Check if service is ready for uploads
   * @returns {boolean} Service readiness status
   */
  isReady() {
    return this.isInitialized && this.irys !== null
  }
}

// Export singleton instance
export const irysService = new IrysService()