import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { type Chord } from '../utils/keystroke';
export interface IShortcutRecorderAttrs extends ComponentAttrs {
    className?: string;
    /**
     * The binding as currently stored.
     */
    value?: string | null;
    /**
     * Called with the new binding whenever the user records, clears or resets
     * one. An empty string means the shortcut should be switched off.
     */
    onchange: (binding: string) => void;
    /**
     * The binding a reset returns to. Omit to hide the reset control.
     */
    defaultValue?: string | null;
    disabled?: boolean;
}
/**
 * Captures a binding by listening to what the user actually types.
 *
 * Recording writes the binding in the same canonical form the matcher reads, so
 * what is stored is exactly what will fire — no guessing at how to spell a key.
 * Multi-step sequences are supported: press a second key straight after the
 * first and it is appended, as in `g` then `h`.
 *
 * Key presses are taken from `document` in the capture phase rather than from
 * the control itself. The control is a `<button>`, and on macOS neither Safari
 * nor Firefox give a button keyboard focus when it is clicked — so a handler
 * bound to the element would never see the keys the user is pressing at it.
 * Capturing at the document also puts this ahead of the forum's own shortcut
 * manager, which would otherwise act on the keys being recorded.
 */
export default class ShortcutRecorder<CustomAttrs extends IShortcutRecorderAttrs = IShortcutRecorderAttrs> extends Component<CustomAttrs> {
    /**
     * Whether this recorder is currently listening for key presses.
     */
    protected recording: boolean;
    /**
     * The chords recorded since recording began.
     */
    protected recorded: Chord[];
    /**
     * Closes the recording once a bare key has gone unfollowed.
     */
    protected settleTimer: number | null;
    /**
     * Announces what is happening for people who cannot see the field change.
     */
    protected statusId: any;
    protected onDocumentKeyDown: (e: KeyboardEvent) => void;
    protected onDocumentPointerDown: (e: MouseEvent) => void;
    view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children;
    onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    /**
     * What the button shows while listening: the sequence so far, or a prompt.
     */
    protected recordingLabel(): Mithril.Children;
    protected toggle(): void;
    protected start(): void;
    protected stop(redraw?: boolean): void;
    protected handleKey(e: KeyboardEvent): void;
    protected handlePointer(e: MouseEvent): void;
    protected restartSettleTimer(): void;
    protected clearSettleTimer(): void;
    protected captureElement(): HTMLElement | null;
    /**
     * Store a binding and stop listening.
     */
    protected commit(binding: string): void;
}
