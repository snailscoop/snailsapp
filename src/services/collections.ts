import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { isEqual } from 'lodash';
import { STARGAZE_RPC } from '../config';

const CONTRACT_ADDRESS = "stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0";

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  platform: 'youtube' | 'rumble';
}

export interface Collection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  mintConfig?: {
    price: string;
    startTime: string;
    endTime?: string;
  };
}

export class CollectionService {
  private client: CosmWasmClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private updateCallbacks: ((collections: Collection[]) => void)[] = [];
  private lastFetchedData: Collection[] | null = null;
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
        if (now - this.lastFetchTime >= this.FETCH_COOLDOWN) {
          const collections = await this.fetchLatestData(CONTRACT_ADDRESS);
          if (!this.lastFetchedData || !isEqual(collections, this.lastFetchedData)) {
            this.lastFetchedData = [collections];
            this.notifySubscribers([collections]);
          }
          this.lastFetchTime = now;
        }
      } catch (error) {
        console.error('Error polling collection data:', error);
      }
    }, 10000);
  }

  private notifySubscribers(collections: Collection[]) {
    this.updateCallbacks.forEach(callback => callback(collections));
  }

  private async getClient(): Promise<CosmWasmClient> {
    if (!this.client) {
      this.client = await CosmWasmClient.connect(STARGAZE_RPC);
    }
    return this.client;
  }

  async getCollectionInfo(address: string): Promise<Collection> {
    const client = await this.getClient();
    const queryMsg = {
      collection_info: {}
    };
    const result = await client.queryContractSmart(address, queryMsg);
    return {
      address,
      name: result.name,
      symbol: result.symbol,
      description: result.description,
      image: result.image
    };
  }

  async getMintConfig(address: string): Promise<Collection['mintConfig'] | null> {
    try {
      const client = await this.getClient();
      const queryMsg = {
        minter: {}
      };
      const result = await client.queryContractSmart(address, queryMsg);
      return result?.mint_config || null;
    } catch (error) {
      console.warn('Could not fetch mint config:', error);
      return null;
    }
  }

  async fetchLatestData(address: string): Promise<Collection> {
    const [collectionInfo, mintConfig] = await Promise.all([
      this.getCollectionInfo(address),
      this.getMintConfig(address)
    ]);

    return {
      ...collectionInfo,
      mintConfig: mintConfig || undefined
    };
  }

  // Public methods
  async getCollectionData(): Promise<Collection[]> {
    const collection = await this.fetchLatestData(CONTRACT_ADDRESS);
    return [collection];
  }

  subscribeToUpdates(callback: (collections: Collection[]) => void) {
    this.updateCallbacks.push(callback);
    this.getCollectionData().then(collections => callback(collections));
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Cleanup method
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateCallbacks = [];
  }
}

export const collectionService = new CollectionService(); 