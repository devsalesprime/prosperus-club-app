import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { initSentry } from './lib/sentry';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// ADR-014: inicializar Sentry ANTES do ReactDOM.createRoot para capturar
// erros no setup inicial (rendering errors, lazy imports, etc.).
// initSentry é no-op em dev ou sem VITE_SENTRY_DSN — zero overhead local.
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5min — data considered fresh
      gcTime: 10 * 60 * 1000,       // 10min — cache retention after inactive
      retry: 2,
      refetchOnWindowFocus: false,   // avoid refetch when switching apps
      refetchOnReconnect: true,      // refresh when coming back online
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* ErrorBoundary externo captura erros de render em qualquer nível do app.
        Mantém auto-reload de ChunkLoadError (deploy stale) e envia ao Sentry
        via Sentry.captureException no componentDidCatch (ADR-014). */}
    <ErrorBoundary moduleName="aplicativo">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
