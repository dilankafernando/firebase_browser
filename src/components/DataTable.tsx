import React, { useMemo } from 'react';
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
} from '@mui/material';
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

const DataTable: React.FC = () => {
  const { selectedCollection } = useStore();
  const { data, isLoading, isError, error } = useCollectionData(selectedCollection);

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
    <TableContainer 
      component={Paper} 
      sx={{ 
        mt: 4,
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
          {data.map((row: FirestoreData) => (
            <StyledTableRow key={row.id}>
              {columns.map((column) => (
                <StyledTableCell key={`${row.id}-${column}`}>
                  {formatCellData(row[column])}
                </StyledTableCell>
              ))}
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable; 