import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shield, ChevronRight, Sun, Moon } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { GuidedTour, TakeTourButton } from '../GuidedTour';
import { useThemeMode } from '../../contexts/ThemeContext';
import { getNavRoutes } from '../../routes';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const activeProject = useProjectStore((s) => s.getActiveProject());
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const navItems = getNavRoutes();

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200">
      <GuidedTour />

      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{
          backgroundColor: 'var(--iw-surface)',
          borderRight: '1px solid var(--iw-border)',
        }}
      >
        <div
          className="h-14 flex items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--iw-border)' }}
        >
          <Shield size={22} style={{ color: 'var(--iw-accent)' }} />
          <div>
            <h1
              className="text-sm font-semibold tracking-tight"
              style={{ color: 'var(--iw-text)' }}
            >
              Intel Workbench
            </h1>
            <p
              className="text-xxs font-mono"
              style={{ color: 'var(--iw-text-muted)' }}
            >
              Structured Analysis
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.to === '/';
            const isActive = isHome
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                {...(item.tourId
                  ? { 'data-tour': item.tourId }
                  : item.id === 'ioc'
                    ? { 'data-tour': 'ioc-nav' }
                    : item.id === 'diamond'
                      ? { 'data-tour': 'diamond-nav' }
                      : {})}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid var(--iw-border)' }}
        >
          <p
            className="text-xxs font-mono"
            style={{ color: 'var(--iw-text-muted)' }}
          >
            v3.0.0 - Phase 3
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="h-14 flex items-center justify-between px-6 backdrop-blur-sm flex-shrink-0"
          style={{
            backgroundColor: 'var(--iw-surface)',
            borderBottom: '1px solid var(--iw-border)',
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--iw-text-muted)' }}>Intel Workbench</span>
            {activeProject && (
              <>
                <ChevronRight size={14} style={{ color: 'var(--iw-text-muted)' }} />
                <span
                  className="font-medium"
                  style={{ color: 'var(--iw-text)' }}
                >
                  {activeProject.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMode}
              data-tour="theme-toggle"
              className="p-1.5 rounded-lg transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--iw-text-muted)' }}
              title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <TakeTourButton />
            {activeProject && (
              <span
                className="text-xxs font-mono"
                style={{ color: 'var(--iw-text-muted)' }}
              >
                {activeProject.achMatrices.length} matrices • {activeProject.biasChecklists.length} checklists
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
