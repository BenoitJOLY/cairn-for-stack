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

// Aperçu live : on exécute le VRAI code JSXGraph de l'éditeur de rédaction
// (buildCompositionJSX, js/gen-composition.js) — même principe que
// oscilloscope/jxgdrop/cinématique (voir js/preview.js:952-1069) — plutôt
// que d'afficher un texte d'excuse "visible dans Moodle uniquement". Ce
// bloc ne manipule pas de board JSXGraph (pas d'initBoard) : c'est du DOM
// pur via document.getElementById('jxgbox'), id fixe fourni par le plugin
// STACK [[jsxgraph]] (cf. js/gen-topo.js même convention) — d'où le conteneur
// avec id="jxgbox" en dur ci-dessous plutôt qu'un id généré. refAns1 (lié à
// l'input caché ans1_html en export réel) n'a pas de contrepartie DOM en
// local : on le stub à `undefined`, comme refDvX dans preview-cinematique.js
// — setRef()/la restauration finale font juste un no-op silencieux.
function renderPreviewHTML_comp(state) {
  var exampleHTML;
  try {
    var heightEl = document.getElementById('comp-height');
    var height = (heightEl && heightEl.value) || '600px';
    var jsBody = _oscStripJXGWrapper(buildCompositionJSX(height, 1));
    exampleHTML = '<div id="jxgbox" style="width:100%;min-height:' + height + ';"></div>'
      + '<script>(function(){ try {\n'
      + '  var refAns1;\n'
      + '  ' + jsBody + '\n'
      + '} catch(e) { var el=document.getElementById("jxgbox"); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur : " + String(e && e.message || e).replace(/</g,"&lt;") + "</p>"; console.error(e); }\n'
      + '})();<\/script>';
  } catch (e) {
    console.error('[preview] composition build error:', e);
    exampleHTML = '<p style="color:#dc2626;font-style:italic;">' + I18N.t('comp.preview_build_error') + '</p>';
  }

  return _hsSimplePreviewHTML({
    badge: I18N.t('badge.composition'), badgeColor: '#6d28d9', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'comp', bareme: state.bareme || 4,
    text: _hsRenderMath(state.text || ('<p><em>' + I18N.t('comp.preview_placeholder') + '</em></p>')),
    exampleHTML: exampleHTML,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.compRefreshPreview = _hsWireSimplePreview('composition', 'comp', 'comp-preview-container', 'fp-composition', renderPreviewHTML_comp, true);
