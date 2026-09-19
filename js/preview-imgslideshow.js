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

function renderPreviewHTML_imgslideshow(state) {
  var imslst = window._imslState || {};
  var realParts = null;
  try {
    if (typeof genImgSlideshowCore === 'function' && typeof genImgSlideshowParams === 'function'
        && imslst.images && imslst.images.length >= 2) {
      realParts = genImgSlideshowCore(1, genImgSlideshowParams());
    }
  } catch (e) { console.error('[preview] imgslideshow build error:', e); realParts = null; }

  var exampleHTML;
  if (realParts && realParts.kbdRaw) {
    var boardId = 'imslLiveBoard';
    var dims = (realParts.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
    var dispW = dims ? parseInt(dims[1], 10) : 480;
    var dispH = dims ? parseInt(dims[2], 10) : 360;
    exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;aspect-ratio:' + dispW + '/' + dispH + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; '
      + 'var stack_jxg = { bind_point: function(){} }; var refAns1; '
      + realParts.kbdRaw
      + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
  } else {
    exampleHTML = '<p style="color:#475569;font-style:italic;">' + I18N.t('imsl.preview_needs_data_hint') + '</p>';
  }

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.imgslideshow'), badgeColor: '#0f766e', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'imsl', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('imsl.preview_default_statement') + '</em></p>'),
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.imslRefreshPreview = _hsWireSimplePreview('imgslideshow', 'imsl', 'imsl-preview-container', 'fp-imgslideshow', renderPreviewHTML_imgslideshow, true);
