import Modal from 'flarum/common/components/Modal';
import getSetting from '../helpers/getSetting';

const packagePrefix = 'datlechin-keyboard-shortcuts.';

export default class KeyboardShortcutsModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
  }

  className() {
    return 'KeyboardShortcutsModal Modal--large';
  }

  title() {
    return app.translator.trans(packagePrefix + 'forum.modal.title');
  }

  content() {
    const groupName = (key) => app.translator.trans(packagePrefix + 'forum.modal.' + key);
    const shortcutName = (key) => app.translator.trans(packagePrefix + 'forum.modal.shortcuts.' + key);
    return (
      <div className="Modal-body">
        <div className="KeyboardShortcuts-wrap">
          <ul className="KeyboardShortcuts-list">
            <label className="KeyboardShortcuts-heading">{groupName('global_heading')}</label>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('help')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('help')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('search')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('search')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('newDiscussion')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('new_discussion')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('notifications')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('notifications')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('flags')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('flags')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('session')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('session')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('login')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('login')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('signup')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('signup')}</span>
            </li>
          </ul>
          <ul className="KeyboardShortcuts-list">
            <label className="KeyboardShortcuts-heading">{groupName('discussion_page_heading')}</label>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('back')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('back')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('pinNav')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('pin_nav')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('reply')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('reply')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('follow')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('follow')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('firstPost')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('first_post')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('lastPost')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('last_post')}</span>
            </li>
          </ul>
          <ul className="KeyboardShortcuts-list">
            <label className="KeyboardShortcuts-heading">{groupName('discussion_list_heading')}</label>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('markAllAsRead')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('mark_all_as_read')}</span>
            </li>
            <li class="KeyboardShortcuts-unit">
              <kbd class="helpKey">
                <span>{getSetting('refresh')}</span>
              </kbd>
              <span class="helpKey-desc">{shortcutName('refresh')}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
