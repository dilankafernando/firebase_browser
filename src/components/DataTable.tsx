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
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '../store';
import { useCollectionData } from '../hooks/useFirestore';
import { FirestoreData } from '../store';

// Styled components for bordered table
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:last-child td, &:last-child th': {
    border: `1px solid ${theme.palette.divider}`,
  },
}));

// Filter types
type FilterOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'startsWith' | 'endsWith' | 'notEquals';

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
  const updateFilter = (filterId: string, field: keyof Filter, value: string) => {
    setFilters(filters.map(f => 
      f.id === filterId 
        ? { ...f, [field]: value } 
        : f
    ));
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
      {/* Filter Controls */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search across all fields..."
            size="small"
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleFilters}
            startIcon={<FilterListIcon />}
            color={filters.length > 0 ? "primary" : "inherit"}
          >
            {filters.length > 0 ? `Filters (${filters.length})` : "Add Filters"}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filters.map((filter) => (
                  <Box key={filter.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={filter.field}
                        label="Field"
                        onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                      >
                        {columns.map((column) => (
                          <MenuItem key={column} value={column}>{column}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={filter.operator}
                        label="Operator"
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as FilterOperator)}
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
      </Box>

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

      {/* Data table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          width: '100%',
          overflow: 'auto',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Table sx={{ width: '100%' }} aria-label="firestore data table">
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
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {currentData.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={columns.length} align="center">
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
                      {formatCellData(row[column])}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};

export default DataTable; 