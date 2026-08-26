import type Mithril from 'mithril';
export interface ShortcutDescriptor {
    id: string;
    group: string;
    /**
     * The binding this extension ships — what resetting returns to.
     */
    default: string;
}
/**
 * The shortcut catalogue, read from the forum API document.
 *
 * The backend is the single source of truth for which shortcuts exist and what
 * they default to, so the admin page never has to be kept in step with
 * `Shortcuts.php` by hand.
 */
export declare function shortcuts(): ShortcutDescriptor[];
/**
 * The catalogue grouped for display, with the known groups in their canonical
 * order and anything else appended in the order it was declared.
 */
export declare function shortcutGroups(): [string, ShortcutDescriptor[]][];
/**
 * The description of a shortcut. Ids are camelCase, locale keys are snake_case.
 */
export declare function shortcutLabel(shortcut: ShortcutDescriptor | string): Mithril.Children;
