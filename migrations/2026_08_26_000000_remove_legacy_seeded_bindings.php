<?php

/*
 * This file is part of datlechin/flarum-keyboard-shortcuts.
 *
 * Copyright (c) 2021 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Illuminate\Database\Schema\Builder;

/**
 * Bindings used to be seeded into the settings table by a migration. They are
 * now PHP-side defaults, which is what lets the admin page reset a shortcut by
 * deleting its row.
 *
 * This migration clears out the seeded rows so the new defaults take effect —
 * but only where the stored value is still the one the old migration wrote. A
 * row an administrator actually edited is left exactly as it is.
 */
return [
    'up' => function (Builder $schema) {
        $legacyDefaults = [
            'help' => 'h',
            'search' => 's',
            'newDiscussion' => 'shift+d',
            'notifications' => 'shift+n',
            'flags' => 'shift+f',
            'session' => 'shift+u',
            'login' => 'shift+l',
            'signup' => 'shift+s',
            'back' => 'backspace',
            'pinNav' => 'alt+p',
            'reply' => 'r',
            'follow' => 'f',
            'firstPost' => 'o',
            'lastPost' => 'l',
            'markAllAsRead' => 'shift+m',
            'refresh' => 'shift+r',
        ];

        $connection = $schema->getConnection();

        foreach ($legacyDefaults as $id => $value) {
            $connection->table('settings')
                ->where('key', 'datlechin-keyboard-shortcuts.'.$id)
                ->where('value', $value)
                ->delete();
        }
    },

    // Irreversible by design: the rows carried no information that isn't
    // already expressed by the defaults in Shortcuts.php, so there is nothing
    // meaningful to restore.
    'down' => function (Builder $schema) {
    },
];
