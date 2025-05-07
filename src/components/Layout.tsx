import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box,
  Chip,
  Button,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, activeConfig, logout, loading } = useStore();
  const location = useLocation();
  
  // Determine active tab based on current path
  const currentPath = location.pathname;
  const activeTab = currentPath.includes('/settings') ? 1 : 0;

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
          {user && (
            <Button 
              color="inherit"
              size="small"
              onClick={logout}
              sx={{ ml: 2 }}
            >
              Sign Out
            </Button>
          )}
        </Toolbar>
        
        {/* Navigation tabs - only show when user is authenticated */}
        {user && (
          <>
            <Tabs 
              value={activeTab} 
              sx={{ 
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiTab-root': {
                  color: 'white',
                  opacity: 0.7,
                  '&.Mui-selected': {
                    color: 'white',
                    opacity: 1,
                    fontWeight: 'bold'
                  }
                }
              }}
            >
              <Tab 
                label="Data Browser" 
                component={RouterLink} 
                to="/" 
                sx={{ minWidth: 120 }}
              />
              <Tab 
                label="Settings" 
                component={RouterLink} 
                to="/settings" 
                sx={{ minWidth: 120 }}
              />
            </Tabs>
          </>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <LinearProgress 
            color="secondary" 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              height: 3 
            }} 
          />
        )}
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          {children}
        </Box>
      </Container>
    </>
  );
};

export default Layout; 