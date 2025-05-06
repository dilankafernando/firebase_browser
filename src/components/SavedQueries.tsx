import { useState } from 'react';
import { useQueryStore } from '../store/queryStore';

export default function SavedQueries() {
  const { savedQueries, loadSavedQuery, deleteSavedQuery } = useQueryStore();
  const [expanded, setExpanded] = useState(false);
  
  if (savedQueries.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        onClick={() => setExpanded(!expanded)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 mr-1 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Saved Queries ({savedQueries.length})
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {savedQueries.map((query) => (
            <div 
              key={query.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <button
                type="button"
                className="flex-grow text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => loadSavedQuery(query.id)}
              >
                {query.name}
              </button>
              <button
                type="button"
                onClick={() => deleteSavedQuery(query.id)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                aria-label={`Delete query ${query.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 