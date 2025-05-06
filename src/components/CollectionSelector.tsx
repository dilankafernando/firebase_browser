import React, { useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  CircularProgress,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useStore } from '../store';
import { useCollections } from '../hooks/useFirestore';

const CollectionSelector: React.FC = () => {
  const { selectedCollection, setSelectedCollection, collections } = useStore();
  const { isLoading, isError, error, refetch } = useCollections();

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedCollection(event.target.value);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography color="error">
          Error loading collections: {(error as Error).message}
        </Typography>
        <Tooltip title="Retry loading collections">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
          Firestore Collections
        </Typography>
        <Tooltip title="Refresh collections">
          <IconButton 
            onClick={handleRefresh} 
            size="small" 
            color="primary"
            disabled={isLoading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <FormControl fullWidth variant="outlined">
        <InputLabel id="collection-select-label">Select Collection</InputLabel>
        <Select
          labelId="collection-select-label"
          id="collection-select"
          value={selectedCollection}
          onChange={handleChange}
          label="Select Collection"
          disabled={isLoading || collections.length === 0}
          startAdornment={
            isLoading ? 
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : 
            null
          }
        >
          {collections.length === 0 && !isLoading ? (
            <MenuItem disabled value="">
              <em>No collections found</em>
            </MenuItem>
          ) : (
            collections.map((collection) => (
              <MenuItem key={collection} value={collection}>
                {collection}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      
      {collections.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            Available:
          </Typography>
          {collections.map(coll => (
            <Chip
              key={coll}
              label={coll}
              size="small"
              variant="outlined"
              clickable
              onClick={() => setSelectedCollection(coll)}
              color={selectedCollection === coll ? "primary" : "default"}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CollectionSelector; 