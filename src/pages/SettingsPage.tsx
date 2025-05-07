import React from 'react';
import { Typography, Paper, Box, Divider, Alert, AlertTitle } from '@mui/material';
import FirebaseManager from '../components/FirebaseManager';
import { useStore } from '../store';

const SettingsPage: React.FC = () => {
  const { error } = useStore();

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" paragraph>
          Manage your Firebase connections and application settings.
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Firebase Connections
        </Typography>
        <Typography variant="body2" paragraph sx={{ mb: 3 }}>
          Add, edit, or remove Firebase connections to browse different Firestore databases.
        </Typography>
        
        <FirebaseManager />
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
          <AlertTitle>Error</AlertTitle>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SettingsPage; 