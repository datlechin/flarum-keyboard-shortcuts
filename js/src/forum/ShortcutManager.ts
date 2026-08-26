import app from 'flarum/forum/app';
import ItemList from 'flarum/common/utils/ItemList';

import { PREFERENCES } from '../common/config';
import type { Shortcut } from '../common/types';
import { Binding, Chord, chordFromEvent, isApplePlatform, parseBinding, sequenceId, startsWith } from '../common/utils/keystroke';

const MODIFIER_ONLY_KEYS = ['Control', 'Alt', 'Shift', 'Meta', 'OS', 'AltGraph'];

/**
 * Owns the forum's keyboard shortcuts: which ones exist, what they are bound
 * to, and which one a key press should run.
 *
 * Registration goes through an `ItemList`, so other extensions can add, replace
 * or remove shortcuts the same way they extend any other Flarum item list:
 *
 * ```js
 * extend(ShortcutManager.prototype, 'shortcutItems', function (items) {
 *   items.add('acme.jump', { ... });
 * });
 * ```
 */
export default class ShortcutManager {
  /**
   * The registered shortcuts, keyed by id.
   */
  protected items = new ItemList<Shortcut>();

  /**
   * The chords typed so far that may still complete a sequence.
   */
  protected buffer: Chord[] = [];

  protected sequenceTimer: number | null = null;

  /**
   * A shortcut that has matched but is being held back because a longer
   * sequence starting with the same chords could still be completed.
   */
  protected pendingMatch: Shortcut | null = null;

  protected listening = false;

  protected apple = isApplePlatform();

  protected onKeyDown = this.handle.bind(this);

  /**
   * Cache of parsed bindings, rebuilt whenever bindings change. Parsing on
   * every key press would be wasteful for a listener on `document`.
   */
  protected parsed = new Map<string, Binding>();

  /**
   * Register a shortcut. Later registrations of the same id replace earlier
   * ones, so an extension can override a shipped shortcut by re-registering it.
   */
  register(shortcut: Shortcut, priority: number = 0): this {
    if (this.items.has(shortcut.id)) {
      this.items.setContent(shortcut.id, shortcut);
    } else {
      this.items.add(shortcut.id, shortcut, priority);
    }

    this.parsed.delete(shortcut.id);

    return this;
  }

