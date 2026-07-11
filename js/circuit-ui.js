// circuit-ui.js — UI & JSXGraph rendering for Circuits électriques question type

// ── Presets ──────────────────────────────────────────────────────────────────
var CIR_PRESETS = [
    {scenario:'loi-ohm',  ask:'i',     e:9,   r1:100, r2:220, r3:0, iKnown:0,   tol:5},
    {scenario:'loi-ohm',  ask:'r',     e:5,   r1:200, r2:0,   r3:0, iKnown:25,  tol:5},
    {scenario:'loi-ohm',  ask:'u',     e:0,   r1:220, r2:0,   r3:0, iKnown:45,  tol:5},
    {scenario:'serie',    ask:'r-eq',  e:9,   r1:100, r2:220, r3:0, iKnown:0,   tol:2},
    {scenario:'serie',    ask:'i',     e:9,   r1:100, r2:220, r3:0, iKnown:0,   tol:5},
    {scenario:'serie',    ask:'u1',    e:9,   r1:100, r2:220, r3:0, iKnown:0,   tol:5},
    {scenario:'parallele',ask:'r-eq',  e:12,  r1:300, r2:600, r3:0, iKnown:0,   tol:2},
    {scenario:'parallele',ask:'i-total',e:12, r1:300, r2:600, r3:0, iKnown:0,   tol:5},
    {scenario:'parallele',ask:'i1',    e:12,  r1:300, r2:600, r3:0, iKnown:0,   tol:5}
];

function cirApplyPreset() {
    var sel = document.getElementById('cir-preset');
    if (!sel) return;
    var idx = parseInt(sel.value);
    if (isNaN(idx) || idx < 0 || idx >= CIR_PRESETS.length) return;
    var p = CIR_PRESETS[idx];
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = String(val); };
    set('cir-scenario', p.scenario);
    set('cir-ask',      p.ask);
    set('cir-e',        p.e);
    set('cir-r1',       p.r1);
    set('cir-r2',       p.r2);
    set('cir-r3',       p.r3);
    set('cir-i-known',  p.iKnown);
    set('cir-tol',      p.tol);
    cirFormChange();
}

// ── Form change ───────────────────────────────────────────────────────────────
function cirFormChange() {
    var scenario = (document.getElementById('cir-scenario') || {}).value || 'loi-ohm';
    var ask      = (document.getElementById('cir-ask')      || {}).value || 'i';

    // Rebuild ask options dynamically based on scenario
    var askSel = document.getElementById('cir-ask');
    if (askSel) {
        var opts;
        if (scenario === 'loi-ohm') {
            opts = [
                {v:'i', l:'Courant I (A) = U / R'},
                {v:'r', l:'Résistance R (Ω) = U / I'},
                {v:'u', l:'Tension U (V) = R · I'}
            ];
        } else if (scenario === 'serie') {
            opts = [
                {v:'r-eq', l:'Résistance totale R_eq = R₁ + R₂ (+ R₃)'},
                {v:'i',    l:'Courant I = E / R_eq'},
                {v:'u1',   l:'Tension U₁ = R₁ · I'},
                {v:'u2',   l:'Tension U₂ = R₂ · I'},
                {v:'u3',   l:'Tension U₃ = R₃ · I (si R₃ > 0)'}
            ];
        } else {
            opts = [
                {v:'r-eq',    l:'Résistance équivalente R_eq = 1/(1/R₁ + 1/R₂)'},
                {v:'i-total', l:'Courant total I = E / R_eq'},
                {v:'i1',      l:'Courant de branche I₁ = E / R₁'},
                {v:'i2',      l:'Courant de branche I₂ = E / R₂'}
            ];
        }
        var curAsk = ask;
        askSel.innerHTML = opts.map(function(o) {
            return '<option value="' + o.v + '"' + (o.v === curAsk ? ' selected' : '') + '>' + o.l + '</option>';
        }).join('');
        ask = askSel.value; // may have changed if curAsk not in new opts
    }

    // Show/hide fields based on scenario + ask
    var setVis = function(id, show) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.display = show ? '' : 'none';
    };

    var isOhm     = (scenario === 'loi-ohm');
    var isSerie   = (scenario === 'serie');
    var isPara    = (scenario === 'parallele');
    var needIknown = isOhm && (ask === 'r' || ask === 'u');

    setVis('cir-row-r2r3',    !isOhm);
    setVis('cir-field-r3',    isSerie);
    setVis('cir-field-iknown', needIknown);

    // Label updates for loi-ohm fields
    var lblE  = document.getElementById('cir-lbl-e');
    var lblR1 = document.getElementById('cir-lbl-r1');
    var lblI  = document.getElementById('cir-lbl-iknown');
    if (isOhm) {
        if (lblE)  lblE.textContent  = ask === 'u' ? 'Tension U (V) — DONNÉE (= E)' : 'Tension E (V)';
        if (lblR1) lblR1.textContent = ask === 'r' ? 'Résistance R — sera calculée ↑' : 'Résistance R₁ (Ω)';
        if (lblI)  lblI.textContent  = ask === 'r' ? 'Courant I connu (mA)' : 'Courant I connu (mA)';
    } else {
        if (lblE)  lblE.textContent  = 'Tension du générateur E (V)';
        if (lblR1) lblR1.textContent = 'Résistance R₁ (Ω)';
    }

    cirUpdatePreview();
    // Redraw circuit with small delay so DOM is settled
    setTimeout(cirDrawCircuit, 30);
}

