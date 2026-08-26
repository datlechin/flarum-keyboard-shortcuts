<?php

/*
 * This file is part of datlechin/flarum-keyboard-shortcuts.
 *
 * Copyright (c) 2021 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\KeyboardShortcuts;

/**
 * The canonical catalogue of shortcuts shipped by this extension.
 *
 * Both frontends read their bindings from the forum API document, which is
 * built from this class, so the defaults never have to be repeated in JS. A
 * shortcut is identified by a stable camelCase id; the admin-configured
 * binding for it lives in the settings table under `PREFIX . id`.
 */
final class Shortcuts
{
    public const PREFIX = 'datlechin-keyboard-shortcuts.';

    public const SETTING_ENABLED_BY_DEFAULT = self::PREFIX.'enabled_by_default';
    public const SETTING_ALLOW_CUSTOMIZATION = self::PREFIX.'allow_customization';
    public const SETTING_SEQUENCE_TIMEOUT = self::PREFIX.'sequence_timeout';

    public const PREFERENCE_ENABLED = self::PREFIX.'enabled';
    public const PREFERENCE_BINDINGS = self::PREFIX.'bindings';

    /**
     * Groups are rendered as separate sections, in this order, by both the
     * cheat sheet and the admin page.
     */
    public const GROUPS = ['global', 'navigation', 'discussionList', 'discussion', 'composer'];

    private const MAX_BINDING_LENGTH = 64;

