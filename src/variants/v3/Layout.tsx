import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { ThemeProvider, type ThemeColors } from '../../contexts/ThemeContext';
import { useProjectStore } from '../../store/useProjectStore';
import { GuidedTour, TakeTourButton } from '../../components/GuidedTour';
import { APP_ROUTES, getNavRoutes } from '../../routes';

const THEME: ThemeColors = {
  bg: '#fafaf9',
  surface: '#ffffff',
  accent: '#2563eb',
  text: '#334155',
  textMuted: '#94a3b8',
  border: 'rgba(226,232,240,1)',
  fontHeading: 'Inter, system-ui, sans-serif',
  fontBody: 'Inter, system-ui, sans-serif',
  variantName: 'analyst-desk',
};

export default function AnalystDeskLayout() {
  const activeProject = useProjectStore((s) => s.getActiveProject());
  const location = useLocation();
  const navItems = getNavRoutes('v3', '');

  return (
    <ThemeProvider theme={THEME}>
      <style>{`
        .analyst-desk * {
          border-color: ${THEME.border} !important;
        }
        .analyst-desk .card {
          background: ${THEME.surface} !important;
          border: 1px solid ${THEME.border} !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .analyst-desk .input-field {
          background: ${THEME.bg} !important;
          border-color: ${THEME.border} !important;
          color: ${THEME.text} !important;
        }
        .analyst-desk .input-field::placeholder {
          color: ${THEME.textMuted} !important;
        }
        .analyst-desk .btn-primary {
          background: ${THEME.accent} !important;
          color: white !important;
        }
        .analyst-desk .btn-primary:hover {
          background: #1d4ed8 !important;
        }
        .analyst-desk .btn-secondary {
          background: ${THEME.surface} !important;
          border-color: ${THEME.border} !important;
          color: ${THEME.text} !important;
        }
        .analyst-desk .btn-ghost {
          color: ${THEME.textMuted} !important;
        }
        .analyst-desk .btn-ghost:hover {
          color: ${THEME.text} !important;
          background: rgba(0,0,0,0.03) !important;
        }
      `}</style>

      <div
        className="analyst-desk flex flex-col h-screen overflow-hidden"
        style={{
          backgroundColor: THEME.bg,
          color: THEME.text,
          fontFamily: THEME.fontBody,
        }}
      >
        <GuidedTour />

        <header
          className="flex items-center px-6 h-14 flex-shrink-0"
          style={{
            backgroundColor: THEME.surface,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <div className="flex items-center gap-2 mr-8">
            <Shield size={20} style={{ color: THEME.accent }} />
            <span className="text-sm font-semibold" style={{ color: THEME.text }}>
              Intel Workbench
            </span>
          </div>

          <nav className="flex items-center gap-1 h-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === 'home'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className="flex items-center gap-2 px-3 h-full text-sm font-medium transition-all duration-150"
                  style={{
                    color: isActive ? THEME.accent : THEME.textMuted,
                    borderBottom: isActive ? `2px solid ${THEME.accent}` : '2px solid transparent',
                  }}
                  {...(item.tourId
                    ? { 'data-tour': item.tourId }
                    : item.id === 'ioc'
                      ? { 'data-tour': 'ioc-nav' }
                      : item.id === 'diamond'
                        ? { 'data-tour': 'diamond-nav' }
                        : {})}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <TakeTourButton />
            {activeProject && (
              <span className="text-xs" style={{ color: THEME.textMuted }}>
                {activeProject.name}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <Routes>
              {APP_ROUTES.map((route) => (
                <Route key={route.id} index={route.index} path={route.path} element={route.element} />
              ))}
            </Routes>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
