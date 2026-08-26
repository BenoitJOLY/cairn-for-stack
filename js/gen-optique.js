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

// ── XML GENERATORS: optique ──

/* ══════════════════════════════════════════════════════
   RVBCMJ — Filtres couleur (synthèse additive / soustractive)
   ══════════════════════════════════════════════════════ */

var RVB_MAX_PX = 600;   // largeur max après rééchantillonnage

/* ── Conversion sRGB ↔ linéaire (IEC 61966-2-1) : l'intensité physique de la
   lumière (linéaire) ne correspond pas à l'intensité perçue par l'œil ni aux
   octets stockés dans l'image (encodés en gamma sRGB pour l'écran). Pour un
   rendu N&B physiquement correct, on convertit donc les valeurs en linéaire,
   on calcule la luminance physique (coefficients Rec.709), puis on
   reconvertit en sRGB pour l'affichage. Le filtrage additif/soustractif
   (mise à zéro d'un canal) est lui invariant par ce changement d'espace
   (0 reste 0), donc appliqué directement sur les octets sRGB. ── */
function rvbSrgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function rvbLinearToSrgb(c) {
    var s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(s * 255)));
}
function rvbLuminanceSrgb(r, g, b) {
    var lr = rvbSrgbToLinear(r), lg = rvbSrgbToLinear(g), lb = rvbSrgbToLinear(b);
    var lLum = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    return rvbLinearToSrgb(lLum);
}

/* ── Annotation cercle : l'enseignant peut entourer l'objet dont la couleur
   doit être identifiée (utile si la photo contient plusieurs objets). Le
   cercle est incrusté dans les pixels de rvb-imgdata (donc visible dans les
   3 filtres et le feedback général), mais _rvbRawCanvas garde l'image
   d'origine sans cercle pour permettre de redessiner/déplacer/effacer le
   cercle sans dégradation JPEG cumulative. ── */
var _rvbRawCanvas = null;
var rvbCircle = null; // {cx, cy, r} en pixels, repère de _rvbRawCanvas

function rvbLoadImage(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      // ── Rééchantillonnage canvas ──────────────────────────
      var w = img.naturalWidth, h = img.naturalHeight;
      if (w > RVB_MAX_PX) { h = Math.round(h * RVB_MAX_PX / w); w = RVB_MAX_PX; }
      var raw = document.createElement('canvas');
      raw.width = w; raw.height = h;
      raw.getContext('2d').drawImage(img, 0, 0, w, h);
      _rvbRawCanvas = raw;
      rvbCircle = null;

      var fn = document.getElementById('rvb-filename');
      if (fn) fn.textContent = file.name + ' — ' + w + '×' + h + ' px';

      rvbRenderAnnotCanvas();
      rvbBakeImage();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* Recharge une image déjà encodée (ex : restauration d'une question
   enregistrée) dans le canvas d'annotation, sans cercle (non mémorisé
   séparément dans les anciennes sauvegardes — l'enseignant peut en
   redessiner un si besoin). */
function rvbRestoreImage(dataUrl) {
  if (!dataUrl) return;
  var img = new Image();
  img.onload = function() {
    var raw = document.createElement('canvas');
    raw.width = img.naturalWidth; raw.height = img.naturalHeight;
    raw.getContext('2d').drawImage(img, 0, 0);
    _rvbRawCanvas = raw;
    rvbCircle = null;
    rvbRenderAnnotCanvas();
  };
  img.src = dataUrl;
}

function rvbClearImage() {
  _rvbRawCanvas = null;
  rvbCircle = null;
  var wrap = document.getElementById('rvb-annot-wrap');
  if (wrap) wrap.style.display = 'none';
  var clearBtn = document.getElementById('rvb-circle-clear');
  if (clearBtn) clearBtn.style.display = 'none';
}

function rvbRenderAnnotCanvas() {
  if (!_rvbRawCanvas) return;
  var canvas = document.getElementById('rvb-annot-canvas');
  var wrap = document.getElementById('rvb-annot-wrap');
  if (!canvas) return;
  canvas.width = _rvbRawCanvas.width;
  canvas.height = _rvbRawCanvas.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(_rvbRawCanvas, 0, 0);
  if (rvbCircle) {
    var lw = Math.max(2, canvas.width * 0.008);
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(rvbCircle.cx, rvbCircle.cy, rvbCircle.r + lw, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(rvbCircle.cx, rvbCircle.cy, rvbCircle.r, 0, Math.PI * 2); ctx.stroke();
  }
  if (wrap) wrap.style.display = '';
  var clearBtn = document.getElementById('rvb-circle-clear');
  if (clearBtn) clearBtn.style.display = rvbCircle ? '' : 'none';
}

function rvbBakeImage() {
  var canvas = document.getElementById('rvb-annot-canvas');
  if (!canvas || !_rvbRawCanvas) return;
  var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  document.getElementById('rvb-imgdata').value = dataUrl;
  var fn = document.getElementById('rvb-filename');
  if (fn) {
    var kb = Math.round(dataUrl.length / 1024);
    fn.textContent = fn.textContent.replace(/\s*·\s*\d+\s*Ko$/, '') + ' · ' + kb + ' Ko';
  }
  rvbPreviewFilters(true);
}

function rvbClearCircle() {
  rvbCircle = null;
  rvbRenderAnnotCanvas();
  rvbBakeImage();
}

(function () {
  var dragging = false;
  function toPixel(e, canvas) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }
  function wire() {
    var canvas = document.getElementById('rvb-annot-canvas');
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      if (!_rvbRawCanvas) return;
      dragging = true;
      var p = toPixel(e, canvas);
      rvbCircle = { cx: p.x, cy: p.y, r: 1 };
      rvbRenderAnnotCanvas();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging || !rvbCircle) return;
      var p = toPixel(e, canvas);
      var dx = p.x - rvbCircle.cx, dy = p.y - rvbCircle.cy;
      rvbCircle.r = Math.max(4, Math.sqrt(dx * dx + dy * dy));
      rvbRenderAnnotCanvas();
    });
    canvas.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      if (rvbCircle && rvbCircle.r < 6) rvbCircle = null;
      rvbRenderAnnotCanvas();
      rvbBakeImage();
    });
  }
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

function rvbPreviewFilters(silent) {
  var imgData = document.getElementById('rvb-imgdata').value;
  if (!imgData) {
    if (!silent) alert(I18N.t ? I18N.t('rvb.err_img') : 'Chargez d\'abord une image.');
    return;
  }
  var modeEl = document.querySelector('input[name="rvb-mode"]:checked');
  var mode = modeEl ? modeEl.value : 'rvb';
  var nb   = document.getElementById('rvb-nb').checked;
  var labels = (mode === 'cmj')
    ? ['Cyan', 'Magenta', 'Jaune']
    : ['Rouge', 'Vert', 'Bleu'];
  var colors = (mode === 'cmj')
    ? ['#0891b2', '#db2777', '#ca8a04']
    : ['#dc2626', '#16a34a', '#2563eb'];

  applyRvbFilters(imgData, mode, nb).then(function(filtered) {
    var pf = document.getElementById('rvb-preview-filtered');
    pf.innerHTML = '';
    filtered.forEach(function(src, i) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'text-align:center;';
      var im = document.createElement('img');
      im.src = src;
      im.style.cssText = 'width:100%;border-radius:6px;border:2px solid ' + colors[i] + ';object-fit:contain;';
      var cap = document.createElement('div');
      cap.style.cssText = 'font-size:.72rem;font-weight:700;color:' + colors[i] + ';margin-top:4px;';
      cap.textContent = 'Filtre ' + labels[i];
      wrap.appendChild(im); wrap.appendChild(cap);
      pf.appendChild(wrap);
    });
    pf.style.display = 'grid';
    if (typeof rvbRefreshPreview === 'function') rvbRefreshPreview();
  }).catch(function(err) {
    if (!silent) alert(err.message);
  });
}

function applyRvbFilters(imgData, mode, nb) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
            var w = img.naturalWidth, h = img.naturalHeight;
            var fns = (mode === 'cmj')
                ? [function(r,g,b){return [0,g,b];}, function(r,g,b){return [r,0,b];}, function(r,g,b){return [r,g,0];}]
                : [function(r,g,b){return [r,0,0];}, function(r,g,b){return [0,g,0];}, function(r,g,b){return [0,0,b];}];
            var results = fns.map(function(fn) {
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var imgd = ctx.getImageData(0, 0, w, h);
                var d = imgd.data;
                for (var i = 0; i < d.length; i += 4) {
                    var rgb = fn(d[i], d[i+1], d[i+2]);
                    var nr = rgb[0], ng = rgb[1], nb2 = rgb[2];
                    if (nb) {
                        var lum = rvbLuminanceSrgb(nr, ng, nb2);
                        nr = ng = nb2 = lum;
                    }
                    d[i] = nr; d[i+1] = ng; d[i+2] = nb2;
                }
                ctx.putImageData(imgd, 0, 0);
                return canvas.toDataURL('image/jpeg', 0.85);
            });
            resolve(results);
        };
        img.onerror = function() { reject(new Error(I18N.t('rvb.err_load'))); };
        img.src = imgData;
    });
}

/* Échappe une chaîne JS pour l'insérer dans une chaîne Maxima entre guillemets. */
function _rvbMx(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function genRvbCmjParams() {
    var bareme  = parseFloat(v('rvb-bareme')) || 1;
    var text    = richVal('rvb-text');
    var imgData = v('rvb-imgdata');
    var modeEl  = document.querySelector('input[name="rvb-mode"]:checked');
    var mode    = modeEl ? modeEl.value : 'rvb';
    var nb      = document.getElementById('rvb-nb').checked;
    var answer  = parseInt(v('rvb-answer')) || 0;
    var fbOkTxt = v('rvb-fb-ok').trim();
    var fbWrTxt = v('rvb-fb-wrong').trim();
    var fbGenRaw = v('rvb-fbgen');
    return {
        bareme: bareme, text: text, imgData: imgData, mode: mode, nb: nb, answer: answer,
        fbOkTxt: fbOkTxt, fbWrTxt: fbWrTxt, fbGenRaw: fbGenRaw
    };
}

async function genRvbCmj(X) {
    var p = genRvbCmjParams();
    try {
        var res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'rvbcmj', X: X, params: p })
        });
        if (res.ok) {
            var data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "rvbcmj", repli sur le calcul local (session expirée ?).');
    } catch (e) {
        console.warn('[cairnforstack] /api/generate injoignable pour "rvbcmj", repli sur le calcul local.', e);
    }
    return genRvbCmjCore(X, p);
}

function genRvbCmjCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var bareme = p.bareme, text = p.text, imgData = p.imgData, mode = p.mode, nb = p.nb,
        answer = p.answer, fbOkTxt = p.fbOkTxt, fbWrTxt = p.fbWrTxt;

    if (!imgData)  throw new Error(I18N_D.t('rvb.err_img'));
    if (!answer)   throw new Error(I18N_D.t('rvb.err_answer'));

    var colorChoices = [[1,'Rouge'],[2,'Vert'],[3,'Bleu'],[4,'Jaune'],[5,'Cyan'],[6,'Magenta'],[7,'Blanc'],[8,'Noir']];
    var colorEntry   = colorChoices.filter(function(c){return c[0]===answer;})[0] || [0,'?'];
    var colorName    = colorEntry[1];
    var colorKey     = colorName.toLowerCase();

    var filterLabels, modeLabel;
    if (mode === 'cmj') {
        filterLabels = [I18N_D.t('rvb.filter_cyan'), I18N_D.t('rvb.filter_magenta'), I18N_D.t('rvb.filter_jaune')];
        modeLabel    = I18N_D.t('rvb.title_cmj');
    } else {
        filterLabels = [I18N_D.t('rvb.filter_rouge'), I18N_D.t('rvb.filter_vert'), I18N_D.t('rvb.filter_bleu')];
        modeLabel    = I18N_D.t('rvb.title_rvb');
    }

    var okTxtHtml = fbOkTxt ? ' ' + htmlEsc(fbOkTxt) : '';
    var wrTxtHtml = fbWrTxt ? ' ' + htmlEsc(fbWrTxt) : '';

    /* ── Pièges couleur complémentaire / partielle : calculés ici en JS
       (produit scalaire RVB) puisque la couleur cible est fixée par
       l'enseignant à la génération (pas une variable STACK aléatoire) —
       cf. référence Moodle validée test/mise à jour/Physique-chimie/RVB/.
       Les feedbacks sont donc des chaînes Maxima statiques (pas de
       sconcat), ce qui évite tout risque de casser la citation Maxima
       avec du texte enseignant libre. ── */
    var rvbListe = ['rouge','vert','bleu','cyan','magenta','jaune','noir','blanc'];
    var rvbVec = {
        rouge:[1,0,0], vert:[0,1,0], bleu:[0,0,1], cyan:[0,1,1],
        magenta:[1,0,1], jaune:[1,1,0], noir:[0,0,0], blanc:[1,1,1]
    };
    function rvbDot(c1, c2) {
        var a = rvbVec[c1], b = rvbVec[c2];
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }
    var errComp = '', partiels = [];
    if (colorKey !== 'noir' && colorKey !== 'blanc') {
        rvbListe.forEach(function(c) {
            if (c === colorKey || c === 'noir' || c === 'blanc') return;
            var d = rvbDot(c, colorKey);
            if (d === 0 && !errComp) errComp = c;
            else if (d > 0) partiels.push(c);
        });
    }
    var errPartiel1 = partiels[0] || '';
    var errPartiel2 = partiels[1] || '';

    var vars = 'ta_' + X + ': "' + colorKey + '"$\n'
        + 'err_comp_' + X + ': "' + errComp + '"$\n'
        + 'err_partiel1_' + X + ': "' + errPartiel1 + '"$\n'
        + 'err_partiel2_' + X + ': "' + errPartiel2 + '"$\n'
        + 'choices_' + X + ': random_permutation(map(lambda([c],[c, is(c=ta_' + X + '), c]), '
        + '["rouge","vert","bleu","cyan","magenta","jaune","noir","blanc"]))$\n'
        + 'fb_ok_' + X + ': "' + _rvbMx(
            applyFbBox_D('true', I18N_D.t('rvb.fb_ok_prefix') + colorKey + "." + okTxtHtml)
        ) + '"$\n'
        + 'fb_comp_' + X + ': "' + _rvbMx(
            applyFbBox_D('false', I18N_D.t('rvb.fb_comp_prefix') + errComp +
            I18N_D.t('rvb.fb_comp_mid') + colorKey + "." + wrTxtHtml)
        ) + '"$\n'
        + 'fb_part1_' + X + ': "' + _rvbMx(
            applyFbBox_D('false', I18N_D.t('rvb.fb_part_prefix') + errPartiel1 +
            I18N_D.t('rvb.fb_part_mid') + colorKey + I18N_D.t('rvb.fb_part_suffix') + wrTxtHtml)
        ) + '"$\n'
        + 'fb_part2_' + X + ': "' + _rvbMx(
            applyFbBox_D('false', I18N_D.t('rvb.fb_part_prefix') + errPartiel2 +
            I18N_D.t('rvb.fb_part_mid') + colorKey + I18N_D.t('rvb.fb_part_suffix') + wrTxtHtml)
        ) + '"$\n'
        + 'fb_finale_' + X + ': "' + _rvbMx(
            applyFbBox_D('general', I18N_D.t('rvb.fb_finale_text') + wrTxtHtml)
        ) + '"$';

    /* ── Input XML : dropdown, mélangé côté Maxima (choices_X) ── */
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>dropdown</type>\n'
        + '      <tans>choices_' + X + '</tans>\n'
        + '      <boxsize>15</boxsize>\n'
        + '      <strictsyntax>1</strictsyntax>\n'
        + '      <insertstars>0</insertstars>\n'
        + '      <syntaxhint></syntaxhint>\n'
        + '      <syntaxattribute>0</syntaxattribute>\n'
        + '      <forbidwords></forbidwords>\n'
        + '      <allowwords></allowwords>\n'
        + '      <forbidfloat>0</forbidfloat>\n'
        + '      <requirelowestterms>0</requirelowestterms>\n'
        + '      <checkanswertype>0</checkanswertype>\n'
        + '      <mustverify>0</mustverify>\n'
        + '      <showvalidation>0</showvalidation>\n'
        + '      <options></options>\n'
        + '    </input>';

    /* ── PRT : chaîne de tests String — bonne réponse, piège complémentaire,
       2 pièges partiels, nœud final générique — cf. référence Moodle. ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: '' };
    var canonicalNodes = [
        {
            name: '0', description: '', answertest: 'String', sans: 'ans' + X, tans: 'ta_' + X,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-1-T', truefeedback: '{@fb_ok_' + X + '@}',
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'PRT' + X + '-1-F', falsefeedback: ''
        },
        {
            name: '1', description: '', answertest: 'String', sans: 'ans' + X, tans: 'err_comp_' + X,
            testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-2-T', truefeedback: '{@fb_comp_' + X + '@}',
            falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '2',
            falseanswernote: 'PRT' + X + '-2-F', falsefeedback: ''
        },
        {
            name: '2', description: '', answertest: 'String', sans: 'ans' + X, tans: 'err_partiel1_' + X,
            testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-3-T', truefeedback: '{@fb_part1_' + X + '@}',
            falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '3',
            falseanswernote: 'PRT' + X + '-3-F', falsefeedback: ''
        },
        {
            name: '3', description: '', answertest: 'String', sans: 'ans' + X, tans: 'err_partiel2_' + X,
            testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-4-T', truefeedback: '{@fb_part2_' + X + '@}',
            falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '4',
            falseanswernote: 'PRT' + X + '-4-F', falsefeedback: ''
        },
        {
            name: '4', description: '', answertest: 'AlgEquiv', sans: '1', tans: '1',
            testoptions: '', quiet: '0',
            truescoremode: '+', truescore: '0', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-5-T', truefeedback: '{@fb_finale_' + X + '@}',
            falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-5-F', falsefeedback: ''
        }
    ];
    var prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    /* ── Image brute encodée en base64 (sans préfixe data:) transmise via un
       div masqué, puis filtrée canal par canal côté navigateur (JS élève) —
       un seul aller de données au lieu de 3 images pré-calculées. ── */
    var rawB64 = imgData.replace(/^data:image\/\w+;base64,/, '');

    var qidImg = 'rvbimg' + X, qidT1 = 'rvbtgt1' + X, qidT2 = 'rvbtgt2' + X, qidT3 = 'rvbtgt3' + X;

    var targetGrid = '<div style="display:flex;justify-content:center;gap:10px;margin:16px 0;flex-wrap:wrap;">'
        + [qidT1, qidT2, qidT3].map(function(qid, i) {
            return '<div style="text-align:center;width:30%;max-width:450px;">'
                + '<div id="[[quid id="' + qid + '"/]]" style="width:100%;aspect-ratio:4/3;border:1px solid #ccc;background:#fff;"></div>'
                + '<div style="margin-top:5px;font-weight:bold;">' + filterLabels[i] + '</div>'
                + '</div>';
        }).join('')
        + '</div>';

    var jsBlock = '[[javascript]]\n'
        + 'let rvbUrlPromise' + X + ' = stack_js.get_content(\'[[quid id="' + qidImg + '"/]]\');\n\n'
        + 'rvbUrlPromise' + X + '.then(function(base64Data) {\n'
        + '    if (!base64Data) { stack_js.display_error("' + I18N_D.t('rvb.err_image_notfound') + '"); return; }\n\n'
        + '    var img = new Image();\n'
        + '    img.onload = function() {\n'
        + '        var maxW = 450;\n'
        + '        var ratio = Math.min(1, maxW / img.naturalWidth);\n'
        + '        var w = Math.floor(img.naturalWidth * ratio);\n'
        + '        var h = Math.floor(img.naturalHeight * ratio);\n'
        + '        var nb = ' + (nb ? 'true' : 'false') + ';\n'
        + '        var mode = "' + mode + '";\n\n'
        + '        function srgbToLin(c) { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }\n'
        + '        function linToSrgb(c) { var s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1/2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(s * 255))); }\n'
        + '        function lumSrgb(r, g, b) { var lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b); return linToSrgb(0.2126*lr + 0.7152*lg + 0.0722*lb); }\n\n'
        + '        function processChannel(idx, targetId) {\n'
        + "            var canvas = document.createElement('canvas');\n"
        + '            canvas.width = w; canvas.height = h;\n'
        + "            var ctx = canvas.getContext('2d');\n"
        + '            ctx.drawImage(img, 0, 0, w, h);\n'
        + '            var imageData = ctx.getImageData(0, 0, w, h);\n'
        + '            var data = imageData.data;\n\n'
        + '            for (var i = 0; i < data.length; i += 4) {\n'
        + '                var nr = data[i], ng = data[i+1], nb2 = data[i+2];\n'
        + "                if (mode === 'cmj') {\n"
        + '                    if (idx === 0) nr = 0;\n'
        + '                    if (idx === 1) ng = 0;\n'
        + '                    if (idx === 2) nb2 = 0;\n'
        + '                } else {\n'
        + '                    if (idx !== 0) nr = 0;\n'
        + '                    if (idx !== 1) ng = 0;\n'
        + '                    if (idx !== 2) nb2 = 0;\n'
        + '                }\n'
        + '                if (nb) { var lum = lumSrgb(nr, ng, nb2); nr = ng = nb2 = lum; }\n'
        + '                data[i] = nr; data[i+1] = ng; data[i+2] = nb2;\n'
        + '            }\n'
        + '            ctx.putImageData(imageData, 0, 0);\n\n'
        + "            var dataUrl = canvas.toDataURL('image/png');\n"
        + '            var imgTag = \'<img src="\' + dataUrl + \'" style="width:100%;height:100%;object-fit:contain;" />\';\n'
        + '            stack_js.switch_content(targetId, imgTag);\n'
        + '        }\n\n'
        + '        processChannel(0, \'[[quid id="' + qidT1 + '"/]]\');\n'
        + '        processChannel(1, \'[[quid id="' + qidT2 + '"/]]\');\n'
        + '        processChannel(2, \'[[quid id="' + qidT3 + '"/]]\');\n'
        + '    };\n\n'
        + '    img.src = "data:image/jpeg;base64," + base64Data.trim();\n'
        + '});\n'
        + '[[/javascript]]';

    /* VRAIE CAUSE de "STACK-JS error: Image introuvable." (trouvée le
       2026-07-09, confirmée avec un vrai navigateur — Edge headless
       --dump-dom) : tout le texte de question passe par stripMathDivs()
       (js/app.js), qui fait un aller-retour DOM réel : div.innerHTML = html
       puis relecture de div.innerHTML. Les div id="[[quid id="X"/]]"
       (guillemets doubles imbriqués, syntaxe STACK imposée) y sont détruites
       — un vrai parseur HTML voit le 2e " comme fermant l'attribut id et
       fabrique un attribut fantôme (vérifié : id="[[quid id="rvbimg1"/]]"
       devient id="[[quid id=" rvbimg1"="" ]]"="" ...). Mettre l'attribut
       englobant en guillemets simples (id='[[quid id="X"/]]') NE SUFFIT PAS
       non plus : le navigateur reparse correctement puis RESÉRIALISE
       l'attribut en guillemets doubles en échappant les " internes en
       &quot; — ce qui casse tout aussi sûrement le pattern-matching littéral
       de CASText2 côté Moodle (vérifié aussi en Edge headless). La seule
       protection fiable est d'éviter complètement l'aller-retour DOM pour
       tout HTML contenant un [[quid]] : comme jsBlock (protégé par le
       marqueur HS-KBD, substitué APRÈS stripMathDivs dans js/app.js), le div
       image et la grille de cibles [[quid]] sont donc regroupés ici dans
       kbdBlock plutôt que laissés dans textFrag.
       Le base64 lui-même reste SUR UNE SEULE LIGNE (pas de découpage en
       morceaux de 2000 caractères façon jxgdrop) : la référence Moodle
       validée (test/mise à jour/Physique-chimie/RVB/) le stocke ainsi ; le
       découpage en \n n'était pas la cause du bug (testé et infirmé en
       Moodle réel). */
    var rawB64Chunked = rawB64;

    var imgDiv = '<div id="[[quid id="' + qidImg + '"/]]" style="display:none">' + rawB64Chunked + '</div>\n';

    /* ── Fragment de question ──
       Tout ce qui contient un [[quid ...]] (imgDiv, targetGrid) ou le bloc
       [[javascript]] est regroupé dans kbdBlock, substitué au marqueur
       HS-KBD APRÈS stripMathDivs — donc jamais mangé par l'aller-retour DOM. */
    var textFrag = '<div style="background:#7E22CE;border-left:5px solid #6b21a8;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + modeLabel + '</strong>'
        + '<span style="background:#6b21a8;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = imgDiv
        + targetGrid
        + '<p>[[input:ans' + X + ']] [[validation:ans' + X + ']]</p>\n'
        + jsBlock;

    /* ── Feedback général : image d'origine, sans filtre ──
       Base64 sur une seule ligne (voir rawB64Chunked ci-dessus : le découpage
       n'est ni nécessaire à cette taille d'image, ni validé ici). */
    var genFbDefault = '<p>' + I18N_D.t('rvb.genfb_text') + '</p>'
        + '<p><img src="' + imgData + '" alt="' + I18N_D.t('rvb.genfb_alt') + '" style="max-width:600px;border-radius:6px;"></p>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           modeLabel + ' Q' + X + ' → ' + colorName,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ══════════════════════════════════════════════════════
   OPTIQUE — 3 scénarios JSXGraph interactifs
   ══════════════════════════════════════════════════════ */
