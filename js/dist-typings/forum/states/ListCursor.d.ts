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
    protected selector: string;
    protected focusableSelector: string;
    protected activeClass: string;
    /**
     * The element the cursor is on, if it is still in the document.
     */
    protected current: HTMLElement | null;
    /**
     * @param selector Matches the items to move between.
     * @param focusableSelector Matches the element within an item to focus.
     * @param activeClass Added to the item the cursor is on.
     */
    constructor(selector: string, focusableSelector: string, activeClass?: string);
    items(): HTMLElement[];
    /**
     * The item the cursor is on. Falls back to whichever item currently contains
     * the focus, so the cursor picks up where the user clicked.
     */
    active(): HTMLElement | null;
    /**
     * Move the cursor by `delta` items and focus what it lands on.
     *
     * With no cursor yet, moving forwards starts at the first item that is at
     * least partly in view — so `j` continues from what the user is reading
     * rather than jumping back to the top of a long list.
     *
     * @return The item moved to, or `null` if the list is empty.
     */
    move(delta: number): HTMLElement | null;
    moveTo(item: HTMLElement | null): HTMLElement | null;
    protected focusable(item: HTMLElement): HTMLElement | null;
    /**
     * Activate the item under the cursor, as clicking it would.
     *
     * @return Whether there was anything to activate.
     */
    activate(): boolean;
    clear(): void;
    /**
     * The index of the first item not scrolled off the top of the viewport.
     */
    protected firstVisibleIndex(items: HTMLElement[]): number;
    protected scrollIntoView(item: HTMLElement): void;
    /**
     * The height of the sticky header, which the cursor must keep clear of.
     */
    protected headerHeight(): number;
}
