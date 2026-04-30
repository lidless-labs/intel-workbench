import type { Project, ACHMatrix, Evidence, Hypothesis, ConsistencyRating } from '../types';

const hypotheses: Hypothesis[] = [
  {
    id: 'h1-gru',
    name: 'Russian GRU Unit 74455',
    description:
      'Attribution to Sandworm Team, a cyber unit within the Russian GRU (Main Intelligence Directorate), specifically Unit 74455 based in Moscow.',
    confidence: 'High',
    confidenceJustification:
      'Multiple independent high-credibility sources (DOJ indictment, ESET, Microsoft, Cisco Talos) corroborate.',
    probabilityBand: 'almost-certainly',
    attackTechniques: ['T1485', 'T1486', 'T1490', 'T1565'],
  },
  {
    id: 'h2-apt41',
    name: 'Chinese APT41 false flag',
    description:
      'Operations conducted by Chinese state-sponsored APT41 (Double Dragon) with deliberate false flags to implicate Russia.',
    confidence: 'Low',
    probabilityBand: 'very-unlikely',
    attackTechniques: ['T1027', 'T1059', 'T1190'],
  },
  {
    id: 'h3-criminal',
    name: 'Criminal group (not state)',
    description:
      'Activity conducted by a sophisticated financially-motivated criminal group without direct state sponsorship.',
    confidence: 'Low',
    probabilityBand: 'almost-no-chance',
    attackTechniques: ['T1486'],
  },
  {
    id: 'h4-unknown',
    name: 'Unknown state actor',
    description:
      'Operations by an unidentified state-level actor with unknown motivations, possibly a third party benefiting from chaos.',
    confidence: 'Low',
    probabilityBand: 'unlikely',
  },
];

const evidence: Evidence[] = [
  {
    id: 'e1-notpetya',
    description:
      'NotPetya destructive wiper disguised as ransomware, targeting Ukrainian financial software (M.E.Doc) and spreading globally. Caused $10B+ in damages (2017).',
    source: 'ESET, Microsoft, US-CERT',
    credibility: 'High',
    relevance: 'High',
    attackTechniques: ['T1485', 'T1490'],
  },
  {
    id: 'e2-olympic',
    description:
      'Olympic Destroyer malware deployed during PyeongChang 2018 Winter Olympics opening ceremony, disrupting IT infrastructure.',
    source: 'Kaspersky, Cisco Talos',
    credibility: 'Medium',
    relevance: 'High',
    attackTechniques: ['T1485', 'T1486'],
  },
  {
    id: 'e3-vpnfilter',
    description:
      'VPNFilter modular IoT botnet infecting 500K+ network devices across 54 countries, with destructive capabilities.',
    source: 'Cisco Talos, FBI',
    credibility: 'High',
    relevance: 'High',
    attackTechniques: ['T1542.005', 'T1090'],
  },
  {
    id: 'e4-indictment',
    description:
      'US DOJ indictment (Oct 2020) naming six GRU officers of Unit 74455 for NotPetya, Olympic Destroyer, and other attacks.',
    source: 'US Department of Justice',
    credibility: 'High',
    relevance: 'High',
  },
  {
    id: 'e5-blackenergy',
    description:
      'Significant code overlap and TTP similarities with BlackEnergy malware used in 2015-2016 Ukraine power grid attacks.',
    source: 'ESET, iSIGHT Partners',
    credibility: 'Medium',
    relevance: 'High',
    attackTechniques: ['T1059', 'T1565'],
  },
  {
    id: 'e6-geopolitical',
    description:
      'Targeting patterns consistently aligned with Russian geopolitical interests: Ukraine, NATO allies, anti-doping agencies, OPCW.',
    source: 'Multiple OSINT, CrowdStrike',
    credibility: 'Medium',
    relevance: 'Medium',
  },
  {
    id: 'e7-falseflags',
    description:
      'Deliberate false flags planted in Olympic Destroyer: code snippets mimicking Lazarus Group (DPRK) and APT3 (China) tooling.',
    source: 'Kaspersky GReAT',
    credibility: 'Low',
    relevance: 'Medium',
    attackTechniques: ['T1036', 'T1027'],
  },
  {
    id: 'e8-commodity',
    description:
      'Use of commodity RATs (e.g., X-Agent variants) and publicly available tools also observed in criminal campaigns.',
    source: 'FireEye, Recorded Future',
    credibility: 'Medium',
    relevance: 'Low',
  },
];

