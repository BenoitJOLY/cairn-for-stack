/*
 * StackForge — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

window.FocusTrap = (function () {
  var _active = null, _trigger = null, _onClose = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable],[tabindex]:not([tabindex="-1"])';

  function getFocusable(el) {
    return Array.prototype.slice.call(el.querySelectorAll(FOCUSABLE)).filter(function (e) {
      return e.offsetParent !== null;
    });
  }

  function handleKeyDown(e) {
    if (!_active) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (_onClose) _onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    var f = getFocusable(_active);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function trap(el, onClose) {
    _trigger = document.activeElement;
    _active = el;
    _onClose = onClose || null;
    document.addEventListener('keydown', handleKeyDown);
    var f = getFocusable(el);
    if (f.length) setTimeout(function () { f[0].focus(); }, 50);
  }

  function release() {
    _active = null;
    _onClose = null;
    document.removeEventListener('keydown', handleKeyDown);
    if (_trigger && _trigger.focus) try { _trigger.focus(); } catch (e) {}
    _trigger = null;
  }

  function initModals() {
    document.querySelectorAll('.modal-backdrop').forEach(function (el) {
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      // aria-labelledby : pointe vers le premier titre trouvé dans la modale
      if (!el.getAttribute('aria-labelledby') && !el.getAttribute('aria-label')) {
        var heading = el.querySelector('h1,h2,h3,h4,[role="heading"]');
        if (heading) {
          if (!heading.id) heading.id = 'modal-title-' + Math.random().toString(36).slice(2, 7);
          el.setAttribute('aria-labelledby', heading.id);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModals);
  } else {
    initModals();
  }

  return { trap: trap, release: release };
})();
