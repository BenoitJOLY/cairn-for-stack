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

// ── IMGSLIDESHOW UI — "Diaporama chronométré" ──────────────────────
// Deux listes indépendantes :
//  - galerie d'images (état tableau, cf. js/imgclick-ui.js) : upload multiple,
//    vignettes, réordonnable par glisser (ordre = ordre du diaporama).
//  - propositions (lignes DOM directement, cf. addOrdRow/js/prop-rows.js) :
//    un champ texte par ligne + un radio partagé (une seule "bonne" réponse).

(function () {

var _imsl = {
    images: [],   // ordre = ordre du diaporama : [{id, name, data, w, h}]
    nextImageId: 1
};

window._imslState = _imsl;

var IMSL_MAX_UPLOAD_DIM = 900;

// ── Galerie d'images ───────────────────────────────────────────

function imslHandleImageUpload(input) {
    var files = input.files;
    if (!files || !files.length) return;
    Array.prototype.forEach.call(files, function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var rawData = e.target.result;
            var img = new Image();
            img.onload = function () {
                var w = img.naturalWidth, h = img.naturalHeight;
                var scale = Math.min(1, IMSL_MAX_UPLOAD_DIM / Math.max(w, h));
                var data = rawData, fw = w, fh = h;
                if (scale < 1) {
                    fw = Math.round(w * scale); fh = Math.round(h * scale);
                    var off = document.createElement('canvas');
                    off.width = fw; off.height = fh;
                    off.getContext('2d').drawImage(img, 0, 0, fw, fh);
                    var isPng = /image\/png/.test(file.type);
                    data = off.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
                }
                _imsl.images.push({ id: _imsl.nextImageId++, name: file.name, data: data, w: fw, h: fh });
                _imslRenderGallery();
                if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
            };
            img.src = rawData;
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function imslDeleteImage(id) {
    _imsl.images = _imsl.images.filter(function (im) { return im.id !== id; });
    _imslRenderGallery();
    if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
}

function _imslRenderGallery() {
    var list = document.getElementById('imsl-gallery-list');
    if (!list) return;
    if (!_imsl.images.length) {
        list.innerHTML = '<p class="dd-empty-hint" data-i18n="imsl.no_images">Aucune image. Ajoutez au moins deux images pour former le diaporama.</p>';
        if (typeof I18N !== 'undefined' && I18N.walk) I18N.walk(list);
        return;
    }
    list.innerHTML = _imsl.images.map(function (im, i) {
        return '<div class="imsl-gallery-row ord-row" draggable="true" data-imid="' + im.id + '">'
            + '<span class="ord-handle" title="' + I18N.t('ord.drag_hint') + '">⠿</span>'
            + '<span class="ord-num">' + (i + 1) + '.</span>'
            + '<img src="' + im.data + '" class="imsl-gallery-thumb" alt="">'
            + '<span class="imsl-gallery-name">' + htmlEsc(im.name || '') + '</span>'
            + '<button class="btn-del" onclick="imslDeleteImage(' + im.id + ')" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>'
            + '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.imsl-gallery-row'), _imslWireGalleryDrag);
}

var _imslGalleryDragEl = null;
function _imslWireGalleryDrag(row) {
    row.addEventListener('dragstart', function () {
        _imslGalleryDragEl = row;
        row.classList.add('ord-dragging');
    });
    row.addEventListener('dragend', function () {
        row.classList.remove('ord-dragging');
        _imslGalleryDragEl = null;
    });
    row.addEventListener('dragover', function (e) { e.preventDefault(); });
    row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!_imslGalleryDragEl || _imslGalleryDragEl === row) return;
        var fromId = parseInt(_imslGalleryDragEl.dataset.imid, 10);
        var toId   = parseInt(row.dataset.imid, 10);
        var fromIdx = _imsl.images.findIndex(function (im) { return im.id === fromId; });
        var toIdx   = _imsl.images.findIndex(function (im) { return im.id === toId; });
        if (fromIdx < 0 || toIdx < 0) return;
        var moved = _imsl.images.splice(fromIdx, 1)[0];
        _imsl.images.splice(toIdx, 0, moved);
        _imslRenderGallery();
        if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
    });
}

// ── Propositions (lignes DOM, une seule marquée "correcte") ────────

function addImslPropRow(text, isCorrect) {
    text = text || '';
    var id = uid();

    var div = document.createElement('div');
    div.id = 'imslpr' + id;
    div.className = 'imsl-prop-row ord-row';
    div.draggable = true;
    div.innerHTML =
        '<span class="ord-handle" title="' + I18N.t('ord.drag_hint') + '">⠿</span>'
        + '<span class="ord-num"></span>'
        + '<input type="radio" name="imsl-correct-prop" class="imsl-prop-correct" value="' + id + '"' + (isCorrect ? ' checked' : '') + ' title="' + I18N.t('imsl.mark_correct') + '" onchange="if(typeof imslRefreshPreview===\'function\')imslRefreshPreview();">'
        + '<input type="text" class="ord-item-text imsl-prop-text" value="' + attrEsc(text) + '" placeholder="' + I18N.t('imsl.prop_ph') + '" oninput="if(typeof imslRefreshPreview===\'function\')imslRefreshPreview();">'
        + '<button class="btn-del" onclick="imslDeletePropRow(' + id + ')" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>';

    document.getElementById('imsl-props-items').appendChild(div);
    _imslWirePropDrag(div);
    _imslRenumberProps();
    if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
}

function imslDeletePropRow(id) {
    var el = document.getElementById('imslpr' + id);
    if (el) el.remove();
    _imslRenumberProps();
    if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
}

function _imslRenumberProps() {
    document.querySelectorAll('#imsl-props-items .imsl-prop-row').forEach(function (r, i) {
        var numEl = r.querySelector('.ord-num');
        if (numEl) numEl.textContent = (i + 1) + '.';
    });
}

var _imslPropDragEl = null;
function _imslWirePropDrag(row) {
    row.addEventListener('dragstart', function (e) {
        _imslPropDragEl = row;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('ord-dragging');
    });
    row.addEventListener('dragend', function () {
        row.classList.remove('ord-dragging');
        _imslPropDragEl = null;
    });
    row.addEventListener('dragover', function (e) { e.preventDefault(); });
    row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!_imslPropDragEl || _imslPropDragEl === row) return;
        var container = document.getElementById('imsl-props-items');
        var rows = Array.from(container.querySelectorAll('.imsl-prop-row'));
        var fromIdx = rows.indexOf(_imslPropDragEl), toIdx = rows.indexOf(row);
        if (fromIdx < toIdx) container.insertBefore(_imslPropDragEl, row.nextSibling);
        else container.insertBefore(_imslPropDragEl, row);
        _imslRenumberProps();
        if (typeof imslRefreshPreview === 'function') imslRefreshPreview();
    });
}

