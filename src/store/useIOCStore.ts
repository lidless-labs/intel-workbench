import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRENT_SCHEMA_VERSION } from '../types';
import { migrateIOCState } from './migrations';

export type IOCType = 'ipv4' | 'ipv6' | 'domain' | 'url' | 'email' | 'md5' | 'sha1' | 'sha256' | 'cve';

export interface ExtractedIOC {
  value: string;
  type: IOCType;
  selected: boolean;
}

interface IOCStore {
  rawInput: string;
  iocs: ExtractedIOC[];
  defanged: boolean;
  duplicatesRemoved: number;

  setRawInput: (input: string) => void;
  extract: () => void;
  toggleDefang: () => void;
  toggleSelect: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clear: () => void;
}

const IOC_TYPE_LABELS: Record<IOCType, string> = {
  ipv4: 'IPv4',
  ipv6: 'IPv6',
  domain: 'Domain',
  url: 'URL',
  email: 'Email',
  md5: 'MD5',
  sha1: 'SHA1',
  sha256: 'SHA256',
  cve: 'CVE',
};

export function getIOCTypeLabel(type: IOCType): string {
  return IOC_TYPE_LABELS[type];
}

// Refang a defanged IOC value
function refang(value: string): string {
  return value
    .replace(/\[\.\]/g, '.')
    .replace(/hxxp/gi, 'http')
    .replace(/\[:\]/g, ':')
    .replace(/\[at\]/gi, '@')
    .replace(/\[\/\]/g, '/');
}

// Defang a clean IOC value
function defangValue(value: string, type: IOCType): string {
  switch (type) {
    case 'ipv4':
    case 'domain':
      return value.replace(/\./g, '[.]');
    case 'url':
      return value.replace(/http/gi, 'hxxp').replace(/:\/\//g, '[://]');
    case 'email':
      return value.replace(/@/g, '[at]').replace(/\./g, '[.]');
    default:
      return value;
  }
}

export function formatIOC(value: string, type: IOCType, isDefanged: boolean): string {
  // Always work from the refanged (clean) version
  const clean = refang(value);
  return isDefanged ? defangValue(clean, type) : clean;
}

// Extraction patterns
const PATTERNS: { type: IOCType; regex: RegExp }[] = [
  // URLs first (before domain/IP extraction can grab partial matches)
  {
    type: 'url',
    regex: /(?:hxxps?|https?):?(?:\[:\]|:)\/\/(?:\[\/\]|\/)?[^\s<>"']+/gi,
  },
  // Email
  {
    type: 'email',
    regex: /[a-zA-Z0-9._%+\-]+(?:@|\[at\])[a-zA-Z0-9.\-]+(?:\[\.\]|\.)[a-zA-Z]{2,}/gi,
  },
  // CVE
  {
    type: 'cve',
    regex: /CVE-\d{4}-\d{4,}/gi,
  },
  // SHA256 (64 hex, before shorter hashes)
  {
    type: 'sha256',
    regex: /\b[a-fA-F0-9]{64}\b/g,
  },
  // SHA1 (40 hex)
  {
    type: 'sha1',
    regex: /\b[a-fA-F0-9]{40}\b/g,
  },
  // MD5 (32 hex)
  {
    type: 'md5',
    regex: /\b[a-fA-F0-9]{32}\b/g,
  },
  // IPv6
  {
    type: 'ipv6',
    regex: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::(?:[fF]{4}:)?(?:\d{1,3}\.){3}\d{1,3}/g,
  },
  // IPv4 (including defanged)
  {
    type: 'ipv4',
    regex: /\b\d{1,3}(?:\[\.\]|\.)\d{1,3}(?:\[\.\]|\.)\d{1,3}(?:\[\.\]|\.)\d{1,3}\b/g,
  },
  // Domains (including defanged)
  {
    type: 'domain',
    regex: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\[\.\]|\.))+(?:com|net|org|edu|gov|mil|io|co|info|biz|me|tv|cc|ru|cn|de|uk|fr|br|in|jp|au|ca|nl|se|ch|es|it|pl|za|kr|tw|xyz|top|club|online|site|tech|space|pro|app|dev)\b/gi,
  },
];

function extractIOCs(input: string): { iocs: ExtractedIOC[]; duplicatesRemoved: number } {
  const seen = new Set<string>();
  const results: ExtractedIOC[] = [];
  let duplicates = 0;

  // Track which character positions have been claimed by earlier patterns
  const claimed = new Set<number>();

  for (const { type, regex } of PATTERNS) {
    // Reset regex state
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      // Skip if any character in this match was claimed by an earlier pattern
      const start = match.index;
      const end = start + match[0].length;
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (claimed.has(i)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const raw = match[0];
      const normalized = refang(raw).toLowerCase();

      if (seen.has(`${type}:${normalized}`)) {
        duplicates++;
        continue;
      }
      seen.add(`${type}:${normalized}`);

      // Claim these positions
      for (let i = start; i < end; i++) {
        claimed.add(i);
      }

      results.push({ value: raw, type, selected: false });
    }
  }

  return { iocs: results, duplicatesRemoved: duplicates };
}

export const useIOCStore = create<IOCStore>()(
  persist(
    (set, get) => ({
      rawInput: '',
      iocs: [],
      defanged: false,
      duplicatesRemoved: 0,

      setRawInput: (input: string) => {
        set({ rawInput: input });
      },

      extract: () => {
        const { rawInput } = get();
        const { iocs, duplicatesRemoved } = extractIOCs(rawInput);
        set({ iocs, duplicatesRemoved });
      },

      toggleDefang: () => {
        set((state) => ({ defanged: !state.defanged }));
      },

      toggleSelect: (index: number) => {
        set((state) => ({
          iocs: state.iocs.map((ioc, i) =>
            i === index ? { ...ioc, selected: !ioc.selected } : ioc
          ),
        }));
      },

      selectAll: () => {
        set((state) => ({
          iocs: state.iocs.map((ioc) => ({ ...ioc, selected: true })),
        }));
      },

      deselectAll: () => {
        set((state) => ({
          iocs: state.iocs.map((ioc) => ({ ...ioc, selected: false })),
        }));
      },

      clear: () => {
        set({ rawInput: '', iocs: [], duplicatesRemoved: 0 });
      },
    }),
    {
      name: 'intel-workbench-ioc',
      version: CURRENT_SCHEMA_VERSION,
      migrate: (persistedState, version) => migrateIOCState(persistedState, version) as IOCStore,
    }
  )
);
