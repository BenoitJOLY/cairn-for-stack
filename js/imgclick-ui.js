// ── IMGCLICK UI (mode séquence) ──────────────────────────────────
// Éditeur de zones invisibles pour "Sélection sur image" — mode séquence
// chronométrée. Modelé sur js/jxgdrop-ui.js : upload direct d'image,
// pose de zones au clic sur un canvas, ordre = ordre de la liste (drag).
// Zones stockées en coordonnées image (y depuis le haut) ; le générateur
// (js/gen-imgclick.js) convertit en coordonnées math JSXGraph (y vers le haut).

(function () {

var _ic = {
    bgName: '', bgData: '', bgW: 0, bgH: 0, img: null,
    zones: [],   // ordre du tableau = ordre de la séquence : [{id, shape:'circle'|'rect', x, y, r | x, y, w, h, label}]
    nextZoneId: 1,
    mode: 'circle',
    selZoneId: null,
    defRadius: 30,
    defW: 80, defH: 50,
    canvasScale: 1
};

window._icState = _ic;

var IC_MAX_UPLOAD_DIM = 1100;

function icHandleImageUpload(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    _ic.bgName = file.name;
    var reader = new FileReader();
    reader.onload = function (e) {
        var rawData = e.target.result;
        var img = new Image();
        img.onload = function () {
            var w = img.naturalWidth, h = img.naturalHeight;
            var scale = Math.min(1, IC_MAX_UPLOAD_DIM / Math.max(w, h));
            if (scale < 1) {
                var cw = Math.round(w * scale), ch = Math.round(h * scale);
                var off = document.createElement('canvas');
                off.width = cw; off.height = ch;
                off.getContext('2d').drawImage(img, 0, 0, cw, ch);
                var isPng = /image\/png/.test(file.type);
                _ic.bgData = off.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
                var img2 = new Image();
                img2.onload = function () {
                    _ic.bgW = cw; _ic.bgH = ch; _ic.img = img2;
                    _icSetupCanvas();
                    _icRedraw();
                    if (typeof icRefreshPreview === 'function') icRefreshPreview();
                };
                img2.src = _ic.bgData;
            } else {
                _ic.bgData = rawData;
                _ic.bgW = w; _ic.bgH = h; _ic.img = img;
                _icSetupCanvas();
                _icRedraw();
                if (typeof icRefreshPreview === 'function') icRefreshPreview();
            }
        };
        img.src = rawData;
    };
    reader.readAsDataURL(file);
}

function _icSetupCanvas() {
    var canvas = document.getElementById('ic-seq-canvas');
    if (!canvas) return;
    var maxW = 680, maxH = 440;
    var scale = Math.min(1, maxW / _ic.bgW, maxH / _ic.bgH);
    _ic.canvasScale = scale;
    canvas.width  = Math.round(_ic.bgW * scale);
    canvas.height = Math.round(_ic.bgH * scale);
    var info = document.getElementById('ic-seq-img-info');
    if (info) info.textContent = _ic.bgName + ' — ' + _ic.bgW + ' × ' + _ic.bgH + ' px';
    document.getElementById('ic-seq-canvas-wrap').style.display = 'block';
    document.getElementById('ic-seq-canvas-placeholder').style.display = 'none';
}

function _icRedraw() {
    var canvas = document.getElementById('ic-seq-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (_ic.img) ctx.drawImage(_ic.img, 0, 0, canvas.width, canvas.height);
    var s = _ic.canvasScale;

    _ic.zones.forEach(function (z, i) {
        var isSel = (z.id === _ic.selZoneId);
        ctx.save();
        ctx.strokeStyle = isSel ? '#f59e0b' : '#0d9488';
        ctx.lineWidth   = isSel ? 3 : 2;
        ctx.fillStyle   = isSel ? 'rgba(245,158,11,.25)' : 'rgba(13,148,136,.15)';
        ctx.beginPath();
        if (z.shape === 'circle') {
            ctx.arc(z.x * s, z.y * s, z.r * s, 0, 2 * Math.PI);
        } else {
            ctx.rect(z.x * s, z.y * s, z.w * s, z.h * s);
        }
        ctx.fill();
        ctx.stroke();

        var lx = z.shape === 'circle' ? z.x * s : (z.x + z.w / 2) * s;
        var ly = z.shape === 'circle' ? z.y * s : (z.y + z.h / 2) * s;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(String(i + 1), lx, ly);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(i + 1), lx, ly);
        ctx.restore();
    });
}

function _icIsSingleMode() {
    var el = document.querySelector('input[name="ic-mode"]:checked');
    return !el || el.value === 'single';
}

function icCanvasClick(e) {
    if (!_ic.img) { if (typeof toast === 'function') toast(I18N.t('ic.err_no_image')); return; }
    var canvas = document.getElementById('ic-seq-canvas');
    var rect = canvas.getBoundingClientRect();
    var cx = (e.clientX - rect.left) / _ic.canvasScale;
    var cy = (e.clientY - rect.top)  / _ic.canvasScale;

    if (_ic.mode === 'select') {
        var hit = _icHitTest(cx, cy);
        _ic.selZoneId = hit ? hit.id : null;
        _icUpdateZoneProps(hit);
        _icRedraw();
        return;
    }

    if (_icIsSingleMode() && _ic.zones.length >= 1) {
        // Zone unique : un nouveau clic déplace la zone existante au lieu d'en ajouter une.
        var z0 = _ic.zones[0];
        z0.shape = _ic.mode === 'rect' ? 'rect' : 'circle';
        if (z0.shape === 'circle') {
            z0.x = Math.round(cx); z0.y = Math.round(cy); z0.r = _ic.defRadius;
            delete z0.w; delete z0.h;
        } else {
            z0.x = Math.round(cx - _ic.defW / 2); z0.y = Math.round(cy - _ic.defH / 2);
            z0.w = _ic.defW; z0.h = _ic.defH;
            delete z0.r;
        }
        _ic.selZoneId = z0.id;
        _icUpdateZoneProps(z0);
        _icRenderOrderList();
        _icRedraw();
        if (typeof icRefreshPreview === 'function') icRefreshPreview();
        return;
    }

    var z = {
        id: _ic.nextZoneId++,
        shape: _ic.mode === 'rect' ? 'rect' : 'circle',
        label: ''
    };
    if (z.shape === 'circle') {
        z.x = Math.round(cx);
        z.y = Math.round(cy);
        z.r = _ic.defRadius;
    } else {
        z.x = Math.round(cx - _ic.defW / 2);
        z.y = Math.round(cy - _ic.defH / 2);
        z.w = _ic.defW;
        z.h = _ic.defH;
    }
    _ic.zones.push(z);
    _ic.selZoneId = z.id;
    _icUpdateZoneProps(z);
    _icRenderOrderList();
    _icRedraw();
    if (typeof icRefreshPreview === 'function') icRefreshPreview();
    setTimeout(function () {
        var nameInput = document.getElementById('ic-seq-zp-name');
        if (nameInput) nameInput.focus();
    }, 0);
}

function _icHitTest(cx, cy) {
    for (var i = _ic.zones.length - 1; i >= 0; i--) {
        var z = _ic.zones[i];
        if (z.shape === 'circle') {
            var dx = cx - z.x, dy = cy - z.y;
            if (Math.sqrt(dx * dx + dy * dy) <= z.r) return z;
        } else {
            if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return z;
        }
    }
    return null;
}

function icSetMode(mode) {
    _ic.mode = mode;
    ['circle', 'rect', 'select'].forEach(function (m) {
        var btn = document.getElementById('ic-seq-tool-' + m);
        if (btn) btn.classList.toggle('jd-tool-active', m === mode);
    });
    var canvas = document.getElementById('ic-seq-canvas');
    if (canvas) canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
}

function _icUpdateZoneProps(z) {
    var panel = document.getElementById('ic-seq-zone-props');
    if (!panel) return;
    if (!z) { panel.style.display = 'none'; return; }
    panel.style.display = 'flex';
    document.getElementById('ic-seq-zp-num').textContent = '#' + (_ic.zones.indexOf(z) + 1);
    document.getElementById('ic-seq-zp-name').value = z.label || '';

    var circleBlock = document.getElementById('ic-seq-zp-circle');
    var rectBlock   = document.getElementById('ic-seq-zp-rect');
    circleBlock.style.display = z.shape === 'circle' ? '' : 'none';
    rectBlock.style.display   = z.shape === 'rect'   ? '' : 'none';

    if (z.shape === 'circle') {
        document.getElementById('ic-seq-zp-cx').value = z.x;
        document.getElementById('ic-seq-zp-cy').value = z.y;
        document.getElementById('ic-seq-zp-cr').value = z.r;
    } else {
        document.getElementById('ic-seq-zp-rx').value = z.x;
        document.getElementById('ic-seq-zp-ry').value = z.y;
        document.getElementById('ic-seq-zp-rw').value = z.w;
        document.getElementById('ic-seq-zp-rh').value = z.h;
    }
}

function icZonePropChange() {
    var z = _ic.zones.find(function (z2) { return z2.id === _ic.selZoneId; });
    if (!z) return;
    z.label = document.getElementById('ic-seq-zp-name').value;
    if (z.shape === 'circle') {
        z.x = parseInt(document.getElementById('ic-seq-zp-cx').value, 10) || 0;
        z.y = parseInt(document.getElementById('ic-seq-zp-cy').value, 10) || 0;
        z.r = Math.max(5, parseInt(document.getElementById('ic-seq-zp-cr').value, 10) || 20);
    } else {
        z.x = parseInt(document.getElementById('ic-seq-zp-rx').value, 10) || 0;
        z.y = parseInt(document.getElementById('ic-seq-zp-ry').value, 10) || 0;
        z.w = Math.max(10, parseInt(document.getElementById('ic-seq-zp-rw').value, 10) || 40);
        z.h = Math.max(10, parseInt(document.getElementById('ic-seq-zp-rh').value, 10) || 25);
    }
    _icRenderOrderList();
    _icRedraw();
    if (typeof icRefreshPreview === 'function') icRefreshPreview();
}

function icDeleteSelectedZone() {
    if (_ic.selZoneId === null) return;
    _ic.zones = _ic.zones.filter(function (z) { return z.id !== _ic.selZoneId; });
    _ic.selZoneId = null;
    _icUpdateZoneProps(null);
    _icRenderOrderList();
    _icRedraw();
    if (typeof icRefreshPreview === 'function') icRefreshPreview();
}

function icSelectZone(id) {
    var z = _ic.zones.find(function (z2) { return z2.id === id; });
    _ic.selZoneId = z ? z.id : null;
    icSetMode('select');
    _icUpdateZoneProps(z);
    _icRedraw();
}

function icDeleteZone(id) {
    _ic.zones = _ic.zones.filter(function (z) { return z.id !== id; });
    if (_ic.selZoneId === id) { _ic.selZoneId = null; _icUpdateZoneProps(null); }
    _icRenderOrderList();
    _icRedraw();
    if (typeof icRefreshPreview === 'function') icRefreshPreview();
}

// ── Liste ordonnée (glisser pour réordonner la séquence) ──────────

function _icRenderOrderList() {
    var list = document.getElementById('ic-seq-order-list');
    if (!list) return;
    if (!_ic.zones.length) {
        list.innerHTML = '<p class="dd-empty-hint" data-i18n="ic.seq_no_zones">Aucune zone. Cliquez sur l\'image ci-dessus pour en poser.</p>';
        if (typeof I18N !== 'undefined' && I18N.walk) I18N.walk(list);
        return;
    }
    list.innerHTML = _ic.zones.map(function (z, i) {
        var label = z.label && z.label.trim() ? z.label.trim() : ('Zone ' + (i + 1));
        var isSel = z.id === _ic.selZoneId;
        return '<div class="ic-seq-order-row' + (isSel ? ' ic-seq-order-row-sel' : '') + '" draggable="true" data-zid="' + z.id + '" onclick="icSelectZone(' + z.id + ')">'
            + '<span class="ord-handle" title="Glisser pour réordonner">⠿</span>'
            + '<span class="ord-num">' + (i + 1) + '.</span>'
            + '<span class="ic-seq-order-label">' + htmlEsc(label) + '</span>'
            + '<span class="ic-seq-order-shape">' + (z.shape === 'circle' ? '○' : '□') + '</span>'
            + '<button class="btn-del" onclick="event.stopPropagation();icDeleteZone(' + z.id + ')" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>'
            + '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.ic-seq-order-row'), _icWireOrderDrag);
}

var _icOrderDragEl = null;
function _icWireOrderDrag(row) {
    row.addEventListener('dragstart', function () {
        _icOrderDragEl = row;
        row.classList.add('ord-dragging');
    });
    row.addEventListener('dragend', function () {
        row.classList.remove('ord-dragging');
        _icOrderDragEl = null;
    });
    row.addEventListener('dragover', function (e) { e.preventDefault(); });
    row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!_icOrderDragEl || _icOrderDragEl === row) return;
        var fromId = parseInt(_icOrderDragEl.dataset.zid, 10);
        var toId   = parseInt(row.dataset.zid, 10);
        var fromIdx = _ic.zones.findIndex(function (z) { return z.id === fromId; });
        var toIdx   = _ic.zones.findIndex(function (z) { return z.id === toId; });
        if (fromIdx < 0 || toIdx < 0) return;
        var moved = _ic.zones.splice(fromIdx, 1)[0];
        _ic.zones.splice(toIdx, 0, moved);
        _icRenderOrderList();
        _icRedraw();
        if (typeof icRefreshPreview === 'function') icRefreshPreview();
    });
}

