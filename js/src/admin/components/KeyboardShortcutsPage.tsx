import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type { ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type { ResetSettingItem } from 'flarum/admin/components/ResetExtensionSettingsModal';
import FormSection from 'flarum/admin/components/FormSection';
import FormSectionGroup from 'flarum/admin/components/FormSectionGroup';
import Form from 'flarum/common/components/Form';
import Icon from 'flarum/common/components/Icon';
import InfoTile from 'flarum/common/components/InfoTile';
import Input from 'flarum/common/components/Input';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import ShortcutRecorder from '../../common/components/ShortcutRecorder';
import { SETTINGS, settingKey, trans, transIfExists } from '../../common/config';
import { parseBinding, sequenceId } from '../../common/utils/keystroke';
import { shortcutGroups, shortcutLabel, type ShortcutDescriptor } from '../catalogue';

/**
 * The forum-wide shortcut configuration.
 *
 * Bindings are recorded rather than typed: an administrator presses the keys
 * they mean, and what gets stored is exactly the form the forum frontend
 * matches against — no need to know how to spell `⌘` or `PageDown`.
 *
 * Thirty-odd bindings are tabular data, so they are laid out as a table rather
 * than as settings cards: `FormSection` caps at 400px, which would leave a
 * single cramped column and a page of empty space beside it. Only the handful
 * of settings that govern shortcuts as a whole belong in a card.
 *
 * The catalogue itself comes from the API document, so the shipped defaults are
 * defined in exactly one place (`Shortcuts.php`) rather than mirrored here.
 */
export default class KeyboardShortcutsPage<Attrs extends ExtensionPageAttrs = ExtensionPageAttrs> extends ExtensionPage<Attrs> {
  /**
   * Filters the list of shortcuts. Thirty-odd rows is a lot to scan for the
   * one you came to change.
   */
  protected query = '';

  content(vnode: Mithril.VnodeDOM<Attrs, this>) {
    return (
      <div className="ExtensionPage-settings KeyboardShortcutsPage">
        <div className="container">
          <Form>
            {this.behaviourSection()}
            {this.bindingsSection()}

            <div className="Form-group Form-controls">
              {this.submitButton()}
              {this.resetButton(this.resettableSettings(), extractText(trans('admin.reset_title')), this.extension.id)}
            </div>
          </Form>
        </div>
      </div>
    );
  }

  /**
   * The settings that govern shortcuts as a whole, rather than any one binding.
   */
  behaviourSection(): Mithril.Children {
    return (
      <FormSectionGroup className="KeyboardShortcutsPage-behaviour">
        <FormSection label={trans('admin.behaviour_heading')}>
          {/* `FormSection` only spaces its label from its body; the rhythm
              between the settings themselves comes from `Form`, which is how
              core's own admin pages fill a section. */}
          <Form>
            {this.buildSettingComponent({
              setting: SETTINGS.enabledByDefault,
              type: 'bool',
              label: trans('admin.enabled_by_default_label'),
              help: trans('admin.enabled_by_default_help'),
            })}
            {this.buildSettingComponent({
              setting: SETTINGS.allowCustomization,
              type: 'bool',
              label: trans('admin.allow_customization_label'),
              help: trans('admin.allow_customization_help'),
            })}
            {this.buildSettingComponent({
              setting: SETTINGS.sequenceTimeout,
              type: 'number',
              min: 250,
              max: 5000,
              step: 50,
              label: trans('admin.sequence_timeout_label'),
              help: trans('admin.sequence_timeout_help'),
            })}
          </Form>
        </FormSection>
      </FormSectionGroup>
    );
  }

  /**
   * The bindings themselves: a heading, a filter, and the table.
   */
  bindingsSection(): Mithril.Children {
    const rows = this.rows();

    return (
      <div className="Form-group KeyboardShortcutsPage-bindings">
        <div className="KeyboardShortcutsPage-bindingsHeader">
          <label>{trans('admin.bindings_heading')}</label>
          {this.filter()}
        </div>
        <div className="helpText">{trans('admin.bindings_help')}</div>

        {rows.length ? (
          <table className="KeyboardShortcutsTable">
            <thead>
              <tr>
                <th scope="col">{trans('admin.column_shortcut')}</th>
                <th scope="col">{trans('admin.column_binding')}</th>
              </tr>
            </thead>
            {rows}
          </table>
        ) : (
          <InfoTile icon="fas fa-keyboard">{trans('admin.no_results', { query: this.query })}</InfoTile>
        )}
      </div>
    );
  }

  filter(): Mithril.Children {
    const label = extractText(trans('admin.filter_placeholder'));

    return (
      <Input
        className="KeyboardShortcutsPage-filter"
        type="search"
        prefixIcon="fas fa-search"
        clearable={true}
        clearLabel={extractText(trans('admin.filter_clear_label'))}
        aria-label={label}
        placeholder={label}
        value={this.query}
        onchange={(value: string) => {
          this.query = value;
        }}
      />
    );
  }

  /**
   * A `tbody` per group, so each keeps its own heading row while the columns
   * stay aligned across the whole table.
   */
  rows(): Mithril.Children[] {
    const bodies: Mithril.Children[] = [];

    for (const [group, shortcuts] of shortcutGroups()) {
      const matching = shortcuts.filter((shortcut) => this.matchesQuery(shortcut));

      if (!matching.length) continue;

      bodies.push(
        <tbody className="KeyboardShortcutsTable-group" key={group}>
          <tr className="KeyboardShortcutsTable-groupRow">
            <th scope="colgroup" colspan={2}>
              {transIfExists(`lib.groups.${group}`, group)}
            </th>
          </tr>
          {matching.map((shortcut) => this.row(shortcut))}
        </tbody>
      );
    }

    return bodies;
  }

  row(shortcut: ShortcutDescriptor): Mithril.Children {
    const setting = this.binding(shortcut);
    const conflicts = this.conflicts(shortcut);
    const inputId = `keyboardShortcut-${shortcut.id}`;

    return (
      <tr className="KeyboardShortcutsTable-row" key={shortcut.id}>
        <th scope="row" className="KeyboardShortcutsTable-label">
          <label for={inputId}>{shortcutLabel(shortcut)}</label>
          {!!conflicts.length && (
            <span className="KeyboardShortcuts-conflict">
              <Icon name="fas fa-triangle-exclamation" />
              {trans('lib.recorder.conflict', { shortcuts: conflicts.map((other) => extractText(shortcutLabel(other))).join(', ') })}
            </span>
          )}
        </th>
        <td className="KeyboardShortcutsTable-binding">
          <ShortcutRecorder id={inputId} value={setting()} defaultValue={shortcut.default} onchange={(binding: string) => setting(binding)} />
        </td>
      </tr>
    );
  }

  /**
   * The tracked stream for a shortcut's binding, labelled so the reset modal
   * can name it.
   */
  protected binding(shortcut: ShortcutDescriptor) {
    return this.setting(settingKey(shortcut.id), shortcut.default, shortcutLabel(shortcut));
  }

  /**
   * The other shortcuts in the same group currently claiming the same binding.
   *
   * Only collisions within a group are reported: the same key meaning different
   * things on different pages is the point of scoping, so flagging those would
   * be noise.
   */
  conflicts(shortcut: ShortcutDescriptor): ShortcutDescriptor[] {
    const binding = this.binding(shortcut)();

    if (!binding) return [];

    const claimed = new Set(parseBinding(binding).map((sequence) => sequenceId(sequence)));

    return this.siblings(shortcut).filter((other) => parseBinding(this.binding(other)()).some((sequence) => claimed.has(sequenceId(sequence))));
  }

  protected siblings(shortcut: ShortcutDescriptor): ShortcutDescriptor[] {
    for (const [group, shortcuts] of shortcutGroups()) {
      if (group === shortcut.group) return shortcuts.filter((other) => other.id !== shortcut.id);
    }

    return [];
  }

  matchesQuery(shortcut: ShortcutDescriptor): boolean {
    const query = this.query.trim().toLowerCase();

    if (!query) return true;

    const label = extractText(shortcutLabel(shortcut)).toLowerCase();
    const binding = (this.binding(shortcut)() || '').toLowerCase();

    return label.includes(query) || binding.includes(query) || shortcut.id.toLowerCase().includes(query);
  }

  /**
   * Every setting this page owns, so "reset settings" restores the whole
   * extension rather than only what happens to be on screen.
   */
  resettableSettings(): ResetSettingItem[] {
    const items: ResetSettingItem[] = Object.values(SETTINGS).map((key) => ({
      key: key as string,
      label: this.settingLabels[key],
    }));

    for (const [, shortcuts] of shortcutGroups()) {
      for (const shortcut of shortcuts) {
        items.push({ key: settingKey(shortcut.id), label: shortcutLabel(shortcut) });
      }
    }

    return items;
  }
}
