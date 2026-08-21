import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PluginSettingsCard, BooleanField, ChoiceField } from "./PluginSettingsCard.js";
import { CardForm, booleanField, choiceField } from "./settings-form.js";
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
];
/** The choice values, so the form spec and the select render the same set. */
const TIMEZONE_VALUES = TIMEZONE_CHOICES.map(choice => choice.value);
/** Bridges the `peak-hours` scope onto the card's staged form. */
export class PeakHoursSettingsCardController {
    form;
    store;
    /** @param scope - the bound settings scope for the `peak-hours` namespace. */
    constructor(scope) {
        this.form = new CardForm(scope, [
            booleanField('enabled'),
            choiceField('timezone', TIMEZONE_VALUES),
        ]);
        this.store = this.form.bind(() => this.projection());
    }
    projection() {
        return {
            ...this.form.shell(),
            enabled: this.form.field('enabled'),
            timezone: this.form.field('timezone'),
        };
    }
    /**
     * Build the face the card's slot registration injects.
     * @returns the card's snapshot and its form actions.
     */
    inject() {
        return { hooks: { peakHoursSettingsCard: this.store }, ...this.form.actions() };
    }
}
/**
 * Render the peak-hours card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export function PeakHoursSettingsCard(props) {
    const { t } = props;
    const state = props.usePeakHoursSettingsCard(snapshot => snapshot);
    const disabled = !state.writable;
    const fieldProps = {
        overriddenLabel: t('settings.overridden'),
        resetLabel: t('settings.reset'),
        invalidLabel: t('settings.invalidNumber'),
        disabled,
    };
    return (_jsxs(PluginSettingsCard, { t: t, titleKey: "settings.title", descriptionKey: "settings.description", state: state, onSave: props.save, onDiscard: props.discard, children: [_jsx(BooleanField, { id: "settings-peak-hours-enabled", label: t('settings.enabled'), hint: t('settings.enabledHint'), inheritLabel: t('settings.inherit'), onLabel: t('settings.on'), offLabel: t('settings.off'), ...fieldProps, ...state.enabled, onEdit: (text) => { props.edit('enabled', text); }, onReset: () => { props.resetField('enabled'); } }), _jsx(ChoiceField, { id: "settings-peak-hours-timezone", label: t('settings.timezone'), hint: t('settings.timezoneHint'), inheritLabel: t('settings.inherit'), choices: [...TIMEZONE_CHOICES], ...fieldProps, ...state.timezone, onEdit: (text) => { props.edit('timezone', text); }, onReset: () => { props.resetField('timezone'); } })] }));
}
//# sourceMappingURL=PeakHoursSettingsCard.js.map