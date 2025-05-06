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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useStore } from '../store';
import { FirebaseConfig } from '../services/authService';

interface SignupProps {
  onToggleForm: () => void;
}

const Signup: React.FC<SignupProps> = ({ onToggleForm }) => {
  const { signup, loading, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Firebase config
  const [addFirebaseConfig, setAddFirebaseConfig] = useState(false);
  const [configDisplayName, setConfigDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic form validation
    if (!email || !password || !confirmPassword || !displayName) {
      setFormError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    // Firebase config validation if enabled
    if (addFirebaseConfig) {
      if (!configDisplayName || !apiKey || !authDomain || !projectId) {
        setFormError('Firebase configuration fields are required');
        return;
      }
    }

    // Prepare Firebase config if adding one
    let firebaseConfig: FirebaseConfig | undefined;
    
    if (addFirebaseConfig) {
      firebaseConfig = {
        displayName: configDisplayName,
        apiKey,
        authDomain,
        projectId,
        storageBucket: storageBucket || '',
        messagingSenderId: messagingSenderId || '',
        appId: appId || '',
      };
    }

    // Attempt signup
    const result = await signup(email, password, displayName, firebaseConfig);
    if (!result) {
      // Store already sets error in the global state
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Create Account
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }} align="center">
        Sign up to start managing your Firebase connections
      </Typography>

      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError || error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSignup} noValidate>
        <TextField
          label="Display Name"
          fullWidth
          margin="normal"
          variant="outlined"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
          required
          disabled={loading}
        />
        <TextField
          label="Email Address"
          type="email"
          fullWidth
          margin="normal"
          variant="outlined"
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
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          helperText="Password must be at least 6 characters long"
        />
        <TextField
          label="Confirm Password"
          type="password"
          fullWidth
          margin="normal"
          variant="outlined"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={addFirebaseConfig}
              onChange={(e) => setAddFirebaseConfig(e.target.checked)}
              color="primary"
              disabled={loading}
            />
          }
          label="Add a Firebase configuration now"
          sx={{ mt: 2 }}
        />

        {addFirebaseConfig && (
          <Accordion expanded={addFirebaseConfig} sx={{ mt: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="firebase-config-content"
              id="firebase-config-header"
            >
              <Typography>Firebase Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter your Firebase project details. You can find these in your Firebase console
                under Project Settings.
              </Typography>
              
              <TextField
                label="Configuration Name"
                fullWidth
                margin="normal"
                variant="outlined"
                value={configDisplayName}
                onChange={(e) => setConfigDisplayName(e.target.value)}
                required
                disabled={loading}
                placeholder="My Firebase Project"
                helperText="A friendly name to identify this connection"
              />

              <Divider sx={{ my: 2 }} />
              
              <TextField
                label="API Key"
                fullWidth
                margin="normal"
                variant="outlined"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                disabled={loading}
              />
              <TextField
                label="Auth Domain"
                fullWidth
                margin="normal"
                variant="outlined"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                required
                disabled={loading}
                placeholder="project-id.firebaseapp.com"
              />
              <TextField
                label="Project ID"
                fullWidth
                margin="normal"
                variant="outlined"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={loading}
              />
              <TextField
                label="Storage Bucket"
                fullWidth
                margin="normal"
                variant="outlined"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                disabled={loading}
                placeholder="project-id.appspot.com"
              />
              <TextField
                label="Messaging Sender ID"
                fullWidth
                margin="normal"
                variant="outlined"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                disabled={loading}
              />
              <TextField
                label="App ID"
                fullWidth
                margin="normal"
                variant="outlined"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                disabled={loading}
              />
            </AccordionDetails>
          </Accordion>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
        <Box textAlign="center">
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onToggleForm}
              sx={{ cursor: 'pointer' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default Signup; 