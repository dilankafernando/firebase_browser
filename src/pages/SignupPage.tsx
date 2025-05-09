import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
} from '@mui/material';
import { useStore } from '../store';

interface SignupPageProps {}

const SignupPage: React.FC<SignupPageProps> = () => {
  const navigate = useNavigate();
  const { signup, loading, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }

    try {
      await signup(email, password, displayName);
      navigate('/');
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign Up
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Display Name"
            fullWidth
            margin="normal"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            error={password !== confirmPassword && confirmPassword !== ''}
            helperText={
              password !== confirmPassword && confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={loading || password !== confirmPassword}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignupPage; 