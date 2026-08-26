import {
  chordFromEvent,
  chordId,
  formatChord,
  parseBinding,
  parseChord,
  sequenceId,
  startsWith,
  stringifyBinding,
  stringifySequence,
} from '../../src/common/utils/keystroke';

/**
 * A key press as the browser would report it. `key` follows the DOM
 * convention: the character produced, or the key's name for non-printing keys.
 */
function press(key: string, modifiers: Partial<Record<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey', boolean>> = {}, code?: string) {
  return {
    key,
    code,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...modifiers,
  } as KeyboardEvent;
}

describe('parseChord', () => {
  it('reads a bare key', () => {
    expect(parseChord('r')).toMatchObject({ key: 'r', ctrl: false, alt: false, shift: false, meta: false, mod: false });
  });

  it('reads modifiers in any order and any case', () => {
    expect(parseChord('SHIFT+Alt+k')).toMatchObject({ key: 'k', shift: true, alt: true });
    expect(parseChord('alt+shift+k')).toMatchObject({ key: 'k', shift: true, alt: true });
  });

  it('accepts the spellings people actually type', () => {
    expect(parseChord('cmd+k')).toMatchObject({ key: 'k', meta: true });
    expect(parseChord('option+k')).toMatchObject({ key: 'k', alt: true });
    expect(parseChord('esc')).toMatchObject({ key: 'escape' });
    expect(parseChord('arrowdown')).toMatchObject({ key: 'down' });
  });

  it('treats a trailing plus as the plus key', () => {
    expect(parseChord('mod++')).toMatchObject({ key: '+', mod: true });
    expect(parseChord('+')).toMatchObject({ key: '+' });
  });

  it('rejects a chord with no key or with two', () => {
    expect(parseChord('shift')).toBeNull();
    expect(parseChord('a+b')).toBeNull();
    expect(parseChord('')).toBeNull();
  });
});

describe('parseBinding', () => {
  it('reads a sequence', () => {
    const [sequence] = parseBinding('g h');

    expect(sequence).toHaveLength(2);
    expect(sequence[0]).toMatchObject({ key: 'g' });
    expect(sequence[1]).toMatchObject({ key: 'h' });
  });

  it('reads alternatives', () => {
    expect(parseBinding('s, /')).toHaveLength(2);
  });

  it('is empty for an empty binding, which means the shortcut is off', () => {
    expect(parseBinding('')).toEqual([]);
    expect(parseBinding(null)).toEqual([]);
    expect(parseBinding(undefined)).toEqual([]);
  });

  it('drops only the malformed alternative, keeping the rest usable', () => {
    const binding = parseBinding('a+b, k');

    expect(binding).toHaveLength(1);
    expect(binding[0][0]).toMatchObject({ key: 'k' });
  });
});

describe('chordFromEvent', () => {
  it('lowercases a printable key', () => {
    expect(chordFromEvent(press('R'))).toMatchObject({ key: 'r' });
  });

  it('keeps Shift for a letter, because Shift+D is a different shortcut from D', () => {
    expect(chordFromEvent(press('D', { shiftKey: true }))).toMatchObject({ key: 'd', shift: true });
  });

  it('drops Shift when it already produced the character', () => {
    // `?` is Shift+/ on most layouts. Recording it as `shift+?` would never
    // match, since no further Shift is involved in typing it.
    expect(chordFromEvent(press('?', { shiftKey: true }))).toMatchObject({ key: '?', shift: false });
    expect(chordFromEvent(press('!', { shiftKey: true }))).toMatchObject({ key: '!', shift: false });
  });

  it('keeps Shift for a named key', () => {
    expect(chordFromEvent(press('Enter', { shiftKey: true }))).toMatchObject({ key: 'enter', shift: true });
  });

  it('names the keys that have no character', () => {
    expect(chordFromEvent(press(' '))).toMatchObject({ key: 'space' });
    expect(chordFromEvent(press('ArrowUp'))).toMatchObject({ key: 'up' });
    expect(chordFromEvent(press('PageDown'))).toMatchObject({ key: 'pgdn' });
    expect(chordFromEvent(press('Backspace'))).toMatchObject({ key: 'backspace' });
  });

  it('reads the physical key when a modifier has changed the character', () => {
    // Option and P on a Mac produce `π`. Without this, the shipped `alt+p`
    // binding could never match what the keyboard reports.
    expect(chordFromEvent(press('\u03c0', { altKey: true }, 'KeyP'))).toMatchObject({ key: 'p', alt: true });

    // The same on any layout where Control and Z is not the key labelled Z.
    expect(chordFromEvent(press('y', { ctrlKey: true }, 'KeyZ'))).toMatchObject({ key: 'z', ctrl: true });

    // And for digits, which AZERTY puts behind Shift.
    expect(chordFromEvent(press('&', { ctrlKey: true }, 'Digit1'))).toMatchObject({ key: '1', ctrl: true });
  });

  it('keeps the character when only Shift is held', () => {
    // Shift is what makes `?` out of `/`; reading the physical key here would
    // turn every punctuation binding into the wrong one.
    expect(chordFromEvent(press('?', { shiftKey: true }, 'Slash'))).toMatchObject({ key: '?', shift: false });
    expect(chordFromEvent(press('D', { shiftKey: true }, 'KeyD'))).toMatchObject({ key: 'd', shift: true });
  });

  it('falls back to the character when the code names no single key', () => {
    expect(chordFromEvent(press('\u00f7', { altKey: true }, 'Slash'))).toMatchObject({ key: '\u00f7', alt: true });
    expect(chordFromEvent(press('F5', { ctrlKey: true }, 'F5'))).toMatchObject({ key: 'f5', ctrl: true });
  });

  it('ignores a modifier pressed on its own', () => {
    expect(chordFromEvent(press('Shift', { shiftKey: true }))).toBeNull();
    expect(chordFromEvent(press('Meta', { metaKey: true }))).toBeNull();
  });
});

