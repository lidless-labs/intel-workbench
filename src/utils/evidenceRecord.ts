/** Contract-specific evidence-record v1 validation. References remain opaque data. */
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type ObjectValue = Record<string, unknown>;

export interface EvidenceRecord {
  [key: string]: unknown;
  id: string;
  source: { [key: string]: unknown; tool: string; observed_at: string | null; ref: string | null; raw: { [key: string]: Json } | null };
  enrichment: { [key: string]: unknown; kind: 'attack' | 'ti' | 'score'; provider: string; value: Json; at: string | null }[];
  decision: { [key: string]: unknown; verdict: 'benign' | 'suspicious' | 'malicious' | 'false-positive' | 'unknown'; rationale: string | null; by: string | null; at: string | null } | null;
}
export interface EvidenceEnvelope {
  [key: string]: unknown;
  format: 'evidence-record';
  format_version: '1';
  generator: { name: string; version: string | null };
  exported_at: string;
  subject: { kind: 'case' | 'run' | 'project'; id: string; title: string };
  records: EvidenceRecord[];
  closeout: { status: 'open' | 'closed'; resolution: string | null; impact: string | null; summary: string | null; closed_at: string | null; closed_by: string | null };
}

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}
function isObject(value: unknown): value is ObjectValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
// JSON Schema string lengths count Unicode code points, not UTF-16 code units.
function length(value: string): number { return Array.from(value).length; }
function text(value: unknown, path: string, nullable = false, max = 1024, min = 1): void {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || length(value) < min || length(value) > max) {
    fail(path, `expected ${nullable ? 'null or ' : ''}text of ${min}-${max} characters`);
  }
}
function vocabulary(value: unknown, choices: readonly unknown[], path: string): void {
  if (!choices.includes(value)) fail(path, 'invalid vocabulary');
}
function object(value: unknown, path: string): ObjectValue {
  if (!isObject(value)) fail(path, 'expected an object');
  const keys = Object.keys(value);
  if (keys.length > 64 || keys.some(key => length(key) > 128)) fail(path, 'object property bounds exceeded');
  return value;
}
function array(value: unknown, path: string, max = 64): unknown[] {
  if (!Array.isArray(value) || value.length > max) fail(path, `expected an array with at most ${max} items`);
  return value;
}
// Each raw/value/extension starts its own four-container budget from the schema.
function jsonValue(value: unknown, path: string, containers = 4): void {
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') { text(value, path, false, 8192, 0); return; }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Math.abs(value) > 1e308) fail(path, 'number out of bounds');
    return;
  }
  if (containers === 0) fail(path, 'JSON nesting bounds exceeded');
  if (Array.isArray(value)) {
    array(value, path).forEach((entry, i) => jsonValue(entry, `${path}[${i}]`, containers - 1));
  } else {
    for (const [key, entry] of Object.entries(object(value, path))) jsonValue(entry, `${path}.${key}`, containers - 1);
  }
}
function fields(value: unknown, path: string, required: readonly string[]): ObjectValue {
  const obj = object(value, path);
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(obj, key)) fail(`${path}.${key}`, 'required field missing');
  for (const key of Object.keys(obj)) if (!required.includes(key)) jsonValue(obj[key], `${path}.${key}`);
  return obj;
}
function time(value: unknown, path: string, nullable = false): void {
  if (nullable && value === null) return;
  text(value, path, false, 64);
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt]([01]\d|2[0-3]):([0-5]\d):([0-5]\d|60)(?:\.\d+)?(?:[Zz]|[+-]([01]\d|2[0-3]):([0-5]\d))$/.exec(value as string);
  if (!match) fail(path, 'expected RFC3339 timestamp with offset');
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) fail(path, 'invalid calendar timestamp');
  // Match the producers' UTC leap-second check, including offset timestamps.
  const leapSecond = match[6] === '60';
  const normalized = (value as string).toUpperCase();
  const utc = new Date(leapSecond ? `${normalized.slice(0, 17)}59${normalized.slice(19)}` : normalized);
  if (!Number.isFinite(utc.getTime()) || utc.getUTCFullYear() < 1 || utc.getUTCFullYear() > 9999) fail(path, 'invalid timestamp');
  if (leapSecond && !(utc.getUTCHours() === 23 && utc.getUTCMinutes() === 59 &&
    ((utc.getUTCMonth() === 5 && utc.getUTCDate() === 30) || (utc.getUTCMonth() === 11 && utc.getUTCDate() === 31)))) {
    fail(path, 'invalid leap-second timestamp');
  }
}

