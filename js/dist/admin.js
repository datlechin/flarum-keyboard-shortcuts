(()=>{var t={n:s=>{var e=s&&s.__esModule?()=>s.default:()=>s;return t.d(e,{a:e}),e},d:(s,e)=>{for(var o in e)t.o(e,o)&&!t.o(s,o)&&Object.defineProperty(s,o,{enumerable:!0,get:e[o]})},o:(t,s)=>Object.prototype.hasOwnProperty.call(t,s),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},s={};(()=>{"use strict";t.r(s);const e=flarum.core.compat["admin/app"];var o=t.n(e);function r(t,s){return r=Object.setPrototypeOf||function(t,s){return t.__proto__=s,t},r(t,s)}const i=flarum.core.compat["admin/components/ExtensionPage"];var n="datlechin-keyboard-shortcuts.",a=function(t){var s,e;function o(){return t.apply(this,arguments)||this}e=t,(s=o).prototype=Object.create(e.prototype),s.prototype.constructor=s,r(s,e);var i=o.prototype;return i.oninit=function(s){t.prototype.oninit.call(this,s)},i.content=function(){return m("div",{className:"ExtensionPage-settings"},m("div",{className:"container"},m("div",{className:"KeyboardShortcuts-settings Form"},m("div",{className:"KeyboardShortcuts-first"},m("h2",null,app.translator.trans(n+"lib.global_heading")),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.help")),this.buildSettingComponent({type:"text",setting:n+"help"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.search")),this.buildSettingComponent({type:"text",setting:n+"search"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.new_discussion")),this.buildSettingComponent({type:"text",setting:n+"newDiscussion"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.notifications")),this.buildSettingComponent({type:"text",setting:n+"notifications"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.flags")),this.buildSettingComponent({type:"text",setting:n+"flags"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.session")),this.buildSettingComponent({type:"text",setting:n+"session"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.login")),this.buildSettingComponent({type:"text",setting:n+"login"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.signup")),this.buildSettingComponent({type:"text",setting:n+"signup"}))),m("div",{className:"KeyboardShortcuts-second"},m("h2",null,app.translator.trans(n+"lib.discussion_page_heading")),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.back")),this.buildSettingComponent({type:"text",setting:n+"back"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.pin_nav")),this.buildSettingComponent({type:"text",setting:n+"pinNav"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.reply")),this.buildSettingComponent({type:"text",setting:n+"reply"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.follow")),this.buildSettingComponent({type:"text",setting:n+"follow"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.first_post")),this.buildSettingComponent({type:"text",setting:n+"firstPost"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.last_post")),this.buildSettingComponent({type:"text",setting:n+"lastPost"}))),m("div",{className:"KeyboardShortcuts-third"},m("h2",null,app.translator.trans(n+"lib.discussion_list_heading")),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.mark_all_as_read")),this.buildSettingComponent({type:"text",setting:n+"markAllAsRead"})),m("div",{class:"Form-group"},m("div",{class:"helpText"},app.translator.trans(n+"lib.shortcuts.refresh")),this.buildSettingComponent({type:"text",setting:n+"refresh"})))),m("div",{class:"Form-group button"},this.submitButton())))},o}(t.n(i)());o().initializers.add("datlechin/flarum-keyboard-shortcuts",(function(){o().extensionData.for("datlechin-keyboard-shortcuts").registerPage(a)}))})(),module.exports=s})();
//# sourceMappingURL=admin.js.map