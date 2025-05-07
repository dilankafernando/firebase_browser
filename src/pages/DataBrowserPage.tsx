import React from 'react';
import { Typography, Paper, Box, Divider, Alert, AlertTitle } from '@mui/material';
import CollectionSelector from '../components/CollectionSelector';
import DataTable from '../components/DataTable';
import { useStore } from '../store';

const DataBrowserPage: React.FC = () => {
  const { activeConfig, error } = useStore();

  if (!activeConfig) {
    return (
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        <Alert severity="info">
          <AlertTitle>No Active Firebase Connection</AlertTitle>
          <Typography variant="body1">
            Please go to Settings to add or select a Firebase connection to get started.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>
        Firestore Data Browser
      </Typography>
      <Typography variant="body1" paragraph>
        Currently connected to: <strong>{activeConfig.displayName}</strong> ({activeConfig.projectId})
      </Typography>
      
      <CollectionSelector />
      <Divider sx={{ my: 3 }} />
      <DataTable />
      
      <Box mt={4} textAlign="center">
        {error && error.includes('Firebase') && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
            <AlertTitle>Firebase Connection Issue</AlertTitle>
            <Typography variant="body2">
              There may be an issue with your Firebase configuration or permissions.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Make sure:
              <ul>
                <li>Your API keys are correct</li>
                <li>Your Firebase project exists</li>
                <li>Firestore is enabled in your Firebase project</li>
                <li>Your security rules allow reading the collections</li>
              </ul>
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default DataBrowserPage; 