/**
 * The settings/preference namespace shared by the backend and both frontends.
 */
export const PREFIX = 'datlechin-keyboard-shortcuts.';

export const SETTINGS = {
  enabledByDefault: `${PREFIX}enabled_by_default`,
  allowCustomization: `${PREFIX}allow_customization`,
  sequenceTimeout: `${PREFIX}sequence_timeout`,
} as const;

export const PREFERENCES = {
  enabled: `${PREFIX}enabled`,
  bindings: `${PREFIX}bindings`,
} as const;

/**
 * The order groups are rendered in, matching `Shortcuts::GROUPS` on the
 * backend. Anything registered under an unknown group is appended after these.
 */
export const GROUP_ORDER = ['global', 'navigation', 'discussionList', 'discussion', 'composer'];

/**
 * The setting key holding the forum-wide binding for a shortcut.
 */
export function settingKey(id: string): string {
  return PREFIX + id;
}

/**
 * Translate a key within this extension's locale namespace.
 */
export function trans(key: string, params?: Record<string, unknown>) {
  return app.translator.trans(PREFIX + key, params as any);
}

/**
 * Translate a key only if it exists, otherwise return `fallback`.
 *
 * Used for parts that extensions can contribute to — a group name, say — where
 * a missing translation is expected rather than a bug, so `trans` would fill
 * the console with warnings that mean nothing to the reader.
 */
export function transIfExists(key: string, fallback: string) {
  return PREFIX + key in app.translator.translations ? trans(key) : fallback;
}
