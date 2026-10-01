import { describe, it, expect } from 'vitest';
import invalid from './fixtures/evidence-record/hotwash-invalid.json';
import manual from './fixtures/evidence-record/hotwash-manual-export.json';
import vervet from './fixtures/evidence-record/vervet-export.json';
import wazuh from './fixtures/evidence-record/hotwash-wazuh-export.json';
import { parseEvidenceEnvelope, validateEvidenceRecord, MAX_IMPORT_BYTES, hasExplicitFormat } from '../evidenceRecord';

const parse = (value: unknown) => parseEvidenceEnvelope(JSON.stringify(value));
const copy = () => structuredClone(manual) as any;

describe('evidence-record v1 contract', () => {
  it.each([manual, wazuh, vervet])('accepts actual producer API output', (fixture) => {
    expect(parse(fixture)).toEqual(fixture);
  });
  it.each(['other', null, 1])('rejects explicit format %s', (format) => {
    expect(() => parse({ ...manual, format })).toThrow(/format/i);
  });
  it.each(['2', 1, null])('rejects version %s', (format_version) => {
    expect(() => parse({ ...manual, format_version })).toThrow(/version/i);
  });
  it.each(['generator', 'exported_at', 'subject', 'records', 'closeout'])('requires %s', (key) => {
    const f = copy(); delete f[key];
    expect(() => parse(f)).toThrow();
  });
  it.each([
    (f: any) => { f.generator.version = ''; },
    (f: any) => { f.subject.kind = 'incident'; },
    (f: any) => { f.subject.title = ''; },
    (f: any) => { delete f.records[0].source.ref; },
    (f: any) => { f.records[0].source.raw = []; },
    (f: any) => { f.records[0].decision = {}; },
    (f: any) => { f.records[1].decision.verdict = 'Yes'; },
    (f: any) => { f.closeout.status = 'resolved'; },
    (f: any) => { f.closeout.resolution = 'malicious'; },
    (f: any) => { f.closeout.impact = 'High'; },
    (f: any) => { f.records[0].enrichment = [{ kind: 'other', provider: 'x', value: null, at: null }]; },
  ])('rejects malformed required fields and vocabulary', (mutate) => {
    const f = copy(); mutate(f); expect(() => parse(f)).toThrow();
  });
  it.each(['2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z', '2026-10-01', '2026-10-01T00:00:00', '2026-10-01T24:00:00Z', '2026-10-01T00:00:00+24:00'])('rejects invalid time %s', (exported_at) => {
    expect(() => parse({ ...manual, exported_at })).toThrow(/exported_at/);
  });
  it.each(invalid)('rejects authoritative producer invalid mutation: $name', (mutation) => {
    const fixture = copy();
    let target = fixture;
    for (const key of mutation.path.slice(0, -1)) target = target[key];
    const key = mutation.path[mutation.path.length - 1];
    if (mutation.delete) delete target[key]; else target[key] = mutation.value;
    expect(() => parse(fixture)).toThrow();
  });
  it.each(['2016-12-31T23:59:60Z', '2017-01-01T00:59:60+01:00', '2026-09-29T12:00:00+23:59', '2024-02-29t12:00:00z'])('accepts valid producer timestamp %s', (exported_at) => {
    expect(parse({ ...manual, exported_at }).exported_at).toBe(exported_at);
  });
  it('routes top-level format keys including escapes without treating nested fields or strings as formats', () => {
    expect(hasExplicitFormat('{"\\u0066ormat":"evidence-record"}')).toBe(true);
    expect(hasExplicitFormat('{"description":"format: [ { \\" }", "extra":{"format":"other"}}')).toBe(false);
    expect(hasExplicitFormat(JSON.stringify({ ...manual, format: null }))).toBe(true);
    expect(hasExplicitFormat('[{"format":"evidence-record"}]')).toBe(false);
  });
  it('accepts nullable facts, empty records, and empty rationale', () => {
    const f = copy(); f.generator.version = null;
    f.records[1].decision.rationale = ''; f.records[1].decision.at = null;
    expect(parse(f)).toEqual(f);
    expect(parse({ ...f, records: [] }).records).toEqual([]);
  });
  it('preserves additive nested fields with opaque references', () => {
    const f = copy(); f.records[0].extra = { a: [{ b: ['stored'] }] };
    f.records[0].source.ref = 'https://example.invalid/never-fetch';
    expect(parse(f)).toEqual(f);
    expect(validateEvidenceRecord(f.records[0])).toEqual(f.records[0]);
  });
  it('validates the agreed ATT&CK value.technique_ids extension', () => {
    const f = copy();
    f.records[0].enrichment = [{ kind: 'attack', provider: 'test', value: { technique_ids: ['T1059', 'T1059.001'], extra: true }, at: null }];
    expect(parse(f)).toEqual(f);
    for (const ids of [['t1059'], ['T1'], ['T1059', 'T1059'], [1]]) {
      f.records[0].enrichment[0].value.technique_ids = ids;
      expect(() => parse(f)).toThrow(/technique_ids/);
    }
    f.records[0].enrichment[0].value = 'T1059';
    expect(() => parse(f)).toThrow();
  });
  it('enforces record, annotation, text, key, property, number, array and depth bounds', () => {
    const bad = [
      { ...manual, records: Array(10001).fill(manual.records[0]) },
      { ...manual, subject: { ...manual.subject, title: 'x'.repeat(1025) } },
      { ...manual, extra: { ['x'.repeat(129)]: 1 } },
      { ...manual, extra: Object.fromEntries(Array.from({ length: 65 }, (_, n) => [n, null])) },
      { ...manual, extra: Array(65).fill(null) },
      { ...manual, extra: 'x'.repeat(8193) },
      { ...manual, extra: 1.1e308 },
      { ...manual, extra: { a: { b: { c: { d: [] } } } } },
      { ...manual, records: [{ ...manual.records[0], enrichment: Array(65).fill({ kind: 'ti', provider: 'x', value: null, at: null }) }] },
    ];
    for (const f of bad) expect(() => parse(f)).toThrow();
    const valid = { ...manual, extra: { a: { b: { c: null } } } };
    expect(parse(valid)).toEqual(valid);
  });
  it('bounds UTF-8 input and structural nesting before parsing', () => {
    expect(() => parseEvidenceEnvelope(' '.repeat(MAX_IMPORT_BYTES + 1))).toThrow(/size|MiB/);
    expect(() => parseEvidenceEnvelope('"' + '😀'.repeat(MAX_IMPORT_BYTES / 3) + '"')).toThrow(/size|MiB/);
    expect(() => parseEvidenceEnvelope('['.repeat(20000))).toThrow(/nest/i);
    expect(() => parseEvidenceEnvelope('{broken')).toThrow(/JSON/);
  });
});
