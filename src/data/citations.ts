/**
 * Source citations for each Structured Analytic Technique surfaced in the
 * SAT library. The primary anchor is the CIA's "A Tradecraft Primer:
 * Structured Analytic Techniques for Improving Intelligence Analysis"
 * (Sherman Kent School for Intelligence Analysis, March 2009). The secondary
 * anchor is Heuer, R. J. and Pherson, R. H., "Structured Analytic Techniques
 * for Intelligence Analysis", 3rd ed., CQ Press, 2020.
 */

export type SATKind =
  | 'kac'
  | 'qoic'
  | 'indicators'
  | 'devils-advocacy'
  | 'premortem'
  | 'ach'
  | 'redteam';

export interface Citation {
  /** Display title shown in the panel header. */
  title: string;
  /** Short ICD/IC tier label, e.g. "Diagnostic" or "Contrarian". */
  tier: string;
  /** Primary source line - always the CIA Tradecraft Primer. */
  primarySource: string;
  /** Secondary source - Heuer & Pherson. */
  secondarySource: string;
  /** Optional third source for SATs with strong external standards (e.g. NATO AAP-6). */
  tertiarySource?: string;
  /** Page or chapter reference for the primary source. */
  pageRange: string;
  /** One-paragraph plain-language summary of the technique. */
  summary: string;
  /** Short methodology note describing when to use the technique. */
  methodologyNote: string;
}

export const CITATIONS: Record<SATKind, Citation> = {
  kac: {
    title: 'Key Assumptions Check',
    tier: 'Diagnostic',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 8.',
    pageRange: 'pp. 7-9',
    summary:
      'A Key Assumptions Check surfaces the unstated premises underpinning an analytic judgment so that each can be tested against available evidence rather than carried forward unexamined.',
    methodologyNote:
      'Use before drafting hypotheses to expose what you are taking for granted, and again whenever new evidence pushes the analytic line in a different direction.',
  },
  qoic: {
    title: 'Quality of Information Check',
    tier: 'Diagnostic',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 9.',
    tertiarySource:
      'NATO AAP-6 (Allied Administrative Publication) source-reliability and information-accuracy ratings.',
    pageRange: 'pp. 11-13',
    summary:
      'A Quality of Information Check evaluates the completeness, accuracy, recency, and provenance of source material so analysts and reviewers can see at a glance how heavily a piece of evidence should be weighted.',
    methodologyNote:
      'Apply to every evidence row before finalizing a matrix. Admiralty reliability/accuracy is an overlay that informs how analysts set credibility - it does not change ACH scoring directly.',
  },
  indicators: {
    title: 'Indicators / Signposts of Change',
    tier: 'Diagnostic / Forward-looking',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 10.',
    pageRange: 'pp. 15-18',
    summary:
      'Indicators are observable events that would confirm or refute a working hypothesis going forward. The technique converts an analytic judgment into a checklist of things to watch for.',
    methodologyNote:
      'After settling on a working hypothesis from ACH, list the signposts whose appearance would either reinforce or break it. Track them as new collection arrives.',
  },
  'devils-advocacy': {
    title: "Devil's Advocacy",
    tier: 'Contrarian',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 11.',
    pageRange: 'pp. 21-23',
    summary:
      'Devil\'s Advocacy is a structured rebuttal of the leading hypothesis. An assigned analyst (or section of the analytic team) argues the opposite case to ensure the preferred line has been tested against its strongest counter.',
    methodologyNote:
      'Apply once the matrix has produced a clear leading hypothesis. Do not skip this step when the answer feels obvious - that is precisely when it has the most analytic value.',
  },
  premortem: {
    title: 'Premortem Analysis',
    tier: 'Contrarian',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 11.',
    pageRange: 'pp. 25-27',
    summary:
      'A Premortem assumes the analysis is wrong - typically projected six to twelve months in the future - and works backward to identify how the failure occurred. It surfaces blind spots that the matrix itself will not catch.',
    methodologyNote:
      'Run after the matrix is complete and Devil\'s Advocacy has been applied. The exercise is most useful when the analytic team has converged on a confident judgment.',
  },
  ach: {
    title: 'Analysis of Competing Hypotheses (ACH)',
    tier: 'Contrarian',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 7.',
    pageRange: 'pp. 29-32',
    summary:
      'ACH evaluates each piece of evidence against every plausible hypothesis simultaneously. The hypothesis with the fewest inconsistencies - not the most consistencies - is the strongest analytic line.',
    methodologyNote:
      'Heuer\'s signature contribution. Read inconsistency, not consistency: a hypothesis is supported when little evidence contradicts it, not when much evidence agrees with it.',
  },
  redteam: {
    title: 'Red Team Analysis',
    tier: 'Imagination',
    primarySource:
      'A Tradecraft Primer: Structured Analytic Techniques for Improving Intelligence Analysis, Central Intelligence Agency, Sherman Kent School for Intelligence Analysis, March 2009.',
    secondarySource:
      'Heuer, R. J. and Pherson, R. H., Structured Analytic Techniques for Intelligence Analysis, 3rd ed., CQ Press, 2020, ch. 12.',
    pageRange: 'pp. 35-38',
    summary:
      'Red Team Analysis re-models the situation from the adversary\'s planning perspective. The analyst plays the adversary, reasons through their constraints and incentives, and predicts likely next moves.',
    methodologyNote:
      'Most useful when adversary capability and intent are well-understood. Combine with the Diamond Model and ATT&CK technique frequencies to ground the adversary\'s perspective in known TTPs.',
  },
};
