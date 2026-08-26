<?php

/*
 * This file is part of datlechin/flarum-keyboard-shortcuts.
 *
 * Copyright (c) 2021 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\KeyboardShortcuts\Api;

use Datlechin\KeyboardShortcuts\Shortcuts;
use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;

/**
 * Adds the resolved shortcut configuration to the forum document, so the forum
 * frontend can boot its shortcut manager without a further request.
 *
 * Bindings are resolved server-side — forum default, then the actor's personal
 * override — so the frontend only ever deals with one flat map.
 */
class ForumAttributes
{
    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {
    }

    /**
     * @return array<Schema\Attribute>
     */
    public function __invoke(): array
    {
        return [
            // The bindings this actor should listen for: the forum's, with
            // their own overrides applied.
            Schema\Arr::make('keyboardShortcuts')
                ->get(fn (mixed $forum, Context $context) => $this->bindings($context->getActor())),

            // The forum's bindings before any personal override — what
            // resetting a personal binding returns to.
            Schema\Arr::make('keyboardShortcutForumBindings')
                ->get(fn () => $this->forumBindings()),

            // The bindings this extension ships — what resetting a forum-wide
            // binding returns to, and the catalogue the admin page renders.
            Schema\Arr::make('keyboardShortcutDefaults')
                ->get(fn () => Shortcuts::defaults()),

            Schema\Arr::make('keyboardShortcutGroups')
                ->get(fn () => Shortcuts::groups()),

            Schema\Boolean::make('canCustomizeKeyboardShortcuts')
                ->get(fn (mixed $forum, Context $context) => $this->allowsCustomization() && $context->getActor()->exists),

            Schema\Boolean::make('keyboardShortcutsEnabled')
                ->get(fn (mixed $forum, Context $context) => $this->enabledFor($context->getActor())),

            Schema\Integer::make('keyboardShortcutSequenceTimeout')
                ->get(fn () => $this->sequenceTimeout()),
        ];
    }

    /**
     * The bindings this actor should actually be listening for: the forum-wide
     * configuration with the actor's personal overrides applied on top.
     *
     * @return array<string, string>
     */
    protected function bindings(User $actor): array
    {
        $bindings = $this->forumBindings();

        if (! $this->allowsCustomization() || ! $actor->exists) {
            return $bindings;
        }

        $overrides = $actor->getPreference(Shortcuts::PREFERENCE_BINDINGS);

        if (! is_array($overrides)) {
            return $bindings;
        }

        foreach ($overrides as $id => $binding) {
            // An override for a shortcut we no longer ship is stale; drop it
            // rather than leaking an unknown id into the frontend's registry.
            if (! is_string($id) || ! Shortcuts::has($id)) {
                continue;
            }

            $bindings[$id] = Shortcuts::normalizeBinding($binding);
        }

        return $bindings;
    }

    /**
     * The forum-wide bindings, as configured by an administrator.
     *
     * @return array<string, string>
     */
    protected function forumBindings(): array
    {
        $bindings = [];

        foreach (Shortcuts::defaults() as $id => $default) {
            $bindings[$id] = Shortcuts::normalizeBinding(
                $this->settings->get(Shortcuts::settingKey($id), $default)
            );
        }

        return $bindings;
    }

    protected function allowsCustomization(): bool
    {
        return (bool) $this->settings->get(Shortcuts::SETTING_ALLOW_CUSTOMIZATION, true);
    }

    /**
     * Whether shortcuts are active for this actor. Guests follow the forum
     * default; members may opt in or out for themselves.
     */
    protected function enabledFor(User $actor): bool
    {
        $default = (bool) $this->settings->get(Shortcuts::SETTING_ENABLED_BY_DEFAULT, true);

        if (! $actor->exists) {
            return $default;
        }

        $preference = $actor->getPreference(Shortcuts::PREFERENCE_ENABLED);

        return $preference === null ? $default : (bool) $preference;
    }

    /**
     * How long (ms) a multi-step sequence such as `g h` may stay unfinished
     * before the buffer is discarded.
     */
    protected function sequenceTimeout(): int
    {
        $timeout = (int) $this->settings->get(Shortcuts::SETTING_SEQUENCE_TIMEOUT, 1000);

        return max(250, min(5000, $timeout ?: 1000));
    }
}
