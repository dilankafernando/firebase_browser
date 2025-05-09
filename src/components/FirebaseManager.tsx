import React, { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions,
  DialogContentText,
  ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useStore } from '../store';
import { FirebaseConfig } from '../types';
import { authService } from '../services/authService';

const FirebaseManager: React.FC = () => {
  const { user, activeConfig, configs, addFirebaseConfig, switchFirebaseConfig, removeFirebaseConfig, loading, error } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Form state
  const [configDisplayName, setConfigDisplayName] = useState('');
  const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null);

  // Load configs when component mounts
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setLocalLoading(true);
        if (user) {
          await authService.getFirebaseConfigs();
        }
      } catch (error) {
        console.error('Error loading configs:', error);
      } finally {
        setLocalLoading(false);
      }
    };

    loadConfigs();
  }, [user]);

  const resetForm = () => {
    setConfigDisplayName('');
    setServiceAccountFile(null);
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
    setServiceAccountFile(null);
    setIsEditMode(true);
    setEditingConfigId(config.project_id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setServiceAccountFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);

    // Validate form
    if (!configDisplayName || !serviceAccountFile) {
      setFormError('Please provide a configuration name and service account file');
      return;
    }

    try {
      // Read the service account file
      const fileContent = await serviceAccountFile.text();
      const serviceAccount = JSON.parse(fileContent);

      const newConfig: FirebaseConfig = {
        displayName: configDisplayName,
        ...serviceAccount,
        project_id: serviceAccount.project_id // Ensure project_id is set correctly
      };

      const result = await addFirebaseConfig(newConfig);
      if (result) {
        handleCloseDialog();
      }
    } catch (err) {
      setFormError(`Failed to save configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSwitchConfig = async (projectId: string) => {
    try {
      setLocalLoading(true);
      const result = await switchFirebaseConfig(projectId);
      if (!result) {
        throw new Error('Failed to switch configuration');
      }
    } catch (error) {
      console.error('Error switching configuration:', error);
      setFormError(`Failed to switch configuration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRequestDelete = (projectId: string) => {
    setConfigToDelete(projectId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (configToDelete) {
      try {
        setLocalLoading(true);
        await removeFirebaseConfig(configToDelete);
        setConfirmDeleteOpen(false);
        setConfigToDelete(null);
      } catch (error) {
        console.error('Error deleting configuration:', error);
        setFormError(`Failed to delete configuration: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  if (!user) {
    return null;
  }

  const isLoading = loading || localLoading;

  return (
    <Box sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Firebase Connections</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            disabled={isLoading}
          >
            Add Connection
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : configs.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            You don't have any Firebase connections yet. Add a connection to get started.
          </Alert>
        ) : (
          <List sx={{ width: '100%' }}>
            {configs.map((config) => (
              <React.Fragment key={config.project_id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      {config.project_id !== activeConfig?.project_id && (
                        <span>
                          <Tooltip title={isLoading ? "" : "Switch to this connection"}>
                            <span>
                              <IconButton 
                                edge="end" 
                                aria-label="switch"
                                onClick={() => handleSwitchConfig(config.project_id)}
                                disabled={isLoading}
                              >
                                <SwapHorizIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </span>
                      )}
                      <span>
                        <Tooltip title={isLoading ? "" : "Edit connection"}>
                          <span>
                            <IconButton 
                              edge="end" 
                              aria-label="edit"
                              onClick={() => handleOpenEditDialog(config)}
                              disabled={isLoading}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </span>
                      <span>
                        <Tooltip title={isLoading || configs.length === 1 ? "" : "Delete connection"}>
                          <span>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleRequestDelete(config.project_id)}
                              disabled={isLoading || (configs.length === 1)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </span>
                    </Box>
                  }
                  sx={{ 
                    backgroundColor: config.project_id === activeConfig?.project_id 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.displayName}
                        {config.project_id === activeConfig?.project_id && (
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
                      <Typography variant="caption" component="span" sx={{ mt: 0.5, mr: 1, display: 'block' }}>
                        Project ID: {config.project_id}
                      </Typography>
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
            disabled={isLoading}
            placeholder="My Firebase Project"
            helperText="A friendly name to identify this connection"
          />

          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 2 }}>
            <input
              accept="application/json"
              style={{ display: 'none' }}
              id="service-account-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="service-account-file">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                disabled={isLoading}
              >
                {serviceAccountFile ? serviceAccountFile.name : 'Upload Service Account JSON File'}
              </Button>
            </label>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Upload your Firebase service account JSON file
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : (isEditMode ? 'Update' : 'Add')}
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
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FirebaseManager; 