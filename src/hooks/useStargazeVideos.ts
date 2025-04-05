import { useState, useEffect } from 'react';

interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  creator: string;
  category?: string;
  thumbnail?: string;
  music?: string;
  minted?: string;
  totalSupply?: string;
  price?: string;
  videoUrl?: string;
}

interface TokenTrait {
  name: string;
  value: string;
}

interface Token {
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  traits: TokenTrait[];
}

interface Collection {
  name: string;
  description: string;
  image: string;
  createdByAddr: string;
  floorPrice?: number;
}

const GRAPHQL_ENDPOINT = '/graphql';

const COLLECTIONS = [
  'stars1jkee98qm7flr78kr0f5j7des35v83cdrp9l92ye0lpffeyh5n7xsu0vz49',
  'stars1sryvfl50ep8u450u27qj7fgularqfxycwqhdp057260lvuhpkfvs28fag0'
];

// Mock data for development
const MOCK_TRAITS = {
  category: 'Educational',
  music: 'Original Score',
};

export const useStargazeVideos = () => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch collections
        const collectionsData = await Promise.all(
          COLLECTIONS.map(async (address) => {
            const response = await fetch(GRAPHQL_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  query GetCollection($address: String!) {
                    collection(collectionAddr: $address) {
                      name
                      description
                      image
                      createdByAddr
                      floorPrice
                    }
                  }
                `,
                variables: {
                  address
                }
              }),
              credentials: 'omit',
            });

            if (!response.ok) {
              throw new Error(`GraphQL endpoint failed with status ${response.status}`);
            }

            const data = await response.json();
            
            if (data?.errors) {
              throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }

            return data?.data?.collection as Collection;
          })
        );

        // Then fetch token #1 from each collection
        const videoData = await Promise.all(
          collectionsData.map(async (collection, idx) => {
            if (!collection) return null;

            // Always fetch token #1
            const tokenId = '1';

            const response = await fetch(GRAPHQL_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  query GetTokenMetadata($collectionAddr: String!, $tokenId: String!) {
                    token(collectionAddr: $collectionAddr, tokenId: $tokenId) {
                      tokenId
                      name
                      description
                      imageUrl
                      animationUrl
                      traits {
                        name
                        value
                      }
                    }
                  }
                `,
                variables: {
                  collectionAddr: COLLECTIONS[idx],
                  tokenId
                }
              }),
              credentials: 'omit',
            });

            if (!response.ok) {
              throw new Error(`GraphQL endpoint failed with status ${response.status}`);
            }

            const data = await response.json();
            
            if (data?.errors) {
              throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }

            const token = data?.data?.token as Token;
            if (!token) return null;

            // Convert IPFS URL to gateway URL
            const ipfsUrl = token.imageUrl?.replace('ipfs://', 'https://ipfs.io/ipfs/');

            const videoMetadata: VideoMetadata = {
              id: `${COLLECTIONS[idx]}-${token.tokenId}`,
              title: token.name || collection.name || 'Untitled Video',
              description: token.description || collection.description || 'No description available',
              creator: collection.createdByAddr || 'Unknown Creator',
              category: token.traits?.find((t: TokenTrait) => t.name.toLowerCase() === 'category')?.value,
              thumbnail: ipfsUrl,
              music: token.traits?.find((t: TokenTrait) => t.name.toLowerCase() === 'music')?.value,
              minted: '1', // Since we can fetch the token, it's minted
              totalSupply: '100', // Mock value for now
              price: collection.floorPrice ? `${collection.floorPrice} STARS` : 'TBA',
              videoUrl: ipfsUrl // Using imageUrl for video during testing
            };

            return videoMetadata;
          })
        );

        setVideos(videoData.filter((video): video is VideoMetadata => video !== null));
      } catch (err) {
        console.error('Error fetching video metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch video metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return { videos, loading, error };
}; 