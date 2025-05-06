import React, { useEffect } from 'react';
import { Typography, Paper, Box, Divider, Alert, AlertTitle, Link, LinearProgress, Button } from '@mui/material';
import Layout from './components/Layout';
import CollectionSelector from './components/CollectionSelector';
import DataTable from './components/DataTable';
import AuthContainer from './components/AuthContainer';
import FirebaseManager from './components/FirebaseManager';
import { useStore } from './store';

const App: React.FC = () => {
  const { setError, error, loading, user, activeConfig, logout } = useStore();

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  const handleLogout = () => {
    logout();
  };

  return (
    <AuthContainer>
      <Layout>
        {loading && <LinearProgress color="primary" sx={{ position: 'absolute', top: 64, left: 0, right: 0 }} />}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            {user && (
              <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                Signed in as <strong>{user.displayName}</strong>
              </Typography>
            )}
          </Box>
          <Button variant="outlined" color="primary" onClick={handleLogout}>
            Sign Out
          </Button>
        </Box>
        
        <FirebaseManager />
        
        {activeConfig ? (
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
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
            <Alert severity="info">
              <AlertTitle>No Active Firebase Connection</AlertTitle>
              <Typography variant="body1">
                Please add a Firebase connection using the Firebase Connections panel above to get started.
              </Typography>
            </Alert>
          </Paper>
        )}
        
        <Box mt={4} textAlign="center">
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              <AlertTitle>Error</AlertTitle>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
          
          {activeConfig && error && error.includes('Firebase') && (
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
    </AuthContainer>
  );
};

export default App; 