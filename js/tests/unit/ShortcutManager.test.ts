import bootstrapForum from '@flarum/jest-config/src/bootstrap/forum';
import app from 'flarum/forum/app';
import { jest } from '@jest/globals';

import ShortcutManager, { isEditable } from '../../src/forum/ShortcutManager';
import { isApplePlatform } from '../../src/common/utils/keystroke';
import type { Shortcut } from '../../src/common/types';

/**
 * Bindings the manager would otherwise read from the forum API document.
 */
function useBindings(bindings: Record<string, string>): void {
  app.forum.pushAttributes({
    keyboardShortcutForumBindings: bindings,
    keyboardShortcutDefaults: bindings,
    keyboardShortcutsEnabled: true,
    canCustomizeKeyboardShortcuts: false,
    keyboardShortcutSequenceTimeout: 1000,
  });
}

function shortcut(id: string, overrides: Partial<Shortcut> = {}): Shortcut & { calls: number } {
  const definition = {
    id,
    group: 'test',
    label: () => id,
    calls: 0,
    action: () => {
      definition.calls++;
    },
    ...overrides,
  } as Shortcut & { calls: number };

  return definition;
}

/**
 * Dispatch a key press at the document, as a browser would.
 */
function press(key: string, options: KeyboardEventInit & { target?: Element } = {}): KeyboardEvent {
  const { target, ...init } = options;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });

  (target ?? document.body).dispatchEvent(event);

  return event;
}

beforeAll(() => {
  bootstrapForum();
  app.boot();
});

let manager: ShortcutManager;

beforeEach(() => {
  jest.useFakeTimers();

  document.body.innerHTML = '';
  manager = new ShortcutManager();
  manager.start();

  useBindings({});
});

afterEach(() => {
  manager.stop();
  jest.useRealTimers();
});

describe('matching', () => {
  it('runs a shortcut and stops the browser acting on the key', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: 'r' });

    const event = press('r');

    expect(reply.calls).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves the key alone when nothing is bound to it', () => {
    const event = press('r');

    expect(event.defaultPrevented).toBe(false);
  });

  it('treats an empty binding as switched off', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: '' });

    press('r');

    expect(reply.calls).toBe(0);
  });

  it('leaves the key alone when the action declines to act', () => {
    const declining = shortcut('declining', { action: () => false });

    manager.register(declining);
    useBindings({ declining: 'r' });

    const event = press('r');

    expect(event.defaultPrevented).toBe(false);
  });

  it('distinguishes a modified press from a bare one', () => {
    const bare = shortcut('bare');
    const modified = shortcut('modified');

    manager.register(bare).register(modified);
    useBindings({ bare: 'k', modified: 'shift+k' });

    press('k');
    press('K', { shiftKey: true });

    expect(bare.calls).toBe(1);
    expect(modified.calls).toBe(1);
  });

  it('accepts any of a binding’s alternatives', () => {
    const search = shortcut('search');

    manager.register(search);
    useBindings({ search: 's, /' });

    press('s');
    press('/');

    expect(search.calls).toBe(2);
  });
});

describe('sequences', () => {
  it('runs a shortcut only once its whole sequence is typed', () => {
    const goHome = shortcut('goHome');

    manager.register(goHome);
    useBindings({ goHome: 'g h' });

    press('g');
    expect(goHome.calls).toBe(0);

    press('h');
    expect(goHome.calls).toBe(1);
  });

  it('claims the first step of a sequence, so the browser does not act on it', () => {
    // `/` opens quick-find in some browsers; a shortcut bound to `/ x` has to
    // take that press from the moment it starts, not once it completes.
    manager.register(shortcut('slashThen'));
    useBindings({ slashThen: '/ x' });

    expect(press('/').defaultPrevented).toBe(true);
  });

  it('abandons a sequence when an unrelated key interrupts it', () => {
    const goHome = shortcut('goHome');

    manager.register(goHome);
    useBindings({ goHome: 'g h' });

    press('g');
    press('x');
    press('h');

    expect(goHome.calls).toBe(0);
  });

  it('abandons a sequence that is left unfinished', () => {
    const goHome = shortcut('goHome');

    manager.register(goHome);
    useBindings({ goHome: 'g h' });

    press('g');
    jest.advanceTimersByTime(1500);
    press('h');

    expect(goHome.calls).toBe(0);
  });

  it('waits before running a shortcut that is also the start of a longer one', () => {
    const bare = shortcut('bare');
    const sequence = shortcut('sequence');

    manager.register(bare).register(sequence);
    useBindings({ bare: 'g', sequence: 'g h' });

    press('g');
    expect(bare.calls).toBe(0);

    press('h');
    jest.advanceTimersByTime(1500);

    expect(sequence.calls).toBe(1);
    expect(bare.calls).toBe(0);
  });

  it('runs the shorter shortcut once the longer one cannot arrive', () => {
    const bare = shortcut('bare');
    const sequence = shortcut('sequence');

    manager.register(bare).register(sequence);
    useBindings({ bare: 'g', sequence: 'g h' });

    press('g');
    jest.advanceTimersByTime(1500);

    expect(bare.calls).toBe(1);
    expect(sequence.calls).toBe(0);
  });

  it('recovers when a stale buffer would otherwise hide a match', () => {
    const goHome = shortcut('goHome');
    const reply = shortcut('reply');

    manager.register(goHome).register(reply);
    useBindings({ goHome: 'g h', reply: 'r' });

    press('g');
    press('r');

    expect(reply.calls).toBe(1);
  });
});

