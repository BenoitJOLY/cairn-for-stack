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

/* ══════════════════════════════════════════════════════════════
   CAIRN FOR STACK — Cinématique du point : atelier de digitalisation.
   L'enseignant pointe lui-même les positions M0, M1, M2… (chronopho-
   tographie), sur un fond neutre OU sur une image importée servant
   uniquement de guide visuel transitoire — voir js/gen-image-mesure.js
   (immLoadImage/immOnImageClick, calibrage à 2 clics) et
   js/imgclick-ui.js (icCanvasClick, _icRedraw, liste ordonnée) dont
   ce fichier reprend le patron. Divergence volontaire et FERME
   (contrainte explicite de l'utilisateur) : l'image n'est **jamais**
   conservée — ni dans _cinAtelier au-delà de la session d'édition, ni
   dans cinGetAtelierState() (donc jamais dans captureState_cinematique
   ni dans le XML exporté). Seuls les points (nombres) et la
   calibration (nombres) survivent.

   Le canvas de pointage a une taille FIXE (CIN_CANVAS_W×CIN_CANVAS_H) :
   l'image importée, quelle que soit sa résolution, est toujours
   redessinée en plein cadre dans ce canvas fixe (comme
   immBuildBoardJS). Ainsi les coordonnées des points cliqués restent
   dans un repère pixel stable, indépendant du chargement/retrait de
   l'image — retirer l'image ne déplace jamais les points déjà posés.
   ══════════════════════════════════════════════════════════════ */

var CIN_CANVAS_W = 700, CIN_CANVAS_H = 460;
var CIN_MAX_UPLOAD_DIM = 900;
var CIN_HIT_RADIUS = 12;

var _cinAtelier = {
  bgData: '', bgW: 0, bgH: 0, img: null,   // jamais persisté (voir cinGetAtelierState)
  points: [],                               // [{x,y}, ...] pixel canvas, index = ordre = i
  calib: null,                              // {x1,y1,x2,y2,realDist} | null
  mode: 'points',                           // 'points' | 'calib' | 'select'
  calibStage: 0,                            // 0 = attend le 1er repère, 1 = attend le 2e
  selIdx: -1
};

function cinNotifyPreview() {
  if (typeof window.cinRefreshPreview === 'function') window.cinRefreshPreview();
}

