import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Module pages
import Dashboard from './modules/dashboard/Dashboard';
import BookDetail from './modules/dashboard/BookDetail';
import WritingView from './modules/studio/WritingView';
import Monitor from './modules/monitor/Monitor';
import Settings from './modules/settings/Settings';
import Analytics from './modules/analytics/Analytics';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/:bookId" element={<BookDetail />} />
        <Route path="/:bookId/studio" element={<WritingView />} />
        <Route path="/:bookId/chapter/:chapterId" element={<BookDetail />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
