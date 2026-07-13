import { type ReactNode } from 'react';
import { BookOpen, HelpCircle, Keyboard, BarChart3, Brain, List, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DocSection {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: ReactNode;
}

export function DocsPage() {
  const theme = useTheme();

  const sections: DocSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: BookOpen,
      content: (
        <>
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Intel Workbench is a structured analytic tool designed for intelligence analysts,
            threat researchers, and security professionals. It implements the{' '}
            <strong style={{ color: theme.text }}>Analysis of Competing Hypotheses (ACH)</strong>{' '}
            methodology alongside cognitive bias awareness tools to support rigorous,
            evidence-based assessments.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: theme.textMuted }}>
            All data is stored locally in your browser via localStorage. Nothing is sent to any
            server — Intel Workbench works fully offline once loaded.
          </p>
        </>
      ),
    },
    {
      id: 'what-is-ach',
      title: 'What is ACH?',
      icon: HelpCircle,
      content: (
        <>
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            <strong style={{ color: theme.text }}>Analysis of Competing Hypotheses</strong> is a
            structured analytic technique developed by Richards J. Heuer Jr. at the CIA. Published
            in his landmark work{' '}
            <em>Psychology of Intelligence Analysis</em> (1999), ACH was designed to
            overcome the cognitive limitations that plague traditional analytical approaches.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: theme.textMuted }}>
            The core principle: instead of seeking evidence to <em>confirm</em> your favored
            hypothesis, ACH forces you to evaluate how well <em>all</em> evidence fits against{' '}
            <em>all</em> hypotheses simultaneously. The hypothesis with the fewest inconsistencies
            — not the most confirmations — is considered best supported.
          </p>
          <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: theme.text }}>
            Why ACH Works
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: theme.textMuted }}>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.accent }}>•</span>
              <span>Forces consideration of multiple alternatives simultaneously</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.accent }}>•</span>
              <span>Focuses on disproving rather than proving — a more reliable logical approach</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.accent }}>•</span>
              <span>Makes the analytical process transparent and auditable</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: theme.accent }}>•</span>
              <span>Reduces the impact of confirmation bias and anchoring</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'how-to-use',
      title: 'How to Use',
      icon: List,
      content: (
        <>
          <ol className="space-y-4 text-sm" style={{ color: theme.textMuted }}>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                1
              </span>
              <div>
                <strong style={{ color: theme.text }}>Create or load a project</strong>
                <p className="mt-1">
                  From the Projects page, create a new project or load the sample Sandworm analysis.
                  Each project can contain multiple ACH matrices and bias checklists.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                2
              </span>
              <div>
                <strong style={{ color: theme.text }}>Add hypotheses</strong>
                <p className="mt-1">
                  In the ACH Matrix page, click <em>"+ Hypothesis"</em> to add competing
                  explanations. These become the columns of your matrix.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                3
              </span>
              <div>
                <strong style={{ color: theme.text }}>Add evidence</strong>
                <p className="mt-1">
                  Click <em>"+ Evidence"</em> to add indicators, facts, or arguments. Set each
                  item's source, credibility (High/Medium/Low), and relevance (High/Medium/Low).
                  These become the rows of your matrix.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                4
              </span>
              <div>
                <strong style={{ color: theme.text }}>Rate consistency</strong>
                <p className="mt-1">
                  Click any cell in the matrix to cycle through ratings:{' '}
                  <strong>C</strong> (Consistent), <strong>I</strong> (Inconsistent),{' '}
                  <strong>N</strong> (Neutral), <strong>—</strong> (N/A). Each click advances to the
                  next rating.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                5
              </span>
              <div>
                <strong style={{ color: theme.text }}>Review scores</strong>
                <p className="mt-1">
                  The score bar at the bottom of each hypothesis column shows the weighted
                  inconsistency score. The hypothesis with the lowest score (shown with a trophy
                  icon) is the most supported by the evidence.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                6
              </span>
              <div>
                <strong style={{ color: theme.text }}>Check for biases</strong>
                <p className="mt-1">
                  Navigate to the Bias Checklist page. Review each cognitive bias and consider
                  whether it might be affecting your analysis. Check off biases you've accounted
                  for and add mitigation notes.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                7
              </span>
              <div>
                <strong style={{ color: theme.text }}>Export your analysis</strong>
                <p className="mt-1">
                  Use the Export page to download your project as JSON (for backup/import) or
                  Markdown (for reports and documentation).
                </p>
              </div>
            </li>
          </ol>
        </>
      ),
    },
    {
      id: 'scoring',
      title: 'Scoring Methodology',
      icon: BarChart3,
      content: (
        <>
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Intel Workbench uses a weighted inconsistency scoring system. Each evidence-hypothesis
            rating is converted to a numeric value and multiplied by the evidence's credibility
            and relevance weights.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" style={{ color: theme.textMuted }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: theme.text }}>
                    Rating
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: theme.text }}>
                    Code
                  </th>
                  <th className="text-left py-2 font-semibold" style={{ color: theme.text }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2 pr-4">Inconsistent</td>
                  <td className="py-2 pr-4 font-mono" style={{ color: '#ef4444' }}>I</td>
                  <td className="py-2 font-mono">+2</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2 pr-4">Neutral</td>
                  <td className="py-2 pr-4 font-mono" style={{ color: '#9ca3af' }}>N</td>
                  <td className="py-2 font-mono">0</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2 pr-4">Consistent</td>
                  <td className="py-2 pr-4 font-mono" style={{ color: '#22c55e' }}>C</td>
                  <td className="py-2 font-mono">−1</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Not Applicable</td>
                  <td className="py-2 pr-4 font-mono" style={{ color: theme.textMuted }}>—</td>
                  <td className="py-2 font-mono">ignored</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: theme.text }}>
            Weight Multipliers
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: theme.textMuted }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: theme.text }}>
                    Level
                  </th>
                  <th className="text-left py-2 font-semibold" style={{ color: theme.text }}>
                    Multiplier
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2 pr-4">High</td>
                  <td className="py-2 font-mono">1.5×</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2 pr-4">Medium</td>
                  <td className="py-2 font-mono">1.0×</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Low</td>
                  <td className="py-2 font-mono">0.5×</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm leading-relaxed mt-4" style={{ color: theme.textMuted }}>
            <strong style={{ color: theme.text }}>Formula:</strong>{' '}
            <code
              className="px-2 py-1 rounded text-xs font-mono"
              style={{ backgroundColor: `${theme.accent}10`, color: theme.accent }}
            >
              Score = Σ (credibility_weight × relevance_weight × rating_value)
            </code>
          </p>
          <p className="text-sm leading-relaxed mt-2" style={{ color: theme.textMuted }}>
            The hypothesis with the lowest overall score is identified as the{' '}
            <strong style={{ color: theme.text }}>preferred hypothesis</strong> — it has the best
            fit with the available evidence.
          </p>
        </>
      ),
    },
    {
      id: 'biases',
      title: 'Cognitive Biases',
      icon: Brain,
      content: (
        <>
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Intel Workbench includes a checklist of 12 cognitive biases based on the Heuer &
            Pherson taxonomy, organized into three categories:
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#a855f7' }}>
                🧠 Cognitive Biases
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: theme.textMuted }}>
                <li>• <strong style={{ color: theme.text }}>Anchoring</strong> — Over-relying on the first piece of information</li>
                <li>• <strong style={{ color: theme.text }}>Confirmation Bias</strong> — Seeking info that confirms existing beliefs</li>
                <li>• <strong style={{ color: theme.text }}>Availability Heuristic</strong> — Judging likelihood by ease of recall</li>
                <li>• <strong style={{ color: theme.text }}>Vividness Bias</strong> — Overweighting dramatic events</li>
                <li>• <strong style={{ color: theme.text }}>Hindsight Bias</strong> — "I knew it all along" effect</li>
                <li>• <strong style={{ color: theme.text }}>Proportionality Bias</strong> — Assuming big effects need big causes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#3b82f6' }}>
                📊 Analytical Biases
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: theme.textMuted }}>
                <li>• <strong style={{ color: theme.text }}>Mirror-Imaging</strong> — Assuming adversaries think like us</li>
                <li>• <strong style={{ color: theme.text }}>Satisficing</strong> — Accepting the first "good enough" explanation</li>
                <li>• <strong style={{ color: theme.text }}>Premature Closure</strong> — Concluding before all evidence is examined</li>
                <li>• <strong style={{ color: theme.text }}>Denial of Change</strong> — Assuming patterns will continue unchanged</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#f59e0b' }}>
                👥 Social Biases
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: theme.textMuted }}>
                <li>• <strong style={{ color: theme.text }}>Groupthink</strong> — Conforming to consensus without critical evaluation</li>
                <li>• <strong style={{ color: theme.text }}>Bandwagon Effect</strong> — Adopting views because others hold them</li>
              </ul>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'keyboard',
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      content: (
        <>
          <p className="text-sm leading-relaxed mb-4" style={{ color: theme.textMuted }}>
            Navigate the ACH matrix efficiently using keyboard controls:
          </p>
          <div className="space-y-2">
            {[
              { keys: 'Enter / Space', action: 'Cycle rating in focused cell (NA → C → I → N → NA)' },
              { keys: 'Tab', action: 'Move focus to next interactive element' },
              { keys: 'Shift + Tab', action: 'Move focus to previous interactive element' },
              { keys: 'Enter', action: 'Confirm inline edit (hypothesis name, evidence text)' },
              { keys: 'Escape', action: 'Cancel inline edit or close modal' },
              { keys: 'Shift + Enter', action: 'New line in evidence text area (during edit)' },
            ].map((shortcut) => (
              <div
                key={shortcut.keys}
                className="flex items-center gap-4 py-2 text-sm"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <kbd
                  className="flex-shrink-0 px-2 py-1 rounded text-xs font-mono font-semibold min-w-[140px] text-center"
                  style={{
                    backgroundColor: `${theme.accent}10`,
                    color: theme.accent,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {shortcut.keys}
                </kbd>
                <span style={{ color: theme.textMuted }}>{shortcut.action}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: MessageCircle,
      content: (
        <>
          <div className="space-y-6">
            {[
              {
                q: 'Where is my data stored?',
                a: 'All data is stored in your browser\'s localStorage under the key "intel-workbench-projects". Nothing is sent to any server. Clearing your browser data will erase your projects — use the Export feature to back up.',
              },
              {
                q: 'Can I share projects with teammates?',
                a: 'Yes — use the Export page to generate a JSON file, then share it. Your teammate can import it on their own instance using the Import feature on the same page.',
              },
              {
                q: 'What does the preferred hypothesis (trophy icon) mean?',
                a: 'The preferred hypothesis is the one with the lowest weighted inconsistency score. This means the evidence is most consistent with that hypothesis. It\'s the best supported — but not necessarily "correct."',
              },
              {
                q: 'How do credibility and relevance affect scoring?',
                a: 'They act as multipliers. High credibility/relevance (1.5×) amplifies the rating\'s impact, while Low (0.5×) dampens it. A highly credible, highly relevant piece of inconsistent evidence counts for 2 × 1.5 × 1.5 = 4.5 points.',
              },
              {
                q: 'Do I need an internet connection?',
                a: 'The initial page load may fetch Google Fonts. Analysis data and tools work without an application backend after the app has loaded.',
              },
              {
                q: 'Which interface does Intel Workbench use?',
                a: 'Intel Workbench uses the Analyst\'s Desk interface across the application. The former variant picker and alternate layouts were removed so design and accessibility work stays focused on one interface.',
              },
            ].map((item) => (
              <div key={item.q}>
                <h4 className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
                  {item.q}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={22} style={{ color: theme.accent }} />
          <h1 className="text-xl font-bold" style={{ color: theme.text, fontFamily: theme.fontHeading }}>
            Documentation
          </h1>
        </div>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Everything you need to know about Intel Workbench and the ACH methodology.
        </p>
      </div>

      {/* Table of Contents */}
      <nav
        className="card p-4"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
          Contents
        </h3>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:opacity-80"
                style={{
                  backgroundColor: `${theme.accent}10`,
                  color: theme.accent,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <Icon size={13} />
                {section.title}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Sections */}
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <section
            key={section.id}
            id={section.id}
            className="card p-6"
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon size={18} style={{ color: theme.accent }} />
              <h2
                className="text-base font-semibold"
                style={{ color: theme.text, fontFamily: theme.fontHeading }}
              >
                {section.title}
              </h2>
            </div>
            {section.content}
          </section>
        );
      })}
    </div>
  );
}
