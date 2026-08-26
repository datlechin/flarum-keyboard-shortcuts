import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';
import type { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import InfoTile from 'flarum/common/components/InfoTile';
import Input from 'flarum/common/components/Input';
import Switch from 'flarum/common/components/Switch';
import extractText from 'flarum/common/utils/extractText';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';

import KeyCombo from '../../common/components/KeyCombo';
import { GROUP_ORDER, PREFERENCES, trans, transIfExists } from '../../common/config';
import type { Shortcut } from '../../common/types';
import CustomizeShortcutsModal from './CustomizeShortcutsModal';

export interface IKeyboardShortcutsModalAttrs extends IInternalModalAttrs {}

/**
 * The cheat sheet: every shortcut available to this user right now, grouped by
 * where it applies.
 *
 * It lists what is actually live — a shortcut whose extension isn't installed,
 * or that a guest can't use, isn't shown — so the sheet never promises a key
 * that would do nothing.
 *
 * A reference is for scanning, not for stepping through, so the groups sit side
 * by side rather than behind tabs: everything is visible at once on a screen
 * with the room for it, and the filter narrows it when there isn't.
 */
export default class KeyboardShortcutsModal<
  CustomAttrs extends IKeyboardShortcutsModalAttrs = IKeyboardShortcutsModalAttrs
> extends Modal<CustomAttrs> {
  /**
   * The current filter query.
   */
  protected query = '';

  protected togglingEnabled = false;

  className(): string {
    return 'KeyboardShortcutsModal Modal--flat Modal--large';
  }

  title(): Mithril.Children {
    return trans('forum.modal.title');
  }

  content(): Mithril.Children {
    const groups = this.groups();

    return (
      <div className="Modal-body KeyboardShortcutsModal-body">
        {this.search()}

        {groups.length ? (
          <div className="KeyboardShortcuts-groups">{groups}</div>
        ) : (
          <InfoTile icon="fas fa-keyboard">{trans('forum.modal.no_results', { query: this.query })}</InfoTile>
        )}
      </div>
    );
  }

  /**
   * The modal's own footer, below the body: the controls that act on shortcuts
   * as a whole rather than on any one of them.
   */
  protected inner(): Mithril.Children {
    const footer = this.footerItems().toArray();

    return [super.inner(), !!footer.length && <div className="Modal-footer KeyboardShortcutsModal-footer">{footer}</div>];
  }

  search(): Mithril.Children {
    const label = extractText(trans('forum.modal.filter_placeholder'));

    return (
      <div className="KeyboardShortcutsModal-search">
        <Input
          type="search"
          prefixIcon="fas fa-search"
          clearable={true}
          clearLabel={extractText(trans('forum.modal.filter_clear_label'))}
          aria-label={label}
          placeholder={label}
          value={this.query}
          onchange={(value: string) => {
            this.query = value;
          }}
        />
      </div>
    );
  }

  /**
   * One section per group that has anything to show.
   */
  groups(): Mithril.Children[] {
    const shortcuts = this.visibleShortcuts();
    const groups: string[] = [];

    for (const shortcut of shortcuts) {
      if (!groups.includes(shortcut.group)) groups.push(shortcut.group);
    }

    // Known groups keep their canonical order; anything an extension has added
    // follows, in the order it was registered.
    groups.sort((a, b) => {
      const [ia, ib] = [GROUP_ORDER.indexOf(a), GROUP_ORDER.indexOf(b)];

      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });

    return groups.map((group) =>
      this.group(
        group,
        shortcuts.filter((shortcut) => shortcut.group === group)
      )
    );
  }

  group(group: string, shortcuts: Shortcut[]): Mithril.Children {
    // A description list, not a `Dropdown-menu`: these rows are a reference,
    // not a menu of things to activate, and core's dropdown styles carry
    // behaviour (hidden until open, items sized as targets) that would be
    // wrong here. The section takes the modal's visual language — a divider
    // and a heading in the same voice as `Dropdown-header` — without borrowing
    // a component whose semantics don't fit.
    return (
      <section className={`KeyboardShortcuts-group KeyboardShortcuts-group--${group}`} key={group}>
        <hr className="Modal-divider" />
        <h3 className="KeyboardShortcuts-groupTitle">{this.groupLabel(group)}</h3>
        <dl className="KeyboardShortcuts-list">
          {shortcuts.map((shortcut) => (
            <div className="KeyboardShortcuts-item" key={shortcut.id}>
              <dt className="KeyboardShortcuts-itemLabel">{shortcut.label()}</dt>
              <dd className="KeyboardShortcuts-itemKeys">
                <KeyCombo binding={app.shortcuts.binding(shortcut.id)} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  groupLabel(group: string): Mithril.Children {
    // Groups registered by other extensions carry their own translation key,
    // so fall back to showing the raw group name rather than a missing string.
    return transIfExists(`lib.groups.${group}`, group);
  }

  /**
   * The shortcuts to list: bound, applicable to this user, and matching the
   * filter.
   */
  visibleShortcuts(): Shortcut[] {
    const query = this.query.trim().toLowerCase();

    return app.shortcuts.all().filter((shortcut) => {
      if (shortcut.visible?.() === false) return false;

      const binding = app.shortcuts.binding(shortcut.id);

      if (!binding) return false;

      if (!query) return true;

      const haystack = [extractText(shortcut.label()), binding, extractText(this.groupLabel(shortcut.group))].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  footerItems(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();

    if (app.session.user) {
      items.add(
        'enabled',
        <Switch state={app.shortcuts.enabled()} loading={this.togglingEnabled} onchange={this.toggleEnabled.bind(this)}>
          {trans('forum.modal.enabled_label')}
        </Switch>,
        100
      );
    }

    if (app.forum.attribute<boolean>('canCustomizeKeyboardShortcuts')) {
      items.add(
        'customize',
        <Button className="Button Button--link" icon="fas fa-sliders" onclick={() => app.modal.show(CustomizeShortcutsModal)}>
          {trans('forum.modal.customize_button')}
        </Button>,
        90
      );
    }

    return items;
  }

  toggleEnabled(enabled: boolean): void {
    if (!app.session.user) return;

    this.togglingEnabled = true;

    app.session.user
      .savePreferences({ [PREFERENCES.enabled]: enabled })
      .catch(() => {})
      .then(() => {
        this.togglingEnabled = false;
        m.redraw();
      });
  }
}
