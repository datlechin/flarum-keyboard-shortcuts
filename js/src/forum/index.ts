import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Page from 'flarum/common/components/Page';

import ShortcutManager from './ShortcutManager';
import registerShortcuts, { discussionCursor, postCursor } from './shortcuts';
import addShortcutsToSettingsPage from './addShortcutsToSettingsPage';

export { default as extend } from './extend';

export { default as ShortcutManager, isEditable } from './ShortcutManager';
export { default as ListCursor } from './states/ListCursor';
export { default as KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
export { default as CustomizeShortcutsModal } from './components/CustomizeShortcutsModal';
export { default as KeyCombo } from '../common/components/KeyCombo';
export { default as ShortcutRecorder } from '../common/components/ShortcutRecorder';
export * from '../common/utils/keystroke';
export * from '../common/config';
export type { Shortcut, ShortcutResult } from '../common/types';

declare module 'flarum/forum/ForumApplication' {
  export default interface ForumApplication {
    shortcuts: ShortcutManager;
  }
}

app.initializers.add('datlechin/flarum-keyboard-shortcuts', () => {
  app.shortcuts = new ShortcutManager();

  registerShortcuts(app.shortcuts);

  app.shortcuts.start();

  addShortcutsToSettingsPage();

  extend(Page.prototype, 'oninit', function () {
    // Core replaces `app.current` in `Page.oninit`, so this records the page
    // instance on the state it has just created. Shortcuts that want to reuse
    // a page's own action — "mark all as read", say — need the instance, and
    // core keeps only the class.
    app.current.set('currentPage', this);

    // A cursor points at elements that the outgoing page owned.
    discussionCursor.clear();
    postCursor.clear();
  });
});
