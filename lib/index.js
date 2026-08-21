import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
//#region lib/types/index.js
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
/** Settings namespace the browser half binds. Spelled here rather than imported. */
const PEAK_HOURS_SETTINGS_NAMESPACE = settingsNamespace("peak-hours");
const Config = z.object({
	timezone: z.string().default("Asia/Shanghai"),
	enabled: z.boolean().default(true)
});
/**
* Register the settings namespace. The hooks are no-ops because no host-side
* behavior derives from the section; the registration exists so the web
* settings surface can serve `peak-hours` to the browser half.
* @param ctx - the plugin context.
* @param config - resolved plugin config (schema defaults applied by the loader).
*/
function apply(ctx, config) {
	installSettingsSection(ctx, PEAK_HOURS_SETTINGS_NAMESPACE, Config, config ?? {}, {
		setSource: () => {},
		onChange: () => {}
	});
}
//#endregion
export { Config, PEAK_HOURS_SETTINGS_NAMESPACE, apply };
