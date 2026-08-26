import app from 'flarum/forum/app';
import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import ShortcutRecorder from '../../common/components/ShortcutRecorder';
import { GROUP_ORDER, PREFERENCES, trans, transIfExists } from '../../common/config';
import type { Shortcut } from '../../common/types';
import { parseBinding, sequenceId } from '../../common/utils/keystroke';

export interface ICustomizeShortcutsModalAttrs extends IFormModalAttrs {}

/**
 * Lets a member rebind any shortcut for themselves.
 *
 * Only the bindings that differ from the forum's are stored, so a user who
 * changes one key keeps following the forum for everything else — including
 * later changes an administrator makes.
 *
 * Unlike the cheat sheet, this is a form: one group at a time, behind tabs, so
 * the list stays short enough that the save button never scrolls out of reach.
 * A tab whose group contains a clash is marked, so nothing has to be hunted for.
 */
export default class CustomizeShortcutsModal<
  CustomAttrs extends ICustomizeShortcutsModalAttrs = ICustomizeShortcutsModalAttrs
> extends FormModal<CustomAttrs> {
  /**
   * The bindings as edited, keyed by shortcut id. Seeded from what is in force
   * so the form shows the user's real keys, not a blank slate.
   */
  protected bindings: Record<string, string> = {};

  protected activeGroup = '';

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    for (const shortcut of app.shortcuts.all()) {
      this.bindings[shortcut.id] = app.shortcuts.binding(shortcut.id);
    }

    this.activeGroup = this.groups()[0] ?? '';
  }

  className(): string {
    return 'CustomizeShortcutsModal Modal--flat Modal--large';
  }

  title(): Mithril.Children {
    return trans('forum.customize.title');
  }

  content(): Mithril.Children {
    return (
      <div className="Modal-body CustomizeShortcutsModal-body">
        <p className="helpText CustomizeShortcutsModal-help">{trans('forum.customize.help')}</p>

        <div className="Tabs">
          <div className="Tabs-nav" role="tablist">
            {this.groups().map((group) => this.tab(group))}
          </div>
          <hr className="Modal-divider Tabs-divider" />
          <div className="Tabs-content CustomizeShortcutsModal-tabContent">
            {this.shortcutsIn(this.activeGroup).map((shortcut) => this.row(shortcut))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * The submit and reset controls, in the modal's footer so they stay put
   * while a group is scrolled.
   */
  protected inner(): Mithril.Children {
    return [
      super.inner(),
      <div className="Modal-footer CustomizeShortcutsModal-footer">
        <Button type="submit" className="Button Button--primary" loading={this.loading} disabled={!this.changed()}>
          {trans('forum.customize.submit_button')}
        </Button>
        <Button className="Button Button--link" disabled={this.loading || !this.hasOverrides()} onclick={() => this.resetAll()}>
          {trans('forum.customize.reset_all_button')}
        </Button>
        {this.changed() > 0 && (
          <span className="CustomizeShortcutsModal-dirty helpText">{trans('forum.customize.unsaved', { count: this.changed() })}</span>
        )}
      </div>,
    ];
  }

  tab(group: string): Mithril.Children {
    const conflicted = this.shortcutsIn(group).some((shortcut) => this.conflicts(shortcut).length > 0);
    const active = this.activeGroup === group;

    return (
      <Button
        className="Button Button--link"
        active={active}
        role="tab"
        aria-selected={active}
        onclick={() => {
          this.activeGroup = group;
        }}
      >
        {transIfExists(`lib.groups.${group}`, group)}
        {conflicted && (
          <Icon
            name="fas fa-triangle-exclamation"
            className="CustomizeShortcutsModal-tabWarning"
            aria-label={extractText(trans('forum.customize.group_has_conflict'))}
          />
        )}
      </Button>
    );
  }

  row(shortcut: Shortcut): Mithril.Children {
    const binding = this.bindings[shortcut.id] ?? '';
    const conflicts = this.conflicts(shortcut);
    const inputId = `keyboardShortcut-${shortcut.id}`;

    return (
      <div className="KeyboardShortcuts-editItem" key={shortcut.id}>
        <div className="KeyboardShortcuts-editLabel">
          <label for={inputId}>{shortcut.label()}</label>
          {!!conflicts.length && (
            <span className="KeyboardShortcuts-conflict">
              <Icon name="fas fa-triangle-exclamation" />
              {trans('lib.recorder.conflict', { shortcuts: conflicts.map((other) => extractText(other.label())).join(', ') })}
            </span>
          )}
        </div>
        <ShortcutRecorder
          id={inputId}
          value={binding}
          defaultValue={app.shortcuts.defaultBinding(shortcut.id)}
          onchange={(value: string) => {
            this.bindings[shortcut.id] = value;
          }}
        />
      </div>
    );
  }

  /**
   * The groups with something to edit, in their canonical order.
   */
  groups(): string[] {
    const groups: string[] = [];

    for (const shortcut of app.shortcuts.all()) {
      if (shortcut.visible?.() === false) continue;
      if (!groups.includes(shortcut.group)) groups.push(shortcut.group);
    }

    return groups.sort((a, b) => {
      const [ia, ib] = [GROUP_ORDER.indexOf(a), GROUP_ORDER.indexOf(b)];

      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });
  }

  shortcutsIn(group: string): Shortcut[] {
    return app.shortcuts.all().filter((shortcut) => shortcut.group === group && shortcut.visible?.() !== false);
  }

  /**
   * The other shortcuts this binding would collide with.
   *
   * Collisions are reported rather than prevented, and only within a group:
   * `j` meaning "next discussion" on the index and "next post" in a discussion
   * is a collision on paper and exactly right in practice.
   */
  conflicts(shortcut: Shortcut): Shortcut[] {
    const binding = this.bindings[shortcut.id] ?? '';

    if (!binding) return [];

    const claimed = new Set(parseBinding(binding).map((sequence) => sequenceId(sequence)));

    return this.shortcutsIn(shortcut.group).filter((other) => {
      if (other.id === shortcut.id) return false;

      return parseBinding(this.bindings[other.id] ?? '').some((sequence) => claimed.has(sequenceId(sequence)));
    });
  }

  /**
   * The bindings that differ from the forum's — the only ones worth storing.
   */
  protected overrides(): Record<string, string> {
    const overrides: Record<string, string> = {};

    for (const [id, binding] of Object.entries(this.bindings)) {
      if (binding !== app.shortcuts.defaultBinding(id)) overrides[id] = binding;
    }

    return overrides;
  }

  protected stored(): Record<string, string> {
    const preferences = app.session.user?.preferences() as Record<string, any> | undefined;
    const stored = preferences?.[PREFERENCES.bindings];

    return stored && typeof stored === 'object' ? stored : {};
  }

  protected hasOverrides(): boolean {
    return Object.keys(this.overrides()).length > 0;
  }

  /**
   * How many bindings have been edited but not yet saved.
   */
  protected changed(): number {
    const [next, current] = [this.overrides(), this.stored()];
    const keys = new Set([...Object.keys(next), ...Object.keys(current)]);

    let changed = 0;

    for (const key of keys) {
      if ((next[key] ?? '') !== (current[key] ?? '')) changed++;
    }

    return changed;
  }

  protected resetAll(): void {
    for (const id of Object.keys(this.bindings)) {
      this.bindings[id] = app.shortcuts.defaultBinding(id);
    }
  }

  onsubmit(e: SubmitEvent): void {
    e.preventDefault();

    if (!app.session.user) return;

    this.loading = true;

    app.session.user
      .savePreferences({ [PREFERENCES.bindings]: this.overrides() })
      .then(() => {
        // The manager caches parsed bindings for the key listener; the stored
        // ones have just changed underneath it.
        app.shortcuts.invalidate();

        app.alerts.show({ type: 'success' }, trans('forum.customize.saved_message'));
        this.hide();
      })
      .catch(() => {})
      .then(this.loaded.bind(this));
  }

  /**
   * The cheat sheet is a reference; this is a form. Focusing the first control
   * would start it recording, so leave focus where the modal put it.
   */
  onready(): void {
    // ...
  }
}
