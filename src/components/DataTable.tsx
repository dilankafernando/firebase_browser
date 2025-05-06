import React, { useMemo, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Box,
  styled,
  Pagination,
  Button,
  ButtonGroup,
  Tooltip,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Collapse,
  Alert,
  InputAdornment,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useStore } from '../store';
import { useCollectionData } from '../hooks/useFirestore';
import { FirestoreData } from '../store';
import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Styled components for bordered table
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:last-child td, &:last-child th': {
    border: `1px solid ${theme.palette.divider}`,
  },
}));

// Pretty JSON component for syntax highlighting
const JsonDisplay = styled('pre')(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  overflowX: 'auto',
  margin: 0,
  fontSize: '0.875rem',
  fontFamily: "'Roboto Mono', monospace",
  lineHeight: 1.5,
  '& span': {
    fontFamily: "'Roboto Mono', monospace", // Ensure font consistency
  }
}));

// Filter types
type FilterOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'startsWith' | 'endsWith' | 'notEquals';
type ViewMode = 'table' | 'json';

interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
];

// Format JSON with syntax highlighting - completely rewritten to use a simpler approach
const formatJson = (obj: any): string => {
  if (!obj) return '';
  
  // Convert the object to a formatted JSON string
  const jsonString = JSON.stringify(obj, null, 2);
  
  // Use a simpler approach with direct styling
  return jsonString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span style="color: #2196f3;">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color: #4caf50;">"$1"</span>')
    .replace(/: (true|false)/g, ': <span style="color: #f44336;">$1</span>')
    .replace(/: (null)/g, ': <span style="color: #9e9e9e;">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #ff9800;">$1</span>');
};

