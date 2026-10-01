import { CURRENT_SCHEMA_VERSION } from '../types';

/** Version 1 only adds optional provenance. Never normalize a user's stored analysis. */
export function migrateProjectState(state: unknown, version: number): unknown {
  if (version !== 0 && version !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported project schema version ${version}. Expected 0 or ${CURRENT_SCHEMA_VERSION}.`);
  }
  return state;
}
