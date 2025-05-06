import React, { useEffect } from 'react';
import { Typography, Paper, Box, Divider, Alert, AlertTitle, Link, LinearProgress } from '@mui/material';
import Layout from './components/Layout';
import CollectionSelector from './components/CollectionSelector';
import DataTable from './components/DataTable';
import { useStore } from './store';

const App: React.FC = () => {
  const { setError, error, loading } = useStore();

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  return (
    <Layout>
      {loading && <LinearProgress color="primary" sx={{ position: 'absolute', top: 64, left: 0, right: 0 }} />}
      
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        <Typography variant="h4" gutterBottom>
          Firestore Data Browser
        </Typography>
        <Typography variant="body1" paragraph>
          Select a collection from your Firestore database to view its data.
        </Typography>
        
        <CollectionSelector />
        <Divider sx={{ my: 3 }} />
        <DataTable />
      </Paper>
      
      <Box mt={4} textAlign="center">
        <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
          <AlertTitle>Firebase Configuration</AlertTitle>
          <Typography variant="body2">
            The application is currently using the Firebase configuration in <code>src/firebase.ts</code>.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            If you need to change the Firebase project, update the configuration values in that file.
          </Typography>
        </Alert>
        
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
    </Layout>
  );
};

export default App; 