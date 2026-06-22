export interface KnowledgeChunk {
  id: string;
  topic: string;
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'sui-overview',
    topic: 'Sui Blockchain',
    keywords: ['sui', 'blockchain', 'move', 'object', 'transaction', 'gas'],
    content:
      'Sui is a Layer-1 blockchain using the Move language and an object-centric model. Assets are represented as objects with ownership tracked on-chain. Transactions mutate objects and pay gas in SUI. Testnet is recommended for development; mainnet requires real SUI for gas.',
  },
  {
    id: 'zklogin',
    topic: 'zkLogin Authentication',
    keywords: ['zklogin', 'login', 'oauth', 'google', 'apple', 'wallet', 'auth'],
    content:
      'zkLogin lets users sign in with OAuth providers (Google, Apple) and derive a Sui address without managing seed phrases. Ripple Studio uses zkLogin for creator authentication. Each user gets a deterministic Sui address from their OAuth identity plus an encrypted salt vault.',
  },
  {
    id: 'walrus-storage',
    topic: 'Walrus Decentralized Storage',
    keywords: ['walrus', 'storage', 'blob', 'upload', 'aggregator', 'wal', 'decentralized'],
    content:
      'Walrus is decentralized blob storage on Sui. Upload images and metadata JSON to get a blob_id. Serve content via aggregator URLs: GET {AGGREGATOR}/v1/blobs/{blob_id}. Testnet has a public publisher; mainnet requires a signer key or private publisher. Storage is paid in WAL tokens per epoch.',
  },
  {
    id: 'sui-nft-display',
    topic: 'Sui NFT Metadata Standard',
    keywords: ['metadata', 'display', 'nft', 'attributes', 'image_url', 'name'],
    content:
      'Sui NFT metadata follows the Display standard: name, description, image_url, attributes (trait_type + value), and optional project_url. On-chain Display objects should reference Walrus blob URLs, never local staging URLs. Ripple Studio auto-generates compliant metadata in the metadata engine step.',
  },
  {
    id: 'kiosk-marketplace',
    topic: 'Sui Kiosk and Marketplaces',
    keywords: ['kiosk', 'marketplace', 'tradeport', 'listing', 'royalty', 'transfer policy'],
    content:
      'Sui Kiosk is the native commerce primitive for NFT trading. Collections use TransferPolicy for royalties. TradePort, BlueMove, and Clutchy are popular Sui marketplaces. Deployment (PR-11+) will publish Move packages with Publisher caps and Kiosk integration.',
  },
  {
    id: 'ripple-workflow',
    topic: 'Ripple Studio Creator Workflow',
    keywords: ['ripple', 'workflow', 'create', 'wizard', 'generate', 'collection', 'steps'],
    content:
      'Ripple Studio workflow: 1) Sign in with zkLogin, 2) Create collection (name, supply, royalty), 3) Upload trait folders per layer, 4) Configure layer order and rarity weights, 5) Preview combinations, 6) Generate unique NFT images, 7) Store images on Walrus, 8) Generate and export metadata JSON. MVP supports up to 500 NFTs per collection.',
  },
  {
    id: 'trait-layers',
    topic: 'Trait Layers and Rarity',
    keywords: ['trait', 'layer', 'rarity', 'weight', 'combinations', 'supply', 'duplicate'],
    content:
      'Each trait folder becomes a layer (e.g. Background, Eyes). Layers stack in display order for compositing. Rarity weights control selection frequency during generation. Unique combinations are deduplicated by trait hash. Supply cannot exceed the number of unique trait combinations.',
  },
  {
    id: 'gas-and-costs',
    topic: 'Costs and Gas',
    keywords: ['cost', 'gas', 'price', 'wal', 'sui', 'fee', 'budget'],
    content:
      'Walrus storage costs ~$0.023/GB/month paid in WAL. SUI is needed for on-chain transactions (deploy, mint). Testnet WAL and SUI are free via faucets. Ripple Studio shows Walrus cost estimates before upload. Generation and metadata are platform-computed; only storage and deployment incur chain costs.',
  },
  {
    id: 'memwal-memory',
    topic: 'MemWal Creator Memory',
    keywords: ['memwal', 'memory', 'agent', 'context', 'personalization', 'remember', 'recall'],
    content:
      'Ripple Studio uses MemWal-backed memory spaces per creator: profile (brand voice), collections (past projects), conversations (chat history), and preferences. PostgreSQL caches all memories as fallback. The Creator Coach recalls relevant memories to personalize advice — e.g. "create another like Cyber Explorers" loads past collection context.',
  },
];