// ── Compute numeric answer ────────────────────────────────────────────────────
function cirGetCfg() {
    var gv = function(id) { var el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; };
    var gs = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
        scenario: gs('cir-scenario') || 'loi-ohm',
        ask:      gs('cir-ask')      || 'i',
        e:        gv('cir-e')  || 9,
        r1:       gv('cir-r1') || 100,
        r2:       gv('cir-r2') || 220,
        r3:       gv('cir-r3') || 0,
        iKnown:   gv('cir-i-known') / 1000, // stored as mA, convert to A
        tol:      gv('cir-tol') || 5
    };
}

function cirAnswer(cfg) {
    var e = cfg.e, r1 = cfg.r1, r2 = cfg.r2, r3 = cfg.r3, iK = cfg.iKnown;
    if (cfg.scenario === 'loi-ohm') {
        if (cfg.ask === 'i') return r1 > 0 ? e / r1 : 0;
        if (cfg.ask === 'r') return iK > 0 ? e / iK : 0;
        if (cfg.ask === 'u') return r1 * iK;
    } else if (cfg.scenario === 'serie') {
        var req = r1 + r2 + (r3 > 0 ? r3 : 0);
        var I   = req > 0 ? e / req : 0;
        if (cfg.ask === 'r-eq') return req;
        if (cfg.ask === 'i')    return I;
        if (cfg.ask === 'u1')   return r1 * I;
        if (cfg.ask === 'u2')   return r2 * I;
        if (cfg.ask === 'u3')   return r3 * I;
    } else {
        var r2eff = r2 > 0 ? r2 : Infinity;
        var req   = 1 / (1/r1 + 1/r2eff);
        var Itot  = req > 0 ? e / req : 0;
        if (cfg.ask === 'r-eq')    return req;
        if (cfg.ask === 'i-total') return Itot;
        if (cfg.ask === 'i1')      return r1 > 0 ? e / r1 : 0;
        if (cfg.ask === 'i2')      return r2 > 0 ? e / r2 : 0;
    }
    return 0;
}

function cirFmtVal(val, ask) {
    var isI  = (ask === 'i' || ask === 'i-total' || ask === 'i1' || ask === 'i2');
    var isU  = (ask === 'u' || ask.startsWith('u'));
    var isR  = (ask === 'r' || ask === 'r-eq');
    var unit = isI ? 'A' : isU ? 'V' : 'Ω';
    var abs  = Math.abs(val);
    var str;
    if      (abs === 0)      str = '0 ' + unit;
    else if (abs < 0.0001)   str = (val * 1e6).toFixed(1) + ' µ' + unit;
    else if (abs < 0.1)      str = (val * 1000).toFixed(2) + ' m' + unit;
    else if (abs >= 1e6)     str = (val / 1e6).toFixed(3) + ' M' + unit;
    else if (abs >= 1000)    str = (val / 1000).toFixed(2) + ' k' + unit;
    else                     str = val.toFixed(4).replace(/\.?0+$/, '') + ' ' + unit;
    return str;
}

function cirUpdatePreview() {
    var el = document.getElementById('cir-preview');
    if (!el) return;
    var cfg = cirGetCfg();
    var ans = cirAnswer(cfg);
    var fmt = cirFmtVal(ans, cfg.ask);
    var askLabel = {
        i:'Courant I', r:'Résistance R', u:'Tension U',
        'r-eq':'R_eq', 'i-total':'Courant total I',
        i1:'Courant I₁', i2:'Courant I₂',
        u1:'Tension U₁', u2:'Tension U₂', u3:'Tension U₃'
    }[cfg.ask] || cfg.ask;
    el.innerHTML = askLabel + ' = <strong>' + fmt + '</strong>'
        + ' &nbsp;(tolérance ±' + cfg.tol + '%)';
}

