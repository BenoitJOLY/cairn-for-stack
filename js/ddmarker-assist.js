// ── DDMARKER ASSISTANT ────────────────────────────────────────
// Construit une question Moodle ddmarker (glisser-déposer marqueur).
// Export en XML Moodle — type hors STACK, import direct dans Moodle.

(function () {

var _dd = {
  bgName: '',
  bgData: '',       // data-URL complet (data:image/...;base64,...)
  bgW: 0, bgH: 0,
  proposals: [],    // [{id, text, infinite}]
  zones: [],        // [{id, shape:'circle'|'rect', x, y, r | w+h, choice}]
  nextPropId: 1,
  nextZoneId: 1,
  mode: 'circle',   // 'circle' | 'rect' | 'select'
  selZoneId: null,
  defRadius: 30,
  defW: 80,
  defH: 50,
  canvasScale: 1,
  img: null
};

// ── Open / Close ────────────────────────────────────────────────

function openDdMarkerModal() {
  _dd.bgName = '';  _dd.bgData = '';
  _dd.bgW = 0;      _dd.bgH = 0;
  _dd.proposals = [];  _dd.zones = [];
  _dd.nextPropId = 1;  _dd.nextZoneId = 1;
  _dd.mode = 'circle';
  _dd.selZoneId = null;
  _dd.img = null;

  var bgInput = document.getElementById('dd-bg-file');
  if (bgInput) bgInput.value = '';

  var imgInfo = document.getElementById('dd-img-info');
  if (imgInfo) imgInfo.textContent = '';

  document.getElementById('dd-canvas-wrap').style.display = 'none';
  document.getElementById('dd-canvas-placeholder').style.display = 'flex';

  _ddRenderProposals();
  _ddUpdateZoneProps(null);
  ddSetMode('circle');

  document.getElementById('dd-qname').value = '';
  document.getElementById('dd-qtext').value = '';

  var modal = document.getElementById('ddmarkerModal');
  modal.style.display = 'flex';
  FocusTrap.trap(modal, closeDdMarkerModal);
}

function closeDdMarkerModal() {
  document.getElementById('ddmarkerModal').style.display = 'none';
  FocusTrap.release();
}

// ── Image ────────────────────────────────────────────────────────

function ddHandleImageUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  _dd.bgName = file.name;
  var reader = new FileReader();
  reader.onload = function (e) {
    _dd.bgData = e.target.result;
    var img = new Image();
    img.onload = function () {
      _dd.bgW = img.naturalWidth;
      _dd.bgH = img.naturalHeight;
      _dd.img = img;
      _ddSetupCanvas();
      _ddRedraw();
    };
    img.src = _dd.bgData;
  };
  reader.readAsDataURL(file);
}

function _ddSetupCanvas() {
  var canvas = document.getElementById('dd-canvas');
  var maxW = 680, maxH = 460;
  var scale = Math.min(1, maxW / _dd.bgW, maxH / _dd.bgH);
  _dd.canvasScale = scale;
  canvas.width  = Math.round(_dd.bgW * scale);
  canvas.height = Math.round(_dd.bgH * scale);

  var info = document.getElementById('dd-img-info');
  if (info) info.textContent = _dd.bgName + ' — ' + _dd.bgW + ' × ' + _dd.bgH + ' px';

  document.getElementById('dd-canvas-wrap').style.display = 'block';
  document.getElementById('dd-canvas-placeholder').style.display = 'none';
}

// ── Dessin canvas ────────────────────────────────────────────────

function _ddRedraw() {
  var canvas = document.getElementById('dd-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (_dd.img) ctx.drawImage(_dd.img, 0, 0, canvas.width, canvas.height);
  var s = _dd.canvasScale;

  _dd.zones.forEach(function (z) {
    var isSel = (z.id === _dd.selZoneId);
    ctx.save();
    ctx.strokeStyle = isSel ? '#f59e0b' : '#ef4444';
    ctx.lineWidth   = isSel ? 3 : 2;
    ctx.fillStyle   = isSel ? 'rgba(245,158,11,.25)' : 'rgba(239,68,68,.18)';
    ctx.beginPath();
    if (z.shape === 'circle') {
      ctx.arc(z.x * s, z.y * s, z.r * s, 0, 2 * Math.PI);
    } else {
      ctx.rect(z.x * s, z.y * s, z.w * s, z.h * s);
    }
    ctx.fill();
    ctx.stroke();

    // Numéro de zone au centre
    var lx = z.shape === 'circle' ? z.x * s : (z.x + z.w / 2) * s;
    var ly = z.shape === 'circle' ? z.y * s : (z.y + z.h / 2) * s;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(String(z.id), lx, ly);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(z.id), lx, ly);
    ctx.restore();
  });
}

// ── Clic canvas ──────────────────────────────────────────────────

function ddCanvasClick(e) {
  if (!_dd.img) { toast(I18N.t('dd.no_image_warn')); return; }
  var canvas = document.getElementById('dd-canvas');
  var rect = canvas.getBoundingClientRect();
  var cx = (e.clientX - rect.left) / _dd.canvasScale;
  var cy = (e.clientY - rect.top)  / _dd.canvasScale;

  if (_dd.mode === 'select') {
    var hit = _ddHitTest(cx, cy);
    _dd.selZoneId = hit ? hit.id : null;
    _ddUpdateZoneProps(hit);
    _ddRedraw();
    return;
  }

  var defChoice = _dd.proposals.length ? _dd.proposals[0].id : 0;
  var z = { id: _dd.nextZoneId++, shape: _dd.mode === 'rect' ? 'rect' : 'circle', choice: defChoice };
  if (z.shape === 'circle') {
    z.x = Math.round(cx);
    z.y = Math.round(cy);
    z.r = _dd.defRadius;
  } else {
    z.x = Math.round(cx - _dd.defW / 2);
    z.y = Math.round(cy - _dd.defH / 2);
    z.w = _dd.defW;
    z.h = _dd.defH;
  }
  _dd.zones.push(z);
  _dd.selZoneId = z.id;
  _ddUpdateZoneProps(z);
  _ddRedraw();
}

function _ddHitTest(cx, cy) {
  for (var i = _dd.zones.length - 1; i >= 0; i--) {
    var z = _dd.zones[i];
    if (z.shape === 'circle') {
      var dx = cx - z.x, dy = cy - z.y;
      if (Math.sqrt(dx * dx + dy * dy) <= z.r) return z;
    } else {
      if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return z;
    }
  }
  return null;
}

// ── Modes ────────────────────────────────────────────────────────

function ddSetMode(mode) {
  _dd.mode = mode;
  ['circle', 'rect', 'select'].forEach(function (m) {
    var btn = document.getElementById('dd-tool-' + m);
    if (btn) btn.classList.toggle('dd-tool-active', m === mode);
  });
  var canvas = document.getElementById('dd-canvas');
  if (canvas) canvas.style.cursor = mode === 'select' ? 'pointer' : 'crosshair';
}

// ── Panneau propriétés zone ──────────────────────────────────────

function _ddUpdateZoneProps(z) {
  var panel = document.getElementById('dd-zone-props');
  if (!panel) return;
  if (!z) { panel.style.display = 'none'; return; }
  panel.style.display = 'flex';

  document.getElementById('dd-zp-num').textContent = '#' + z.id;

  var circleBlock = document.getElementById('dd-zp-circle');
  var rectBlock   = document.getElementById('dd-zp-rect');
  circleBlock.style.display = z.shape === 'circle' ? '' : 'none';
  rectBlock.style.display   = z.shape === 'rect'   ? '' : 'none';

  if (z.shape === 'circle') {
    document.getElementById('dd-zp-cx').value = z.x;
    document.getElementById('dd-zp-cy').value = z.y;
    document.getElementById('dd-zp-cr').value = z.r;
  } else {
    document.getElementById('dd-zp-rx').value = z.x;
    document.getElementById('dd-zp-ry').value = z.y;
    document.getElementById('dd-zp-rw').value = z.w;
    document.getElementById('dd-zp-rh').value = z.h;
  }

  var sel = document.getElementById('dd-zp-choice');
  sel.innerHTML = _dd.proposals.length
    ? _dd.proposals.map(function (p) {
        return '<option value="' + p.id + '"' + (p.id === z.choice ? ' selected' : '') + '>'
          + (p.id) + '. ' + htmlEsc(p.text || '(vide)') + '</option>';
      }).join('')
    : '<option value="0">' + I18N.t('dd.no_proposals_yet_short') + '</option>';
  sel.value = z.choice;
}

function ddZonePropChange() {
  var z = _dd.zones.find(function (z2) { return z2.id === _dd.selZoneId; });
  if (!z) return;
  if (z.shape === 'circle') {
    z.x = parseInt(document.getElementById('dd-zp-cx').value, 10) || 0;
    z.y = parseInt(document.getElementById('dd-zp-cy').value, 10) || 0;
    z.r = Math.max(5, parseInt(document.getElementById('dd-zp-cr').value, 10) || 20);
  } else {
    z.x = parseInt(document.getElementById('dd-zp-rx').value, 10) || 0;
    z.y = parseInt(document.getElementById('dd-zp-ry').value, 10) || 0;
    z.w = Math.max(10, parseInt(document.getElementById('dd-zp-rw').value, 10) || 40);
    z.h = Math.max(10, parseInt(document.getElementById('dd-zp-rh').value, 10) || 25);
  }
  z.choice = parseInt(document.getElementById('dd-zp-choice').value, 10) || 0;
  _ddRedraw();
}

function ddDeleteSelectedZone() {
  if (_dd.selZoneId === null) return;
  _dd.zones = _dd.zones.filter(function (z) { return z.id !== _dd.selZoneId; });
  _dd.selZoneId = null;
  _ddUpdateZoneProps(null);
  _ddRedraw();
}

// ── Propositions ─────────────────────────────────────────────────

function ddAddProposal() {
  _dd.proposals.push({ id: _dd.nextPropId++, text: '', infinite: false });
  _ddRenderProposals();
  if (_dd.selZoneId !== null) {
    var z = _dd.zones.find(function (z2) { return z2.id === _dd.selZoneId; });
    if (z) _ddUpdateZoneProps(z);
  }
}

function _ddRenderProposals() {
  var list = document.getElementById('dd-proposals-list');
  if (!list) return;
  if (!_dd.proposals.length) {
    list.innerHTML = '<p class="dd-empty-hint">' + I18N.t('dd.no_proposals_yet') + '</p>';
    return;
  }
  list.innerHTML = _dd.proposals.map(function (p) {
    return '<div class="dd-prop-row">'
      + '<span class="dd-prop-num">' + p.id + '</span>'
      + '<input class="dd-prop-input" type="text" value="' + htmlEsc(p.text) + '" '
      +   'placeholder="' + I18N.t('dd.proposal_ph') + '" '
      +   'oninput="ddPropTextChange(' + p.id + ',this.value)">'
      + '<label class="dd-prop-inf" title="' + I18N.t('dd.infinite_title') + '">'
      +   '<input type="checkbox" ' + (p.infinite ? 'checked' : '') + ' '
      +   'onchange="ddPropInfChange(' + p.id + ',this.checked)"> ∞</label>'
      + '<button class="dd-prop-del" onclick="ddDeleteProposal(' + p.id + ')" title="Supprimer">✕</button>'
      + '</div>';
  }).join('');
}

function ddPropTextChange(id, val) {
  var p = _dd.proposals.find(function (p2) { return p2.id === id; });
  if (p) p.text = val;
  if (_dd.selZoneId !== null) {
    var z = _dd.zones.find(function (z2) { return z2.id === _dd.selZoneId; });
    if (z) _ddUpdateZoneProps(z);
  }
}

function ddPropInfChange(id, val) {
  var p = _dd.proposals.find(function (p2) { return p2.id === id; });
  if (p) p.infinite = val;
}

function ddDeleteProposal(id) {
  _dd.proposals = _dd.proposals.filter(function (p) { return p.id !== id; });
  _dd.zones.forEach(function (z) {
    if (z.choice === id) z.choice = _dd.proposals.length ? _dd.proposals[0].id : 0;
  });
  _ddRenderProposals();
  if (_dd.selZoneId !== null) {
    var z = _dd.zones.find(function (z2) { return z2.id === _dd.selZoneId; });
    if (z) _ddUpdateZoneProps(z);
  }
}

// ── Export XML Moodle ddmarker ────────────────────────────────────

function ddExportXML() {
  if (!_dd.bgData) { toast(I18N.t('dd.no_image_warn')); return; }
  if (!_dd.proposals.length) { toast(I18N.t('dd.no_proposals')); return; }
  if (!_dd.zones.length) { toast(I18N.t('dd.no_zones')); return; }

  var qname = document.getElementById('dd-qname').value.trim() || 'Question glisser-déposer';
  var qtext = document.getElementById('dd-qtext').value.trim() || 'Déposez les étiquettes sur le schéma.';

  var ext   = (_dd.bgName.split('.').pop() || 'png').toLowerCase();
  var fname = 'bgimage.' + ext;
  var b64   = _dd.bgData.replace(/^data:[^;]+;base64,/, '');

  // Table de correspondance id interne → numéro Moodle (1-based)
  var propIdx = {};
  _dd.proposals.forEach(function (p, i) { propIdx[p.id] = i + 1; });

  var drags = _dd.proposals.map(function (p, i) {
    return '    <drag>\n'
      + '      <no>' + (i + 1) + '</no>\n'
      + '      <text>' + _xmlEsc(p.text) + '</text>\n'
      + (p.infinite ? '      <infinite/>\n' : '')
      + '    </drag>';
  }).join('\n');

  var drops = _dd.zones.map(function (z) {
    var shape  = z.shape === 'rect' ? 'rectangle' : 'circle';
    var coords = z.shape === 'circle'
      ? z.x + ',' + z.y + ';' + z.r
      : z.x + ',' + z.y + ',' + z.w + ',' + z.h;
    return '    <drop>\n'
      + '      <no>' + z.id + '</no>\n'
      + '      <shape>' + shape + '</shape>\n'
      + '      <coords>' + coords + '</coords>\n'
      + '      <choice>' + (propIdx[z.choice] || 1) + '</choice>\n'
      + '    </drop>';
  }).join('\n');

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<quiz>\n'
    + '  <question type="ddmarker">\n'
    + '    <name><text>' + _xmlEsc(qname) + '</text></name>\n'
    + '    <questiontext format="html">\n'
    + '      <text><![CDATA[<p>' + qtext + '</p>]]></text>\n'
    + '    </questiontext>\n'
    + '    <generalfeedback format="html"><text></text></generalfeedback>\n'
    + '    <defaultgrade>1</defaultgrade>\n'
    + '    <penalty>0.3333333</penalty>\n'
    + '    <hidden>0</hidden>\n'
    + '    <single>0</single>\n'
    + '    <shuffleanswers>1</shuffleanswers>\n'
    + '    <correctfeedback format="html"><text>Bonne réponse.</text></correctfeedback>\n'
    + '    <partiallycorrectfeedback format="html"><text>Réponse partiellement correcte.</text></partiallycorrectfeedback>\n'
    + '    <incorrectfeedback format="html"><text>Mauvaise réponse.</text></incorrectfeedback>\n'
    + drags + '\n'
    + drops + '\n'
    + '    <file name="' + _xmlEsc(fname) + '" encoding="base64">' + b64 + '</file>\n'
    + '  </question>\n'
    + '</quiz>\n';

  var blob = new Blob([xml], { type: 'application/xml' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = qname.replace(/[^a-z0-9_\-]/gi, '_') + '.xml';
  a.click();
  URL.revokeObjectURL(url);
  toast(I18N.t('dd.export_ok'));
}

function _xmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Exposition globale ───────────────────────────────────────────

window.openDdMarkerModal    = openDdMarkerModal;
window.closeDdMarkerModal   = closeDdMarkerModal;
window.ddHandleImageUpload  = ddHandleImageUpload;
window.ddCanvasClick        = ddCanvasClick;
window.ddSetMode            = ddSetMode;
window.ddAddProposal        = ddAddProposal;
window.ddPropTextChange     = ddPropTextChange;
window.ddPropInfChange      = ddPropInfChange;
window.ddDeleteProposal     = ddDeleteProposal;
window.ddZonePropChange     = ddZonePropChange;
window.ddDeleteSelectedZone = ddDeleteSelectedZone;
window.ddExportXML          = ddExportXML;

})();
