import React, { useState, useEffect } from 'react';
import { AuthCard } from './components/AuthCard';
import { AppLayout } from './components/AppLayout';
import { Sidebar, Page } from './components/Sidebar';
import { TranslatePage } from './pages/TranslatePage';
import { VocabularyPage } from './pages/VocabularyPage';
import { WordlistsPage } from './pages/WordlistsPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { getToken, removeToken } from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('translate');

  useEffect(() => {
    // Check if user has token on mount
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setCurrentPage('translate');
  };
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4">
        <AuthCard onLogin={handleLogin} />
      </main>);

  }
  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}>

      {currentPage === 'translate' && <TranslatePage />}
      {currentPage === 'vocabulary' && <VocabularyPage />}
      {currentPage === 'wordlists' && <WordlistsPage />}
      {currentPage === 'progress' && <ProgressPage />}
      {currentPage === 'profile' && <ProfilePage onLogout={handleLogout} />}
    </AppLayout>);

}