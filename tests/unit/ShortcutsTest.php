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

use Datlechin\KeyboardShortcuts\Shortcuts;
use Flarum\Testing\unit\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Yaml\Yaml;

class ShortcutsTest extends TestCase
{
    public function test_every_shortcut_has_a_default_and_a_known_group(): void
    {
        $defaults = Shortcuts::defaults();
        $groups = Shortcuts::groups();

        foreach (Shortcuts::ids() as $id) {
            $this->assertNotEmpty($defaults[$id] ?? '', "$id has no default binding");
            $this->assertContains($groups[$id] ?? '', Shortcuts::GROUPS, "$id is in an unknown group");
        }
    }

    public function test_defaults_are_already_in_normal_form(): void
    {
        // If a shipped default did not survive normalisation, it would be
        // rewritten the first time an administrator saved the page — silently
        // changing a binding nobody touched.
        foreach (Shortcuts::defaults() as $id => $default) {
            $this->assertSame($default, Shortcuts::normalizeBinding($default), "the default for $id is not in normal form");
        }
    }

    public function test_no_two_shortcuts_in_a_group_share_a_default_binding(): void
    {
        $groups = Shortcuts::groups();
        $claims = [];

        foreach (Shortcuts::defaults() as $id => $default) {
            $key = $groups[$id].'|'.$default;

            $this->assertArrayNotHasKey($key, $claims, "$id and ".($claims[$key] ?? '')." both default to $default");

            $claims[$key] = $id;
        }
    }

    public function test_setting_keys_are_namespaced(): void
    {
        foreach (Shortcuts::settingDefaults() as $key => $default) {
            $this->assertStringStartsWith(Shortcuts::PREFIX, $key);
        }

        $this->assertCount(count(Shortcuts::ids()), Shortcuts::settingDefaults());
    }

    public function test_every_shortcut_and_group_has_a_description(): void
    {
        $locale = Yaml::parseFile(__DIR__.'/../../locale/en.yml')['datlechin-keyboard-shortcuts'];

        foreach (Shortcuts::ids() as $id) {
            $key = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '_$0', $id));

            $this->assertArrayHasKey($key, $locale['lib']['shortcuts'], "lib.shortcuts.$key is missing");
        }

        foreach (Shortcuts::GROUPS as $group) {
            $this->assertArrayHasKey($group, $locale['lib']['groups'], "lib.groups.$group is missing");
        }
    }

    #[DataProvider('bindings')]
    public function test_normalize_binding(mixed $input, string $expected, string $why): void
    {
        $this->assertSame($expected, Shortcuts::normalizeBinding($input), $why);
    }

    public static function bindings(): array
    {
        return [
            ['r', 'r', 'a bare key is left alone'],
            ['SHIFT+D', 'shift+d', 'case is normalised'],
            ['  shift+d  ', 'shift+d', 'surrounding space is trimmed'],
            ['  G   H  ', 'g h', 'the space between the steps of a sequence is collapsed'],
            ['s ,/', 's, /', 'alternatives are separated consistently'],
            ['mod++', 'mod++', 'a trailing plus is the plus key'],
            ['cmd+k', 'cmd+k', 'the spellings the frontend accepts are kept'],
            ['ctrl+shift+f5', 'ctrl+shift+f5', 'function keys are keys'],

            ['', '', 'an empty binding means the shortcut is off'],
            [null, '', 'a missing value means the shortcut is off'],
            [['array'], '', 'a non-string value means the shortcut is off'],
            ['a+b', '', 'a chord with two keys is not a chord'],
            ['shift', '', 'a chord with no key is not a chord'],
            ['a<script>', '', 'anything that is not a key name is rejected'],
            [
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                '',
                'an implausibly long value is rejected',
            ],

            ['a+b, k', 'k', 'only the malformed alternative is dropped'],
        ];
    }
}
