import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import FieldSet from 'flarum/common/components/FieldSet';
import Switch from 'flarum/common/components/Switch';
import KeyCombo from '../common/components/KeyCombo';

import { PREFERENCES, trans } from '../common/config';
import CustomizeShortcutsModal from './components/CustomizeShortcutsModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

// Type-only: the class itself must not be imported for value use — see below.
import type SettingsPage from 'flarum/forum/components/SettingsPage';

/**
 * The page instance while its shortcut preference is being saved. Kept on the
 * page rather than in module scope so two settings pages can't share a spinner.
 */
type PageWithLoading = SettingsPage & { keyboardShortcutsLoading?: boolean };

/**
 * Adds a "Keyboard shortcuts" section to the user's settings page.
 *
 * The cheat sheet is discoverable by pressing `?`, which is no help to someone
 * who doesn't know that yet — so the settings page both teaches the key and is
 * where shortcuts get switched off or rebound.
 */
export default function addShortcutsToSettingsPage(): void {
  // `SettingsPage` lives in its own lazily-loaded chunk, so it is not in the
  // registry when initializers run and `SettingsPage.prototype` would throw.
  // Passing the module path instead defers the patch until the chunk loads —
  // or applies it immediately if it already has.
  extend<PageWithLoading, 'settingsItems'>('flarum/forum/components/SettingsPage', 'settingsItems', function (items) {
    const canCustomize = app.forum.attribute<boolean>('canCustomizeKeyboardShortcuts');
    const helpKey = app.shortcuts.binding('help');

    items.add(
      'keyboardShortcuts',
      <FieldSet className="Settings-keyboardShortcuts" label={trans('forum.settings.heading')}>
        <Switch state={app.shortcuts.enabled()} loading={!!this.keyboardShortcutsLoading} onchange={(enabled: boolean) => saveEnabled(this, enabled)}>
          {trans('forum.settings.enabled_label')}
          {/* Teaching the key here is the whole point of the section: it is the
              one place someone who does not yet know about `?` will meet it. */}
          {!!helpKey && (
            <div className="helpText Settings-keyboardShortcuts-hint">{trans('forum.settings.help', { key: <KeyCombo binding={helpKey} /> })}</div>
          )}
        </Switch>

        <div className="Settings-keyboardShortcuts-controls">
          <Button className="Button" icon="fas fa-keyboard" onclick={() => app.modal.show(KeyboardShortcutsModal)}>
            {trans('forum.settings.view_button')}
          </Button>

          {canCustomize && (
            <Button className="Button" icon="fas fa-sliders" onclick={() => app.modal.show(CustomizeShortcutsModal)}>
              {trans('forum.settings.customize_button')}
            </Button>
          )}
        </div>
      </FieldSet>,
      -10
    );
  });
}

function saveEnabled(page: PageWithLoading, enabled: boolean): void {
  if (!app.session.user) return;

  page.keyboardShortcutsLoading = true;

  app.session.user
    .savePreferences({ [PREFERENCES.enabled]: enabled })
    .catch(() => {})
    .then(() => {
      page.keyboardShortcutsLoading = false;
      m.redraw();
    });
}
