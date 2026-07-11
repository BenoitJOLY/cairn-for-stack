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

function genRvbCmj(X) {
    var bareme  = parseFloat(v('rvb-bareme')) || 1;
    var text    = richVal('rvb-text');
    var imgData = v('rvb-imgdata');
    var modeEl  = document.querySelector('input[name="rvb-mode"]:checked');
    var mode    = modeEl ? modeEl.value : 'rvb';
    var nb      = document.getElementById('rvb-nb').checked;
    var answer  = parseInt(v('rvb-answer')) || 0;
    var fbOkTxt = v('rvb-fb-ok').trim();
    var fbWrTxt = v('rvb-fb-wrong').trim();

    if (!imgData)  throw new Error(I18N.t('rvb.err_img'));
    if (!answer)   throw new Error(I18N.t('rvb.err_answer'));

    var colorChoices = [[1,'Rouge'],[2,'Vert'],[3,'Bleu'],[4,'Jaune'],[5,'Cyan'],[6,'Magenta'],[7,'Blanc'],[8,'Noir']];
    var colorEntry   = colorChoices.filter(function(c){return c[0]===answer;})[0] || [0,'?'];
    var colorName    = colorEntry[1];
    var colorKey     = colorName.toLowerCase();

    var filterLabels, modeLabel;
    if (mode === 'cmj') {
        filterLabels = ['Filtre Cyan','Filtre Magenta','Filtre Jaune'];
        modeLabel    = 'Filtres CMJN';
    } else {
        filterLabels = ['Filtre Rouge','Filtre Vert','Filtre Bleu'];
        modeLabel    = 'Filtres RVB';
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
            "<div style='background:#dcfce7;color:#166534;padding:8px 12px;border-radius:6px;" +
            "border-left:4px solid #16a34a;'><strong>Correct !</strong> L'objet est bien " + colorKey + "." + okTxtHtml + "</div>"
        ) + '"$\n'
        + 'fb_comp_' + X + ': "' + _rvbMx(
            "<div style='background:#fef2f2;color:#991b1b;padding:8px 12px;border-radius:6px;" +
            "border-left:4px solid #dc2626;'><strong>Piège complémentaire.</strong> " + errComp +
            " est la couleur complémentaire de " + colorKey + "." + wrTxtHtml + "</div>"
        ) + '"$\n'
        + 'fb_part1_' + X + ': "' + _rvbMx(
            "<div style='background:#fef2f2;color:#991b1b;padding:8px 12px;border-radius:6px;" +
            "border-left:4px solid #dc2626;'><strong>Piège partiel.</strong> " + errPartiel1 +
            " et " + colorKey + " partagent une composante." + wrTxtHtml + "</div>"
        ) + '"$\n'
        + 'fb_part2_' + X + ': "' + _rvbMx(
            "<div style='background:#fef2f2;color:#991b1b;padding:8px 12px;border-radius:6px;" +
            "border-left:4px solid #dc2626;'><strong>Piège partiel.</strong> " + errPartiel2 +
            " et " + colorKey + " partagent une composante." + wrTxtHtml + "</div>"
        ) + '"$\n'
        + 'fb_finale_' + X + ': "' + _rvbMx(
            "<div style='background:#f8fafc;color:#475569;padding:8px 12px;border-radius:6px;" +
            "border-left:4px solid #94a3b8;'><strong>Incorrect.</strong> Observez à travers quels filtres l'objet est clair." + wrTxtHtml + "</div>"
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
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

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
        + '    if (!base64Data) { stack_js.display_error("Image introuvable."); return; }\n\n'
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
    var genFbDefault = '<p>Voici l\'image originale sans filtre pour vérifier&nbsp;:</p>'
        + '<p><img src="' + imgData + '" alt="scène originale" style="max-width:600px;border-radius:6px;"></p>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           modeLabel + ' Q' + X + ' → ' + colorName,
        textFrag:        textFrag,
        kbdRaw:          kbdBlock,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen(genFbDefault, v('rvb-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ══════════════════════════════════════════════════════
   OPTIQUE — 3 scénarios JSXGraph interactifs
   ══════════════════════════════════════════════════════ */
function genOptique(X) {
    var scenario = v('opt-scenario') || 'lentille-image';
    if (scenario === 'lentille-image')    return _genOptiqueLentilleImage(X);
    if (scenario === 'lentille-rayons')   return _genOptiqueLentilleRayons(X);
    if (scenario === 'lunette')           return _genOptiqueLunette(X);
    if (scenario === 'miroir-plan')       return _genOptiqueMiroirPlan(X);
    if (scenario === 'miroir-spherique')  return _genOptiqueMiroirSpherique(X);
    if (scenario === 'telescope')         return _genOptiqueTelescope(X);
    throw new Error('Scénario optique inconnu : ' + scenario);
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

    /* ── Validation des paramètres ── */
    if (f <= 0)
        throw new Error('La distance focale f\' doit être positive (lentille convergente).');
    if (OA >= 0)
        throw new Error('La position OA doit être négative (objet réel, avant la lentille).');
    if (Math.abs(OA + f) < 0.01)
        throw new Error('OA = −f\' : l\'objet est au foyer → image à l\'infini (non représentable).');

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
    var fbOk = wrapFb(
        '<p>✅ <strong>Bonne position !</strong>'
        + (fbOkTxt ? ' ' + htmlEsc(fbOkTxt) : '')
        + '</p><p style="font-size:.88em;">'
        + 'OA\'&nbsp;≈&nbsp;{@round(opt_x_' + X + '*100)/100@}&nbsp;cm'
        + ' (attendu&nbsp;: ' + OAp.toFixed(2) + '&nbsp;cm) —&nbsp;'
        + 'A\'B\'&nbsp;≈&nbsp;{@round(opt_y_' + X + '*100)/100@}&nbsp;cm'
        + ' (attendu&nbsp;: ' + ABp.toFixed(2) + '&nbsp;cm)'
        + '</p>',
        true
    );
    var fbWrong = wrapFb(
        '<p>❌ <strong>Position incorrecte.</strong>'
        + (fbWrTxt ? ' ' + htmlEsc(fbWrTxt) : '')
        + '</p><p style="font-size:.88em;">'
        + 'Vous avez placé B\' en ({@round(opt_x_' + X + '*100)/100@}&nbsp;cm&nbsp;;&nbsp;'
        + '{@round(opt_y_' + X + '*100)/100@}&nbsp;cm). '
        + 'Utilisez&nbsp;: 1/OA\' − 1/OA = 1/f\' puis γ = OA\'/OA.'
        + '</p>',
        false
    );

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
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    /* ── Encart données affiché à l'élève ── */
    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données&nbsp;:</strong>&nbsp;'
        + 'f\'&nbsp;=&nbsp;' + f + '&nbsp;cm,&nbsp;'
        + 'OA&nbsp;=&nbsp;' + OA + '&nbsp;cm,&nbsp;'
        + 'AB&nbsp;=&nbsp;' + AB + '&nbsp;cm</p>\n';

    /* ── Fragment de question ── */
    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique&nbsp;: Lentille convergente</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxgCode + '\n'
        + '[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '💡 Faites glisser le point <strong style="color:#dc2626;">B\'</strong>'
        + ' pour positionner l\'image A\'B\' (A\' suit automatiquement sur l\'axe).</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique Q' + X + ' f\'=' + f + ' OA=' + OA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 2 : Tracer les 3 rayons remarquables ── */
function _genOptiqueLentilleRayons(X) {
    var bareme  = parseFloat(v('opt-bareme'))  || 1;
    var text    = richVal('opt-text');
    var f       = parseFloat(v('opt-f'))       || 20;
    var OA      = parseFloat(v('opt-oa'))      || -30;
    var AB      = parseFloat(v('opt-ab'))      || 2;
    var tol     = parseFloat(v('opt-tol-ray')) || 1.5;
    var dispW   = parseInt(v('opt-w'))          || 700;
    var dispH   = parseInt(v('opt-h'))          || 380;
    var fbOkTxt = v('opt-fb-ok').trim();
    var fbWrTxt = v('opt-fb-wrong').trim();

    if (f <= 0)
        throw new Error("La distance focale f' doit être positive (lentille convergente).");
    if (OA >= 0)
        throw new Error("La position OA doit être négative (objet réel, avant la lentille).");
    if (Math.abs(OA + f) < 0.01)
        throw new Error("OA = -f' : l'objet est au foyer — image à l'infini (non représentable).");

    var OAp   = f * OA / (OA + f);
    var gamma = OAp / OA;
    var ABp   = gamma * AB;
    var y3hit = AB * f / (OA + f);   // height where ray 3 hits the lens

    /* Bounding box */
    var allX  = [OA, -f, 0, f, OAp];
    var bxMin = Math.min.apply(null, allX) - 12;
    var bxMax = Math.max.apply(null, allX) + 12;
    var yAmp  = Math.max(Math.abs(AB), Math.abs(ABp), Math.abs(y3hit)) * 1.85 + 3;
    var lensH = (yAmp * 0.78).toFixed(3);
    var tickH = (yAmp * 0.07).toFixed(3);

    /* Initial (wrong) exit-ray endpoints */
    var ep1x = (f * 1.4).toFixed(3), ep1y = AB.toFixed(3);
    var ep2x = (f * 1.4).toFixed(3), ep2y = AB.toFixed(3);
    var ep3x = (f * 1.4).toFixed(3), ep3y = (0).toFixed(3);

    /* Correct answer reference points for tans */
    var tansA = '[' + OAp.toFixed(3)     + ',' + ABp.toFixed(3)   + ']';
    var tansB = '[' + (2 * f).toFixed(3) + ',' + (-AB).toFixed(3) + ']';
    var tansC = '[' + (2 * f).toFixed(3) + ',' + y3hit.toFixed(3) + ']';

    /* JSXGraph code */
    var jxg = '(function(){\n'
        + '/* Q' + X + ' — Optique : 3 rayons remarquables */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[' + bxMin.toFixed(2) + ',' + yAmp.toFixed(2) + ','
                            + bxMax.toFixed(2) + ',' + (-yAmp).toFixed(2) + '],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        + 'board.create("line",[[0,0],[1,0]],{strokeColor:"#374151",strokeWidth:1.5,'
        + 'straightFirst:true,straightLast:true,firstArrow:{type:1,size:4},lastArrow:{type:1,size:4},'
        + 'fixed:true,highlight:false});\n'
        + 'board.create("segment",[[0,-' + lensH + '],[0,' + lensH + ']],'
        + '{strokeColor:"#1d4ed8",strokeWidth:2.5,firstArrow:{type:1,size:8},lastArrow:{type:1,size:8},'
        + 'fixed:true,highlight:false});\n'
        + 'board.create("point",[0,0],{name:"O",fixed:true,size:2,'
        + 'strokeColor:"#374151",fillColor:"#374151",'
        + 'label:{offset:[4,-14],color:"#374151",fontSize:13}});\n'
        + 'board.create("segment",[[-' + f + ',-' + tickH + '],[-' + f + ',' + tickH + ']],'
        + '{strokeColor:"#1d4ed8",strokeWidth:1.5,fixed:true,highlight:false});\n'
        + 'board.create("point",[-' + f + ',0],{name:"F",fixed:true,size:3,'
        + 'strokeColor:"#1d4ed8",fillColor:"#1d4ed8",'
        + 'label:{offset:[4,-14],color:"#1d4ed8",fontSize:13}});\n'
        + 'board.create("segment",[[' + f + ',-' + tickH + '],[' + f + ',' + tickH + ']],'
        + '{strokeColor:"#1d4ed8",strokeWidth:1.5,fixed:true,highlight:false});\n'
        + 'board.create("point",[' + f + ',0],{name:"F\'",fixed:true,size:3,'
        + 'strokeColor:"#1d4ed8",fillColor:"#1d4ed8",'
        + 'label:{offset:[4,-14],color:"#1d4ed8",fontSize:13}});\n'
        + 'board.create("point",[' + OA + ',0],{name:"A",fixed:true,size:3,'
        + 'strokeColor:"#16a34a",fillColor:"#16a34a",'
        + 'label:{offset:[3,-14],color:"#16a34a",fontSize:13}});\n'
        + 'board.create("point",[' + OA + ',' + AB + '],{name:"B",fixed:true,size:3,'
        + 'strokeColor:"#16a34a",fillColor:"#16a34a",'
        + 'label:{offset:[6,4],color:"#16a34a",fontSize:13}});\n'
        + 'board.create("segment",[[' + OA + ',0],[' + OA + ',' + AB + ']],'
        + '{strokeColor:"#16a34a",strokeWidth:2.5,lastArrow:{type:1,size:6},'
        + 'fixed:true,highlight:false});\n'
        /* Ray 1 (blue): through O */
        + 'board.create("segment",[[' + OA + ',' + AB + '],[0,0]],'
        + '{strokeColor:"#2563eb",strokeWidth:2,lastArrow:{type:1,size:5},'
        + 'fixed:true,highlight:false});\n'
        + 'var Ep1=board.create("point",[' + ep1x + ',' + ep1y + '],{'
        + 'name:"",size:9,strokeColor:"#2563eb",fillColor:"#3b82f6",label:{visible:false}});\n'
        + 'board.create("segment",[[0,0],Ep1],'
        + '{strokeColor:"#2563eb",strokeWidth:2,lastArrow:{type:1,size:5},highlight:false});\n'
        /* Ray 2 (green): parallel to axis → F' */
        + 'board.create("segment",[[' + OA + ',' + AB + '],[0,' + AB + ']],'
        + '{strokeColor:"#16a34a",strokeWidth:2,lastArrow:{type:1,size:5},'
        + 'fixed:true,highlight:false});\n'
        + 'var Ep2=board.create("point",[' + ep2x + ',' + ep2y + '],{'
        + 'name:"",size:9,strokeColor:"#16a34a",fillColor:"#22c55e",label:{visible:false}});\n'
        + 'board.create("segment",[[0,' + AB + '],Ep2],'
        + '{strokeColor:"#16a34a",strokeWidth:2,lastArrow:{type:1,size:5},highlight:false});\n'
        /* Ray 3 (orange): toward F → exits parallel */
        + 'board.create("segment",[[' + OA + ',' + AB + '],[0,' + y3hit.toFixed(4) + ']],'
        + '{strokeColor:"#d97706",strokeWidth:2,lastArrow:{type:1,size:5},'
        + 'fixed:true,highlight:false});\n'
        + 'var Ep3=board.create("point",[' + ep3x + ',' + ep3y + '],{'
        + 'name:"",size:9,strokeColor:"#d97706",fillColor:"#f59e0b",label:{visible:false}});\n'
        + 'board.create("segment",[[0,' + y3hit.toFixed(4) + '],Ep3],'
        + '{strokeColor:"#d97706",strokeWidth:2,lastArrow:{type:1,size:5},highlight:false});\n'
        + 'stack_jxg.bind_point(board,ans' + X + 'a,Ep1);\n'
        + 'stack_jxg.bind_point(board,ans' + X + 'b,Ep2);\n'
        + 'stack_jxg.bind_point(board,ans' + X + 'c,Ep3);\n'
        + 'board.unsuspendUpdate();\n'
        + 'setTimeout(function(){board.update();},80);\n'
        + '})();';

    /* Maxima: perpendicular-distance check (squared, avoids sqrt) */
    var fbVars = 'opt_r1x_' + X + ': if listp(ans' + X + 'a) and length(ans' + X + 'a)=2 then float(ans' + X + 'a[1]) else 9999;\n'
        + 'opt_r1y_' + X + ': if listp(ans' + X + 'a) and length(ans' + X + 'a)=2 then float(ans' + X + 'a[2]) else 9999;\n'
        + 'opt_r2x_' + X + ': if listp(ans' + X + 'b) and length(ans' + X + 'b)=2 then float(ans' + X + 'b[1]) else 9999;\n'
        + 'opt_r2y_' + X + ': if listp(ans' + X + 'b) and length(ans' + X + 'b)=2 then float(ans' + X + 'b[2]) else 9999;\n'
        + 'opt_r3x_' + X + ': if listp(ans' + X + 'c) and length(ans' + X + 'c)=2 then float(ans' + X + 'c[1]) else 9999;\n'
        + 'opt_r3y_' + X + ': if listp(ans' + X + 'c) and length(ans' + X + 'c)=2 then float(ans' + X + 'c[2]) else 9999;\n'
        /* Ray 1: OA*y - AB*x = 0 */
        + 'opt_rk1_' + X + ': is(opt_r1x_' + X + '>0.5 and (('
        + OA + ')*opt_r1y_' + X + '-(' + AB + ')*opt_r1x_' + X + ')^2<='
        + tol + '^2*((' + OA + ')^2+(' + AB + ')^2));\n'
        /* Ray 2: AB*x + f*y = AB*f */
        + 'opt_rk2_' + X + ': is(opt_r2x_' + X + '>0.5 and (('
        + AB + ')*opt_r2x_' + X + '+(' + f + ')*opt_r2y_' + X + '-(' + AB + ')*(' + f + '))^2<='
        + tol + '^2*((' + AB + ')^2+(' + f + ')^2));\n'
        /* Ray 3: y = y3hit */
        + 'opt_rk3_' + X + ': is(opt_r3x_' + X + '>0.5 and (opt_r3y_' + X + '-('
        + y3hit.toFixed(4) + '))^2<=' + tol + '^2);\n'
        + 'opt_ok_' + X + ': is(opt_rk1_' + X + ' and opt_rk2_' + X + ' and opt_rk3_' + X + ');';

    var fbOk    = fbOkTxt || '<p>✅ Excellent ! Les 3 rayons sont correctement tracés.</p>';
    var fbWrong = fbWrTxt
        || '<p>❌ Au moins un rayon n\'est pas correct.</p><ul>'
        + '<li><span style="color:#2563eb;">●</span> Rayon 1 : non dévié, sort de O dans la même direction.</li>'
        + '<li><span style="color:#16a34a;">●</span> Rayon 2 : parallèle à l\'axe → sort en passant par F\'.</li>'
        + '<li><span style="color:#d97706;">●</span> Rayon 3 : dirigé vers F → sort parallèle à l\'axe.</li>'
        + '</ul>';

    var inputXML = ['a', 'b', 'c'].map(function (sfx, i) {
        return '    <input>\n'
            + '      <name>ans' + X + sfx + '</name>\n'
            + '      <type>algebraic</type>\n'
            + '      <tans>' + [tansA, tansB, tansC][i] + '</tans>\n'
            + '      <boxsize>15</boxsize><strictsyntax>1</strictsyntax>'
            + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
            + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
            + '<allowwords></allowwords><forbidfloat>0</forbidfloat>'
            + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
            + '<mustverify>0</mustverify><showvalidation>0</showvalidation>'
            + '<options></options>\n    </input>';
    }).join('\n');

    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'opt_ok_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données :</strong> f\'&nbsp;=&nbsp;' + f + '&nbsp;cm, '
        + 'OA&nbsp;=&nbsp;' + OA + '&nbsp;cm, AB&nbsp;=&nbsp;' + AB + '&nbsp;cm</p>\n';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique : Rayons remarquables</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '🔵 Rayon 1 (bleu) : rayon émergent passant par O. '
        + '🟢 Rayon 2 (vert) : rayon émergent passant par F\'. '
        + '🟠 Rayon 3 (orange) : rayon émergent parallèle à l\'axe.</p>\n'
        + '<div style="display:none">'
        + '[[input:ans' + X + 'a]][[validation:ans' + X + 'a]]'
        + '[[input:ans' + X + 'b]][[validation:ans' + X + 'b]]'
        + '[[input:ans' + X + 'c]][[validation:ans' + X + 'c]]'
        + '</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-Rayons Q' + X + " f'=" + f + ' OA=' + OA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 3 : Lunette astronomique afocale ── */
function _genOptiqueLunette(X) {
    var bareme  = parseFloat(v('opt-bareme'))   || 1;
    var text    = richVal('opt-text');
    var f1      = parseFloat(v('opt-f1'))       || 40;
    var f2      = parseFloat(v('opt-f2'))       || 10;
    var theta   = parseFloat(v('opt-theta'))    || 3;
    var beamH   = parseFloat(v('opt-beam-h'))   || 3;
    var tolB1x  = parseFloat(v('opt-tol-b1x')) || 1.5;
    var tolB1y  = parseFloat(v('opt-tol-b1y')) || 0.5;
    var dispW   = parseInt(v('opt-w'))           || 700;
    var dispH   = parseInt(v('opt-h'))           || 380;
    var fbOkTxt = v('opt-fb-ok').trim();
    var fbWrTxt = v('opt-fb-wrong').trim();

    if (f1 <= 0) throw new Error("La focale f'1 doit être positive.");
    if (f2 <= 0) throw new Error("La focale f'2 doit être positive.");
    if (theta <= 0) throw new Error("L'angle d'incidence θ doit être positif.");

    var tanT   = Math.tan(theta * Math.PI / 180);
    var d      = f1 + f2;          // afocal distance
    var yB1exp = -f1 * tanT;       // expected y-coordinate of B1

    /* Bounding box */
    var xLeft  = -(f1 * 0.55);
    var xRight = d + f2 * 0.8 + 5;
    var yAmp   = Math.max(Math.abs(yB1exp) + 3, beamH + 3, 5) * 1.55;
    var lens1H = (yAmp * 0.68).toFixed(3);
    var lens2H = (yAmp * 0.52).toFixed(3);
    var tickH  = (yAmp * 0.055).toFixed(3);

    var incY1  = (-xLeft * tanT).toFixed(4);
    var incY2  = (-xLeft * tanT + beamH).toFixed(4);
    var tansB1 = '[' + f1.toFixed(3) + ',' + yB1exp.toFixed(4) + ']';

    var jxg = '(function(){\n'
        + '/* Q' + X + ' — Optique : Lunette astronomique afocale */\n'
        + 'var board=JXG.JSXGraph.initBoard(divid,{\n'
        + '  boundingbox:[' + xLeft.toFixed(2) + ',' + yAmp.toFixed(2) + ','
                            + xRight.toFixed(2) + ',' + (-yAmp).toFixed(2) + '],\n'
        + '  axis:false,grid:false,showCopyright:false,\n'
        + '  showNavigation:false,pan:{enabled:false},zoom:{enabled:false}\n'
        + '});\n'
        + 'board.suspendUpdate();\n'
        /* optical axis */
        + 'board.create("line",[[0,0],[1,0]],{strokeColor:"#374151",strokeWidth:1.5,'
        + 'straightFirst:true,straightLast:true,firstArrow:{type:1,size:4},lastArrow:{type:1,size:4},'
        + 'fixed:true,highlight:false});\n'
        /* L1 (objective, blue) */
        + 'board.create("segment",[[0,-' + lens1H + '],[0,' + lens1H + ']],'
        + '{strokeColor:"#1d4ed8",strokeWidth:2.5,firstArrow:{type:1,size:8},lastArrow:{type:1,size:8},'
        + 'fixed:true,highlight:false});\n'
        + 'board.create("text",[0,' + (parseFloat(lens1H) + 1.4).toFixed(2)
        + ',"L₁"],{fixed:true,fontSize:15,fontWeight:"bold",color:"#1d4ed8",anchorX:"middle"});\n'
        /* L2 (eyepiece, purple) */
        + 'board.create("segment",[[' + d + ',-' + lens2H + '],[' + d + ',' + lens2H + ']],'
        + '{strokeColor:"#7c3aed",strokeWidth:2.5,firstArrow:{type:1,size:8},lastArrow:{type:1,size:8},'
        + 'fixed:true,highlight:false});\n'
        + 'board.create("text",[' + d + ',' + (parseFloat(lens2H) + 1.4).toFixed(2)
        + ',"L₂"],{fixed:true,fontSize:15,fontWeight:"bold",color:"#7c3aed",anchorX:"middle"});\n'
        /* F1 */
        + 'board.create("segment",[[-' + f1 + ',-' + tickH + '],[-' + f1 + ',' + tickH + ']],'
        + '{strokeColor:"#1d4ed8",strokeWidth:1.5,fixed:true,highlight:false});\n'
        + 'board.create("point",[-' + f1 + ',0],{name:"F₁",fixed:true,size:2,'
        + 'strokeColor:"#1d4ed8",fillColor:"#1d4ed8",label:{offset:[4,-14],color:"#1d4ed8",fontSize:12}});\n'
        /* F'1=F2 at x=f1 (shared focal plane) */
        + 'board.create("segment",[[' + f1 + ',-' + tickH + '],[' + f1 + ',' + tickH + ']],'
        + '{strokeColor:"#6d28d9",strokeWidth:1.5,dash:1,fixed:true,highlight:false});\n'
        + 'board.create("point",[' + f1 + ',0],{name:"F\'₁=F₂",fixed:true,size:2,'
        + 'strokeColor:"#6d28d9",fillColor:"#6d28d9",label:{offset:[4,-14],color:"#6d28d9",fontSize:11}});\n'
        /* F'2 */
        + 'board.create("segment",[[' + (d + f2) + ',-' + tickH + '],[' + (d + f2) + ',' + tickH + ']],'
        + '{strokeColor:"#7c3aed",strokeWidth:1.5,fixed:true,highlight:false});\n'
        + 'board.create("point",[' + (d + f2) + ',0],{name:"F\'₂",fixed:true,size:2,'
        + 'strokeColor:"#7c3aed",fillColor:"#7c3aed",label:{offset:[4,-14],color:"#7c3aed",fontSize:12}});\n'
        /* Incident rays (2 parallel at slope -tanT) */
        + 'board.create("segment",[[' + xLeft.toFixed(2) + ',' + incY1 + '],[0,0]],'
        + '{strokeColor:"#2563eb",strokeWidth:2,lastArrow:{type:1,size:5},fixed:true,highlight:false});\n'
        + 'board.create("segment",[[' + xLeft.toFixed(2) + ',' + incY2 + '],[0,' + beamH + ']],'
        + '{strokeColor:"#2563eb",strokeWidth:2,lastArrow:{type:1,size:5},fixed:true,highlight:false});\n'
        /* Draggable B1 */
        + 'var B1=board.create("point",[' + (f1 * 0.55).toFixed(3) + ',0],{'
        + 'name:"B₁",size:9,strokeColor:"#dc2626",fillColor:"#ef4444",'
        + 'label:{offset:[6,4],color:"#dc2626",fontSize:13,fontWeight:"bold"}});\n'
        /* A1: foot of B1 on axis */
        + 'board.create("point",[function(){return B1.X();},0],{'
        + 'name:"A₁",size:3,strokeColor:"#dc2626",fillColor:"#dc2626",'
        + 'label:{offset:[4,-14],color:"#dc2626",fontSize:12}});\n'
        /* Helper fixed points */
        + 'var _O1=board.create("point",[0,0],{visible:false,fixed:true});\n'
        + 'var _H1=board.create("point",[0,' + beamH + '],{visible:false,fixed:true});\n'
        + 'var _O2=board.create("point",[' + d + ',0],{visible:false,fixed:true});\n'
        + 'var _Fp2=board.create("point",[' + (d + f2) + ',0],{visible:false,fixed:true});\n'
        /* Rays from L1 converging to B1 */
        + 'board.create("segment",[_O1,B1],{strokeColor:"#93c5fd",strokeWidth:1.5,'
        + 'lastArrow:{type:1,size:3},highlight:false});\n'
        + 'board.create("segment",[_H1,B1],{strokeColor:"#93c5fd",strokeWidth:1.5,'
        + 'lastArrow:{type:1,size:3},highlight:false});\n'
        /* hitL2A: point on L2 same y as B1 */
        + 'var hitL2A=board.create("point",[' + d + ',function(){return B1.Y();}],{visible:false});\n'
        /* B1 → L2 horizontal segment */
        + 'board.create("segment",[B1,hitL2A],{strokeColor:"#7c3aed",strokeWidth:1.5,'
        + 'lastArrow:{type:1,size:3},highlight:false});\n'
        /* Exit ray A: hitL2A through F'2 (purple ray) */
        + 'board.create("line",[hitL2A,_Fp2],{straightFirst:false,straightLast:true,'
        + 'strokeColor:"#7c3aed",strokeWidth:2,lastArrow:{type:1,size:5},highlight:false});\n'
        /* Exit ray B: B1 through O2 (blue ray) */
        + 'board.create("line",[B1,_O2],{straightFirst:false,straightLast:true,'
        + 'strokeColor:"#2563eb",strokeWidth:2,lastArrow:{type:1,size:5},highlight:false});\n'
        + 'stack_jxg.bind_point(board,ans' + X + ',B1);\n'
        + 'board.unsuspendUpdate();\n'
        + 'setTimeout(function(){board.update();},80);\n'
        + '})();';

    /* Maxima feedback variables */
    var fbVars = 'opt_b1x_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then float(ans' + X + '[1]) else 9999;\n'
        + 'opt_b1y_' + X + ': if listp(ans' + X + ') and length(ans' + X + ')=2 then float(ans' + X + '[2]) else 9999;\n'
        + 'opt_ok_x_' + X + ': is(abs(opt_b1x_' + X + '-(' + f1.toFixed(4) + '))<=' + tolB1x + ');\n'
        + 'opt_ok_y_' + X + ': is(abs(opt_b1y_' + X + '-(' + yB1exp.toFixed(4) + '))<=' + tolB1y + ');\n'
        + 'opt_ok_' + X + ': is(opt_ok_x_' + X + ' and opt_ok_y_' + X + ');';

    var fbOk = fbOkTxt
        || '<p>✅ Correct ! B₁ est au foyer image F\'₁ de l\'objectif.</p>'
        + '<p>Position : x = f\'₁ = ' + f1 + ' cm, y ≈ ' + yB1exp.toFixed(2) + ' cm.</p>';
    var fbWrong = fbWrTxt
        || '<p>❌ La position de B₁ n\'est pas exacte.</p><ul>'
        + '<li>B₁ doit être dans le plan focal de l\'objectif : x = f\'₁ = <strong>' + f1 + ' cm</strong>.</li>'
        + '<li>Hauteur : y(B₁) = −f\'₁·tanθ ≈ <strong>' + yB1exp.toFixed(2) + ' cm</strong>.</li>'
        + '<li>Indice : quand B₁ est correct, les deux rayons émergents de L₂ deviennent <strong>parallèles</strong>.</li>'
        + '</ul>';

    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>algebraic</type>\n'
        + '      <tans>' + tansB1 + '</tans>\n'
        + '      <boxsize>15</boxsize><strictsyntax>1</strictsyntax>'
        + '<insertstars>0</insertstars><syntaxhint></syntaxhint>'
        + '<syntaxattribute>0</syntaxattribute><forbidwords></forbidwords>'
        + '<allowwords></allowwords><forbidfloat>0</forbidfloat>'
        + '<requirelowestterms>0</requirelowestterms><checkanswertype>0</checkanswertype>'
        + '<mustverify>0</mustverify><showvalidation>0</showvalidation>'
        + '<options></options>\n    </input>';

    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'opt_ok_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données :</strong> '
        + 'f\'₁ = ' + f1 + ' cm, '
        + 'f\'₂ = ' + f2 + ' cm, '
        + 'θ = ' + theta + '°</p>\n';

    var textFrag = '<div style="background:#0284c7;border-left:5px solid #0369a1;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique : Lunette astronomique</strong>'
        + '<span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '💡 Faites glisser B₁ (rouge) dans le plan focal commun F\'₁.'
        + ' Les rayons émergents de L₂ deviennent <strong>parallèles</strong>'
        + ' quand B₁ est à la bonne position.</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-Lunette Q' + X + ' f1=' + f1 + ' f2=' + f2 + ' th=' + theta,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 4 : Miroir plan ── */
function _genOptiqueMiroirPlan(X) {
    var bareme  = parseFloat(v('opt-bareme')) || 1;
    var text    = richVal('opt-text');
    var xM      = parseFloat(v('opt-mp-xm')) || 0;
    var xA      = parseFloat(v('opt-mp-xa')) || -20;
    var AB      = parseFloat(v('opt-mp-ab')) || 2;
    var tol     = parseFloat(v('opt-mp-tol')) || 1.5;
    var fbOk    = v('opt-fb-ok')    || '';
    var fbWrong = v('opt-fb-wrong') || '';
    var dispW   = parseInt(v('opt-w')) || 700;
    var dispH   = parseInt(v('opt-h')) || 380;

    // Expected image position (symmetry through mirror at xM)
    var xAp = 2 * xM - xA;  // image of A through mirror: symmetric

    // Diagram bounds
    var pad = 6;
    var bbLeft  = Math.min(xA, xM) - pad;
    var bbRight = Math.max(xAp, xM) + pad;
    var bbH     = Math.max(Math.abs(AB) * 2.2, 5);
    var mirH    = Math.max(Math.abs(AB) * 2.5, 5);

    // Initial wrong position for B' (displaced)
    var initBpX = xM + (xAp - xM) * 0.4;
    var initBpY = AB * 1.6;

    var jxg = 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '  boundingbox: [' + bbLeft.toFixed(1) + ', ' + bbH.toFixed(1) + ', '
        + bbRight.toFixed(1) + ', ' + (-bbH).toFixed(1) + '],\n'
        + '  keepaspectratio: false, axis: false,\n'
        + '  showCopyright: false, showNavigation: false\n'
        + '});\n'
        // Axis
        + 'board.create("line", [[0,0],[1,0]], {strokeColor:"#d1d5db",strokeWidth:1.5,'
        + 'straightFirst:true,straightLast:true,fixed:true,highlight:false});\n'
        // Mirror: vertical line at xM
        + 'board.create("segment", [[' + xM + ',' + (-mirH) + '],[' + xM + ',' + mirH + ']], '
        + '{strokeColor:"#374151",strokeWidth:3,fixed:true,highlight:false});\n'
        // Hatching (on right = back side, for xM on left of image)
        + (function() {
            var h = '';
            var nH = 7;
            var dx = (xAp > xM) ? 1.2 : -1.2; // hatch away from reflective side
            for (var i = 0; i <= nH; i++) {
                var yy = (-mirH + i * (2*mirH/nH)).toFixed(2);
                var yyEnd = (parseFloat(yy) - 1.2).toFixed(2);
                h += 'board.create("segment", [[' + xM + ',' + yy + '],['
                    + (xM + dx).toFixed(2) + ',' + yyEnd + ']], '
                    + '{strokeColor:"#9ca3af",strokeWidth:1,fixed:true,highlight:false});\n';
            }
            return h;
        })()
        // Label miroir plan
        + 'board.create("text", [' + xM + ',' + (mirH + 0.5).toFixed(1) + ',"miroir plan"], '
        + '{fixed:true,anchorX:"center",fontSize:11,color:"#374151",highlight:false});\n'
        + 'board.create("text", [' + xM + ',' + (-0.5).toFixed(1) + ',"S"], '
        + '{fixed:true,anchorX:"center",fontSize:12,color:"#374151",highlight:false});\n'
        // Object AB (fixed, green)
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
        // Image arrow A'→B' (red)
        + 'board.create("segment", [Ap,Bp], {strokeColor:"#ef4444",strokeWidth:2,'
        + 'fixed:false,highlight:false,lastArrow:{type:1,size:5}});\n'
        // Dashed construction: B to mirror to B' (horizontal dashes)
        + 'board.create("segment", [[' + xA + ',' + AB + '],[' + xM + ',' + AB + ']], '
        + '{strokeColor:"#9ca3af",strokeWidth:1,dash:2,fixed:true,highlight:false});\n'
        + 'board.create("segment", [[' + xM + ',' + AB + '],[' + xAp + ',' + AB + ']], '
        + '{strokeColor:"#9ca3af",strokeWidth:1,dash:2,fixed:true,highlight:false});\n'
        // Dot at mirror for perpendicular foot
        + 'board.create("point", [' + xM + ',' + AB + '], {fixed:true,size:2,'
        + 'fillColor:"#9ca3af",strokeColor:"#9ca3af",name:"",highlight:false});\n'
        // STACK bind
        + 'stack_jxg.bind_point(board, "ans' + X + '", Bp);\n';

    var inputXML = '<input>\n'
        + '  <name>ans' + X + '</name>\n'
        + '  <type>algebraic</type>\n'
        + '  <tans>[' + xAp.toFixed(2) + ',' + AB.toFixed(2) + ']</tans>\n'
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
        + 'opt_xAp_' + X + ': float(' + xAp.toFixed(4) + ');\n'
        + 'opt_ok_' + X + ': is(abs(opt_bpx_' + X + ' - opt_xAp_' + X + ') <= '
        + tol.toFixed(2) + ' and abs(opt_bpy_' + X + ' - ' + AB.toFixed(4) + ') <= '
        + tol.toFixed(2) + ');\n';
    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: 'Image miroir plan', answertest: 'AlgEquiv',
        sans: 'opt_ok_' + X, tans: 'true', testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données :</strong> '
        + 'Miroir plan en xₘ = ' + xM + ' cm, '
        + 'Objet A en xₐ = ' + xA + ' cm, '
        + 'AB = ' + AB + ' cm</p>\n';

    var textFrag = '<div style="background:#b45309;border-left:5px solid #92400e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique : Miroir plan</strong>'
        + '<span style="background:#92400e;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '💡 Faites glisser B\' (rouge) \xe0 la position de l\'image.'
        + ' L\'image est <strong>sym\xe9trique</strong> de B par rapport au miroir.</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-MiroirPlan Q' + X + ' xM=' + xM + ' xA=' + xA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
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
        name: '0', description: 'Image miroir sphérique', answertest: 'AlgEquiv',
        sans: 'opt_ok_' + X, tans: 'true', testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var typeLabel = (msType === 'concave') ? 'concave (convergent)' : 'convexe (divergent)';
    var SAp = -xAp;
    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données :</strong> '
        + 'Miroir ' + typeLabel + ', |f\'| = ' + f + ' cm, '
        + 'SA = ' + SA + ' cm, AB = ' + AB + ' cm</p>\n';

    var textFrag = '<div style="background:#b45309;border-left:5px solid #92400e;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique : Miroir sphérique</strong>'
        + '<span style="background:#92400e;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '💡 Faites glisser B\' (rouge) \xe0 la position de l\'image. '
        + (isVirtual ? 'Image <strong>virtuelle</strong> (en pointill\xe9s) derri\xe8re le miroir.' : 'Image <strong>r\xe9elle</strong> devant le miroir.')
        + '</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-MiroirSph Q' + X + ' ' + msType + ' f=' + f + ' SA=' + SA,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

/* ── Scénario 6 : Télescope (miroir concave + image focale B₁) ── */
function _genOptiqueTelescope(X) {
    var bareme  = parseFloat(v('opt-bareme'))     || 1;
    var text    = richVal('opt-text');
    var f1      = parseFloat(v('opt-tel-f1'))     || 40;
    var theta   = parseFloat(v('opt-tel-theta'))  || 3;
    var beamH   = parseFloat(v('opt-tel-beam-h')) || 3;
    var tolX    = parseFloat(v('opt-tel-tol-x'))  || 2;
    var tolY    = parseFloat(v('opt-tel-tol-y'))  || 0.5;
    var fbOk    = v('opt-fb-ok')    || '';
    var fbWrong = v('opt-fb-wrong') || '';
    var dispW   = parseInt(v('opt-w')) || 700;
    var dispH   = parseInt(v('opt-h')) || 380;

    // Physics: expected B₁ position
    var tanT   = Math.tan(theta * Math.PI / 180);
    var xB1exp = -f1;              // focal point of primary mirror (in front = to the left)
    var yB1exp = -f1 * tanT;      // below axis (mirror inverts vertical component)

    // Mirror arc parameters (visual representation)
    var mirrorH = Math.max(beamH + 2, 5);
    var sag = mirrorH / 6;
    var Rvis = (sag * sag + mirrorH * mirrorH) / (2 * sag);
    var tMax = Math.asin(mirrorH / Rvis);

    // Diagram bounds
    var xLeft  = -f1 * 2.1;
    var xRight = f1 * 0.15;
    var yTop   = Math.max(beamH + tanT * Math.abs(xLeft) + 2, 8);
    var yBot   = Math.max(Math.abs(yB1exp) * 1.6 + 2, 5);

    // Incident ray y-values at xLeft (going at slope -tanT, hitting mirror at y=0 and y=beamH)
    var yRay1Left = tanT * Math.abs(xLeft);       // ray 1 starts above axis at xLeft
    var yRay2Left = beamH + tanT * Math.abs(xLeft); // ray 2 starts higher

    // Initial wrong position for B₁
    var initB1x = xB1exp * 0.4;
    var initB1y = 0;

    var xFStr   = (-f1).toFixed(1);
    var xCStr   = (-2*f1).toFixed(1);
    var xB1Str  = xB1exp.toFixed(3);
    var yB1Str  = yB1exp.toFixed(3);
    var RvisStr = Rvis.toFixed(4);
    var tMaxStr = tMax.toFixed(6);
    var sagStr  = sag.toFixed(4);

    var jxg = 'var board = JXG.JSXGraph.initBoard(divid, {\n'
        + '  boundingbox: [' + xLeft.toFixed(1) + ',' + yTop.toFixed(1) + ','
        + xRight.toFixed(1) + ',' + (-yBot).toFixed(1) + '],\n'
        + '  keepaspectratio: false, axis: false,\n'
        + '  showCopyright: false, showNavigation: false\n'
        + '});\n'
        // Optical axis
        + 'board.create("line", [[0,0],[1,0]], {strokeColor:"#d1d5db",strokeWidth:1.5,'
        + 'straightFirst:true,straightLast:true,fixed:true,highlight:false});\n'
        // Concave mirror arc at x=0: x(t)=Rvis*(cos(t)-1), y(t)=Rvis*sin(t)
        + 'board.create("curve", [function(t){return ' + RvisStr + '*(Math.cos(t)-1);}, '
        + 'function(t){return ' + RvisStr + '*Math.sin(t);}, '
        + '-' + tMaxStr + ', ' + tMaxStr + '], '
        + '{strokeColor:"#374151",strokeWidth:3.5,fixed:true,highlight:false});\n'
        // Hatching on right (back of mirror)
        + (function() {
            var h = '';
            var nH = 7;
            for (var i = 0; i <= nH; i++) {
                var t = -tMax + i * (2 * tMax / nH);
                var xHatch = Rvis * (Math.cos(t) - 1);
                var yHatch = Rvis * Math.sin(t);
                h += 'board.create("segment", [['
                    + xHatch.toFixed(3) + ',' + yHatch.toFixed(3) + '],['
                    + (xHatch + 1.2).toFixed(3) + ',' + (yHatch - 0.9).toFixed(3) + ']], '
                    + '{strokeColor:"#9ca3af",strokeWidth:1,fixed:true,highlight:false});\n';
            }
            return h;
        })()
        // Labels: S (vertex), F₁, C
        + 'board.create("text", [' + sagStr + ',0.45,"S"], '
        + '{fixed:true,anchorX:"center",fontSize:12,color:"#374151",highlight:false});\n'
        + 'board.create("point", [' + xFStr + ',0], {fixed:true,size:3,face:"cross",'
        + 'fillColor:"#0369a1",strokeColor:"#0369a1",name:"F\\u2081",'
        + 'label:{fontSize:12,color:"#0369a1",offset:[0,8]},highlight:false});\n'
        + 'board.create("point", [' + xCStr + ',0], {fixed:true,size:3,face:"cross",'
        + 'fillColor:"#64748b",strokeColor:"#64748b",name:"C",'
        + 'label:{fontSize:12,color:"#64748b",offset:[0,8]},highlight:false});\n'
        // Mirror label
        + 'board.create("text", [0,' + (mirrorH + 0.8).toFixed(1) + ',"miroir concave"], '
        + '{fixed:true,anchorX:"center",fontSize:11,color:"#374151",highlight:false});\n'
        // Incident ray 1: from (xLeft, yRay1Left) to hit point S=(0,0)
        + 'board.create("segment", [[' + xLeft.toFixed(1) + ',' + yRay1Left.toFixed(3) + '],[0,0]], '
        + '{strokeColor:"#f59e0b",strokeWidth:2,fixed:true,highlight:false,'
        + 'lastArrow:{type:1,size:4}});\n'
        // Incident ray 2: from (xLeft, yRay2Left) to hit point (0, beamH)
        + 'board.create("segment", [[' + xLeft.toFixed(1) + ',' + yRay2Left.toFixed(3) + '],'
        + '[0,' + beamH.toFixed(2) + ']], '
        + '{strokeColor:"#f59e0b",strokeWidth:2,fixed:true,highlight:false,'
        + 'lastArrow:{type:1,size:4}});\n'
        // Draggable B₁ (red, starts wrong)
        + 'var B1 = board.create("point", [' + initB1x.toFixed(2) + ',' + initB1y.toFixed(2) + '], {'
        + 'size:7,face:"circle",fillColor:"#ef4444",strokeColor:"#b91c1c",'
        + 'name:"B\\u2081",label:{fontSize:14,color:"#b91c1c",offset:[8,6]}});\n'
        // Hit points on mirror (hidden)
        + 'var hitS = board.create("point", [0,0], '
        + '{fixed:true,size:0,face:"circle",name:"",highlight:false,visible:false});\n'
        + 'var hitH = board.create("point", [0,' + beamH.toFixed(2) + '], '
        + '{fixed:true,size:0,face:"circle",name:"",highlight:false,visible:false});\n'
        // Reflected ray 1: from hitS through B1 extending left
        + 'board.create("line", [hitS, B1], {straightFirst:false, straightLast:true, '
        + 'strokeColor:"#dc2626",strokeWidth:2,highlight:false,'
        + 'lastArrow:{type:1,size:5}});\n'
        // Reflected ray 2: from hitH through B1 extending left
        + 'board.create("line", [hitH, B1], {straightFirst:false, straightLast:true, '
        + 'strokeColor:"#dc2626",strokeWidth:2,highlight:false,'
        + 'lastArrow:{type:1,size:5}});\n'
        // STACK bind
        + 'stack_jxg.bind_point(board, "ans' + X + '", B1);\n';

    var inputXML = '<input>\n'
        + '  <name>ans' + X + '</name>\n'
        + '  <type>algebraic</type>\n'
        + '  <tans>[' + xB1Str + ',' + yB1Str + ']</tans>\n'
        + '  <boxsize>5</boxsize>\n'
        + '  <strictsyntax>1</strictsyntax><insertstars>0</insertstars>\n'
        + '  <syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>\n'
        + '  <forbidwords></forbidwords><allowwords></allowwords>\n'
        + '  <forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>\n'
        + '  <checkanswertype>0</checkanswertype><mustverify>0</mustverify>\n'
        + '  <showvalidation>0</showvalidation><options></options>\n'
        + '</input>';

    var fbVars = 'opt_b1x_' + X + ': float(ans' + X + '[1]);\n'
        + 'opt_b1y_' + X + ': float(ans' + X + '[2]);\n'
        + 'opt_ok_' + X + ': is(abs(opt_b1x_' + X + ' - (' + xB1Str + ')) <= ' + tolX.toFixed(2)
        + ' and abs(opt_b1y_' + X + ' - (' + yB1Str + ')) <= ' + tolY.toFixed(2) + ');\n';
    var prtMeta = { name: 'prt' + X, value: '1', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: 'Image focale télescope', answertest: 'AlgEquiv',
        sans: 'opt_ok_' + X, tans: 'true', testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var dataRow = '<p style="margin:6px 0 10px;font-size:.9em;color:#374151;">'
        + '<strong>Données :</strong> '
        + 'Miroir concave f\'₁ = ' + f1 + ' cm, θ = ' + theta + '°</p>\n';

    var textFrag = '<div style="background:#065f46;border-left:5px solid #064e3b;'
        + 'border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;'
        + 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X
        + ' — Optique : Télescope</strong>'
        + '<span style="background:#064e3b;color:#fff;padding:2px 9px;border-radius:20px;'
        + 'font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + dataRow
        + '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n'
        + jxg + '\n[[/jsxgraph]]\n'
        + '<p style="font-size:.82em;color:#6b7280;margin-top:6px;">'
        + '💉 Faites glisser B₁ (rouge) dans le plan focal du miroir primaire.'
        + ' Les rayons réfléchis <strong>convergent</strong> vers B₁'
        + ' quand il est à la bonne position.</p>\n'
        + '<div style="display:none">[[input:ans' + X + ']][[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            '',
        qnote:           'Optique-Telescope Q' + X + ' f1=' + f1 + ' th=' + theta,
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: _mkFbGen('', v('opt-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