// ── Reset / restore ────────────────────────────────────────────

function icReset() {
    _ic.bgName = ''; _ic.bgData = ''; _ic.bgW = 0; _ic.bgH = 0; _ic.img = null;
    _ic.zones = []; _ic.nextZoneId = 1; _ic.mode = 'circle'; _ic.selZoneId = null;

    var bgInput = document.getElementById('ic-seq-bg-file');
    if (bgInput) bgInput.value = '';
    var imgInfo = document.getElementById('ic-seq-img-info');
    if (imgInfo) imgInfo.textContent = '';
    var cw = document.getElementById('ic-seq-canvas-wrap');
    if (cw) cw.style.display = 'none';
    var cp = document.getElementById('ic-seq-canvas-placeholder');
    if (cp) cp.style.display = 'flex';

    _icRenderOrderList();
    _icUpdateZoneProps(null);
    icSetMode('circle');
}

function icRestoreState(s) {
    icReset();
    if (s.bgData) {
        _ic.bgName     = s.bgName || '';
        _ic.bgData     = s.bgData;
        _ic.bgW        = s.bgW || 0;
        _ic.bgH        = s.bgH || 0;
        _ic.zones      = JSON.parse(JSON.stringify(s.zones || []));
        _ic.nextZoneId = s.nextZoneId || (_ic.zones.length + 1);
        var img = new Image();
        img.onload = function () {
            _ic.img = img;
            _icSetupCanvas();
            _icRedraw();
        };
        img.src = _ic.bgData;
    }
    _icRenderOrderList();
}

// ── Expose ─────────────────────────────────────────────────────

window.icHandleImageUpload  = icHandleImageUpload;
window.icCanvasClick        = icCanvasClick;
window.icSetMode            = icSetMode;
window.icZonePropChange     = icZonePropChange;
window.icDeleteSelectedZone = icDeleteSelectedZone;
window.icSelectZone         = icSelectZone;
window.icDeleteZone         = icDeleteZone;
window.icReset              = icReset;
window.icRestoreState       = icRestoreState;

})();
