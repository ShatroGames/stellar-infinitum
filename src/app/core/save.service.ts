import { Injectable, inject, signal } from '@angular/core';
import { SaveManagerService } from '../services/save-manager.service';

const SAVE_KEY = 'stellarInfinitum_v2';
const SAVE_VERSION = 2;
const LEGACY_ARCHIVE_KEY = 'stellarInfinitum_legacy_archive';

/** localStorage keys used by the game before the rebuild */
const LEGACY_KEYS = [
  'treefinite_save', 'treefinite_skills', 'treefinite_prestige', 'treefinite_achievements',
  'treefinite_dimensions', 'ascensionTree', 'stellarInfinitum_dimensions', 'stellarInfinitum_quantum',
  'stellarInfinitum_tutorials', 'stellarInfinitum_artifacts', 'stellarInfinitum_eternal',
  'stellarInfinitum_importedSave', 'probabilityForgeState', 'probabilityOutcomes', 'fateWeights',
];

interface SaveFile {
  version: number;
  savedAt: number;
  sections: Record<string, unknown>;
}

/**
 * The single, versioned save. Services register a named section and read it back
 * on start; everything is written together as one JSON document.
 */
@Injectable({ providedIn: 'root' })
export class SaveService {
  private saveManager = inject(SaveManagerService);
  private sections = new Map<string, () => unknown>();
  private loaded: SaveFile | null = null;
  private suspended = false;

  /** Time the loaded save was written (ms), or null for a new game */
  readonly savedAt: number | null;
  /** True when an old (pre-rebuild) save was archived and the player has not dismissed the notice */
  readonly legacyNotice = signal(false);

  constructor() {
    this.archiveLegacySave();
    this.loaded = this.readFile();
    this.savedAt = this.loaded?.savedAt ?? null;
    this.legacyNotice.set(!!this.read<boolean>('legacyNoticePending'));
    // Always write the latest state when the page closes
    window.addEventListener('beforeunload', () => this.writeNow());
  }

  /** Data stored for a section in the loaded save */
  read<T>(section: string): T | undefined {
    return this.loaded?.sections[section] as T | undefined;
  }

  /** Register a section; its serializer is called on every save */
  register(section: string, serialize: () => unknown): void {
    this.sections.set(section, serialize);
  }

  /** Schedule a (throttled) save */
  save(): void {
    this.saveManager.scheduleSave(SAVE_KEY, () => this.writeNow());
  }

  /** Write immediately, e.g. before export */
  flush(): void {
    this.save();
    this.saveManager.flushAll();
  }

  writeNow(): void {
    if (this.suspended) return;
    const file: SaveFile = { version: SAVE_VERSION, savedAt: Date.now(), sections: {} };
    this.sections.forEach((serialize, name) => (file.sections[name] = serialize()));
    file.sections['legacyNoticePending'] = this.legacyNotice();
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  }

  dismissLegacyNotice(): void {
    this.legacyNotice.set(false);
    this.save();
  }

  // --- export / import / reset ----------------------------------------------

  exportString(): string {
    this.flush();
    return encode(localStorage.getItem(SAVE_KEY) ?? '');
  }

  /** Replace the save with an exported string; the caller reloads the page */
  importString(text: string): void {
    const file = JSON.parse(decode(text.trim())) as SaveFile;
    if (!file || typeof file !== 'object' || file.version !== SAVE_VERSION || !file.sections) {
      throw new Error('Not a save from this version of the game');
    }
    this.suspend();
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  }

  /** Delete the save; the caller reloads the page */
  wipe(): void {
    this.suspend();
    localStorage.removeItem(SAVE_KEY);
  }

  /** The archived pre-rebuild save, encoded for export (or null) */
  legacyArchiveString(): string | null {
    const archive = localStorage.getItem(LEGACY_ARCHIVE_KEY);
    return archive ? encode(archive) : null;
  }

  // --- internals --------------------------------------------------------------

  /** Stop all saving until the page reloads (before import/reset) */
  private suspend(): void {
    this.suspended = true;
    this.saveManager.suspend();
  }

  private readFile(): SaveFile | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const file = JSON.parse(raw) as SaveFile;
      return file.version === SAVE_VERSION ? file : null;
    } catch (e) {
      console.error('Failed to read save:', e);
      return null;
    }
  }

  /** Move pre-rebuild saves into one archive entry and start fresh (design decision) */
  private archiveLegacySave(): void {
    if (localStorage.getItem(SAVE_KEY)) return;
    const archive: Record<string, string> = {};
    for (const key of LEGACY_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) archive[key] = value;
    }
    if (Object.keys(archive).length === 0) return;
    localStorage.setItem(LEGACY_ARCHIVE_KEY, JSON.stringify({ archivedAt: Date.now(), data: archive }));
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    const file: SaveFile = { version: SAVE_VERSION, savedAt: Date.now(), sections: { legacyNoticePending: true } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  }
}

function encode(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

function decode(text: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
}