// ── JSXGraph helpers ──────────────────────────────────────────────────────────
var _cirBoard = null;

function _w(b, x1, y1, x2, y2) {
    b.create('segment', [[x1,y1],[x2,y2]],
        {strokeColor:'#1f2937', strokeWidth:2.5, fixed:true, highlight:false});
}

function _resistorH(b, x1, x2, y, label, valStr, isQ) {
    var mx = (x1+x2)/2, hh = 0.42, hw = (x2-x1)*0.28;
    _w(b, x1, y, mx-hw, y);
    b.create('polygon',
        [[mx-hw, y-hh],[mx+hw, y-hh],[mx+hw, y+hh],[mx-hw, y+hh]],
        {fillColor: isQ ? '#fef2f2' : '#ecfdf5',
         strokeColor: isQ ? '#dc2626' : '#15803d',
         strokeWidth: isQ ? 2.5 : 2,
         fixed:true, highlight:false});
    _w(b, mx+hw, y, x2, y);
    if (label) b.create('text', [mx, y+hh+0.22, label],
        {fontSize:13, color: isQ ? '#dc2626' : '#15803d', fixed:true});
    if (valStr) b.create('text', [mx, y-hh-0.3, valStr],
        {fontSize:11, color:'#1e40af', fixed:true});
}

function _resistorV(b, x, y1, y2, label, valStr, isQ) {
    var my = (y1+y2)/2, hh = (y2-y1)*0.28, hw = 0.42;
    _w(b, x, y1, x, my-hh);
    b.create('polygon',
        [[x-hw, my-hh],[x+hw, my-hh],[x+hw, my+hh],[x-hw, my+hh]],
        {fillColor: isQ ? '#fef2f2' : '#ecfdf5',
         strokeColor: isQ ? '#dc2626' : '#15803d',
         strokeWidth: isQ ? 2.5 : 2,
         fixed:true, highlight:false});
    _w(b, x, my+hh, x, y2);
    if (label) b.create('text', [x+hw+0.15, my, label],
        {fontSize:13, color: isQ ? '#dc2626' : '#15803d', fixed:true});
    if (valStr) b.create('text', [x-hw-0.15, my, valStr],
        {fontSize:11, color:'#1e40af', fixed:true, anchorX:'right'});
}

function _battery(b, x, ybot, ytop, label, valStr) {
    var mid = (ybot+ytop)/2, gap = 0.38, cw = 0.48;
    _w(b, x, ybot, x, mid-gap);
    // Short line (−)
    b.create('segment', [[x-cw*0.6, mid-gap],[x+cw*0.6, mid-gap]],
        {strokeColor:'#374151', strokeWidth:2, fixed:true});
    // Long line (+)
    b.create('segment', [[x-cw, mid-gap*0.1],[x+cw, mid-gap*0.1]],
        {strokeColor:'#374151', strokeWidth:4, fixed:true});
    // Short line (−) 2nd cell
    b.create('segment', [[x-cw*0.6, mid+gap*0.7],[x+cw*0.6, mid+gap*0.7]],
        {strokeColor:'#374151', strokeWidth:2, fixed:true});
    // Long line (+) 2nd cell
    b.create('segment', [[x-cw, mid+gap*1.1],[x+cw, mid+gap*1.1]],
        {strokeColor:'#374151', strokeWidth:4, fixed:true});
    _w(b, x, mid+gap*1.1, x, ytop);
    // + and − labels
    b.create('text', [x+cw+0.18, mid+gap*1.3, '+'],
        {fontSize:15, color:'#dc2626', fontWeight:'bold', fixed:true});
    b.create('text', [x+cw+0.18, mid-gap*1.2, '−'],
        {fontSize:15, color:'#2563eb', fontWeight:'bold', fixed:true});
    if (label) b.create('text', [x-cw-0.18, (ybot+ytop)/2, label],
        {fontSize:13, color:'#374151', fixed:true, anchorX:'right'});
    if (valStr) b.create('text', [x-cw-0.18, (ybot+ytop)/2-0.6, valStr],
        {fontSize:11, color:'#1e40af', fixed:true, anchorX:'right'});
}

function _dot(b, x, y) {
    b.create('point', [x, y], {size:5, color:'#1f2937', fixed:true, showInfobox:false, highlight:false});
}

function _arrowH(b, x1, x2, y, label, color) {
    color = color || '#dc2626';
    var mx = (x1+x2)/2;
    b.create('arrow', [[x1,y],[x2,y]],
        {strokeColor:color, strokeWidth:2, firstArrow:false, lastArrow:{size:6}, fixed:true});
    if (label) b.create('text', [mx, y+0.32, label],
        {fontSize:12, color:color, fixed:true});
}

