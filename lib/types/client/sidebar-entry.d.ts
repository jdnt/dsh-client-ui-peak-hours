/**
 * Sidebar entry injection for the peak-hours status.
 *
 * dsh's sidebar shell exposes no slot an external plugin can register into
 * (`sidebar.workspaces` / `sidebar.settings` are single-occupant and already
 * taken), so — following the task-board / ssh precedent of DOM-level
 * extension — the status row is injected between the shell's New Session
 * button and the workspace browser. The injection self-heals: a
 * MutationObserver watches the sidebar root and re-inserts the row whenever a
 * React re-render displaces it (same frame, before paint, so no flicker).
 *
 * The row is plain DOM (no React tree) so it can never disturb the shell's
 * reconciliation; a one-second interval only rewrites the row's own text and
 * state attribute.
 */
/** Stable data attribute identifying the injected status row. */
export declare const ENTRY_SELECTOR = "[data-dsh-peakhours-entry]";
/** The row's live facts; read fresh each tick (timezone may change in settings). */
export interface PeakHoursEntrySource {
    /** The configured IANA timezone, or undefined for the default. */
    getTimeZone: () => string | undefined;
}
/**
 * Mount the sidebar status row, waiting for the shell to render, self-healing
 * on later React re-renders, and refreshing the clock every second.
 * @param source - the live timezone source.
 * @returns disposer removing the entry, observers, and interval.
 */
export declare function mountSidebarEntry(source: PeakHoursEntrySource): () => void;
//# sourceMappingURL=sidebar-entry.d.ts.map