import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { useStore } from '../store';

interface LoginProps {
  onToggleForm: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleForm }) => {
  const { login, loading, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    if (!email) {
      setFormError('Email is required');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }

    // Attempt login
    const result = await login(email, password);
    if (!result) {
      // Store already sets error in the global state
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Login
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }} align="center">
        Sign in to access your Firebase Browser
      </Typography>

      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError || error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleLogin} noValidate>
        <TextField
          label="Email Address"
          type="email"
          fullWidth
          margin="normal"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          disabled={loading}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        <Box textAlign="center">
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onToggleForm}
              sx={{ cursor: 'pointer' }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default Login; 