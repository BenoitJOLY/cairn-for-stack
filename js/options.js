/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — OPTIONS (langue + thème clair/sombre + mode normal/expert)
   Ajoute un lien « ⚙ Options » sous le bouton « Mode assistant » et une
   fenêtre modale permettant de choisir la langue, le thème et le mode.
   Le thème et le mode sont mémorisés (localStorage).
   Charger après i18n.js et assistant.js.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var THEME_KEY = "stackforge_theme";
  var MODE_KEY  = "stackforge_mode";
  function t(k, d) {
    var v = (window.I18N && I18N.t) ? I18N.t(k) : k;
    return (v === k && d) ? d : v;   // si la clé n'est pas traduite, utiliser le libellé par défaut
  }

  /* ── Thème ── */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    syncThemeButtons(theme);
  }
  function currentTheme() {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch (e) { return "light"; }
  }
  function syncThemeButtons(theme) {
    var box = document.getElementById("hs-opt-themes");
    if (!box) return;
    box.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-theme") === theme);
    });
  }

  /* ── Mode ── */
  function applyMode(mode) {
    document.documentElement.setAttribute("data-mode", mode === "expert" ? "expert" : "normal");
    try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
    syncModeButtons(mode);
  }
  function currentMode() {
    try { return localStorage.getItem(MODE_KEY) || "normal"; } catch (e) { return "normal"; }
  }
  function syncModeButtons(mode) {
    var box = document.getElementById("hs-opt-modes");
    if (!box) return;
    box.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === mode);
    });
  }

  /* ── Modale ── */
  function buildModal() {
    if (document.getElementById("hs-opt-modal")) return;
    var back = document.createElement("div");
    back.id = "hs-opt-modal";
    back.className = "hs-opt-backdrop";
    back.addEventListener("click", function (e) { if (e.target === back) closeModal(); });

    var box = document.createElement("div");
    box.className = "hs-opt-box";
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'hs-opt-title');
    box.innerHTML =
      '<div class="hs-opt-head"><h2 id="hs-opt-title"></h2>' +
      '<button class="hs-opt-x" aria-label="close">&times;</button></div>' +
      '<section class="hs-opt-sec"><label id="hs-opt-lang-lbl"></label>' +
      '<div id="hs-opt-langs" class="hs-opt-row"></div></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-pays-lbl"></label>' +
      '<div id="hs-opt-pays" class="hs-opt-row"></div></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-theme-lbl"></label>' +
      '<div id="hs-opt-themes" class="hs-opt-row">' +
      '<button data-theme="light"></button><button data-theme="dark"></button></div></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-mode-lbl"></label>' +
      '<div id="hs-opt-modes" class="hs-opt-row">' +
      '<button data-mode="normal"></button><button data-mode="expert"></button></div>' +
      '<p class="hs-opt-hint" id="hs-opt-mode-hint"></p></section>';
    back.appendChild(box);
    document.body.appendChild(back);

    box.querySelector(".hs-opt-x").addEventListener("click", closeModal);

    // langues
    var langs = box.querySelector("#hs-opt-langs");
    (window.I18N ? I18N.langs() : ["fr"]).forEach(function (code) {
      var b = document.createElement("button");
      b.setAttribute("data-lang", code);
      b.textContent = (I18N.name ? I18N.name(code) : code);
      b.addEventListener("click", function () { I18N.setLang(code); syncLangButtons(); });
      langs.appendChild(b);
    });
    // référentiel de tags (pays)
    var paysBox = box.querySelector("#hs-opt-pays");
    if (window.TAGS_COUNTRIES) {
      Object.keys(TAGS_COUNTRIES).sort().forEach(function (code) {
        var b = document.createElement("button");
        b.setAttribute("data-pays", code);
        b.textContent = TAGS_COUNTRIES[code].label || code;
        b.addEventListener("click", function () { applyPays(code); syncPaysButtons(); });
        paysBox.appendChild(b);
      });
    }
    // thème
    box.querySelectorAll("#hs-opt-themes button").forEach(function (b) {
      b.addEventListener("click", function () { applyTheme(b.getAttribute("data-theme")); });
    });
    // mode
    box.querySelectorAll("#hs-opt-modes button").forEach(function (b) {
      b.addEventListener("click", function () { applyMode(b.getAttribute("data-mode")); });
    });

    relabel();
    syncLangButtons();
    syncPaysButtons();
    syncThemeButtons(currentTheme());
    syncModeButtons(currentMode());
  }

  function syncLangButtons() {
    var box = document.getElementById("hs-opt-langs");
    if (!box || !window.I18N) return;
    box.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === I18N.getLang());
    });
  }

  function syncPaysButtons() {
    var box = document.getElementById("hs-opt-pays");
    if (!box || typeof currentPays !== "function") return;
    var code = currentPays();
    box.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-pays") === code);
    });
  }

  function relabel() {
    var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    set("hs-opt-title", t("opt.title", "⚙ Options"));
    set("hs-opt-lang-lbl", t("opt.language", "Langue"));
    set("hs-opt-pays-lbl", t("opt.pays", "Référentiel de tags (pays)"));
    set("hs-opt-theme-lbl", t("opt.theme", "Thème"));
    set("hs-opt-mode-lbl", t("opt.mode", "Mode"));
    set("hs-opt-mode-hint", t("opt.mode_hint", "Mode Expert : accès aux variables partagées et à l'importation XML."));
    var box = document.getElementById("hs-opt-themes");
    if (box) {
      box.querySelector('[data-theme="light"]').textContent = t("opt.light", "☀ Clair");
      box.querySelector('[data-theme="dark"]').textContent = t("opt.dark", "🌙 Sombre");
    }
    var mbox = document.getElementById("hs-opt-modes");
    if (mbox) {
      mbox.querySelector('[data-mode="normal"]').textContent = t("opt.normal", "Normal");
      mbox.querySelector('[data-mode="expert"]').textContent = t("opt.expert", "Expert");
    }
    var trig = document.getElementById("hs-options-link");
    if (trig) trig.textContent = "⚙ " + t("opt.title", "Options");
  }

  function openModal() { buildModal(); document.getElementById("hs-opt-modal").classList.add("show"); }
  function closeModal() { var m = document.getElementById("hs-opt-modal"); if (m) m.classList.remove("show"); }

  /* ── Déclencheur « ⚙ Options » sous le Mode assistant ── */
  function insertTrigger() {
    if (document.getElementById("hs-options-link")) return true;
    var tog = document.getElementById("hs-assist-toggle");
    if (!tog) return false;
    // enveloppe verticale : toggle au-dessus, lien Options en dessous
    var wrap = document.createElement("div");
    wrap.className = "hs-assist-wrap";
    tog.parentNode.insertBefore(wrap, tog);
    wrap.appendChild(tog);
    var link = document.createElement("button");
    link.id = "hs-options-link";
    link.className = "hs-options-link";
    link.type = "button";
    link.textContent = "⚙ " + t("opt.title", "Options");
    link.addEventListener("click", openModal);
    wrap.appendChild(link);
    return true;
  }

  function init() {
    applyTheme(currentTheme());
    applyMode(currentMode());
    // le toggle assistant est injecté par assistant.js : on attend brièvement
    var tries = 0;
    var iv = setInterval(function () {
      if (insertTrigger() || ++tries > 40) clearInterval(iv);
    }, 50);
    document.addEventListener("i18n:changed", relabel);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
