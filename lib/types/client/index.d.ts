/**
 * Peak-hours client plugin: binds the `peak-hours` settings scope (timezone +
 * enabled) and mounts the single DOM surface — the sidebar status row.
 *
 * Fully standalone: it depends only on the dsh platform (the runtime settings
 * scope and the official `settings.plugin.item` card slot), never on any
 * dsh-web-ui sibling plugin. The settings card registers into the core
 * `settings.plugin.item` slot, so it appears on the standard Plugin
 * configuration page with no group-plugin prerequisite.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and an external
 * plugin must not take the GUI down.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type PeakHoursKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Peak-hours surface copy. */
        'peak-hours': PeakHoursKey;
    }
}
/** Required services (fiber inject waiting — the runtime must be up first). */
export declare const inject: string[];
/**
 * Mount the peak-hours status row and its settings card.
 * @param ctx - client root context (services: settingsScope, locale, slots).
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map