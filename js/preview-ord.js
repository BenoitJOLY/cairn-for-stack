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

function renderPreviewHTML_ord(state) {
  var rows = document.querySelectorAll('#ord-items .ord-row');
  var items = [];
  rows.forEach(function(r){ var t=r.querySelector('.ord-item-text'); if(t&&t.value.trim()) items.push(t.value.trim()); });
  var listHTML;
  if (items.length) {
    var chips = items.map(function(it){ return '<div style="background:#fbbf24;color:#78350f;padding:6px 10px;border-radius:4px;margin-bottom:4px;font-size:.9rem;">' + it.replace(/</g,'&lt;') + '</div>'; }).join('');
    listHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#475569;border-bottom:2px solid #cbd5e1;padding-bottom:4px;margin-bottom:8px;">' + I18N.t('ord.parsons_headers') + '</div>'
      + '<div style="min-height:40px;border:1px dashed #cbd5e1;border-radius:6px;"></div>'
      + '</div>'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#9a6a00;border-bottom:2px solid #fbbf24;padding-bottom:4px;margin-bottom:8px;">' + I18N.t('ord.parsons_available_header') + '</div>'
      + chips
      + '</div>'
      + '</div>';
  } else {
    listHTML = '<p style="color:#475569;font-style:italic;">' + I18N.t('ord.preview_add_items_hint') + '</p>';
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.ord'), badgeColor: '#be185d', noteBg: '#fdf2f8', noteColor: '#9d174d',
    prefix: 'ord', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || ('<p><em>' + I18N.t('ord.preview_default_statement') + '</em></p>')),
    exampleHTML: listHTML,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.ordRefreshPreview = _hsWireSimplePreview('ord', 'ord', 'ord-preview-container', 'fp-ord', renderPreviewHTML_ord);
