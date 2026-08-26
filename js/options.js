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

/* ════════════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — OPTIONS (langue + thème clair/sombre + mode normal/expert)
   Ajoute un lien « ⚙ Options » sous le bouton « Mode assistant » et une
   fenêtre modale permettant de choisir la langue, le thème et le mode.
   Le thème et le mode sont mémorisés (localStorage).
   Charger après i18n.js et assistant.js.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var THEME_KEY = "cairnforstack_theme";
  var MODE_KEY  = "cairnforstack_mode";
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
      '<section class="hs-opt-sec"><label id="hs-opt-theme-lbl"></label>' +
      '<div id="hs-opt-themes" class="hs-opt-row">' +
      '<button data-theme="light"></button><button data-theme="dark"></button></div></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-mode-lbl"></label>' +
      '<div id="hs-opt-modes" class="hs-opt-row">' +
      '<button data-mode="normal"></button><button data-mode="expert"></button></div>' +
      '<p class="hs-opt-hint" id="hs-opt-mode-hint"></p></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-fbbox-lbl"></label>' +
      '<div class="hs-opt-row"><button id="hs-opt-fbbox-btn" type="button"></button></div></section>' +
      '<section class="hs-opt-sec"><label id="hs-opt-aikey-lbl"></label>' +
      '<p class="hs-opt-hint" id="hs-opt-aikey-hint"></p>' +
      '<div class="hs-opt-row">' +
      '<input type="password" id="ai-perso-key" class="hs-opt-input">' +
      '<button type="button" id="hs-opt-aikey-save"></button>' +
      '<button type="button" id="hs-opt-aikey-clear"></button>' +
      '</div><div id="ai-perso-status" class="hs-opt-hint"></div></section>';
    back.appendChild(box);
    document.body.appendChild(back);

    box.querySelector(".hs-opt-x").addEventListener("click", closeModal);

    // langues
    buildLangButtons();
    // thème
    box.querySelectorAll("#hs-opt-themes button").forEach(function (b) {
      b.addEventListener("click", function () { applyTheme(b.getAttribute("data-theme")); });
    });
    // mode
    box.querySelectorAll("#hs-opt-modes button").forEach(function (b) {
      b.addEventListener("click", function () { applyMode(b.getAttribute("data-mode")); });
    });
    // encadrés de feedback (ouvre la modale dédiée js/fb-box-options.js)
    box.querySelector("#hs-opt-fbbox-btn").addEventListener("click", function () {
      closeModal();
      if (typeof openFbBoxOptionsModal === "function") openFbBoxOptionsModal();
    });
    // clé IA personnelle (js/app.js : saveMyAiKey/clearMyAiKey/refreshMyAiKeyStatus)
    box.querySelector("#hs-opt-aikey-save").addEventListener("click", function () {
      if (typeof saveMyAiKey === "function") saveMyAiKey();
    });
    box.querySelector("#hs-opt-aikey-clear").addEventListener("click", function () {
      if (typeof clearMyAiKey === "function") clearMyAiKey();
    });

    relabel();
    syncLangButtons();
    syncThemeButtons(currentTheme());
    syncModeButtons(currentMode());
  }

  /* Construit (ou reconstruit) la liste des boutons de langue à partir de
     I18N.langs() : certaines langues sont chargées en différé après le
     premier affichage, donc cette fonction est ré-appelable (ex. depuis
     window.__hsRefreshOptionsLangs une fois le chargement différé terminé). */
  function buildLangButtons() {
    var langs = document.getElementById("hs-opt-langs");
    if (!langs) return;
    langs.innerHTML = "";
    (window.I18N ? I18N.langs() : ["fr"]).forEach(function (code) {
      var b = document.createElement("button");
      b.setAttribute("data-lang", code);
      b.textContent = (I18N.name ? I18N.name(code) : code);
      b.addEventListener("click", function () { I18N.setLang(code); syncLangButtons(); });
      langs.appendChild(b);
    });
    syncLangButtons();
  }
  window.__hsRefreshOptionsLangs = buildLangButtons;

  function syncLangButtons() {
    var box = document.getElementById("hs-opt-langs");
    if (!box || !window.I18N) return;
    box.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === I18N.getLang());
    });
  }

  function relabel() {
    var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    set("hs-opt-title", t("opt.title", "⚙ Options"));
    set("hs-opt-lang-lbl", t("opt.language", "Langue"));
    set("hs-opt-theme-lbl", t("opt.theme", "Thème"));
    set("hs-opt-mode-lbl", t("opt.mode", "Mode"));
    set("hs-opt-mode-hint", t("opt.mode_hint", "Mode Expert : accès aux variables partagées et à l'importation XML."));
    set("hs-opt-fbbox-lbl", t("opt.fbbox_lbl", "Feedbacks"));
    set("hs-opt-fbbox-btn", t("opt.fbbox_btn", "🎨 Personnaliser les encadrés"));
    set("hs-opt-aikey-lbl", t("ai.cle_perso_titre", "🤖 Clé IA personnelle"));
    set("hs-opt-aikey-hint", t("ai.cle_perso_body", "Utilisée pour la génération IA (types Radio/Dropdown) si votre établissement n'a pas configuré de clé institutionnelle. Jamais renvoyée en clair une fois enregistrée."));
    set("hs-opt-aikey-save", t("btn.save", "Enregistrer"));
    set("hs-opt-aikey-clear", t("ai.effacer_cle", "Effacer"));
    var aikeyInput = document.getElementById("ai-perso-key");
    if (aikeyInput) aikeyInput.setAttribute("placeholder", t("ai.cle_perso_placeholder", "Nouvelle clé API IA"));
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

  function openModal() {
    buildModal();
    document.getElementById("hs-opt-modal").classList.add("show");
    if (typeof refreshMyAiKeyStatus === "function") refreshMyAiKeyStatus();
  }
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
