import { useEffect, useCallback } from 'react';
import { driver, type Config, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTheme } from '../contexts/ThemeContext';

const TOUR_STORAGE_KEY = 'intel-workbench-tour-complete';

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: '🛡️ Welcome to Solomon\'s Intel Workbench',
      description:
        'Intel Workbench helps you perform structured Analysis of Competing Hypotheses (ACH). Let\'s take a quick tour of the key features.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="hypothesis-columns"]',
    popover: {
      title: 'Hypothesis Columns',
      description:
        'Each column represents a competing hypothesis. Add as many as you need. The matrix will score them against all evidence.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="evidence-rows"]',
    popover: {
      title: 'Evidence Rows',
      description:
        'Each row is a piece of evidence or intelligence indicator. Set credibility and relevance to weight its impact on scoring.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="scoring-cells"]',
    popover: {
      title: 'Scoring Cells',
      description:
        'Click any cell to cycle through ratings: Consistent (C), Inconsistent (I), Neutral (N), or N/A (—). Ratings drive the hypothesis scores.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="score-bar"]',
    popover: {
      title: 'Score Bar Results',
      description:
        'The score bar shows each hypothesis\'s weighted inconsistency score. The one with the lowest score (trophy icon) is the best-supported hypothesis.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="bias-nav"]',
    popover: {
      title: 'Bias Checklist',
      description:
        'Navigate here to review 12 cognitive biases that might affect your analysis. Check off each one as you mitigate it.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="ioc-nav"]',
    popover: {
      title: 'IOC Extractor',
      description:
        'Extract indicators of compromise from raw text, defang them for safe sharing, and export curated results.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="diamond-nav"]',
    popover: {
      title: 'Diamond Model',
      description:
        'Map intrusion activity across adversary, capability, infrastructure, and victim to structure campaign analysis.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="export-nav"]',
    popover: {
      title: 'Export & Import',
      description:
        'Export your analysis as JSON (for backup) or Markdown (for reports). Import previously saved projects here too.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="docs-nav"]',
    popover: {
      title: 'Documentation',
      description:
        'Full in-app documentation covering ACH methodology, scoring formulas, keyboard shortcuts, and more.',
      side: 'right',
      align: 'center',
    },
  },
];

function createDriverInstance(themeBg: string, onComplete?: () => void): Driver {
  let completed = false;

  const completeOnce = () => {
    if (completed) return;
    completed = true;
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    onComplete?.();
  };

  let driverInstance: Driver;
  const config: Config = {
    showProgress: true,
    animate: true,
    overlayColor: themeBg,
    overlayOpacity: 0.75,
    stagePadding: 8,
    stageRadius: 8,
    popoverClass: 'intel-tour-popover',
    steps: TOUR_STEPS,
    onDestroyStarted: () => {
      driverInstance.destroy();
    },
    onDestroyed: () => {
      completeOnce();
    },
  };

  driverInstance = driver(config);
  return driverInstance;
}

interface GuidedTourProps {
  /** If true, force-start the tour regardless of localStorage */
  forceStart?: boolean;
  /** Called when tour completes or is dismissed */
  onComplete?: () => void;
}

export function GuidedTour({ forceStart = false, onComplete }: GuidedTourProps) {
  const theme = useTheme();

  const startTour = useCallback(() => {
    const driverInstance = createDriverInstance(theme.bg, onComplete);

    requestAnimationFrame(() => {
      driverInstance.drive();
    });
  }, [theme.bg, onComplete]);

  useEffect(() => {
    if (forceStart) {
      startTour();
      return;
    }

    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(startTour, 800);
      return () => clearTimeout(timer);
    }
  }, [forceStart, startTour]);

  return null;
}

export function TakeTourButton() {
  const theme = useTheme();

  const handleClick = () => {
    const driverInstance = createDriverInstance(theme.bg);
    driverInstance.drive();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:opacity-80"
      style={{
        backgroundColor: `${theme.accent}15`,
        color: theme.accent,
        border: `1px solid ${theme.border}`,
      }}
      title="Take guided tour"
    >
      <span>?</span>
      <span>Tour</span>
    </button>
  );
}
