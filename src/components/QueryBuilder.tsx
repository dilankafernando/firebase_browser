import { useState } from 'react';
import { useFirebaseStore } from '../store/firebaseStore';
import { useQueryStore } from '../store/queryStore';
import { FilterOperator, QueryFilter, OrderBy } from '../types';
import SavedQueries from './SavedQueries';

const FILTER_OPERATORS: FilterOperator[] = [
  '==', '!=', '<', '<=', '>', '>=', 'array-contains', 'array-contains-any', 'in', 'not-in'
];

export default function QueryBuilder() {
  const { collections } = useFirebaseStore();
  const { 
    currentQuery, 
    setCurrentQuery, 
    addFilter, 
    removeFilter, 
    addOrderBy, 
    removeOrderBy, 
    runQuery,
    isLoading 
  } = useQueryStore();
  
  const [newFilterField, setNewFilterField] = useState('');
  const [newFilterOperator, setNewFilterOperator] = useState<FilterOperator>('==');
  const [newFilterValue, setNewFilterValue] = useState('');
  
  const [newOrderField, setNewOrderField] = useState('');
  const [newOrderDirection, setNewOrderDirection] = useState<'asc' | 'desc'>('asc');
  
  const [saveQueryName, setSaveQueryName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const handleAddFilter = () => {
    if (!newFilterField || !newFilterValue) return;
    
    const filter: QueryFilter = {
      fieldPath: newFilterField,
      operator: newFilterOperator,
      value: newFilterValue
    };
    
    addFilter(filter);
    setNewFilterField('');
    setNewFilterValue('');
  };
  
  const handleAddOrderBy = () => {
    if (!newOrderField) return;
    
    const orderBy: OrderBy = {
      fieldPath: newOrderField,
      direction: newOrderDirection
    };
    
    addOrderBy(orderBy);
    setNewOrderField('');
  };
  
  const handleSaveQuery = () => {
    if (!saveQueryName) return;
    useQueryStore.getState().saveQuery(saveQueryName);
    setSaveQueryName('');
    setShowSaveDialog(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Query Builder
      </h2>
      
      <div className="space-y-6">
        {/* Collection Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Collection
          </label>
          <select
            className="input-field dark:bg-gray-700 dark:text-white"
            value={currentQuery.collection}
            onChange={(e) => setCurrentQuery({ collection: e.target.value })}
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filters */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filters
            </label>
          </div>
          
          {currentQuery.filters.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentQuery.filters.map((filter, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-gray-100 dark:bg-gray-700 rounded p-2"
                >
                  <span className="text-sm flex-grow truncate">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {filter.fieldPath}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 mx-1">
                      {filter.operator}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {filter.value.toString()}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    aria-label="Remove filter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Field"
              className="input-field dark:bg-gray-700 dark:text-white text-sm"
              value={newFilterField}
              onChange={(e) => setNewFilterField(e.target.value)}
            />
            <select
              className="input-field dark:bg-gray-700 dark:text-white text-sm"
              value={newFilterOperator}
              onChange={(e) => setNewFilterOperator(e.target.value as FilterOperator)}
            >
              {FILTER_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Value"
                className="input-field dark:bg-gray-700 dark:text-white text-sm flex-grow"
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFilter()}
              />
              <button
                type="button"
                onClick={handleAddFilter}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!newFilterField || !newFilterValue}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Order By */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Order By
            </label>
          </div>
          
          {currentQuery.orderBy.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentQuery.orderBy.map((order, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-gray-100 dark:bg-gray-700 rounded p-2"
                >
                  <span className="text-sm flex-grow truncate">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {order.fieldPath}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      ({order.direction})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOrderBy(index)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    aria-label="Remove order by"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Field"
              className="input-field dark:bg-gray-700 dark:text-white text-sm col-span-2"
              value={newOrderField}
              onChange={(e) => setNewOrderField(e.target.value)}
            />
            <select
              className="input-field dark:bg-gray-700 dark:text-white text-sm"
              value={newOrderDirection}
              onChange={(e) => setNewOrderDirection(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <button
              type="button"
              onClick={handleAddOrderBy}
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!newOrderField}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Limit
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            className="input-field dark:bg-gray-700 dark:text-white w-full"
            value={currentQuery.limit}
            onChange={(e) => setCurrentQuery({ limit: parseInt(e.target.value) || 50 })}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowSaveDialog(true)}
            className="px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Save Query
          </button>
          <button
            type="button"
            onClick={runQuery}
            className="btn-primary"
            disabled={isLoading || !currentQuery.collection}
          >
            {isLoading ? 'Running...' : 'Run Query'}
          </button>
        </div>
        
        {/* Save Query Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Save Query
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Query Name
                </label>
                <input
                  type="text"
                  className="input-field dark:bg-gray-700 dark:text-white w-full"
                  value={saveQueryName}
                  onChange={(e) => setSaveQueryName(e.target.value)}
                  placeholder="My Query"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuery}
                  className="btn-primary"
                  disabled={!saveQueryName}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Saved Queries */}
        <SavedQueries />
      </div>
    </div>
  );
} 