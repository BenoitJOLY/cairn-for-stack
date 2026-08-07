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

// ── DOI UI + genDOI + VERIF TAG HELPERS ────────────────────────
// ════════════════════════════════════════════════════

// Gestion de l'interface DOI
function doiInitUI(){
    const list = document.getElementById('doi-objects-list');
    list.innerHTML = '';
    // Ajout d'objets par défaut
    doiAddRow(I18N.t('doi.default_obj_terre'), 'gravitationnel');
    doiAddRow(I18N.t('doi.default_obj_air'), 'contact');
    doiAddRow(I18N.t('doi.default_obj_tremplin'), 'intrus');
    doiRefresh();
}

// Redessine le schéma de config ET l'aperçu élève (partie droite de la modale)
function doiRefresh(){
    doiDrawPreview();
    if(typeof window.doiRefreshPreview === 'function') window.doiRefreshPreview();
}

function doiAddRow(name='', type='contact'){
    const list = document.getElementById('doi-objects-list');
    const row = document.createElement('div');
    row.className = 'doi-obj-row';

    const sel = (val) => type === val ? 'selected' : '';

    row.innerHTML = `
        <input type="text" class="doi-input-name doi-name" placeholder="${I18N.t('tpl.doi_nom')}" value="${name}">
        <select class="doi-input-type doi-type" onchange="doiRefresh()" aria-label="${I18N.t('tpl.doi_type_lbl')}">
            <option value="gravitationnel" ${sel('gravitationnel')}>${I18N.t('tpl.doi_gravitationnel')}</option>
            <option value="magnetique" ${sel('magnetique')}>${I18N.t('tpl.doi_magnetique')}</option>
            <option value="contact" ${sel('contact')}>${I18N.t('tpl.doi_contact')}</option>
            <option value="intrus" ${sel('intrus')}>${I18N.t('tpl.doi_intrus_opt')}</option>
        </select>
        <button class="doi-btn-del" onclick="this.parentElement.remove(); doiRefresh()" aria-label="${I18N.t('btn.supprimer')}">✕</button>
    `;
    list.appendChild(row);
    row.querySelector('.doi-name').addEventListener('input', doiRefresh);
    doiRefresh();
}

