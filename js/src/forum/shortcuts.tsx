import app from 'flarum/forum/app';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import IndexPage from 'flarum/forum/components/IndexPage';
import GlobalSearch from 'flarum/forum/components/GlobalSearch';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import ThemeMode from 'flarum/common/components/ThemeMode';
import extractText from 'flarum/common/utils/extractText';

import { trans } from '../common/config';
import type { Shortcut } from '../common/types';
import type ShortcutManager from './ShortcutManager';
import ListCursor from './states/ListCursor';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

/**
 * Cursors for the two lists that can be walked with `j`/`k`. They are module
 * level because a cursor outlives any one component: the discussion list is
 * re-rendered constantly, and the post stream loads in around the reader.
 */
export const discussionCursor = new ListCursor('.DiscussionList-discussions > li', '.DiscussionListItem-main');
export const postCursor = new ListCursor('.PostStream-item[data-index]', '.PostStream-item[data-index]');

/**
 * Whether the discussion list is the thing on screen. The list also appears in
 * the pinned side pane of a discussion, but there it is a navigation aid rather
 * than the focus, so `j`/`k` stay with the posts.
 */
function onDiscussionList(): boolean {
  return app.current.matches(IndexPage) && !!document.querySelector('.IndexPage .DiscussionList-discussions');
}

function onDiscussion(): boolean {
  return app.current.matches(DiscussionPage);
}

function composerOpen(): boolean {
  return app.composer.isVisible();
}

/**
 * Click a control in the page chrome, given the item key its list entry uses.
 *
 * The header's dropdowns have no state object to drive directly, so the button
 * is the API. Returning `false` when it isn't there leaves the key press to the
 * browser instead of silently swallowing it.
 */
function activateHeaderItem(itemName: string, selector: string = '.Dropdown-toggle'): boolean {
  const item = `.item-${itemName}`;

  // Some controls are wrapped in their list item, others are the list item, so
  // both are tried. A tag selector can only be the former.
  const selectors = selector.startsWith('.') ? [`${item} ${selector}`, `${item}${selector}`] : [`${item} ${selector}`];

  const element = document.querySelector<HTMLElement>(selectors.join(', '));

  if (!element) return false;

  element.click();
  element.focus?.({ preventScroll: true });

  return true;
}

function navigate(name: string, params: Record<string, unknown> = {}): boolean {
  m.route.set(app.route(name, params));

  return true;
}

/**
 * The post stream of the discussion currently on screen, if it has finished
 * loading.
 */
function stream(): any | null {
  return app.current.get('stream') ?? null;
}

/**
 * The discussion currently on screen.
 */
function discussion(): any | null {
  return app.current.get('discussion') ?? stream()?.discussion ?? null;
}

/**
 * Every shortcut this extension ships, in the order they are listed.
 *
 * Handlers deliberately prefer core's own state objects and controls over
 * poking at the DOM: `app.composer`, `PostStreamState`, `DiscussionControls`
 * and so on already handle permissions, loading and history for us.
 */
