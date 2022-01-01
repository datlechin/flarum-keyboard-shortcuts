export default function setting(key) {
  const packagePrefix = 'datlechin-keyboard-shortcuts.';
  const value = app.forum.attribute(packagePrefix + key);

  return value;
}