describe('scope', () => {
  it('skips a shortcut whose page is not the one on screen', () => {
    let onPage = false;
    const scoped = shortcut('scoped', { when: () => onPage });

    manager.register(scoped);
    useBindings({ scoped: 'j' });

    press('j');
    expect(scoped.calls).toBe(0);

    onPage = true;
    press('j');
    expect(scoped.calls).toBe(1);
  });

  it('lets the same key mean different things on different pages', () => {
    let page = 'list';
    const inList = shortcut('inList', { when: () => page === 'list' });
    const inDiscussion = shortcut('inDiscussion', { when: () => page === 'discussion' });

    manager.register(inList).register(inDiscussion);
    useBindings({ inList: 'j', inDiscussion: 'j' });

    press('j');
    page = 'discussion';
    press('j');

    expect(inList.calls).toBe(1);
    expect(inDiscussion.calls).toBe(1);
  });
});

describe('typing', () => {
  function withFocus(html: string): Element {
    document.body.innerHTML = html;

    return document.body.firstElementChild!;
  }

  it('stays out of the way while text is being typed', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: 'r' });

    press('r', { target: withFocus('<input type="text" />') });
    press('r', { target: withFocus('<textarea></textarea>') });
    press('r', { target: withFocus('<div contenteditable="true"></div>') });

    expect(reply.calls).toBe(0);
  });

  it('still fires when the focus is somewhere nothing is being typed', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: 'r' });

    press('r', { target: withFocus('<input type="checkbox" />') });
    press('r', { target: withFocus('<button></button>') });

    expect(reply.calls).toBe(2);
  });

  it('fires in a text field when the shortcut asks to', () => {
    const composer = shortcut('composer', { allowInInput: true });

    manager.register(composer);
    useBindings({ composer: 'mod+shift+f' });

    // `mod` is Command on Apple devices and Control elsewhere; pressing both
    // at once would be a different chord from either.
    const apple = isApplePlatform();

    press('F', {
      target: withFocus('<textarea></textarea>'),
      shiftKey: true,
      ctrlKey: !apple,
      metaKey: apple,
    });

    expect(composer.calls).toBe(1);
  });

  it('ignores a key press that belongs to an input method', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: 'r' });

    press('r', { isComposing: true } as KeyboardEventInit);

    expect(reply.calls).toBe(0);
  });
});

describe('registry', () => {
  it('lets a later registration replace an earlier one', () => {
    const original = shortcut('reply');
    const replacement = shortcut('reply');

    manager.register(original).register(replacement);
    useBindings({ reply: 'r' });

    press('r');

    expect(original.calls).toBe(0);
    expect(replacement.calls).toBe(1);
  });

  it('reports bindings claimed by more than one shortcut', () => {
    manager.register(shortcut('one')).register(shortcut('two')).register(shortcut('three'));
    useBindings({ one: 'j', two: 'j', three: 'k' });

    const conflicts = manager.conflicts();

    expect([...conflicts.keys()]).toEqual(['j']);
    expect(conflicts.get('j')).toEqual(['one', 'two']);
  });

  it('stops listening once stopped', () => {
    const reply = shortcut('reply');

    manager.register(reply);
    useBindings({ reply: 'r' });

    manager.stop();
    press('r');

    expect(reply.calls).toBe(0);
  });
});

describe('isEditable', () => {
  it.each([
    ['<input type="text" />', true],
    ['<input type="search" />', true],
    ['<input type="checkbox" />', false],
    ['<input type="radio" />', false],
    ['<textarea></textarea>', true],
    ['<select></select>', true],
    ['<button></button>', false],
    ['<div contenteditable="true"></div>', true],
    ['<div></div>', false],
  ])('%s → %s', (html, expected) => {
    document.body.innerHTML = html;

    expect(isEditable(document.body.firstElementChild)).toBe(expected);
  });
});