// ── Reset / restore ────────────────────────────────────────────

function imslReset() {
    _imsl.images = []; _imsl.nextImageId = 1;
    var galInput = document.getElementById('imsl-gallery-file');
    if (galInput) galInput.value = '';
    _imslRenderGallery();
    var propsList = document.getElementById('imsl-props-items');
    if (propsList) propsList.innerHTML = '';
    addImslPropRow('', true);
    addImslPropRow('', false);
}

function imslRestoreState(s) {
    imslReset();
    _imsl.images = JSON.parse(JSON.stringify((s && s.images) || []));
    _imsl.nextImageId = (s && s.nextImageId) || (_imsl.images.length + 1);
    _imslRenderGallery();

    var propsList = document.getElementById('imsl-props-items');
    if (propsList) propsList.innerHTML = '';
    ((s && s.props) || []).forEach(function (p) {
        addImslPropRow(p.text, !!p.correct);
    });
    if (!propsList || !propsList.children.length) {
        addImslPropRow('', true);
        addImslPropRow('', false);
    }
}

// ── Expose ─────────────────────────────────────────────────────

window.imslHandleImageUpload = imslHandleImageUpload;
window.imslDeleteImage       = imslDeleteImage;
window.addImslPropRow        = addImslPropRow;
window.imslDeletePropRow     = imslDeletePropRow;
window.imslReset             = imslReset;
window.imslRestoreState      = imslRestoreState;

})();
