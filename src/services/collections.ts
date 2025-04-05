import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { isEqual } from 'lodash';

const STARGAZE_RPC = "https://rpc.stargaze-apis.com/";
const CONTRACT_ADDRESS = "stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0";
const OM_IBC_DENOM = 'ibc/3BD86E80E000B52DA57C474A6A44E37F73D34E38A1FA79EE678E08D119FC555B';

export interface OEMCollection {
  contractAddress: string;
  name: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  creator: {
    name: string;
    link: string;
  };
  duration: string;
  mintInfo: {
    price: {
      amount: string;
      denom: string;
    };
    totalSupply: number;
    mintedCount: number;
    mintStatus: 'active' | 'ended' | 'upcoming';
  };
  topics: string[];
  platform: 'youtube' | 'rumble';
}

export class CollectionService {
  private client: CosmWasmClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private updateCallbacks: ((collections: OEMCollection[]) => void)[] = [];
  private lastFetchedData: OEMCollection[] | null = null;
  private lastFetchTime: number = 0;
  private readonly FETCH_COOLDOWN = 10000; // 10 seconds minimum between fetches

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = await CosmWasmClient.connect(STARGAZE_RPC);
      this.startPolling();
    } catch (error) {
      console.error('Failed to initialize CosmWasm client:', error);
      throw new Error('Failed to connect to Stargaze network');
    }
  }

  private startPolling() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(async () => {
      try {
        const now = Date.now();
        // Only fetch if enough time has passed since last fetch
        if (now - this.lastFetchTime >= this.FETCH_COOLDOWN) {
          const collections = await this.fetchLatestData();
          // Only notify if data has changed
          if (!this.lastFetchedData || !isEqual(collections, this.lastFetchedData)) {
            this.lastFetchedData = collections;
            this.notifySubscribers(collections);
          }
          this.lastFetchTime = now;
        }
      } catch (error) {
        console.error('Error polling collection data:', error);
      }
    }, 10000); // Increased polling interval to 10 seconds
  }

  private async fetchLatestData(): Promise<OEMCollection[]> {
    if (!this.client) {
      await this.initializeClient();
    }

    // Return cached data if within cooldown period
    const now = Date.now();
    if (this.lastFetchedData && (now - this.lastFetchTime < this.FETCH_COOLDOWN)) {
      return this.lastFetchedData;
    }

    try {
      const [metadata, mintConfig] = await Promise.all([
        this.client!.queryContractSmart(CONTRACT_ADDRESS, { contract_info: {} }),
        this.getMintConfig(CONTRACT_ADDRESS)
      ]);

      const platform = metadata.youtube_url ? "youtube" as const : "rumble" as const;
      const collections: OEMCollection[] = [{
        contractAddress: CONTRACT_ADDRESS,
        name: metadata.name || "Educational Video",
        description: metadata.description || "Learn about the Cosmos ecosystem",
        videoUrl: metadata.animation_url || metadata.youtube_url || "",
        thumbnailUrl: metadata.image || "/path/to/default-thumbnail.jpg",
        creator: {
          name: metadata.creator || "SNAILS DAO",
          link: `/creator/${metadata.creator || "snails-dao"}`
        },
        duration: metadata.duration || "00:00",
        mintInfo: {
          price: {
            amount: mintConfig?.price?.split(' ')[0] || "0",
            denom: mintConfig?.price?.split(' ')[1] || "STARS"
          },
          totalSupply: mintConfig?.maxTokens || 0,
          mintedCount: mintConfig?.mintedTokens || 0,
          mintStatus: mintConfig?.status || "upcoming"
        },
        topics: metadata.attributes?.map((attr: any) => attr.value) || ["education", "cosmos"],
        platform
      }];

      this.lastFetchedData = collections;
      this.lastFetchTime = now;
      return collections;
    } catch (error) {
      console.error('Error fetching collection data:', error);
      // Return last known good data if available
      return this.lastFetchedData || [];
    }
  }

  private notifySubscribers(collections: OEMCollection[]) {
    this.updateCallbacks.forEach(callback => callback(collections));
  }

  // Public methods
  async getCollectionData(): Promise<OEMCollection[]> {
    return this.fetchLatestData();
  }

  subscribeToUpdates(callback: (collections: OEMCollection[]) => void) {
    this.updateCallbacks.push(callback);
    // Immediately fetch and send data to the new subscriber
    this.fetchLatestData().then(collections => callback(collections));
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  async getCollectionsByCategory(category: string): Promise<OEMCollection[]> {
    return this.fetchLatestData();
  }

  async searchCollections(query: string): Promise<OEMCollection[]> {
    const collections = await this.fetchLatestData();
    const lowercaseQuery = query.toLowerCase();
    return collections.filter(c => 
      c.name.toLowerCase().includes(lowercaseQuery) ||
      c.description.toLowerCase().includes(lowercaseQuery) ||
      c.creator.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Cleanup method
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateCallbacks = [];
  }

  private async getMintConfig(contractAddress: string) {
    try {
      // First get the minter contract address
      const minterResponse = await this.client!.queryContractSmart(contractAddress, {
        minter: {}
      });

      // Then get the mint configuration from the minter contract
      const minterConfig = await this.client!.queryContractSmart(minterResponse.minter, {
        mint_price: {}
      });

      // Get collection info for token count
      const collectionInfo = await this.client!.queryContractSmart(contractAddress, {
        collection_info: {}
      });
      
      let status: 'active' | 'ended' | 'upcoming' = 'upcoming';
      if (minterConfig.start_time && new Date(minterConfig.start_time * 1000) > new Date()) {
        status = 'upcoming';
      } else if (collectionInfo.num_tokens >= minterConfig.num_tokens) {
        status = 'ended';
      } else {
        status = 'active';
      }

      return {
        price: minterConfig.amount ? `${parseInt(minterConfig.amount) / 1000000} ${minterConfig.denom === OM_IBC_DENOM ? '$OM' : 'STARS'}` : "TBA",
        maxTokens: minterConfig.num_tokens || 0,
        mintedTokens: collectionInfo.num_tokens || 0,
        status
      };
    } catch (error) {
      console.error('Error fetching mint config:', error);
      return null;
    }
  }
} 