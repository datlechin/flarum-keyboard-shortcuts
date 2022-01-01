import app from 'flarum/admin/app';
import KeyboardShortcutsPage from './components/KeyboardShortcutsPage';

app.initializers.add('datlechin/flarum-keyboard-shortcuts', () => {
  app.extensionData.for('datlechin-keyboard-shortcuts').registerPage(KeyboardShortcutsPage);
});
