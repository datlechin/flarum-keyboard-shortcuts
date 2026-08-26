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

use Flarum\Api\Resource\ForumResource;
use Flarum\Extend;

$settings = (new Extend\Settings())
    ->default(Shortcuts::SETTING_ENABLED_BY_DEFAULT, true)
    ->default(Shortcuts::SETTING_ALLOW_CUSTOMIZATION, true)
    ->default(Shortcuts::SETTING_SEQUENCE_TIMEOUT, 1000);

// Registering the shipped bindings as PHP-side defaults (rather than seeding
// them with a migration) is what makes the admin page's "reset" button work:
// deleting the row falls back to the value defined here.
foreach (Shortcuts::settingDefaults() as $key => $default) {
    $settings = $settings->default($key, $default);
}

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    new Extend\Locales(__DIR__.'/locale'),

    $settings,

    (new Extend\ApiResource(ForumResource::class))
        ->fields(Api\ForumAttributes::class),

    (new Extend\User())
        // The default is deliberately null rather than true: it is what
        // distinguishes "this member has never chosen" from "this member has
        // switched shortcuts off", and only the former should follow the
        // forum-wide setting.
        ->registerPreference(Shortcuts::PREFERENCE_ENABLED, 'boolval', null)
        ->registerPreference(Shortcuts::PREFERENCE_BINDINGS, new Preference\NormalizeBindings(), []),
];