const DataTable: React.FC = () => {
  const { selectedCollection } = useStore();
  const { data, isLoading, isError, error } = useCollectionData(selectedCollection);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 100;
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filteredData, setFilteredData] = useState<FirestoreData[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedRecord, setSelectedRecord] = useState<FirestoreData | null>(null);
  const [isJsonDetailOpen, setIsJsonDetailOpen] = useState(false);

  // Data manipulation state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableRow, setEditableRow] = useState<FirestoreData | null>(null);
  const [editableCell, setEditableCell] = useState<{rowId: string, field: string, value: any} | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, any>>({ id: '' });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<FirestoreData | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Reset page when collection changes
  useEffect(() => {
    setCurrentPage(1);
    setFilters([]);
    setGlobalSearchTerm('');
    setShowFilters(false);
  }, [selectedCollection]);

  // Apply filters to data
  useEffect(() => {
    if (!data) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // Apply global search term if provided
    if (globalSearchTerm.trim()) {
      const searchTermLower = globalSearchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTermLower);
        });
      });
    }

    // Apply each filter
    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          const fieldValue = item[filter.field];
          if (fieldValue === undefined || fieldValue === null) {
            return filter.operator === 'notEquals'; // Only "not equals" passes for null/undefined
          }
          
          const itemValue = String(fieldValue).toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.operator) {
            case 'equals':
              return itemValue === filterValue;
            case 'notEquals':
              return itemValue !== filterValue;
            case 'contains':
              return itemValue.includes(filterValue);
            case 'startsWith':
              return itemValue.startsWith(filterValue);
            case 'endsWith':
              return itemValue.endsWith(filterValue);
            case 'greaterThan':
              return !isNaN(Number(itemValue)) && !isNaN(Number(filterValue)) 
                ? Number(itemValue) > Number(filterValue)
                : itemValue > filterValue;
            case 'lessThan':
              return !isNaN(Number(itemValue)) && !isNaN(Number(filterValue)) 
                ? Number(itemValue) < Number(filterValue)
                : itemValue < filterValue;
            default:
              return true;
          }
        });
      });
    }

    setFilteredData(result);
  }, [data, filters, globalSearchTerm]);

  // Calculate pagination details
  const totalRecords = filteredData?.length || 0;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
  const currentData = filteredData?.slice(startIndex, endIndex) || [];

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Navigate to next/previous page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Extract column headers from data
  const columns = useMemo(() => {
    if (!data || data.length === 0) return ['id'];
    
    // Get all unique keys from all documents
    const allKeys = new Set<string>();
    allKeys.add('id'); // Always include ID
    
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        allKeys.add(key);
      });
    });
    
    return Array.from(allKeys);
  }, [data]);

  // Format cell data appropriately based on type
  const formatCellData = (value: any) => {
    if (value === null || value === undefined) {
      return '';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  // Add new filter
  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      field: columns[0],
      operator: 'equals',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  // Remove filter
  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  // Update filter
  const updateFilter = (filterId: string, field: keyof Filter, value: string | FilterOperator) => {
    setFilters(filters.map(f => 
      f.id === filterId 
        ? { ...f, [field]: value } 
        : f
    ));
    
    // Force blur on the active element to close any open dropdowns
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 50);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters([]);
    setGlobalSearchTerm('');
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (!showFilters && filters.length === 0) {
      addFilter();
    }
  };

  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Open JSON detail view
  const handleOpenJsonDetail = (record: FirestoreData) => {
    setSelectedRecord(record);
    setIsJsonDetailOpen(true);
  };

  // Close JSON detail view
  const handleCloseJsonDetail = () => {
    setIsJsonDetailOpen(false);
  };

  // Copy JSON to clipboard
  const handleCopyJson = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2))
      .then(() => {
        alert('JSON copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Database operation handlers
  const handleAddRow = async () => {
    if (!selectedCollection) return;
    
    try {
      // Add created timestamp
      const rowToAdd = {
        ...newRow,
        createdAt: serverTimestamp(),
      };
      
      // Remove empty id if it wasn't provided (Firestore will generate one)
      let idToUse = newRow.id;
      if (!newRow.id || newRow.id.trim() === '') {
        delete rowToAdd.id;
        idToUse = null; // We'll get the actual ID from the addDoc response
      }
      
      const docRef = await addDoc(collection(db, selectedCollection), rowToAdd);
      
      // Create a complete record with the new ID for local state update
      const newRecord = {
        ...rowToAdd,
        id: idToUse || docRef.id,
        createdAt: new Date() // Use a JS Date object for the local state
      };
      
      // Update local state immediately so the UI reflects the addition
      setFilteredData(prevData => [...prevData, newRecord]);
      
      // Show confirmation
      setConfirmationMessage('Document added successfully');
      setIsConfirmationOpen(true);
      
      // Reset form
      setIsAddMode(false);
      setNewRow({ id: '' });
      
    } catch (error) {
      console.error('Error adding document:', error);
      setConfirmationMessage(`Error adding document: ${error instanceof Error ? error.message : String(error)}`);
      setIsConfirmationOpen(true);
    }
  };

  const handleUpdateRow = async (rowId: string, updatedData: Record<string, any>) => {
    if (!selectedCollection) return;
    
    try {
      const docRef = doc(db, selectedCollection, rowId);
      
      // Add updated timestamp
      const dataToUpdate = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      };
      
      // Remove the id field as it shouldn't be updated
      delete dataToUpdate.id;
      
      await updateDoc(docRef, dataToUpdate);
      
      // Update local state immediately so the UI reflects the change
      setFilteredData(prevData => 
        prevData.map(item => 
          item.id === rowId 
            ? { ...item, ...dataToUpdate, updatedAt: new Date() } 
            : item
        )
      );
      
      // Show confirmation
      setConfirmationMessage('Document updated successfully');
      setIsConfirmationOpen(true);
      
      // Reset edit mode
      setIsEditMode(false);
      setEditableRow(null);
      setEditableCell(null);
      
    } catch (error) {
      console.error('Error updating document:', error);
      setConfirmationMessage(`Error updating document: ${error instanceof Error ? error.message : String(error)}`);
      setIsConfirmationOpen(true);
    }
  };

  const handleUpdateCell = async (rowId: string, field: string, value: any) => {
    if (!selectedCollection) return;
    
    try {
      const docRef = doc(db, selectedCollection, rowId);
      
      // Create update object with just the cell being updated
      const updateData: Record<string, any> = { 
        [field]: value,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Update local state immediately so the UI reflects the change
      setFilteredData(prevData => 
        prevData.map(item => 
          item.id === rowId 
            ? { ...item, [field]: value, updatedAt: new Date() } 
            : item
        )
      );
      
      // Show confirmation
      setConfirmationMessage(`Field "${field}" updated successfully`);
      setIsConfirmationOpen(true);
      
      // Reset edit mode
      setEditableCell(null);
      
    } catch (error) {
      console.error('Error updating cell:', error);
      setConfirmationMessage(`Error updating cell: ${error instanceof Error ? error.message : String(error)}`);
      setIsConfirmationOpen(true);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedCollection) return;
    
    try {
      const docRef = doc(db, selectedCollection, rowId);
      await deleteDoc(docRef);
      
      // Update local state immediately so the UI reflects the deletion
      setFilteredData(prevData => prevData.filter(item => item.id !== rowId));
      
      // Show confirmation
      setConfirmationMessage('Document deleted successfully');
      setIsConfirmationOpen(true);
      
      // Reset delete dialog
      setIsDeleteDialogOpen(false);
      setRowToDelete(null);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      setConfirmationMessage(`Error deleting document: ${error instanceof Error ? error.message : String(error)}`);
      setIsConfirmationOpen(true);
    }
  };

  if (!selectedCollection) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6">Please select a collection</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6" color="error">
          Error loading data: {(error as Error).message}
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6">No data found in this collection</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* View Toggle and Filter Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>Table</Typography>
            </ToggleButton>
            <ToggleButton value="json" aria-label="json view">
              <CodeIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>JSON</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <TextField
            placeholder="Search across all fields..."
            size="small"
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Button
          variant="outlined"
          size="small"
          onClick={toggleFilters}
          startIcon={<FilterListIcon />}
          color={filters.length > 0 ? "primary" : "inherit"}
        >
          {filters.length > 0 ? `Filters (${filters.length})` : "Custom Filters"}
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Query Filters</Typography>
            <Box>
              <Button 
                size="small" 
                startIcon={<AddIcon />} 
                onClick={addFilter}
                sx={{ mr: 1 }}
              >
                Add Filter
              </Button>
              <Button 
                size="small" 
                startIcon={<DeleteIcon />} 
                onClick={clearFilters}
                color="error"
                disabled={filters.length === 0}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {filters.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No filters applied. Click "Add Filter" to create a filter.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can now type any field name or use the dropdown icon to choose from available fields.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filters.map((filter) => (
                  <Box key={filter.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Field"
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                      sx={{ minWidth: 150 }}
                      placeholder="Enter field name"
                      InputProps={{
                        endAdornment: (
                          <Tooltip title="Available fields">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Create a temporary menu element
                                const menu = document.createElement('div');
                                menu.style.position = 'absolute';
                                menu.style.zIndex = '9999';
                                menu.style.backgroundColor = '#fff';
                                menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                                menu.style.borderRadius = '4px';
                                menu.style.padding = '8px 0';
                                menu.style.maxHeight = '300px';
                                menu.style.overflow = 'auto';
                                menu.style.minWidth = '200px';
                                
                                // Add a header
                                const header = document.createElement('div');
                                header.style.padding = '8px 16px';
                                header.style.borderBottom = '1px solid #eee';
                                header.style.fontWeight = 'bold';
                                header.style.fontSize = '12px';
                                header.style.color = '#666';
                                header.textContent = `${columns.length} Available Fields`;
                                menu.appendChild(header);
                                
                                // Add available fields
                                columns.forEach(column => {
                                  const item = document.createElement('div');
                                  item.style.padding = '8px 16px';
                                  item.style.cursor = 'pointer';
                                  item.style.transition = 'background-color 0.2s';
                                  item.textContent = column;
                                  
                                  // Add hover effect using mouse events
                                  item.addEventListener('mouseover', () => {
                                    item.style.backgroundColor = '#f5f5f5';
                                  });
                                  item.addEventListener('mouseout', () => {
                                    item.style.backgroundColor = '';
                                  });
                                  
                                  item.onclick = () => {
                                    updateFilter(filter.id, 'field', column);
                                    document.body.removeChild(menu);
                                  };
                                  menu.appendChild(item);
                                });
                                
                                // Position near the field
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                menu.style.left = `${rect.left}px`;
                                menu.style.top = `${rect.bottom + 5}px`;
                                
                                // Add to body and handle outside clicks
                                document.body.appendChild(menu);
                                
                                const handleOutsideClick = (e: MouseEvent) => {
                                  if (!menu.contains(e.target as Node)) {
                                    document.body.removeChild(menu);
                                    document.removeEventListener('click', handleOutsideClick);
                                  }
                                };
                                
                                // Use setTimeout to avoid immediate trigger
                                setTimeout(() => {
                                  document.addEventListener('click', handleOutsideClick);
                                }, 10);
                              }}
                            >
                              <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ),
                      }}
                    />

                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel id={`operator-label-${filter.id}`}>Operator</InputLabel>
                      <Select
                        labelId={`operator-label-${filter.id}`}
                        value={filter.operator}
                        label="Operator"
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as FilterOperator)}
                        MenuProps={{
                          PaperProps: {
                            style: { maxHeight: 300 },
                          },
                        }}
                      >
                        {FILTER_OPERATORS.map((op) => (
                          <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      label="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />

                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {filters.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Displaying {filteredData.length} of {data.length} records after applying filters
              </Typography>
              {filteredData.length === 0 && (
                <Alert severity="warning" sx={{ py: 0, ml: 2 }}>
                  No records match the current filters
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Pagination information */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}
      >
        <Typography variant="body2">
          <strong>Total Records:</strong> {totalRecords}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            Showing {totalRecords > 0 ? startIndex + 1 : 0}-{endIndex} of {totalRecords} records
          </Typography>
          <Chip 
            label={`Page ${currentPage} of ${totalPages || 1}`}
            size="small" 
            variant="outlined"
            color="primary"
          />
        </Box>
      </Box>

      {/* Navigation controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}
      >
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="First Page">
            <span>
              <IconButton 
                onClick={handleFirstPage} 
                disabled={currentPage === 1 || totalRecords === 0}
                size="small"
              >
                <FirstPageIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Previous 100 Records">
            <span>
              <IconButton 
                onClick={handlePrevPage} 
                disabled={currentPage === 1 || totalRecords === 0}
                size="small"
              >
                <NavigateBeforeIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next 100 Records">
            <span>
              <IconButton 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages || totalRecords === 0}
                size="small"
              >
                <NavigateNextIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Last Page">
            <span>
              <IconButton 
                onClick={handleLastPage} 
                disabled={currentPage === totalPages || totalRecords === 0}
                size="small"
              >
                <LastPageIcon />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>

        {totalPages > 1 && (
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
            color="primary" 
            size="small"
            siblingCount={1}
            boundaryCount={1}
          />
        )}
      </Box>

      {/* Add Row Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => {
            // Initialize empty document with all possible fields
            const emptyDoc: Record<string, any> = { id: '' };
            columns.forEach(col => {
              if (col !== 'id') {
                emptyDoc[col] = '';
              }
            });
            setNewRow(emptyDoc);
            setIsAddMode(true);
          }}
        >
          Add Document
        </Button>
      </Box>

      {/* Table Instructions */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
        <Typography variant="subtitle2" color="info.main" gutterBottom>
          <strong>Edit Data Instructions:</strong>
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Box component="li">
            <Typography variant="body2">Double-click any cell to edit its value</Typography>
          </Box>
          <Box component="li">
            <Typography variant="body2">Press Enter or click outside to save changes</Typography>
          </Box>
          <Box component="li">
            <Typography variant="body2">Use the Delete button to remove a document</Typography>
          </Box>
          <Box component="li">
            <Typography variant="body2">Click "Add Document" to create a new document</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main content - Table or JSON view based on viewMode */}
      {viewMode === 'table' ? (
        <TableContainer 
          component={Paper} 
          sx={{ 
            width: '100%',
            overflow: 'auto',
            maxHeight: '70vh', // Limit the height for better usability
            border: (theme) => `1px solid ${theme.palette.divider}`,
            position: 'relative', // Important for sticky positioning context
            '&::-webkit-scrollbar': {
              height: '8px',
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <Table 
            sx={{ 
              width: '100%',
              tableLayout: 'auto',
              borderCollapse: 'separate',
              borderSpacing: 0
            }} 
            aria-label="firestore data table"
          >
            <TableHead>
              <StyledTableRow>
                {columns.map((column) => (
                  <StyledTableCell 
                    key={column}
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: (theme) => theme.palette.action.hover 
                    }}
                  >
                    {column}
                  </StyledTableCell>
                ))}
                <StyledTableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: (theme) => theme.palette.action.hover,
                    width: 80,
                    position: 'sticky',
                    right: 0,
                    zIndex: 3,
                    boxShadow: '-2px 0px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  Actions
                </StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {currentData.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={columns.length + 1} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      {globalSearchTerm || filters.length > 0 
                        ? "No records match the current filters" 
                        : "No records found"}
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                currentData.map((row: FirestoreData) => (
                  <StyledTableRow key={row.id}>
                    {columns.map((column) => (
                      <StyledTableCell key={`${row.id}-${column}`}>
                        {editableCell && editableCell.rowId === row.id && editableCell.field === column ? (
                          // Editable cell
                          <TextField
                            size="small"
                            fullWidth
                            variant="standard"
                            value={editableCell.value}
                            onChange={(e) => setEditableCell({...editableCell, value: e.target.value})}
                            onBlur={() => {
                              try {
                                handleUpdateCell(editableCell.rowId, editableCell.field, editableCell.value);
                              } catch (error) {
                                console.error('Error saving cell:', error);
                                setConfirmationMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
                                setIsConfirmationOpen(true);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                try {
                                  handleUpdateCell(editableCell.rowId, editableCell.field, editableCell.value);
                                } catch (error) {
                                  console.error('Error saving cell:', error);
                                  setConfirmationMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
                                  setIsConfirmationOpen(true);
                                }
                              }
                            }}
                            autoFocus
                            sx={{
                              '& .MuiInput-underline:before': { borderBottomColor: 'primary.main' },
                              '& .MuiInput-underline:after': { borderBottomColor: 'primary.main' },
                              '& .MuiInput-root': { backgroundColor: 'rgba(66, 165, 245, 0.05)' }
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title="Press Enter to save">
                                    <span>✓</span>
                                  </Tooltip>
                                </InputAdornment>
                              )
                            }}
                          />
                        ) : (
                          // Display cell with double-click to edit
                          <Box 
                            onDoubleClick={() => {
                              if (column !== 'id') { // Don't allow editing of ID field
                                setEditableCell({
                                  rowId: row.id,
                                  field: column,
                                  value: row[column] || ''
                                });
                              }
                            }}
                            sx={{ 
                              minHeight: '1.5rem',
                              padding: '4px',
                              position: 'relative',
                              cursor: column !== 'id' ? 'pointer' : 'default',
                              '&:hover': {
                                backgroundColor: column !== 'id' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                                '&::after': column !== 'id' ? {
                                  content: '"✎"',
                                  position: 'absolute',
                                  right: '4px',
                                  top: '4px',
                                  fontSize: '10px',
                                  color: 'primary.main',
                                  opacity: 0.7
                                } : {}
                              },
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {formatCellData(row[column])}
                          </Box>
                        )}
                      </StyledTableCell>
                    ))}
                    <StyledTableCell
                      sx={{
                        position: 'sticky',
                        right: 0,
                        zIndex: 2,
                        background: (theme) => theme.palette.background.paper,
                        boxShadow: '-2px 0px 5px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View JSON">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenJsonDetail(row)}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Row">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setRowToDelete(row);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // JSON View
        <Box sx={{ mt: 2 }}>
          {currentData.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                {globalSearchTerm || filters.length > 0 
                  ? "No records match the current filters" 
                  : "No records found"}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {currentData.map((item: FirestoreData) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ p: 2, pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" noWrap title={item.id}>
                        ID: {item.id}
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyJson(item)}
                          title="Copy JSON"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenJsonDetail(item)}
                          title="View Details"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <JsonDisplay 
                        dangerouslySetInnerHTML={{ 
                          __html: formatJson(item) 
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Bottom pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
            color="primary"
            size="small"
          />
        </Box>
      )}

      {/* Record display info footer */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary">
          Displaying {currentData.length} of {totalRecords} records (max 100 per page)
        </Typography>
      </Box>

      {/* JSON Detail Dialog */}
      <Dialog
        open={isJsonDetailOpen}
        onClose={handleCloseJsonDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Document Details {selectedRecord && `- ID: ${selectedRecord.id}`}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseJsonDetail}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  startIcon={<ContentCopyIcon />}
                  size="small"
                  onClick={() => selectedRecord && handleCopyJson(selectedRecord)}
                >
                  Copy JSON
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
                <JsonDisplay 
                  dangerouslySetInnerHTML={{ 
                    __html: formatJson(selectedRecord) 
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog
        open={isAddMode}
        onClose={() => setIsAddMode(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Document</Typography>
            <IconButton
              aria-label="close"
              onClick={() => setIsAddMode(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {Object.keys(newRow).map(field => (
              <TextField
                key={field}
                label={field}
                value={newRow[field] || ''}
                onChange={(e) => setNewRow({...newRow, [field]: e.target.value})}
                fullWidth
                disabled={field === 'id' && field.trim() === ''}
                helperText={field === 'id' ? 'Leave empty for auto-generated ID' : ''}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddMode(false)}>Cancel</Button>
          <Button 
            onClick={handleAddRow} 
            variant="contained" 
            color="primary"
          >
            Add Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the document with ID: <strong>{rowToDelete?.id}</strong>?
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => rowToDelete && handleDeleteRow(rowToDelete.id)} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
      <Snackbar
        open={isConfirmationOpen}
        autoHideDuration={5000}
        onClose={() => setIsConfirmationOpen(false)}
        message={confirmationMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setIsConfirmationOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default DataTable; 