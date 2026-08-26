import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type { ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type { ResetSettingItem } from 'flarum/admin/components/ResetExtensionSettingsModal';
import type Mithril from 'mithril';
import { type ShortcutDescriptor } from '../catalogue';
/**
 * The forum-wide shortcut configuration.
 *
 * Bindings are recorded rather than typed: an administrator presses the keys
 * they mean, and what gets stored is exactly the form the forum frontend
 * matches against — no need to know how to spell `⌘` or `PageDown`.
 *
 * Thirty-odd bindings are tabular data, so they are laid out as a table rather
 * than as settings cards: `FormSection` caps at 400px, which would leave a
 * single cramped column and a page of empty space beside it. Only the handful
 * of settings that govern shortcuts as a whole belong in a card.
 *
 * The catalogue itself comes from the API document, so the shipped defaults are
 * defined in exactly one place (`Shortcuts.php`) rather than mirrored here.
 */
export default class KeyboardShortcutsPage<Attrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<Attrs> {
    /**
     * Filters the list of shortcuts. Thirty-odd rows is a lot to scan for the
     * one you came to change.
     */
    protected query: string;
    content(vnode: Mithril.VnodeDOM<Attrs, this>): JSX.Element;
    /**
     * The settings that govern shortcuts as a whole, rather than any one binding.
     */
    behaviourSection(): Mithril.Children;
    /**
     * The bindings themselves: a heading, a filter, and the table.
     */
    bindingsSection(): Mithril.Children;
    filter(): Mithril.Children;
    /**
     * A `tbody` per group, so each keeps its own heading row while the columns
     * stay aligned across the whole table.
     */
    rows(): Mithril.Children[];
    row(shortcut: ShortcutDescriptor): Mithril.Children;
    /**
     * The tracked stream for a shortcut's binding, labelled so the reset modal
     * can name it.
     */
    protected binding(shortcut: ShortcutDescriptor): Stream<string>;
    /**
     * The other shortcuts in the same group currently claiming the same binding.
     *
     * Only collisions within a group are reported: the same key meaning different
     * things on different pages is the point of scoping, so flagging those would
     * be noise.
     */
    conflicts(shortcut: ShortcutDescriptor): ShortcutDescriptor[];
    protected siblings(shortcut: ShortcutDescriptor): ShortcutDescriptor[];
    matchesQuery(shortcut: ShortcutDescriptor): boolean;
    /**
     * Every setting this page owns, so "reset settings" restores the whole
     * extension rather than only what happens to be on screen.
     */
    resettableSettings(): ResetSettingItem[];
}
