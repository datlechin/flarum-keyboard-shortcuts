/**
 * Parsing, matching and formatting of keyboard bindings.
 *
 * A binding is a string such as `mod+shift+k`, `g h` or `s, /`:
 *
 *  - `+` joins the keys of a single chord;
 *  - a space joins the chords of a sequence, which must be typed in order;
 *  - a comma separates alternative bindings for the same shortcut.
 *
 * `mod` stands for the platform's primary modifier — Command on Apple devices,
 * Control everywhere else — so one binding reads correctly on every machine.
 */

export interface Chord {
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

/** A list of chords that must be typed in order. */
export type Sequence = Chord[];

/** The alternatives a single binding string expands to. */
export type Binding = Sequence[];

const MODIFIERS = ['mod', 'ctrl', 'alt', 'shift', 'meta'] as const;

type Modifier = (typeof MODIFIERS)[number];

function isModifier(token: string): token is Modifier {
  return (MODIFIERS as readonly string[]).includes(token);
}

/**
 * Spellings accepted in a binding string, mapped onto the canonical name.
 */
const ALIASES: Record<string, string> = {
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta',
  windows: 'meta',
  control: 'ctrl',
  option: 'alt',
  opt: 'alt',
  esc: 'escape',
  return: 'enter',
  spacebar: 'space',
  del: 'delete',
  ins: 'insert',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  pageup: 'pgup',
  pagedown: 'pgdn',
};

/**
 * `KeyboardEvent.key` values that need a shorter canonical name. Anything not
 * listed keeps its own name, lowercased.
 */
const EVENT_KEYS: Record<string, string> = {
  ' ': 'space',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  pageup: 'pgup',
  pagedown: 'pgdn',
};

const APPLE_SYMBOLS: Record<string, string> = {
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '⏎',
  escape: '⎋',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: 'Space',
  pgup: 'Page Up',
  pgdn: 'Page Down',
};

const LABELS: Record<string, string> = {
  meta: 'Meta',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  escape: 'Esc',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: 'Space',
  pgup: 'Page Up',
  pgdn: 'Page Down',
  home: 'Home',
  end: 'End',
  insert: 'Insert',
};

/**
 * Whether the current device uses Command as its primary modifier.
 *
 * `navigator.platform` is deprecated but remains the only broadly supported
 * signal here; `userAgentData` is consulted first where it exists.
 */
export function isApplePlatform(): boolean {
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || navigator.userAgent || '';

  return /mac|iphone|ipad|ipod/i.test(platform);
}

function emptyChord(): Chord {
  return { mod: false, ctrl: false, alt: false, shift: false, meta: false, key: '' };
}

/**
 * Split a chord on `+`, keeping a literal `+` as a key (as in `mod++`).
 */
function splitChord(chord: string): string[] {
  if (chord === '') return [];

  const raw = chord.split('+');
  const tokens: string[] = [];

  raw.forEach((token, index) => {
    if (token !== '') {
      tokens.push(token);
      return;
    }

    // A trailing empty token is the other half of the `+` we just consumed as
    // a key, not a key of its own.
    if (index === raw.length - 1 && tokens.length) return;

    tokens.push('+');
  });

  return tokens;
}

export function parseChord(source: string): Chord | null {
  const chord = emptyChord();

  for (let token of splitChord(source.trim().toLowerCase())) {
    token = ALIASES[token] ?? token;

    if (isModifier(token)) {
      chord[token] = true;
      continue;
    }

    // A chord has exactly one non-modifier key; a second one means the binding
    // is malformed and is better ignored than half-honoured.
    if (chord.key !== '') return null;

    chord.key = token;
  }

  return chord.key === '' ? null : chord;
}

/**
 * Expand a binding string into the alternatives it stands for. Malformed
 * alternatives are dropped, so a partly-broken binding still works as far as
 * it can.
 */
export function parseBinding(source?: string | null): Binding {
  if (!source) return [];

  const binding: Binding = [];

  for (const alternative of source.split(',')) {
    const chords = alternative.trim().split(/\s+/).filter(Boolean).map(parseChord);

    if (chords.length && chords.every((chord): chord is Chord => chord !== null)) {
      binding.push(chords as Sequence);
    }
  }

  return binding;
}

/**
 * A comparable identity for a chord, with `mod` resolved for this platform so
 * `mod+k` and a real Command press produce the same string.
 */
export function chordId(chord: Chord, apple: boolean = isApplePlatform()): string {
  const meta = chord.meta || (chord.mod && apple);
  const ctrl = chord.ctrl || (chord.mod && !apple);

  return [ctrl && 'ctrl', chord.alt && 'alt', chord.shift && 'shift', meta && 'meta', chord.key].filter(Boolean).join('+');
}

export function sequenceId(sequence: Sequence, apple: boolean = isApplePlatform()): string {
  return sequence.map((chord) => chordId(chord, apple)).join(' ');
}

/**
 * Build a chord from a real key press.
 */
/**
 * The letter or digit a `KeyboardEvent.code` names — the key's physical
 * position, independent of what character the layout makes it produce.
 *
 * Returns null for anything without an obvious single character, so the caller
 * can fall back to the character itself.
 */
function keyFromCode(code: string | undefined): string | null {
  if (!code) return null;

  const letter = /^Key([A-Z])$/.exec(code);

  if (letter) return letter[1].toLowerCase();

  const digit = /^Digit([0-9])$/.exec(code);

  return digit ? digit[1] : null;
}

export function chordFromEvent(event: KeyboardEvent): Chord | null {
  if (!event.key) return null;

  // Space reports as `' '`, a single character that still needs a name — so
  // the rename table is consulted before the length of the key is considered.
  const lower = event.key.toLowerCase();

  // Alt, Control and Meta change the character a key produces: on a Mac,
  // Option and P together are `π`, not `p`, so a binding written `alt+p` would
  // never match what the keyboard actually reports. The same happens on any
  // non-US layout, where Control and Z may not be the key labelled Z at all.
  // For those chords the physical key is what was meant, so it is read from
  // `code`. Shift is deliberately excluded: it is what turns `/` into `?`, and
  // that character is the whole point of the binding.
  const physical = event.altKey || event.ctrlKey || event.metaKey ? keyFromCode(event.code) : null;

  const key = physical ?? EVENT_KEYS[lower] ?? lower;

  // A modifier pressed on its own is a prefix, not a chord.
  if (['control', 'alt', 'shift', 'meta', 'os', 'altgraph', 'capslock', 'dead'].includes(key)) {
    return null;
  }

  // Shift is only part of the identity when it did not already change the
  // character produced: `Shift` + `D` is `shift+d`, but `Shift` + `/` is `?`.
  const shift = event.shiftKey && (key.length > 1 || /^[a-z]$/.test(key));

  return {
    mod: false,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift,
    meta: event.metaKey,
    key,
  };
}

/**
 * Turn a chord into the tokens to render as individual `<kbd>` elements.
 */
export function formatChord(chord: Chord, apple: boolean = isApplePlatform()): string[] {
  const tokens: string[] = [];
  const label = (name: string) => (apple ? APPLE_SYMBOLS[name] ?? LABELS[name] ?? name : LABELS[name] ?? name);

  if (chord.ctrl || (chord.mod && !apple)) tokens.push(label('ctrl'));
  if (chord.alt) tokens.push(label('alt'));
  if (chord.shift) tokens.push(label('shift'));
  if (chord.meta || (chord.mod && apple)) tokens.push(label('meta'));

  const key = chord.key;
  const named = apple ? APPLE_SYMBOLS[key] ?? LABELS[key] : LABELS[key];

  tokens.push(named ?? (key.length === 1 ? key.toUpperCase() : capitalize(key)));

  return tokens;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Render a binding back to its canonical string form — the form the recorder
 * stores, so that what is saved always round-trips through {@link parseBinding}.
 */
export function stringifyChord(chord: Chord): string {
  return [chord.mod && 'mod', chord.ctrl && 'ctrl', chord.alt && 'alt', chord.shift && 'shift', chord.meta && 'meta', chord.key]
    .filter(Boolean)
    .join('+');
}

export function stringifySequence(sequence: Sequence): string {
  return sequence.map(stringifyChord).join(' ');
}

export function stringifyBinding(binding: Binding): string {
  return binding.map(stringifySequence).join(', ');
}

/**
 * Whether `sequence` begins with every chord of `prefix` — used to keep a
 * partially typed sequence such as `g` alive while its second chord is awaited.
 */
export function startsWith(sequence: Sequence, prefix: Sequence, apple: boolean = isApplePlatform()): boolean {
  if (prefix.length > sequence.length) return false;

  return prefix.every((chord, index) => chordId(chord, apple) === chordId(sequence[index], apple));
}

export function sequencesEqual(a: Sequence, b: Sequence, apple: boolean = isApplePlatform()): boolean {
  return a.length === b.length && startsWith(a, b, apple);
}
