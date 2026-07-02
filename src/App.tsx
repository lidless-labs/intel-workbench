import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ThemeProvider, ThemeModeProvider, useThemeMode } from './contexts/ThemeContext';
import { APP_ROUTES } from './routes';

function AppRoutes() {
  return (
    <Routes>
      {APP_ROUTES.map((route) => (
        <Route
          key={route.id}
          index={route.index}
          path={route.path}
          element={route.element}
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { theme } = useThemeMode();
  return (
    <ThemeProvider theme={theme}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  );
}

export default App;
