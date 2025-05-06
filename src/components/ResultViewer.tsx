import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { FirestoreDocument } from '../types';
import { toast } from 'react-hot-toast';

interface ResultViewerProps {
  activeView: 'table' | 'json';
  data: FirestoreDocument[];
}

export default function ResultViewer({ activeView, data }: ResultViewerProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Extract common fields from all documents for table columns
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    
    // Get all unique keys across all documents
    const allKeys = new Set<string>();
    data.forEach(doc => {
      allKeys.add('id');
      Object.keys(doc.data).forEach(key => allKeys.add(key));
    });
    
    const columnHelper = createColumnHelper<FirestoreDocument>();
    
    // Create columns for each field (limited to first 10 to avoid overwhelming the UI)
    const cols: ColumnDef<FirestoreDocument, any>[] = [];
    
    // Always include id first
    cols.push(
      columnHelper.accessor('id', {
        header: 'ID',
        cell: info => <div className="font-medium">{info.getValue()}</div>,
      })
    );
    
    // Add other fields (skip id since we already added it)
    Array.from(allKeys)
      .filter(key => key !== 'id')
      .slice(0, 9) // Limit to 9 additional columns (10 total including ID)
      .forEach(key => {
        cols.push(
          columnHelper.accessor(row => row.data[key], {
            id: key,
            header: key,
            cell: info => {
              const value = info.getValue();
              
              // Handle different value types
              if (value === null || value === undefined) {
                return <span className="text-gray-400">null</span>;
              } else if (typeof value === 'object') {
                return <span className="text-blue-600">{'{...}'}</span>;
              } else if (typeof value === 'boolean') {
                return <span className="text-purple-600">{value.toString()}</span>;
              } else if (Array.isArray(value)) {
                return <span className="text-green-600">[...]</span>;
              }
              
              return String(value);
            },
          })
        );
      });
    
    return cols;
  }, [data]);
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  const copyToClipboard = (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        const jsonString = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(jsonString);
        toast.success('Copied JSON to clipboard');
      } else {
        // CSV format
        if (data.length === 0) return;
        
        // Get headers from first row's keys
        const headers = ['id', ...Object.keys(data[0].data)];
        
        // Create CSV content
        const csvContent = [
          headers.join(','),
          ...data.map(doc => [
            doc.id,
            ...Object.keys(doc.data).map(key => {
              const val = doc.data[key];
              return typeof val === 'object' ? JSON.stringify(val) : val;
            }),
          ].join(',')),
        ].join('\n');
        
        navigator.clipboard.writeText(csvContent);
        toast.success('Copied CSV to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };
  
  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search results..."
          className="input-field dark:bg-gray-700 dark:text-white text-sm w-64"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => copyToClipboard('json')}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy as JSON
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard('csv')}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Copy as CSV
          </button>
        </div>
      </div>
      
      {activeView === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="ml-1">
                          {{
                            asc: '🔼',
                            desc: '🔽',
                          }[header.column.getIsSorted() as string] ?? ''}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td 
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="ml-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page{' '}
                <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                <span className="font-medium">{table.getPageCount()}</span>
              </div>
              <div>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="input-field dark:bg-gray-700 dark:text-white text-sm"
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  ← Prev
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  Next →
                </button>
              </nav>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-[70vh]">
          <JsonView 
            data={data} 
            shouldExpandNode={() => true} 
            style={{
              container: 'font-mono text-sm',
              key: 'text-blue-600 dark:text-blue-400',
              value: 'text-green-700 dark:text-green-500',
              boolean: 'text-purple-700 dark:text-purple-400',
              null: 'text-gray-500',
              string: 'text-orange-700 dark:text-orange-500',
              number: 'text-indigo-700 dark:text-indigo-400',
            }}
          />
        </div>
      )}
    </div>
  );
} 