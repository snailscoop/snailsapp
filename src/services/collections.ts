import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const STARGAZE_RPC = "https://rpc.stargaze-apis.com/";
const CONTRACT_ADDRESS = "stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0";

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
        const collections = await this.fetchLatestData();
        this.notifySubscribers(collections);
      } catch (error) {
        console.error('Error polling collection data:', error);
      }
    }, 5000);
  }

  private async fetchLatestData(): Promise<OEMCollection[]> {
    if (!this.client) {
      await this.initializeClient();
    }

    const [metadata, mintConfig] = await Promise.all([
      this.client!.queryContractSmart(CONTRACT_ADDRESS, { contract_info: {} }),
      this.getMintConfig(CONTRACT_ADDRESS)
    ]);

    return [{
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
      platform: metadata.youtube_url ? "youtube" : "rumble"
    }];
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
      const configQuery = {
        config: {}
      };
      const config = await this.client!.queryContractSmart(contractAddress, configQuery);
      
      let status: 'active' | 'ended' | 'upcoming' = 'upcoming';
      if (config.start_time && new Date(config.start_time * 1000) > new Date()) {
        status = 'upcoming';
      } else if (config.token_count >= config.num_tokens) {
        status = 'ended';
      } else {
        status = 'active';
      }

      return {
        price: config.unit_price ? `${parseInt(config.unit_price) / 1000000} STARS` : "TBA",
        maxTokens: config.num_tokens || 0,
        mintedTokens: config.token_count || 0,
        status
      };
    } catch (error) {
      console.error('Error fetching mint config:', error);
      return null;
    }
  }
} 