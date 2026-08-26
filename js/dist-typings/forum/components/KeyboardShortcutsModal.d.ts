import Modal from 'flarum/common/components/Modal';
import type { IInternalModalAttrs } from 'flarum/common/components/Modal';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type { Shortcut } from '../../common/types';
export interface IKeyboardShortcutsModalAttrs extends IInternalModalAttrs {
}
/**
 * The cheat sheet: every shortcut available to this user right now, grouped by
 * where it applies.
 *
 * It lists what is actually live — a shortcut whose extension isn't installed,
 * or that a guest can't use, isn't shown — so the sheet never promises a key
 * that would do nothing.
 *
 * A reference is for scanning, not for stepping through, so the groups sit side
 * by side rather than behind tabs: everything is visible at once on a screen
 * with the room for it, and the filter narrows it when there isn't.
 */
export default class KeyboardShortcutsModal<CustomAttrs extends IKeyboardShortcutsModalAttrs = IKeyboardShortcutsModalAttrs> extends Modal<CustomAttrs> {
    /**
     * The current filter query.
     */
    protected query: string;
    protected togglingEnabled: boolean;
    className(): string;
    title(): Mithril.Children;
    content(): Mithril.Children;
    /**
     * The modal's own footer, below the body: the controls that act on shortcuts
     * as a whole rather than on any one of them.
     */
    protected inner(): Mithril.Children;
    search(): Mithril.Children;
    /**
     * One section per group that has anything to show.
     */
    groups(): Mithril.Children[];
    group(group: string, shortcuts: Shortcut[]): Mithril.Children;
    groupLabel(group: string): Mithril.Children;
    /**
     * The shortcuts to list: bound, applicable to this user, and matching the
     * filter.
     */
    visibleShortcuts(): Shortcut[];
    footerItems(): ItemList<Mithril.Children>;
    toggleEnabled(enabled: boolean): void;
}
