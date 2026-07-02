import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Home, Grid3X3, Brain, Crosshair, Diamond, Download, BookOpen, ListChecks, ShieldCheck } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { ACHPage } from './pages/ACHPage';
import { BiasPage } from './pages/BiasPage';
import { IOCPage } from './pages/IOCPage';
import { DiamondPage } from './pages/DiamondPage';
import { ExportPage } from './pages/ExportPage';
import { DocsPage } from './pages/DocsPage';
import { KACPage } from './pages/KACPage';
import { QoICPage } from './pages/QoICPage';

export interface AppRouteDefinition {
  id: string;
  path?: string;
  index?: boolean;
  element: ReactElement;
  nav?: {
    icon: LucideIcon;
    label: string;
    tourId?: string;
  };
}

export const APP_ROUTES: AppRouteDefinition[] = [
  {
    id: 'home',
    index: true,
    element: <HomePage />,
    nav: {
      icon: Home,
      label: 'Projects',
    },
  },
  {
    id: 'ach',
    path: 'ach',
    element: <ACHPage />,
    nav: {
      icon: Grid3X3,
      label: 'ACH Matrix',
    },
  },
  {
    id: 'ach-matrix',
    path: 'ach/:matrixId',
    element: <ACHPage />,
  },
  {
    id: 'kac',
    path: 'kac',
    element: <KACPage />,
    nav: {
      icon: ListChecks,
      label: 'Key Assumptions',
    },
  },
  {
    id: 'qoic',
    path: 'qoic',
    element: <QoICPage />,
    nav: {
      icon: ShieldCheck,
      label: 'Info Quality',
    },
  },
  {
    id: 'bias',
    path: 'bias',
    element: <BiasPage />,
    nav: {
      icon: Brain,
      label: 'Bias Checklist',
      tourId: 'bias-nav',
    },
  },
  {
    id: 'ioc',
    path: 'ioc',
    element: <IOCPage />,
    nav: {
      icon: Crosshair,
      label: 'IOC Extractor',
    },
  },
  {
    id: 'diamond',
    path: 'diamond',
    element: <DiamondPage />,
    nav: {
      icon: Diamond,
      label: 'Diamond Model',
    },
  },
  {
    id: 'export',
    path: 'export',
    element: <ExportPage />,
    nav: {
      icon: Download,
      label: 'Export',
      tourId: 'export-nav',
    },
  },
  {
    id: 'docs',
    path: 'docs',
    element: <DocsPage />,
    nav: {
      icon: BookOpen,
      label: 'Docs',
      tourId: 'docs-nav',
    },
  },
];

export function getNavRoutes() {
  return APP_ROUTES.filter((route) => route.nav).map((route) => ({
    id: route.id,
    to: route.index ? '/' : `/${route.path}`,
    icon: route.nav!.icon,
    label: route.nav!.label,
    tourId: route.nav!.tourId,
  }));
}