function genOptiqueParams() {
    var scenario = v('opt-scenario') || 'lentille-convergente';
    var p;
    if (scenario === 'lentille-convergente') p = _genOptiqueLentilleRayonsParams();
    else if (scenario === 'lentille-divergente') p = _genOptiqueLentilleDivergenteParams();
    else if (scenario === 'miroir-concave') { p = _genOptiqueMiroirParams(); p.convexe = false; }
    else if (scenario === 'miroir-convexe') { p = _genOptiqueMiroirParams(); p.convexe = true; }
    else if (scenario === 'miroir-plan') p = _genOptiqueMiroirPlanParams();
    else if (scenario === 'lunette-galilee') p = _genOptiqueLunetteConstructionParams();
    else if (scenario === 'telescope-newton') p = _genOptiqueTelescopeConstructionParams();
    else if (scenario === 'microscope') p = _genOptiqueMicroscopeConstructionParams();
    else throw new Error(I18N.t('msg.optique_err_scenario') + scenario);
    p.scenario = scenario;
    return p;
}

async function genOptique(X) {
    var p = genOptiqueParams();
    try {
        var res = await fetch('/api/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'optique', X: X, params: p })
        });
        if (res.ok) {
            var data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "optique", repli sur le calcul local (session expirée ?).');
    } catch (e) {
        console.warn('[cairnforstack] /api/generate injoignable pour "optique", repli sur le calcul local.', e);
    }
    return genOptiqueCore(X, p);
}

/* Routeur pur : ne lit jamais le DOM — délègue directement aux *Core purs
   selon p.scenario (p.convexe distingue miroir-concave/miroir-convexe, qui
   partagent le même _genOptiqueMiroirCoreImpl). */
function genOptiqueCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var scenario = p.scenario;
    if (scenario === 'lentille-convergente') return _genOptiqueLentilleRayonsCore(X, p, deps);
    if (scenario === 'lentille-divergente')  return _genOptiqueLentilleDivergenteCore(X, p, deps);
    if (scenario === 'miroir-concave') return _genOptiqueMiroirCoreImpl(X, p, deps);
    if (scenario === 'miroir-convexe') return _genOptiqueMiroirCoreImpl(X, p, deps);
    if (scenario === 'miroir-plan') return _genOptiqueMiroirPlanCore(X, p, deps);
    if (scenario === 'lunette-galilee') return _genOptiqueLunetteConstructionCore(X, p, deps);
    if (scenario === 'telescope-newton') return _genOptiqueTelescopeConstructionCore(X, p, deps);
    if (scenario === 'microscope') return _genOptiqueMicroscopeConstructionCore(X, p, deps);
    throw new Error(I18N_D.t('msg.optique_err_scenario') + scenario);
}

/* ── Scénario 1 : Trouver l'image (glisser B') ── */
function _genOptiqueLentilleImage(X) {
    var bareme  = parseFloat(v('opt-bareme'))  || 1;
    var text    = richVal('opt-text');
    var f       = parseFloat(v('opt-f'))       || 20;
    var OA      = parseFloat(v('opt-oa'))      || -30;
    var AB      = parseFloat(v('opt-ab'))      || 2;
    var tolPos  = parseFloat(v('opt-tol-pos')) || 2;
    var tolH    = parseFloat(v('opt-tol-h'))   || 1;
    var dispW   = parseInt(v('opt-w'))          || 600;
    var dispH   = parseInt(v('opt-h'))          || 350;
    var fbOkTxt = v('opt-fb-ok').trim();
    var fbWrTxt = v('opt-fb-wrong').trim();
    var fbGenRaw = v('opt-fbgen');
    return _genOptiqueLentilleImageCore(X, {
        bareme: bareme, text: text, f: f, OA: OA, AB: AB, tolPos: tolPos, tolH: tolH,
        dispW: dispW, dispH: dispH, fbOkTxt: fbOkTxt, fbWrTxt: fbWrTxt, fbGenRaw: fbGenRaw
    });
}

function _genOptiqueLentilleImageCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var wrapFb_D = deps.wrapFb || wrapFb;
    var bareme = p.bareme, text = p.text, f = p.f, OA = p.OA, AB = p.AB, tolPos = p.tolPos, tolH = p.tolH,
        dispW = p.dispW, dispH = p.dispH, fbOkTxt = p.fbOkTxt, fbWrTxt = p.fbWrTxt;

    /* ── Validation des paramètres ── */
    if (f <= 0)
        throw new Error(I18N_D.t('opt.err_f_positive'));
    if (OA >= 0)
        throw new Error(I18N_D.t('opt.err_oa_negative'));
    if (Math.abs(OA + f) < 0.01)
        throw new Error(I18N_D.t('opt.err_oa_eq_f_s1'));

    /* ── Calcul de l'image ── */
    var OAp   = f * OA / (OA + f);          // relation de conjugaison
    var gamma = OAp / OA;                    // grandissement transversal
    var ABp   = gamma * AB;                  // hauteur algébrique de l'image

    /* ── Bounding box JSXGraph ── */
    var allX   = [OA, -f, 0, f, OAp];
    var bxMin  = Math.min.apply(null, allX) - 14;
    var bxMax  = Math.max.apply(null, allX) + 14;
    var yAmp   = Math.max(Math.abs(AB), Math.abs(ABp)) * 1.85 + 3;
    var lensH  = (yAmp * 0.80).toFixed(3);
    var tickH  = (yAmp * 0.08).toFixed(3);

    /* Position initiale de B' (intentionnellement incorrecte) */
    var initBpX = (f * 0.55).toFixed(3);
    var initBpY = (AB * 0.75).toFixed(3);

    /* ── Code JSXGraph ── */
    var jxgCode = '(function(){\n'
        + '/* Q' + X + ' — Optique : Lentille convergente */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[' + bxMin.toFixed(2) + ',' + yAmp.toFixed(2) + ','
                            + bxMax.toFixed(2) + ',' + (-yAmp).toFixed(2) + '],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'

        /* Axe optique */
        + "board.create('line',[[0,0],[1,0]],{\n"
        + "  strokeColor:'#374151',strokeWidth:1.5,\n"
        + "  straightFirst:true,straightLast:true,\n"
        + "  firstArrow:{type:1,size:4},lastArrow:{type:1,size:4},\n"
        + "  fixed:true,highlight:false\n"
        + "});\n"

        /* Lentille convergente : double flèche verticale bleue */
        + "board.create('segment',[[0,-" + lensH + "],[0," + lensH + "]],{\n"
        + "  strokeColor:'#1d4ed8',strokeWidth:2,\n"
        + "  firstArrow:{type:1,size:7},lastArrow:{type:1,size:7},\n"
        + "  fixed:true,highlight:false\n"
        + "});\n"

        /* Centre optique O */
        + "board.create('point',[0,0],{\n"
        + "  name:'O',fixed:true,size:2,\n"
        + "  strokeColor:'#374151',fillColor:'#374151',\n"
        + "  label:{offset:[4,-15],color:'#374151',fontSize:13}\n"
        + "});\n"

        /* Foyer objet F (tiret + point) */
        + "board.create('segment',[[-" + f + ",-" + tickH + "],[-" + f + "," + tickH + "]],{\n"
        + "  strokeColor:'#1d4ed8',strokeWidth:1.5,fixed:true,highlight:false\n"
        + "});\n"
        + "board.create('point',[-" + f + ",0],{\n"
        + "  name:'F',fixed:true,size:3,\n"
        + "  strokeColor:'#1d4ed8',fillColor:'#1d4ed8',\n"
        + "  label:{offset:[4,-15],color:'#1d4ed8',fontSize:13}\n"
        + "});\n"

        /* Foyer image F' (tiret + point) */
        + "board.create('segment',[[" + f + ",-" + tickH + "],[" + f + "," + tickH + "]],{\n"
        + "  strokeColor:'#1d4ed8',strokeWidth:1.5,fixed:true,highlight:false\n"
        + "});\n"
        + "board.create('point',[" + f + ",0],{\n"
        + "  name:\"F'\",fixed:true,size:3,\n"
        + "  strokeColor:'#1d4ed8',fillColor:'#1d4ed8',\n"
        + "  label:{offset:[4,-15],color:'#1d4ed8',fontSize:13}\n"
        + "});\n"

        /* Objet A (pied) */
        + "board.create('point',[" + OA + ",0],{\n"
        + "  name:'A',fixed:true,size:3,\n"
        + "  strokeColor:'#16a34a',fillColor:'#16a34a',\n"
        + "  label:{offset:[3,-15],color:'#16a34a',fontSize:13}\n"
        + "});\n"

        /* Objet B (sommet) */
        + "board.create('point',[" + OA + "," + AB + "],{\n"
        + "  name:'B',fixed:true,size:3,\n"
        + "  strokeColor:'#16a34a',fillColor:'#16a34a',\n"
        + "  label:{offset:[5,3],color:'#16a34a',fontSize:13}\n"
        + "});\n"

        /* Flèche objet AB */
        + "board.create('segment',[[" + OA + ",0],[" + OA + "," + AB + "]],{\n"
        + "  strokeColor:'#16a34a',strokeWidth:2.5,\n"
        + "  lastArrow:{type:1,size:5},fixed:true,highlight:false\n"
        + "});\n"

        /* ── Image A'B' — draggable par l'élève ── */
        /* B' : seul point déplaçable */
        + "var Bp=board.create('point',[" + initBpX + "," + initBpY + "],{\n"
        + "  name:\"B'\",size:7,\n"
        + "  strokeColor:'#dc2626',fillColor:'#ef4444',\n"
        + "  label:{offset:[7,4],color:'#dc2626',fontSize:13,fontWeight:'bold'}\n"
        + "});\n"

        /* A' : pied de B' sur l'axe (point dérivé, suit Bp.X()) */
        + "var Ap=board.create('point',[function(){return Bp.X();},0],{\n"
        + "  name:\"A'\",size:4,\n"
        + "  strokeColor:'#dc2626',fillColor:'#dc2626',\n"
        + "  label:{offset:[4,-15],color:'#dc2626',fontSize:13}\n"
        + "});\n"

        /* Flèche image A'B' */
        + "board.create('segment',[Ap,Bp],{\n"
        + "  strokeColor:'#dc2626',strokeWidth:2.5,\n"
        + "  lastArrow:{type:1,size:5},highlight:false\n"
        + "});\n"

        /* Liaison STACK : l'answer = [Bp.X(), Bp.Y()] */
        + 'stack_jxg.bind_point(board,ans' + X + ',Bp);\n'
        + 'board.unsuspendUpdate();\n'
        + 'setTimeout(function(){board.update();},80);\n'
        + '})();';

    /* ── Maxima — validation ── */
    var oap_s = OAp.toFixed(6);
    var abp_s = ABp.toFixed(6);
    var fbVars = 'opt_x_' + X + ':if listp(ans' + X + ') and length(ans' + X + ')=2 then float(ans' + X + '[1]) else 99999;\n'
               + 'opt_y_' + X + ':if listp(ans' + X + ') and length(ans' + X + ')=2 then float(ans' + X + '[2]) else 99999;\n'
               + 'opt_ok_pos_' + X + ':is(abs(opt_x_' + X + '-(' + oap_s + '))<=' + tolPos + ');\n'
               + 'opt_ok_h_' + X + ':is(abs(opt_y_' + X + '-(' + abp_s + '))<=' + tolH + ');\n'
               + 'opt_ok_' + X + ':is(opt_ok_pos_' + X + ' and opt_ok_h_' + X + ');';

    /* ── Input XML ── */
    var tansPt   = '[' + OAp.toFixed(4) + ',' + ABp.toFixed(4) + ']';
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans>' + tansPt + '</tans>\n'
        + '      <boxsize>15</boxsize>\n'
        + '      <strictsyntax>1</strictsyntax>\n'
        + '      <insertstars>0</insertstars>\n'
        + '      <syntaxhint></syntaxhint>\n'
        + '      <syntaxattribute>0</syntaxattribute>\n'
        + '      <forbidwords></forbidwords>\n'
        + '      <allowwords></allowwords>\n'
        + '      <forbidfloat>0</forbidfloat>\n'
        + '      <requirelowestterms>0</requirelowestterms>\n'
        + '      <checkanswertype>0</checkanswertype>\n'
        + '      <mustverify>0</mustverify>\n'
        + '      <showvalidation>0</showvalidation>\n'
        + '      <options></options>\n'
        + '    </input>';

    /* ── Feedback messages ── */
    var fbOk = '<p>' + I18N_D.t('opt.fb_ok_title')
        + (fbOkTxt ? ' ' + htmlEsc(fbOkTxt) : '')
        + '</p><p style="font-size:.88em;">'
        + 'OA\'&nbsp;≈&nbsp;{@round(opt_x_' + X + '*100)/100@}&nbsp;cm'
        + I18N_D.t('opt.fb_attendu_prefix') + OAp.toFixed(2) + '&nbsp;cm) —&nbsp;'
        + 'A\'B\'&nbsp;≈&nbsp;{@round(opt_y_' + X + '*100)/100@}&nbsp;cm'
        + I18N_D.t('opt.fb_attendu_prefix') + ABp.toFixed(2) + '&nbsp;cm)'
        + '</p>';
    var fbWrong = '<p>' + I18N_D.t('opt.fb_wrong_title')
        + (fbWrTxt ? ' ' + htmlEsc(fbWrTxt) : '')
        + '</p><p style="font-size:.88em;">'
        + I18N_D.t('opt.fb_wrong_placed_prefix') + '({@round(opt_x_' + X + '*100)/100@}&nbsp;cm&nbsp;;&nbsp;'
        + '{@round(opt_y_' + X + '*100)/100@}&nbsp;cm). '
        + I18N_D.t('opt.fb_wrong_formula')
        + '</p>';

    /* ── PRT XML ── */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'opt_ok_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    /* ── Encart données affiché à l'élève ── */
    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label_nbsp')
        + 'f\'&nbsp;=&nbsp;' + f + '&nbsp;cm,&nbsp;'
        + 'OA&nbsp;=&nbsp;' + OA + '&nbsp;cm,&nbsp;'
        + 'AB&nbsp;=&nbsp;' + AB + '&nbsp;cm</p>\n';

    /* ── Fragment de question ── */
    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_lentille_image') + '</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxgCode + '\n'
        + '[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + I18N_D.t('opt.hint_lentille_image_1')
        + I18N_D.t('opt.hint_lentille_image_2') + '</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique Q' + X + ' f\'=' + f + ' OA=' + OA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D("", p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 2 : Construction interactive de l'image (rayons + statut réel/virtuel) ──
   Portage du fichier de référence validé « Lentille convergente — AB entre
   -infini et F (image réelle) » (test/mise à jour/Physique-chimie/lentille),
   paramétré par f, OA (distance objet) et AB. Le moteur JSXGraph (boîte à
   outils de tracé, sérialisation, statut réel/virtuel par clic) est repris
   quasi à l'identique (const/let → var, enveloppé dans une IIFE pour éviter
   toute collision de portée si plusieurs questions de ce type coexistent sur
   la même page — le fichier de référence, non enveloppé, s'appuie sur le fait
   que chaque bloc [[jsxgraph]] s'exécute dans son propre contexte STACK).
   Seul le cas « objet au-delà de F, image réelle » est implémenté pour
   l'instant (voir PLAN.md, chantier Optique) : le cas « objet entre F et O »
   nécessite en plus le suivi des prolongements virtuels (arrière-plan
   pointillé) des rayons émergents, qui sera porté séparément une fois ce
   premier cas validé en Moodle réel ("un type à la fois"). */
function _genOptiqueLentilleRayonsParams() {
    var bareme = parseFloat(v('opt-bareme')) || 1;
    var text   = richVal('opt-text');
    var f      = parseFloat(v('opt-f'))  || 3;
    var xAin   = parseFloat(v('opt-oa')) || -6;   // OA UI : x de A, signé (négatif)
    var AB     = parseFloat(v('opt-ab')) || 1.5;
    var dispW  = parseInt(v('opt-w'))  || 700;
    var dispH  = parseInt(v('opt-h'))  || 380;
    var fbGenRaw = v('opt-fbgen');
    return { bareme: bareme, text: text, f: f, xAin: xAin, AB: AB, dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw };
}

function _genOptiqueLentilleRayons(X) {
    return _genOptiqueLentilleRayonsCore(X, _genOptiqueLentilleRayonsParams());
}

function _genOptiqueLentilleRayonsCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f = p.f, xAin = p.xAin, AB = p.AB, dispW = p.dispW, dispH = p.dispH;

    if (f <= 0)
        throw new Error(I18N_D.t('opt.err_f_positive'));
    if (xAin >= 0)
        throw new Error(I18N_D.t('opt.err_oa_negative'));
    if (Math.abs(xAin + f) < 0.01)
        throw new Error(I18N_D.t('opt.err_oa_eq_f_s2'));

    var OA   = -xAin;                 // distance OA affichée (positive)
    var xA   = xAin;                  // x(A), signé
    var xAp  = f * xA / (xA + f);      // = 1/((1/f)+(1/xA))
    var gam  = xAp / xA;
    var ABp  = gam * AB;

    /* Objet au-delà de F (OA>f) → image réelle ; objet entre F et O (OA<f) →
       image virtuelle. Ce second cas exige, en plus, de vérifier le
       prolongement virtuel (avant la lentille, x<0) des rayons émergents,
       et un tronçon supplémentaire explicite pour le segment A'B' (outil
       « Tracer A' (perpendiculaire) »), marqué virtuel — voir le fichier de
       référence « Lentille convergente — AB entre F et O (image virtuelle) ». */
    var virtuelle = xAp < 0;

    /* Rayons remarquables (mêmes formules que le fichier de référence) */
    var xF = -f, xFp = f;
    var m1e = -AB / xFp, p1e = AB;
    var m2  = AB / xA,   p2  = 0;
    var m3i = AB / (xA - xF), p3i = -m3i * xF;
    var m3e = 0, p3e = p3i;

    /* Fenêtre d'affichage et bornes de tolérance, dimensionnées génériquement
       à partir de f/OA/AB (le fichier de référence utilise des valeurs fixes
       -12/12 et -8/8, calibrées à la main pour son propre f=3/OA=6 ; ici la
       taille s'adapte aux paramètres saisis par l'enseignant). */
    var halfX  = Math.max(Math.abs(xA), Math.abs(xAp), 2 * f) + 4;
    var lensH  = Math.max(Math.abs(AB), Math.abs(ABp)) * 1.4 + 1.5;
    var halfY  = Math.max(lensH + 1, halfX / 2);
    var xminG  = _n(-halfX + 3);
    var xmaxG  = _n(halfX - 3);
    var xtol   = 0.5;

    function _n(v) { var r = Math.round(v * 1e1) / 1e1; return r === 0 ? 0 : r; }

    /* ── Construction correcte de référence (pour <tans>) ──
       Cas réel : chaque rayon émergent n'est réel qu'après la lentille (x>0).
       Cas virtuel : en plus du tronçon réel après la lentille, le prolongement
       virtuel du rayon émergent avant la lentille (x<0) est requis.
       Dans les deux cas, un tronçon explicite ["vert", xAp, [[0,ABp,want]]] pour
       A'B' est requis (want=1 réel / want=2 virtuel) : c'est ce que vérifie le
       nœud PRT 2 (found_AB_status). L'omettre pour le cas réel rendait ce nœud
       structurellement infaisable (bug corrigé le 2026-07-24, cf. PLAN.md). */
    var emergentPieces1 = virtuelle ? '[[' + xminG + ',0,2],[0,' + xmaxG + ',1]]' : '[[0,' + xmaxG + ',1]]';
    var emergentPieces2 = virtuelle ? '[[' + xminG + ',0,2],[0,' + xmaxG + ',1]]' : '[[0,' + xmaxG + ',1]]';
    var tansRayList = '[[0,' + _n(AB) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m1e) + ',' + _n(p1e) + ',' + emergentPieces1 + '],'
        + '[' + _n(m2) + ',' + _n(p2) + ',[[' + xminG + ',' + xmaxG + ',1]]],'
        + '[' + _n(m3i) + ',' + _n(p3i) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m3e) + ',' + _n(p3e) + ',' + emergentPieces2 + ']'
        + ',["vert",' + _n(xAp) + ',[[0,' + _n(ABp) + ',' + (virtuelle ? 2 : 1) + ']]]'
        + ']';
    var tansPtList = '[["B\'",' + _n(xAp) + ',' + _n(ABp) + '],["A\'",' + _n(xAp) + ',0]]';
    var tans = 'lentille_construction(' + tansRayList + ',' + tansPtList + ')';

    /* ── Moteur JSXGraph (toolbar + tracé + sérialisation) ──
       Portage direct du fichier de référence (const/let → var, IIFE). */
    var jxg = _lentilleConstructionJXG(X, {
        f: f, OA: OA, AB: AB,
        X_MIN: _n(-halfX), X_MAX: _n(halfX), Y_MIN: _n(-halfY), Y_MAX: _n(halfY),
        lensHeight: _n(lensH), dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'f: ' + _n(f) + '$\n'
        + 'lensHeight: ' + _n(lensH) + '$\n'
        + 'OA: ' + _n(OA) + '$\n'
        + 'AB: ' + _n(AB) + '$\n'
        + 'xF: -f$\n'
        + 'xFp: f$\n'
        + 'xA: -OA$\n'
        + 'xAp: 1/((1/f)+(1/xA))$\n'
        + 'gam: xAp/xA$\n'
        + 'ABp: gam*AB$\n\n'
        + 'm1e: -AB/xFp$\n'
        + 'p1e: AB$\n'
        + 'm2: AB/xA$\n'
        + 'p2: 0$\n'
        + 'm3i: AB/(xA-xF)$\n'
        + 'p3i: -m3i*xF$\n'
        + 'm3e: 0$\n'
        + 'p3e: p3i$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "lentille_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'lentille_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>lentille_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (3/5) + point B' (1/5) + statut réel/virtuel de A'B' (1/5) ── */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'att1: is(found_ray(rayList, 0, AB, 0.05, 0.3) or found_ray(rayList, m1e, p1e, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, m2, p2, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, m3i, p3i, 0.05, 0.3) or found_ray(rayList, m3e, p3e, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3)$\n\n'
        + (virtuelle
            ? 'l1_ok: is(seg_optional_status(rayList, 0, AB, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l2_ok: is(seg_required_status(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol, 1)\n'
              + '      and seg_required_status(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol, 2))$\n'
              + 'l3_ok: is(found_ray_status(rayList, m2, p2, 0.05, 0.3, 1))$\n'
              + 'l4_ok: is(seg_optional_status(rayList, m3i, p3i, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol, 2))$\n\n'
            : 'l1_ok: is(seg_optional_status(rayList, 0, AB, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1))$\n'
              + 'l2_ok: is(seg_required_status(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol, 1))$\n'
              + 'l3_ok: is(found_ray_status(rayList, m2, p2, 0.05, 0.3, 1))$\n'
              + 'l4_ok: is(seg_optional_status(rayList, m3i, p3i, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1))$\n'
              + 'l5_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol, 1))$\n\n')
        + 'c1s: is(l1_ok and l2_ok)$\n'
        + 'c2s: is(l3_ok)$\n'
        + 'c3s: is(l4_ok and l5_ok)$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + (virtuelle
            ? 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol))$\n'
              + 'l2_geom: is(seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol)\n'
              + '      and seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol))$\n'
              + 'l3_geom: att2$\n'
              + 'l4_geom: is(seg_required_geom(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_geom: is(seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol)\n'
              + '      and seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol))$\n\n'
            : 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol))$\n'
              + 'l2_geom: is(seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l3_geom: att2$\n'
              + 'l4_geom: is(seg_required_geom(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol))$\n'
              + 'l5_geom: is(seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol))$\n\n')
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n'
        + 'l5_score: line_score(l5_ok, l5_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score + l5_score$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_full_ok: (if c1s then 1 else 0) + (if c2s then 1 else 0) + (if c3s then 1 else 0)$\n'
        + 'have2: is(nb_full_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, xAp, ABp, 0.3))$\n'
        + 'abp_status: is(found_AB_status(rayList, xAp, 0, ABp, 0.3, 0.3, ' + (virtuelle ? 2 : 1) + '))$';

    var fbBilan = I18N_D.t('opt.rc_fb_bilan');

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.rc_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*3/5', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.rc_desc_point_bp'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/5', truepenalty: '', truenextnode: '2',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.rc_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '2',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.rc_fb_point_false')
        },
        {
            name: '2', description: I18N_D.t('opt.rc_desc_statut_abp'), answertest: 'AlgEquiv',
            sans: 'abp_status', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/5', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-2-T',
            truefeedback: I18N_D.t(virtuelle ? 'opt.rc_fb_statut_true_virtuelle' : 'opt.rc_fb_statut_true_reelle', { oa: _n(OA), f: _n(f) }),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-2-F',
            falsefeedback: I18N_D.t(virtuelle ? 'opt.rc_fb_statut_false_virtuelle' : 'opt.rc_fb_statut_false_reelle', { oa: _n(OA), f: _n(f) })
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var genFbDefault = I18N_D.t('opt.rc_genfb_common')
        + I18N_D.t(virtuelle ? 'opt.rc_genfb_virtuelle' : 'opt.rc_genfb_reelle', { oa: _n(OA), f: _n(f), xap: _n(xAp), abp: _n(ABp) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label') + 'f\'&nbsp;=&nbsp;' + _n(f) + '&nbsp;cm, '
        + 'OA&nbsp;=&nbsp;' + _n(OA) + '&nbsp;cm, AB&nbsp;=&nbsp;' + _n(AB) + '&nbsp;cm</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.rc_instr_h2') + '</h2>'
        + I18N_D.t(virtuelle ? 'opt.rc_instr_p1_virtuelle' : 'opt.rc_instr_p1_reelle', { f: _n(f), ab: _n(AB), oa: _n(OA) })
        + I18N_D.t('opt.rc_instr_p2')
        + I18N_D.t('opt.rc_instr_li1')
        + I18N_D.t('opt.rc_instr_li2')
        + I18N_D.t('opt.rc_instr_li3')
        + I18N_D.t('opt.rc_instr_p3')
        + I18N_D.t('opt.rc_instr_p4') + '</div>';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_lentille_rayons') + '</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    /* Le bloc [[jsxgraph]] contient énormément de < > && !== littéraux : tout
       aller-retour DOM (stripMathDivs) les corromprait en entités HTML. Il est
       donc protégé par le marqueur HS-KBD, substitué après coup (js/app.js),
       comme pour RVB/CMJ (voir commentaire plus haut dans ce fichier). */
    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-Rayons Q' + X + " f'=" + f + ' OA=' + OA,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Lentille divergente — toujours image virtuelle, quelle que soit la
   position de l'objet (voir fichier de référence « Lentille divergente —
   image virtuelle »). Réutilise le même moteur de construction/scoring que
   la lentille convergente en cas virtuel, avec xF/xFp inversés (xF=f,
   xFp=-f) et un glyphe de lentille échancré (concave). ── */
function _genOptiqueLentilleDivergenteParams() {
    var bareme = parseFloat(v('opt-bareme')) || 1;
    var text   = richVal('opt-text');
    var f      = parseFloat(v('opt-f'))  || 3;
    var xAin   = parseFloat(v('opt-oa')) || -6;   // OA UI : x de A, signé (négatif)
    var AB     = parseFloat(v('opt-ab')) || 1.5;
    var dispW  = parseInt(v('opt-w'))  || 700;
    var dispH  = parseInt(v('opt-h'))  || 380;
    var fbGenRaw = v('opt-fbgen');
    return { bareme: bareme, text: text, f: f, xAin: xAin, AB: AB, dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw };
}

function _genOptiqueLentilleDivergente(X) {
    return _genOptiqueLentilleDivergenteCore(X, _genOptiqueLentilleDivergenteParams());
}

function _genOptiqueLentilleDivergenteCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f = p.f, xAin = p.xAin, AB = p.AB, dispW = p.dispW, dispH = p.dispH;

    if (f <= 0)
        throw new Error(I18N_D.t('opt.err_f_positive'));
    if (xAin >= 0)
        throw new Error(I18N_D.t('opt.err_oa_negative'));

    var OA  = -xAin;                  // distance OA affichée (positive)
    var xA  = xAin;                   // x(A), signé
    var xF  = f, xFp = -f;             // foyers inversés (lentille divergente)
    var xAp = 1 / ((1 / xFp) + (1 / xA));
    var gam = xAp / xA;
    var ABp = gam * AB;

    /* Rayons remarquables (mêmes formules que le fichier de référence) */
    var m1e = -AB / xFp, p1e = AB;
    var m2  = AB / xA,   p2  = 0;
    var m3i = AB / (xA - xF), p3i = -m3i * xF;
    var m3e = 0, p3e = p3i;

    var halfX  = Math.max(Math.abs(xA), Math.abs(xAp), 2 * f) + 4;
    var lensH  = Math.max(Math.abs(AB), Math.abs(ABp)) * 1.4 + 1.5;
    var halfY  = Math.max(lensH + 1, halfX / 2);
    var xminG  = _n(-halfX + 3);
    var xmaxG  = _n(halfX - 3);
    var xtol   = 0.5;

    function _n(v) { var r = Math.round(v * 1e1) / 1e1; return r === 0 ? 0 : r; }

    /* ── Construction correcte de référence (pour <tans>) — toujours "virtuelle" ── */
    var emergentPieces = '[[' + xminG + ',0,2],[0,' + xmaxG + ',1]]';
    var tansRayList = '[[0,' + _n(AB) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m1e) + ',' + _n(p1e) + ',' + emergentPieces + '],'
        + '[' + _n(m2) + ',' + _n(p2) + ',[[' + xminG + ',' + xmaxG + ',1]]],'
        + '[' + _n(m3i) + ',' + _n(p3i) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m3e) + ',' + _n(p3e) + ',' + emergentPieces + ']'
        + ',["vert",' + _n(xAp) + ',[[0,' + _n(ABp) + ',2]]]'
        + ']';
    var tansPtList = '[["B\'",' + _n(xAp) + ',' + _n(ABp) + '],["A\'",' + _n(xAp) + ',0]]';
    var tans = 'lentille_construction(' + tansRayList + ',' + tansPtList + ')';

    var jxg = _lentilleConstructionJXG(X, {
        f: f, OA: OA, AB: AB,
        X_MIN: _n(-halfX), X_MAX: _n(halfX), Y_MIN: _n(-halfY), Y_MAX: _n(halfY),
        lensHeight: _n(lensH), convergente: false, dispW: dispW
    }, I18N_D);

    var vars = 'f: ' + _n(f) + '$\n'
        + 'lensHeight: ' + _n(lensH) + '$\n'
        + 'OA: ' + _n(OA) + '$\n'
        + 'AB: ' + _n(AB) + '$\n'
        + 'xF: f$\n'
        + 'xFp: -f$\n'
        + 'xA: -OA$\n'
        + 'xAp: 1/((1/xFp)+(1/xA))$\n'
        + 'gam: xAp/xA$\n'
        + 'ABp: gam*AB$\n\n'
        + 'm1e: -AB/xFp$\n'
        + 'p1e: AB$\n'
        + 'm2: AB/xA$\n'
        + 'p2: 0$\n'
        + 'm3i: AB/(xA-xF)$\n'
        + 'p3i: -m3i*xF$\n'
        + 'm3e: 0$\n'
        + 'p3e: p3i$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "lentille_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'lentille_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>lentille_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (3/5) + point B' (1/5) + statut réel/virtuel de A'B' (1/5) —
       toujours dans la branche "virtuelle" (lentille divergente ⇒ image toujours virtuelle) ── */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'att1: is(found_ray(rayList, 0, AB, 0.05, 0.3) or found_ray(rayList, m1e, p1e, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, m2, p2, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, m3i, p3i, 0.05, 0.3) or found_ray(rayList, m3e, p3e, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3)$\n\n'
        + 'l1_ok: is(seg_optional_status(rayList, 0, AB, 0.05, 0.3, xmin, xA, xtol, 1)\n'
        + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1)\n'
        + '      and seg_absent(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol))$\n'
        + 'l2_ok: is(seg_required_status(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol, 1)\n'
        + '      and seg_required_status(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol, 2))$\n'
        + 'l3_ok: is(found_ray_status(rayList, m2, p2, 0.05, 0.3, 1))$\n'
        + 'l4_ok: is(seg_optional_status(rayList, m3i, p3i, 0.05, 0.3, xmin, xA, xtol, 1)\n'
        + '      and seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1)\n'
        + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
        + 'l5_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol, 1)\n'
        + '      and seg_required_status(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol, 2))$\n\n'
        + 'c1s: is(l1_ok and l2_ok)$\n'
        + 'c2s: is(l3_ok)$\n'
        + 'c3s: is(l4_ok and l5_ok)$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol))$\n'
        + 'l2_geom: is(seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol)\n'
        + '      and seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol))$\n'
        + 'l3_geom: att2$\n'
        + 'l4_geom: is(seg_required_geom(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol)\n'
        + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
        + 'l5_geom: is(seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol)\n'
        + '      and seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol))$\n\n'
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n'
        + 'l5_score: line_score(l5_ok, l5_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score + l5_score$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_full_ok: (if c1s then 1 else 0) + (if c2s then 1 else 0) + (if c3s then 1 else 0)$\n'
        + 'have2: is(nb_full_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, xAp, ABp, 0.3))$\n'
        + 'abp_status: is(found_AB_status(rayList, xAp, 0, ABp, 0.3, 0.3, 2))$';

    var fbBilan = I18N_D.t('opt.rd_fb_bilan');

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.rc_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*3/5', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.rc_desc_point_bp'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/5', truepenalty: '', truenextnode: '2',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.rd_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '2',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.rd_fb_point_false')
        },
        {
            name: '2', description: I18N_D.t('opt.rc_desc_statut_abp'), answertest: 'AlgEquiv',
            sans: 'abp_status', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/5', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-2-T',
            truefeedback: I18N_D.t('opt.rd_fb_statut_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-2-F',
            falsefeedback: I18N_D.t('opt.rd_fb_statut_false')
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var genFbDefault = I18N_D.t('opt.rd_genfb_common')
        + I18N_D.t('opt.rd_genfb_result', { xap: _n(xAp), abp: _n(ABp) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label') + 'f&nbsp;=&nbsp;' + _n(f) + '&nbsp;cm, '
        + 'OA&nbsp;=&nbsp;' + _n(OA) + '&nbsp;cm, AB&nbsp;=&nbsp;' + _n(AB) + '&nbsp;cm</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.rd_instr_h2') + '</h2>'
        + I18N_D.t('opt.rd_instr_p1', { f: _n(f), ab: _n(AB), oa: _n(OA) })
        + I18N_D.t('opt.rd_instr_p2')
        + I18N_D.t('opt.rd_instr_li1')
        + I18N_D.t('opt.rd_instr_li2')
        + I18N_D.t('opt.rd_instr_li3')
        + I18N_D.t('opt.rd_instr_p3')
        + I18N_D.t('opt.rd_instr_p4') + '</div>';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_lentille_divergente') + '</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-Divergente Q' + X + ' f=' + f + ' OA=' + OA,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Bibliothèque Maxima partagée pour les scénarios de construction optique
   (lentille / miroir). Reprise du fichier de référence, en standardisant sur
   la version "affinée" de status_covering_x (recherche d'abord un tronçon
   contenant x exactement avant repli sur la tolérance) — voir PLAN.md : deux
   versions coexistaient dans les fichiers de référence (bug de portage non
   répercuté partout), celle-ci est la bonne à généraliser partout. ── */
function _opticsConstructionMaximaHelpers() {
    return 'found_ray(rayList, mExp, pExp, mtol, ptol) := block([simp, found, r],\n'
        + '  simp: true,\n  found: false,\n  for r in rayList do (\n'
        + '    if listp(r) and length(r) >= 2 and numberp(r[1]) and numberp(r[2]) then (\n'
        + '      if abs(r[1] - mExp) < mtol and abs(r[2] - pExp) < ptol then found: true\n'
        + '    )\n  ),\n  found\n)$\n\n'
        + 'found_point(ptList, xExp, yExp, tol) := block([simp, found, p],\n'
        + '  simp: true,\n  found: false,\n  for p in ptList do (\n'
        + '    if listp(p) and length(p) = 3 and numberp(p[2]) and numberp(p[3]) then (\n'
        + '      if abs(p[2] - xExp) < tol and abs(p[3] - yExp) < tol then found: true\n'
        + '    )\n  ),\n  found\n)$\n\n'
        + 'all_pieces_status(pieces, want) := block([simp, ok, pc],\n'
        + '  simp: true,\n  ok: true,\n  for pc in pieces do (\n'
        + '    if not (listp(pc) and length(pc) >= 3 and is(eff_status(pc[3]) = want)) then ok: false\n'
        + '  ),\n  ok\n)$\n\n'
        + 'found_ray_status(rayList, mExp, pExp, mtol, ptol, want) := block([simp, found, r],\n'
        + '  simp: true,\n  found: false,\n  for r in rayList do (\n'
        + '    if listp(r) and length(r) >= 3 and numberp(r[1]) and numberp(r[2]) and listp(r[3]) and length(r[3]) > 0 then (\n'
        + '      if abs(r[1] - mExp) < mtol and abs(r[2] - pExp) < ptol and all_pieces_status(r[3], want) then found: true\n'
        + '    )\n  ),\n  found\n)$\n\n'
        + 'line_pieces(rayList, m, p, mtol, ptol) := block([simp, result, r],\n'
        + '  simp: true,\n  result: [],\n  for r in rayList do (\n'
        + '    if listp(r) and length(r) >= 3 and numberp(r[1]) and numberp(r[2]) and listp(r[3]) then (\n'
        + '      if abs(r[1] - m) < mtol and abs(r[2] - p) < ptol then result: append(result, r[3])\n'
        + '    )\n  ),\n  result\n)$\n\n'
        + '/* Cherche d\'abord un tronçon qui contient x exactement (sans tolérance) : évite qu\'un point situé\n'
        + '   juste à la frontière entre deux tronçons adjacents (ex. avant/après la lentille, tous deux « collés »\n'
        + '   en x=0) ne récupère par erreur le statut du tronçon voisin à cause du padding de tolérance. La\n'
        + '   tolérance n\'est utilisée qu\'en repli, si aucun tronçon ne contient x exactement. */\n'
        + 'status_covering_x(pieces, x, tol) := block([simp, pc, lo, hi, found],\n'
        + '  simp: true,\n  found: -1,\n  for pc in pieces do (\n'
        + '    if listp(pc) and length(pc) >= 3 then (\n'
        + '      lo: min(pc[1], pc[2]),\n      hi: max(pc[1], pc[2]),\n'
        + '      if x >= lo and x <= hi then found: pc[3]\n    )\n  ),\n'
        + '  if found = -1 then (\n    for pc in pieces do (\n'
        + '      if listp(pc) and length(pc) >= 3 then (\n'
        + '        lo: min(pc[1], pc[2]),\n        hi: max(pc[1], pc[2]),\n'
        + '        if x >= lo - tol and x <= hi + tol then found: pc[3]\n      )\n    )\n  ),\n'
        + '  found\n)$\n\n'
        + '/* Un tronçon jamais cliqué (statut par défaut = 0) est considéré réel : seul un clic explicite peut\n'
        + '   le rendre virtuel (2). L\'absence (-1) reste distincte (rien n\'est tracé à cet endroit). */\n'
        + 'eff_status(s) := if s = 0 then 1 else s$\n\n'
        + 'seg_required_status(rayList, m, p, mtol, ptol, xlo, xhi, tol, want) := block([simp, pieces, s1, s2],\n'
        + '  simp: true,\n  pieces: line_pieces(rayList, m, p, mtol, ptol),\n'
        + '  s1: status_covering_x(pieces, xlo + tol, tol),\n  s2: status_covering_x(pieces, xhi - tol, tol),\n'
        + '  is(eff_status(s1) = want) and is(eff_status(s2) = want)\n)$\n\n'
        + '/* Version "géométrie seule" : le tronçon requis est présent (peu importe son statut réel/virtuel/défaut).\n'
        + '   Sert au crédit partiel (70%) quand le tracé est juste mais le statut est faux. */\n'
        + 'seg_required_geom(rayList, m, p, mtol, ptol, xlo, xhi, tol) := block([simp, pieces, s1, s2],\n'
        + '  simp: true,\n  pieces: line_pieces(rayList, m, p, mtol, ptol),\n'
        + '  s1: status_covering_x(pieces, xlo + tol, tol),\n  s2: status_covering_x(pieces, xhi - tol, tol),\n'
        + '  is(s1 # -1) and is(s2 # -1)\n)$\n\n'
        + 'seg_absent(rayList, m, p, mtol, ptol, xlo, xhi, tol) := block([simp, pieces, s1],\n'
        + '  simp: true,\n  pieces: line_pieces(rayList, m, p, mtol, ptol),\n'
        + '  s1: status_covering_x(pieces, (xlo + xhi) / 2, tol),\n  is(s1 = -1)\n)$\n\n'
        + 'seg_optional_status(rayList, m, p, mtol, ptol, xlo, xhi, tol, want) := block([simp],\n'
        + '  simp: true,\n  seg_absent(rayList, m, p, mtol, ptol, xlo, xhi, tol) or seg_required_status(rayList, m, p, mtol, ptol, xlo, xhi, tol, want)\n)$\n\n'
        + 'found_AB_status(rayList, xExp, y1Exp, y2Exp, xtol, ytol, want) := block([simp, found, r, pc, ylo, yhi, plo, phi],\n'
        + '  simp: true,\n  found: false,\n  ylo: min(y1Exp, y2Exp),\n  yhi: max(y1Exp, y2Exp),\n'
        + '  for r in rayList do (\n'
        + '    if listp(r) and length(r) = 3 and stringp(r[1]) and is(r[1] = "vert") and numberp(r[2])\n'
        + '       and abs(r[2] - xExp) < xtol and listp(r[3]) then (\n'
        + '      for pc in r[3] do (\n'
        + '        if listp(pc) and length(pc) >= 3 then (\n'
        + '          plo: min(pc[1], pc[2]),\n          phi: max(pc[1], pc[2]),\n'
        + '          if abs(plo - ylo) < ytol and abs(phi - yhi) < ytol and is(eff_status(pc[3]) = want) then found: true\n'
        + '        )\n      )\n    )\n  ),\n  found\n)$\n\n';
}

/* ── Moteur JSXGraph : boîte à outils de construction de rayons (lentille) ──
   Portage littéral du fichier de référence, avec substitution des paramètres
   f/OA/AB et de la fenêtre d'affichage. Enveloppé dans une IIFE (var au lieu
   de let/const) pour rester isolé si plusieurs instances de ce scénario
   coexistent sur une même page. */
function _lentilleConstructionJXG(X, p, I18N_D) {
    var f = p.f, OA = p.OA, AB = p.AB;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var lensHeight = p.lensHeight;
    var dispW = p.dispW || 700;
    /* convergente (défaut) : glyphe flèche vers l'extérieur, F à -f / F' à +f.
       divergente : glyphe échancré vers l'intérieur, F à +f / F' à -f (foyers
       inversés — voir fichier de référence « Lentille divergente »). */
    var convergente = p.convergente !== false;
    var lensGlyph = convergente
        ? "board.create('segment', [[0, -lensHeight], [0, lensHeight]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, lensHeight], [-0.4, lensHeight - 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, lensHeight], [0.4, lensHeight - 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, -lensHeight], [-0.4, -lensHeight + 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, -lensHeight], [0.4, -lensHeight + 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        : "board.create('segment', [[0, lensHeight - 0.5], [0, -(lensHeight - 0.5)]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[-0.4, lensHeight], [0, lensHeight - 0.5]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0.4, lensHeight], [0, lensHeight - 0.5]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[-0.4, -lensHeight], [0, -(lensHeight - 0.5)]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0.4, -lensHeight], [0, -(lensHeight - 0.5)]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n";
    var fPointsGlyph = convergente
        ? "board.create('point', [-f, 0], { name: 'F', size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
          + "board.create('point', [f, 0], { name: \"F'\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        : "board.create('point', [f, 0], { name: 'F', size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
          + "board.create('point', [-f, 0], { name: \"F'\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var f = ' + f + ', lensHeight = ' + lensHeight + ';\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n'
        + 'var OA = ' + OA + ', AB = ' + AB + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + lensGlyph + '\n'
        + "board.create('point', [0, 0], { name: 'O', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + fPointsGlyph + '\n'
        + 'var xObj = -OA;\n'
        + "board.create('point', [xObj, 0], { name: 'A', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('point', [xObj, AB], { name: 'B', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[xObj, 0], [xObj, AB]], { strokeColor: 'red', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d < threshold && d < minDist) { minDist = d; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        if (Math.abs(p) <= lensHeight) {\n'
        + '            boundsX.push(0);\n'
        + "            var impactPoint = board.create('point', [0, p], { name: '', size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(impactPoint);\n            currentLogicalRay.points.push(impactPoint);\n        }\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_emergent') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? \"B'\" : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n'
        + "        else if (toolMode === 'perp') {\n"
        + '            addRayFromPieces(null, null, true, x, [[0, y, 1]]);\n'
        + "            var pointAp = board.create('point', [x, 0], { name: \"A'\", size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(pointAp); standaloneElements.push(pointAp);\n'
        + '            syncState();\n            resetTool();\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_ex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_intersection_bp') + "\", 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_emergent') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_tracer_ap') + "\", 'perp', \"" + I18N_D.t('opt.jxg_msg_perp') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "lentille_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('lentille_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Moteur JSXGraph : boîte à outils de construction de rayons (miroir sphérique) ──
   Portage direct de _lentilleConstructionJXG : mêmes outils/état/sérialisation,
   avec glyphe miroir (segment vertical + hachures, biseaux vers l'intérieur pour
   un miroir concave / vers l'extérieur pour un miroir convexe), points S/F/C,
   objet repéré par SA (au lieu de OA), et fonction miroir_construction(...).  */
function _miroirConstructionJXG(X, p, I18N_D) {
    var f = p.f, SA = p.SA, AB = p.AB;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var mirrorHeight = p.mirrorHeight;
    var dispW = p.dispW || 700;
    var convexe = !!p.convexe;
    var mirrorGlyph = convexe
        ? "board.create('segment', [[0, -mirrorHeight], [0, mirrorHeight]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, mirrorHeight], [0.4, mirrorHeight + 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, -mirrorHeight], [0.4, -mirrorHeight - 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        : "board.create('segment', [[0, -mirrorHeight], [0, mirrorHeight]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, mirrorHeight], [-0.4, mirrorHeight + 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
          + "board.create('segment', [[0, -mirrorHeight], [-0.4, -mirrorHeight - 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n";
    var mirrorGlyphHatch = "for (var i = -4; i <= 4; i++) {\n"
        + '    var y = i * (mirrorHeight / 4);\n'
        + "    board.create('segment', [[0, y], [0.4, y - 0.4]], { strokeColor: 'black', strokeWidth: 1.5, fixed: true, highlight: false, tabindex: null });\n}\n";
    /* Un miroir sphérique a un unique foyer (F et F' sont confondus, contrairement
       à une lentille) ; on le nomme "F'" par cohérence avec les fichiers de
       référence (foyer image), notamment le télescope de Newton (F₁'/F₂'). */
    var fcPointsGlyph = convexe
        ? "board.create('point', [f, 0], { name: \"F'\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
          + "board.create('point', [2 * f, 0], { name: 'C', size: 3, fixed: true, color: 'darkgreen', highlight: false, tabindex: null });\n"
        : "board.create('point', [-f, 0], { name: \"F'\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
          + "board.create('point', [-2 * f, 0], { name: 'C', size: 3, fixed: true, color: 'darkgreen', highlight: false, tabindex: null });\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var f = ' + f + ', mirrorHeight = ' + mirrorHeight + ';\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n'
        + 'var SA = ' + SA + ', AB = ' + AB + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + mirrorGlyph + '\n' + mirrorGlyphHatch + '\n'
        + "board.create('point', [0, 0], { name: 'S', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + fcPointsGlyph + '\n'
        + 'var xObj = -SA;\n'
        + "board.create('point', [xObj, 0], { name: 'A', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('point', [xObj, AB], { name: 'B', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[xObj, 0], [xObj, AB]], { strokeColor: 'red', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d < threshold && d < minDist) { minDist = d; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        if (Math.abs(p) <= mirrorHeight) {\n'
        + '            boundsX.push(0);\n'
        + "            var impactPoint = board.create('point', [0, p], { name: '', size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(impactPoint);\n            currentLogicalRay.points.push(impactPoint);\n        }\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'sym') { addCustomRay(0, 0, x, -y); resetTool(); }\n"
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_reflechi') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? \"B'\" : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n'
        + "        else if (toolMode === 'perp') {\n"
        + '            addRayFromPieces(null, null, true, x, [[0, y, 1]]);\n'
        + "            var pointAp = board.create('point', [x, 0], { name: \"A'\", size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(pointAp); standaloneElements.push(pointAp);\n'
        + '            syncState();\n            resetTool();\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_ex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_symetrique') + "\", 'sym', \"" + I18N_D.t('opt.jxg_msg_symetrique') + "\");\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_intersection_bp') + "\", 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_reflechi') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_tracer_ap') + "\", 'perp', \"" + I18N_D.t('opt.jxg_msg_perp') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "miroir_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('miroir_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Générateur commun Miroir concave/convexe (4 rayons remarquables) ──
   convexe=false : miroir concave, deux sous-cas automatiques selon SA vs f
   (réelle si SA>f, virtuelle si SA<f, même formule xAp=xF*xA/(xA-xF)).
   convexe=true  : miroir convexe, toujours virtuelle (F et C toujours
   derrière le miroir) — la formule générique le donne automatiquement. */
/* NOTE conversion : « _genOptiqueMiroirCore » est le nom HISTORIQUE de cette
   fonction (partagée par miroir concave/convexe via le flag booléen
   `convexe`), sans rapport avec la convention wrapper/*Core introduite par ce
   chantier de découplage DOM. Pour éviter toute collision de nom avec cette
   convention, le cœur pur nouvellement extrait est nommé
   _genOptiqueMiroirCoreImpl (et non _genOptiqueMiroirCoreCore) — voir
   PLAN.md / rapport de conversion. Le nom et la signature de
   _genOptiqueMiroirCore(X, convexe) sont conservés à l'identique : c'est le
   point d'entrée utilisé par _genOptiqueMiroirConcave/_genOptiqueMiroirConvexe. */
function _genOptiqueMiroirParams() {
    var bareme = parseFloat(v('opt-bareme'))   || 1;
    var text   = richVal('opt-text');
    var f      = parseFloat(v('opt-mir-f'))    || 3;
    var SA     = parseFloat(v('opt-mir-sa'))   || 7;
    var AB     = parseFloat(v('opt-mir-ab'))   || 1.5;
    var dispW  = parseInt(v('opt-w'))  || 700;
    var dispH  = parseInt(v('opt-h'))  || 380;
    var fbGenRaw = v('opt-fbgen');
    return { bareme: bareme, text: text, f: f, SA: SA, AB: AB, dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw };
}

function _genOptiqueMiroirCore(X, convexe) {
    var p = _genOptiqueMiroirParams();
    p.convexe = convexe;
    return _genOptiqueMiroirCoreImpl(X, p);
}

function _genOptiqueMiroirCoreImpl(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var convexe = p.convexe, bareme = p.bareme, text = p.text, f = p.f, SA = p.SA, AB = p.AB,
        dispW = p.dispW, dispH = p.dispH;

    if (f <= 0)
        throw new Error(I18N_D.t('opt.err_f_positive'));
    if (SA <= 0)
        throw new Error(I18N_D.t('opt.err_sa_positive'));
    if (!convexe && Math.abs(SA - f) < 0.01)
        throw new Error(I18N_D.t('opt.err_sa_eq_f'));
    /* SA = 2f (concave) : l'objet est exactement au centre de courbure C, donc le
       rayon "dirigé vers C" est indéfini (m2e = -AB/(xC-xA) diviserait par zéro). */
    if (!convexe && Math.abs(SA - 2 * f) < 0.01)
        throw new Error(I18N_D.t('opt.err_sa_eq_2f'));

    var xF  = convexe ? f : -f;
    var xC  = convexe ? 2 * f : -2 * f;
    var xA  = -SA;
    var xAp = xF * xA / (xA - xF);
    var gam = -(xAp / xA);
    var ABp = gam * AB;

    /* Miroir concave : SA>f → image réelle (devant le miroir) ; SA<f → image
       virtuelle (il faut prolonger les rayons réfléchis derrière le miroir).
       Miroir convexe : F et C sont toujours virtuels, donc xAp>0 toujours —
       la même formule générique donne automatiquement virtuelle=true. */
    var virtuelle = xAp > 0;

    /* Rayons remarquables (mêmes formules que les fichiers de référence) */
    var m1e = -AB / xF, p1e = AB;
    var m2e = -AB / (xC - xA), p2e = -m2e * xC;
    var m3i = -AB / (xF - xA), p3i = -m3i * xF;
    var m3e = 0, p3e = AB * xF / (xF - xA);
    var m4i = AB / xA;
    var m4e = -AB / xA;

    var halfX  = Math.max(Math.abs(xA), Math.abs(xAp), Math.abs(xC), 2 * f) + 4;
    var mirH   = Math.max(Math.abs(AB), Math.abs(ABp)) * 1.4 + 1.5;
    var halfY  = Math.max(mirH + 1, halfX / 2);
    var xminG  = _n(-halfX + 3);
    var xmaxG  = _n(halfX - 3);
    var xtol   = 0.5;

    function _n(v) { var r = Math.round(v * 1e1) / 1e1; return r === 0 ? 0 : r; }

    /* Le rayon 2 (par C) ne coupe le miroir (point d'impact en x=0) que si son
       ordonnée à l'origine reste dans la hauteur du miroir ; sinon il reste
       entièrement du côté réel (devant le miroir) et n'a pas besoin d'être
       scindé en un tronçon incident + un tronçon réfléchi distincts. */
    var cRayCrosses = Math.abs(_n(p2e)) <= mirH;

    /* ── Construction correcte de référence (pour <tans>) ── */
    var emergentPieces = virtuelle
        ? '[[' + xminG + ',0,1],[0,' + xmaxG + ',2]]'
        : '[[' + xminG + ',0,1]]';
    var ray2Pieces = cRayCrosses
        ? (virtuelle ? '[[' + xminG + ',0,1],[0,' + xmaxG + ',2]]' : '[[' + xminG + ',0,1],[0,' + xmaxG + ',1]]')
        : '[[' + xminG + ',' + xmaxG + ',1]]';
    var tansRayList = '[[0,' + _n(AB) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m1e) + ',' + _n(p1e) + ',' + emergentPieces + '],'
        + '[' + _n(m2e) + ',' + _n(p2e) + ',' + ray2Pieces + '],'
        + '[' + _n(m3i) + ',' + _n(p3i) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m3e) + ',' + _n(p3e) + ',' + emergentPieces + '],'
        + '[' + _n(m4i) + ',0,[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m4e) + ',0,' + emergentPieces + '],'
        + '["vert",' + _n(xAp) + ',[[0,' + _n(ABp) + ',' + (virtuelle ? 2 : 1) + ']]]'
        + ']';
    var tansPtList = '[["B\'",' + _n(xAp) + ',' + _n(ABp) + '],["A\'",' + _n(xAp) + ',0]]';
    var tans = 'miroir_construction(' + tansRayList + ',' + tansPtList + ')';

    /* ── Moteur JSXGraph (toolbar + tracé + sérialisation) ── */
    var jxg = _miroirConstructionJXG(X, {
        f: f, SA: SA, AB: AB,
        X_MIN: _n(-halfX), X_MAX: _n(halfX), Y_MIN: _n(-halfY), Y_MAX: _n(halfY),
        mirrorHeight: _n(mirH), convexe: convexe, dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'f: ' + _n(f) + '$\n'
        + 'mirrorHeight: ' + _n(mirH) + '$\n'
        + 'SA: ' + _n(SA) + '$\n'
        + 'AB: ' + _n(AB) + '$\n'
        + 'xF: ' + (convexe ? 'f' : '-f') + '$\n'
        + 'xC: ' + (convexe ? '2*f' : '-2*f') + '$\n'
        + 'xA: -SA$\n'
        + 'xAp: xF*xA/(xA-xF)$\n'
        + 'gam: -(xAp/xA)$\n'
        + 'ABp: gam*AB$\n\n'
        + 'm1e: -AB/xF$\n'
        + 'p1e: AB$\n'
        + 'm2e: -AB/(xC-xA)$\n'
        + 'p2e: -m2e*xC$\n'
        + 'm3e: 0$\n'
        + 'p3e: AB*xF/(xF-xA)$\n'
        + 'm4e: -AB/xA$\n\n'
        + 'm3i: -AB/(xF-xA)$\n'
        + 'p3i: -m3i*xF$\n'
        + 'm4i: AB/xA$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "miroir_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'miroir_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>miroir_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (5/7) + point B' (1/7) + statut réel/virtuel de A'B' (1/7) ──
       4 rayons ⇒ 7 tronçons notés (l1..l7) : le rayon 1 (// axe) et le rayon 3
       (par F) comptent chacun pour 2 (incident + réfléchi), le rayon 4 (vers S)
       de même, le rayon 2 (par C) ne compte que pour 1 sauf s'il coupe
       effectivement le miroir (c_ray_crosses), auquel cas il se scinde aussi
       en incident/réfléchi côté virtuel/convexe (côté réel, un seul statut
       suffit puisque les deux tronçons doivent être réels de toute façon). */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'c1: is(found_ray(rayList, 0, AB, 0.05, 0.3) and found_ray(rayList, m1e, p1e, 0.05, 0.3))$\n'
        + 'c2: is(found_ray(rayList, m2e, p2e, 0.05, 0.3))$\n'
        + 'c3: is(found_ray(rayList, m3i, p3i, 0.05, 0.3) and found_ray(rayList, m3e, p3e, 0.05, 0.3))$\n'
        + 'c4: is(found_ray(rayList, m4i, 0, 0.05, 0.3) and found_ray(rayList, m4e, 0, 0.05, 0.3))$\n\n'
        + (virtuelle
            ? 'l1_ok: is(seg_optional_status(rayList, 0, AB, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l2_ok: is(seg_required_status(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '      and seg_required_status(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol, 2))$\n'
              + '/* Le rayon par C ne coupe le miroir que si son ordonnée à l\'origine reste dans la hauteur du\n'
              + '   miroir ; sinon il reste entièrement du côté réel et doit être entièrement réel. */\n'
              + 'c_ray_crosses: is(abs(p2e) <= mirrorHeight)$\n'
              + 'l3_ok: if c_ray_crosses then\n'
              + '    is(seg_required_status(rayList, m2e, p2e, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '       and seg_required_status(rayList, m2e, p2e, 0.05, 0.3, 0, xmax, xtol, 2))\n'
              + '  else\n'
              + '    is(found_ray_status(rayList, m2e, p2e, 0.05, 0.3, 1))$\n'
              + 'l4_ok: is(seg_optional_status(rayList, m3i, p3i, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol, 2))$\n'
              + 'l6_ok: is(seg_optional_status(rayList, m4i, 0, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m4i, 0, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, m4i, 0, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l7_ok: is(seg_required_status(rayList, m4e, 0, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '      and seg_required_status(rayList, m4e, 0, 0.05, 0.3, 0, xmax, xtol, 2))$\n\n'
            : 'l1_ok: is(seg_optional_status(rayList, 0, AB, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_optional_status(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol, 2))$\n'
              + 'l2_ok: is(seg_absent(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol)\n'
              + '      and seg_required_status(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol, 1))$\n'
              + 'c_ray_crosses: is(abs(p2e) <= mirrorHeight)$\n'
              + 'l3_ok: is(found_ray_status(rayList, m2e, p2e, 0.05, 0.3, 1))$\n'
              + 'l4_ok: is(seg_optional_status(rayList, m3i, p3i, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '      and seg_optional_status(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol, 2))$\n'
              + 'l6_ok: is(seg_optional_status(rayList, m4i, 0, 0.05, 0.3, xmin, xA, xtol, 1)\n'
              + '      and seg_required_status(rayList, m4i, 0, 0.05, 0.3, xA, 0, xtol, 1)\n'
              + '      and seg_absent(rayList, m4i, 0, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l7_ok: is(seg_required_status(rayList, m4e, 0, 0.05, 0.3, xmin, 0, xtol, 1)\n'
              + '      and seg_optional_status(rayList, m4e, 0, 0.05, 0.3, 0, xmax, xtol, 2))$\n\n')
        + 'c1s: is(l1_ok and l2_ok)$\n'
        + 'c2s: is(l3_ok)$\n'
        + 'c3s: is(l4_ok and l5_ok)$\n'
        + 'c4s: is(l6_ok and l7_ok)$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + (virtuelle
            ? 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol))$\n'
              + 'l2_geom: is(seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol)\n'
              + '      and seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l3_geom: if c_ray_crosses then\n'
              + '    is(seg_required_geom(rayList, m2e, p2e, 0.05, 0.3, xmin, 0, xtol)\n'
              + '       and seg_required_geom(rayList, m2e, p2e, 0.05, 0.3, 0, xmax, xtol))\n'
              + '  else c2$\n'
              + 'l4_geom: is(seg_required_geom(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_geom: is(seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol)\n'
              + '      and seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l6_geom: is(seg_required_geom(rayList, m4i, 0, 0.05, 0.3, xA, 0, xtol)\n'
              + '      and seg_absent(rayList, m4i, 0, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l7_geom: is(seg_required_geom(rayList, m4e, 0, 0.05, 0.3, xmin, 0, xtol)\n'
              + '      and seg_required_geom(rayList, m4e, 0, 0.05, 0.3, 0, xmax, xtol))$\n\n'
            : 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol))$\n'
              + 'l2_geom: is(seg_absent(rayList, m1e, p1e, 0.05, 0.3, 0, xmax, xtol)\n'
              + '      and seg_required_geom(rayList, m1e, p1e, 0.05, 0.3, xmin, 0, xtol))$\n'
              + 'l3_geom: c2$\n'
              + 'l4_geom: is(seg_required_geom(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol)\n'
              + '      and seg_absent(rayList, m3i, p3i, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l5_geom: is(seg_required_geom(rayList, m3e, p3e, 0.05, 0.3, xmin, 0, xtol))$\n'
              + 'l6_geom: is(seg_required_geom(rayList, m4i, 0, 0.05, 0.3, xA, 0, xtol)\n'
              + '      and seg_absent(rayList, m4i, 0, 0.05, 0.3, 0, xmax, xtol))$\n'
              + 'l7_geom: is(seg_required_geom(rayList, m4e, 0, 0.05, 0.3, xmin, 0, xtol))$\n\n')
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n'
        + 'l5_score: line_score(l5_ok, l5_geom)$\n'
        + 'l6_score: line_score(l6_ok, l6_geom)$\n'
        + 'l7_score: line_score(l7_ok, l7_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score + l5_score + l6_score + l7_score$\n\n'
        + 'att1: is(found_ray(rayList, 0, AB, 0.05, 0.3) or found_ray(rayList, m1e, p1e, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, m2e, p2e, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, m3i, p3i, 0.05, 0.3) or found_ray(rayList, m3e, p3e, 0.05, 0.3))$\n'
        + 'att4: is(found_ray(rayList, m4i, 0, 0.05, 0.3) or found_ray(rayList, m4e, 0, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3 or att4)$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_reflected_ok: (if l2_ok then 1 else 0) + (if l3_ok then 1 else 0) + (if l5_ok then 1 else 0) + (if l7_ok then 1 else 0)$\n'
        + 'have2: is(nb_reflected_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, xAp, ABp, 0.3))$\n'
        + 'abp_status: is(found_AB_status(rayList, xAp, 0, ABp, 0.3, 0.3, ' + (virtuelle ? 2 : 1) + '))$';

    var rayLabel2 = I18N_D.t(convexe ? 'opt.mcc_ray_label2_convexe' : 'opt.mcc_ray_label2_concave');
    var rayLabel3 = I18N_D.t(convexe ? 'opt.mcc_ray_label3_convexe' : 'opt.mcc_ray_label3_concave');

    var fbBilan = I18N_D.t(virtuelle ? 'opt.mcc_fb_bilan_virtuelle' : 'opt.mcc_fb_bilan_reelle', { raylabel2: rayLabel2, raylabel3: rayLabel3 });

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.mcc_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*5/7', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.rc_desc_point_bp'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/7', truepenalty: '', truenextnode: '2',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.mcc_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '2',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.mcc_fb_point_false')
        },
        {
            name: '2', description: I18N_D.t('opt.rc_desc_statut_abp'), answertest: 'AlgEquiv',
            sans: 'abp_status', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/7', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-2-T',
            truefeedback: convexe
                ? I18N_D.t('opt.mcc_fb_statut_true_convexe')
                : I18N_D.t(virtuelle ? 'opt.mcc_fb_statut_true_virtuelle' : 'opt.mcc_fb_statut_true_reelle', { sa: _n(SA), f: _n(f) }),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-2-F',
            falsefeedback: convexe
                ? I18N_D.t('opt.mcc_fb_statut_false_convexe')
                : I18N_D.t(virtuelle ? 'opt.mcc_fb_statut_false_virtuelle' : 'opt.mcc_fb_statut_false_reelle', { sa: _n(SA), f: _n(f) })
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var ray2Bullet = I18N_D.t(convexe ? 'opt.mcc_ray2_bullet_convexe' : 'opt.mcc_ray2_bullet_concave');
    var ray3Bullet = I18N_D.t(convexe ? 'opt.mcc_ray3_bullet_convexe' : 'opt.mcc_ray3_bullet_concave');
    var raysListHtml = I18N_D.t('opt.mcc_rays_list_first')
        + ray2Bullet + ray3Bullet
        + I18N_D.t('opt.mcc_rays_list_last');

    var genFbDefault = convexe
        ? I18N_D.t('opt.mcc_genfb_convexe', { xap: _n(xAp), abp: _n(ABp) })
        : I18N_D.t(virtuelle ? 'opt.mcc_genfb_virtuelle' : 'opt.mcc_genfb_reelle', { xap: _n(xAp), abp: _n(ABp) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label') + 'f&nbsp;=&nbsp;' + _n(f) + '&nbsp;cm, '
        + 'SA&nbsp;=&nbsp;' + _n(SA) + '&nbsp;cm, AB&nbsp;=&nbsp;' + _n(AB) + '&nbsp;cm</p>\n';

    var instructionsIntro = convexe
        ? I18N_D.t('opt.mcc_instr_intro_convexe', { f: _n(f), ab: _n(AB), sa: _n(SA) })
        : I18N_D.t(virtuelle ? 'opt.mcc_instr_intro_concave_virtuelle' : 'opt.mcc_instr_intro_concave_reelle', { f: _n(f), ab: _n(AB), sa: _n(SA) });
    var instructionsCross = convexe
        ? I18N_D.t('opt.mcc_instr_cross_convexe')
        : I18N_D.t(virtuelle ? 'opt.mcc_instr_cross_virtuelle' : 'opt.mcc_instr_cross_reelle');
    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t(convexe ? 'opt.mcc_instr_h2_convexe' : 'opt.mcc_instr_h2_concave') + '</h2>'
        + instructionsIntro + instructionsCross
        + '<ul>' + raysListHtml + '</ul>'
        + I18N_D.t(convexe || virtuelle ? 'opt.mcc_instr_p3_pointilles' : 'opt.mcc_instr_p3_plein')
        + I18N_D.t('opt.rc_instr_p4') + '</div>';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t(convexe ? 'opt.title_miroir_convexe' : 'opt.title_miroir_concave') + '</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           (convexe ? 'Optique-MiroirConvexe Q' : 'Optique-MiroirConcave Q') + X + ' f=' + f + ' SA=' + SA,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

function _genOptiqueMiroirConcave(X) { return _genOptiqueMiroirCore(X, false); }
function _genOptiqueMiroirConvexe(X) { return _genOptiqueMiroirCore(X, true); }

/* ── Scénario 3 : Lunette astronomique afocale ── */
/* ── Moteur JSXGraph : lunette astronomique afocale (construction toolbar) ──
   Portage de _lentilleConstructionJXG pour un système à DEUX lentilles
   convergentes (objectif L1 en x=0, oculaire L2 en x=d=f1+f2) : mêmes
   outils/état/sérialisation génériques, mais les ruptures de pente des
   rayons (« impact » sur une lentille) sont calculées pour DEUX abscisses
   (LENS_XS = [[0,lens1H],[d,lens2H]]) au lieu d'une seule. Pas d'outil
   « Tracer A' » (l'image finale est à l'infini, il n'y a pas de segment
   A'B' à qualifier réel/virtuel). Le premier point construit par
   intersection est nommé B1 (image intermédiaire réelle dans le plan
   focal commun F'1=F2), et la fonction de sérialisation est
   lunette_construction(rayons, points). */
function _lunetteConstructionJXG(X, p, I18N_D) {
    var f1 = p.f1, f2 = p.f2, d = p.d, beamH = p.beamH, tanA = p.tanA;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var lens1H = p.lens1H, lens2H = p.lens2H;
    var dispW = p.dispW || 700;
    var lensGlyph1 =
        "board.create('segment', [[0, -lens1H], [0, lens1H]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, lens1H], [-0.4, lens1H - 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, lens1H], [0.4, lens1H - 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, -lens1H], [-0.4, -lens1H + 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, -lens1H], [0.4, -lens1H + 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [0, lens1H + 1.1, 'L\\u2081'], { fixed: true, fontSize: 15, fontWeight: 'bold', color: '#1d4ed8', anchorX: 'middle', highlight: false, tabindex: null });\n";
    var lensGlyph2 =
        "board.create('segment', [[d, -lens2H], [d, lens2H]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, lens2H], [d - 0.4, lens2H - 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, lens2H], [d + 0.4, lens2H - 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, -lens2H], [d - 0.4, -lens2H + 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, -lens2H], [d + 0.4, -lens2H + 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [d, lens2H + 1.1, 'L\\u2082'], { fixed: true, fontSize: 15, fontWeight: 'bold', color: '#7c3aed', anchorX: 'middle', highlight: false, tabindex: null });\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var f1 = ' + f1 + ', f2 = ' + f2 + ', d = ' + d + ', beamH = ' + beamH + ', tanA = ' + tanA + ';\n'
        + 'var lens1H = ' + lens1H + ', lens2H = ' + lens2H + ';\n'
        + 'var LENS_XS = [[0, lens1H], [d, lens2H]];\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + lensGlyph1 + '\n' + lensGlyph2 + '\n'
        + "board.create('point', [0, 0], { name: 'O\\u2081', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + "board.create('point', [-f1, 0], { name: 'F\\u2081', size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [f1, 0], { name: \"F'\\u2081=F\\u2082\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [d, 0], { name: 'O\\u2082', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + "board.create('point', [d + f2, 0], { name: \"F'\\u2082\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n\n"
        + 'var segX1 = X_MIN * 0.12, segX2 = X_MIN * 0.02;\n'
        + "board.create('segment', [[segX1, -tanA*segX1], [segX2, -tanA*segX2]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[segX1, -tanA*segX1], [segX2, -tanA*segX2]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[segX1, -tanA*segX1+beamH], [segX2, -tanA*segX2+beamH]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[segX1, -tanA*segX1+beamH], [segX2, -tanA*segX2+beamH]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [segX1, -tanA*segX1+beamH+0.8, \"" + I18N_D.t('opt.jxg_label_objet_infini') + "\"], { fixed: true, fontSize: 11, color: '#c0392b', highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d2 = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d2 < threshold && d2 < minDist) { minDist = d2; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        for (var li = 0; li < LENS_XS.length; li++) {\n'
        + '            var lx = LENS_XS[li][0], lh = LENS_XS[li][1];\n'
        + '            var yAtLx = m * lx + p;\n'
        + '            if (Math.abs(yAtLx) <= lh) {\n'
        + '                boundsX.push(lx);\n'
        + "                var impactPoint = board.create('point', [lx, yAtLx], { name: '', size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                allDrawnElements.push(impactPoint);\n                currentLogicalRay.points.push(impactPoint);\n            }\n        }\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_generic') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? 'B1' : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_noex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_intersection_b1') + "', 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_generic') + "');\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "lunette_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('lunette_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Lunette astronomique afocale — système à deux lentilles convergentes
   (objectif f'1, oculaire f'2, séparées de d=f'1+f'2). L'objet est à
   l'infini (étoile), repéré par son diamètre apparent θ. Construction en
   deux temps sur le même canevas/input : (1) deux rayons incidents
   parallèles (l'un par le centre O1, l'autre décalé de beamH) donnent par
   intersection le point image intermédiaire B1, réel, dans le plan focal
   commun F'1=F2 ; (2) deux rayons issus de B1 (l'un par le centre O2,
   l'autre parallèle à l'axe puis par F'2) donnent le faisceau émergent,
   parallèle (système afocal, image finale à l'infini — pas de second
   point à construire). Voir le fichier de référence « Lunette
   astronomique » pour les formules physiques (reprises à l'identique). */
function _genOptiqueLunetteConstructionParams() {
    var bareme = parseFloat(v('opt-bareme')) || 1;
    var text   = richVal('opt-text');
    var f1     = parseFloat(v('opt-f1'))     || 40;
    var f2     = parseFloat(v('opt-f2'))     || 10;
    var theta  = parseFloat(v('opt-theta'))  || 3;
    var beamH  = parseFloat(v('opt-beam-h')) || 3;
    var dispW  = parseInt(v('opt-w')) || 700;
    var dispH  = parseInt(v('opt-h')) || 380;
    var fbGenRaw = v('opt-fbgen');
    return {
        bareme: bareme, text: text, f1: f1, f2: f2, theta: theta, beamH: beamH,
        dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw
    };
}

function _genOptiqueLunetteConstruction(X) {
    return _genOptiqueLunetteConstructionCore(X, _genOptiqueLunetteConstructionParams());
}

function _genOptiqueLunetteConstructionCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f1 = p.f1, f2 = p.f2, theta = p.theta, beamH = p.beamH,
        dispW = p.dispW, dispH = p.dispH;

    if (f1 <= 0) throw new Error(I18N_D.t('opt.err_f1_positive'));
    if (f2 <= 0) throw new Error(I18N_D.t('opt.err_f2_positive'));
    if (theta <= 0) throw new Error(I18N_D.t('opt.err_theta_positive'));
    if (beamH <= 0) throw new Error(I18N_D.t('opt.err_theta_positive'));

    function _n(val) { var r = Math.round(val * 1e1) / 1e1; return r === 0 ? 0 : r; }

    var tanT = Math.tan(theta * Math.PI / 180);
    var d    = f1 + f2;
    var yB1  = -f1 * tanT;

    /* Rayons remarquables (voir commentaire du moteur JSXGraph ci-dessus) */
    var mA = -tanT, pA = 0;                                   // rayon par O1 (incident + émergent confondus)
    var mBi = -tanT, pBi = beamH;                              // rayon décalé, avant L1
    var mBe = (yB1 - beamH) / f1, pBe = beamH;                 // … après L1, vers B1
    var mC = -yB1 / f2, pC = -mC * d;                          // rayon B1 → O2 (non dévié)
    var mDi = 0, pDi = yB1;                                    // rayon B1 → L2, // axe
    var mDe = -yB1 / f2, pDe = yB1 - mDe * d;                  // … après L2, vers F'2

    var xminG = _n(-(f1 * 0.6) - 2);
    var xmaxG = _n(d + f2 * 1.3 + 3);
    var yAmp  = Math.max(Math.abs(yB1) + 3, beamH + 3, 5) * 1.3;
    var lens1H = _n(yAmp * 0.68);
    var lens2H = _n(yAmp * 0.52);
    var X_MIN = _n(xminG - 3), X_MAX = _n(xmaxG + 3);
    var Y_MIN = _n(-yAmp), Y_MAX = _n(yAmp);
    var xtol  = 0.5;

    /* ── Construction correcte de référence (pour <tans>) ── */
    var tansRayList = '[[' + _n(mA) + ',' + _n(pA) + ',[[' + xminG + ',' + _n(f1) + ',1]]],'
        + '[' + _n(mBi) + ',' + _n(pBi) + ',[[' + xminG + ',0,1]]],'
        + '[' + _n(mBe) + ',' + _n(pBe) + ',[[0,' + _n(f1) + ',1]]],'
        + '[' + _n(mC) + ',' + _n(pC) + ',[[' + _n(f1) + ',' + xmaxG + ',1]]],'
        + '[' + _n(mDi) + ',' + _n(pDi) + ',[[' + _n(f1) + ',' + _n(d) + ',1]]],'
        + '[' + _n(mDe) + ',' + _n(pDe) + ',[[' + _n(d) + ',' + xmaxG + ',1]]]'
        + ']';
    var tansPtList = '[["B1",' + _n(f1) + ',' + _n(yB1) + ']]';
    var tans = 'lunette_construction(' + tansRayList + ',' + tansPtList + ')';

    var jxg = _lunetteConstructionJXG(X, {
        f1: f1, f2: f2, d: _n(d), beamH: beamH, tanA: _n(tanT),
        X_MIN: X_MIN, X_MAX: X_MAX, Y_MIN: Y_MIN, Y_MAX: Y_MAX,
        lens1H: lens1H, lens2H: lens2H, dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'f1: ' + _n(f1) + '$\n'
        + 'f2: ' + _n(f2) + '$\n'
        + 'theta: ' + _n(theta) + '$\n'
        + 'beamH: ' + _n(beamH) + '$\n'
        + 'd: f1+f2$\n'
        + 'tanT: tan(theta*%pi/180)$\n'
        + 'yB1: -f1*tanT$\n\n'
        + 'mA: -tanT$\n' + 'pA: 0$\n'
        + 'mBi: -tanT$\n' + 'pBi: beamH$\n'
        + 'mBe: (yB1-beamH)/f1$\n' + 'pBe: beamH$\n'
        + 'mC: -yB1/f2$\n' + 'pC: -mC*d$\n'
        + 'mDi: 0$\n' + 'pDi: yB1$\n'
        + 'mDe: -yB1/f2$\n' + 'pDe: yB1-mDe*d$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "lunette_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'lunette_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>lunette_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (5/6) + point image intermédiaire B1 (1/6) ──
       Chaque entrée de rayList (6 au total : rayon par O1, rayon décalé
       incident/émergent, rayon par O2, rayon // axe incident/émergent)
       est entièrement réelle — pas de statut virtuel possible ici, à la
       différence des lentilles/miroirs seuls (l'image intermédiaire B1
       est toujours réelle, et le faisceau émergent est toujours réel). */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'att1: is(found_ray(rayList, mA, pA, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, mBi, pBi, 0.05, 0.3) or found_ray(rayList, mBe, pBe, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, mC, pC, 0.05, 0.3))$\n'
        + 'att4: is(found_ray(rayList, mDi, pDi, 0.05, 0.3) or found_ray(rayList, mDe, pDe, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3 or att4)$\n\n'
        + 'l1_ok: is(seg_required_status(rayList, mA, pA, 0.05, 0.3, xmin, ' + _n(f1) + ', xtol, 1))$\n'
        + 'l2_ok: is(seg_required_status(rayList, mBi, pBi, 0.05, 0.3, xmin, 0, xtol, 1))$\n'
        + 'l3_ok: is(seg_required_status(rayList, mBe, pBe, 0.05, 0.3, 0, ' + _n(f1) + ', xtol, 1))$\n'
        + 'l4_ok: is(seg_required_status(rayList, mC, pC, 0.05, 0.3, ' + _n(f1) + ', xmax, xtol, 1))$\n'
        + 'l5_ok: is(seg_required_status(rayList, mDi, pDi, 0.05, 0.3, ' + _n(f1) + ', ' + _n(d) + ', xtol, 1))$\n'
        + 'l6_ok: is(seg_required_status(rayList, mDe, pDe, 0.05, 0.3, ' + _n(d) + ', xmax, xtol, 1))$\n\n'
        + 'c1s: is(l1_ok)$\n'
        + 'c2s: is(l2_ok and l3_ok)$\n'
        + 'c3s: is(l4_ok)$\n'
        + 'c4s: is(l5_ok and l6_ok)$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + 'l1_geom: att1$\n'
        + 'l2_geom: is(seg_required_geom(rayList, mBi, pBi, 0.05, 0.3, xmin, 0, xtol))$\n'
        + 'l3_geom: is(seg_required_geom(rayList, mBe, pBe, 0.05, 0.3, 0, ' + _n(f1) + ', xtol))$\n'
        + 'l4_geom: att3$\n'
        + 'l5_geom: is(seg_required_geom(rayList, mDi, pDi, 0.05, 0.3, ' + _n(f1) + ', ' + _n(d) + ', xtol))$\n'
        + 'l6_geom: is(seg_required_geom(rayList, mDe, pDe, 0.05, 0.3, ' + _n(d) + ', xmax, xtol))$\n\n'
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n'
        + 'l5_score: line_score(l5_ok, l5_geom)$\n'
        + 'l6_score: line_score(l6_ok, l6_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score + l5_score + l6_score$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_full_ok: (if c1s then 1 else 0) + (if c2s then 1 else 0) + (if c3s then 1 else 0) + (if c4s then 1 else 0)$\n'
        + 'have2: is(nb_full_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, ' + _n(f1) + ', ' + _n(yB1) + ', 0.3))$';

    var fbBilan = I18N_D.t('opt.lun_fb_bilan', { beamh: _n(beamH) });

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.lun_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*5/6', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.lun_desc_point_b1'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/6', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.lun_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.lun_fb_point_false', { beamh: _n(beamH), f1: _n(f1) })
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var genFbDefault = I18N_D.t('opt.lun_genfb', { d: _n(d), f1: _n(f1) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label')
        + I18N_D.t('opt.lun_data_content', { f1: _n(f1), f2: _n(f2), theta: _n(theta) }) + '</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.lun_instr_h2') + '</h2>'
        + I18N_D.t('opt.lun_instr_intro', { f1: _n(f1), f2: _n(f2), d: _n(d), theta: _n(theta) })
        + I18N_D.t('opt.lun_instr_rays_intro') + '<ul>'
        + I18N_D.t('opt.lun_instr_rays_list', { beamh: _n(beamH) }) + '</ul>'
        + I18N_D.t('opt.lun_instr_intersection')
        + I18N_D.t('opt.lun_instr_click') + '</div>';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_lunette') + '</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-Lunette Q' + X + " f1=" + f1 + ' f2=' + f2 + ' th=' + theta,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Moteur JSXGraph : miroir plan (construction toolbar) ──
   Portage de _miroirConstructionJXG pour un miroir plan : pas de F/C, glyphe
   plat symétrique, uniquement le point S. Le côté réel/virtuel dépend
   uniquement de x=0 (le miroir), l'image étant toujours virtuelle. */
function _miroirPlanConstructionJXG(X, p, I18N_D) {
    var SA = p.SA, AB = p.AB;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var mirrorHeight = p.mirrorHeight;
    var dispW = p.dispW || 700;
    var mirrorGlyph = "board.create('segment', [[0, -mirrorHeight], [0, mirrorHeight]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n";
    var mirrorGlyphHatch = "for (var i = -4; i <= 4; i++) {\n"
        + '    var y = i * (mirrorHeight / 4);\n'
        + "    board.create('segment', [[0, y], [0.4, y - 0.4]], { strokeColor: 'black', strokeWidth: 1.5, fixed: true, highlight: false, tabindex: null });\n}\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var mirrorHeight = ' + mirrorHeight + ';\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n'
        + 'var SA = ' + SA + ', AB = ' + AB + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + mirrorGlyph + '\n' + mirrorGlyphHatch + '\n'
        + "board.create('point', [0, 0], { name: 'S', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n\n"
        + 'var xObj = -SA;\n'
        + "board.create('point', [xObj, 0], { name: 'A', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('point', [xObj, AB], { name: 'B', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[xObj, 0], [xObj, AB]], { strokeColor: 'red', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d < threshold && d < minDist) { minDist = d; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        if (Math.abs(p) <= mirrorHeight) {\n'
        + '            boundsX.push(0);\n'
        + "            var impactPoint = board.create('point', [0, p], { name: '', size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(impactPoint);\n            currentLogicalRay.points.push(impactPoint);\n        }\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'sym') { addCustomRay(0, 0, x, -y); resetTool(); }\n"
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_reflechi') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? \"B'\" : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n'
        + "        else if (toolMode === 'perp') {\n"
        + '            addRayFromPieces(null, null, true, x, [[0, y, 1]]);\n'
        + "            var pointAp = board.create('point', [x, 0], { name: \"A'\", size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(pointAp); standaloneElements.push(pointAp);\n'
        + '            syncState();\n            resetTool();\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_ex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_symetrique') + "\", 'sym', \"" + I18N_D.t('opt.jxg_msg_symetrique') + "\");\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_intersection_bp') + "\", 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_reflechi') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_tracer_ap') + "\", 'perp', \"" + I18N_D.t('opt.jxg_msg_perp') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "miroirplan_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('miroirplan_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Scénario 4 : Miroir plan (2 rayons remarquables, image toujours virtuelle) ──
   Rayon "normal" : issu de B perpendiculairement au miroir, se réfléchit sur
   lui-même (m=0, p=AB, une seule équation pour incident+émergent puisqu'un
   miroir plan renvoie une incidence normale exactement sur elle-même).
   Rayon "vers S" : issu de B en direction du sommet S, repart symétriquement
   par rapport à l'axe optique (pente opposée), comme pour les miroirs
   sphériques. L'image A'B' est toujours virtuelle et de même taille (gam=1). */
function _genOptiqueMiroirPlanParams() {
    var bareme = parseFloat(v('opt-bareme')) || 1;
    var text   = richVal('opt-text');
    var SA     = parseFloat(v('opt-mp-sa')) || 7;
    var AB     = parseFloat(v('opt-mp-ab')) || 1.5;
    var dispW  = parseInt(v('opt-w')) || 700;
    var dispH  = parseInt(v('opt-h')) || 380;
    var fbGenRaw = v('opt-fbgen');
    return { bareme: bareme, text: text, SA: SA, AB: AB, dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw };
}

function _genOptiqueMiroirPlan(X) {
    return _genOptiqueMiroirPlanCore(X, _genOptiqueMiroirPlanParams());
}

function _genOptiqueMiroirPlanCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, SA = p.SA, AB = p.AB, dispW = p.dispW, dispH = p.dispH;

    if (SA <= 0)
        throw new Error(I18N_D.t('opt.err_sa_positive'));

    var xA  = -SA;
    var xAp = SA;
    var ABp = AB;

    var mInc = -AB / SA, mEm = AB / SA;

    function _n(val) { var r = Math.round(val * 1e1) / 1e1; return r === 0 ? 0 : r; }

    var halfX = Math.max(Math.abs(xA), Math.abs(xAp)) + 4;
    var mirH  = Math.max(Math.abs(AB), Math.abs(ABp)) * 1.4 + 1.5;
    var halfY = Math.max(mirH + 1, halfX / 2);
    var xminG = _n(-halfX + 3);
    var xmaxG = _n(halfX - 3);
    var xtol  = 0.5;

    /* ── Construction correcte de référence (pour <tans>) ── */
    var tansRayList = '[[0,' + _n(AB) + ',[[' + _n(xA) + ',0,1],[0,' + xmaxG + ',2]]],'
        + '[' + _n(mInc) + ',0,[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(mEm) + ',0,[[' + xminG + ',0,1],[0,' + xmaxG + ',2]]]'
        + ']';
    var tansPtList = '[["B\'",' + _n(xAp) + ',' + _n(ABp) + '],["A\'",' + _n(xAp) + ',0]]';
    var tans = 'miroirplan_construction(' + tansRayList + ',' + tansPtList + ')';

    /* ── Moteur JSXGraph ── */
    var jxg = _miroirPlanConstructionJXG(X, {
        SA: SA, AB: AB,
        X_MIN: _n(-halfX), X_MAX: _n(halfX), Y_MIN: _n(-halfY), Y_MAX: _n(halfY),
        mirrorHeight: _n(mirH), dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'mirrorHeight: ' + _n(mirH) + '$\n'
        + 'SA: ' + _n(SA) + '$\n'
        + 'AB: ' + _n(AB) + '$\n'
        + 'xA: -SA$\n'
        + 'xAp: SA$\n'
        + 'ABp: AB$\n\n'
        + 'mInc: -AB/SA$\n'
        + 'mEm: AB/SA$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "miroirplan_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'miroirplan_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>miroirplan_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (4/6) + point B' (1/6) + statut réel/virtuel de A'B' (1/6) ── */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'c1: is(found_ray(rayList, 0, AB, 0.05, 0.3))$\n'
        + 'c2: is(found_ray(rayList, mInc, 0, 0.05, 0.3) or found_ray(rayList, mEm, 0, 0.05, 0.3))$\n\n'
        + 'l1_ok: is(seg_required_status(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol, 1)\n'
        + '      and seg_required_status(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol, 2))$\n'
        + 'l2_ok: is(seg_required_status(rayList, mInc, 0, 0.05, 0.3, xA, 0, xtol, 1)\n'
        + '      and seg_required_status(rayList, mEm, 0, 0.05, 0.3, xmin, 0, xtol, 1)\n'
        + '      and seg_required_status(rayList, mEm, 0, 0.05, 0.3, 0, xmax, xtol, 2))$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + 'l1_geom: is(seg_required_geom(rayList, 0, AB, 0.05, 0.3, xA, 0, xtol)\n'
        + '      and seg_required_geom(rayList, 0, AB, 0.05, 0.3, 0, xmax, xtol))$\n'
        + 'l2_geom: is(seg_required_geom(rayList, mInc, 0, 0.05, 0.3, xA, 0, xtol)\n'
        + '      and seg_required_geom(rayList, mEm, 0, 0.05, 0.3, xmin, 0, xtol)\n'
        + '      and seg_required_geom(rayList, mEm, 0, 0.05, 0.3, 0, xmax, xtol))$\n\n'
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score$\n\n'
        + 'att1: c1$\natt2: c2$\n'
        + 'any_attempt: is(att1 or att2)$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'have2: is(l1_ok and l2_ok)$\n\n'
        + 'c_point: is(found_point(ptList, xAp, ABp, 0.3))$\n'
        + 'abp_status: is(found_AB_status(rayList, xAp, 0, ABp, 0.3, 0.3, 2))$';

    var fbBilan = I18N_D.t('opt.mp_fb_bilan');

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.mcc_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*4/6', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.rc_desc_point_bp'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/6', truepenalty: '', truenextnode: '2',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.mp_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '2',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.mp_fb_point_false')
        },
        {
            name: '2', description: I18N_D.t('opt.rc_desc_statut_abp'), answertest: 'AlgEquiv',
            sans: 'abp_status', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/6', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-2-T',
            truefeedback: I18N_D.t('opt.mp_fb_statut_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-2-F',
            falsefeedback: I18N_D.t('opt.mp_fb_statut_false')
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var raysListHtml = I18N_D.t('opt.mp_rays_list');

    var genFbDefault = I18N_D.t('opt.mp_genfb', { xap: _n(xAp), abp: _n(ABp) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label')
        + I18N_D.t('opt.mp_data_content', { sa: _n(SA), ab: _n(AB) }) + '</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.mp_instr_h2') + '</h2>'
        + I18N_D.t('opt.mp_instr_intro', { ab: _n(AB), sa: _n(SA) })
        + I18N_D.t('opt.mp_instr_cross')
        + '<ul>' + raysListHtml + '</ul>'
        + I18N_D.t('opt.mp_instr_p3')
        + I18N_D.t('opt.rc_instr_p4') + '</div>';

    var textFrag = '<div style="background:#b45309;border-left:5px solid #92400e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_miroir_plan') + '</strong>'
        + '<span style="background:#92400e;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-MiroirPlan Q' + X + ' SA=' + SA,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 5 : Miroir sphérique ── */
function _genOptiqueMiroirSpherique(X) {
    var bareme  = parseFloat(v('opt-bareme')) || 1;
    var text    = richVal('opt-text');
    var f       = parseFloat(v('opt-ms-f'))   || 20;
    var SA      = parseFloat(v('opt-ms-sa'))  || 30;
    var AB      = parseFloat(v('opt-ms-ab'))  || 2;
    var msType  = v('opt-ms-type') || 'concave';
    var tolPos  = parseFloat(v('opt-ms-tol-pos')) || 2;
    var tolH    = parseFloat(v('opt-ms-tol-h'))   || 1;
    var fbOk    = v('opt-fb-ok')    || '';
    var fbWrong = v('opt-fb-wrong') || '';
    var dispW   = parseInt(v('opt-w')) || 700;
    var dispH   = parseInt(v('opt-h')) || 380;
    var fbGenRaw = v('opt-fbgen');
    return _genOptiqueMiroirSpheriqueCore(X, {
        bareme: bareme, text: text, f: f, SA: SA, AB: AB, msType: msType,
        tolPos: tolPos, tolH: tolH, fbOk: fbOk, fbWrong: fbWrong,
        dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw
    });
}

function _genOptiqueMiroirSpheriqueCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f = p.f, SA = p.SA, AB = p.AB, msType = p.msType,
        tolPos = p.tolPos, tolH = p.tolH, fbOk = p.fbOk, fbWrong = p.fbWrong,
        dispW = p.dispW, dispH = p.dispH;

    // Physics: xF = focal point x-coord (negative = in front of mirror for concave)
    // Formula: 1/xA' + 1/xA = 1/xF   (xF<0 concave, xF>0 convex)
    var xF  = (msType === 'concave') ? -f : f;
    var xC  = 2 * xF;
    var xA  = -SA;
    var xAp = xF * xA / (xA - xF);
    var gam = -(xAp / xA);           // magnification for mirror: γ = -xA'/xA
    var ABp = gam * AB;
    var isVirtual = (xAp > 0);       // virtual image is behind the mirror

    // Visual mirror arc parameters (artistic, not physical scale)
    var mirrorH = Math.min(f * 0.15, 4.5);
    var sag = mirrorH / 6;
    var Rvis = (sag * sag + mirrorH * mirrorH) / (2 * sag);
    var tMax = Math.asin(mirrorH / Rvis);

    // Diagram bounding box
    var xMin = Math.min(xA, xC) - 8;
    var xMax = Math.max(0, xAp) + 6;
    var yAmp = Math.max(Math.abs(AB), Math.abs(ABp), 3.5) * 2.0;

    // Initial wrong position for B'
    var initBpX = xA * 0.5;
    var initBpY = AB * 0.6;

    // Precomputed numbers for embedding
    var xFStr  = xF.toFixed(3);
    var xCStr  = xC.toFixed(3);
    var xApStr = xAp.toFixed(3);
    var ABpStr = ABp.toFixed(3);
    var RvisStr  = Rvis.toFixed(4);
    var tMaxStr  = tMax.toFixed(6);
    var sagStr   = sag.toFixed(4);
    var mirHStr  = mirrorH.toFixed(2);
    var isConcave = (msType === 'concave');

    var jxg = 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '  boundingbox: [' + xMin.toFixed(1) + ',' + yAmp.toFixed(1) + ','
        + xMax.toFixed(1) + ',' + (-yAmp).toFixed(1) + '],\n'
        + '  keepaspectratio: false, axis: false,\n'
        + '  showCopyright: false, showNavigation: false\n'
        + '});\n'
        // Axis
        + 'board.create("line", [[0,0],[1,0]], {strokeColor:"#d1d5db",strokeWidth:1.5,'
        + 'straightFirst:true,straightLast:true,fixed:true,highlight:false});\n'
        // Mirror arc
        + (isConcave
            // concave: x(t)=Rvis*(cos(t)-1), y(t)=Rvis*sin(t) opens left
            ? 'board.create("curve", [function(t){return ' + RvisStr + '*(Math.cos(t)-1);}, '
                + 'function(t){return ' + RvisStr + '*Math.sin(t);}, '
                + '-' + tMaxStr + ', ' + tMaxStr + '], '
                + '{strokeColor:"#374151",strokeWidth:3.5,fixed:true,highlight:false});\n'
            // convex: x(t)=Rvis*(1-cos(t)), y(t)=Rvis*sin(t) opens right
            : 'board.create("curve", [function(t){return ' + RvisStr + '*(1-Math.cos(t));}, '
                + 'function(t){return ' + RvisStr + '*Math.sin(t);}, '
                + '-' + tMaxStr + ', ' + tMaxStr + '], '
                + '{strokeColor:"#374151",strokeWidth:3.5,fixed:true,highlight:false});\n'
          )
        // Hatching (on non-reflective side)
        + (function() {
            var h = '';
            var nH = 6;
            var hatchDx = isConcave ? 1.0 : -1.0; // concave: hatch right; convex: hatch left
            for (var i = 0; i <= nH; i++) {
                var t = -tMax + i * (2 * tMax / nH);
                var xHatch = isConcave ? Rvis * (Math.cos(t) - 1) : Rvis * (1 - Math.cos(t));
                var yHatch = Rvis * Math.sin(t);
                h += 'board.create("segment", [['
                    + xHatch.toFixed(3) + ',' + yHatch.toFixed(3) + '],['
                    + (xHatch + hatchDx).toFixed(3) + ',' + (yHatch - 0.8).toFixed(3) + ']], '
                    + '{strokeColor:"#9ca3af",strokeWidth:1,fixed:true,highlight:false});\n';
            }
            return h;
        })()
        // Labels: S at vertex
        + 'board.create("text", [' + (isConcave ? sagStr : ('-' + sagStr)) + ',0.4,"S"], '
        + '{fixed:true,anchorX:"center",fontSize:12,color:"#374151",highlight:false});\n'
        // Focal point F
        + 'board.create("point", [' + xFStr + ',0], {fixed:true,size:3,face:"cross",'
        + 'fillColor:"#0369a1",strokeColor:"#0369a1",name:"F",'
        + 'label:{fontSize:12,color:"#0369a1",offset:[0,8]},highlight:false});\n'
        // Center of curvature C
        + 'board.create("point", [' + xCStr + ',0], {fixed:true,size:3,face:"cross",'
        + 'fillColor:"#64748b",strokeColor:"#64748b",name:"C",'
        + 'label:{fontSize:12,color:"#64748b",offset:[0,8]},highlight:false});\n'
        // Object A, B (fixed, green)
        + 'board.create("segment", [[' + xA + ',0],[' + xA + ',' + AB + ']], '
        + '{strokeColor:"#16a34a",strokeWidth:2.5,fixed:true,highlight:false,'
        + 'lastArrow:{type:1,size:5}});\n'
        + 'board.create("point", [' + xA + ',0], {fixed:true,size:3,face:"circle",'
        + 'fillColor:"#16a34a",strokeColor:"#16a34a",name:"A",'
        + 'label:{fontSize:13,color:"#16a34a",offset:[5,-15]},highlight:false});\n'
        + 'board.create("point", [' + xA + ',' + AB + '], {fixed:true,size:4,face:"circle",'
        + 'fillColor:"#16a34a",strokeColor:"#16a34a",name:"B",'
        + 'label:{fontSize:13,color:"#16a34a",offset:[5,5]},highlight:false});\n'
        // Draggable B' (red)
        + 'var Bp = board.create("point", [' + initBpX.toFixed(2) + ',' + initBpY.toFixed(2) + '], {'
        + 'size:6,face:"circle",fillColor:"#ef4444",strokeColor:"#b91c1c",'
        + 'name:"B\\u2019",label:{fontSize:13,color:"#b91c1c",offset:[5,5]}});\n'
        // Derived A' on axis
        + 'var Ap = board.create("point", [function(){return Bp.X();},0], {'
        + 'fixed:false,size:3,face:"circle",fillColor:"#dc2626",strokeColor:"#dc2626",'
        + 'name:"A\\u2019",label:{fontSize:13,color:"#dc2626",offset:[5,-15]},highlight:false});\n'
        // Image arrow (dashed if virtual)
        + 'board.create("segment", [Ap,Bp], {strokeColor:"#ef4444",strokeWidth:2,'
        + (isVirtual ? 'dash:2,' : '') + 'fixed:false,highlight:false,lastArrow:{type:1,size:5}});\n'
        // STACK bind
        + 'stack_jxg.bind_point(board, "ans' + X + '", Bp);\n';

    var inputXML = '<input>\n'
        + '  <name>ans' + X + '</name>\n'
        + '  <type>algebraic</type>\n'
        + '  <tans>[' + xApStr + ',' + ABpStr + ']</tans>\n'
        + '  <boxsize>5</boxsize>\n'
        + '  <strictsyntax>1</strictsyntax><insertstars>0</insertstars>\n'
        + '  <syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>\n'
        + '  <forbidwords></forbidwords><allowwords></allowwords>\n'
        + '  <forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>\n'
        + '  <checkanswertype>0</checkanswertype><mustverify>0</mustverify>\n'
        + '  <showvalidation>0</showvalidation><options></options>\n'
        + '</input>';

    var fbVars = 'opt_bpx_' + X + ': float(ans' + X + '[1]);\n'
        + 'opt_bpy_' + X + ': float(ans' + X + '[2]);\n'
        + 'opt_xAp_' + X + ': float(' + xApStr + ');\n'
        + 'opt_ABp_' + X + ': float(' + ABpStr + ');\n'
        + 'opt_ok_' + X + ': is(abs(opt_bpx_' + X + ' - opt_xAp_' + X + ') <= '
        + tolPos.toFixed(2) + ' and abs(opt_bpy_' + X + ' - opt_ABp_' + X + ') <= '
        + tolH.toFixed(2) + ');\n';
    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: I18N_D.t('opt.ms_desc_image'), answertest: 'AlgEquiv',
        sans: 'opt_ok_' + X, tans: 'true', testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var typeLabel = (msType === 'concave') ? I18N_D.t('opt.ms_type_concave') : I18N_D.t('opt.ms_type_convexe');
    var SAp = -xAp;
    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label')
        + I18N_D.t('opt.ms_data_miroir_prefix') + typeLabel + ', |f\'| = ' + f + ' cm, '
        + 'SA = ' + SA + ' cm, AB = ' + AB + ' cm</p>\n';

    var textFrag = '<div style="background:#b45309;border-left:5px solid #92400e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_miroir_spherique') + '</strong>'
        + '<span style="background:#92400e;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + I18N_D.t('opt.hint_miroir_sph_1')
        + (isVirtual ? I18N_D.t('opt.hint_miroir_sph_virtual') : I18N_D.t('opt.hint_miroir_sph_real'))
        + '</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-MiroirSph Q' + X + ' ' + msType + ' f=' + f + ' SA=' + SA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D("", p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Moteur JSXGraph : télescope de Newton, miroir primaire seul (construction toolbar) ──
   Portage de _miroirConstructionJXG pour un objet à l'infini (étoile, diamètre
   apparent θ) : pas de segment objet AB, pas d'outil « Tracer A' » (l'image B1
   est le résultat final, formée dans le plan focal du miroir primaire). Deux
   rayons incidents parallèles inclinés de θ (l'un par le sommet S, l'autre
   décalé de beamH) se réfléchissent et convergent en B1. Le miroir est
   toujours concave (miroir primaire convergent). */
function _telescopeConstructionJXG(X, p, I18N_D) {
    var f1 = p.f1, beamH = p.beamH, tanA = p.tanA;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var mirrorHeight = p.mirrorHeight;
    var dispW = p.dispW || 700;
    var mirrorGlyph =
        "board.create('segment', [[0, -mirrorHeight], [0, mirrorHeight]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, mirrorHeight], [-0.4, mirrorHeight + 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, -mirrorHeight], [-0.4, -mirrorHeight - 0.4]], { strokeColor: 'black', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n";
    var mirrorGlyphHatch = "for (var i = -4; i <= 4; i++) {\n"
        + '    var y = i * (mirrorHeight / 4);\n'
        + "    board.create('segment', [[0, y], [0.4, y - 0.4]], { strokeColor: 'black', strokeWidth: 1.5, fixed: true, highlight: false, tabindex: null });\n}\n";
    var fcPointsGlyph =
        "board.create('point', [-f1, 0], { name: \"F\\u2081\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [-2 * f1, 0], { name: 'C', size: 3, fixed: true, color: 'darkgreen', highlight: false, tabindex: null });\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var f1 = ' + f1 + ', beamH = ' + beamH + ', mirrorHeight = ' + mirrorHeight + ', tanA = ' + tanA + ';\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + mirrorGlyph + '\n' + mirrorGlyphHatch + '\n'
        + "board.create('point', [0, 0], { name: 'S', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + fcPointsGlyph + '\n'
        + 'var segX1 = X_MIN * 0.12, segX2 = X_MIN * 0.02;\n'
        + "board.create('segment', [[segX1, -tanA*segX1], [segX2, -tanA*segX2]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[segX1, -tanA*segX1], [segX2, -tanA*segX2]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[segX1, -tanA*segX1+beamH], [segX2, -tanA*segX2+beamH]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[segX1, -tanA*segX1+beamH], [segX2, -tanA*segX2+beamH]], { strokeColor: '#c0392b', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [segX1, -tanA*segX1+beamH+0.8, \"" + I18N_D.t('opt.jxg_label_objet_infini') + "\"], { fixed: true, fontSize: 11, color: '#c0392b', highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d < threshold && d < minDist) { minDist = d; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        if (Math.abs(p) <= mirrorHeight) {\n'
        + '            boundsX.push(0);\n'
        + "            var impactPoint = board.create('point', [0, p], { name: '', size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '            allDrawnElements.push(impactPoint);\n            currentLogicalRay.points.push(impactPoint);\n        }\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'sym') { addCustomRay(0, 0, x, -y); resetTool(); }\n"
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_reflechi') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? 'B1' : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_noex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_symetrique') + "\", 'sym', \"" + I18N_D.t('opt.jxg_msg_symetrique') + "\");\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_intersection_b1') + "\", 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_reflechi') + "');\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "telescope_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('telescope_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Télescope de Newton — miroir primaire concave seul (objet à l'infini) ──
   Une étoile à l'infini, de diamètre apparent θ, envoie un faisceau parallèle
   incliné de θ par rapport à l'axe optique. Deux rayons remarquables :
   celui qui touche le sommet S (réfléchi symétriquement par rapport à l'axe)
   et un second, décalé de beamH, qui converge avec le premier au point
   image B1 dans le plan focal du miroir primaire (x = -f1). Construction en
   un seul temps : les deux rayons incidents/réfléchis, puis B1 par
   intersection. (Le télescope de Newton complet ajoute un miroir secondaire
   plan à 45° et un oculaire ; cette version couvre la formation de l'image
   par le miroir primaire seul, cohérente avec le scénario proposé.) */
function _genOptiqueTelescopeConstructionParams() {
    var bareme = parseFloat(v('opt-bareme'))     || 1;
    var text   = richVal('opt-text');
    var f1     = parseFloat(v('opt-tel-f1'))     || 40;
    var theta  = parseFloat(v('opt-tel-theta'))  || 3;
    var beamH  = parseFloat(v('opt-tel-beam-h')) || 3;
    var dispW  = parseInt(v('opt-w')) || 700;
    var dispH  = parseInt(v('opt-h')) || 380;
    var fbGenRaw = v('opt-fbgen');
    return {
        bareme: bareme, text: text, f1: f1, theta: theta, beamH: beamH,
        dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw
    };
}

function _genOptiqueTelescopeConstruction(X) {
    return _genOptiqueTelescopeConstructionCore(X, _genOptiqueTelescopeConstructionParams());
}

function _genOptiqueTelescopeConstructionCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f1 = p.f1, theta = p.theta, beamH = p.beamH,
        dispW = p.dispW, dispH = p.dispH;

    if (f1 <= 0) throw new Error(I18N_D.t('opt.err_f1_positive'));
    if (theta <= 0) throw new Error(I18N_D.t('opt.err_theta_positive'));
    if (beamH <= 0) throw new Error(I18N_D.t('opt.err_theta_positive'));

    function _n(val) { var r = Math.round(val * 1e1) / 1e1; return r === 0 ? 0 : r; }

    var tanT = Math.tan(theta * Math.PI / 180);
    var yB1  = -f1 * tanT;

    /* Rayons remarquables */
    var mA = -tanT, pA = 0;                        // incident 1, par le sommet S
    var mAe = tanT, pAe = 0;                        // réfléchi 1, symétrique / axe, vers B1
    var mBi = -tanT, pBi = beamH;                    // incident 2, décalé de beamH
    var mBe = (beamH - yB1) / f1, pBe = beamH;       // réfléchi 2, vers B1

    var mirrorHeight = Math.max(beamH + 2, 5);
    var xminG = _n(-(f1 * 2.3) - 3);
    var xmaxG = _n(f1 * 0.25 + 2);
    var yAmp  = Math.max(Math.abs(yB1) + 2, mirrorHeight + 2) * 1.3;
    var X_MIN = _n(xminG - 2), X_MAX = _n(xmaxG + 2);
    var Y_MIN = _n(-yAmp), Y_MAX = _n(yAmp);
    var xtol  = 0.5;

    /* ── Construction correcte de référence (pour <tans>) ── */
    var tansRayList = '[[' + _n(mA) + ',' + _n(pA) + ',[[' + xminG + ',0,1]]],'
        + '[' + _n(mAe) + ',' + _n(pAe) + ',[[' + xminG + ',0,1]]],'
        + '[' + _n(mBi) + ',' + _n(pBi) + ',[[' + xminG + ',0,1]]],'
        + '[' + _n(mBe) + ',' + _n(pBe) + ',[[' + xminG + ',0,1]]]'
        + ']';
    var tansPtList = '[["B1",' + _n(-f1) + ',' + _n(yB1) + ']]';
    var tans = 'telescope_construction(' + tansRayList + ',' + tansPtList + ')';

    var jxg = _telescopeConstructionJXG(X, {
        f1: f1, beamH: beamH, tanA: _n(tanT),
        X_MIN: X_MIN, X_MAX: X_MAX, Y_MIN: Y_MIN, Y_MAX: Y_MAX,
        mirrorHeight: mirrorHeight, dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'f1: ' + _n(f1) + '$\n'
        + 'theta: ' + _n(theta) + '$\n'
        + 'beamH: ' + _n(beamH) + '$\n'
        + 'tanT: tan(theta*%pi/180)$\n'
        + 'yB1: -f1*tanT$\n\n'
        + 'mA: -tanT$\n' + 'pA: 0$\n'
        + 'mAe: tanT$\n' + 'pAe: 0$\n'
        + 'mBi: -tanT$\n' + 'pBi: beamH$\n'
        + 'mBe: (beamH-yB1)/f1$\n' + 'pBe: beamH$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "telescope_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'telescope_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>telescope_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons (5/6... ici 4 rayons) + point image B1 ── */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'att1: is(found_ray(rayList, mA, pA, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, mAe, pAe, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, mBi, pBi, 0.05, 0.3))$\n'
        + 'att4: is(found_ray(rayList, mBe, pBe, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3 or att4)$\n\n'
        + 'l1_ok: is(seg_required_status(rayList, mA, pA, 0.05, 0.3, xmin, 0, xtol, 1))$\n'
        + 'l2_ok: is(seg_required_status(rayList, mAe, pAe, 0.05, 0.3, xmin, 0, xtol, 1))$\n'
        + 'l3_ok: is(seg_required_status(rayList, mBi, pBi, 0.05, 0.3, xmin, 0, xtol, 1))$\n'
        + 'l4_ok: is(seg_required_status(rayList, mBe, pBe, 0.05, 0.3, xmin, 0, xtol, 1))$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + 'l1_geom: att1$\n'
        + 'l2_geom: att2$\n'
        + 'l3_geom: att3$\n'
        + 'l4_geom: att4$\n\n'
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_full_ok: (if l1_ok then 1 else 0) + (if l2_ok then 1 else 0) + (if l3_ok then 1 else 0) + (if l4_ok then 1 else 0)$\n'
        + 'have2: is(nb_full_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, ' + _n(-f1) + ', ' + _n(yB1) + ', 0.3))$';

    var fbBilan = I18N_D.t('opt.tel_fb_bilan', { beamh: _n(beamH) });

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.tel_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*5/6', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.tel_desc_point_b1'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/6', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.tel_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.tel_fb_point_false')
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var genFbDefault = I18N_D.t('opt.tel_genfb', { f1: _n(f1), beamh: _n(beamH) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label')
        + I18N_D.t('opt.tel_data_miroir') + _n(f1) + '&nbsp;cm, θ&nbsp;=&nbsp;' + _n(theta) + '°</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.tel_instr_h2') + '</h2>'
        + I18N_D.t('opt.tel_instr_intro', { f1: _n(f1), theta: _n(theta) })
        + I18N_D.t('opt.tel_instr_rays', { beamh: _n(beamH) })
        + I18N_D.t('opt.tel_instr_click') + '</div>';

    var textFrag = '<div style="background:#065f46;border-left:5px solid #064e3b;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_telescope') + '</strong>'
        + '<span style="background:#064e3b;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-Telescope Q' + X + ' f1=' + f1 + ' th=' + theta,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Moteur JSXGraph : microscope, objectif + oculaire (construction toolbar) ──
   Portage combiné de _lentilleConstructionJXG (objectif : objet fini AB,
   3 rayons remarquables → image réelle intermédiaire A1B1) et de la
   partie oculaire de _lunetteConstructionJXG (A1B1 exactement dans le
   plan focal objet F2 de l'oculaire → 2 rayons issus de A1B1 ressortent
   parallèles, système afocal, image finale à l'infini — réglage pour un
   œil normal). L'élève trace jusqu'à 5 rayons sur le même schéma : 3 pour
   l'objectif (convergeant en B1, construit par « Intersection »), puis 2
   pour l'oculaire (issus de B1, ressortant parallèles). */
function _microscopeConstructionJXG(X, p, I18N_D) {
    var f1 = p.f1, f2 = p.f2, d = p.d, xA = p.xA, AB = p.AB;
    var X_MIN = p.X_MIN, X_MAX = p.X_MAX, Y_MIN = p.Y_MIN, Y_MAX = p.Y_MAX;
    var lens1H = p.lens1H, lens2H = p.lens2H;
    var dispW = p.dispW || 700;
    var lensGlyph1 =
        "board.create('segment', [[0, -lens1H], [0, lens1H]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, lens1H], [-0.4, lens1H - 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, lens1H], [0.4, lens1H - 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, -lens1H], [-0.4, -lens1H + 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[0, -lens1H], [0.4, -lens1H + 0.4]], { strokeColor: '#1d4ed8', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [0, lens1H + 1.1, 'L\\u2081'], { fixed: true, fontSize: 15, fontWeight: 'bold', color: '#1d4ed8', anchorX: 'middle', highlight: false, tabindex: null });\n";
    var lensGlyph2 =
        "board.create('segment', [[d, -lens2H], [d, lens2H]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, lens2H], [d - 0.4, lens2H - 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, lens2H], [d + 0.4, lens2H - 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, -lens2H], [d - 0.4, -lens2H + 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('segment', [[d, -lens2H], [d + 0.4, -lens2H + 0.4]], { strokeColor: '#7c3aed', strokeWidth: 3, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('text', [d, lens2H + 1.1, 'L\\u2082'], { fixed: true, fontSize: 15, fontWeight: 'bold', color: '#7c3aed', anchorX: 'middle', highlight: false, tabindex: null });\n";
    return '(function(){\n'
        + 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '    boundingbox: [' + X_MIN + ', ' + Y_MAX + ', ' + X_MAX + ', ' + Y_MIN + '],\n'
        + '    axis: false,\n    keepaspectratio: true,\n    showNavigation: true,\n'
        + '    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
        + '    pan: { enabled: true, needTwoFingers: false, needShift: true }\n});\n\n'
        + 'var f1 = ' + f1 + ', f2 = ' + f2 + ', d = ' + d + ', xA = ' + xA + ', AB = ' + AB + ';\n'
        + 'var lens1H = ' + lens1H + ', lens2H = ' + lens2H + ';\n'
        + 'var X_MIN = ' + X_MIN + ', X_MAX = ' + X_MAX + ', Y_MIN = ' + Y_MIN + ', Y_MAX = ' + Y_MAX + ';\n\n'
        + "var toolMode = '';\n"
        + 'var tempPoint = null, dirPoint1 = null, dirPoint2 = null, interSeg1 = null;\n'
        + 'var selectedSegment = null;\n\n'
        + 'var allDrawnElements = [];\n'
        + 'var raySegments = [];\n'
        + 'var logicalRays = [];\n'
        + 'var standaloneElements = [];\n'
        + 'var intersectionCounter = 0;\n\n'
        + "board.create('line', [[X_MIN, 0], [X_MAX, 0]], { strokeColor: 'black', strokeWidth: 1, fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[X_MAX - 0.5, 0], [X_MAX, 0]], { fixed: true, highlight: false, tabindex: null });\n\n"
        + lensGlyph1 + '\n' + lensGlyph2 + '\n'
        + "board.create('point', [0, 0], { name: 'O\\u2081', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + "board.create('point', [-f1, 0], { name: 'F\\u2081', size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [f1, 0], { name: \"F'\\u2081\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [d, 0], { name: 'O\\u2082', size: 3, fixed: true, color: 'black', highlight: false, tabindex: null });\n"
        + "board.create('point', [d - f2, 0], { name: 'F\\u2082', size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n"
        + "board.create('point', [d + f2, 0], { name: \"F'\\u2082\", size: 3, fixed: true, color: 'green', highlight: false, tabindex: null });\n\n"
        + "board.create('point', [xA, 0], { name: 'A', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('point', [xA, AB], { name: 'B', size: 4, color: 'red', fixed: true, highlight: false, tabindex: null });\n"
        + "board.create('arrow', [[xA, 0], [xA, AB]], { strokeColor: 'red', strokeWidth: 2, fixed: true, highlight: false, tabindex: null });\n\n"
        + "var handlePoint = board.create('point', [0, Y_MIN + 0.3], { visible: false, fixed: true, name: '', tabindex: null });\n\n"
        + 'var DEFAULT_MSG = "' + I18N_D.t('opt.jxg_default_msg') + '";\n\n'
        + "var instructionsEl = document.createElement('p');\n"
        + "instructionsEl.style.cssText = 'margin:.6em 0 0;font-size:.85em;color:#333;';\n"
        + 'instructionsEl.textContent = DEFAULT_MSG;\n\n'
        + 'function setInstructions(msg) { instructionsEl.textContent = msg; }\n\n'
        + "var toolbarDiv = document.createElement('div');\n"
        + "toolbarDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4em;margin-top:.6em;';\n"
        + 'var toolButtons = {};\n\n'
        + 'function addToolButton(label, mode, msgOrHandler) {\n'
        + "    var btn = document.createElement('button');\n"
        + "    btn.type = 'button';\n    btn.textContent = label;\n"
        + "    btn.style.cssText = 'padding:.35em .7em;font-size:.85em;cursor:pointer;';\n"
        + '    if (mode === null) {\n'
        + "        btn.addEventListener('click', msgOrHandler);\n"
        + '    } else {\n'
        + "        btn.addEventListener('click', function(){ activateTool(mode, msgOrHandler); });\n"
        + '        toolButtons[mode] = btn;\n    }\n'
        + '    toolbarDiv.appendChild(btn);\n    return btn;\n}\n\n'
        + 'function setActiveButton(mode) {\n'
        + '    for (var m in toolButtons) {\n'
        + "        toolButtons[m].style.background = (m === mode) ? '#dbeafe' : '';\n"
        + "        toolButtons[m].style.fontWeight = (m === mode) ? 'bold' : 'normal';\n"
        + '    }\n}\n\n'
        + 'function resetTool() {\n'
        + "    toolMode = '';\n"
        + '    tempPoint = null; dirPoint1 = null; dirPoint2 = null; interSeg1 = null;\n'
        + "    board.defaultCursor = 'default';\n"
        + '    setInstructions(DEFAULT_MSG);\n    setActiveButton(null);\n    deselectSegment();\n}\n\n'
        + 'function paintSegment(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    if (status === 'reel') {\n"
        + "        seg.setAttribute({ strokeColor: '#e67e22', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + "    } else if (status === 'virtuel') {\n"
        + "        seg.setAttribute({ strokeColor: '#2980b9', dash: 2, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    } else {\n'
        + "        seg.setAttribute({ strokeColor: '#555555', dash: 0, strokeWidth: seg === selectedSegment ? 2.5 : 1.5 });\n"
        + '    }\n}\n\n'
        + 'function statusCode(seg) {\n'
        + "    var s = seg.__status || 'defaut';\n"
        + "    return s === 'reel' ? 1 : (s === 'virtuel' ? 2 : 0);\n}\n\n"
        + 'function statusFromCode(code) {\n'
        + "    return code === 1 ? 'reel' : (code === 2 ? 'virtuel' : 'defaut');\n}\n\n"
        + 'function deselectSegment() {\n'
        + '    var prev = selectedSegment;\n    selectedSegment = null;\n'
        + '    if (prev) { paintSegment(prev); }\n}\n\n'
        + 'function onSegmentClick(seg) {\n'
        + "    var status = seg.__status || 'defaut';\n"
        + "    seg.__status = (status === 'reel') ? 'virtuel' : 'reel';\n"
        + '    var prev = selectedSegment;\n    selectedSegment = seg;\n'
        + '    if (prev && prev !== seg) { paintSegment(prev); }\n'
        + '    paintSegment(seg);\n    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function deleteSelectedSegment() {\n'
        + '    if (!selectedSegment) { setInstructions("' + I18N_D.t('opt.jxg_msg_select_first') + '"); return; }\n'
        + '    var seg = selectedSegment;\n    selectedSegment = null;\n'
        + '    board.removeObject(seg);\n'
        + '    var idx = raySegments.indexOf(seg);\n    if (idx > -1) raySegments.splice(idx, 1);\n'
        + '    for (var i = 0; i < logicalRays.length; i++) {\n'
        + '        var lr = logicalRays[i];\n'
        + '        var sIdx = lr.segments.indexOf(seg);\n'
        + '        if (sIdx > -1) {\n            lr.segments.splice(sIdx, 1);\n'
        + '            if (lr.segments.length === 0) { logicalRays.splice(i, 1); }\n            break;\n        }\n    }\n'
        + '    setInstructions(DEFAULT_MSG);\n    syncState();\n}\n\n'
        + 'function activateTool(mode, msg) {\n'
        + '    if (toolMode === mode) { resetTool(); return; }\n'
        + '    resetTool(); toolMode = mode;\n'
        + "    board.defaultCursor = 'crosshair';\n"
        + '    setInstructions(msg);\n    setActiveButton(mode);\n}\n\n'
        + 'function syncState() {\n'
        + "    handlePoint.trigger(['update']);\n    board.update();\n}\n\n"
        + 'function snapToPoint(x, y) {\n'
        + '    var threshold = 0.6, closestX = x, closestY = y, minDist = Infinity;\n'
        + '    for (var id in board.objects) {\n'
        + '        var obj = board.objects[id];\n'
        + "        if (obj.elType === 'point' && obj.visProp.visible !== false && obj.visProp.hidden !== true) {\n"
        + '            var dx = obj.X() - x, dy = obj.Y() - y, dist = Math.sqrt(dx * dx + dy * dy);\n'
        + '            if (dist < threshold && dist < minDist) { minDist = dist; closestX = obj.X(); closestY = obj.Y(); }\n'
        + '        }\n    }\n    return { x: closestX, y: closestY };\n}\n\n'
        + 'function getClickedSegment(x, y, threshold, excludeSeg) {\n'
        + '    var closestSeg = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < raySegments.length; i++) {\n'
        + '        var seg = raySegments[i];\n'
        + '        if (seg === excludeSeg) continue;\n'
        + '        if (!seg.point1 || !seg.point2) continue;\n'
        + '        var x1 = seg.point1.X(), y1 = seg.point1.Y();\n'
        + '        var x2 = seg.point2.X(), y2 = seg.point2.Y();\n'
        + '        var dx = x2 - x1, dy = y2 - y1;\n'
        + '        var lengthSq = dx * dx + dy * dy;\n'
        + '        if (lengthSq === 0) continue;\n'
        + '        var t = ((x - x1) * dx + (y - y1) * dy) / lengthSq;\n'
        + '        t = Math.max(0, Math.min(1, t));\n'
        + '        var projX = x1 + t * dx, projY = y1 + t * dy;\n'
        + '        var dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));\n'
        + '        if (dist < threshold && dist < minDist) { minDist = dist; closestSeg = seg; }\n'
        + '    }\n    return closestSeg;\n}\n\n'
        + 'function getClickedPoint(x, y, threshold) {\n'
        + '    var closest = null, minDist = Infinity;\n'
        + '    for (var i = 0; i < standaloneElements.length; i++) {\n'
        + '        var el = standaloneElements[i];\n'
        + "        if (el.elType === 'point' && el.visProp.visible !== false) {\n"
        + '            var d2 = Math.hypot(el.X() - x, el.Y() - y);\n'
        + '            if (d2 < threshold && d2 < minDist) { minDist = d2; closest = el; }\n'
        + '        }\n    }\n    return closest;\n}\n\n'
        + 'function addCustomRayFromEq(m, p, isVert, xVert, xOrigin) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    if (isVert) {\n'
        + "        var pA = board.create('point', [xVert, Y_MIN], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var pB = board.create('point', [xVert, Y_MAX], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n'
        + '    } else {\n'
        + '        var boundsX = [X_MIN, X_MAX];\n'
        + "        if (typeof xOrigin === 'number') boundsX.push(xOrigin);\n"
        + '        boundsX.push(0, d);\n'
        + '        boundsX.sort(function(a, b){ return a - b; });\n'
        + '        for (var i = 0; i < boundsX.length - 1; i++) {\n'
        + '            var xa = boundsX[i], xb = boundsX[i + 1];\n'
        + '            if (xa === xb) continue;\n'
        + '            var ya = m * xa + p, yb = m * xb + p;\n'
        + "            var pA2 = board.create('point', [xa, ya], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var pB2 = board.create('point', [xb, yb], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            var seg2 = board.create('segment', [pA2, pB2], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '            raySegments.push(seg2); allDrawnElements.push(pA2, pB2, seg2);\n'
        + '            currentLogicalRay.segments.push(seg2); currentLogicalRay.points.push(pA2, pB2);\n        }\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addRayFromPieces(m, p, isVert, xVert, pieces) {\n'
        + '    var currentLogicalRay = { segments: [], points: [], eq: isVert ? { isVert: true, x: xVert } : { isVert: false, m: m, p: p } };\n'
        + '    for (var i = 0; i < pieces.length; i++) {\n'
        + '        var piece = pieces[i];\n        var pA, pB;\n'
        + '        if (isVert) {\n'
        + "            pA = board.create('point', [xVert, piece[0]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [xVert, piece[1]], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        } else {\n'
        + "            pA = board.create('point', [piece[0], m * piece[0] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + "            pB = board.create('point', [piece[1], m * piece[1] + p], { visible: false, fixed: true, highlight: false, name: '', tabindex: null });\n"
        + '        }\n'
        + "        var seg = board.create('segment', [pA, pB], { strokeColor: '#555555', strokeWidth: 1.5, fixed: true, highlight: false, dash: 0, tabindex: null });\n"
        + '        seg.__status = statusFromCode(piece[2]);\n        paintSegment(seg);\n'
        + '        raySegments.push(seg); allDrawnElements.push(pA, pB, seg);\n'
        + '        currentLogicalRay.segments.push(seg); currentLogicalRay.points.push(pA, pB);\n    }\n'
        + '    logicalRays.push(currentLogicalRay);\n    return currentLogicalRay;\n}\n\n'
        + 'function addCustomRay(x1, y1, x2, y2) {\n'
        + '    var dx = x2 - x1, dy = y2 - y1;\n'
        + '    var m = (Math.abs(dx) < 0.01) ? Infinity : dy / dx;\n'
        + '    if (m === Infinity) {\n        addCustomRayFromEq(null, null, true, x1);\n    } else {\n'
        + '        var p = y1 - m * x1;\n        addCustomRayFromEq(m, p, false, null, x1);\n    }\n'
        + '    syncState();\n}\n\n'
        + 'function onPointClick(pt) {\n'
        + '    board.removeObject(pt);\n'
        + '    allDrawnElements = allDrawnElements.filter(function(el){ return el !== pt; });\n'
        + '    standaloneElements = standaloneElements.filter(function(el){ return el !== pt; });\n'
        + '    syncState();\n}\n\n'
        + "board.on('down', function(evt) {\n"
        + "    if (evt.target && evt.target.closest && evt.target.closest('.JXG_navigation_button')) return;\n"
        + '    if (evt.shiftKey) return;\n'
        + '    var coords = board.getUsrCoordsOfMouse(evt);\n'
        + '    var x = coords[0], y = coords[1];\n\n'
        + "    if (toolMode !== '') {\n"
        + '        var snapped = snapToPoint(x, y); x = snapped.x; y = snapped.y;\n\n'
        + "        if (toolMode === 'pt1') { tempPoint = { x: x, y: y }; toolMode = 'pt2'; setInstructions('" + I18N_D.t('opt.jxg_msg_rayon_2') + "'); }\n"
        + "        else if (toolMode === 'pt2') { addCustomRay(tempPoint.x, tempPoint.y, x, y); resetTool(); }\n"
        + "        else if (toolMode === 'axp1') { addCustomRay(x, y, x + 1, y); resetTool(); }\n"
        + "        else if (toolMode === 'par1') { dirPoint1 = { x: x, y: y }; toolMode = 'par2'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_2') + "'); }\n"
        + "        else if (toolMode === 'par2') { dirPoint2 = { x: x, y: y }; toolMode = 'par3'; setInstructions('" + I18N_D.t('opt.jxg_msg_par_3') + "'); }\n"
        + "        else if (toolMode === 'par3') {\n"
        + '            var dx = dirPoint2.x - dirPoint1.x, dy = dirPoint2.y - dirPoint1.y;\n'
        + '            addCustomRay(x, y, x + dx, y + dy);\n            resetTool();\n        }\n'
        + "        else if (toolMode === 'inter1') {\n"
        + '            interSeg1 = getClickedSegment(x, y, 0.4, null);\n'
        + "            if (interSeg1) { toolMode = 'inter2'; setInstructions(\"" + I18N_D.t('opt.jxg_msg_inter2_generic') + "\"); }\n"
        + '        }\n'
        + "        else if (toolMode === 'inter2') {\n"
        + '            var seg2 = getClickedSegment(x, y, 0.4, interSeg1);\n'
        + '            if (seg2) {\n'
        + '                var x1 = interSeg1.point1.X(), y1 = interSeg1.point1.Y(), x2 = interSeg1.point2.X(), y2 = interSeg1.point2.Y();\n'
        + '                var x3 = seg2.point1.X(), y3 = seg2.point1.Y(), x4 = seg2.point2.X(), y4 = seg2.point2.Y();\n'
        + '                var m1 = (x2 - x1) === 0 ? Infinity : (y2 - y1) / (x2 - x1);\n'
        + '                var m2 = (x4 - x3) === 0 ? Infinity : (y4 - y3) / (x4 - x3);\n'
        + '                if (m1 !== Infinity && m2 !== Infinity && Math.abs(m1 - m2) > 0.001) {\n'
        + '                    var p1 = y1 - m1 * x1, p2 = y3 - m2 * x3;\n'
        + '                    var xi = (p2 - p1) / (m1 - m2), yi = m1 * xi + p1;\n'
        + '                    var in1 = xi >= Math.min(x1, x2) - 0.5 && xi <= Math.max(x1, x2) + 0.5 && yi >= Math.min(y1, y2) - 0.5 && yi <= Math.max(y1, y2) + 0.5;\n'
        + '                    var in2 = xi >= Math.min(x3, x4) - 0.5 && xi <= Math.max(x3, x4) + 0.5 && yi >= Math.min(y3, y4) - 0.5 && yi <= Math.max(y3, y4) + 0.5;\n'
        + '                    if (in1 && in2) {\n'
        + '                        intersectionCounter++;\n'
        + "                        var name = (intersectionCounter === 1) ? 'B1' : ('I' + (intersectionCounter - 1));\n"
        + "                        var pInt = board.create('point', [xi, yi], { name: name, size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '                        allDrawnElements.push(pInt); standaloneElements.push(pInt);\n'
        + '                        syncState();\n'
        + '                    } else { setInstructions("' + I18N_D.t('opt.jxg_msg_lines_cross_outside') + '"); }\n'
        + '                } else { setInstructions("' + I18N_D.t('opt.jxg_msg_parallel_segments') + '"); }\n'
        + '                resetTool();\n            }\n        }\n        return;\n    }\n\n'
        + '    var clickedSeg = getClickedSegment(x, y, 0.3, null);\n'
        + '    if (clickedSeg) { onSegmentClick(clickedSeg); return; }\n'
        + '    var clickedPt = getClickedPoint(x, y, 0.5);\n'
        + '    if (clickedPt) { onPointClick(clickedPt); return; }\n});\n\n'
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon') + "', 'pt1', '" + I18N_D.t('opt.jxg_msg_rayon_1') + "');\n"
        + "addToolButton(\"" + I18N_D.t('opt.jxg_btn_par_axe') + "\", 'axp1', \"" + I18N_D.t('opt.jxg_msg_par_axe_noex') + "\");\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_rayon_parallele') + "', 'par1', '" + I18N_D.t('opt.jxg_msg_par_1') + "');\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_intersection_b1') + "', 'inter1', '" + I18N_D.t('opt.jxg_msg_inter1_generic') + "');\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_effacer_selection') + "', null, function(){ deleteSelectedSegment(); });\n"
        + "addToolButton('" + I18N_D.t('opt.jxg_btn_tout_effacer') + "', null, function(){\n"
        + '    selectedSegment = null;\n'
        + '    allDrawnElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    allDrawnElements = []; raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    resetTool();\n    syncState();\n});\n\n'
        + 'document.body.appendChild(toolbarDiv);\n'
        + 'document.body.appendChild(instructionsEl);\n'
        + 'stack_js.resize_containing_frame("' + dispW + 'px", document.documentElement.offsetHeight + "px");\n\n'
        + 'function rebuildAllDrawnElements() {\n'
        + '    var fromRays = [];\n'
        + '    logicalRays.forEach(function(lr){ fromRays = fromRays.concat(lr.points, lr.segments); });\n'
        + '    allDrawnElements = fromRays.concat(standaloneElements);\n}\n\n'
        + 'var serialiser = function() {\n'
        + '    var rayList = logicalRays.map(function(lr) {\n'
        + '        var pieces = lr.segments.map(function(seg) {\n'
        + '            var ends = lr.eq.isVert ? [seg.point1.Y(), seg.point2.Y()] : [seg.point1.X(), seg.point2.X()];\n'
        + '            return [ends[0], ends[1], statusCode(seg)];\n        });\n'
        + "        return lr.eq.isVert ? ['vert', lr.eq.x, pieces] : [lr.eq.m, lr.eq.p, pieces];\n    });\n"
        + '    var ptList = standaloneElements\n'
        + "        .filter(function(el){ return el.elType === 'point' && el.name; })\n"
        + '        .map(function(el){ return [el.name, el.X(), el.Y()]; });\n'
        + '    return "microscope_construction(" + JSON.stringify(rayList) + "," + JSON.stringify(ptList) + ")";\n};\n\n'
        + 'function clearAll() {\n'
        + '    logicalRays.forEach(function(lr) {\n'
        + '        lr.points.forEach(function(el){ board.removeObject(el); });\n'
        + '        lr.segments.forEach(function(el){ board.removeObject(el); });\n    });\n'
        + '    standaloneElements.forEach(function(el){ board.removeObject(el); });\n'
        + '    raySegments = []; logicalRays = []; standaloneElements = []; intersectionCounter = 0;\n'
        + '    rebuildAllDrawnElements();\n}\n\n'
        + 'var deserialiser = function(value) {\n'
        + '    clearAll();\n'
        + "    var newState = JSON.parse(value.replace('microscope_construction(', '[').replace(/\\)\\s*$/, ']'));\n"
        + '    var rayList = newState[0], ptList = newState[1];\n'
        + '    for (var i = 0; i < rayList.length; i++) {\n'
        + '        var eq = rayList[i];\n'
        + "        if (eq[0] === 'vert') addRayFromPieces(null, null, true, eq[1], eq[2] || [[Y_MIN, Y_MAX, 0]]);\n"
        + '        else addRayFromPieces(eq[0], eq[1], false, null, eq[2] || [[X_MIN, X_MAX, 0]]);\n    }\n'
        + '    for (var j = 0; j < ptList.length; j++) {\n'
        + '        var pp = ptList[j];\n'
        + "        var pt = board.create('point', [pp[1], pp[2]], { name: pp[0], size: 4, color: 'black', fixed: true, highlight: false, tabindex: null });\n"
        + '        allDrawnElements.push(pt);\n        standaloneElements.push(pt);\n    }\n'
        + '    board.update();\n};\n\n'
        + 'resetTool();\n'
        + 'stack_jxg.custom_bind(state, serialiser, deserialiser, [handlePoint]);\n'
        + 'board.update();\n\n'
        + 'var inputEl = document.getElementById(state);\n'
        + 'function freezeIfReadonly() {\n'
        + "    var ro = inputEl && (inputEl.hasAttribute('readonly') || inputEl.hasAttribute('disabled'));\n"
        + '    if (ro) {\n'
        + "        board.containerObj.style.pointerEvents = 'none';\n"
        + "        toolbarDiv.querySelectorAll('button').forEach(function(b){ b.disabled = true; });\n"
        + '        setInstructions("' + I18N_D.t('opt.jxg_msg_construction_validee') + '");\n'
        + '        return true;\n    }\n    return false;\n}\n'
        + 'if (!freezeIfReadonly()) {\n'
        + "    if (inputEl) new MutationObserver(freezeIfReadonly).observe(inputEl, { attributes: true, attributeFilter: ['readonly', 'disabled'] });\n"
        + '}\n'
        + '})();';
}

/* ── Microscope — objectif + oculaire, réglage pour un œil normal ──
   L'objectif L1 (f'1, petite focale) forme, d'un objet réel fini AB placé
   au-delà de son foyer objet F1, une image réelle intermédiaire A1B1 (par
   les 3 rayons remarquables habituels). L'oculaire L2 (f'2) est placé de
   sorte que A1B1 soit exactement dans son plan focal objet F2 (réglage
   pour un œil normal, système final afocal) : deux rayons issus de A1B1
   ressortent alors parallèles entre eux, l'image finale étant à l'infini.
   Un seul point à construire (B1, intersection de deux des trois rayons
   de l'objectif) ; comme pour la lunette, le faisceau émergent de
   l'oculaire ne requiert aucun second point. */
function _genOptiqueMicroscopeConstructionParams() {
    var bareme = parseFloat(v('opt-bareme'))     || 1;
    var text   = richVal('opt-text');
    var f1     = parseFloat(v('opt-mic-f1'))     || 1;
    var f2     = parseFloat(v('opt-mic-f2'))     || 4;
    var oaIn   = parseFloat(v('opt-mic-oa'))     || -1.25;
    var AB     = parseFloat(v('opt-mic-ab'))     || 0.08;
    var dispW  = parseInt(v('opt-w')) || 700;
    var dispH  = parseInt(v('opt-h')) || 380;
    var fbGenRaw = v('opt-fbgen');
    return {
        bareme: bareme, text: text, f1: f1, f2: f2, oaIn: oaIn, AB: AB,
        dispW: dispW, dispH: dispH, fbGenRaw: fbGenRaw
    };
}

function _genOptiqueMicroscopeConstruction(X) {
    return _genOptiqueMicroscopeConstructionCore(X, _genOptiqueMicroscopeConstructionParams());
}

function _genOptiqueMicroscopeConstructionCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var bareme = p.bareme, text = p.text, f1 = p.f1, f2 = p.f2, oaIn = p.oaIn, AB = p.AB,
        dispW = p.dispW, dispH = p.dispH;

    if (f1 <= 0) throw new Error(I18N_D.t('opt.err_f1_positive'));
    if (f2 <= 0) throw new Error(I18N_D.t('opt.err_f2_positive'));
    if (oaIn >= 0) throw new Error(I18N_D.t('opt.err_oa_negative'));
    if (Math.abs(oaIn) <= f1) throw new Error(I18N_D.t('opt.err_oa_lt_f1_microscope'));

    function _n(val) { var r = Math.round(val * 1e2) / 1e2; return r === 0 ? 0 : r; }
    function _n1(val) { var r = Math.round(val * 1e1) / 1e1; return r === 0 ? 0 : r; }

    var xA  = oaIn;
    var xA1 = f1 * xA / (xA + f1);
    var gam = xA1 / xA;
    var ABp = gam * AB;
    var d   = xA1 + f2;

    /* Rayons remarquables — objectif (image réelle, mêmes formules que
       _genOptiqueLentilleRayons, branche réelle uniquement) */
    var xF1 = -f1, xF1p = f1;
    var m1e = -AB / xF1p, p1e = AB;
    var m2  = AB / xA,    p2  = 0;
    var m3i = AB / (xA - xF1), p3i = -m3i * xF1;
    var m3e = 0, p3e = p3i;

    /* Rayons remarquables — oculaire (A1B1 exactement au foyer objet F2,
       mêmes formules que la partie oculaire de _genOptiqueLunetteConstruction,
       avec ABp/d à la place de yB1/d) */
    var mC  = -ABp / f2, pC = -mC * d;
    var mDi = 0, pDi = ABp;
    var mDe = -ABp / f2, pDe = ABp - mDe * d;

    var halfX1 = Math.max(Math.abs(xA), Math.abs(xA1), 2 * f1) + 3;
    var xminG  = _n1(-halfX1);
    var xmaxG  = _n1(d + f2 * 1.3 + 3);
    var lens1H = _n1(Math.max(Math.abs(AB), Math.abs(ABp)) * 1.4 + 1.2);
    var lens2H = _n1(lens1H * 0.75);
    var yAmp   = Math.max(lens1H + 1, Math.abs(ABp) + 1.5, (xmaxG - xminG) / 5);
    var X_MIN  = _n1(xminG - 2), X_MAX = _n1(xmaxG + 2);
    var Y_MIN  = _n1(-yAmp), Y_MAX = _n1(yAmp);
    var xtol   = Math.max(0.05 * f1, 0.05);

    /* ── Construction correcte de référence (pour <tans>) ── */
    var tansRayList = '[[0,' + _n(AB) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m1e) + ',' + _n(p1e) + ',[[0,' + _n(xA1) + ',1]]],'
        + '[' + _n(m2) + ',' + _n(p2) + ',[[' + _n(xA) + ',' + _n(xA1) + ',1]]],'
        + '[' + _n(m3i) + ',' + _n(p3i) + ',[[' + _n(xA) + ',0,1]]],'
        + '[' + _n(m3e) + ',' + _n(p3e) + ',[[0,' + _n(xA1) + ',1]]],'
        + '[' + _n(mC) + ',' + _n(pC) + ',[[' + _n(xA1) + ',' + _n(xmaxG) + ',1]]],'
        + '[' + _n(mDi) + ',' + _n(pDi) + ',[[' + _n(xA1) + ',' + _n(d) + ',1]]],'
        + '[' + _n(mDe) + ',' + _n(pDe) + ',[[' + _n(d) + ',' + _n(xmaxG) + ',1]]]'
        + ']';
    var tansPtList = '[["B1",' + _n(xA1) + ',' + _n(ABp) + ']]';
    var tans = 'microscope_construction(' + tansRayList + ',' + tansPtList + ')';

    var jxg = _microscopeConstructionJXG(X, {
        f1: f1, f2: f2, d: _n1(d), xA: xA, AB: AB,
        X_MIN: X_MIN, X_MAX: X_MAX, Y_MIN: Y_MIN, Y_MAX: Y_MAX,
        lens1H: lens1H, lens2H: lens2H, dispW: dispW
    }, I18N_D);

    /* ── Maxima : constantes + bibliothèque d'aide + validateur ── */
    var vars = 'f1: ' + _n(f1) + '$\n'
        + 'f2: ' + _n(f2) + '$\n'
        + 'xA: ' + _n(xA) + '$\n'
        + 'AB: ' + _n(AB) + '$\n'
        + 'xF1: -f1$\n' + 'xF1p: f1$\n'
        + 'xA1: f1*xA/(xA+f1)$\n'
        + 'gam: xA1/xA$\n'
        + 'ABp: gam*AB$\n'
        + 'd: xA1+f2$\n\n'
        + 'm1e: -AB/xF1p$\n' + 'p1e: AB$\n'
        + 'm2: AB/xA$\n' + 'p2: 0$\n'
        + 'm3i: AB/(xA-xF1)$\n' + 'p3i: -m3i*xF1$\n'
        + 'm3e: 0$\n' + 'p3e: p3i$\n\n'
        + 'mC: -ABp/f2$\n' + 'pC: -mC*d$\n'
        + 'mDi: 0$\n' + 'pDi: ABp$\n'
        + 'mDe: -ABp/f2$\n' + 'pDe: ABp-mDe*d$\n\n'
        + 'xmin: ' + xminG + '$\n'
        + 'xmax: ' + xmaxG + '$\n'
        + 'xtol: ' + xtol + '$\n\n'
        + _opticsConstructionMaximaHelpers()
        + '\nrequire_mc(mc) := block(\n'
        + '  if not is(safe_op(mc) = "microscope_construction") or not is(length(mc) = 2) then\n'
        + '    "' + I18N_D.t('opt.err_require_mc', { fn: 'microscope_construction' }) + '"\n'
        + '  else\n'
        + '    true\n'
        + ')$\n\n'
        + 'ans' + X + '_validator(ex) := stack_seq_validator(ex, [require_mc])$';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans><![CDATA[' + tans + ']]></tans>\n'
        + '      <boxsize>60</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords>microscope_construction</allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>1</mustverify><showvalidation>2</showvalidation>'
        + '<options>validator:ans' + X + '_validator</options>\n    </input>';

    /* ── PRT : rayons objectif (3, → point B1) + rayons oculaire (2, faisceau émergent) ── */
    var fbVars = '[rayList, ptList]: args(ans' + X + ')$\n\n'
        + 'att1: is(found_ray(rayList, m1e, p1e, 0.05, 0.3))$\n'
        + 'att2: is(found_ray(rayList, m2, p2, 0.05, 0.3))$\n'
        + 'att3: is(found_ray(rayList, m3i, p3i, 0.05, 0.3) or found_ray(rayList, m3e, p3e, 0.05, 0.3))$\n'
        + 'att4: is(found_ray(rayList, mC, pC, 0.05, 0.3))$\n'
        + 'att5: is(found_ray(rayList, mDi, pDi, 0.05, 0.3) or found_ray(rayList, mDe, pDe, 0.05, 0.3))$\n'
        + 'any_attempt: is(att1 or att2 or att3 or att4 or att5)$\n\n'
        + 'l1_ok: is(seg_required_status(rayList, m1e, p1e, 0.05, 0.3, 0, xA1, xtol, 1))$\n'
        + 'l2_ok: is(seg_required_status(rayList, m2, p2, 0.05, 0.3, xA, xA1, xtol, 1))$\n'
        + 'l3a_ok: is(seg_required_status(rayList, m3i, p3i, 0.05, 0.3, xA, 0, xtol, 1))$\n'
        + 'l3b_ok: is(seg_required_status(rayList, m3e, p3e, 0.05, 0.3, 0, xA1, xtol, 1))$\n'
        + 'l3_ok: is(l3a_ok and l3b_ok)$\n'
        + 'l4_ok: is(seg_required_status(rayList, mC, pC, 0.05, 0.3, xA1, xmax, xtol, 1))$\n'
        + 'l5a_ok: is(seg_required_status(rayList, mDi, pDi, 0.05, 0.3, xA1, d, xtol, 1))$\n'
        + 'l5b_ok: is(seg_required_status(rayList, mDe, pDe, 0.05, 0.3, d, xmax, xtol, 1))$\n'
        + 'l5_ok: is(l5a_ok and l5b_ok)$\n\n'
        + 'GEOM_WEIGHT: 0.7$\n\n'
        + 'l1_geom: att1$\n'
        + 'l2_geom: att2$\n'
        + 'l3_geom: att3$\n'
        + 'l4_geom: att4$\n'
        + 'l5_geom: att5$\n\n'
        + 'line_score(full_ok, geom_ok) := if full_ok then 1 else (if geom_ok then GEOM_WEIGHT else 0)$\n\n'
        + 'l1_score: line_score(l1_ok, l1_geom)$\n'
        + 'l2_score: line_score(l2_ok, l2_geom)$\n'
        + 'l3_score: line_score(l3_ok, l3_geom)$\n'
        + 'l4_score: line_score(l4_ok, l4_geom)$\n'
        + 'l5_score: line_score(l5_ok, l5_geom)$\n\n'
        + 'nb_bonnes: l1_score + l2_score + l3_score + l4_score + l5_score$\n\n'
        + 'nb_attempts: length(sublist(rayList, lambda([r], not stringp(r[1]))))$\n'
        + 'nb_total: max(nb_attempts, 2)$\n'
        + 'score_rayons: min(nb_bonnes / nb_total, 1)$\n\n'
        + 'nb_full_ok: (if l1_ok then 1 else 0) + (if l2_ok then 1 else 0) + (if l3_ok then 1 else 0)$\n'
        + 'have2: is(nb_full_ok >= 2)$\n\n'
        + 'c_point: is(found_point(ptList, xA1, ABp, ' + xtol + '))$';

    var fbBilan = I18N_D.t('opt.mic_fb_bilan');

    var canonicalNodes = [
        {
            name: '0', description: I18N_D.t('opt.mic_desc_rayons'), answertest: 'AlgEquiv',
            sans: 'true', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: 'score_rayons*5/6', truepenalty: '', truenextnode: '1',
            trueanswernote: 'prt' + X + '-0-T', truefeedback: fbBilan,
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'prt' + X + '-0-F', falsefeedback: '<p></p>'
        },
        {
            name: '1', description: I18N_D.t('opt.mic_desc_point_b1'), answertest: 'AlgEquiv',
            sans: 'c_point', tans: 'true', testoptions: '', quiet: '1',
            truescoremode: '+', truescore: '1/6', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'prt' + X + '-1-T',
            truefeedback: I18N_D.t('opt.mic_fb_point_true'),
            falsescoremode: '+', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'prt' + X + '-1-F',
            falsefeedback: I18N_D.t('opt.mic_fb_point_false')
        }
    ];
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D('true', n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML  = buildPrtXml_D(prtMeta, xmlNodes);

    var genFbDefault = I18N_D.t('opt.mic_genfb', { f1: _n(f1), gam: _n(gam), f2: _n(f2) });

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + I18N_D.t('opt.data_label')
        + I18N_D.t('opt.mic_data_content', { f1: _n(f1), f2: _n(f2), xa: _n(xA), ab: _n(AB) }) + '</p>\n';

    var instructions = '<div class="stack-comment">'
        + '<h2>' + I18N_D.t('opt.mic_instr_h2') + '</h2>'
        + I18N_D.t('opt.mic_instr_intro', { f1: _n(f1), ab: _n(AB), xa: _n(xA), f2: _n(f2) })
        + I18N_D.t('opt.mic_instr_rays')
        + I18N_D.t('opt.tel_instr_click') + '</div>';

    var textFrag = '<div style="background:#9333ea;border-left:5px solid #6b21a8;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — ' + I18N_D.t('opt.title_microscope') + '</strong>'
        + '<span style="background:#6b21a8;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + instructions + '<!-- ENONCE-END -->\n'
        + dataRow
        + '<!--HS-KBD:' + X + '-->';

    var kbdBlock = '[[jsxgraph input-ref-ans' + X + '="state" width="' + dispW + 'px" aspect-ratio="' + (dispW / dispH).toFixed(3) + '"]]\n'
        + jxg + '\n[[/jsxgraph]]\n\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           'Optique-Microscope Q' + X + ' f1=' + f1 + ' f2=' + f2 + ' oa=' + oaIn,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFbDefault, p.fbGenRaw)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    genRvbCmj: genRvbCmj, genRvbCmjCore: genRvbCmjCore, genRvbCmjParams: genRvbCmjParams,
    genOptique: genOptique, genOptiqueCore: genOptiqueCore, genOptiqueParams: genOptiqueParams,
    _genOptiqueLentilleImage: _genOptiqueLentilleImage, _genOptiqueLentilleImageCore: _genOptiqueLentilleImageCore,
    _genOptiqueLentilleRayons: _genOptiqueLentilleRayons, _genOptiqueLentilleRayonsCore: _genOptiqueLentilleRayonsCore, _genOptiqueLentilleRayonsParams: _genOptiqueLentilleRayonsParams,
    _genOptiqueLentilleDivergente: _genOptiqueLentilleDivergente, _genOptiqueLentilleDivergenteCore: _genOptiqueLentilleDivergenteCore, _genOptiqueLentilleDivergenteParams: _genOptiqueLentilleDivergenteParams,
    _genOptiqueMiroirCore: _genOptiqueMiroirCore, _genOptiqueMiroirCoreImpl: _genOptiqueMiroirCoreImpl, _genOptiqueMiroirParams: _genOptiqueMiroirParams,
    _genOptiqueMiroirConcave: _genOptiqueMiroirConcave, _genOptiqueMiroirConvexe: _genOptiqueMiroirConvexe,
    _genOptiqueLunetteConstruction: _genOptiqueLunetteConstruction, _genOptiqueLunetteConstructionCore: _genOptiqueLunetteConstructionCore, _genOptiqueLunetteConstructionParams: _genOptiqueLunetteConstructionParams,
    _genOptiqueMiroirPlan: _genOptiqueMiroirPlan, _genOptiqueMiroirPlanCore: _genOptiqueMiroirPlanCore, _genOptiqueMiroirPlanParams: _genOptiqueMiroirPlanParams,
    _genOptiqueMiroirSpherique: _genOptiqueMiroirSpherique, _genOptiqueMiroirSpheriqueCore: _genOptiqueMiroirSpheriqueCore,
    _genOptiqueTelescopeConstruction: _genOptiqueTelescopeConstruction, _genOptiqueTelescopeConstructionCore: _genOptiqueTelescopeConstructionCore, _genOptiqueTelescopeConstructionParams: _genOptiqueTelescopeConstructionParams,
    _genOptiqueMicroscopeConstruction: _genOptiqueMicroscopeConstruction, _genOptiqueMicroscopeConstructionCore: _genOptiqueMicroscopeConstructionCore, _genOptiqueMicroscopeConstructionParams: _genOptiqueMicroscopeConstructionParams
  };
}
