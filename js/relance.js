/* ════════════════════════════════════════════════════════════════
   HÉSTACK — RELANCE D'AJOUT
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