// ── Image (transitoire, jamais persistée) ──────────────────────────
function cinAtelierLoadImage(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      var scale = Math.min(1, CIN_MAX_UPLOAD_DIM / Math.max(w, h));
      var cw = Math.round(w * scale), ch = Math.round(h * scale);
      var off = document.createElement('canvas');
      off.width = cw; off.height = ch;
      off.getContext('2d').drawImage(img, 0, 0, cw, ch);
      var isPng = /image\/png/.test(file.type);
      var dataUrl = off.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
      var img2 = new Image();
      img2.onload = function () {
        _cinAtelier.bgData = dataUrl; _cinAtelier.bgW = cw; _cinAtelier.bgH = ch; _cinAtelier.img = img2;
        var rm = document.getElementById('cin-atelier-remove-img');
        if (rm) rm.style.display = '';
        _cinRedraw();
      };
      img2.src = dataUrl;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function cinAtelierRemoveImage() {
  _cinAtelier.bgData = ''; _cinAtelier.bgW = 0; _cinAtelier.bgH = 0; _cinAtelier.img = null;
  var input = document.getElementById('cin-atelier-img-file');
  if (input) input.value = '';
  var rm = document.getElementById('cin-atelier-remove-img');
  if (rm) rm.style.display = 'none';
  _cinRedraw();
}

// ── Modes ────────────────────────────────────────────────────────
function cinSetMode(mode) {
  _cinAtelier.mode = mode;
  _cinAtelier.calibStage = 0;
  ['points', 'calib', 'select'].forEach(function (m) {
    var btn = document.getElementById('cin-atelier-tool-' + m);
    if (btn) btn.classList.toggle('jd-tool-active', m === mode);
  });
  var hint = document.getElementById('cin-atelier-hint');
  if (hint) {
    if (mode === 'points') hint.textContent = I18N.t('cin.hint_points', { n: _cinAtelier.points.length });
    else if (mode === 'calib') hint.textContent = I18N.t('cin.hint_calib1');
    else hint.textContent = I18N.t('cin.hint_select');
  }
  var canvas = document.getElementById('cin-atelier-canvas');
  if (canvas) canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
}

function _cinCanvasCoords(e, canvas) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function _cinHitTestPoint(cx, cy) {
  for (var i = _cinAtelier.points.length - 1; i >= 0; i--) {
    var p = _cinAtelier.points[i];
    if (Math.hypot(cx - p.x, cy - p.y) <= CIN_HIT_RADIUS) return i;
  }
  return -1;
}

function cinAtelierCanvasClick(e) {
  var canvas = document.getElementById('cin-atelier-canvas');
  if (!canvas) return;
  var c = _cinCanvasCoords(e, canvas);

  if (_cinAtelier.mode === 'points') {
    _cinAtelier.points.push({ x: Math.round(c.x), y: Math.round(c.y) });
    _cinRenderPointList();
    _cinRedraw();
    cinNotifyPreview();
    var hint = document.getElementById('cin-atelier-hint');
    if (hint) hint.textContent = I18N.t('cin.hint_points', { n: _cinAtelier.points.length });
    return;
  }

  if (_cinAtelier.mode === 'calib') {
    var hint2 = document.getElementById('cin-atelier-hint');
    if (_cinAtelier.calibStage === 0) {
      _cinAtelier.calib = { x1: Math.round(c.x), y1: Math.round(c.y), x2: 0, y2: 0, realDist: (_cinAtelier.calib && _cinAtelier.calib.realDist) || 1 };
      _cinAtelier.calibStage = 1;
      if (hint2) hint2.textContent = I18N.t('cin.hint_calib2');
    } else {
      _cinAtelier.calib.x2 = Math.round(c.x); _cinAtelier.calib.y2 = Math.round(c.y);
      _cinAtelier.calibStage = 0;
      if (hint2) hint2.textContent = I18N.t('cin.hint_calib_done');
    }
    _cinRedraw();
    _cinUpdateEchelleInfo();
    cinNotifyPreview();
    return;
  }

  if (_cinAtelier.mode === 'select') {
    _cinAtelier.selIdx = _cinHitTestPoint(c.x, c.y);
    _cinRenderPointList();
    _cinRedraw();
  }
}

// ── Liste des points ─────────────────────────────────────────────
function _cinRenderPointList() {
  var list = document.getElementById('cin-atelier-point-list');
  if (!list) return;
  if (!_cinAtelier.points.length) {
    list.innerHTML = '<p class="dd-empty-hint">' + I18N.t('cin.point_list_empty') + '</p>';
    return;
  }
  list.innerHTML = _cinAtelier.points.map(function (p, i) {
    var isSel = i === _cinAtelier.selIdx;
    return '<div class="ic-seq-order-row' + (isSel ? ' ic-seq-order-row-sel' : '') + '">'
      + '<span class="ord-num">M' + i + '</span>'
      + '<span class="ic-seq-order-label">(' + p.x + ', ' + p.y + ') px</span>'
      + '<button class="btn-del" onclick="cinAtelierDeletePoint(' + i + ')" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>'
      + '</div>';
  }).join('');
}

function cinAtelierDeletePoint(i) {
  _cinAtelier.points.splice(i, 1);
  if (_cinAtelier.selIdx === i) _cinAtelier.selIdx = -1;
  _cinRenderPointList();
  _cinRedraw();
  cinNotifyPreview();
}

// ── Échelle déduite (info live) ──────────────────────────────────
function _cinUpdateEchelleInfo() {
  var info = document.getElementById('cin-atelier-echelle-info');
  if (!info) return;
  var c = _cinAtelier.calib;
  if (!c || _cinAtelier.calibStage === 1) { info.textContent = ''; return; }
  var pxDist = Math.hypot(c.x2 - c.x1, c.y2 - c.y1);
  if (pxDist <= 0 || !(c.realDist > 0)) { info.textContent = ''; return; }
  var echelle = c.realDist / pxDist;
  info.textContent = I18N.t('cin.echelle_deduite', { echelle: echelle.toFixed(4), px: Math.round(pxDist), m: c.realDist });
}

function cinAtelierSetCalibDist(val) {
  var d = parseFloat(val);
  if (!_cinAtelier.calib) _cinAtelier.calib = { x1: 0, y1: 0, x2: 0, y2: 0, realDist: 1 };
  _cinAtelier.calib.realDist = (!isNaN(d) && d > 0) ? d : 1;
  _cinUpdateEchelleInfo();
  cinNotifyPreview();
}

// ── Rendu canvas ──────────────────────────────────────────────────
function _cinRedraw() {
  var canvas = document.getElementById('cin-atelier-canvas');
  if (!canvas) return;
  canvas.width = CIN_CANVAS_W; canvas.height = CIN_CANVAS_H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (_cinAtelier.img) {
    ctx.drawImage(_cinAtelier.img, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    for (var gx = 0; gx <= canvas.width; gx += 35) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke(); }
    for (var gy = 0; gy <= canvas.height; gy += 35) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke(); }
  }

  // Calibration (repères cyan reliés par un trait pointillé)
  var c = _cinAtelier.calib;
  if (c) {
    ctx.save();
    ctx.strokeStyle = '#0891b2'; ctx.fillStyle = '#0891b2';
    [{ x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }].forEach(function (pt, idx) {
      if (idx === 1 && _cinAtelier.calibStage === 1) return; // 2e repère pas encore posé
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pt.x - 10, pt.y); ctx.lineTo(pt.x + 10, pt.y); ctx.moveTo(pt.x, pt.y - 10); ctx.lineTo(pt.x, pt.y + 10); ctx.stroke();
    });
    if (_cinAtelier.calibStage === 0 && (c.x2 || c.y2)) {
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // Points M_i numérotés (rouge = sélectionné en mode select)
  _cinAtelier.points.forEach(function (p, i) {
    var isSel = i === _cinAtelier.selIdx;
    ctx.save();
    ctx.fillStyle = isSel ? '#dc2626' : '#0033aa';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, isSel ? 6.5 : 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.strokeText('M' + i, p.x + 8, p.y - 6);
    ctx.fillStyle = isSel ? '#dc2626' : '#0033aa';
    ctx.fillText('M' + i, p.x + 8, p.y - 6);
    ctx.restore();
  });
}

// ── État capturé/restauré (jamais bgData/bgW/bgH/img) ────────────
function cinGetAtelierState() {
  return {
    points: _cinAtelier.points.map(function (p) { return { x: p.x, y: p.y }; }),
    calib: _cinAtelier.calib ? Object.assign({}, _cinAtelier.calib) : null
  };
}

function cinSetAtelierState(s) {
  s = s || {};
  _cinAtelier.points = Array.isArray(s.points) ? JSON.parse(JSON.stringify(s.points)) : [];
  _cinAtelier.calib = s.calib ? Object.assign({}, s.calib) : null;
  _cinAtelier.bgData = ''; _cinAtelier.bgW = 0; _cinAtelier.bgH = 0; _cinAtelier.img = null;
  _cinAtelier.selIdx = -1; _cinAtelier.calibStage = 0;
  var rm = document.getElementById('cin-atelier-remove-img');
  if (rm) rm.style.display = 'none';
  var input = document.getElementById('cin-atelier-img-file');
  if (input) input.value = '';
  var distInput = document.getElementById('cin-calib-dist');
  if (distInput) distInput.value = _cinAtelier.calib ? _cinAtelier.calib.realDist : '';
  cinSetMode('points');
  _cinRenderPointList();
  _cinRedraw();
  _cinUpdateEchelleInfo();
}

function cinResetAtelier() {
  cinSetAtelierState({ points: [], calib: null });
}

// ── Wiring (Δt / i, comme l'existant : 'change' pour éviter de
//    recadrer le graphique à chaque frappe) ─────────────────────
function cinWireAtelier() {
  ['cin-dt', 'cin-iidx', 'cin-method'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && !el.dataset.wiredCin) {
      el.dataset.wiredCin = '1';
      el.addEventListener('input', function (e) { e.stopPropagation(); });
      el.addEventListener('change', cinNotifyPreview);
    }
  });
  var distInput = document.getElementById('cin-calib-dist');
  if (distInput && !distInput.dataset.wiredCin) {
    distInput.dataset.wiredCin = '1';
    distInput.addEventListener('input', function (e) { e.stopPropagation(); });
    distInput.addEventListener('change', function () { cinAtelierSetCalibDist(distInput.value); });
  }
  if (!_cinAtelier.points.length && !_cinAtelier.calib) {
    cinSetMode('points');
    _cinRenderPointList();
    _cinRedraw();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cinGetAtelierState: cinGetAtelierState, cinSetAtelierState: cinSetAtelierState };
}
