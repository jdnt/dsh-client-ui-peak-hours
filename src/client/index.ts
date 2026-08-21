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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and its
// LocaleNamespaceMap merge table.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the official `settings.plugin.item` SlotMap merge and its
// owner share (declared by the core plugins-settings section).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { claimPeakHoursApply, releasePeakHoursApply } from './apply-guard.ts'
import { mountSidebarEntry } from './sidebar-entry.ts'
import { PeakHoursSettingsCard, PeakHoursSettingsCardController, type PeakHoursSettings } from './PeakHoursSettingsCard.tsx'
import { en, zh, type PeakHoursKey } from './locales.ts'

/** Locale namespace this plugin owns. */
const NS = 'peak-hours'

/** Settings namespace the settings card edits (the Host plugin registers it). */
const PEAK_HOURS_NS = 'peak-hours'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Peak-hours surface copy. */
    'peak-hours': PeakHoursKey
  }
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['slots', 'settingsScope', 'locale']

/**
 * Mount the peak-hours status row and its settings card.
 * @param ctx - client root context (services: settingsScope, locale, slots).
 */
export function apply(ctx: ClientContext): void {
  // A duplicated client injection (module factory executed twice in one page
  // lifetime) would otherwise mount a second sidebar entry.
  if (!claimPeakHoursApply()) return

  ctx.effect(() => releasePeakHoursApply, 'peak-hours: apply claim')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'peak-hours: dictionaries')

  // Plugin configuration card: one staged form over the `peak-hours` settings
  // namespace, contributed to the core Plugin configuration page.
  const settingsScope = ctx.settingsScope.bind<PeakHoursSettings>({ namespace: PEAK_HOURS_NS })
  const settingsCard = new PeakHoursSettingsCardController(settingsScope)
  // `settings.plugin.item` is a keyed slot since dsh 0.1.1: the `key` is the
  // settings namespace the card edits (the tab dispatches each namespace).
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: PEAK_HOURS_NS,
    locale: NS,
    inject: () => settingsCard.inject(),
  }, PeakHoursSettingsCard))

  // The sidebar entry mounts once the settings scope settles. Each tick reads
  // the live timezone, so a settings edit applies on the next second without
  // remounting. Only an unavailable scope (no settings surface served) falls
  // back to the composition default (enabled, Asia/Shanghai).
  let uiDisposer: (() => void) | undefined
  const mountUi = (): void => {
    if (uiDisposer !== undefined) return
    try {
      uiDisposer = mountSidebarEntry({
        getTimeZone: () => settingsScope.getSnapshot().value?.timezone,
      })
    } catch (error) {
      // DOM failures degrade the status row, never the GUI.
      console.warn('[dsh-peak-hours] mount failed:', error)
    }
  }
  const syncEnabled = (): void => {
    const snapshot = settingsScope.getSnapshot()
    const enabled = snapshot.status === 'ready'
      ? snapshot.value?.enabled ?? true
      : snapshot.status === 'unavailable'
    if (enabled) mountUi()
    else uiDisposer?.()
  }
  settingsScope.subscribe(syncEnabled)
  syncEnabled()
}