    /**
     * The modifier names a chord may carry. `mod` resolves in the frontend to
     * Command on Apple devices and Control everywhere else.
     */
    private const MODIFIERS = ['mod', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift', 'meta', 'cmd', 'command', 'super', 'win', 'windows'];

    /**
     * Keys that are named rather than typed. Mirrors the names the frontend's
     * parser accepts (see `js/src/common/utils/keystroke.ts`); anything else
     * must be a single character.
     */
    private const NAMED_KEYS = [
        'enter', 'return', 'escape', 'esc', 'space', 'spacebar', 'tab', 'backspace',
        'delete', 'del', 'insert', 'ins', 'home', 'end',
        'up', 'down', 'left', 'right',
        'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
        'pgup', 'pgdn', 'pageup', 'pagedown',
        'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
    ];

    /**
     * @var array<string, array{group: string, default: string}>
     */
    private const DEFINITIONS = [
        // Global — available on every page.
        'help' => ['group' => 'global', 'default' => '?'],
        'search' => ['group' => 'global', 'default' => '/'],
        'newDiscussion' => ['group' => 'global', 'default' => 'c'],
        'notifications' => ['group' => 'global', 'default' => 'n'],
        'flags' => ['group' => 'global', 'default' => 'shift+f'],
        'session' => ['group' => 'global', 'default' => 'u'],
        'login' => ['group' => 'global', 'default' => 'shift+l'],
        'signup' => ['group' => 'global', 'default' => 'shift+s'],
        'toggleTheme' => ['group' => 'global', 'default' => 'shift+t'],
        'back' => ['group' => 'global', 'default' => 'backspace'],

        // Navigation — `g`-prefixed sequences, in the tradition of GitHub/Gmail.
        'goHome' => ['group' => 'navigation', 'default' => 'g h'],
        'goNotifications' => ['group' => 'navigation', 'default' => 'g n'],
        'goProfile' => ['group' => 'navigation', 'default' => 'g p'],
        'goSettings' => ['group' => 'navigation', 'default' => 'g s'],

        // Discussion list.
        'nextDiscussion' => ['group' => 'discussionList', 'default' => 'j'],
        'previousDiscussion' => ['group' => 'discussionList', 'default' => 'k'],
        'openDiscussion' => ['group' => 'discussionList', 'default' => 'enter'],
        'markAllAsRead' => ['group' => 'discussionList', 'default' => 'shift+m'],
        'refresh' => ['group' => 'discussionList', 'default' => 'shift+r'],

        // Discussion page.
        'reply' => ['group' => 'discussion', 'default' => 'r'],
        'follow' => ['group' => 'discussion', 'default' => 'f'],
        'nextPost' => ['group' => 'discussion', 'default' => 'j'],
        'previousPost' => ['group' => 'discussion', 'default' => 'k'],
        'firstPost' => ['group' => 'discussion', 'default' => 'o'],
        'lastPost' => ['group' => 'discussion', 'default' => 'l'],
        'renameDiscussion' => ['group' => 'discussion', 'default' => 'shift+e'],
        'pinNav' => ['group' => 'discussion', 'default' => 'alt+p'],

        // Composer.
        'toggleFullScreen' => ['group' => 'composer', 'default' => 'mod+shift+f'],
        'minimizeComposer' => ['group' => 'composer', 'default' => 'mod+shift+m'],
    ];

    /**
     * @return list<string>
     */
    public static function ids(): array
    {
        return array_keys(self::DEFINITIONS);
    }

    public static function has(string $id): bool
    {
        return isset(self::DEFINITIONS[$id]);
    }

    public static function group(string $id): ?string
    {
        return self::DEFINITIONS[$id]['group'] ?? null;
    }

    public static function settingKey(string $id): string
    {
        return self::PREFIX.$id;
    }

    /**
     * The default binding map, keyed by *setting key*, ready to be handed to
     * `Extend\Settings::default()`.
     *
     * @return array<string, string>
     */
    public static function settingDefaults(): array
    {
        $defaults = [];

        foreach (self::DEFINITIONS as $id => $definition) {
            $defaults[self::settingKey($id)] = $definition['default'];
        }

        return $defaults;
    }

    /**
     * The default binding map, keyed by shortcut id.
     *
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return array_map(fn (array $definition) => $definition['default'], self::DEFINITIONS);
    }

    /**
     * The group each shortcut belongs to, keyed by shortcut id. Sent to the
     * frontend so groups stay defined in exactly one place.
     *
     * @return array<string, string>
     */
    public static function groups(): array
    {
        return array_map(fn (array $definition) => $definition['group'], self::DEFINITIONS);
    }

    /**
     * Coerce an arbitrary stored value into a safe binding string.
     *
     * Bindings arrive from the settings table and from user preferences, so
     * they are validated structurally rather than merely filtered: an
     * alternative that isn't a well-formed chord sequence is dropped, and a
     * value with nothing left is stored as the empty string — which the
     * frontend reads as "this shortcut is switched off".
     */
    public static function normalizeBinding(mixed $value): string
    {
        if (! is_string($value) || mb_strlen($value) > self::MAX_BINDING_LENGTH) {
            return '';
        }

        $alternatives = [];

        foreach (explode(',', strtolower($value)) as $alternative) {
            $chords = preg_split('/\s+/', trim($alternative), -1, PREG_SPLIT_NO_EMPTY) ?: [];

            if (! $chords) {
                continue;
            }

            foreach ($chords as $chord) {
                if (! self::isValidChord($chord)) {
                    continue 2;
                }
            }

            $alternatives[] = implode(' ', $chords);
        }

        return implode(', ', $alternatives);
    }

    /**
     * Whether a chord is any number of modifiers plus exactly one key.
     */
    private static function isValidChord(string $chord): bool
    {
        $tokens = explode('+', $chord);
        $count = count($tokens);
        $keys = 0;

        foreach ($tokens as $index => $token) {
            // `mod++` means "the primary modifier and the plus key": the empty
            // token is the separator we just consumed, and the trailing one is
            // the other half of it.
            if ($token === '') {
                if ($index === $count - 1 && $index > 0 && $tokens[$index - 1] === '') {
                    continue;
                }

                $keys++;

                continue;
            }

            if (in_array($token, self::MODIFIERS, true)) {
                continue;
            }

            if (mb_strlen($token) !== 1 && ! in_array($token, self::NAMED_KEYS, true)) {
                return false;
            }

            $keys++;
        }

        return $keys === 1;
    }
}
