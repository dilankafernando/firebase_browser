import React, { useState, useEffect } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import Login from './Login';
import Signup from './Signup';
import { useStore } from '../store';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children }) => {
  const { isAuthenticated, user, initSession } = useStore();
  const [showLogin, setShowLogin] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if there's an existing session
    const currentUser = auth.currentUser;
    if (currentUser) {
      initSession().finally(() => setInitializing(false));
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await initSession();
      }
      setInitializing(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
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

  // Check both auth states
  const isUserAuthenticated = isAuthenticated && user && auth.currentUser;

  if (!isUserAuthenticated) {
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