export default function registerShortcuts(manager: ShortcutManager): void {
  const shortcuts: Shortcut[] = [
    // ---------------------------------------------------------------- global

    {
      id: 'help',
      group: 'global',
      label: () => trans('lib.shortcuts.help'),
      // The cheat sheet has to be reachable from inside itself, so that the key
      // that opened it also closes it.
      allowInModal: true,
      action: () => {
        // Any other modal is somebody else's: taking the key press to close it
        // would be a surprise, so decline and leave it to Esc.
        if (app.modal.isModalOpen()) {
          if (!document.querySelector('.KeyboardShortcutsModal')) return false;

          app.modal.close();

          return true;
        }

        app.modal.show(KeyboardShortcutsModal);

        return true;
      },
    },

    {
      id: 'search',
      group: 'global',
      label: () => trans('lib.shortcuts.search'),
      action: () => {
        // Prefer the search control that is already on the page: it carries
        // core's drawer handling and any decoration extensions have added.
        const control = document.querySelector<HTMLElement>('.Search .Search-input');

        if (control) {
          control.click();
          return;
        }

        app.drawer.hide();

        app.modal.show(() => import('flarum/common/components/SearchModal'), {
          searchState: app.search.state,
          sources: searchSources(),
        });
      },
    },

    {
      id: 'newDiscussion',
      group: 'global',
      label: () => trans('lib.shortcuts.new_discussion'),
      action: () => {
        if (!app.session.user) {
          app.modal.show(() => import('flarum/forum/components/LogInModal'));
          return;
        }

        if (!app.forum.attribute<boolean>('canStartDiscussion')) return false;

        app.composer.load(() => import('flarum/forum/components/DiscussionComposer'), { user: app.session.user }).then(() => app.composer.show());

        return true;
      },
    },

    {
      id: 'notifications',
      group: 'global',
      label: () => trans('lib.shortcuts.notifications'),
      visible: () => !!app.session.user,
      action: () => activateHeaderItem('notifications'),
    },

    {
      id: 'flags',
      group: 'global',
      label: () => trans('lib.shortcuts.flags'),
      // Provided by flarum/flags; hidden from the cheat sheet when it isn't on.
      visible: () => !!document.querySelector('.item-flags'),
      action: () => activateHeaderItem('flags'),
    },

    {
      id: 'session',
      group: 'global',
      label: () => trans('lib.shortcuts.session'),
      visible: () => !!app.session.user,
      action: () => activateHeaderItem('session'),
    },

    {
      id: 'login',
      group: 'global',
      label: () => trans('lib.shortcuts.login'),
      visible: () => !app.session.user,
      action: () => {
        if (app.session.user) return false;

        app.modal.show(() => import('flarum/forum/components/LogInModal'));

        return true;
      },
    },

    {
      id: 'signup',
      group: 'global',
      label: () => trans('lib.shortcuts.signup'),
      visible: () => !app.session.user && !!app.forum.attribute('allowSignUp'),
      action: () => {
        if (app.session.user || !app.forum.attribute('allowSignUp')) return false;

        app.modal.show(() => import('flarum/forum/components/SignUpModal'));

        return true;
      },
    },

    {
      id: 'toggleTheme',
      group: 'global',
      label: () => trans('lib.shortcuts.toggle_theme'),
      visible: () => app.allowUserColorScheme && !!app.forum.attribute('showThemeSelector'),
      action: () => {
        if (!app.allowUserColorScheme) return false;

        const schemes = ThemeMode.colorSchemes.map((scheme) => scheme.id);
        const next = schemes[(schemes.indexOf(activeColorScheme()) + 1) % schemes.length];

        app.setColorScheme(next);

        if (app.session.user) {
          app.session.user.savePreferences({ colorScheme: next });
        } else {
          sessionStorage.setItem('colorScheme', next);
        }

        return true;
      },
    },

    {
      id: 'back',
      group: 'global',
      label: () => trans('lib.shortcuts.back'),
      action: () => {
        if (!app.history.canGoBack()) return false;

        app.history.back();

        return true;
      },
    },

    // ------------------------------------------------------------ navigation

    {
      id: 'goHome',
      group: 'navigation',
      label: () => trans('lib.shortcuts.go_home'),
      action: () => navigate('index'),
    },

    {
      id: 'goNotifications',
      group: 'navigation',
      label: () => trans('lib.shortcuts.go_notifications'),
      visible: () => !!app.session.user,
      action: () => (app.session.user ? navigate('notifications') : false),
    },

    {
      id: 'goProfile',
      group: 'navigation',
      label: () => trans('lib.shortcuts.go_profile'),
      visible: () => !!app.session.user,
      action: () => {
        if (!app.session.user) return false;

        m.route.set(app.route.user(app.session.user));

        return true;
      },
    },

    {
      id: 'goSettings',
      group: 'navigation',
      label: () => trans('lib.shortcuts.go_settings'),
      visible: () => !!app.session.user,
      action: () => (app.session.user ? navigate('settings') : false),
    },

    // -------------------------------------------------------- discussion list

    {
      id: 'nextDiscussion',
      group: 'discussionList',
      label: () => trans('lib.shortcuts.next_discussion'),
      when: onDiscussionList,
      action: () => !!discussionCursor.move(1),
    },

    {
      id: 'previousDiscussion',
      group: 'discussionList',
      label: () => trans('lib.shortcuts.previous_discussion'),
      when: onDiscussionList,
      action: () => !!discussionCursor.move(-1),
    },

    {
      id: 'openDiscussion',
      group: 'discussionList',
      label: () => trans('lib.shortcuts.open_discussion'),
      when: onDiscussionList,
      action: () => {
        // Enter belongs to whatever has focus. Only claim it when the cursor
        // itself holds the focus — otherwise pressing Enter on "load more", or
        // on any other control, would open a discussion instead.
        const item = discussionCursor.active();

        if (!item || !item.contains(document.activeElement)) return false;

        return discussionCursor.activate();
      },
    },

    {
      id: 'markAllAsRead',
      group: 'discussionList',
      label: () => trans('lib.shortcuts.mark_all_as_read'),
      when: onDiscussionList,
      visible: () => !!app.session.user,
      action: () => {
        if (!app.session.user) return false;

        // Reuse the page's own action so the confirmation prompt — and any
        // extension that has overridden it — still applies. `currentPage` is
        // recorded by this extension when the page initialises.
        const page = app.current.get('currentPage') as IndexPage | undefined;

        if (typeof (page as any)?.markAllAsRead === 'function') {
          (page as any).markAllAsRead();
          return true;
        }

        return activateHeaderItem('markAllAsRead', 'button');
      },
    },

    {
      id: 'refresh',
      group: 'discussionList',
      label: () => trans('lib.shortcuts.refresh'),
      when: onDiscussionList,
      action: () => {
        app.discussions.refresh();

        if (app.session.user) {
          app.store.find('users', app.session.user.id()!);
        }

        discussionCursor.clear();
      },
    },

    // ------------------------------------------------------------- discussion

    {
      id: 'reply',
      group: 'discussion',
      label: () => trans('lib.shortcuts.reply'),
      when: onDiscussion,
      action: () => {
        const current = discussion();

        if (!current) return false;

        DiscussionControls.replyAction.call(current, true, false).catch(() => {});

        return true;
      },
    },

    {
      id: 'follow',
      group: 'discussion',
      label: () => trans('lib.shortcuts.follow'),
      // Provided by flarum/subscriptions.
      visible: () => !!app.session.user && 'subscription' in (app.store.models.discussions?.prototype ?? {}),
      when: onDiscussion,
      action: () => {
        const current = discussion();

        if (!app.session.user || !current || typeof current.subscription !== 'function') return false;

        const subscription = current.subscription();

        current.save({ subscription: subscription === 'follow' ? null : 'follow' });

        return true;
      },
    },

    {
      id: 'nextPost',
      group: 'discussion',
      label: () => trans('lib.shortcuts.next_post'),
      when: onDiscussion,
      action: () => !!postCursor.move(1),
    },

    {
      id: 'previousPost',
      group: 'discussion',
      label: () => trans('lib.shortcuts.previous_post'),
      when: onDiscussion,
      action: () => !!postCursor.move(-1),
    },

    {
      id: 'firstPost',
      group: 'discussion',
      label: () => trans('lib.shortcuts.first_post'),
      when: onDiscussion,
      action: () => {
        const state = stream();

        if (!state) return false;

        postCursor.clear();
        state.goToFirst();

        return true;
      },
    },

    {
      id: 'lastPost',
      group: 'discussion',
      label: () => trans('lib.shortcuts.last_post'),
      when: onDiscussion,
      action: () => {
        const state = stream();

        if (!state) return false;

        postCursor.clear();
        state.goToLast();

        return true;
      },
    },

    {
      id: 'renameDiscussion',
      group: 'discussion',
      label: () => trans('lib.shortcuts.rename_discussion'),
      when: onDiscussion,
      visible: () => !!app.session.user,
      action: () => {
        const current = discussion();

        if (!current?.canRename?.()) return false;

        DiscussionControls.renameAction.call(current);

        return true;
      },
    },

    {
      id: 'pinNav',
      group: 'discussion',
      label: () => trans('lib.shortcuts.pin_nav'),
      when: onDiscussion,
      action: () => {
        if (!app.pane) return false;

        app.pane.togglePinned();
        app.pane.hide();

        return true;
      },
    },

    // --------------------------------------------------------------- composer

    {
      id: 'toggleFullScreen',
      group: 'composer',
      label: () => trans('lib.shortcuts.toggle_full_screen'),
      when: composerOpen,
      // Composer shortcuts have to work while the editor has focus — that is
      // the only time they are useful — so they are bound to modified keys.
      allowInInput: true,
      action: () => {
        if (app.composer.isFullScreen()) {
          app.composer.exitFullScreen();
        } else {
          app.composer.fullScreen();
        }
      },
    },

    {
      id: 'minimizeComposer',
      group: 'composer',
      label: () => trans('lib.shortcuts.minimize_composer'),
      when: composerOpen,
      allowInInput: true,
      action: () => app.composer.minimize(),
    },
  ];

  shortcuts.forEach((shortcut, index) => manager.register(shortcut, shortcuts.length - index));
}

/**
 * The colour scheme currently in force.
 *
 * `app.colorScheme` holds this at runtime, but it only appeared during the 2.0
 * release candidates — deriving it from the same sources core persists it to
 * keeps the extension working across the whole `^2.0` range.
 */
function activeColorScheme(): string {
  const stored = app.session.user
    ? (app.session.user.preferences() as Record<string, any> | null)?.colorScheme
    : sessionStorage.getItem('colorScheme');

  return stored ?? app.forum.attribute<string>('colorScheme') ?? 'auto';
}

/**
 * The search sources to hand the search modal when no search control is
 * mounted to click — on a page whose header search is hidden, for instance.
 *
 * `sourceItems` is an instance method on `GlobalSearch` but reads only from
 * `app`, so a bare instance is enough to ask it the same question core does.
 */
function searchSources() {
  return new GlobalSearch().sourceItems().toArray();
}

/**
 * The accessible name for the cheat sheet, used by the modal and the settings
 * page alike.
 */
export function cheatSheetTitle(): string {
  return extractText(trans('forum.modal.title'));
}
