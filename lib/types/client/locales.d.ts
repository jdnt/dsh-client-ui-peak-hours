/**
 * Peak-hours copy: zh-first dictionaries with an English fallback, selected
 * by the document language. Kept dependency-free (no dsh locale service) so
 * the DOM-injected entry row reads one tiny lookup, matching the task-board /
 * ssh precedent.
 */
/** zh dictionary (key-set source of truth). */
export declare const zh: {
    'entry.peak': string;
    'entry.offpeak': string;
    'entry.countdownToPeak': string;
    'entry.countdownToEnd': string;
    'entry.aria': string;
    'settings.title': string;
    'settings.description': string;
    'settings.enabled': string;
    'settings.enabledHint': string;
    'settings.timezone': string;
    'settings.timezoneHint': string;
    'settings.inherit': string;
    'settings.on': string;
    'settings.off': string;
    'settings.overridden': string;
    'settings.reset': string;
    'settings.notExposed': string;
    'settings.readOnly': string;
    'settings.expand': string;
    'settings.collapse': string;
    'settings.save': string;
    'settings.saving': string;
    'settings.discard': string;
    'settings.unsaved': string;
    'settings.saveFailed': string;
    'settings.invalidNumber': string;
};
/** en dictionary, complete against the zh key set. */
export declare const en: Record<keyof typeof zh, string>;
/** The dictionary key union. */
export type PeakHoursKey = keyof typeof zh;
/** Active dictionary, picked by the document language at call time. */
export declare function dictionary(): Record<PeakHoursKey, string>;
/** Translate a key with optional {name} template params. */
export declare function t(key: PeakHoursKey, params?: Record<string, string>): string;
//# sourceMappingURL=locales.d.ts.map