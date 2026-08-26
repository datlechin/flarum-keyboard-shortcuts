# Changelog

## 1.0.0

Rewritten for Flarum 2.0. Every existing shortcut id is unchanged, so a binding
an administrator set in 0.1.x keeps working.

### Requires

- Flarum 2.0 or later. Forums on Flarum 1.x should stay on 0.1.1.

### Added

- Members can rebind any shortcut for themselves, and turn shortcuts off, from
  their settings page or from the cheat sheet. Only bindings that differ from
  the forum's are stored, so everything else keeps following the forum —
  including later changes an administrator makes.
- Multi-step sequences (`g` then `h`), alternatives (`s, /`), and `mod`, which
  resolves to Command on Apple devices and Control everywhere else.
- Thirteen new shortcuts: `g`-prefixed navigation to the index, notifications,
  your profile and your settings; `j`/`k` cursors through the discussion list
  and the post stream; opening the discussion under the cursor; cycling the
  colour scheme; renaming a discussion; and toggling or minimising the composer.
- Administrators and members set bindings by pressing the keys they mean rather
  than typing them out, so what is stored is exactly the form the matcher reads.
- A filterable cheat sheet, opened with `?`, listing only the shortcuts that
  would actually do something for the reader.
- Conflict warnings where two shortcuts in the same group claim the same keys.
- A public registry, so other extensions can add, replace or remove shortcuts
  through `ShortcutManager` the way they extend anything else in Flarum.

### Changed

- Some defaults moved to more conventional keys: `?` for the cheat sheet
  (was `h`), `/` for search (was `s`), `c` to start a discussion (was
  `shift+d`), `n` for notifications (was `shift+n`), `u` for the user menu
  (was `shift+u`). A binding an administrator had already customised is left
  alone by the upgrade.
- The interface is rebuilt on Flarum's design system, so it follows the forum's
  palette and its light, dark and high-contrast schemes without declaring
  colours of its own.
- Shortcuts are scoped to where they apply, so the same key can mean different
  things on different pages.
- Shortcuts no longer fire while text is being typed.

### Removed

- The `hotkeys-js` dependency, in favour of an engine that fits the forum.

### Fixed

- `alt+p` never matched on macOS, where Option and P produce `π` rather than
  `p`. Chords holding Alt, Control or Meta now read the physical key, which
  also fixes bindings on non-US keyboard layouts.

## 0.1.1

Flarum 1.x. See the Git history.

## 0.1.0

Initial release.
