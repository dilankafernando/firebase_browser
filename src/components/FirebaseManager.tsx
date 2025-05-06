import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useStore } from '../store';
import { FirebaseConfig } from '../services/authService';

const FirebaseManager: React.FC = () => {
  const { user, activeConfig, addFirebaseConfig, switchFirebaseConfig, removeFirebaseConfig, loading, error } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [configDisplayName, setConfigDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  const resetForm = () => {
    setConfigDisplayName('');
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setFormError(null);
    setIsEditMode(false);
    setEditingConfigId(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (config: FirebaseConfig) => {
    setConfigDisplayName(config.displayName);
    setApiKey(config.apiKey);
    setAuthDomain(config.authDomain);
    setProjectId(config.projectId);
    setStorageBucket(config.storageBucket || '');
    setMessagingSenderId(config.messagingSenderId || '');
    setAppId(config.appId || '');
    setIsEditMode(true);
    setEditingConfigId(config.projectId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setFormError(null);

    // Validate form
    if (!configDisplayName || !apiKey || !authDomain || !projectId) {
      setFormError('Required fields must be filled');
      return;
    }

    const newConfig: FirebaseConfig = {
      displayName: configDisplayName,
      apiKey,
      authDomain,
      projectId,
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
    };

    try {
      const result = await addFirebaseConfig(newConfig);
      if (result) {
        handleCloseDialog();
      }
    } catch (err) {
      setFormError(`Failed to save configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSwitchConfig = async (projectId: string) => {
    await switchFirebaseConfig(projectId);
  };

  const handleRequestDelete = (projectId: string) => {
    setConfigToDelete(projectId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (configToDelete) {
      await removeFirebaseConfig(configToDelete);
      setConfirmDeleteOpen(false);
      setConfigToDelete(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Firebase Connections</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            disabled={loading}
          >
            Add Connection
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && user.firebaseConfigs.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any Firebase connections yet. Add a connection to get started.
          </Alert>
        ) : (
          <List sx={{ width: '100%' }}>
            {user.firebaseConfigs.map((config) => (
              <React.Fragment key={config.projectId}>
                <ListItem
                  secondaryAction={
                    <Box>
                      {config.projectId !== activeConfig?.projectId && (
                        <Tooltip title="Switch to this connection">
                          <IconButton 
                            edge="end" 
                            aria-label="switch"
                            onClick={() => handleSwitchConfig(config.projectId)}
                            disabled={loading}
                          >
                            <SwapHorizIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit connection">
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleOpenEditDialog(config)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete connection">
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRequestDelete(config.projectId)}
                          disabled={loading || (user.firebaseConfigs.length === 1)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{ 
                    backgroundColor: config.projectId === activeConfig?.projectId 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.displayName}
                        {config.projectId === activeConfig?.projectId && (
                          <Chip 
                            size="small" 
                            color="primary" 
                            label="Active" 
                            icon={<CheckCircleIcon />} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" component="span" sx={{ mr: 1 }}>
                          Project ID: {config.projectId}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Add/Edit Firebase Config Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Edit Firebase Connection' : 'Add Firebase Connection'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}

          <TextField
            label="Configuration Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={configDisplayName}
            onChange={(e) => setConfigDisplayName(e.target.value)}
            required
            disabled={loading}
            placeholder="My Firebase Project"
            helperText="A friendly name to identify this connection"
          />

          <Divider sx={{ my: 2 }} />
          
          <TextField
            label="API Key"
            fullWidth
            margin="normal"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Auth Domain"
            fullWidth
            margin="normal"
            variant="outlined"
            value={authDomain}
            onChange={(e) => setAuthDomain(e.target.value)}
            required
            disabled={loading}
            placeholder="project-id.firebaseapp.com"
          />
          <TextField
            label="Project ID"
            fullWidth
            margin="normal"
            variant="outlined"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            disabled={loading || isEditMode} // Can't change project ID on edit
            helperText={isEditMode ? "Project ID cannot be changed after creation" : ""}
          />
          <TextField
            label="Storage Bucket"
            fullWidth
            margin="normal"
            variant="outlined"
            value={storageBucket}
            onChange={(e) => setStorageBucket(e.target.value)}
            disabled={loading}
            placeholder="project-id.appspot.com"
          />
          <TextField
            label="Messaging Sender ID"
            fullWidth
            margin="normal"
            variant="outlined"
            value={messagingSenderId}
            onChange={(e) => setMessagingSenderId(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="App ID"
            fullWidth
            margin="normal"
            variant="outlined"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this Firebase connection? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FirebaseManager; 