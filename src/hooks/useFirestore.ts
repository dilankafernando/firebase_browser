import { useQuery } from '@tanstack/react-query';
import { getCollections, getDocuments } from '../services/firestoreService';
import { useStore } from '../store';
import { useState } from 'react';
import { FirestoreData } from '../store';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

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

// Hook to fetch documents from a specific collection with pagination
export const useCollectionData = (collectionName: string) => {
  const setError = useStore((state) => state.setError);
  const setLoading = useStore((state) => state.setLoading);
  const [lastDocSnapshot, setLastDocSnapshot] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSnapshots, setPageSnapshots] = useState<Map<number, QueryDocumentSnapshot<DocumentData>>>(new Map());
  const pageSize = 100;

  const queryResult = useQuery({
    queryKey: ['collection', collectionName, currentPage],
    queryFn: async () => {
      // If going back to a previous page, use the stored snapshot
      const lastSnapshot = currentPage > 1 ? pageSnapshots.get(currentPage - 1) || null : null;
      const result = await getDocuments(collectionName, pageSize, lastSnapshot);
      
      // Store the last document snapshot for this page
      if (result.lastDoc) {
        setPageSnapshots(prev => {
          const newMap = new Map(prev);
          newMap.set(currentPage, result.lastDoc!);
          return newMap;
        });
      }
      
      // Update pagination state
      setLastDocSnapshot(result.lastDoc);
      setHasMore(result.documents.length === pageSize);
      
      return result.documents;
    },
    enabled: !!collectionName,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
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

  const nextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
    setLastDocSnapshot(null);
    setHasMore(true);
    setPageSnapshots(new Map());
  };

  return {
    ...queryResult,
    currentPage,
    hasMore,
    nextPage,
    previousPage,
    resetPagination
  };
}; 