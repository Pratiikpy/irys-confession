import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Define Irys testnet chain
export const irysTestnet = {
  id: 1270,
  name: 'Irys Testnet',
  network: 'irys-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IRYS',
    symbol: 'IRYS'
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc']
    },
    public: {
      http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc']
    }
  },
  blockExplorers: {
    default: {
      name: 'Irys Explorer',
      url: 'https://testnet-explorer.irys.xyz'
    }
  },
  testnet: true
}

// Define supported chains
export const supportedChains = [irysTestnet, sepolia, mainnet]

// Get project ID from environment
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// App metadata
const metadata = {
  name: 'Irys Confession Board',
  description: 'A decentralized confession board powered by Irys blockchain',
  url: 'https://irys-confession-board.vercel.app',
  icons: ['https://irys.xyz/favicon.ico']
}

// Create wagmi config
export const config = defaultWagmiConfig({
  chains: supportedChains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  })
})

// Wallet configuration
export const walletConfig = {
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
    '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
  ],
  excludeWalletIds: [],
  termsConditionsUrl: 'https://irys.xyz/terms',
  privacyPolicyUrl: 'https://irys.xyz/privacy'
}