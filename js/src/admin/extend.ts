import Extend from 'flarum/common/extenders';
import extractText from 'flarum/common/utils/extractText';

import { SETTINGS, trans, transIfExists } from '../common/config';
import KeyboardShortcutsPage from './components/KeyboardShortcutsPage';
import { shortcutGroups, shortcutLabel } from './catalogue';

export default [
  new Extend.Admin()
    .page(KeyboardShortcutsPage)
    // Every binding is reachable from the admin search, so an administrator
    // looking for "mark all as read" finds the shortcut without knowing which
    // extension owns it.
    .generalIndexItems('settings', () => [
      {
        id: SETTINGS.enabledByDefault,
        label: extractText(trans('admin.enabled_by_default_label')),
        help: extractText(trans('admin.enabled_by_default_help')),
      },
      {
        id: SETTINGS.allowCustomization,
        label: extractText(trans('admin.allow_customization_label')),
        help: extractText(trans('admin.allow_customization_help')),
      },
      {
        id: SETTINGS.sequenceTimeout,
        label: extractText(trans('admin.sequence_timeout_label')),
        help: extractText(trans('admin.sequence_timeout_help')),
      },
      ...shortcutGroups().flatMap(([group, shortcuts]) =>
        shortcuts.map((shortcut) => ({
          id: shortcut.id,
          tree: [extractText(transIfExists(`lib.groups.${group}`, group))],
          label: extractText(shortcutLabel(shortcut)),
        }))
      ),
    ]),
];
