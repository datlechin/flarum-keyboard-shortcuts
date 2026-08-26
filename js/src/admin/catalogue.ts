import app from 'flarum/admin/app';
import { camelCaseToSnakeCase } from 'flarum/common/utils/string';
import type Mithril from 'mithril';

import { GROUP_ORDER, trans } from '../common/config';

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
export function shortcuts(): ShortcutDescriptor[] {
  const groups = app.forum.attribute<Record<string, string>>('keyboardShortcutGroups') || {};
  const defaults = app.forum.attribute<Record<string, string>>('keyboardShortcutDefaults') || {};

  return Object.keys(groups).map((id) => ({ id, group: groups[id], default: defaults[id] ?? '' }));
}

/**
 * The catalogue grouped for display, with the known groups in their canonical
 * order and anything else appended in the order it was declared.
 */
export function shortcutGroups(): [string, ShortcutDescriptor[]][] {
  const grouped = new Map<string, ShortcutDescriptor[]>();

  for (const shortcut of shortcuts()) {
    grouped.set(shortcut.group, [...(grouped.get(shortcut.group) ?? []), shortcut]);
  }

  return [...grouped.entries()].sort(([a], [b]) => {
    const [ia, ib] = [GROUP_ORDER.indexOf(a), GROUP_ORDER.indexOf(b)];

    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;

    return ia - ib;
  });
}

/**
 * The description of a shortcut. Ids are camelCase, locale keys are snake_case.
 */
export function shortcutLabel(shortcut: ShortcutDescriptor | string): Mithril.Children {
  const id = typeof shortcut === 'string' ? shortcut : shortcut.id;

  return trans(`lib.shortcuts.${camelCaseToSnakeCase(id)}`);
}
