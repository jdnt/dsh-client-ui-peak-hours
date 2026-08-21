/**
 * Cross-module-instance apply guard for the peak-hours client bundle.
 *
 * The client factory can run more than once in a single page lifetime (for
 * example when a stale bundle is mixed with a rebuilt one while `dsh web` is
 * restarted). Without a guard, every factory run mounts its own sidebar
 * status row, so the shell ends up showing two entries.
 *
 * The flag lives on globalThis so separate module instances (independent
 * factory runs) still share one guard. First claim wins; later claims become
 * no-ops until the claim is released (fiber unload / hot-reload) or the page
 * reloads.
 */
declare global {
    var __dshPeakHoursApplied: boolean | undefined;
}
/** Claims the plugin apply slot. Returns true when this call won the slot. */
export declare function claimPeakHoursApply(): boolean;
/**
 * Releases the claim. Called from the client fiber cleanup so that a
 * hot-reloaded bundle can claim again instead of being silently dropped.
 */
export declare function releasePeakHoursApply(): void;
//# sourceMappingURL=apply-guard.d.ts.map