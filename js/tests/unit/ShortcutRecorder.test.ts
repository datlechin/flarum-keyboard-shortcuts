import bootstrapForum from '@flarum/jest-config/src/bootstrap/forum';
import app from 'flarum/forum/app';
import mq from 'mithril-query';
import { jest } from '@jest/globals';

import ShortcutRecorder from '../../src/common/components/ShortcutRecorder';

/**
 * The recorder must not depend on the capture button holding DOM focus.
 *
 * On macOS neither Safari nor Firefox focus a `<button>` when it is clicked,
 * so a `keydown` handler bound to the element never fires and a `blur` never
 * arrives to close a previous recording. Both bugs came from that assumption,
 * and every test here drives events at `document` — never at the button — so
 * the assumption cannot creep back in.
 */

/** Dispatch a key press at the document, as a browser would when nothing is focused. */
function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });

  document.dispatchEvent(event);

  return event;
}

function clickOutside(): void {
  document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
}

/**
 * Mount a recorder and hand back its rendered output plus the binding it last
 * reported.
 */
function mount(value: string = '') {
  const state = { value, changes: [] as string[] };

  const out = mq({
    view: () =>
      m(ShortcutRecorder, {
        value: state.value,
        onchange: (binding: string) => {
          state.value = binding;
          state.changes.push(binding);
        },
      }),
  });

  return { out, state, capture: () => out.find('.ShortcutRecorder-capture')[0] as unknown as HTMLElement };
}

function isRecording(out: ReturnType<typeof mq>): boolean {
  return out.find('.ShortcutRecorder--recording').length > 0;
}

beforeAll(() => {
  bootstrapForum();
  app.boot();
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  // Whatever a test left listening must not survive into the next one.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  jest.useRealTimers();
});

describe('starting and stopping', () => {
  it('is idle until the control is activated', () => {
    const { out } = mount('r');

    expect(isRecording(out)).toBe(false);
  });

  it('starts listening when the control is activated', () => {
    const { out, capture } = mount('r');

    capture().click();
    out.redraw();

    expect(isRecording(out)).toBe(true);
  });

  it('stops when activated a second time', () => {
    const { out, capture } = mount('r');

    capture().click();
    out.redraw();
    capture().click();
    out.redraw();

    expect(isRecording(out)).toBe(false);
  });

  it('stops when Escape is pressed', () => {
    const { out, capture } = mount('r');

    capture().click();
    out.redraw();
    press('Escape');
    out.redraw();

    expect(isRecording(out)).toBe(false);
  });

  it('stops when something outside it is clicked', () => {
    const { out, capture } = mount('r');

    capture().click();
    out.redraw();
    clickOutside();
    out.redraw();

    expect(isRecording(out)).toBe(false);
  });
});

describe('capturing keys', () => {
  it('records a press that arrives with the button unfocused', () => {
    // The bug: with the handler on the button, nothing happened at all on a
    // browser that does not focus buttons on click.
    const { out, state, capture } = mount('r');

    capture().click();
    out.redraw();

    expect(document.activeElement).not.toBe(capture());

    press('k');

    expect(state.changes).toEqual(['k']);
  });

  it('takes the key press away from the rest of the page', () => {
    const { out, capture } = mount('');

    capture().click();
    out.redraw();

    const event = press('k');

    // The forum's shortcut manager checks `defaultPrevented` and bails, so
    // recording `r` cannot also open a reply composer behind the modal.
    expect(event.defaultPrevented).toBe(true);
  });

  it('records a modified chord and finishes straight away', () => {
    const { out, state, capture } = mount('');

    capture().click();
    out.redraw();
    press('F', { shiftKey: true, ctrlKey: true });
    out.redraw();

    expect(state.changes).toEqual(['ctrl+shift+f']);
    expect(isRecording(out)).toBe(false);
  });

  it('builds a sequence from bare keys pressed in quick succession', () => {
    const { out, state, capture } = mount('');

    capture().click();
    out.redraw();
    press('g');
    press('h');

    expect(state.value).toBe('g h');
  });

  it('finishes a bare key once nothing follows it', () => {
    const { out, state, capture } = mount('');

    capture().click();
    out.redraw();
    press('g');

    expect(isRecording(out)).toBe(true);

    jest.advanceTimersByTime(1500);
    out.redraw();

    expect(state.value).toBe('g');
    expect(isRecording(out)).toBe(false);
  });

  it('ignores a modifier held on its own', () => {
    const { out, state, capture } = mount('');

    capture().click();
    out.redraw();
    press('Shift', { shiftKey: true });

    expect(state.changes).toEqual([]);
    expect(isRecording(out)).toBe(true);
  });
});

describe('two recorders', () => {
  it('never leaves both listening at once', () => {
    // The second bug: with no blur to close the first field, both sat showing
    // "Press keys…" together.
    const first = mount('r');
    const second = mount('f');

    first.capture().click();
    first.out.redraw();

    expect(isRecording(first.out)).toBe(true);

    second.capture().click();
    first.out.redraw();
    second.out.redraw();

    expect(isRecording(second.out)).toBe(true);
    expect(isRecording(first.out)).toBe(false);
  });

  it('sends the keys only to the one that is listening', () => {
    const first = mount('r');
    const second = mount('f');

    first.capture().click();
    second.capture().click();

    press('k');

    expect(first.state.changes).toEqual([]);
    expect(second.state.changes).toEqual(['k']);
  });
});
