import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import classList from 'flarum/common/utils/classList';
import extractText from 'flarum/common/utils/extractText';
import generateElementId from 'flarum/common/utils/generateElementId';
import type Mithril from 'mithril';

import { trans } from '../config';
import KeyCombo from './KeyCombo';
import { chordFromEvent, parseBinding, stringifyBinding, stringifySequence, type Chord } from '../utils/keystroke';

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

const MODIFIER_KEYS = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'AltGraph'];

/**
 * How long a bare key waits for a second one before the recording is
 * considered finished. Mirrors the matcher's own sequence timeout, so `g` then
 * `h` records as the sequence it will later fire as.
 */
const SEQUENCE_WINDOW_MS = 1000;

/**
 * The recorder currently listening, if any.
 *
 * Only one can listen at a time, and that is enforced here rather than left to
 * a blur event: on macOS, clicking a `<button>` does not focus it, so a blur
 * may simply never arrive and two fields would sit in the recording state at
 * once. Whoever starts stops whoever was listening before.
 */
let listening: ShortcutRecorder<any> | null = null;

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
  protected recording = false;

  /**
   * The chords recorded since recording began.
   */
  protected recorded: Chord[] = [];

  /**
   * Closes the recording once a bare key has gone unfollowed.
   */
  protected settleTimer: number | null = null;

  /**
   * Announces what is happening for people who cannot see the field change.
   */
  protected statusId = generateElementId();

  protected onDocumentKeyDown = this.handleKey.bind(this);
  protected onDocumentPointerDown = this.handlePointer.bind(this);

  view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children {
    const { value, onchange, defaultValue, disabled, className, ...attrs } = this.attrs;

    const isDefault = defaultValue === undefined || defaultValue === null || (value ?? '') === defaultValue;

    return (
      <div
        className={classList('ShortcutRecorder', className, {
          'ShortcutRecorder--recording': this.recording,
          'ShortcutRecorder--disabled': disabled,
        })}
      >
        <button
          type="button"
          className="ShortcutRecorder-capture FormControl"
          disabled={disabled}
          aria-describedby={this.statusId}
          aria-label={extractText(trans(this.recording ? 'lib.recorder.stop_label' : 'lib.recorder.start_label'))}
          onclick={() => this.toggle()}
          {...attrs}
        >
          {this.recording ? this.recordingLabel() : <KeyCombo binding={value} />}
        </button>

        <div className="ShortcutRecorder-controls">
          {!!value && !disabled && (
            <Button
              className="Button Button--icon Button--link ShortcutRecorder-control"
              icon="fas fa-ban"
              title={extractText(trans('lib.recorder.clear_label'))}
              aria-label={extractText(trans('lib.recorder.clear_label'))}
              onclick={() => this.commit('')}
            />
          )}
          {!isDefault && !disabled && (
            <Button
              className="Button Button--icon Button--link ShortcutRecorder-control"
              icon="fas fa-rotate-left"
              title={extractText(trans('lib.recorder.reset_label'))}
              aria-label={extractText(trans('lib.recorder.reset_label'))}
              onclick={() => this.commit(defaultValue ?? '')}
            />
          )}
        </div>

        <span id={this.statusId} className="visually-hidden" aria-live="polite">
          {this.recording ? extractText(trans('lib.recorder.recording_status')) : ''}
        </span>
      </div>
    );
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>) {
    super.onremove(vnode);

    // A row can be removed while it is listening — the modal closes, a filter
    // hides it, a tab is switched. Leaving the document listeners behind would
    // swallow every key press on the page from then on.
    this.stop(false);
  }

  /**
   * What the button shows while listening: the sequence so far, or a prompt.
   */
  protected recordingLabel(): Mithril.Children {
    if (!this.recorded.length) {
      return (
        <span className="ShortcutRecorder-prompt">
          <Icon name="fas fa-circle" className="ShortcutRecorder-promptIcon" />
          {trans('lib.recorder.prompt')}
        </span>
      );
    }

    return <KeyCombo binding={stringifySequence(this.recorded)} />;
  }

  protected toggle(): void {
    if (this.recording) {
      this.stop();
    } else {
      this.start();
    }
  }

  protected start(): void {
    if (this.attrs.disabled || this.recording) return;

    // Whoever was listening stops now, so two fields can never both be live.
    listening?.stop();
    listening = this;

    this.recording = true;
    this.recorded = [];

    document.addEventListener('keydown', this.onDocumentKeyDown, true);
    document.addEventListener('mousedown', this.onDocumentPointerDown, true);

    // Focus is not what makes capture work, but moving it here is what tells a
    // screen reader — and a sighted keyboard user — where they now are.
    this.captureElement()?.focus();
  }

  protected stop(redraw: boolean = true): void {
    this.clearSettleTimer();

    if (!this.recording) return;

    this.recording = false;
    this.recorded = [];

    document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    document.removeEventListener('mousedown', this.onDocumentPointerDown, true);

    if (listening === this) listening = null;

    if (redraw) m.redraw();
  }

  protected handleKey(e: KeyboardEvent): void {
    if (!this.recording) return;

    // Nothing typed while recording belongs to the page — not Tab, not Escape,
    // not the browser's own shortcuts, and not the forum's. Otherwise the very
    // keys most worth binding could never be captured.
    e.preventDefault();
    e.stopPropagation();

    if (MODIFIER_KEYS.includes(e.key)) return;

    // A press that is completing a character with a dead key or an IME belongs
    // to the text being composed, not to us.
    if (e.isComposing || e.keyCode === 229) return;

    if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.stop();
      return;
    }

    const chord = chordFromEvent(e);

    if (!chord) return;

    this.recorded.push(chord);
    this.attrs.onchange(stringifySequence(this.recorded));

    // A chord with a modifier is meant on its own; a bare key may be the start
    // of a sequence, so listening continues for a moment in case another
    // follows — the same window the matcher gives a half-typed sequence.
    if (chord.ctrl || chord.alt || chord.meta) {
      this.stop();
    } else {
      this.restartSettleTimer();
      m.redraw();
    }
  }

  protected handlePointer(e: MouseEvent): void {
    if (!this.recording) return;

    // A click inside our own control is the toggle, handled by the button.
    if (this.element?.contains(e.target as Node)) return;

    this.stop();
  }

  protected restartSettleTimer(): void {
    this.clearSettleTimer();

    this.settleTimer = window.setTimeout(() => {
      this.settleTimer = null;
      this.stop();
    }, SEQUENCE_WINDOW_MS) as unknown as number;
  }

  protected clearSettleTimer(): void {
    if (this.settleTimer !== null) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
  }

  protected captureElement(): HTMLElement | null {
    return this.element?.querySelector<HTMLElement>('.ShortcutRecorder-capture') ?? null;
  }

  /**
   * Store a binding and stop listening.
   */
  protected commit(binding: string): void {
    // Normalise through the parser so anything set programmatically — a reset
    // to a shipped default, say — is stored in the same form recording writes.
    const parsed = parseBinding(binding);

    this.attrs.onchange(parsed.length ? stringifyBinding(parsed) : '');
    this.stop();
  }
}
