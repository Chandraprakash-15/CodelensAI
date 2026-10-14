import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProblemPage } from './pages/Problem';
import { VisualizingPage } from './pages/Visualizing';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problem/valid-palindrome" element={<ProblemPage />} />
          <Route path="/visualizing" element={<VisualizingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
