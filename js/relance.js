/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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

/* ════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — RELANCE D'AJOUT
   Transforme le toast « ✅ Qn (...) — Xpt ajoutée ! » en une relance
   factuelle-encourageante qui invite à enchaîner. Drop-in, bilingue.
   Charger APRÈS i18n-walk.js (et après app.js) :
     <script src="js/relance.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function lang(){ return (window.I18N ? window.I18N.getLang() : "fr"); }

  // Reconnaît le toast d'ajout en FR (…pt ajout…) et EN (…pt add…)
  var ADD_RE = /^✅ Q([0-9]+).* ([0-9]+)pt (?:ajout|add)/;

  function relance(n, b){
    if (lang() === "en")
      return "✅ Question " + n + " added (" + b + " pt) — on to the next one!";
    return "✅ Question " + n + " ajoutée (" + b + " pt) — à la suivante !";
  }

  function wrapToast(){
    if (typeof window.toast !== "function" || window.toast.__hsRelance) return;
    var prev = window.toast;
    window.toast = function (msg) {
      try {
        if (typeof msg === "string") {
          var m = msg.match(ADD_RE);
          if (m) msg = relance(m[1], m[2]);
        }
      } catch (e) {}
      var args = [].slice.call(arguments);
      args[0] = msg;
      return prev.apply(this, args);
    };
    window.toast.__hsRelance = true;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", wrapToast);
  else wrapToast();
})();
