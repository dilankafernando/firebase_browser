import { useQuery } from '@tanstack/react-query';
import { getCollections, getDocuments } from '../services/firestoreService';
import { useStore } from '../store';

// Hook to fetch collections
export const useCollections = () => {
  const setCollections = useStore((state) => state.setCollections);
  const setError = useStore((state) => state.setError);
  const setLoading = useStore((state) => state.setLoading);

  return useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 1, // Only retry once to avoid too many requests
    retryDelay: 1000, // Wait 1 second before retrying
    onSuccess: (data) => {
      setCollections(data);
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Collection fetch error:', error);
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
};

// Hook to fetch documents from a specific collection
export const useCollectionData = (collectionName: string) => {
  const setError = useStore((state) => state.setError);
  const setLoading = useStore((state) => state.setLoading);

  return useQuery({
    queryKey: ['collection', collectionName],
    queryFn: () => getDocuments(collectionName),
    enabled: !!collectionName, // Only run the query if a collection is selected
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    onSuccess: () => {
      setError(null);
    },
    onError: (error: Error) => {
      console.error(`Error fetching collection ${collectionName}:`, error);
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
}; 