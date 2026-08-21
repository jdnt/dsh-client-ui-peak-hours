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
import { classifyPeak, formatCountdown, resolveTimeZone } from "./time.js";
import { t } from "./locales.js";
import css from './peak-hours.module.css';
/** Stable data attribute identifying the injected status row. */
export const ENTRY_SELECTOR = '[data-dsh-peakhours-entry]';
/** Inline clock icon (matches the shell's 16px nav-icon look). */
const ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></svg>';
/** Find the sidebar shell root element, or undefined while not yet mounted. */
function sidebarRoot() {
    const column = document.querySelector('[data-pane="sidebar"], [class*="sidebarCol"]');
    if (column === null)
        return undefined;
    // Current shells wrap the sidebar UI: column > wrapper > root(logoRow owner).
    // Prefer the element that owns the logo row — the real sidebar UI root —
    // and fall back to the column's first child for legacy shells.
    const logoOwner = column.querySelector('[class*="logoRow"]')?.parentElement;
    return logoOwner ?? column.firstElementChild;
}
/** The New Session button: nested in the logo row on current shells, a direct child on legacy shells. */
function newSessionButton(root) {
    const nested = root.querySelector('button[class*="newSession"]');
    if (nested !== null)
        return nested;
    for (const child of root.children) {
        if (child.tagName === 'BUTTON')
            return child;
    }
    return undefined;
}
/** Build the status row (a detached div; insert once the shell is up). */
function createEntry() {
    const entry = document.createElement('div');
    entry.dataset.dshPeakhoursEntry = '';
    entry.className = css.entry;
    entry.setAttribute('role', 'status');
    entry.setAttribute('aria-label', t('entry.aria'));
    const icon = document.createElement('span');
    icon.className = css.icon;
    icon.innerHTML = ICON;
    const body = document.createElement('span');
    body.className = css.body;
    const label = document.createElement('span');
    label.className = css.label;
    const countdown = document.createElement('span');
    countdown.className = css.countdown;
    body.append(label, countdown);
    entry.append(icon, body);
    return { entry, label, countdown };
}
/** Re-insert the status row after the New Session row (before the entry family + browser region). */
function placeEntry(root, entry) {
    const button = newSessionButton(root);
    if (button === undefined)
        return false;
    if (entry.parentElement !== root) {
        // Position relative to the family block (entries injected by sibling
        // plugins), never relative to transient logoRow geometry: every family
        // plugin that self-heals during a re-render then lands in the same
        // relative order, so the entries cannot swap positions regardless of
        // observer callback order or of shell wrapper changes.
        //
        // Peak-hours is the passive status strip, so it sits FIRST — right after
        // New Session. NOTE: for the order to survive concurrent re-inserts,
        // dsh-ssh and dsh-client-ui-task-board must add [data-dsh-peakhours-entry]
        // to their own family selectors (see README "Integration with the entry
        // family"); until then peak-hours still renders correctly, but a
        // simultaneous teardown can leave it after the task-board/ssh block.
        const row = button.closest('[class*="logoRow"]');
        const base = (row !== null && row.parentElement === root) ? row : button;
        const family = Array.from(root.children).filter((el) => el instanceof HTMLElement && el.matches('[data-dsh-peakhours-entry], [data-dsh-taskboard-entry], [data-dsh-ssh-entry]'));
        const anchor = family.length > 0 ? family[0] : base.nextElementSibling;
        root.insertBefore(entry, anchor);
    }
    return true;
}
/**
 * Mount the sidebar status row, waiting for the shell to render, self-healing
 * on later React re-renders, and refreshing the clock every second.
 * @param source - the live timezone source.
 * @returns disposer removing the entry, observers, and interval.
 */
export function mountSidebarEntry(source) {
    // DOM-level idempotency: whatever path mounted a row before this call (a
    // duplicated apply, an HMR re-injection, a stale module still alive), never
    // mount a second one. A full page reload is the ultimate reset.
    if (typeof document !== 'undefined' && document.querySelector(ENTRY_SELECTOR) !== null) {
        return () => { };
    }
    const { entry, label, countdown } = createEntry();
    let root;
    let placed = false;
    const render = (state) => {
        if (state.peak)
            entry.dataset.peak = 'true';
        else
            delete entry.dataset.peak;
        label.textContent = state.peak ? t('entry.peak') : t('entry.offpeak');
        const time = formatCountdown(state.countdownSeconds);
        countdown.textContent = state.peak ? t('entry.countdownToEnd', { time }) : t('entry.countdownToPeak', { time });
    };
    const tick = () => { render(classifyPeak(new Date(), resolveTimeZone(source.getTimeZone()))); };
    const tryPlace = () => {
        if (root !== undefined && !root.isConnected) {
            // The shell rebuilt the sidebar pane (whole-tree teardown); the root
            // observer is gone with the old tree, so detach it and re-query from
            // scratch. The new pane is later noticed by the body-level watcher.
            rootObserver.disconnect();
            root = undefined;
            placed = false;
        }
        if (placed) {
            // Cheap short-circuit: entry still lives in a mountable subtree.
            if (document.body.contains(entry))
                return;
            // Entry was torn down together with the old tree; reset and re-place.
            rootObserver.disconnect();
            root = undefined;
            placed = false;
        }
        root ??= sidebarRoot();
        if (root === undefined)
            return;
        placed = placeEntry(root, entry);
        if (placed) {
            rootObserver.observe(root, { childList: true, subtree: true });
        }
    };
    // Body-level watcher retained as the "whole rebuild" fallback: when the shell
    // tears down the whole sidebar pane, the root observer is gone with it and
    // only this body observation can notice the new pane mounting.
    const waitObserver = new MutationObserver(() => { tryPlace(); });
    waitObserver.observe(document.body, { childList: true, subtree: true });
    // Self-heal: if a React re-render displaces the row, re-insert it in the
    // same frame (microtask before paint → no visible flicker).
    const rootObserver = new MutationObserver(() => {
        if (root === undefined || !root.isConnected) {
            placed = false;
            tryPlace();
            return;
        }
        if (!root.contains(entry)) {
            placed = placeEntry(root, entry);
        }
    });
    tryPlace();
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => {
        waitObserver.disconnect();
        rootObserver.disconnect();
        window.clearInterval(interval);
        entry.remove();
    };
}
//# sourceMappingURL=sidebar-entry.js.map