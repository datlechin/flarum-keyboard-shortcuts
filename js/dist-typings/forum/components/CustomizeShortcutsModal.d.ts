import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import type Mithril from 'mithril';
import type { Shortcut } from '../../common/types';
export interface ICustomizeShortcutsModalAttrs extends IFormModalAttrs {
}
/**
 * Lets a member rebind any shortcut for themselves.
 *
 * Only the bindings that differ from the forum's are stored, so a user who
 * changes one key keeps following the forum for everything else — including
 * later changes an administrator makes.
 *
 * Unlike the cheat sheet, this is a form: one group at a time, behind tabs, so
 * the list stays short enough that the save button never scrolls out of reach.
 * A tab whose group contains a clash is marked, so nothing has to be hunted for.
 */
export default class CustomizeShortcutsModal<CustomAttrs extends ICustomizeShortcutsModalAttrs = ICustomizeShortcutsModalAttrs> extends FormModal<CustomAttrs> {
    /**
     * The bindings as edited, keyed by shortcut id. Seeded from what is in force
     * so the form shows the user's real keys, not a blank slate.
     */
    protected bindings: Record<string, string>;
    protected activeGroup: string;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    className(): string;
    title(): Mithril.Children;
    content(): Mithril.Children;
    /**
     * The submit and reset controls, in the modal's footer so they stay put
     * while a group is scrolled.
     */
    protected inner(): Mithril.Children;
    tab(group: string): Mithril.Children;
    row(shortcut: Shortcut): Mithril.Children;
    /**
     * The groups with something to edit, in their canonical order.
     */
    groups(): string[];
    shortcutsIn(group: string): Shortcut[];
    /**
     * The other shortcuts this binding would collide with.
     *
     * Collisions are reported rather than prevented, and only within a group:
     * `j` meaning "next discussion" on the index and "next post" in a discussion
     * is a collision on paper and exactly right in practice.
     */
    conflicts(shortcut: Shortcut): Shortcut[];
    /**
     * The bindings that differ from the forum's — the only ones worth storing.
     */
    protected overrides(): Record<string, string>;
    protected stored(): Record<string, string>;
    protected hasOverrides(): boolean;
    /**
     * How many bindings have been edited but not yet saved.
     */
    protected changed(): number;
    protected resetAll(): void;
    onsubmit(e: SubmitEvent): void;
    /**
     * The cheat sheet is a reference; this is a form. Focusing the first control
     * would start it recording, so leave focus where the modal put it.
     */
    onready(): void;
}
