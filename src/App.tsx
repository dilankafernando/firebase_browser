import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthContainer from './components/AuthContainer';
import DataBrowserPage from './pages/DataBrowserPage';
import SettingsPage from './pages/SettingsPage';
import { useStore } from './store';

const App: React.FC = () => {
  const { setError } = useStore();

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [setError]);

  return (
    <Router>
      <AuthContainer>
        <Layout>
          <Routes>
            <Route path="/" element={<DataBrowserPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthContainer>
    </Router>
  );
};

export default App; 