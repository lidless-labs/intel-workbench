# Evidence-record producer fixtures

These sanitized JSON files retain the actual producer bytes supplied for the
2026-10-01 importer integration. They contain example identifiers, mock actors,
and documentation IP addresses.

- Hotwash manual and Wazuh fixtures came from its execution API exporter:
  `GET /api/executions/{id}/export?format=evidence-record`.
  Source: [lidless-labs/hotwash issue 15](https://github.com/lidless-labs/hotwash/issues/15),
  exporter regression tests in `api/tests/test_evidence_record.py`.
- Vervet fixture came from its case API exporter:
  `POST /api/v1/cases/{id}/export?format=evidence-record`.
  Source: [lidless-labs/vervet issue 21](https://github.com/lidless-labs/vervet/issues/21),
  `tests/fixtures/evidence-record/vervet-export.json` and `tests/test_evidence_record.py`.
- `hotwash-invalid.json` is the authoritative contract's invalid mutation corpus
  from `api/tests/fixtures/evidence-record/invalid.json` in Hotwash.

The finalized Hotwash schema at `docs/schemas/evidence-record-v1.schema.json`
and Vervet's vendored schema at
`tests/fixtures/evidence-record/evidence-record-v1.schema.json` have identical
SHA-256: `1c4c2aba7e3c07da6f120523441cd7718b5dd74d2a353794b0b8ad9bc94f61f1`.

| Fixture | SHA-256 |
| --- | --- |
| `hotwash-manual-export.json` | `16e9463d14994a26e5254ae350e35026bc4d14198a739a0af70de3c3a37d8bbe` |
| `hotwash-wazuh-export.json` | `76ca987637ab05e1baa8b8e6231646a6d9daa2268cf2a38b6e79d2ccad18c878` |
| `vervet-export.json` | `56eeae2294a90b800730d264e8403107b56874abd684da7ac40b8d934707a9c9` |
| `hotwash-invalid.json` | `666344b7c28173e9aa8344a89912b638a472c4c17964b18fb0e7bc862c9ff204` |

The parser tests use both actual exporters and the invalid mutation corpus.
Additional tests mutate copies of these records to exercise bounds and optional
provenance. No references in a record cause requests.

Workbench sets imported credibility and relevance to its existing Medium
defaults. Analysts must review these defaults because they are not producer
judgments. Original records, including additive nested fields, survive native
project export and reimport. The 4 MiB input cap applies to evidence envelopes.
Accumulated native project backups can exceed this size and retain their existing
import route.
