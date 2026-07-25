/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — MOTEUR i18n (architecture cible, livraison nationale)
   ------------------------------------------------------------------------
   Principe : aucun texte d'interface en dur dans le code. Chaque texte est
   une CLÉ ; les traductions vivent dans des fichiers de langue (lang/xx.js)
   qui s'enregistrent via I18N.add(code, strings, meta).

   • Fonctionne en file:// comme en http (pas de fetch : les langues sont
     chargées par de simples <script>).
   • Repli automatique : langue active → français → clé brute.
   • Rétrocompatible avec les modules existants (assistant.js, marcheur…) :
     I18N.register({fr:{…}, en:{…}}), t(), getLang(), setLang(), apply(),
     et l'événement « i18n:changed » sont conservés.

   Ordre de chargement recommandé :
     <script src="js/i18n.js"></script>
     <script src="lang/fr.js"></script>
     <script src="lang/en.js"></script>
     … (autres modules) …
   ════════════════════════════════════════════════════════════════════════ */
window.I18N = (function () {
  "use strict";

  var STORE_KEY = "stackforge_lang";
  var FALLBACK  = "fr";

  // code -> { strings:{clé:texte}, name:"Français", dir:"ltr" }
  var LANGS = {};
  var active = FALLBACK;

  /* ── Enregistrement d'une langue (API cible) ──
     I18N.add("fr", { "btn.add":"Ajouter" }, { name:"Français", dir:"ltr" }) */
  function add(code, strings, meta) {
    if (!code) return;
    if (!LANGS[code]) LANGS[code] = { strings: {}, name: code.toUpperCase(), dir: "ltr" };
    if (strings) for (var k in strings) LANGS[code].strings[k] = strings[k];
    if (meta) {
      if (meta.name) LANGS[code].name = meta.name;
      if (meta.dir)  LANGS[code].dir  = meta.dir;
    }
  }

  /* ── Rétrocompatibilité : register({ fr:{…}, en:{…} }) ──
     Conserve l'API utilisée par assistant.js et les anciens modules. */
  function register(obj) {
    if (!obj) return;
    for (var code in obj) add(code, obj[code]);
  }

  /* ── Traduction d'une clé, avec variables {x} ── */
  function t(key, vars) {
    var s = LANGS[active] && LANGS[active].strings[key];
    if (s == null) s = LANGS[FALLBACK] && LANGS[FALLBACK].strings[key];
    if (s == null) s = key;                       // dernier recours : la clé
    if (vars) for (var v in vars) s = s.split("{" + v + "}").join(vars[v]);
    return s;
  }

  /* ── Application des clés au DOM (attributs data-i18n*) ── */
  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    root.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    root.querySelectorAll("[data-i18n-val]").forEach(function (el) {
      el.value = t(el.getAttribute("data-i18n-val"));
    });
    root.querySelectorAll("[data-i18n-dataph]").forEach(function (el) {
      el.setAttribute("data-ph", t(el.getAttribute("data-i18n-dataph")));
    });
  }

  /* ── Changement de langue ── */
  function setLang(code) {
    if (!LANGS[code]) return;
    active = code;
    try { localStorage.setItem(STORE_KEY, code); } catch (e) {}
    var html = document.documentElement;
    html.setAttribute("lang", code);
    html.setAttribute("dir", LANGS[code].dir || "ltr");
    apply();
    refreshSwitcher();
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: code } }));
  }

  function getLang() { return active; }
  function langs()   { return Object.keys(LANGS); }
  function name(code){ return (LANGS[code] && LANGS[code].name) || code; }

  /* ── Sélecteur de langue (injecté dans l'en-tête) ── */
  function refreshSwitcher() {
    var sw = document.getElementById("hs-lang-switch");
    if (!sw) return;
    sw.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === active);
    });
  }
  function injectSwitcher() {
    var header = document.querySelector(".app-header");
    if (!header || document.getElementById("hs-lang-switch")) return;
    var box = document.createElement("div");
    box.id = "hs-lang-switch";
    box.className = "hs-lang-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Langue / Language");
    langs().forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-lang", code);
      b.textContent = name(code).slice(0, 2).toUpperCase();
      b.title = name(code);
      b.addEventListener("click", function () { setLang(code); });
      box.appendChild(b);
    });
    header.appendChild(box);
    refreshSwitcher();
  }
  function injectStyle() {
    if (document.getElementById("hs-i18n-style")) return;
    var st = document.createElement("style");
    st.id = "hs-i18n-style";
    st.textContent =
      ".hs-lang-switch{display:inline-flex;gap:2px;background:rgba(255,255,255,.16);" +
      "border-radius:8px;padding:2px;}" +
      ".hs-lang-switch button{border:none;background:transparent;color:#fff;cursor:pointer;" +
      "font-size:.72rem;font-weight:800;padding:4px 9px;border-radius:6px;line-height:1;}" +
      ".hs-lang-switch button.on{background:#fff;color:var(--navy,#0f172a);}";
    document.head.appendChild(st);
  }

  /* ── Initialisation (après chargement des fichiers de langue) ── */
  function init() {
    var saved = FALLBACK;
    try { var s = localStorage.getItem(STORE_KEY); if (s && LANGS[s]) saved = s; } catch (e) {}
    active = LANGS[saved] ? saved : (LANGS[FALLBACK] ? FALLBACK : (langs()[0] || FALLBACK));
    injectStyle();
    injectSwitcher();
    var html = document.documentElement;
    html.setAttribute("lang", active);
    html.setAttribute("dir", (LANGS[active] && LANGS[active].dir) || "ltr");
    apply();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  // API publique
  return {
    add: add, register: register, t: t, apply: apply,
    setLang: setLang, use: setLang, getLang: getLang,
    langs: langs, name: name
  };
})();
