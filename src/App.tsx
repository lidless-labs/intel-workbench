import { lazy, Suspense } from 'react';

const AnalystDeskLayout = lazy(() => import('./variants/v3/Layout'));

function LoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ backgroundColor: 'var(--iw-bg)' }}
    >
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: 'var(--iw-accent)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-mono" style={{ color: 'var(--iw-text-muted)' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalystDeskLayout />
    </Suspense>
  );
}

export default App;
