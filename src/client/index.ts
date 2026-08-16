/**
 * Peak-hours client plugin: binds the `peak-hours` settings scope (timezone +
 * enabled) and mounts the single DOM surface — the sidebar status row.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and an external
 * plugin must not take the GUI down.
 */

import type { ClientContext, SettingsScope, SettingsScopeSpec } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and its
// LocaleNamespaceMap merge table.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
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

  interface SlotMap {
    /**
     * The child slot the Web UI plugin group declares; this card registers
     * into the group instead of the top-level plugin list. Spelled here with
     * the same shape so this package can register without depending on the
     * sibling UI package.
     */
    'web-ui.plugin.item': { kind: 'list'; scope: 'root'; owner: SettingsPluginItemOwnerProps }
  }
}

/** Owner share of a plugin card (the section supplies nothing). */
export interface SettingsPluginItemOwnerProps {
  /** Marker field: card owner props are intentionally empty. */
  children?: never
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /**
     * Optional rc.6 compatibility binder provided by dsh-web-ui-settings;
     * absent when that group plugin is not installed, so callers fall back to
     * the official settings scope.
     */
    webUiSettings?: { bind<S>(spec: SettingsScopeSpec<S>): SettingsScope<S> }
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
  // namespace, contributed to the Web UI plugin group.
  const binder = ctx.get('webUiSettings') ?? ctx.settingsScope
  const settingsScope = binder.bind<PeakHoursSettings>({ namespace: PEAK_HOURS_NS })
  const settingsCard = new PeakHoursSettingsCardController(settingsScope)
  ctx.slots.inject('web-ui.plugin.item', () => ctx.slots.register({
    name: 'web-ui.plugin.item',
    id: 'peak-hours',
    order: 120,
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
