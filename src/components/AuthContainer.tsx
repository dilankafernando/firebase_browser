import React, { useState, useEffect } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import Login from './Login';
import Signup from './Signup';
import { useStore } from '../store';

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children }) => {
  const { isAuthenticated, user, initSession } = useStore();
  const [showLogin, setShowLogin] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Initialize session on component mount
  useEffect(() => {
    // Try to restore the session from localStorage
    initSession();
    // Set initializing to false after a short delay to allow Firebase to initialize
    const timeoutId = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [initSession]);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  // Show loading spinner while initializing the session
  if (initializing) {
    return (
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {showLogin ? (
            <Login onToggleForm={toggleForm} />
          ) : (
            <Signup onToggleForm={toggleForm} />
          )}
        </Box>
      </Container>
    );
  }

  return <>{children}</>;
};

export default AuthContainer; 