function _arrowV(b, x, y1, y2, label, color) {
    color = color || '#dc2626';
    b.create('arrow', [[x,y1],[x,y2]],
        {strokeColor:color, strokeWidth:2, firstArrow:false, lastArrow:{size:6}, fixed:true});
    if (label) b.create('text', [x+0.25, (y1+y2)/2, label],
        {fontSize:12, color:color, fixed:true, anchorX:'left'});
}

function _textBox(b, x, y, str, color, size) {
    b.create('text', [x, y, str], {fontSize: size||12, color: color||'#374151', fixed:true});
}

// ── Scene renderers ───────────────────────────────────────────────────────────
function _cirLoiOhm(b, cfg) {
    var x1=1, x2=10, yb=1, yt=6;
    var ask = cfg.ask;

    // Wires: right side + bottom
    _w(b, x2, yt, x2, yb);
    _w(b, x1, yb, x2, yb);

    // Battery (left)
    var bLabel = ask === 'u' ? '' : 'E';
    var bVal   = ask === 'u' ? '' : (cfg.e + ' V');
    _battery(b, x1, yb, yt, bLabel, bVal);

    // Resistor on top
    var rIsQ = (ask === 'r');
    var rLabel = rIsQ ? 'R = ?' : 'R';
    var rVal   = rIsQ ? '' : (cfg.r1 + ' Ω');
    _resistorH(b, x1, x2, yt, rLabel, rVal, rIsQ);

    var mx = (x1+x2)/2;

    // Current arrow on top
    var I = cirAnswer(cfg);
    if (ask === 'i') {
        _arrowH(b, mx+1.5, mx-1.5, yt+0.85, 'I = ?', '#dc2626');
    } else {
        var iStr = 'I = ' + cirFmtVal(ask === 'r' ? cfg.iKnown : cfg.iKnown, 'i');
        _arrowH(b, mx+1.5, mx-1.5, yt+0.85, iStr, '#374151');
    }

    // Tension label
    if (ask === 'u') {
        _textBox(b, mx, yt-1.0, 'U = ?', '#dc2626', 14);
        _textBox(b, mx, yt-1.55, 'R = ' + cfg.r1 + ' Ω', '#15803d', 11);
        _textBox(b, mx, yt-2.1, 'I = ' + cirFmtVal(cfg.iKnown, 'i'), '#374151', 11);
    } else {
        _textBox(b, mx, yt-1.0, 'U_R = ' + cfg.e + ' V', '#1e40af', 12);
    }
}

function _cirSerie(b, cfg) {
    var x1=1, x2=10, yb=1, yt=6;
    var ask = cfg.ask, e = cfg.e, r1 = cfg.r1, r2 = cfg.r2, r3 = cfg.r3;
    var hasR3 = (r3 > 0);
    var nR = hasR3 ? 3 : 2;
    var rVals = [r1, r2, r3];
    var rNames = ['R₁','R₂','R₃'];
    var askU = ['u1','u2','u3'];

    var req = r1 + r2 + (hasR3 ? r3 : 0);
    var I   = req > 0 ? e / req : 0;
    var uArr = [r1*I, r2*I, r3*I];

    // Frame
    _w(b, x2, yt, x2, yb);
    _w(b, x1, yb, x2, yb);
    _battery(b, x1, yb, yt, 'E', e + ' V');

    // Distribute resistors along top
    var segW = (x2 - x1) / nR;
    var xs = [];
    for (var k = 0; k <= nR; k++) xs.push(x1 + k * segW);

    for (var i = 0; i < nR; i++) {
        var isQ = (ask === askU[i]) || (ask === 'r-eq');
        // For r-eq: show normal values but mark with question at bottom
        var isQBox = (ask === askU[i]);
        _resistorH(b, xs[i], xs[i+1], yt, rNames[i], rVals[i] + ' Ω', isQBox);
        // Voltage label below resistor
        var xc = (xs[i]+xs[i+1])/2;
        var uStr = ask === askU[i] ? 'U' + (i+1) + ' = ?' : ('U₁' === 'U₁' ? 'U₁' : 'U') ;
        // Simpler: show U labels for all
        var labelU = ask === askU[i]
            ? 'U' + (i+1) + ' = ?'
            : 'U' + (i+1) + ' = ' + cirFmtVal(uArr[i], 'u');
        _textBox(b, xc, yt-1.05, labelU, ask === askU[i] ? '#dc2626' : '#1e40af', 11);
    }

    // Current arrow on top
    var mx = (x1+x2)/2;
    var iStr = ask === 'i' ? 'I = ?' : ('I = ' + cirFmtVal(I, 'i'));
    _arrowH(b, mx+1.5, mx-1.5, yt+0.85, iStr, ask==='i' ? '#dc2626' : '#374151');

    // R_eq label at bottom
    var reqStr = ask === 'r-eq'
        ? 'Rₑₙ = ?  (= R₁ + R₂' + (hasR3 ? ' + R₃' : '') + ')'
        : 'Rₑₙ = ' + cirFmtVal(req, 'r');
    _textBox(b, (x1+x2)/2, yb-0.75, reqStr, ask==='r-eq' ? '#dc2626' : '#15803d', 12);
}

