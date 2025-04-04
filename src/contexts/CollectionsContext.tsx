import React, { createContext, useContext, useState, useEffect } from 'react';
import { collectionService, Collection } from '../services/collections';

interface CollectionsContextType {
  collections: Collection[];
  loading: boolean;
  error: Error | null;
}

const CollectionsContext = createContext<CollectionsContextType>({
  collections: [],
  loading: true,
  error: null
});

export const useCollections = () => useContext(CollectionsContext);

export const CollectionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = collectionService.subscribeToUpdates((newCollections: Collection[]) => {
      setCollections(newCollections);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
      collectionService.cleanup();
    };
  }, []);

  return (
    <CollectionsContext.Provider value={{ collections, loading, error }}>
      {children}
    </CollectionsContext.Provider>
  );
}; 