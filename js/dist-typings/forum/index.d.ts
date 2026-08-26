import ShortcutManager from './ShortcutManager';
export { default as extend } from './extend';
export { default as ShortcutManager, isEditable } from './ShortcutManager';
export { default as ListCursor } from './states/ListCursor';
export { default as KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
export { default as CustomizeShortcutsModal } from './components/CustomizeShortcutsModal';
export { default as KeyCombo } from '../common/components/KeyCombo';
export { default as ShortcutRecorder } from '../common/components/ShortcutRecorder';
export * from '../common/utils/keystroke';
export * from '../common/config';
export type { Shortcut, ShortcutResult } from '../common/types';
declare module 'flarum/forum/ForumApplication' {
    export default interface ForumApplication {
        shortcuts: ShortcutManager;
    }
}
