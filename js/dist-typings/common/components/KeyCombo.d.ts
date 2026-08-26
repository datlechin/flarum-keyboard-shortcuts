import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { type Binding } from '../utils/keystroke';
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
    view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children;
    /**
     * The binding as a sentence, for assistive technology.
     */
    protected spoken(binding: Binding, apple: boolean): string;
}
