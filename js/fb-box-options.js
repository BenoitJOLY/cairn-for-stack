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

// ── MODALE OPTIONS : styles des encadrés de feedback (js/fb-box.js) ──
var FB_BOX_KIND_LABELS = {
    true:    'fbbox.type_true',
    partial: 'fbbox.type_partial',
    false:   'fbbox.type_false',
    general: 'fbbox.type_general'
};
var FB_BOX_KIND_ORDER = ['true', 'partial', 'false', 'general'];

function _fbBoxRowId(kind, field) { return 'fbbox-' + kind + '-' + field; }

function _fbBoxRenderPreview(kind) {
    var colorEl = document.getElementById(_fbBoxRowId(kind, 'color'));
    var bgEl = document.getElementById(_fbBoxRowId(kind, 'bg'));
    var iconEl = document.getElementById(_fbBoxRowId(kind, 'icon'));
    var prev = document.getElementById(_fbBoxRowId(kind, 'preview'));
    if (!colorEl || !bgEl || !iconEl || !prev) return;
    var borderRule = (kind === 'general') ? ('border:1px solid ' + colorEl.value + ';') : ('border-left:4px solid ' + colorEl.value + ';');
    prev.style.cssText = borderRule + 'padding:8px 12px;background:' + bgEl.value + ';border-radius:4px;font-size:.82rem;';
    prev.textContent = (iconEl.value ? iconEl.value + ' ' : '') + I18N.t('fbbox.preview_sample');
}

function _fbBoxBuildRows() {
    var container = document.getElementById('fbbox-rows');
    if (!container) return;
    container.innerHTML = FB_BOX_KIND_ORDER.map(function(kind) {
        return '<div style="border:1px solid var(--border);border-radius:8px;padding:10px;">'
            + '<div style="font-weight:700;font-size:.85rem;margin-bottom:6px;">' + I18N.t(FB_BOX_KIND_LABELS[kind]) + '</div>'
            + '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">'
            + '<label style="font-size:.78rem;color:var(--navy2);display:flex;align-items:center;gap:4px;">' + I18N.t('fbbox.label_border') + ' <input type="color" id="' + _fbBoxRowId(kind, 'color') + '" oninput="_fbBoxRenderPreview(\'' + kind + '\')"></label>'
            + '<label style="font-size:.78rem;color:var(--navy2);display:flex;align-items:center;gap:4px;">' + I18N.t('fbbox.label_bg') + ' <input type="color" id="' + _fbBoxRowId(kind, 'bg') + '" oninput="_fbBoxRenderPreview(\'' + kind + '\')"></label>'
            + '<label style="font-size:.78rem;color:var(--navy2);display:flex;align-items:center;gap:4px;">' + I18N.t('fbbox.label_icon') + ' <input type="text" maxlength="2" id="' + _fbBoxRowId(kind, 'icon') + '" style="width:40px;text-align:center;" oninput="_fbBoxRenderPreview(\'' + kind + '\')"></label>'
            + '</div>'
            + '<div id="' + _fbBoxRowId(kind, 'preview') + '"></div>'
            + '</div>';
    }).join('');
}

function _fbBoxFillFields(styles) {
    FB_BOX_KIND_ORDER.forEach(function(kind) {
        var s = styles[kind];
        document.getElementById(_fbBoxRowId(kind, 'color')).value = s.color;
        document.getElementById(_fbBoxRowId(kind, 'bg')).value = s.bg;
        document.getElementById(_fbBoxRowId(kind, 'icon')).value = s.icon || '';
        _fbBoxRenderPreview(kind);
    });
}

function openFbBoxOptionsModal() {
    _fbBoxBuildRows();
    _fbBoxFillFields(getFbBoxStyles());
    var modal = document.getElementById('fbBoxOptionsModal');
    if (modal) {
        modal.style.display = 'flex';
        if (typeof FocusTrap !== 'undefined') FocusTrap.trap(modal, closeFbBoxOptionsModal);
    }
}

function closeFbBoxOptionsModal(e) {
    if (e && e.target !== e.currentTarget) return;
    var modal = document.getElementById('fbBoxOptionsModal');
    if (modal) modal.style.display = 'none';
    if (typeof FocusTrap !== 'undefined') FocusTrap.release();
}

function saveFbBoxOptionsFromUI() {
    var styles = {};
    FB_BOX_KIND_ORDER.forEach(function(kind) {
        styles[kind] = {
            color: document.getElementById(_fbBoxRowId(kind, 'color')).value,
            bg: document.getElementById(_fbBoxRowId(kind, 'bg')).value,
            icon: document.getElementById(_fbBoxRowId(kind, 'icon')).value
        };
    });
    saveFbBoxStyles(styles);
    toast(I18N.t('fbbox.msg_enregistre'));
    if (typeof window.bnRefreshPreview === 'function') window.bnRefreshPreview();
}

function resetFbBoxOptionsFromUI() {
    resetFbBoxStyles();
    _fbBoxFillFields(getFbBoxStyles());
    toast(I18N.t('fbbox.msg_reinitialise'));
    if (typeof window.bnRefreshPreview === 'function') window.bnRefreshPreview();
}
