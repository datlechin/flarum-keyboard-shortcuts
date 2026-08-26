import bootstrapForum from '@flarum/jest-config/src/bootstrap/forum';
import app from 'flarum/forum/app';
import mq from 'mithril-query';

import ShortcutManager from '../../src/forum/ShortcutManager';
import KeyboardShortcutsModal from '../../src/forum/components/KeyboardShortcutsModal';
import type { Shortcut } from '../../src/common/types';

/**
 * The cheat sheet's structure is the design: a section per group, each opening
 * with a divider and a heading, and a description list of label/keys pairs.
 * These assertions pin that down so a future edit can't quietly turn it back
 * into an undifferentiated list.
 */

function shortcut(id: string, group: string, overrides: Partial<Shortcut> = {}): Shortcut {
  return { id, group, label: () => `Label for ${id}`, action: () => {}, ...overrides };
}

/**
 * Render a modal's body without going through the modal manager, which would
 * want animation callbacks and a live state object.
 */
function render(modal: KeyboardShortcutsModal) {
  return mq({ view: () => modal.content() });
}

beforeAll(() => {
  bootstrapForum();
  app.boot();
});

beforeEach(() => {
  app.shortcuts = new ShortcutManager();

  app.shortcuts
    .register(shortcut('reply', 'discussion'))
    .register(shortcut('follow', 'discussion'))
    .register(shortcut('search', 'global'))
    .register(shortcut('hidden', 'global', { visible: () => false }))
    .register(shortcut('unbound', 'global'));

  app.forum.pushAttributes({
    keyboardShortcutForumBindings: { reply: 'r', follow: 'f', search: '/', hidden: 'h', unbound: '' },
    keyboardShortcutDefaults: { reply: 'r', follow: 'f', search: '/', hidden: 'h', unbound: '' },
    canCustomizeKeyboardShortcuts: false,
  });
});

describe('the cheat sheet', () => {
  it('renders a section per group, in canonical order', () => {
    const out = render(new KeyboardShortcutsModal());

    expect(out.find('.KeyboardShortcuts-group')).toHaveLength(2);

    // `global` precedes `discussion` in GROUP_ORDER, whatever order the
    // shortcuts happened to be registered in.
    const sections = out.find('.KeyboardShortcuts-group') as unknown as HTMLElement[];

    expect(sections[0].className).toContain('KeyboardShortcuts-group--global');
    expect(sections[1].className).toContain('KeyboardShortcuts-group--discussion');
  });

  it('opens each section with a divider and a heading', () => {
    const out = render(new KeyboardShortcutsModal());

    expect(out.find('.KeyboardShortcuts-group .Modal-divider')).toHaveLength(2);
    expect(out.find('.KeyboardShortcuts-groupTitle')).toHaveLength(2);
  });

  it('renders rows as a description list rather than a dropdown menu', () => {
    const out = render(new KeyboardShortcutsModal());

    // `Dropdown-menu` is hidden until its dropdown is open, so borrowing it
    // here would render the whole sheet invisible.
    expect(out.find('.Dropdown-menu')).toHaveLength(0);
    expect(out.find('dl.KeyboardShortcuts-list')).toHaveLength(2);
    expect(out.find('dt.KeyboardShortcuts-itemLabel')).toHaveLength(3);
    expect(out.find('dd.KeyboardShortcuts-itemKeys')).toHaveLength(3);
  });

  it('lists only shortcuts that would actually do something', () => {
    const out = render(new KeyboardShortcutsModal());
    const labels = (out.find('.KeyboardShortcuts-itemLabel') as unknown as HTMLElement[]).map((node) => node.textContent);

    expect(labels).toContain('Label for search');
    // Declared invisible for this user.
    expect(labels).not.toContain('Label for hidden');
    // Bound to nothing.
    expect(labels).not.toContain('Label for unbound');
  });

  it('renders the key caps for each row', () => {
    const out = render(new KeyboardShortcutsModal());

    expect(out.find('.KeyCombo-key').length).toBeGreaterThanOrEqual(3);
  });

  it('shows an InfoTile when the filter matches nothing', () => {
    const modal = new KeyboardShortcutsModal();
    (modal as any).query = 'nothing matches this';

    const out = render(modal);

    expect(out.find('.KeyboardShortcuts-group')).toHaveLength(0);
    expect(out.find('.InfoTile')).toHaveLength(1);
  });

  it('narrows to the matching rows when filtered', () => {
    const modal = new KeyboardShortcutsModal();
    (modal as any).query = 'reply';

    const out = render(modal);

    expect(out.find('.KeyboardShortcuts-group')).toHaveLength(1);
    expect(out.find('.KeyboardShortcuts-itemLabel')).toHaveLength(1);
  });
});
