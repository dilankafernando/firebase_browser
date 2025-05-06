import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import Login from './Login';
import Signup from './Signup';
import { useStore } from '../store';

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children }) => {
  const { isAuthenticated, user } = useStore();
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

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