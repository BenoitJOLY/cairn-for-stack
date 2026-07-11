// ── JXGDROP UI ─────────────────────────────────────────────────
// Éditeur de zones pour la question JSXGraph Glisser-Déposer (jxgdrop) STACK.
// Zones stockées en coordonnées image (y depuis le haut).
// Le générateur convertit en coordonnées mathématiques JSXGraph (y vers le haut).

(function () {

var _jd = {
    bgName: '', bgData: '', bgW: 0, bgH: 0, img: null,
    proposals: [],   // [{id, text}]
    zones: [],       // [{id, shape:'circle'|'rect', x, y, r | x, y, w, h, assignments: [propId, ...]}]
    nextPropId: 1,
    nextZoneId: 1,
    mode: 'circle',
    selZoneId: null,
    defRadius: 30,
    defW: 80, defH: 50,
    canvasScale: 1
};

window._jdState = _jd;

// ── Image ──────────────────────────────────────────────────────

// Taille maximale (plus grand côté) de l'image de fond stockée. Les photos
// de téléphone dépassent souvent 3000-4000px, ce qui gonfle inutilement le
// base64 embarqué dans l'export XML (taille de fichier, temps d'import
// Moodle). On downscale une fois à l'upload, la qualité reste largement
// suffisante pour un exercice à l'écran.
var JD_MAX_UPLOAD_DIM = 1100;

function jdHandleImageUpload(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    _jd.bgName = file.name;
    var reader = new FileReader();
    reader.onload = function (e) {
        var rawData = e.target.result;
        var img = new Image();
        img.onload = function () {
            var w = img.naturalWidth, h = img.naturalHeight;
            var scale = Math.min(1, JD_MAX_UPLOAD_DIM / Math.max(w, h));
            if (scale < 1) {
                var cw = Math.round(w * scale), ch = Math.round(h * scale);
                var off = document.createElement('canvas');
                off.width = cw; off.height = ch;
                off.getContext('2d').drawImage(img, 0, 0, cw, ch);
                var isPng = /image\/png/.test(file.type);
                _jd.bgData = off.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
                var img2 = new Image();
                img2.onload = function () {
                    _jd.bgW = cw; _jd.bgH = ch; _jd.img = img2;
                    _jdSetupCanvas();
                    _jdRedraw();
                };
                img2.src = _jd.bgData;
            } else {
                _jd.bgData = rawData;
                _jd.bgW = w; _jd.bgH = h; _jd.img = img;
                _jdSetupCanvas();
                _jdRedraw();
            }
        };
        img.src = rawData;
    };
    reader.readAsDataURL(file);
}

function _jdSetupCanvas() {
    var canvas = document.getElementById('jd-canvas');
    var maxW = 680, maxH = 440;
    var scale = Math.min(1, maxW / _jd.bgW, maxH / _jd.bgH);
    _jd.canvasScale = scale;
    canvas.width  = Math.round(_jd.bgW  * scale);
    canvas.height = Math.round(_jd.bgH * scale);
    var info = document.getElementById('jd-img-info');
    if (info) info.textContent = _jd.bgName + ' — ' + _jd.bgW + ' × ' + _jd.bgH + ' px';
    document.getElementById('jd-canvas-wrap').style.display = 'block';
    document.getElementById('jd-canvas-placeholder').style.display = 'none';
}

// ── Canvas drawing ─────────────────────────────────────────────

function _jdRedraw() {
    var canvas = document.getElementById('jd-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (_jd.img) ctx.drawImage(_jd.img, 0, 0, canvas.width, canvas.height);
    var s = _jd.canvasScale;

    _jd.zones.forEach(function (z) {
        var isSel = (z.id === _jd.selZoneId);
        ctx.save();
        ctx.strokeStyle = isSel ? '#f59e0b' : '#d97706';
        ctx.lineWidth   = isSel ? 3 : 2;
        ctx.fillStyle   = isSel ? 'rgba(245,158,11,.25)' : 'rgba(217,119,6,.15)';
        ctx.beginPath();
        if (z.shape === 'circle') {
            ctx.arc(z.x * s, z.y * s, z.r * s, 0, 2 * Math.PI);
        } else {
            ctx.rect(z.x * s, z.y * s, z.w * s, z.h * s);
        }
        ctx.fill();
        ctx.stroke();

        // Numéro de zone
        var lx = z.shape === 'circle' ? z.x * s : (z.x + z.w / 2) * s;
        var ly = z.shape === 'circle' ? z.y * s : (z.y + z.h / 2) * s;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(String(z.id), lx, ly);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(z.id), lx, ly);
        ctx.restore();
    });
}

// ── Canvas click ───────────────────────────────────────────────

function jdCanvasClick(e) {
    if (!_jd.img) { toast(I18N.t('jd.no_image_warn')); return; }
    var canvas = document.getElementById('jd-canvas');
    var rect = canvas.getBoundingClientRect();
    var cx = (e.clientX - rect.left) / _jd.canvasScale;
    var cy = (e.clientY - rect.top)  / _jd.canvasScale;

    if (_jd.mode === 'select') {
        var hit = _jdHitTest(cx, cy);
        _jd.selZoneId = hit ? hit.id : null;
        _jdUpdateZoneProps(hit);
        _jdRedraw();
        return;
    }

    var z = {
        id: _jd.nextZoneId++,
        shape: _jd.mode === 'rect' ? 'rect' : 'circle',
        assignments: _jd.proposals.length ? [_jd.proposals[0].id] : []
    };
    if (z.shape === 'circle') {
        z.x = Math.round(cx);
        z.y = Math.round(cy);
        z.r = _jd.defRadius;
    } else {
        z.x = Math.round(cx - _jd.defW / 2);
        z.y = Math.round(cy - _jd.defH / 2);
        z.w = _jd.defW;
        z.h = _jd.defH;
    }
    _jd.zones.push(z);
    _jd.selZoneId = z.id;
    _jdUpdateZoneProps(z);
    _jdRedraw();
}

function _jdHitTest(cx, cy) {
    for (var i = _jd.zones.length - 1; i >= 0; i--) {
        var z = _jd.zones[i];
        if (z.shape === 'circle') {
            var dx = cx - z.x, dy = cy - z.y;
            if (Math.sqrt(dx * dx + dy * dy) <= z.r) return z;
        } else {
            if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return z;
        }
    }
    return null;
}

// ── Mode ───────────────────────────────────────────────────────

function jdSetMode(mode) {
    _jd.mode = mode;
    ['circle', 'rect', 'select'].forEach(function (m) {
        var btn = document.getElementById('jd-tool-' + m);
        if (btn) btn.classList.toggle('jd-tool-active', m === mode);
    });
    var canvas = document.getElementById('jd-canvas');
    if (canvas) canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
}

// ── Zone props panel ───────────────────────────────────────────

function _jdUpdateZoneProps(z) {
    var panel = document.getElementById('jd-zone-props');
    if (!panel) return;
    if (!z) { panel.style.display = 'none'; return; }
    panel.style.display = 'flex';
    document.getElementById('jd-zp-num').textContent = '#' + z.id;

    var circleBlock = document.getElementById('jd-zp-circle');
    var rectBlock   = document.getElementById('jd-zp-rect');
    circleBlock.style.display = z.shape === 'circle' ? '' : 'none';
    rectBlock.style.display   = z.shape === 'rect'   ? '' : 'none';

    if (z.shape === 'circle') {
        document.getElementById('jd-zp-cx').value = z.x;
        document.getElementById('jd-zp-cy').value = z.y;
        document.getElementById('jd-zp-cr').value = z.r;
    } else {
        document.getElementById('jd-zp-rx').value = z.x;
        document.getElementById('jd-zp-ry').value = z.y;
        document.getElementById('jd-zp-rw').value = z.w;
        document.getElementById('jd-zp-rh').value = z.h;
    }

    // Cases à cocher multi-sélection : une case par proposition
    var assignList = document.getElementById('jd-zp-assign-list');
    if (!assignList) return;
    var assignments = z.assignments || [];
    if (!_jd.proposals.length) {
        assignList.innerHTML = '<em style="font-size:.75rem;color:#94a3b8;">' + I18N.t('jd.no_proposals_short') + '</em>';
        return;
    }
    assignList.innerHTML = _jd.proposals.map(function (p) {
        var checked = assignments.indexOf(p.id) >= 0 ? ' checked' : '';
        return '<label class="jd-assign-cb">'
            + '<input type="checkbox" value="' + p.id + '"' + checked
            + ' onchange="jdZonePropChange()"> '
            + p.id + '. ' + htmlEsc(p.text || I18N.t('jd.prop_empty'))
            + '</label>';
    }).join('');
}

function jdZonePropChange() {
    var z = _jd.zones.find(function (z2) { return z2.id === _jd.selZoneId; });
    if (!z) return;
    if (z.shape === 'circle') {
        z.x = parseInt(document.getElementById('jd-zp-cx').value, 10) || 0;
        z.y = parseInt(document.getElementById('jd-zp-cy').value, 10) || 0;
        z.r = Math.max(5, parseInt(document.getElementById('jd-zp-cr').value, 10) || 20);
    } else {
        z.x = parseInt(document.getElementById('jd-zp-rx').value, 10) || 0;
        z.y = parseInt(document.getElementById('jd-zp-ry').value, 10) || 0;
        z.w = Math.max(10, parseInt(document.getElementById('jd-zp-rw').value, 10) || 40);
        z.h = Math.max(10, parseInt(document.getElementById('jd-zp-rh').value, 10) || 25);
    }
    // Lire les cases cochées (multi-sélection)
    var checked = document.querySelectorAll('#jd-zp-assign-list input[type="checkbox"]:checked');
    z.assignments = Array.prototype.map.call(checked, function (cb) { return parseInt(cb.value, 10); });
    _jdRedraw();
}

function jdDeleteSelectedZone() {
    if (_jd.selZoneId === null) return;
    _jd.zones = _jd.zones.filter(function (z) { return z.id !== _jd.selZoneId; });
    _jd.selZoneId = null;
    _jdUpdateZoneProps(null);
    _jdRedraw();
}

// ── Propositions ───────────────────────────────────────────────

function jdAddProposal() {
    _jd.proposals.push({ id: _jd.nextPropId++, text: '' });
    _jdRenderProposals();
    var selZ = _jd.zones.find(function (z) { return z.id === _jd.selZoneId; });
    if (selZ) _jdUpdateZoneProps(selZ);
}

function _jdRenderProposals() {
    var list = document.getElementById('jd-proposals-list');
    if (!list) return;
    if (!_jd.proposals.length) {
        list.innerHTML = '<p class="dd-empty-hint">' + I18N.t('jd.no_proposals_yet') + '</p>';
        return;
    }
    list.innerHTML = _jd.proposals.map(function (p) {
        return '<div class="dd-prop-row">'
            + '<span class="dd-prop-num">' + p.id + '</span>'
            + '<input class="dd-prop-input" type="text" value="' + htmlEsc(p.text) + '" '
            +   'placeholder="' + I18N.t('jd.proposal_ph') + '" '
            +   'oninput="jdPropTextChange(' + p.id + ', this.value)">'
            + '<button class="dd-prop-del" onclick="jdDeleteProposal(' + p.id + ')" title="Supprimer">✕</button>'
            + '</div>';
    }).join('');
}

function jdPropTextChange(id, val) {
    var p = _jd.proposals.find(function (p2) { return p2.id === id; });
    if (p) p.text = val;
    var selZ = _jd.zones.find(function (z) { return z.id === _jd.selZoneId; });
    if (selZ) _jdUpdateZoneProps(selZ);
}

function jdDeleteProposal(id) {
    _jd.proposals = _jd.proposals.filter(function (p) { return p.id !== id; });
    // Retirer l'id supprimé de tous les assignments
    _jd.zones.forEach(function (z) {
        z.assignments = (z.assignments || []).filter(function (a) { return a !== id; });
    });
    _jdRenderProposals();
    var selZ = _jd.zones.find(function (z) { return z.id === _jd.selZoneId; });
    if (selZ) _jdUpdateZoneProps(selZ);
}

// ── Reset ──────────────────────────────────────────────────────

function jdReset() {
    _jd.bgName = ''; _jd.bgData = ''; _jd.bgW = 0; _jd.bgH = 0; _jd.img = null;
    _jd.proposals = []; _jd.zones = [];
    _jd.nextPropId = 1; _jd.nextZoneId = 1;
    _jd.mode = 'circle'; _jd.selZoneId = null;

    var bgInput = document.getElementById('jd-bg-file');
    if (bgInput) bgInput.value = '';
    var imgInfo = document.getElementById('jd-img-info');
    if (imgInfo) imgInfo.textContent = '';
    var cw = document.getElementById('jd-canvas-wrap');
    if (cw) cw.style.display = 'none';
    var cp = document.getElementById('jd-canvas-placeholder');
    if (cp) cp.style.display = 'flex';

    _jdRenderProposals();
    _jdUpdateZoneProps(null);
    jdSetMode('circle');

    var bar = document.getElementById('jd-bareme');
    if (bar) bar.value = 1;
    setRichVal('jd-text', '');
    var zv = document.getElementById('jd-zones-visible');
    if (zv) zv.checked = true;
}

// ── Restore state ──────────────────────────────────────────────

function jdRestoreState(s) {
    jdReset();
    if (s.bgData) {
        _jd.bgName     = s.bgName || '';
        _jd.bgData     = s.bgData;
        _jd.bgW        = s.bgW   || 0;
        _jd.bgH        = s.bgH   || 0;
        _jd.proposals  = JSON.parse(JSON.stringify(s.proposals || []));
        _jd.zones      = JSON.parse(JSON.stringify(s.zones     || []));
        _jd.nextPropId = s.nextPropId || (_jd.proposals.length + 1);
        _jd.nextZoneId = s.nextZoneId || (_jd.zones.length + 1);
        var img = new Image();
        img.onload = function () {
            _jd.img = img;
            _jdSetupCanvas();
            _jdRedraw();
        };
        img.src = _jd.bgData;
    }
    var bar = document.getElementById('jd-bareme');
    if (bar) bar.value = s.bareme || 1;
    setRichVal('jd-text', s.text || '');
    var zv = document.getElementById('jd-zones-visible');
    if (zv) zv.checked = s.zonesVisible !== false;
    _jdRenderProposals();
}

// ── Expose ─────────────────────────────────────────────────────

window.jdHandleImageUpload  = jdHandleImageUpload;
window.jdCanvasClick        = jdCanvasClick;
window.jdSetMode            = jdSetMode;
window.jdAddProposal        = jdAddProposal;
window.jdPropTextChange     = jdPropTextChange;
window.jdDeleteProposal     = jdDeleteProposal;
window.jdZonePropChange     = jdZonePropChange;
window.jdDeleteSelectedZone = jdDeleteSelectedZone;
window.jdReset              = jdReset;
window.jdRestoreState       = jdRestoreState;

})();
