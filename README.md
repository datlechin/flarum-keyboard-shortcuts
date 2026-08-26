# Keyboard Shortcuts

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/datlechin/flarum-keyboard-shortcuts.svg)](https://packagist.org/packages/datlechin/flarum-keyboard-shortcuts) [![Total Downloads](https://img.shields.io/packagist/dt/datlechin/flarum-keyboard-shortcuts.svg)](https://packagist.org/packages/datlechin/flarum-keyboard-shortcuts)

A [Flarum](http://flarum.org) extension. Navigate your forum without touching the mouse.

Press <kbd>?</kbd> anywhere on the forum for the full list.

<!--
  Absolute URLs rather than relative paths: `screenshots/` is `export-ignore`d,
  so it is absent from the Composer package, and Flarum's admin README modal
  renders the README from that package. Each image is captured at 2× and shown
  at half its pixel width, so it stays sharp on a retina display.
-->
<img src="https://raw.githubusercontent.com/datlechin/flarum-keyboard-shortcuts/master/screenshots/forum-shortcuts.png" alt="The cheat sheet open over the forum, listing every shortcut grouped by where it applies" width="1280">

Members can rebind any shortcut for themselves, one group at a time.

<img src="https://raw.githubusercontent.com/datlechin/flarum-keyboard-shortcuts/master/screenshots/forum-customise.png" alt="The customisation form, with a tab per group and a recorder field per shortcut" width="1280">

Administrators set the forum-wide bindings by pressing the keys they mean.

<img src="https://raw.githubusercontent.com/datlechin/flarum-keyboard-shortcuts/master/screenshots/admin-settings.png" alt="The admin page: behaviour settings in a card, and a table of every binding" width="1150">

## Installation

```sh
composer require datlechin/flarum-keyboard-shortcuts:"*"
```

## Updating

```sh
composer update datlechin/flarum-keyboard-shortcuts:"*"
php flarum migrate
php flarum cache:clear
```

## Shortcuts

Every binding below is a default: administrators can change them for the whole
forum, and members can then rebind any of them for themselves.

### Anywhere

| Shortcut | Action |
| --- | --- |
| <kbd>?</kbd> | Show keyboard shortcuts |
| <kbd>/</kbd> | Search |
| <kbd>C</kbd> | Start a discussion |
| <kbd>N</kbd> | Toggle notifications |
| <kbd>Shift</kbd> <kbd>F</kbd> | Toggle flags |
| <kbd>U</kbd> | Toggle the user menu |
| <kbd>Shift</kbd> <kbd>L</kbd> | Log in |
| <kbd>Shift</kbd> <kbd>S</kbd> | Sign up |
| <kbd>Shift</kbd> <kbd>T</kbd> | Switch colour scheme |
| <kbd>Backspace</kbd> | Go back |

### Go to

| Shortcut | Action |
| --- | --- |
| <kbd>G</kbd> then <kbd>H</kbd> | All discussions |
| <kbd>G</kbd> then <kbd>N</kbd> | Notifications |
| <kbd>G</kbd> then <kbd>P</kbd> | Your profile |
| <kbd>G</kbd> then <kbd>S</kbd> | Your settings |

### Discussion list

| Shortcut | Action |
| --- | --- |
| <kbd>J</kbd> | Next discussion |
| <kbd>K</kbd> | Previous discussion |
| <kbd>Enter</kbd> | Open the selected discussion |
| <kbd>Shift</kbd> <kbd>M</kbd> | Mark all as read |
| <kbd>Shift</kbd> <kbd>R</kbd> | Refresh the list |

### Discussion

| Shortcut | Action |
| --- | --- |
| <kbd>R</kbd> | Reply |
| <kbd>F</kbd> | Follow or unfollow |
| <kbd>J</kbd> | Next post |
| <kbd>K</kbd> | Previous post |
| <kbd>O</kbd> | Jump to the first post |
| <kbd>L</kbd> | Jump to the last post |
| <kbd>Shift</kbd> <kbd>E</kbd> | Rename the discussion |
| <kbd>Alt</kbd> <kbd>P</kbd> | Pin or unpin the discussion list |

### Composer

| Shortcut | Action |
| --- | --- |
| <kbd>Mod</kbd> <kbd>Shift</kbd> <kbd>F</kbd> | Toggle full screen |
| <kbd>Mod</kbd> <kbd>Shift</kbd> <kbd>M</kbd> | Minimise the composer |

`Mod` is <kbd>⌘</kbd> on Apple devices and <kbd>Ctrl</kbd> everywhere else.

## Configuration

**Administrators** configure the forum-wide bindings on the extension's page,
by pressing the keys they want rather than typing them out. The page also
carries three settings:

- whether shortcuts are on by default;
- whether members may choose their own keys;
- how long a multi-step shortcut waits for its next key.

**Members** can turn shortcuts off, and rebind any of them, from their settings
page or from the cheat sheet. Only the bindings they actually change are
stored, so everything else keeps following the forum — including later changes
an administrator makes.

## For extension developers

Shortcuts are registered through `app.shortcuts`, which is a
`ShortcutManager`. Adding one is enough to have it appear in the cheat sheet,
in the customisation form, and in the matcher:

```js
import { extend } from 'flarum/common/extend';
import ShortcutManager from '@datlechin/flarum-keyboard-shortcuts/forum/ShortcutManager';

extend(ShortcutManager.prototype, 'shortcutItems', function (items) {
  items.add('acme.jumpToTag', {
    id: 'acme.jumpToTag',
    group: 'navigation',
    label: () => app.translator.trans('acme-tags.forum.shortcuts.jump_to_tag'),
    defaultBinding: 'g t',
    when: () => app.current.matches(IndexPage),
    action: () => m.route.set(app.route('tags')),
  });
});
```

A shortcut's `action` may return `false` to decline a key press, which leaves
the browser's own behaviour intact. `when` scopes it to a page, `allowInInput`
lets it fire while text is being typed, and `visible` keeps it out of the cheat
sheet when it does not apply.

Namespace your ids (`acme-tags.jumpToTag`), since they are the storage keys for
personal bindings.

## Links

- [Packagist](https://packagist.org/packages/datlechin/flarum-keyboard-shortcuts)
- [GitHub](https://github.com/datlechin/flarum-keyboard-shortcuts)
- [Discuss](https://discuss.flarum.org/d/29773)