export function validateEvidenceRecord(value: unknown, path = 'originalRecord'): EvidenceRecord {
  const r = fields(value, path, ['id', 'source', 'enrichment', 'decision']);
  text(r.id, `${path}.id`);
  const s = fields(r.source, `${path}.source`, ['tool', 'observed_at', 'ref', 'raw']);
  text(s.tool, `${path}.source.tool`);
  text(s.ref, `${path}.source.ref`, true);
  time(s.observed_at, `${path}.source.observed_at`, true);
  if (s.raw !== null) { object(s.raw, `${path}.source.raw`); jsonValue(s.raw, `${path}.source.raw`); }
  array(r.enrichment, `${path}.enrichment`).forEach((value, i) => {
    const ep = `${path}.enrichment[${i}]`;
    const e = fields(value, ep, ['kind', 'provider', 'value', 'at']);
    vocabulary(e.kind, ['attack', 'ti', 'score'], `${ep}.kind`);
    text(e.provider, `${ep}.provider`); time(e.at, `${ep}.at`, true);
    jsonValue(e.value, `${ep}.value`);
    if (e.kind === 'attack' && e.value !== null) {
      const attack = object(e.value, `${ep}.value`);
      if (Object.prototype.hasOwnProperty.call(attack, 'technique_ids')) {
        const ids = array(attack.technique_ids, `${ep}.value.technique_ids`);
        if (ids.some(id => typeof id !== 'string' || !/^T\d{4}(?:\.\d{3})?$/.test(id)) || new Set(ids).size !== ids.length) {
          fail(`${ep}.value.technique_ids`, 'expected unique ATT&CK technique IDs');
        }
      }
    }
  });
  if (r.decision !== null) {
    const dp = `${path}.decision`;
    const d = fields(r.decision, dp, ['verdict', 'rationale', 'by', 'at']);
    vocabulary(d.verdict, ['benign', 'suspicious', 'malicious', 'false-positive', 'unknown'], `${dp}.verdict`);
    text(d.rationale, `${dp}.rationale`, true, 8192, 0);
    text(d.by, `${dp}.by`, true); time(d.at, `${dp}.at`, true);
  }
  // Return the entire validated object so additive v1 fields survive native roundtrips.
  return r as unknown as EvidenceRecord;
}

/** Find an explicit top-level format before parsing. Native backups have no byte cap. */
export function hasExplicitFormat(input: string): boolean {
  let depth = 0, quoted = false, escaped = false, start = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') {
        quoted = false;
        if (depth === 1 && i - start <= 768) {
          let next = i + 1;
          while (/\s/.test(input[next] ?? '') && next < input.length) next++;
          if (input[next] === ':') {
            try { if (JSON.parse(input.slice(start, i + 1)) === 'format') return true; }
            catch { /* Invalid keys are rejected by the selected parser. */ }
          }
        }
      }
    } else if (char === '"') { quoted = true; start = i; }
    else if (char === '{' || char === '[') depth++;
    else if (char === '}' || char === ']') depth--;
  }
  return false;
}

/** Byte and depth limits apply before JSON.parse, including pasted JSON. */
export function parseImportJSON(input: string): unknown {
  if (input.length > MAX_IMPORT_BYTES || new TextEncoder().encode(input).byteLength > MAX_IMPORT_BYTES) {
    fail('Input', 'size exceeds 4 MiB of UTF-8 JSON');
  }
  let depth = 0, quoted = false, escaped = false;
  for (const char of input) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') {
      if (++depth > 16) fail('Input', 'JSON nesting bounds exceeded');
    } else if (char === '}' || char === ']') depth--;
  }
  try { return JSON.parse(input); }
  catch { return fail('Input', 'JSON parse failure: invalid JSON'); }
}

export function parseEvidenceEnvelope(input: string): EvidenceEnvelope {
  const value = parseImportJSON(input);
  const e = object(value, 'Envelope');
  if (e.format !== 'evidence-record') fail('format', 'unknown explicit format, expected evidence-record');
  if (e.format_version !== '1') fail('format_version', 'unsupported version, expected string "1"');
  fields(e, 'Envelope', ['format', 'format_version', 'generator', 'exported_at', 'subject', 'records', 'closeout']);
  const g = fields(e.generator, 'generator', ['name', 'version']);
  text(g.name, 'generator.name'); text(g.version, 'generator.version', true);
  time(e.exported_at, 'exported_at');
  const s = fields(e.subject, 'subject', ['kind', 'id', 'title']);
  vocabulary(s.kind, ['case', 'run', 'project'], 'subject.kind');
  text(s.id, 'subject.id'); text(s.title, 'subject.title');
  array(e.records, 'records', 10000).forEach((r, i) => validateEvidenceRecord(r, `records[${i}]`));
  const c = fields(e.closeout, 'closeout', ['status', 'resolution', 'impact', 'summary', 'closed_at', 'closed_by']);
  vocabulary(c.status, ['open', 'closed'], 'closeout.status');
  vocabulary(c.resolution, ['TruePositive', 'FalsePositive', 'Indeterminate', 'Duplicated', 'Other', null], 'closeout.resolution');
  vocabulary(c.impact, ['NoImpact', 'WithImpact', 'NotApplicable', null], 'closeout.impact');
  text(c.summary, 'closeout.summary', true, 8192, 0);
  text(c.closed_by, 'closeout.closed_by', true); time(c.closed_at, 'closeout.closed_at', true);
  return e as unknown as EvidenceEnvelope;
}

export function recordTechniqueIds(record: EvidenceRecord): string[] | undefined {
  const ids = new Set<string>();
  for (const e of record.enrichment) {
    if (e.kind === 'attack' && isObject(e.value) && Array.isArray(e.value.technique_ids)) {
      for (const id of e.value.technique_ids) ids.add(id as string);
    }
  }
  return ids.size ? [...ids] : undefined;
}
