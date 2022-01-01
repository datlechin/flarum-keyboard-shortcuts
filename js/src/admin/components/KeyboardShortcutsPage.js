import ExtensionPage from 'flarum/admin/components/ExtensionPage';

const packagePrefix = 'datlechin-keyboard-shortcuts.';

export default class KeyboardShortcutsPage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
  }

  content() {
    return (
      <div className="ExtensionPage-settings">
        <div className="container">
          <div className="KeyboardShortcuts-settings Form">
            <div className="KeyboardShortcuts-first">
              <h2>{app.translator.trans(packagePrefix + 'lib.global_heading')}</h2>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.help')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'help',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.search')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'search',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.new_discussion')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'newDiscussion',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.notifications')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'notifications',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.flags')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'flags',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.session')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'session',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.login')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'login',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.signup')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'signup',
                })}
              </div>
            </div>
            <div className="KeyboardShortcuts-second">
              <h2>{app.translator.trans(packagePrefix + 'lib.discussion_page_heading')}</h2>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.back')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'back',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.pin_nav')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'pinNav',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.reply')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'reply',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.follow')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'follow',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.first_post')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'firstPost',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.last_post')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'lastPost',
                })}
              </div>
            </div>
            <div className="KeyboardShortcuts-third">
              <h2>{app.translator.trans(packagePrefix + 'lib.discussion_list_heading')}</h2>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.mark_all_as_read')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'markAllAsRead',
                })}
              </div>
              <div class="Form-group">
                <div class="helpText">{app.translator.trans(packagePrefix + 'lib.shortcuts.refresh')}</div>
                {this.buildSettingComponent({
                  type: 'text',
                  setting: packagePrefix + 'refresh',
                })}
              </div>
            </div>
          </div>
          <div class="Form-group button">{this.submitButton()}</div>
        </div>
      </div>
    );
  }
}