  remove(id: string): this {
    this.items.remove(id);
    this.parsed.delete(id);

    return this;
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  get(id: string): Shortcut | undefined {
    return this.items.has(id) ? this.items.get(id) : undefined;
  }

  /**
   * Every registered shortcut, in registration order.
   *
   * Extend `shortcutItems` rather than this method when adding shortcuts.
   */
  all(): Shortcut[] {
    return this.shortcutItems().toArray();
  }

  /**
   * The item list backing {@link all}. This is the extension point.
   */
  shortcutItems(): ItemList<Shortcut> {
    return this.items;
  }

  /**
   * The shortcuts of a group, in the order they were registered.
   */
  group(group: string): Shortcut[] {
    return this.all().filter((shortcut) => shortcut.group === group);
  }

  /**
   * The distinct groups that currently have shortcuts, in registration order.
   */
  groups(): string[] {
    return this.all().reduce<string[]>((groups, shortcut) => {
      if (!groups.includes(shortcut.group)) groups.push(shortcut.group);

      return groups;
    }, []);
  }

  /**
   * The binding in force for a shortcut: the user's own override if they have
   * set one, otherwise the forum-wide binding, otherwise whatever the shortcut
   * itself declared.
   *
   * An empty string means the shortcut is deliberately switched off.
   */
  binding(id: string): string {
    const overrides = this.userBindings();

    // Overrides are read from the live user model rather than from the
    // server-resolved map, so a binding the user has just changed takes effect
    // without a page reload — and so does clearing one.
    if (id in overrides) return overrides[id];

    return this.defaultBinding(id);
  }

  /**
   * The binding the forum would use if the current user cleared their
   * override — what a "reset" restores.
   */
  defaultBinding(id: string): string {
    return this.forumBindings()[id] ?? this.get(id)?.defaultBinding ?? '';
  }

  /**
   * The forum-wide bindings, before any personal override.
   */
  protected forumBindings(): Record<string, string> {
    return (
      app.forum.attribute<Record<string, string>>('keyboardShortcutForumBindings') ||
      app.forum.attribute<Record<string, string>>('keyboardShortcuts') ||
      {}
    );
  }

  /**
   * This user's personal overrides.
   */
  protected userBindings(): Record<string, string> {
    if (!app.forum.attribute<boolean>('canCustomizeKeyboardShortcuts')) return {};

    const stored = app.session.user?.preferences()?.[PREFERENCES.bindings];

    return stored && typeof stored === 'object' ? (stored as Record<string, string>) : {};
  }

  protected bindingFor(shortcut: Shortcut): Binding {
    let binding = this.parsed.get(shortcut.id);

    if (!binding) {
      binding = parseBinding(this.binding(shortcut.id));
      this.parsed.set(shortcut.id, binding);
    }

    return binding;
  }

  /**
   * Forget every cached binding. Call after saving new bindings so the next
   * key press uses them.
   */
  invalidate(): this {
    this.parsed.clear();

    return this;
  }

  /**
   * Bindings used by more than one shortcut that could fire at the same time.
   * Two shortcuts sharing a binding is only a problem when their scopes
   * overlap, which cannot be known statically — so this reports any binding
   * claimed more than once and leaves the judgement to the reader.
   *
   * @return A map of binding string to the ids claiming it.
   */
  conflicts(): Map<string, string[]> {
    const claims = new Map<string, string[]>();

    for (const shortcut of this.all()) {
      for (const sequence of this.bindingFor(shortcut)) {
        const id = sequenceId(sequence, this.apple);

        claims.set(id, [...(claims.get(id) ?? []), shortcut.id]);
      }
    }

    for (const [id, ids] of claims) {
      if (ids.length < 2) claims.delete(id);
    }

    return claims;
  }

  /**
   * Whether shortcuts should be listening at all for the current user.
   */
  enabled(): boolean {
    const preference = app.session.user?.preferences()?.[PREFERENCES.enabled];

    if (preference !== undefined && preference !== null) return !!preference;

    return app.forum.attribute<boolean>('keyboardShortcutsEnabled') !== false;
  }

  start(): this {
    if (this.listening) return this;

    document.addEventListener('keydown', this.onKeyDown);
    this.listening = true;

    return this;
  }

  stop(): this {
    if (!this.listening) return this;

    document.removeEventListener('keydown', this.onKeyDown);
    this.listening = false;
    this.reset();

    return this;
  }

  /**
   * How long a half-typed sequence stays live.
   */
  protected timeout(): number {
    return app.forum.attribute<number>('keyboardShortcutSequenceTimeout') || 1000;
  }

  protected reset(): void {
    this.buffer = [];
    this.pendingMatch = null;

    if (this.sequenceTimer !== null) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  /**
   * The longest sequence any shortcut is bound to, which bounds how much
   * history the buffer needs to keep.
   */
  protected longestSequence(): number {
    return this.all().reduce((longest, shortcut) => {
      for (const sequence of this.bindingFor(shortcut)) {
        longest = Math.max(longest, sequence.length);
      }

      return longest;
    }, 1);
  }

  handle(event: KeyboardEvent): void {
    if (event.defaultPrevented || !this.enabled()) return;

    // Modifier keys held on their own start a chord; they never end one, and
    // must not disturb a sequence in progress.
    if (MODIFIER_ONLY_KEYS.includes(event.key)) return;

    // A press that is completing a character with a dead key or an IME belongs
    // to the text being typed, not to us.
    if (event.isComposing || event.keyCode === 229) return;

    const chord = chordFromEvent(event);

    if (!chord) return;

    this.buffer = [...this.buffer, chord].slice(-this.longestSequence());

    if (this.sequenceTimer !== null) clearTimeout(this.sequenceTimer);

    let match = this.match(event);
    let pending = this.prefixed(event);

    // A stale buffer can hide a shortcut that this key press alone would
    // trigger, so fall back to considering the press on its own.
    if (!match && !pending && this.buffer.length > 1) {
      this.buffer = [chord];
      match = this.match(event);
      pending = this.prefixed(event);
    }

    if (match && !pending) {
      this.fire(match, event);
      return;
    }

    if (!match && !pending) {
      this.reset();
      return;
    }

    // Still ambiguous: hold what we have. If a longer sequence never arrives,
    // run the shortcut that already matched once the buffer expires.
    this.pendingMatch = match ?? null;

    // The press belongs to a shortcut either way — one that has matched, or one
    // whose sequence it has begun — so the browser must not also act on it.
    // Without this, the first step of a binding like `/ x` would still open the
    // browser's own quick-find.
    event.preventDefault();

    this.sequenceTimer = window.setTimeout(() => {
      const held = this.pendingMatch;

      this.reset();

      if (held) this.run(held, event);
    }, this.timeout()) as unknown as number;
  }

  protected fire(shortcut: Shortcut, event: KeyboardEvent): void {
    this.reset();

    if (this.run(shortcut, event) !== false) {
      event.preventDefault();
    }
  }

  /**
   * Run a shortcut's action and redraw. Returning `false` from an action means
   * it declined to act, which is passed back so the key press can be left to
   * the browser.
   */
  protected run(shortcut: Shortcut, event: KeyboardEvent): boolean {
    const result = shortcut.action(event);

    if (result === false) return false;

    m.redraw();

    return true;
  }

  /**
   * The shortcut whose binding the buffer currently completes, if any.
   */
  protected match(event: KeyboardEvent): Shortcut | null {
    for (const shortcut of this.all()) {
      if (!this.applies(shortcut, event)) continue;

      for (const sequence of this.bindingFor(shortcut)) {
        if (sequence.length !== this.buffer.length) continue;

        if (startsWith(sequence, this.buffer, this.apple)) return shortcut;
      }
    }

    return null;
  }

  /**
   * Whether the buffer is the beginning of some longer binding that could
   * still be completed.
   */
  protected prefixed(event: KeyboardEvent): boolean {
    for (const shortcut of this.all()) {
      if (!this.applies(shortcut, event)) continue;

      for (const sequence of this.bindingFor(shortcut)) {
        if (sequence.length > this.buffer.length && startsWith(sequence, this.buffer, this.apple)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Whether a shortcut is eligible for this key press: it has a binding, its
   * scope applies, and the focus is somewhere it is willing to act.
   */
  protected applies(shortcut: Shortcut, event: KeyboardEvent): boolean {
    if (!this.binding(shortcut.id)) return false;

    if (!shortcut.allowInInput && isEditable(event.target)) return false;

    if (!shortcut.allowInModal && app.modal.isModalOpen()) return false;

    return shortcut.when?.() !== false;
  }
}

/**
 * Whether a key press landed in something the user is typing into.
 *
 * Inputs that take no text — checkboxes, buttons — are not editable for our
 * purposes, so a single-letter shortcut still works when one has focus.
 */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  // `isContentEditable` accounts for inheritance but is not implemented
  // everywhere (jsdom, for one); the attribute lookup covers the rest, and
  // also catches focus landing on a node inside an editable region.
  if (target.isContentEditable || target.closest('[contenteditable]:not([contenteditable="false"])')) {
    return true;
  }

  const tag = target.tagName;

  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;

  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type.toLowerCase();

    return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(type);
  }

  return false;
}
