import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import classList from 'flarum/common/utils/classList';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';

import { trans } from '../config';
import { formatChord, isApplePlatform, parseBinding, type Binding } from '../utils/keystroke';

export interface IKeyComboAttrs extends ComponentAttrs {
  className?: string;

  /**
   * The binding to render, as stored (`mod+shift+k`, `g h`, `s, /`).
   */
  binding?: string | null;

  /**
   * Shown when the binding is empty, instead of nothing at all.
   */
  emptyLabel?: Mithril.Children;
}

/**
 * Renders a binding as `<kbd>` elements.
 *
 * Chords within a sequence are separated by a "then", alternatives by an "or",
 * so `g h` and `s, /` read as the different things they are. Modifiers use the
 * symbols the reader's own platform uses.
 *
 * The whole combo carries a plain-text `aria-label`, and the decorative
 * separators are hidden from assistive technology — otherwise a screen reader
 * would read "⇧ ⌘ K" as three unrelated letters.
 */
export default class KeyCombo<CustomAttrs extends IKeyComboAttrs = IKeyComboAttrs> extends Component<CustomAttrs> {
  view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children {
    const { binding, emptyLabel, className, ...attrs } = this.attrs;
    const parsed: Binding = parseBinding(binding);

    if (!parsed.length) {
      return (
        <span className={classList('KeyCombo KeyCombo--empty', className)} {...attrs}>
          {emptyLabel ?? trans('lib.unbound')}
        </span>
      );
    }

    const apple = isApplePlatform();

    return (
      <span className={classList('KeyCombo', className)} aria-label={this.spoken(parsed, apple)} {...attrs}>
        {parsed.map((sequence, alternative) => (
          <span className="KeyCombo-alternative" aria-hidden="true">
            {alternative > 0 && <span className="KeyCombo-separator">{trans('lib.binding_or')}</span>}
            {sequence.map((chord, step) => (
              <span className="KeyCombo-chord">
                {step > 0 && <span className="KeyCombo-separator">{trans('lib.binding_then')}</span>}
                {formatChord(chord, apple).map((key) => (
                  <kbd className="KeyCombo-key">{key}</kbd>
                ))}
              </span>
            ))}
          </span>
        ))}
      </span>
    );
  }

  /**
   * The binding as a sentence, for assistive technology.
   */
  protected spoken(binding: Binding, apple: boolean): string {
    const or = extractText(trans('lib.binding_or'));
    const then = extractText(trans('lib.binding_then'));

    return binding.map((sequence) => sequence.map((chord) => formatChord(chord, apple).join(' ')).join(` ${then} `)).join(` ${or} `);
  }
}