function _cirParallele(b, cfg) {
    var xL=1, xA=4, xB=8, xR=10, yb=0, yt=6, yR1=4.2, yR2=1.8;
    var e = cfg.e, r1 = cfg.r1, r2 = cfg.r2, ask = cfg.ask;
    var req  = r1 > 0 && r2 > 0 ? 1/(1/r1+1/r2) : r1 || r2;
    var Itot = req > 0 ? e / req : 0;
    var I1   = r1 > 0 ? e / r1 : 0;
    var I2   = r2 > 0 ? e / r2 : 0;

    // Outer frame top + bottom
    _w(b, xL, yt, xR, yt);
    _w(b, xL, yb, xR, yb);
    // Right closing wire
    _w(b, xR, yt, xR, yb);

    // Battery
    _battery(b, xL, yb, yt, 'E', e + ' V');

    // Left junction column (xA: from yb to yt)
    _w(b, xA, yb, xA, yt);
    // Right junction column (xB: from yb to yt)
    _w(b, xB, yb, xB, yt);

    // R1 branch
    var r1IsQ = (ask === 'i1');
    _resistorH(b, xA, xB, yR1, 'R₁', r1 + ' Ω', r1IsQ);

    // R2 branch
    var r2IsQ = (ask === 'i2');
    _resistorH(b, xA, xB, yR2, 'R₂', r2 + ' Ω', r2IsQ);

    // Junction dots
    [yb, yR1, yR2, yt].forEach(function(y) {
        _dot(b, xA, y);
        _dot(b, xB, y);
    });

    // Current labels
    var mx = (xA+xB)/2;
    var iI1  = ask === 'i1'    ? 'I₁ = ?' : 'I₁ = ' + cirFmtVal(I1, 'i');
    var iI2  = ask === 'i2'    ? 'I₂ = ?' : 'I₂ = ' + cirFmtVal(I2, 'i');
    var iIto = ask === 'i-total'? 'I = ?' : 'I = ' + cirFmtVal(Itot, 'i');
    _textBox(b, mx, yR1+0.85, iI1, ask==='i1'?'#dc2626':'#374151', 11);
    _textBox(b, mx, yR2+0.85, iI2, ask==='i2'?'#dc2626':'#374151', 11);
    _textBox(b, xR+0.25, (yt+yb)/2, iIto, ask==='i-total'?'#dc2626':'#374151', 11);

    // R_eq label at bottom
    var reqStr = ask === 'r-eq'
        ? 'Rₑₙ = ?  (1/Rₑₙ = 1/R₁ + 1/R₂)'
        : 'Rₑₙ = ' + cirFmtVal(req, 'r');
    _textBox(b, (xL+xR)/2, yb-0.8, reqStr, ask==='r-eq'?'#dc2626':'#15803d', 12);
}

// ── Main draw function ────────────────────────────────────────────────────────
function cirDrawCircuit() {
    var container = document.getElementById('cir-canvas');
    if (!container) return;
    // Skip if panel not visible
    if (!container.offsetParent) return;

    if (_cirBoard) {
        try { JXG.JSXGraph.freeBoard(_cirBoard); } catch(e) {}
        _cirBoard = null;
    }
    if (typeof JXG === 'undefined') return;

    var cfg = cirGetCfg();
    var bb  = cfg.scenario === 'parallele'
        ? [-1.5, 7, 13, -1.8]
        : [-0.5, 7.8, 12, -1.5];

    _cirBoard = JXG.JSXGraph.initBoard('cir-canvas', {
        boundingbox: bb,
        axis: false, grid: false,
        showNavigation: false, showCopyright: false,
        pan: {enabled:false}, zoom: {enabled:false}
    });

    if (cfg.scenario === 'loi-ohm')   _cirLoiOhm(_cirBoard, cfg);
    else if (cfg.scenario === 'serie') _cirSerie(_cirBoard, cfg);
    else                               _cirParallele(_cirBoard, cfg);
}
