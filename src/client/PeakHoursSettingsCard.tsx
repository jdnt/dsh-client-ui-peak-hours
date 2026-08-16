/**
 * The peak-hours settings card: the master switch and the IANA timezone the
 * peak-hour clock reads. Registers into the core `settings.plugin.item` slot
 * the Plugin configuration page renders, bound to the `peak-hours` settings
 * namespace.
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { PluginSettingsCard, BooleanField, ChoiceField } from './PluginSettingsCard.tsx'
import { CardForm, booleanField, choiceField, type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts'

/** The peak-hours fields this card edits (the namespace's full schema). */
export interface PeakHoursSettings {
  /** Master switch for the plugin. */
  enabled?: boolean
  /** IANA timezone the peak-hour clock reads (default Asia/Shanghai). */
  timezone?: string
}

/** IANA timezones the card offers, Beijing first (the composition default). */
const TIMEZONE_CHOICES = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
] as const

/** The choice values, so the form spec and the select render the same set. */
const TIMEZONE_VALUES = TIMEZONE_CHOICES.map(choice => choice.value)

/** What the peak-hours card renders. */
export interface PeakHoursSettingsCardState extends CardShell {
  /** Master switch. */
  enabled: CardFieldState
  /** IANA timezone. */
  timezone: CardFieldState
}

/** The registration-side face the card's slot entry injects. */
export interface PeakHoursSettingsCardFace extends CardActions {
  hooks: {
    /** Card snapshot bound by the renderer as usePeakHoursSettingsCard. */
    peakHoursSettingsCard: SnapshotStore<PeakHoursSettingsCardState>
  }
}

/** Bridges the `peak-hours` scope onto the card's staged form. */
export class PeakHoursSettingsCardController {
  private readonly form: CardForm<PeakHoursSettings>
  private readonly store: SnapshotStore<PeakHoursSettingsCardState>

  /** @param scope - the bound settings scope for the `peak-hours` namespace. */
  constructor(scope: SettingsScope<PeakHoursSettings>) {
    this.form = new CardForm(scope, [
      booleanField('enabled'),
      choiceField('timezone', TIMEZONE_VALUES),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): PeakHoursSettingsCardState {
    return {
      ...this.form.shell(),
      enabled: this.form.field('enabled'),
      timezone: this.form.field('timezone'),
    }
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): PeakHoursSettingsCardFace {
    return { hooks: { peakHoursSettingsCard: this.store }, ...this.form.actions() }
  }
}

/** Props the renderer binds for the peak-hours card. */
export type PeakHoursSettingsCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'peak-hours'>
  & InjectFace<PeakHoursSettingsCardFace>

/**
 * Render the peak-hours card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export function PeakHoursSettingsCard(props: PeakHoursSettingsCardProps) {
  const { t } = props
  const state = props.usePeakHoursSettingsCard(snapshot => snapshot)
  const disabled = !state.writable
  const fieldProps = {
    overriddenLabel: t('settings.overridden'),
    resetLabel: t('settings.reset'),
    invalidLabel: t('settings.invalidNumber'),
    disabled,
  }
  return (
    <PluginSettingsCard
      t={t}
      titleKey="settings.title"
      descriptionKey="settings.description"
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <BooleanField
        id="settings-peak-hours-enabled"
        label={t('settings.enabled')}
        hint={t('settings.enabledHint')}
        inheritLabel={t('settings.inherit')}
        onLabel={t('settings.on')}
        offLabel={t('settings.off')}
        {...fieldProps}
        {...state.enabled}
        onEdit={(text) => { props.edit('enabled', text) }}
        onReset={() => { props.resetField('enabled') }}
      />
      <ChoiceField
        id="settings-peak-hours-timezone"
        label={t('settings.timezone')}
        hint={t('settings.timezoneHint')}
        inheritLabel={t('settings.inherit')}
        choices={[...TIMEZONE_CHOICES]}
        {...fieldProps}
        {...state.timezone}
        onEdit={(text) => { props.edit('timezone', text) }}
        onReset={() => { props.resetField('timezone') }}
      />
    </PluginSettingsCard>
  )
}