// Logique de dessin (Preview HTML - Interface de création)
function doiDrawPreview(){
    const canvas = document.getElementById('doi-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const mainObj = document.getElementById('doi-main-obj').value || I18N.t('doi.default_main_obj_generic');
    const extraZones = parseInt(document.getElementById('doi-extra').value) || 0;

    const rows = document.querySelectorAll('.doi-obj-row');
    const objects = [];
    rows.forEach(r => {
        const n = r.querySelector('.doi-name').value.trim();
        const t = r.querySelector('.doi-type').value;
        if(n) objects.push({name: n, type: t});
    });

    const interacting = objects.filter(o => o.type !== 'intrus');
    const intrus = objects.filter(o => o.type === 'intrus');
    const totalBlue = interacting.length + extraZones;

    // Calcul layout
    let rx = 100, ry = 40; 
    const orbitRx = 310;
    const orbitRy = 195;
    
    if(totalBlue > 4) { rx = 85; ry = 35; }
    if(totalBlue > 6) { rx = 70; ry = 30; }
    if(totalBlue > 8) { rx = 60; ry = 25; }

    const centerX = 460, centerY = 270;

    // Clear
    ctx.clearRect(0, 0, 920, 650);

    // Zone Poubelle
    const binZone = { x: 210, y: 560, w: 500, h: 50 };
    ctx.fillStyle = '#94a3b8'; ctx.globalAlpha = 0.1; ctx.fillRect(binZone.x, binZone.y, binZone.w, binZone.h);
    ctx.globalAlpha = 1; ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([5, 5]); ctx.strokeRect(binZone.x, binZone.y, binZone.w, binZone.h); ctx.setLineDash([]);
    ctx.fillStyle = '#475569'; ctx.textAlign = 'center'; ctx.font = '14px Arial';
    ctx.fillText(intrus.map(o=>o.name).join(', ') || I18N.t('tpl.doi_aucun'), 460, binZone.y + 30);
    ctx.font = 'bold 14px Arial'; ctx.fillText(I18N.t('tpl.doi_hors_systeme'), 460, binZone.y + binZone.h + 20);

    // Zone Centrale
    ctx.beginPath(); ctx.ellipse(centerX, centerY, 140, 65, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#EC4899'; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#EC4899'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    ctx.fillText(mainObj, centerX, centerY + 5);

    // Zones Bleues
    for(let i = 0; i < totalBlue; i++) {
        const angle = (2 * Math.PI * i / totalBlue) - Math.PI/2;
        const bx = Math.round(centerX + orbitRx * Math.cos(angle));
        const by = Math.round(centerY + orbitRy * Math.sin(angle));

        ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#3B82F6'; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = '#1e293b'; ctx.font = (rx > 80 ? '15' : '13') + 'px Arial'; ctx.textAlign = 'center';
        if(i < interacting.length) {
            ctx.fillText(interacting[i].name, bx, by + 5);
            // Lien (Fleche)
            const isDashed = interacting[i].type !== 'contact';
            const p1x = centerX + 140 * Math.cos(angle);
            const p1y = centerY + 65 * Math.sin(angle);
            const p2x = bx - rx * Math.cos(angle);
            const p2y = by - ry * Math.sin(angle);

            ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = '#64748B'; ctx.lineWidth = 2;
            if(isDashed) ctx.setLineDash([8, 6]); 
            ctx.stroke(); ctx.setLineDash([]);

            const headlen = 12;
            const ang = Math.atan2(p2y - p1y, p2x - p1x);
            ctx.beginPath(); ctx.moveTo(p2x, p2y);
            ctx.lineTo(p2x - headlen * Math.cos(ang - Math.PI/6), p2y - headlen * Math.sin(ang - Math.PI/6));
            ctx.lineTo(p2x - headlen * Math.cos(ang + Math.PI/6), p2y - headlen * Math.sin(ang + Math.PI/6)); 
            ctx.closePath(); ctx.fillStyle = '#64748B'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(p1x, p1y);
            ctx.lineTo(p1x + headlen * Math.cos(ang - Math.PI/6), p1y + headlen * Math.sin(ang - Math.PI/6));
            ctx.lineTo(p1x + headlen * Math.cos(ang + Math.PI/6), p1y + headlen * Math.sin(ang + Math.PI/6)); 
            ctx.closePath(); ctx.fillStyle = '#64748B'; ctx.fill();
        } else {
            ctx.fillStyle = '#cbd5e1'; ctx.fillText(I18N.t('tpl.doi_vide'), bx, by + 5);
        }
    }
}

// ────── FONCTION : Image VIDE (Pour Énoncé Prévisualisation) ──────
function genDOIEmptyPreviewImage(config = null) {
    let mainObj, extraZones, objects;

    if (config) {
        mainObj = config.mainObj || I18N.t('doi.default_main_obj_generic');
        extraZones = config.extraZones || 0;
        objects = config.objects || [];
    } else {
        const mainObjInput = document.getElementById('doi-main-obj');
        const extraZonesInput = document.getElementById('doi-extra');
        mainObj = mainObjInput ? mainObjInput.value : I18N.t('doi.default_main_obj_generic');
        extraZones = extraZonesInput ? parseInt(extraZonesInput.value) : 0;
        const rows = document.querySelectorAll('.doi-obj-row');
        objects = [];
        rows.forEach(r => {
            const n = r.querySelector('.doi-name').value.trim();
            const t = r.querySelector('.doi-type').value;
            if(n) objects.push({ name: n, type: t });
        });
    }

    if (isNaN(extraZones)) { return '<div style="color:red">' + I18N.t('tpl.doi_erreur_zones') + '</div>'; }

    const interacting = objects.filter(o => o.type !== 'intrus');
    const totalBlue = interacting.length + extraZones;

    let rx = 100, ry = 40;
    const orbitRx = 310;
    const orbitRy = 195;
    if(totalBlue > 4) { rx = 85; ry = 35; }
    if(totalBlue > 6) { rx = 70; ry = 30; }
    if(totalBlue > 8) { rx = 60; ry = 25; }

    const centerX = 460, centerY = 270;
    const cRx = 140, cRy = 65;
    const bRx = 110, bRy = 45;
    const cvs = document.createElement('canvas');
    cvs.width = 920; cvs.height = 650;
    const c = cvs.getContext('2d');
    c.clearRect(0, 0, 920, 600);

    // Zone Poubelle (identique au rendu élève réel)
    const bin = { x: 210, y: 560, w: 500, h: 50 };
    c.fillStyle = '#94a3b8'; c.globalAlpha = 0.1; c.fillRect(bin.x, bin.y, bin.w, bin.h);
    c.globalAlpha = 1; c.strokeStyle = '#94a3b8'; c.setLineDash([5, 5]); c.strokeRect(bin.x, bin.y, bin.w, bin.h); c.setLineDash([]);
    c.font = 'bold 14px Arial'; c.fillStyle = '#475569'; c.textAlign = 'center';
    c.fillText(I18N.t('tpl.doi_hors_systeme'), 460, bin.y + bin.h + 20);

    // Zone Centrale + points d'ancrage (N/E/S/W, comme dans le script élève)
    c.beginPath(); c.ellipse(centerX, centerY, cRx, cRy, 0, 0, 2 * Math.PI);
    c.fillStyle = '#EC4899'; c.globalAlpha = 0.1; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = '#EC4899'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#1e293b'; c.font = 'bold 15px Arial'; c.textAlign = 'center';
    c.fillText(I18N.t('doi.zone_depot'), centerX, centerY + 5);
    const centerAnchors = [
        { x: centerX, y: centerY - cRy }, { x: centerX - cRx, y: centerY },
        { x: centerX + cRx, y: centerY }, { x: centerX, y: centerY + cRy }
    ];
    centerAnchors.forEach(p => { c.beginPath(); c.arc(p.x, p.y, 6, 0, 2 * Math.PI); c.fillStyle = '#000'; c.fill(); });

    // Zones Bleues + point d'ancrage (côté face au centre)
    for(let i = 0; i < totalBlue; i++) {
        const angle = (2 * Math.PI * i / totalBlue) - Math.PI/2;
        const bx = Math.round(centerX + orbitRx * Math.cos(angle));
        const by = Math.round(centerY + orbitRy * Math.sin(angle));

        c.beginPath(); c.ellipse(bx, by, rx, ry, 0, 0, 2 * Math.PI);
        c.fillStyle = '#3B82F6'; c.globalAlpha = 0.1; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = '#3B82F6'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#1e293b'; c.font = 'bold 15px Arial'; c.textAlign = 'center';
        c.fillText(I18N.t('doi.zone_depot'), bx, by + 5);

        const pX = Math.round(bx - bRx * Math.cos(angle));
        const pY = Math.round(by - bRy * Math.sin(angle));
        c.beginPath(); c.arc(pX, pY, 6, 0, 2 * Math.PI); c.fillStyle = '#000'; c.fill();
    }

    return `<img src="${cvs.toDataURL('image/png')}" alt="${I18N.t('tpl.doi_schema_vide_alt')}" style="display:block; margin:0 auto; border-radius:8px; border:1px solid #e2e8f0; max-width:100%; height:auto;">`;
}

// ────── FONCTION : Réplique statique de l'interface élève (Consigne + boutons + étiquettes + schéma) ──────
function genDOIStudentPreviewHTML(config = null) {
    let objects;
    if (config) {
        objects = config.objects || [];
    } else {
        const rows = document.querySelectorAll('.doi-obj-row');
        objects = [];
        rows.forEach(r => {
            const n = r.querySelector('.doi-name').value.trim();
            const t = r.querySelector('.doi-type').value;
            if(n) objects.push({ name: n, type: t });
        });
    }

    const chipsHTML = objects.map(o => `<span style="background:#1d4ed8;color:#fff;padding:8px 15px;border-radius:4px;font-weight:bold;display:inline-block;margin:4px;">${o.name}</span>`).join('');

    return `
<div style="background: #E0F2FE; border-left: 4px solid #0284C7; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
<p style="margin: 0 0 10px 0; font-weight: bold;">${I18N.t('doi.consigne_titre')}</p>
<ul style="margin: 0; padding-left: 20px;">
<li>${I18N.t('doi.consigne_systeme')}</li>
<li>${I18N.t('doi.consigne_interagissants')}</li>
<li>${I18N.t('doi.consigne_intrus')}</li>
<li>${I18N.t('doi.consigne_ancrage')}</li>
</ul>
</div>
<div style="margin-bottom: 15px; text-align: center; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
<label style="margin-right: 20px; font-weight: bold;"><input style="margin-right: 5px;" checked disabled type="radio"> ${I18N.t('doi.radio_contact')}</label>
<label style="font-weight: bold;"><input style="margin-right: 5px;" disabled type="radio"> ${I18N.t('doi.radio_distance')}</label>
</div>
<div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px; padding: 15px; background: #fff; border: 2px dashed #cbd5e1; border-radius: 8px; flex-wrap: wrap;">${chipsHTML}</div>
${genDOIEmptyPreviewImage(config)}`;
}

// ────── FONCTION : Image COMPLÈTE (Pour Feedback Prévisualisation) ──────
function genDOIFullPreviewImage(config = null) {
    let mainObj, extraZones, objects;

    if (config) {
        // On lit la config (données sauvegardées)
        mainObj = config.mainObj || "S0";
        extraZones = config.extraZones || 0;
        objects = config.objects || [];
    } else {
        // Lecture DOM (pour l'aperçu live dans l'outil)
        const mainObjInput = document.getElementById('doi-main-obj');
        const extraZonesInput = document.getElementById('doi-extra');
        
        mainObj = mainObjInput ? mainObjInput.value : I18N.t('doi.default_main_obj_generic');
        extraZones = extraZonesInput ? parseInt(extraZonesInput.value) : 0;
        
        const rows = document.querySelectorAll('.doi-obj-row');
        objects = [];
        rows.forEach(r => {
            const n = r.querySelector('.doi-name').value.trim();
            const t = r.querySelector('.doi-type').value;
            if(n) objects.push({ name: n, type: t });
        });
    }

    const interacting = objects.filter(o => o.type !== 'intrus');
    const intrus = objects.filter(o => o.type === 'intrus');
    const totalBlue = interacting.length + extraZones;

    let rx = 100, ry = 40;
    const orbitRx = 310;
    const orbitRy = 195;
    if(totalBlue > 4) { rx = 85; ry = 35; }
    if(totalBlue > 6) { rx = 70; ry = 30; }
    if(totalBlue > 8) { rx = 60; ry = 25; }
    const centerX = 460, centerY = 270;
    const cRx = 140, cRy = 65;
    const bRx = 110, bRy = 45;

    const cvs = document.createElement('canvas');
    cvs.width = 920; cvs.height = 650;
    const c = cvs.getContext('2d');
    c.clearRect(0, 0, 920, 600);

    // Zone Poubelle
    const bin = { x: 210, y: 560, w: 500, h: 50 };
    c.fillStyle = '#94a3b8'; c.globalAlpha = 0.1; c.fillRect(bin.x, bin.y, bin.w, bin.h);
    c.globalAlpha = 1; c.strokeStyle = '#94a3b8'; c.setLineDash([5, 5]); c.strokeRect(bin.x, bin.y, bin.w, bin.h); c.setLineDash([]);
    c.fillStyle = '#475569'; c.textAlign = 'center'; c.font = '14px Arial';
    c.fillText(intrus.map(o=>o.name).join(', ') || I18N.t('tpl.doi_aucun'), 460, bin.y + 30);
    c.font = 'bold 14px Arial'; c.fillText(I18N.t('tpl.doi_hors_systeme'), 460, bin.y + bin.h + 20);

    // Zone Centrale
    c.beginPath(); c.ellipse(centerX, centerY, cRx, cRy, 0, 0, 2 * Math.PI);
    c.fillStyle = '#EC4899'; c.globalAlpha = 0.1; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = '#EC4899'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#1e293b'; c.font = 'bold 16px Arial'; c.textAlign = 'center';
    c.fillText(mainObj, centerX, centerY + 5);

    const centerAnchors = [
        { x: centerX, y: centerY - cRy }, { x: centerX - cRx, y: centerY },
        { x: centerX + cRx, y: centerY }, { x: centerX, y: centerY + cRy }
    ];
    const usedCenterAnchors = new Set();

    // Zones Bleues + Flèches (couleurs et pointillés identiques au schéma élève réel)
    const drawArrow = (p1, p2, color, dashed) => {
        c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y);
        c.strokeStyle = color; c.lineWidth = 3;
        if(dashed) c.setLineDash([10, 8]);
        c.stroke(); c.setLineDash([]);
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        [ang, ang + Math.PI].forEach(a => {
            const p = (a === ang) ? p1 : p2;
            c.beginPath(); c.moveTo(p.x, p.y);
            c.lineTo(p.x + 15 * Math.cos(a - 0.5), p.y + 15 * Math.sin(a - 0.5));
            c.lineTo(p.x + 15 * Math.cos(a + 0.5), p.y + 15 * Math.sin(a + 0.5));
            c.closePath(); c.fillStyle = color; c.fill();
        });
    };

    const blueAnchors = [];
    for(let i = 0; i < totalBlue; i++) {
        const angle = (2 * Math.PI * i / totalBlue) - Math.PI/2;
        const bx = Math.round(centerX + orbitRx * Math.cos(angle));
        const by = Math.round(centerY + orbitRy * Math.sin(angle));

        c.beginPath(); c.ellipse(bx, by, rx, ry, 0, 0, 2 * Math.PI);
        c.fillStyle = '#3B82F6'; c.globalAlpha = 0.25; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = '#3B82F6'; c.lineWidth = 2; c.stroke();

        const pX = Math.round(bx - bRx * Math.cos(angle));
        const pY = Math.round(by - bRy * Math.sin(angle));
        blueAnchors.push({ x: pX, y: pY, used: i < interacting.length });

        c.fillStyle = '#1e293b'; c.font = 'bold 15px Arial'; c.textAlign = 'center';
        if(i < interacting.length) {
            c.fillText(interacting[i].name, bx, by + 5);

            const arrowType = (interacting[i].type === 'contact') ? 'solid' : 'dashed';
            const color = (arrowType === 'solid') ? '#B59600' : '#007F7F';

            let closestAnc = centerAnchors[0], minDist = Infinity;
            centerAnchors.forEach(anc => {
                const d = Math.hypot(anc.x - bx, anc.y - by);
                if(d < minDist) { minDist = d; closestAnc = anc; }
            });
            usedCenterAnchors.add(closestAnc);

            drawArrow(closestAnc, { x: pX, y: pY }, color, arrowType === 'dashed');
        } else {
            c.fillStyle = '#1e293b'; c.fillText(I18N.t('doi.zone_depot'), bx, by + 5);
        }
    }

    // Points d'ancrage : gris si utilisés par une flèche, noir sinon
    centerAnchors.forEach(p => {
        c.beginPath(); c.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        c.fillStyle = usedCenterAnchors.has(p) ? '#9ca3af' : '#000';
        c.fill();
    });
    blueAnchors.forEach(p => {
        c.beginPath(); c.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        c.fillStyle = p.used ? '#9ca3af' : '#000';
        c.fill();
    });

    return `<img src="${cvs.toDataURL('image/png')}" alt="${I18N.t('doi.correction_img_alt')}" style="display:block; margin:0 auto; border-radius:8px; border:1px solid #cbd5e1; max-width:100%; height:auto;">`;
}

// ════════════════════════════════════════════════════════════════════════════════════
//  GÉNÉRATION XML DOI (VERSION CANVAS - STRUCTURE RIGIDE)
//  Basé sur l'exemple XML fourni
// ══════════════════════════════════════════════════════════════════════════════════════════
// Lecture DOM pure : construit les paramètres consommés par genDOICore. L'image de
// correction (canvas) doit être rendue ici, côté navigateur — un cœur serveur ne
// peut pas dessiner sur un canvas — donc elle est transmise déjà finalisée, même
// technique que genChemicalTopoParams() (js/gen-topo.js) pour SmilesDrawer.
function _doiBuildParams(){
    const bareme = parseFloat(document.getElementById('doi-bareme').value) || 2;
    const text = richVal('doi-text');
    const mainObj = document.getElementById('doi-main-obj').value || I18N.t('doi.default_main_obj_generic');
    const extraZones = parseInt(document.getElementById('doi-extra').value) || 0;

    const rows = document.querySelectorAll('.doi-obj-row');
    const objects = [];
    const rawObjects = []; // noms non-échappés pour rawConfig/prévisualisation
    rows.forEach(r => {
        const nRaw = r.querySelector('.doi-name').value.trim();
        const t = r.querySelector('.doi-type').value;
        if(nRaw) {
            objects.push({ name: nRaw.replace(/"/g, '\\"'), type: t });
            rawObjects.push({ name: nRaw, type: t });
        }
    });
    // Config sauvegardée pour la prévisualisation (verif.js)
    const rawConfig = { mainObj, extraZones, objects: rawObjects };

    const correctionImg = `<div style="text-align:center; margin:15px 0; padding:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px;"><h4 style="margin:0 0 10px 0; color:#334155;">${I18N.t('tpl.doi_correction_titre')}</h4>${genDOIFullPreviewImage(rawConfig)}</div>`;

    return { bareme, text, mainObj, extraZones, objects, rawConfig, correctionImg, fbGen: v('doi-fbgen') };
}

async function genDOI(X){
    const p = _doiBuildParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'doi', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "doi", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "doi", repli sur le calcul local.', e); }
    return genDOICore(X, p);
}

function genDOICore(X, p, deps){
    deps = deps || {};
    const mkFbGen_D = deps._mkFbGen || _mkFbGen;
    const I18N_D = deps.I18N || I18N;

    const bareme = p.bareme, text = p.text, mainObj = p.mainObj, extraZones = p.extraZones;
    const objects = p.objects, rawConfig = p.rawConfig, correctionImg = p.correctionImg, fbGen = p.fbGen;

    const interacting = objects.filter(o => o.type !== 'intrus');
    const intrus = objects.filter(o => o.type === 'intrus');
    const totalBlue = interacting.length + extraZones;

    // --- GÉOMÉTRIE (Alignée sur l'exemple XML) ---
    const centerX = 460, centerY = 270;
    const cRx = 140, cRy = 65;
    const orbitRx = 310;
    const orbitRy = 195;
    const bRx = 110, bRy = 45;

    // --- 1. PRÉPARATION DES DONNÉES JAVASCRIPT ---
    let jsObjectsStr = `center: { x: ${centerX}, y: ${centerY}, rx: ${cRx}, ry: ${cRy}, color: '#EC4899', anchors: [`;
    
    const centerAnchors = [
        { x: centerX, y: centerY - cRy },
        { x: centerX - cRx, y: centerY },
        { x: centerX + cRx, y: centerY },
        { x: centerX, y: centerY + cRy }
    ];
    jsObjectsStr += centerAnchors.map(a => `{x:${a.x}, y:${a.y}}`).join(',');
    jsObjectsStr += "] }";

    const positions = [];
    for(let i = 0; i < totalBlue; i++) {
        const angle = (2 * Math.PI * i / totalBlue) - Math.PI/2;
        const bx = Math.round(centerX + orbitRx * Math.cos(angle));
        const by = Math.round(centerY + orbitRy * Math.sin(angle));
        const key = "blue" + i;
        const pX = Math.round(bx - bRx * Math.cos(angle));
        const pY = Math.round(by - bRy * Math.sin(angle));
        positions.push({ key, x: bx, y: by, angle, pX, pY });

        jsObjectsStr += `, ${key}: { x: ${bx}, y: ${by}, rx: ${bRx}, ry: ${bRy}, color: '#3B82F6', pX: ${pX}, pY: ${pY} }`;
    }

    let jsLabelsStr = `[`;
    jsLabelsStr += `{name: "${mainObj}"}`;
    interacting.forEach((o, i) => { jsLabelsStr += `, {name: "${o.name}"}`; });
    intrus.forEach(o => { jsLabelsStr += `, {name: "${o.name}"}`; });
    jsLabelsStr += "]";

    const binZone = `{ x: 210, y: 560, w: 500, h: 50, color: '#94a3b8' }`;

    // --- 2. CONSTRUCTION DU TANS (Réponse Modèle STACK) ---
    let tansPlacements = `center:${mainObj}`;
    interacting.forEach((o, i) => { tansPlacements += `|blue${i}:${o.name}`; });
    for(let i=0; i<extraZones; i++) { tansPlacements += `|blue${interacting.length + i}:`; }

    // Flèches : ArrowType = solid (contact) ou dashed (distance)
    let tansArrows = "";
    let blueIdx = 0;
    interacting.forEach((o, i) => {
        const arrowType = (o.type === 'contact') ? 'solid' : 'dashed';
        const pos = positions[blueIdx];
        
        // Trouver l'ancre centrale la plus proche
        let closestAnc = centerAnchors[0];
        let minDist = 99999;
        centerAnchors.forEach(anc => {
            const d = Math.hypot(anc.x - pos.x, anc.y - pos.y);
            if(d < minDist) { minDist = d; closestAnc = anc; }
        });

        tansArrows += `${o.name}-${mainObj}-${arrowType},${pos.pX},${pos.pY},${closestAnc.x},${closestAnc.y};`;
        blueIdx++;
    });

    let tansIntrus = "";
    intrus.forEach(o => tansIntrus += "nip" + o.name.toLowerCase().replace(/\s/g, ''));
    const reponseModele = tansPlacements + "||" + tansArrows + tansIntrus;

    // --- 3. GÉNÉRATION DU SCRIPT JS (Inclus dans le HTML) ---
    // On injecte nos variables dynamiques dans le template de l'exemple
    const jsScript = `
(function() {
  function initDOI() {
  const canvas = document.getElementById('doiCanvas');
  if (!canvas) { setTimeout(initDOI, 100); return; }
  const ctx = canvas.getContext('2d');
  const hiddenData = document.getElementById('doi-hidden-data');
  const draggablesContainer = document.getElementById('draggables');
  const resetBtn = document.getElementById('resetBtn');

  let arrows = [];
  let placements = { center: null, ${positions.map(p => p.key + ': null').join(', ')}, poubelle: [] };
  let dragStart = null, currentDrag = null, draggedLabel = null, isValidated = false;
  let usedAnchors = new Set(), usedLabels = new Set();

  const labels = ${jsLabelsStr};
  const objects = { ${jsObjectsStr} };
  const binZone = ${binZone};

  function shuffle(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
  
  const shuffledLabels = shuffle([...labels]);
  shuffledLabels.forEach(l => {
    const div = document.createElement('div');
    div.className = 'label-item';
    div.draggable = true;
    div.style.cssText = \`background:#3B82F6; color:white; padding:8px 15px; border-radius:4px; cursor:grab; font-weight:bold;\`;
    div.textContent = l.name;
    div.addEventListener('dragstart', (e) => { if (!isValidated) draggedLabel = l.name; else e.preventDefault(); });
    if(draggablesContainer) draggablesContainer.appendChild(div);
  });

  function updateUsedAnchors() {
    usedAnchors.clear();
    arrows.forEach(a => { usedAnchors.add(a.fO+'_'+a.fP.x+'_'+a.fP.y); usedAnchors.add(a.tO+'_'+a.tP.x+'_'+a.tP.y); });
  }

  function updateUsedLabels() {
    usedLabels.clear();
    Object.entries(placements).forEach(([k, v]) => { if (k === 'poubelle') v.forEach(l => usedLabels.add(l)); else if (v) usedLabels.add(v); });
    document.querySelectorAll('.label-item').forEach(item => {
      const name = item.textContent;
      item.style.opacity = usedLabels.has(name) || isValidated ? '0.3' : '1';
      item.style.cursor = usedLabels.has(name) || isValidated ? 'not-allowed' : 'grab';
      item.draggable = !usedLabels.has(name) && !isValidated;
    });
  }

  function updateData() {
    if (isValidated) return;
    const pStr = Object.entries(placements).filter(([k]) => k !== 'poubelle').map(([k, v]) => k + ':' + (v || '')).join('|');
    const aStr = arrows.map(a => (placements[a.fO]||a.fO)+'-'+(placements[a.tO]||a.tO)+'-'+a.type+','+a.fP.x+','+a.fP.y+','+a.tP.x+','+a.tP.y).join(';');
    const nipSuffix = placements.poubelle.map(n => "nip" + n.toLowerCase().replace(/\\s/g, '')).join('');
    if(hiddenData) hiddenData.value = pStr + '||' + aStr + nipSuffix;
    const si = document.querySelector('input[name*="ans${X}"]');
    if (si) { si.value = hiddenData.value; si.dispatchEvent(new Event('input', { bubbles: true })); }
    updateUsedLabels();
  }

  function draw() {
    ctx.clearRect(0, 0, 920, 600);
    ctx.fillStyle = binZone.color; ctx.globalAlpha = 0.1; ctx.fillRect(binZone.x, binZone.y, binZone.w, binZone.h);
    ctx.globalAlpha = 1; ctx.strokeStyle = binZone.color; ctx.setLineDash([5, 5]); ctx.strokeRect(binZone.x, binZone.y, binZone.w, binZone.h); ctx.setLineDash([]);
    ctx.fillStyle = '#475569'; ctx.textAlign = 'center'; ctx.font = '14px Arial';
    if(placements.poubelle) ctx.fillText(placements.poubelle.join(', '), 460, binZone.y + 30);
    ctx.font = 'bold 14px Arial'; ctx.fillText(${JSON.stringify(I18N_D.t('tpl.doi_hors_systeme'))}, 460, binZone.y + binZone.h + 20);

    arrows.forEach(a => drawArrow(a.fP, a.tP, a.type, a.type === 'solid' ? '#B59600' : '#007F7F'));
    if (currentDrag) drawArrow(dragStart.pos, currentDrag.to, document.querySelector('input[name="arrowType"]:checked').value, '#fbbf24');

    for (const [k, o] of Object.entries(objects)) {
      ctx.beginPath(); ctx.ellipse(o.x, o.y, o.rx, o.ry, 0, 0, 2 * Math.PI);
      ctx.fillStyle = o.color; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = o.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 15px Arial'; ctx.fillText(placements[k] || ${JSON.stringify(I18N_D.t('doi.zone_depot'))}, o.x, o.y + 5);
      const drawAnc = (p, owner) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = usedAnchors.has(owner+'_'+p.x+'_'+p.y) ? '#9ca3af' : '#000';
        ctx.fill();
      };
      if (k === 'center' && o.anchors) o.anchors.forEach(a => drawAnc(a, 'center'));
      else drawAnc({ x: o.pX, y: o.pY }, k);
    }
  }

  function drawArrow(p1, p2, t, col) {
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    if (t === 'dashed') ctx.setLineDash([10, 8]);
    ctx.stroke(); ctx.setLineDash([]);
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    [ang, ang + Math.PI].forEach(a => {
      const p = a === ang ? p1 : p2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 15 * Math.cos(a - 0.5), p.y + 15 * Math.sin(a - 0.5));
      ctx.lineTo(p.x + 15 * Math.cos(a + 0.5), p.y + 15 * Math.sin(a + 0.5));
      ctx.fillStyle = col; ctx.fill();
    });
  }

  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    if (isValidated) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x > binZone.x && x < binZone.x + binZone.w && y > binZone.y && y < binZone.y + binZone.h) {
      if (!placements.poubelle.includes(draggedLabel)) placements.poubelle.push(draggedLabel);
    } else {
      for (const [k, o] of Object.entries(objects)) {
        if (Math.hypot((x - o.x) / o.rx, (y - o.y) / o.ry) <= 1) placements[k] = draggedLabel;
      }
    }
    updateData(); draw();
  });

  canvas.addEventListener('mousedown', e => {
    if (isValidated) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (const [k, o] of Object.entries(objects)) {
      const check = (p, owner) => { if (Math.hypot(x - p.x, y - p.y) < 15 && !usedAnchors.has(owner+'_'+p.x+'_'+p.y)) dragStart = { pos: p, owner: owner }; };
      if (k === 'center' && o.anchors) o.anchors.forEach(a => check(a, 'center'));
      else check({ x: o.pX, y: o.pY }, k);
    }
  });

  canvas.addEventListener('mousemove', e => {
    if (dragStart) { const r = canvas.getBoundingClientRect(); currentDrag = { to: { x: e.clientX - r.left, y: e.clientY - r.top } }; draw(); }
  });
  
  canvas.addEventListener('mouseup', e => {
    if (!dragStart) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (const [k, o] of Object.entries(objects)) {
      let t = null;
      const find = (p, owner) => { if (Math.hypot(x - p.x, y - p.y) < 15 && !usedAnchors.has(owner+'_'+p.x+'_'+p.y)) t = p; };
      if (k === 'center' && o.anchors) o.anchors.forEach(a => find(a, 'center'));
      else find({ x: o.pX, y: o.pY }, k);
      if (t && k !== dragStart.owner) {
        arrows.push({ fO: dragStart.owner, tO: k, fP: dragStart.pos, tP: t, type: document.querySelector('input[name="arrowType"]:checked').value });
        updateUsedAnchors(); break;
      }
    }
    dragStart = null; currentDrag = null; updateData(); draw();
  });

  if(resetBtn) resetBtn.onclick = () => {
    if (!isValidated) {
      arrows = [];
      placements = { center: null, ${positions.map(p => p.key + ': null').join(', ')}, poubelle: [] };
      usedAnchors.clear(); updateData(); draw();
    }
  };

  const obs = new MutationObserver(() => {
    if (document.querySelector('.outcome, .feedback')) {
      isValidated = true; if(resetBtn) { resetBtn.disabled = true; resetBtn.style.opacity = '0.5'; }
      document.querySelectorAll('input[name="arrowType"]').forEach(r => r.disabled = true); updateUsedLabels(); obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Restauration
  setTimeout(() => { 
    const si = document.querySelector('input[name*="ans${X}"]');
    if (!si || !si.value) return; try {
      const parts = si.value.split('||'); parts[0].split('|').forEach(p => { const [k, v] = p.split(':'); if (placements.hasOwnProperty(k)) placements[k] = v; });
      if (parts[1]) { const arrowPart = parts[1].split('nip')[0]; const nipPart = parts[1].substring(arrowPart.length);
        if (arrowPart) { arrowPart.split(';').forEach(s => { const [head, ...c] = s.split(','); const [fN, tN, type] = head.split('-'); const fO = Object.keys(placements).find(k => placements[k] === fN) || fN; const tO = Object.keys(placements).find(k => placements[k] === tN) || tN; arrows.push({ fO, tO, fP: { x: parseFloat(c[0]), y: parseFloat(c[1]) }, tP: { x: parseFloat(c[2]), y: parseFloat(c[3]) }, type }); }); }
        labels.forEach(l => { if (nipPart.includes("nip" + l.name.toLowerCase())) placements.poubelle.push(l.name); });
      } updateUsedAnchors(); updateUsedLabels(); draw(); } catch (e) {} 
    }, 200);
    draw();
  } // fin initDOI
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDOI); } else { initDOI(); }
})();
`;

    // --- 4. HTML CONTAINER ---
    // Les marqueurs délimitent la partie éditable (énoncé + consigne) de la partie interactive (canvas/script)
    const textFrag = `<div style="background:#ADA762;border-left:5px solid #7a7540;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#1e293b;font-size:.95rem;">Q${X} — DOI</strong><span style="background:#7a7540;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span><span style="background:#fff;color:#7a7540;border:1px solid #7a7540;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">🕸️ ${I18N_D.t('doi.banniere_type')}</span></div><!-- ENONCE-START --><div style="margin-bottom:14px;">${text || ''}</div>
<div style="background: #E0F2FE; border-left: 4px solid #0284C7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
<p style="margin: 0 0 10px 0; font-weight: bold;">${I18N_D.t('doi.consigne_titre')}</p>
<ul style="margin: 0; padding-left: 20px;">
<li>${I18N_D.t('doi.consigne_systeme')}</li>
<li>${I18N_D.t('doi.consigne_interagissants')}</li>
<li>${I18N_D.t('doi.consigne_intrus')}</li>
<li>${I18N_D.t('doi.consigne_ancrage')}</li>
</ul>
</div><!-- ENONCE-END -->
<div id="doi-container" style="max-width: 920px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; border-radius: 10px;">
<div style="margin-bottom: 20px; text-align: center; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
<label style="margin-right: 20px; font-weight: bold; cursor: pointer;">
  <input style="margin-right: 5px;" checked="checked" name="arrowType" type="radio" value="solid"> ${I18N_D.t('doi.radio_contact')}
</label>
<label style="font-weight: bold; cursor: pointer;">
  <input style="margin-right: 5px;" name="arrowType" type="radio" value="dashed"> ${I18N_D.t('doi.radio_distance')}
</label>
</div>
<div id="draggables" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; padding: 15px; background: #fff; border: 2px dashed #cbd5e1; border-radius: 8px; flex-wrap: wrap;"></div>
<div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <canvas id="doiCanvas" style="display: block; background: #f1f5f9; cursor: crosshair;" width="920" height="650"></canvas>
</div>
<div style="margin-top: 20px; text-align: center;">
  <button id="resetBtn" style="background: #64748B; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;" type="button">↻ Effacer le schéma</button>
</div>
<input id="doi-hidden-data" type="hidden" value="">
<div style="display: none;">[[input:ans${X}]] [[validation:ans${X}]]</div>
</div>
<p>
<script>
 ${jsScript}
<\/script>
</p>
`;

    // --- 5. VARIABLES MAXIMA & PRTS ---
    const qVars = `/* Variables de calcul */\nobjet_systeme: "${mainObj}";\nliste_interagissants: [${interacting.map(o=>'"'+o.name+'"').join(',')}];\nliste_intrus: [${intrus.map(o=>'"'+o.name+'"').join(',')}];\nreponse_modele: "${reponseModele}";`;

    // PRT 1: Système + Objets + Flèches
    const prt1XML = `    <prt>
      <name>prt${X}_1</name>
      <value>1.0</value>
      <autosimplify>1</autosimplify>
      <feedbackstyle>2</feedbackstyle>
      <feedbackvariables>
        <text><![CDATA[/* Vérification Système */
test_systeme: is(ssearch("center:${mainObj}", ans${X}) # false);
/* Vérification Objets Interagissants */
mots_attendus: ["${interacting.map(o=>o.name).join('","')}"]; 
test_objs: all_listp(lambda([x], is(ssearch(x, ans${X}) # false)), mots_attendus);
/* Vérification Flèches Contact */
test_contact: is(ssearch("solid", ans${X}) # false);
/* Vérification Flèches Distance */
test_distance: is(ssearch("dashed", ans${X}) # false);]]></text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <description>${I18N_D.t('doi.node_systeme')}</description>
        <answertest>AlgEquiv</answertest>
        <sans>test_systeme</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>0.5</truescore>
        <truepenalty></truepenalty>
        <truenextnode>1</truenextnode>
        <trueanswernote>PRT-${X}-0-T</trueanswernote>
        <truefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_systeme_ok')}]]></text></truefeedback>
        <falsescoremode>-</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>PRT-${X}-0-F</falseanswernote>
        <falsefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_systeme_ko')}]]></text></falsefeedback>
      </node>
      <node>
        <name>1</name>
        <description>${I18N_D.t('doi.node_objets')}</description>
        <answertest>AlgEquiv</answertest>
        <sans>test_objs</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>0.5</truescore>
        <truepenalty></truepenalty>
        <truenextnode>2</truenextnode>
        <trueanswernote>PRT-${X}-1-T</trueanswernote>
        <truefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_objets_ok')}]]></text></truefeedback>
        <falsescoremode>-</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>PRT-${X}-1-F</falseanswernote>
        <falsefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_objets_ko')}]]></text></falsefeedback>
      </node>
      <node>
        <name>2</name>
        <description>${I18N_D.t('doi.node_fleches_contact')}</description>
        <answertest>AlgEquiv</answertest>
        <sans>test_contact</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1.0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>PRT-${X}-2-T</trueanswernote>
        <truefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_contact_ok')}]]></text></truefeedback>
        <falsescoremode>-</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>PRT-${X}-2-F</falseanswernote>
        <falsefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_contact_ko')}]]></text></falsefeedback>
      </node>
    </prt>`;

    // PRT 2: Intrus
    let prt2Vars = "";
    intrus.forEach((o, i) => { prt2Vars += `test_intru${i}: is(ssearch("nip${o.name.toLowerCase().replace(/\\s/g, '')}", ans${X}) # false);\n`; });
    if(intrus.length > 0) { prt2Vars += `all_intrus_ok: ${intrus.map((_,i)=>`test_intru${i}`).join(' and ')};`; } 
    else { prt2Vars += `all_intrus_ok: true;`; }

    const prt2XML = `    <prt>
      <name>prt${X}_2</name>
      <value>1.0</value>
      <autosimplify>1</autosimplify>
      <feedbackstyle>2</feedbackstyle>
      <feedbackvariables>
        <text><![CDATA[${prt2Vars}]]></text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <description>${I18N_D.t('doi.node_intrus')}</description>
        <answertest>AlgEquiv</answertest>
        <sans>all_intrus_ok</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1.0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>PRT-${X}-2-T</trueanswernote>
        <truefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_intrus_ok')}]]></text></truefeedback>
        <falsescoremode>-</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>PRT-${X}-2-F</falseanswernote>
        <falsefeedback format="html"><text><![CDATA[${I18N_D.t('doi.fb_intrus_ko')}]]></text></falsefeedback>
      </node>
    </prt>`;

    // Feedbacks par nœud (description + feedback vrai/faux), pour l'aperçu enseignant
    const diagNodes = [
        { desc: I18N_D.t('doi.node_systeme'), fb: I18N_D.t('doi.fb_systeme_ok'), falseFb: I18N_D.t('doi.fb_systeme_ko') },
        { desc: I18N_D.t('doi.node_objets'), fb: I18N_D.t('doi.fb_objets_ok'), falseFb: I18N_D.t('doi.fb_objets_ko') },
        { desc: I18N_D.t('doi.node_fleches_contact'), fb: I18N_D.t('doi.fb_contact_ok'), falseFb: I18N_D.t('doi.fb_contact_ko') },
        { desc: I18N_D.t('doi.node_intrus'), fb: I18N_D.t('doi.fb_intrus_ok'), falseFb: I18N_D.t('doi.fb_intrus_ko') }
    ];

    return {
        bareme,
        vars: qVars,
        qnote: `DOI : ${mainObj}`,
        textFrag: textFrag,
        inputXML: `    <input>\n      <name>ans${X}</name>\n      <type>string</type>\n      <tans><![CDATA["${reponseModele}"]]></tans>\n      <boxsize>80</boxsize>\n      <strictsyntax>1</strictsyntax>\n      <insertstars>0</insertstars>\n      <syntaxhint></syntaxhint>\n      <syntaxattribute>0</syntaxattribute>\n      <forbidwords></forbidwords>\n      <allowwords></allowwords>\n      <forbidfloat>1</forbidfloat>\n      <requirelowestterms>0</requirelowestterms>\n      <checkanswertype>0</checkanswertype>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n      <options></options>\n    </input>`,
        prtXML: prt1XML + "\n\n" + prt2XML,
        generalFeedback: mkFbGen_D(correctionImg, fbGen),
        feedbackRef: `[[feedback:prt${X}_1]]<br/>[[feedback:prt${X}_2]]`,
        correctionImg: correctionImg,
        rawConfig: rawConfig,
        diagNodes: diagNodes
    };
}

// ────────────────────────────────────────────────────────────────────────────────────────
//  FIN INTÉGRATION DOI
// ────────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function verifRenderTags(){
  const list = document.getElementById('vf-tags-list');
  if(!list) return;
  list.innerHTML = '';
  _verifTags.forEach((t, i) => {
    const s = document.createElement('span');
    s.className = 'vf-tag';
    s.innerHTML = `${t} <span class="vf-tag-rm" onclick="verifRemoveTag(${i})">×</span>`;
    list.appendChild(s);
  });
}
function verifAddTag(){
  const inp = document.getElementById('vf-new-tag');
  if(!inp) return;
  const v = inp.value.trim();
  if(v && !_verifTags.includes(v)){
    _verifTags.push(v);
    inp.value = '';
    verifRenderTags();
  }
}
function verifRemoveTag(i){
  _verifTags.splice(i, 1);
  verifRenderTags();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genDOI: genDOI, genDOICore: genDOICore, _doiBuildParams: _doiBuildParams };
}