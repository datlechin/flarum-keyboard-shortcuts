<?php

/*
 * This file is part of datlechin/flarum-keyboard-shortcuts.
 *
 * Copyright (c) 2021 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\KeyboardShortcuts\Preference;

use Datlechin\KeyboardShortcuts\Shortcuts;

/**
 * Sanitises the per-user binding overrides before they are stored.
 *
 * Preferences are written straight from a user-controlled request body, so
 * everything here is treated as untrusted: unknown ids are dropped, values are
 * coerced to safe binding strings, and an override that merely repeats the
 * forum default is discarded so the map doesn't accumulate dead weight.
 */
class NormalizeBindings
{
    /**
     * @return array<string, string>
     */
    public function __invoke(mixed $value): array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }

        if (! is_array($value)) {
            return [];
        }

        $bindings = [];

        foreach ($value as $id => $binding) {
            if (! is_string($id) || ! Shortcuts::has($id)) {
                continue;
            }

            $bindings[$id] = Shortcuts::normalizeBinding($binding);
        }

        return $bindings;
    }
}
