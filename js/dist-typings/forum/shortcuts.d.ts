import type ShortcutManager from './ShortcutManager';
import ListCursor from './states/ListCursor';
/**
 * Cursors for the two lists that can be walked with `j`/`k`. They are module
 * level because a cursor outlives any one component: the discussion list is
 * re-rendered constantly, and the post stream loads in around the reader.
 */
export declare const discussionCursor: ListCursor;
export declare const postCursor: ListCursor;
/**
 * Every shortcut this extension ships, in the order they are listed.
 *
 * Handlers deliberately prefer core's own state objects and controls over
 * poking at the DOM: `app.composer`, `PostStreamState`, `DiscussionControls`
 * and so on already handle permissions, loading and history for us.
 */
export default function registerShortcuts(manager: ShortcutManager): void;
/**
 * The accessible name for the cheat sheet, used by the modal and the settings
 * page alike.
 */
export declare function cheatSheetTitle(): string;
