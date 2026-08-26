const NATIVELY_FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;

/**
 * A keyboard cursor over a list of elements on the page.
 *
 * Rather than mirroring the list in state — which would go stale as items load
 * in, get marked as read, or are filtered — the cursor reads the DOM each time
 * and remembers only which element it last landed on. Moving focuses the item's
 * own focusable element, so the browser and assistive technology follow along
 * and `Enter` activates it natively.
 */
export default class ListCursor {
  /**
   * The element the cursor is on, if it is still in the document.
   */
  protected current: HTMLElement | null = null;

  /**
   * @param selector Matches the items to move between.
   * @param focusableSelector Matches the element within an item to focus.
   * @param activeClass Added to the item the cursor is on.
   */
  constructor(protected selector: string, protected focusableSelector: string, protected activeClass: string = 'KeyboardShortcuts--active') {}

  items(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(this.selector));
  }

  /**
   * The item the cursor is on. Falls back to whichever item currently contains
   * the focus, so the cursor picks up where the user clicked.
   */
  active(): HTMLElement | null {
    const items = this.items();

    if (this.current && items.includes(this.current)) return this.current;

    const focused = items.find((item) => item.contains(document.activeElement));

    return focused ?? null;
  }

  /**
   * Move the cursor by `delta` items and focus what it lands on.
   *
   * With no cursor yet, moving forwards starts at the first item that is at
   * least partly in view — so `j` continues from what the user is reading
   * rather than jumping back to the top of a long list.
   *
   * @return The item moved to, or `null` if the list is empty.
   */
  move(delta: number): HTMLElement | null {
    const items = this.items();

    if (!items.length) return null;

    const active = this.active();
    let index: number;

    if (active) {
      index = items.indexOf(active) + delta;
    } else {
      index = delta > 0 ? this.firstVisibleIndex(items) : items.length - 1;
    }

    index = Math.max(0, Math.min(items.length - 1, index));

    return this.moveTo(items[index]);
  }

  moveTo(item: HTMLElement | null): HTMLElement | null {
    if (!item) return null;

    this.clear();

    this.current = item;
    item.classList.add(this.activeClass);

    const focusable = this.focusable(item);

    if (focusable) {
      // A plain container isn't focusable on its own, but making it
      // programmatically focusable lets screen readers follow the cursor
      // without adding it to the tab order.
      if (!focusable.hasAttribute('tabindex') && !NATIVELY_FOCUSABLE.test(focusable.tagName)) {
        focusable.setAttribute('tabindex', '-1');
      }

      // Focus without scrolling, then place the item ourselves: the browser
      // would happily tuck it under the sticky header.
      focusable.focus({ preventScroll: true });
    }

    this.scrollIntoView(item);

    return item;
  }

  protected focusable(item: HTMLElement): HTMLElement | null {
    return item.matches(this.focusableSelector) ? item : item.querySelector<HTMLElement>(this.focusableSelector);
  }

  /**
   * Activate the item under the cursor, as clicking it would.
   *
   * @return Whether there was anything to activate.
   */
  activate(): boolean {
    const item = this.active();

    if (!item) return false;

    const focusable = this.focusable(item);

    if (!focusable) return false;

    focusable.click();

    return true;
  }

  clear(): void {
    document.querySelectorAll<HTMLElement>(`.${this.activeClass}`).forEach((element) => element.classList.remove(this.activeClass));

    this.current = null;
  }

  /**
   * The index of the first item not scrolled off the top of the viewport.
   */
  protected firstVisibleIndex(items: HTMLElement[]): number {
    const top = this.headerHeight();
    const index = items.findIndex((item) => item.getBoundingClientRect().bottom > top);

    return index === -1 ? 0 : index;
  }

  protected scrollIntoView(item: HTMLElement): void {
    const header = this.headerHeight();
    const rect = item.getBoundingClientRect();
    const margin = 12;

    if (rect.top < header + margin) {
      window.scrollBy({ top: rect.top - header - margin, behavior: 'auto' });
    } else if (rect.bottom > window.innerHeight - margin) {
      window.scrollBy({
        top: Math.min(rect.bottom - window.innerHeight + margin, rect.top - header - margin),
        behavior: 'auto',
      });
    }
  }

  /**
   * The height of the sticky header, which the cursor must keep clear of.
   */
  protected headerHeight(): number {
    return document.getElementById('header')?.getBoundingClientRect().height ?? 0;
  }
}
