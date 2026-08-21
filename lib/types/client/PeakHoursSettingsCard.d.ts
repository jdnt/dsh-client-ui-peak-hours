/**
 * The peak-hours settings card: the master switch and the IANA timezone the
 * peak-hour clock reads. Registers into the core `settings.plugin.item` slot
 * the Plugin configuration page renders, bound to the `peak-hours` settings
 * namespace.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import { type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts';
/** The peak-hours fields this card edits (the namespace's full schema). */
export interface PeakHoursSettings {
    /** Master switch for the plugin. */
    enabled?: boolean;
    /** IANA timezone the peak-hour clock reads (default Asia/Shanghai). */
    timezone?: string;
}
/** What the peak-hours card renders. */
export interface PeakHoursSettingsCardState extends CardShell {
    /** Master switch. */
    enabled: CardFieldState;
    /** IANA timezone. */
    timezone: CardFieldState;
}
/** The registration-side face the card's slot entry injects. */
export interface PeakHoursSettingsCardFace extends CardActions {
    hooks: {
        /** Card snapshot bound by the renderer as usePeakHoursSettingsCard. */
        peakHoursSettingsCard: SnapshotStore<PeakHoursSettingsCardState>;
    };
}
/** Bridges the `peak-hours` scope onto the card's staged form. */
export declare class PeakHoursSettingsCardController {
    private readonly form;
    private readonly store;
    /** @param scope - the bound settings scope for the `peak-hours` namespace. */
    constructor(scope: SettingsScope<PeakHoursSettings>);
    private projection;
    /**
     * Build the face the card's slot registration injects.
     * @returns the card's snapshot and its form actions.
     */
    inject(): PeakHoursSettingsCardFace;
}
/** Props the renderer binds for the peak-hours card. */
export type PeakHoursSettingsCardProps = PropsRuntime<'settings.plugin.item'> & PropsLocale<'peak-hours'> & InjectFace<PeakHoursSettingsCardFace>;
/**
 * Render the peak-hours card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export declare function PeakHoursSettingsCard(props: PeakHoursSettingsCardProps): import("react").JSX.Element;
//# sourceMappingURL=PeakHoursSettingsCard.d.ts.map