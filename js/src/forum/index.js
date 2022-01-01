import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Page from 'flarum/common/components/Page';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import hotkeys from 'hotkeys-js';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import getSetting from './helpers/getSetting';

app.initializers.add('datlechin/flarum-keyboard-shortcuts', () => {
  extend(Page.prototype, 'oninit', function () {
    hotkeys(getSetting('help'), () => {
      app.modal.show(KeyboardShortcutsModal);
    });

    hotkeys(getSetting('search'), () => {
      $('.Search-input input').focus();
    });

    hotkeys(getSetting('newDiscussion'), () => {
      $('.item-newDiscussion button').click();
    });

    hotkeys(getSetting('notifications'), () => {
      $('.item-notifications button').click();
    });

    hotkeys(getSetting('flags'), () => {
      $('.item-flags button').click();
    });

    hotkeys(getSetting('session'), () => {
      $('.item-session .Button--user').click();
    });

    hotkeys(getSetting('signup'), () => {
      $('.item-signUp button').click();
    });

    hotkeys(getSetting('login'), () => {
      $('.item-logIn button').click();
    });
  });

  extend(DiscussionPage.prototype, 'oninit', function () {
    hotkeys(getSetting('back'), () => {
      app.history.back();
    });

    hotkeys(getSetting('pinNav'), () => {
      app.pane.togglePinned.bind(app.pane)();
      app.pane.hide();
    });

    hotkeys(getSetting('follow'), () => {
      $('.SubscriptionMenu-button').click();
    });

    hotkeys(getSetting('reply'), () => {
      $('.SplitDropdown-button').click();
    });

    hotkeys(getSetting('firstPost'), () => {
      app.current.data.stream.goToFirst();
    });

    hotkeys(getSetting('lastPost'), () => {
      app.current.data.stream.goToLast();
    });
  });

  extend(DiscussionList.prototype, 'oninit', function () {
    hotkeys(getSetting('refresh'), () => {
      $('.item-refresh button').click();
    });

    hotkeys(getSetting('markAllAsRead'), () => {
      $('.item-markAllAsRead button').click();
    });
  });
});
