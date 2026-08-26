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

use Datlechin\KeyboardShortcuts\Preference\NormalizeBindings;
use Flarum\Testing\unit\TestCase;

class NormalizeBindingsTest extends TestCase
{
    protected NormalizeBindings $transform;

    protected function setUp(): void
    {
        parent::setUp();

        $this->transform = new NormalizeBindings();
    }

    public function test_it_keeps_bindings_for_shortcuts_that_exist(): void
    {
        $this->assertSame(['help' => 'ctrl+k'], ($this->transform)(['help' => 'CTRL+K']));
    }

    public function test_it_drops_ids_it_does_not_recognise(): void
    {
        // These arrive straight from a user-controlled request body, so an
        // unknown id is either stale or hostile; neither should reach the
        // frontend's registry.
        $this->assertSame([], ($this->transform)(['notAShortcut' => 'k']));
    }

    public function test_it_switches_off_a_shortcut_given_an_unusable_binding(): void
    {
        $this->assertSame(['reply' => ''], ($this->transform)(['reply' => ['an', 'array']]));
        $this->assertSame(['reply' => ''], ($this->transform)(['reply' => 'a+b']));
    }

    public function test_it_reads_a_json_encoded_map(): void
    {
        $this->assertSame(['reply' => 'a'], ($this->transform)('{"reply":"a"}'));
    }

    public function test_it_yields_an_empty_map_for_anything_that_is_not_one(): void
    {
        $this->assertSame([], ($this->transform)(null));
        $this->assertSame([], ($this->transform)(42));
        $this->assertSame([], ($this->transform)('not json'));
    }
}
