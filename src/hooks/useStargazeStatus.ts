import { useState, useEffect } from 'react';

const GRAPHQL_ENDPOINTS = [
  '/graphql',
  '/graphql-fallback'
];

const RETRY_INTERVAL = 5000; // 5 seconds between retries
const MAX_RETRIES = 3;

export const useStargazeStatus = () => {
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>('red');
  const [currentEndpoint, setCurrentEndpoint] = useState(GRAPHQL_ENDPOINTS[0]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        console.log(`Attempting to connect to Stargaze API at ${currentEndpoint}`);
        
        const response = await fetch(currentEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: `
              {
                blocks(first: 1) {
                  edges {
                    node {
                      blockHeight
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            `,
          }),
          credentials: 'omit',
        });

        console.log(`Stargaze API response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`GraphQL endpoint failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Stargaze API response:', data);
        
        if (data?.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        if (data?.data?.blocks?.edges?.[0]?.node?.blockHeight) {
          console.log('Successfully connected to Stargaze API');
          setStatus('green');
          setRetryCount(0);
        } else {
          throw new Error('Invalid response from GraphQL endpoint');
        }
      } catch (error) {
        console.error('Stargaze API check failed:', error);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setStatus('yellow');
        } else {
          // Try fallback endpoint if available
          const nextEndpointIndex = GRAPHQL_ENDPOINTS.indexOf(currentEndpoint) + 1;
          if (nextEndpointIndex < GRAPHQL_ENDPOINTS.length) {
            console.log(`Switching to fallback endpoint: ${GRAPHQL_ENDPOINTS[nextEndpointIndex]}`);
            setCurrentEndpoint(GRAPHQL_ENDPOINTS[nextEndpointIndex]);
            setRetryCount(0);
            setStatus('yellow');
          } else {
            console.error('All endpoints failed');
            setStatus('red');
          }
        }
      }
    };

    checkEndpoint();
    const interval = setInterval(checkEndpoint, RETRY_INTERVAL);
    return () => clearInterval(interval);
  }, [currentEndpoint, retryCount]);

  return { status, endpoint: currentEndpoint };
}; 