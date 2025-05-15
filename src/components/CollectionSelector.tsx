import React, { useState, useEffect } from 'react';
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
  Chip,
  TextField,
  InputAdornment,
  Collapse,
  Button,
  Alert,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import { useStore } from '../store';
import { useCollections } from '../hooks/useFirestore';

const CollectionSelector: React.FC = () => {
  const { selectedCollection, setSelectedCollection, collections, loading, setLoading } = useStore();
  const { isLoading, isError, error, refetch, status, failureCount } = useCollections();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCollection, setManualCollection] = useState('');
  
  // Set a timeout for the loading state to detect potential issues
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      setIsTimedOut(false);
      timeoutId = setTimeout(() => {
        setIsTimedOut(true);
      }, 15000); // 15 second timeout - if still loading after this, something might be wrong
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Initialize manual input with selected collection when switching to manual mode
  useEffect(() => {
    if (manualMode && selectedCollection) {
      setManualCollection(selectedCollection);
    }
  }, [manualMode, selectedCollection]);
  
  // Group collections by type (top-level vs subcollections)
  const topLevelCollections = collections.filter(c => !c.includes('/'));
  const subCollections = collections.filter(c => c.includes('/'));
  
  // Filter collections based on search term
  const filteredCollections = collections.filter(collection => 
    collection.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Display a limited number of collections in the chip view unless expanded
  const displayedChipCollections = showAllCollections 
    ? filteredCollections 
    : filteredCollections.slice(0, 10);
  
  const openDropdown = () => {
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Define handleChange function
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedCollection(value);
    closeDropdown();
    // Force blur to ensure dropdown closes
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleRefresh = () => {
    setIsTimedOut(false); // Reset timeout state
    refetch();
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleManualInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualCollection(event.target.value);
  };

  const handleManualInputSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (manualCollection.trim()) {
      setSelectedCollection(manualCollection.trim());
    }
  };

  const toggleInputMode = () => {
    setManualMode(!manualMode);
  };

  if (isError) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          Error loading collections: {(error as Error).message}
        </Alert>
        
        {collections.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              You can still use the {collections.length} collections that were loaded:
            </Typography>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="error-collection-select-label">Select Collection</InputLabel>
              <Select
                labelId="error-collection-select-label"
                id="error-collection-select"
                value={selectedCollection}
                onChange={handleChange}
                onClose={() => {
                  setTimeout(() => {
                    (document.activeElement as HTMLElement)?.blur();
                  }, 10);
                }}
                label="Select Collection"
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 500 },
                  },
                  autoFocus: false,
                  disableAutoFocusItem: true,
                  disablePortal: true,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                }}
              >
                {collections.map((collection) => (
                  <MenuItem 
                    key={collection} 
                    value={collection}
                    onClick={() => {
                      setSelectedCollection(collection);
                      closeDropdown();
                    }}
                  >
                    {collection}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
          Firestore Collections {collections.length > 0 && `(${collections.length})`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch 
                size="small" 
                checked={manualMode}
                onChange={toggleInputMode}
              />
            }
            label={<Typography variant="caption">Manual Input</Typography>}
            sx={{ mr: 1 }}
          />
          <Tooltip title="Refresh collections">
            <IconButton 
              onClick={handleRefresh} 
              size="small" 
              color="primary"
              disabled={isLoading && !isTimedOut}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Loading indicator with timeout warning */}
      {isLoading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <CircularProgress 
            color={isTimedOut ? "warning" : "primary"} 
            sx={{ mb: 1 }}
          />
          {isTimedOut && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="warning.main">
                Collection discovery is taking longer than expected...
              </Typography>
              <Button 
                size="small" 
                color="warning" 
                variant="text" 
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                Cancel and use available
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {/* Search box for collections */}
      {!manualMode && collections.length > 5 && (
        <TextField
          placeholder="Search collections..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      )}
      
      {/* Manual Collection Input */}
      {manualMode && (
        <form onSubmit={handleManualInputSubmit}>
          <TextField
            label="Collection Path"
            placeholder="Enter collection path (e.g. users or posts/postId/comments)"
            variant="outlined"
            size="small"
            fullWidth
            value={manualCollection}
            onChange={handleManualInputChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Load this collection">
                    <IconButton 
                      type="submit"
                      edge="end" 
                      size="small"
                      disabled={!manualCollection.trim()}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </form>
      )}
      
      {/* Collection selector */}
      {!manualMode && (
        <FormControl fullWidth variant="outlined">
          <InputLabel id="collection-select-label">Select Collection</InputLabel>
          <Select
            labelId="collection-select-label"
            id="collection-select"
            value={selectedCollection}
            onChange={handleChange}
            onClose={closeDropdown}
            open={isDropdownOpen}
            onOpen={openDropdown}
            label="Select Collection"
            disabled={isLoading || collections.length === 0}
            startAdornment={
              isLoading ? 
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : 
              null
            }
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 500 },
              },
              autoFocus: false,
              disableAutoFocusItem: true,
              disablePortal: true,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
            inputProps={{
              'data-testid': 'collection-select',
            }}
          >
            {filteredCollections.length === 0 && !isLoading ? (
              <MenuItem disabled value="">
                <em>No collections found</em>
              </MenuItem>
            ) : (
              <>
                {/* Top-level collections first */}
                {topLevelCollections
                  .filter(collection => collection.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((collection) => (
                    <MenuItem 
                      key={collection} 
                      value={collection}
                      onClick={() => {
                        setSelectedCollection(collection);
                        closeDropdown();
                      }}
                    >
                      {collection}
                    </MenuItem>
                  ))
                }
                
                {/* Then subcollections with grouping if there are any */}
                {subCollections.length > 0 && topLevelCollections.length > 0 && (
                  <MenuItem disabled divider>
                    <em>Subcollections</em>
                  </MenuItem>
                )}
                
                {subCollections
                  .filter(collection => collection.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((collection) => {
                    // For subcollections, format them to show the path clearly
                    const parts = collection.split('/');
                    return (
                      <MenuItem 
                        key={collection} 
                        value={collection}
                        onClick={() => {
                          setSelectedCollection(collection);
                          closeDropdown();
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{parts[2]}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${parts[0]}/${parts[1]}/...`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })
                }
              </>
            )}
          </Select>
        </FormControl>
      )}
      
      {/* Display stats and status if collections were loaded */}
      {failureCount > 0 && collections.length > 0 && !manualMode && (
        <Alert severity="info" sx={{ mt: 2, fontSize: '0.875rem' }}>
          Some collection discovery requests may have timed out, but {collections.length} collections were found.
        </Alert>
      )}
      
      {/* Collection chips */}
      {collections.length > 0 && !manualMode && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Available Collections:
            </Typography>
            <Button 
              size="small" 
              onClick={() => setShowChips(!showChips)}
              endIcon={showChips ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            >
              {showChips ? "Hide" : "Show"}
            </Button>
          </Box>
          
          <Collapse in={showChips}>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {displayedChipCollections.map(coll => (
                <Chip
                  key={coll}
                  label={coll.includes('/') ? coll.split('/')[2] : coll}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => {
                    setSelectedCollection(coll);
                    closeDropdown();
                  }}
                  color={selectedCollection === coll ? "primary" : "default"}
                  title={coll}
                />
              ))}
              
              {filteredCollections.length > 10 && !showAllCollections && (
                <Chip
                  label={`+${filteredCollections.length - 10} more`}
                  size="small"
                  variant="outlined"
                  onClick={() => setShowAllCollections(true)}
                  color="secondary"
                />
              )}
              
              {showAllCollections && filteredCollections.length > 10 && (
                <Button 
                  size="small" 
                  onClick={() => setShowAllCollections(false)}
                  variant="text"
                >
                  Show less
                </Button>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
      
      {/* Info display at bottom */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!manualMode && collections.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {topLevelCollections.length} root collections, {subCollections.length} subcollections
          </Typography>
        )}
        
        {manualMode && (
          <Typography variant="caption" color="text.secondary">
            Manual collection input mode - type any valid collection path
          </Typography>
        )}
        
        {selectedCollection && (
          <Chip
            label={`Selected: ${selectedCollection}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
};

export default CollectionSelector; 