// Pre-filled ratings: evidence.id -> hypothesis.id -> rating
const ratings: Record<string, Record<string, ConsistencyRating>> = {
  'e1-notpetya': {
    'h1-gru': 'C',
    'h2-apt41': 'I',
    'h3-criminal': 'I',
    'h4-unknown': 'N',
  },
  'e2-olympic': {
    'h1-gru': 'C',
    'h2-apt41': 'N',
    'h3-criminal': 'I',
    'h4-unknown': 'N',
  },
  'e3-vpnfilter': {
    'h1-gru': 'C',
    'h2-apt41': 'I',
    'h3-criminal': 'N',
    'h4-unknown': 'N',
  },
  'e4-indictment': {
    'h1-gru': 'C',
    'h2-apt41': 'I',
    'h3-criminal': 'I',
    'h4-unknown': 'I',
  },
  'e5-blackenergy': {
    'h1-gru': 'C',
    'h2-apt41': 'I',
    'h3-criminal': 'I',
    'h4-unknown': 'N',
  },
  'e6-geopolitical': {
    'h1-gru': 'C',
    'h2-apt41': 'N',
    'h3-criminal': 'I',
    'h4-unknown': 'N',
  },
  'e7-falseflags': {
    'h1-gru': 'C',
    'h2-apt41': 'C',
    'h3-criminal': 'I',
    'h4-unknown': 'N',
  },
  'e8-commodity': {
    'h1-gru': 'N',
    'h2-apt41': 'N',
    'h3-criminal': 'C',
    'h4-unknown': 'N',
  },
};

const sampleMatrix: ACHMatrix = {
  id: 'ach-sandworm',
  name: 'Sandworm APT Attribution Analysis',
  hypotheses,
  evidence,
  ratings,
  assumptions: [
    {
      id: 'kac-sandworm-1',
      text: 'Sandworm has not significantly altered its preferred TTPs (KillDisk-class wipers, BlackEnergy lineage tooling) since the 2017 NotPetya campaign.',
      status: 'caveated',
      rationale:
        'Largely consistent with public reporting, but the 2022-2023 wave introduced novel CaddyWiper and Industroyer2 capabilities that suggest active capability development.',
      linkedEvidenceIds: ['e5-blackenergy', 'e1-notpetya'],
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'kac-sandworm-2',
      text: 'Targeting of Ukrainian critical infrastructure is consistent with Russian state strategic interests and unlikely to be a false flag.',
      status: 'supported',
      rationale:
        'Aligns with sustained Russian information-warfare doctrine; targeting profile, language artifacts, and infrastructure overlap with prior GRU-attributed activity.',
      linkedEvidenceIds: ['e3-vpnfilter', 'e6-geopolitical'],
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'kac-sandworm-3',
      text: 'Cobalt Strike beaconing observed alongside Sandworm tooling indicates the same actor rather than a parallel intrusion set.',
      status: 'unassessed',
      rationale: '',
      linkedEvidenceIds: [],
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
  ],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

export const sampleProject: Project = {
  id: 'proj-sandworm',
  name: 'Sandworm / Voodoo Bear — APT Attribution',
  description:
    'Structured analysis of competing hypotheses for attribution of the Sandworm threat actor cluster, responsible for NotPetya, Olympic Destroyer, VPNFilter, and attacks on Ukrainian critical infrastructure.',
  achMatrices: [sampleMatrix],
  biasChecklists: [],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};
