import type Mithril from 'mithril';

/**
 * What a shortcut's handler returns:
 *
 *  - `false` — the shortcut declined to act, so the key press is left alone
 *    and the browser's own behaviour is preserved;
 *  - anything else — the shortcut handled the press.
 */
export type ShortcutResult = boolean | void | Promise<unknown>;

export interface Shortcut {
  /**
   * A stable identifier, unique across the forum. Shortcuts shipped by this
   * extension use bare camelCase ids; other extensions should namespace theirs
   * (`acme-tags.jumpToTag`) so that bindings never collide in storage.
   */
  id: string;

  /**
   * The section this shortcut is listed under, both in the cheat sheet and on
   * the admin page.
   */
  group: string;

  /**
   * The human-readable description. A function, so it is translated at render
   * time rather than at registration time.
   */
  label: () => Mithril.Children;

  /**
   * The binding to use when neither the administrator nor the user has set
   * one. Shortcuts shipped by this extension take theirs from the API
   * document; extensions registering their own must supply it here.
   */
  defaultBinding?: string;

  /**
   * Runs when the binding is typed.
   */
  action: (event: KeyboardEvent) => ShortcutResult;

  /**
   * Whether the shortcut applies right now — typically a page check. A
   * shortcut whose scope does not apply is skipped during matching, so the
   * same key can mean different things on different pages.
   */
  when?: () => boolean;

  /**
   * Whether the shortcut should still fire while a text field has focus.
   * Off by default, since single-letter shortcuts would otherwise make typing
   * impossible.
   */
  allowInInput?: boolean;

  /**
   * Whether the shortcut should still fire while a modal is open. Off by
   * default so that the cheat sheet and the composer's own keys win.
   */
  allowInModal?: boolean;

  /**
   * Whether to list the shortcut in the cheat sheet. Defaults to listing it.
   */
  visible?: () => boolean;
}

/**
 * A shortcut once the manager has resolved its binding and defaults.
 */
export interface RegisteredShortcut extends Shortcut {
  binding: string;
}
