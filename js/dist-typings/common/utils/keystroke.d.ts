/**
 * Parsing, matching and formatting of keyboard bindings.
 *
 * A binding is a string such as `mod+shift+k`, `g h` or `s, /`:
 *
 *  - `+` joins the keys of a single chord;
 *  - a space joins the chords of a sequence, which must be typed in order;
 *  - a comma separates alternative bindings for the same shortcut.
 *
 * `mod` stands for the platform's primary modifier — Command on Apple devices,
 * Control everywhere else — so one binding reads correctly on every machine.
 */
export interface Chord {
    mod: boolean;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
    key: string;
}
/** A list of chords that must be typed in order. */
export type Sequence = Chord[];
/** The alternatives a single binding string expands to. */
export type Binding = Sequence[];
/**
 * Whether the current device uses Command as its primary modifier.
 *
 * `navigator.platform` is deprecated but remains the only broadly supported
 * signal here; `userAgentData` is consulted first where it exists.
 */
export declare function isApplePlatform(): boolean;
export declare function parseChord(source: string): Chord | null;
/**
 * Expand a binding string into the alternatives it stands for. Malformed
 * alternatives are dropped, so a partly-broken binding still works as far as
 * it can.
 */
export declare function parseBinding(source?: string | null): Binding;
/**
 * A comparable identity for a chord, with `mod` resolved for this platform so
 * `mod+k` and a real Command press produce the same string.
 */
export declare function chordId(chord: Chord, apple?: boolean): string;
export declare function sequenceId(sequence: Sequence, apple?: boolean): string;
export declare function chordFromEvent(event: KeyboardEvent): Chord | null;
/**
 * Turn a chord into the tokens to render as individual `<kbd>` elements.
 */
export declare function formatChord(chord: Chord, apple?: boolean): string[];
/**
 * Render a binding back to its canonical string form — the form the recorder
 * stores, so that what is saved always round-trips through {@link parseBinding}.
 */
export declare function stringifyChord(chord: Chord): string;
export declare function stringifySequence(sequence: Sequence): string;
export declare function stringifyBinding(binding: Binding): string;
/**
 * Whether `sequence` begins with every chord of `prefix` — used to keep a
 * partially typed sequence such as `g` alive while its second chord is awaited.
 */
export declare function startsWith(sequence: Sequence, prefix: Sequence, apple?: boolean): boolean;
export declare function sequencesEqual(a: Sequence, b: Sequence, apple?: boolean): boolean;