describe('chordId', () => {
  it('resolves `mod` per platform', () => {
    const chord = parseChord('mod+k')!;

    expect(chordId(chord, true)).toBe('meta+k');
    expect(chordId(chord, false)).toBe('ctrl+k');
  });

  it('lets a real Command press match a `mod` binding on Apple devices', () => {
    const binding = parseChord('mod+k')!;
    const pressed = chordFromEvent(press('k', { metaKey: true }))!;

    expect(chordId(pressed, true)).toBe(chordId(binding, true));
    expect(chordId(pressed, false)).not.toBe(chordId(binding, false));
  });

  it('orders modifiers consistently however they were written', () => {
    expect(chordId(parseChord('shift+alt+k')!, false)).toBe(chordId(parseChord('alt+shift+k')!, false));
  });
});

describe('startsWith', () => {
  const sequence = parseBinding('g h')[0];

  it('accepts a prefix, so a half-typed sequence stays alive', () => {
    expect(startsWith(sequence, parseBinding('g')[0], false)).toBe(true);
  });

  it('rejects a different key', () => {
    expect(startsWith(sequence, parseBinding('j')[0], false)).toBe(false);
  });

  it('rejects a prefix longer than the sequence', () => {
    expect(startsWith(parseBinding('g')[0], sequence, false)).toBe(false);
  });
});

describe('round-tripping', () => {
  // What the recorder writes must be what the matcher reads: anything lost
  // here is a shortcut that is stored but never fires.
  it.each(['r', 'shift+d', 'mod+shift+f', 'g h', 'alt+p', '?', 'backspace', 'mod++'])('survives %s', (binding) => {
    const parsed = parseBinding(binding);

    expect(parseBinding(stringifyBinding(parsed))).toEqual(parsed);
  });

  it('normalises alternatives and spacing to one canonical form', () => {
    expect(stringifyBinding(parseBinding('  s ,   / '))).toBe('s, /');
    expect(stringifySequence(parseBinding('G   H')[0])).toBe('g h');
  });

  it('gives a recorded press the same identity as its written binding', () => {
    const recorded = chordFromEvent(press('D', { shiftKey: true }))!;

    expect(sequenceId([recorded], false)).toBe(sequenceId(parseBinding('shift+d')[0], false));
  });
});

describe('formatChord', () => {
  it('uses the symbols Apple users expect', () => {
    expect(formatChord(parseChord('mod+shift+k')!, true)).toEqual(['⇧', '⌘', 'K']);
  });

  it('uses words elsewhere', () => {
    expect(formatChord(parseChord('mod+shift+k')!, false)).toEqual(['Ctrl', 'Shift', 'K']);
  });

  it('names the non-printing keys', () => {
    expect(formatChord(parseChord('backspace')!, false)).toEqual(['Backspace']);
    expect(formatChord(parseChord('escape')!, false)).toEqual(['Esc']);
    expect(formatChord(parseChord('escape')!, true)).toEqual(['⎋']);
  });

  it('leaves punctuation as typed', () => {
    expect(formatChord(parseChord('?')!, false)).toEqual(['?']);
    expect(formatChord(parseChord('/')!, false)).toEqual(['/']);
  });
});
