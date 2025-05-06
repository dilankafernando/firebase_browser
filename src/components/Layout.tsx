import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box,
  Alert,
  Chip
} from '@mui/material';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { error, user, activeConfig } = useStore();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Firebase Browser
          </Typography>
          {user && activeConfig && (
            <Chip 
              label={`${activeConfig.displayName} (${activeConfig.projectId})`}
              color="secondary" 
              variant="outlined"
              size="small"
              sx={{ color: 'white', mr: 2 }}
            />
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {children}
        </Box>
      </Container>
    </>
  );
};

export default Layout; 