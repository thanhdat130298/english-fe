import { useState, useEffect } from 'react';
import { AuthCard } from './components/AuthCard';
import { AppLayout } from './components/AppLayout';
import { Page } from './components/Sidebar';
import { TranslatePage } from './pages/TranslatePage';
import { VocabularyPage } from './pages/VocabularyPage';
import { ReviewPage } from './pages/ReviewPage';
import { WordlistsPage } from './pages/WordlistsPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { getToken, removeToken } from './services/api';
import { useServerWarmup } from './hooks/useServerWarmup';
import { AppLoader } from './components/AppLoader';
import { Toast } from './components/Toast';

const PAGE_PATHS: Record<Page, string> = {
  translate: '/translate',
  vocabulary: '/vocabulary',
  review: '/review',
  wordlists: '/wordlists',
  progress: '/progress',
  profile: '/profile',
};

const WARMUP_ENDPOINTS: string[] = ['/ping', '/health', '/', ''];

function getPageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const page = (Object.entries(PAGE_PATHS).find(([, path]) => path === normalizedPath)?.[0] ??
    'translate') as Page;
  return page;
}

export function App() {
  const warmup = useServerWarmup({
    // Render free tier cold start feels better with a minimum loader.
    minDurationMs: 2600,
    slowThresholdMs: 15000,
    attemptTimeoutMs: 15000,
    retries: 2,
    endpoints: WARMUP_ENDPOINTS,
  });
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [warmupToastVisible, setWarmupToastVisible] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'translate' : getPageFromPath(window.location.pathname)
  );

  useEffect(() => {
    if (warmup.status === 'ready') {
      setLoaderVisible(false);
    }
  }, [warmup.status]);

  useEffect(() => {
    if (warmup.gaveUp) setWarmupToastVisible(true);
  }, [warmup.gaveUp]);

  useEffect(() => {
    // Check if user has token on mount
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    }

    const pageFromUrl = getPageFromPath(window.location.pathname);
    setCurrentPage(pageFromUrl);

    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    const nextPath = PAGE_PATHS[page];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setCurrentPage('translate');
    if (window.location.pathname !== PAGE_PATHS.translate) {
      window.history.pushState({}, '', PAGE_PATHS.translate);
    }
  };
  return (
    <>
      <AppLoader
        visible={warmup.status !== 'ready' ? true : loaderVisible}
        progress={warmup.progress}
        message={warmup.message}
        isSlow={warmup.isSlow}
        attempt={warmup.attempt}
        error={warmup.error}
      />

      {warmupToastVisible ? (
        <Toast
          variant="error"
          message="App lỏ, backend bị hư rồi. Nghỉ đi."
          onClose={() => setWarmupToastVisible(false)}
        />
      ) : null}

      {warmup.status === 'ready' ? (
        !isAuthenticated ? (
          <main className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4">
            <AuthCard onLogin={handleLogin} />
          </main>
        ) : (
          <AppLayout currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout}>
            {currentPage === 'translate' && <TranslatePage />}
            {currentPage === 'vocabulary' && (
              <VocabularyPage onNavigateToReview={() => handleNavigate('review')} />
            )}
            {currentPage === 'review' && <ReviewPage onBack={() => handleNavigate('vocabulary')} />}
            {currentPage === 'wordlists' && <WordlistsPage />}
            {currentPage === 'progress' && <ProgressPage />}
            {currentPage === 'profile' && <ProfilePage onLogout={handleLogout} />}
          </AppLayout>
        )
      ) : null}
    </>
  );

}