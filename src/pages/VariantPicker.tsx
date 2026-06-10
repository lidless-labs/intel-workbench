import { useNavigate } from 'react-router-dom';
import { Shield, Terminal, Layout, Crosshair, Zap } from 'lucide-react';

interface VariantCard {
  id: string;
  path: string;
  name: string;
  subtitle: string;
  description: string;
  colors: { bg: string; accent: string; accentSecondary?: string };
  icon: typeof Shield;
}

const VARIANTS: VariantCard[] = [
  {
    id: 'v1',
    path: '/v1',
    name: 'Langley',
    subtitle: 'Intelligence Agency',
    description:
      'Classified document aesthetic with dark navy backgrounds and gold accents. Top-secret banners, document stamps, and serif typography.',
    colors: { bg: '#0a1628', accent: '#c9a84c' },
    icon: Shield,
  },
  {
    id: 'v2',
    path: '/v2',
    name: 'Terminal',
    subtitle: 'Hacker / OSINT',
    description:
      'Pure black terminal aesthetic with matrix green accents. Scanline overlay, blinking cursors, and full monospace typography.',
    colors: { bg: '#000000', accent: '#00ff41' },
    icon: Terminal,
  },
  {
    id: 'v3',
    path: '/v3',
    name: "Analyst's Desk",
    subtitle: 'Clean Professional',
    description:
      'Light, minimal design inspired by Notion. Warm white backgrounds, clean sans-serif typography, and content-first layout.',
    colors: { bg: '#fafaf9', accent: '#2563eb' },
    icon: Layout,
  },
  {
    id: 'v4',
    path: '/v4',
    name: 'Stratcom',
    subtitle: 'Military Command',
    description:
      'OD green tactical aesthetic with amber accents. Grid lines, coordinate markers, operational status panels, and bold typography.',
    colors: { bg: '#1a2e1a', accent: '#f59e0b' },
    icon: Crosshair,
  },
  {
    id: 'v5',
    path: '/v5',
    name: 'Cyber Noir',
    subtitle: 'Cyberpunk',
    description:
      'Dark cyberpunk aesthetic with neon cyan and magenta accents. Glowing borders, gradient effects, glass-morphism sidebar.',
    colors: { bg: '#0d0d0d', accent: '#06b6d4', accentSecondary: '#d946ef' },
    icon: Zap,
  },
];

export function VariantPicker() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(135deg, #0b0f19 0%, #111827 50%, #0b0f19 100%)' }}
    >
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield size={36} className="text-cyan-400" />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Solomon&apos;s Intel Workbench
          </h1>
        </div>
        <p className="text-sm max-w-lg mx-auto" style={{color: "var(--iw-text-muted)"}}>
          Choose a visual theme to begin. Each variant provides the same analytical tools
          — ACH Matrix, Bias Checklist, and Export — wrapped in a distinct aesthetic.
        </p>
      </div>

      {/* Variant grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {VARIANTS.map((variant) => {
          const Icon = variant.icon;
          return (
            <button
              key={variant.id}
              onClick={() => navigate(variant.path)}
              className="group relative text-left rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              style={{ backgroundColor: '#111827' }}
            >
              {/* Color swatch strip */}
              <div className="h-2 w-full" style={{ backgroundColor: variant.colors.accent }} />

              {/* Preview bar */}
              <div
                className="h-24 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: variant.colors.bg }}
              >
                {variant.colors.accentSecondary && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(135deg, ${variant.colors.accent}, ${variant.colors.accentSecondary})`,
                    }}
                  />
                )}
                <Icon
                  size={32}
                  className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: variant.colors.accent }}
                />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">{variant.name}</h3>
                  <span className="text-xxs font-mono px-2 py-0.5 rounded-full bg-slate-700/50 uppercase tracking-wider" style={{color: "var(--iw-text-muted)"}}>
                    {variant.subtitle}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mt-2" style={{color: "var(--iw-text-muted)"}}>
                  {variant.description}
                </p>

                {/* Color swatches */}
                <div className="flex items-center gap-2 mt-4">
                  <div
                    className="w-5 h-5 rounded-full border border-slate-600/50"
                    style={{ backgroundColor: variant.colors.bg }}
                    title="Background"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-slate-600/50"
                    style={{ backgroundColor: variant.colors.accent }}
                    title="Accent"
                  />
                  {variant.colors.accentSecondary && (
                    <div
                      className="w-5 h-5 rounded-full border border-slate-600/50"
                      style={{ backgroundColor: variant.colors.accentSecondary }}
                      title="Secondary accent"
                    />
                  )}
                  <span className="ml-auto flex items-center gap-2">
                    <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 group-hover:text-slate-400 transition-colors" style={{color: "var(--iw-text-muted)"}}>
                      {variant.id}
                    </kbd>
                    <span className="text-xxs font-mono group-hover:text-cyan-400 transition-colors" style={{color: "var(--iw-text-muted)"}}>
                      Enter →
                    </span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Default/original variant card */}
        <button
          onClick={() => navigate('/default')}
          className="group relative text-left rounded-2xl border border-dashed border-slate-600/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-slate-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          style={{ backgroundColor: '#111827' }}
        >
          <div className="h-2 w-full bg-cyan-500" />
          <div className="h-24 flex items-center justify-center" style={{backgroundColor: "var(--iw-bg)"}}>
            <Shield
              size={32}
              className="text-cyan-500 transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white">Original</h3>
              <span className="text-xxs font-mono px-2 py-0.5 rounded-full bg-slate-700/50 uppercase tracking-wider" style={{color: "var(--iw-text-muted)"}}>
                Default
              </span>
            </div>
            <p className="text-xs leading-relaxed mt-2" style={{color: "var(--iw-text-muted)"}}>
              The original Phase 1 layout with dark sidebar, cyan accents, and the standard
              navigation you know.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-5 h-5 rounded-full border border-slate-600/50" title="Background" style={{backgroundColor: "var(--iw-bg)"}} />
              <div className="w-5 h-5 rounded-full border border-slate-600/50 bg-cyan-500" title="Accent" />
              <span className="ml-auto text-xxs font-mono group-hover:text-cyan-400 transition-colors" style={{color: "var(--iw-text-muted)"}}>
                Enter →
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
