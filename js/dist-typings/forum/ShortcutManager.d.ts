import ItemList from 'flarum/common/utils/ItemList';
import type { Shortcut } from '../common/types';
import { Binding, Chord } from '../common/utils/keystroke';
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
    protected items: ItemList<Shortcut>;
    /**
     * The chords typed so far that may still complete a sequence.
     */
    protected buffer: Chord[];
    protected sequenceTimer: number | null;
    /**
     * A shortcut that has matched but is being held back because a longer
     * sequence starting with the same chords could still be completed.
     */
    protected pendingMatch: Shortcut | null;
    protected listening: boolean;
    protected apple: boolean;
    protected onKeyDown: (event: KeyboardEvent) => void;
    /**
     * Cache of parsed bindings, rebuilt whenever bindings change. Parsing on
     * every key press would be wasteful for a listener on `document`.
     */
    protected parsed: Map<string, Binding>;
    /**
     * Register a shortcut. Later registrations of the same id replace earlier
     * ones, so an extension can override a shipped shortcut by re-registering it.
     */
    register(shortcut: Shortcut, priority?: number): this;
    remove(id: string): this;
    has(id: string): boolean;
    get(id: string): Shortcut | undefined;
    /**
     * Every registered shortcut, in registration order.
     *
     * Extend `shortcutItems` rather than this method when adding shortcuts.
     */
    all(): Shortcut[];
    /**
     * The item list backing {@link all}. This is the extension point.
     */
    shortcutItems(): ItemList<Shortcut>;
    /**
     * The shortcuts of a group, in the order they were registered.
     */
    group(group: string): Shortcut[];
    /**
     * The distinct groups that currently have shortcuts, in registration order.
     */
    groups(): string[];
    /**
     * The binding in force for a shortcut: the user's own override if they have
     * set one, otherwise the forum-wide binding, otherwise whatever the shortcut
     * itself declared.
     *
     * An empty string means the shortcut is deliberately switched off.
     */
    binding(id: string): string;
    /**
     * The binding the forum would use if the current user cleared their
     * override — what a "reset" restores.
     */
    defaultBinding(id: string): string;
    /**
     * The forum-wide bindings, before any personal override.
     */
    protected forumBindings(): Record<string, string>;
    /**
     * This user's personal overrides.
     */
    protected userBindings(): Record<string, string>;
    protected bindingFor(shortcut: Shortcut): Binding;
    /**
     * Forget every cached binding. Call after saving new bindings so the next
     * key press uses them.
     */
    invalidate(): this;
    /**
     * Bindings used by more than one shortcut that could fire at the same time.
     * Two shortcuts sharing a binding is only a problem when their scopes
     * overlap, which cannot be known statically — so this reports any binding
     * claimed more than once and leaves the judgement to the reader.
     *
     * @return A map of binding string to the ids claiming it.
     */
    conflicts(): Map<string, string[]>;
    /**
     * Whether shortcuts should be listening at all for the current user.
     */
    enabled(): boolean;
    start(): this;
    stop(): this;
    /**
     * How long a half-typed sequence stays live.
     */
    protected timeout(): number;
    protected reset(): void;
    /**
     * The longest sequence any shortcut is bound to, which bounds how much
     * history the buffer needs to keep.
     */
    protected longestSequence(): number;
    handle(event: KeyboardEvent): void;
    protected fire(shortcut: Shortcut, event: KeyboardEvent): void;
    /**
     * Run a shortcut's action and redraw. Returning `false` from an action means
     * it declined to act, which is passed back so the key press can be left to
     * the browser.
     */
    protected run(shortcut: Shortcut, event: KeyboardEvent): boolean;
    /**
     * The shortcut whose binding the buffer currently completes, if any.
     */
    protected match(event: KeyboardEvent): Shortcut | null;
    /**
     * Whether the buffer is the beginning of some longer binding that could
     * still be completed.
     */
    protected prefixed(event: KeyboardEvent): boolean;
    /**
     * Whether a shortcut is eligible for this key press: it has a binding, its
     * scope applies, and the focus is somewhere it is willing to act.
     */
    protected applies(shortcut: Shortcut, event: KeyboardEvent): boolean;
}
/**
 * Whether a key press landed in something the user is typing into.
 *
 * Inputs that take no text — checkboxes, buttons — are not editable for our
 * purposes, so a single-letter shortcut still works when one has focus.
 */
export declare function isEditable(target: EventTarget | null): boolean;
