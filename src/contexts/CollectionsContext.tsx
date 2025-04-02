import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useWallet } from './WalletContext';
import { CollectionService, OEMCollection } from '../services/collections';

interface CollectionsContextType {
  collections: OEMCollection[];
  isLoading: boolean;
  error: string | null;
  searchResults: OEMCollection[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getCollectionsByCategory: (category: string) => Promise<OEMCollection[]>;
}

const CollectionsContext = createContext<CollectionsContextType>({
  collections: [],
  isLoading: false,
  error: null,
  searchResults: [],
  searchQuery: '',
  setSearchQuery: () => {},
  getCollectionsByCategory: async () => [],
});

export const useCollections = () => useContext(CollectionsContext);

export const CollectionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<OEMCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<OEMCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const collectionService = useMemo(() => new CollectionService(), []);

  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = collectionService.subscribeToUpdates((updatedCollections) => {
      setCollections(updatedCollections);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      collectionService.cleanup();
    };
  }, [collectionService]);

  // Handle search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        const results = await collectionService.searchCollections(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      }
    };

    performSearch();
  }, [searchQuery, collectionService]);

  const getCollectionsByCategory = async (category: string): Promise<OEMCollection[]> => {
    try {
      return await collectionService.getCollectionsByCategory(category);
    } catch (err) {
      console.error('Error fetching category collections:', err);
      return [];
    }
  };

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        isLoading,
        error,
        searchResults,
        searchQuery,
        setSearchQuery,
        getCollectionsByCategory,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}; 