/**
 * Host loader entry for the peak-hours plugin.
 *
 * The plugin is a purely passive, browser-side status indicator (a sidebar
 * entry with a per-second time check), so the host half's only job is to
 * register the `peak-hours` settings namespace the web settings surface
 * serves. The browser half reads `timezone` (default Asia/Shanghai) and
 * `enabled` from it. Nothing here reaches an agent prompt, so there is no
 * system-prompt section.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
/** Settings namespace the browser half binds. Spelled here rather than imported. */
export declare const PEAK_HOURS_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /**
     * IANA timezone the peak-hour clock reads. Defaults to Asia/Shanghai
     * (Beijing, UTC+8, no DST); an invalid value falls back to it in the client.
     */
    timezone?: string;
    /** Master switch for the plugin (browser half). */
    enabled?: boolean;
}
export declare const Config: z<Config>;
/**
 * Register the settings namespace. The hooks are no-ops because no host-side
 * behavior derives from the section; the registration exists so the web
 * settings surface can serve `peak-hours` to the browser half.
 * @param ctx - the plugin context.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map