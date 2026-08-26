/**
 * The settings/preference namespace shared by the backend and both frontends.
 */
export declare const PREFIX = "datlechin-keyboard-shortcuts.";
export declare const SETTINGS: {
    readonly enabledByDefault: "datlechin-keyboard-shortcuts.enabled_by_default";
    readonly allowCustomization: "datlechin-keyboard-shortcuts.allow_customization";
    readonly sequenceTimeout: "datlechin-keyboard-shortcuts.sequence_timeout";
};
export declare const PREFERENCES: {
    readonly enabled: "datlechin-keyboard-shortcuts.enabled";
    readonly bindings: "datlechin-keyboard-shortcuts.bindings";
};
/**
 * The order groups are rendered in, matching `Shortcuts::GROUPS` on the
 * backend. Anything registered under an unknown group is appended after these.
 */
export declare const GROUP_ORDER: string[];
/**
 * The setting key holding the forum-wide binding for a shortcut.
 */
export declare function settingKey(id: string): string;
/**
 * Translate a key within this extension's locale namespace.
 */
export declare function trans(key: string, params?: Record<string, unknown>): any[];
/**
 * Translate a key only if it exists, otherwise return `fallback`.
 *
 * Used for parts that extensions can contribute to — a group name, say — where
 * a missing translation is expected rather than a bug, so `trans` would fill
 * the console with warnings that mean nothing to the reader.
 */
export declare function transIfExists(key: string, fallback: string): string | any[];
