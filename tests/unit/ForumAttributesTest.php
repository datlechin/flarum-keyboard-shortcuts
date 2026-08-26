<?php

/*
 * This file is part of datlechin/flarum-keyboard-shortcuts.
 *
 * Copyright (c) 2021 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\KeyboardShortcuts\Tests\unit;

use Datlechin\KeyboardShortcuts\Api\ForumAttributes;
use Datlechin\KeyboardShortcuts\Preference\NormalizeBindings;
use Datlechin\KeyboardShortcuts\Shortcuts;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\Testing\unit\TestCase;
use Flarum\User\User;

class ForumAttributesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Register the preferences that `Extend\User` registers at boot, so
        // user models here behave as they do on a running forum.
        User::registerPreference(Shortcuts::PREFERENCE_ENABLED, 'boolval', null);
        User::registerPreference(Shortcuts::PREFERENCE_BINDINGS, new NormalizeBindings(), []);
    }

    public function test_it_exposes_the_attributes_the_frontends_read(): void
    {
        $names = array_map(fn ($field) => $field->name, (new ForumAttributes($this->settings()))());

        $this->assertSame([
            'keyboardShortcuts',
            'keyboardShortcutForumBindings',
            'keyboardShortcutDefaults',
            'keyboardShortcutGroups',
            'canCustomizeKeyboardShortcuts',
            'keyboardShortcutsEnabled',
            'keyboardShortcutSequenceTimeout',
        ], $names);
    }

    public function test_an_unconfigured_forum_uses_the_shipped_defaults(): void
    {
        $this->assertSame(Shortcuts::defaults(), $this->probe()->forumBindings());
    }

    public function test_an_administrator_binding_is_normalised(): void
    {
        $probe = $this->probe([Shortcuts::settingKey('reply') => 'SHIFT+R  ']);

        $this->assertSame('shift+r', $probe->forumBindings()['reply']);
    }

    public function test_an_unusable_administrator_binding_switches_the_shortcut_off(): void
    {
        $probe = $this->probe([Shortcuts::settingKey('search') => 'not a chord!!']);

        $this->assertSame('', $probe->forumBindings()['search']);
    }

    public function test_a_personal_override_wins_over_the_forum_binding(): void
    {
        $bindings = $this->probe()->bindings($this->member([Shortcuts::PREFERENCE_BINDINGS => ['reply' => 'a']]));

        $this->assertSame('a', $bindings['reply']);
    }

    public function test_shortcuts_without_an_override_keep_following_the_forum(): void
    {
        $probe = $this->probe([Shortcuts::settingKey('search') => 'shift+k']);
        $bindings = $probe->bindings($this->member([Shortcuts::PREFERENCE_BINDINGS => ['reply' => 'a']]));

        $this->assertSame('shift+k', $bindings['search']);
    }

    public function test_an_override_for_a_shortcut_that_no_longer_exists_is_dropped(): void
    {
        $member = $this->member([Shortcuts::PREFERENCE_BINDINGS => ['reply' => 'a', 'removedLongAgo' => 'b']]);

        $this->assertArrayNotHasKey('removedLongAgo', $this->probe()->bindings($member));
    }

    public function test_guests_get_the_forum_bindings(): void
    {
        $guest = new User();
        $guest->exists = false;

        $this->assertSame(Shortcuts::defaults(), $this->probe()->bindings($guest));
    }

    public function test_overrides_are_ignored_when_the_forum_forbids_customising(): void
    {
        $probe = $this->probe([Shortcuts::SETTING_ALLOW_CUSTOMIZATION => false]);
        $bindings = $probe->bindings($this->member([Shortcuts::PREFERENCE_BINDINGS => ['reply' => 'a']]));

        $this->assertSame(Shortcuts::defaults()['reply'], $bindings['reply']);
    }

    public function test_shortcuts_are_on_by_default(): void
    {
        $guest = new User();
        $guest->exists = false;

        $this->assertTrue($this->probe()->enabledFor($guest));
        $this->assertTrue($this->probe()->enabledFor($this->member()));
    }

    public function test_a_member_who_has_never_chosen_follows_the_forum(): void
    {
        // The regression this guards: giving the preference a default of `true`
        // rather than `null` makes every member override a forum default of off.
        $probe = $this->probe([Shortcuts::SETTING_ENABLED_BY_DEFAULT => false]);

        $this->assertFalse($probe->enabledFor($this->member()));
    }

    public function test_a_member_may_choose_for_themselves(): void
    {
        $off = $this->probe([Shortcuts::SETTING_ENABLED_BY_DEFAULT => false]);

        $this->assertTrue($off->enabledFor($this->member([Shortcuts::PREFERENCE_ENABLED => true])));
        $this->assertFalse($this->probe()->enabledFor($this->member([Shortcuts::PREFERENCE_ENABLED => false])));
    }

    public function test_the_sequence_timeout_is_kept_within_reach(): void
    {
        $this->assertSame(1000, $this->probe()->sequenceTimeout());
        $this->assertSame(250, $this->probe([Shortcuts::SETTING_SEQUENCE_TIMEOUT => 10])->sequenceTimeout());
        $this->assertSame(5000, $this->probe([Shortcuts::SETTING_SEQUENCE_TIMEOUT => 999999])->sequenceTimeout());
        $this->assertSame(1000, $this->probe([Shortcuts::SETTING_SEQUENCE_TIMEOUT => 'nonsense'])->sequenceTimeout());
    }

    /**
     * The attributes class with its resolution logic made reachable.
     */
    protected function probe(array $settings = []): ForumAttributes
    {
        return new class($this->settings($settings)) extends ForumAttributes {
            public function bindings(User $actor): array
            {
                return parent::bindings($actor);
            }

            public function forumBindings(): array
            {
                return parent::forumBindings();
            }

            public function enabledFor(User $actor): bool
            {
                return parent::enabledFor($actor);
            }

            public function sequenceTimeout(): int
            {
                return parent::sequenceTimeout();
            }
        };
    }

    protected function member(array $preferences = []): User
    {
        $user = new User();
        $user->exists = true;

        foreach ($preferences as $key => $value) {
            $user->setPreference($key, $value);
        }

        return $user;
    }

    protected function settings(array $values = []): SettingsRepositoryInterface
    {
        return new class($values) implements SettingsRepositoryInterface {
            public function __construct(private array $values)
            {
            }

            public function get(string $key, mixed $default = null): mixed
            {
                return $this->values[$key] ?? $default;
            }

            public function set(string $key, mixed $value): void
            {
                $this->values[$key] = $value;
            }

            public function delete(string $keyLike): void
            {
                unset($this->values[$keyLike]);
            }

            public function all(): array
            {
                return $this->values;
            }
        };
    }
}
