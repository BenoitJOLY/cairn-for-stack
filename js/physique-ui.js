// physique-ui.js — Mécanique (MRUA, chute libre, énergie, Newton)

var PHY_PRESETS = [
    {scenario:'mrua-vitesse',  v0:0,   a:9.81, t:3,   m:1,  d:0},
    {scenario:'mrua-position', v0:5,   a:2,    t:4,   m:1,  d:0},
    {scenario:'chute-h',       v0:0,   a:9.81, t:2,   m:1,  d:0},
    {scenario:'chute-t',       v0:0,   a:9.81, t:0,   m:1,  d:20},
    {scenario:'ec',            v0:0,   a:0,    t:0,   m:3,  d:10},   // v=10 m/s
    {scenario:'ep',            v0:0,   a:9.81, t:0,   m:2,  d:5},
    {scenario:'em-conserv',    v0:0,   a:9.81, t:0,   m:1,  d:10},
    {scenario:'newton-f',      v0:0,   a:3,    t:0,   m:5,  d:0}
];

function phyApplyPreset() {
    var sel = document.getElementById('phy-preset');
    if (!sel) return;
    var idx = parseInt(sel.value);
    if (isNaN(idx) || idx < 0 || idx >= PHY_PRESETS.length) return;
    var p = PHY_PRESETS[idx];
    var set = function(id,v){ var el=document.getElementById(id); if(el) el.value=String(v); };
    set('phy-scenario', p.scenario);
    set('phy-v0', p.v0); set('phy-a', p.a); set('phy-t', p.t);
    set('phy-m', p.m);   set('phy-d', p.d);
    phyFormChange();
}

var PHY_GROUPS = {
    'mrua-vitesse':  {cin:true, mec:false},
    'mrua-position': {cin:true, mec:false},
    'chute-h':       {cin:true, mec:false},
    'chute-t':       {cin:false,mec:true},
    'ec':            {cin:false,mec:true},
    'ep':            {cin:false,mec:true},
    'em-conserv':    {cin:false,mec:true},
    'newton-f':      {cin:true, mec:true}
};

function phyFormChange() {
    var scenario = (document.getElementById('phy-scenario')||{}).value || 'mrua-vitesse';
    var g = PHY_GROUPS[scenario] || {cin:true, mec:false};
    var show = function(id,v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
    show('phy-row-cin', g.cin);
    show('phy-row-mec', g.mec);
    phyUpdatePreview();
}

function phyFmt(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(4).replace(/\.?0+$/, '');
}

function phyCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('phy-scenario') || 'mrua-vitesse';
    var v0 = parseFloat(gs('phy-v0')) || 0;
    var a  = parseFloat(gs('phy-a'))  || 0;
    var t  = parseFloat(gs('phy-t'))  || 0;
    var m  = parseFloat(gs('phy-m'))  || 1;
    var d  = parseFloat(gs('phy-d'))  || 0;
    var G  = 9.81;

    var result, unit, formula, label;

    if (scenario === 'mrua-vitesse') {
        result = v0 + a*t; unit = 'm/s';
        formula = 'v = v₀ + at = '+phyFmt(v0)+' + '+phyFmt(a)+'×'+phyFmt(t);
        label = 'v('+phyFmt(t)+'s)';
    } else if (scenario === 'mrua-position') {
        result = v0*t + 0.5*a*t*t; unit = 'm';
        formula = 'x = v₀t + ½at² = '+phyFmt(v0)+'×'+phyFmt(t)+' + ½×'+phyFmt(a)+'×'+phyFmt(t)+'²';
        label = 'x('+phyFmt(t)+'s)';
    } else if (scenario === 'chute-h') {
        result = 0.5*G*t*t; unit = 'm';
        formula = 'h = ½gt² = ½×9.81×'+phyFmt(t)+'²';
        label = 'Hauteur de chute';
    } else if (scenario === 'chute-t') {
        result = Math.sqrt(2*d/G); unit = 's';
        formula = 't = √(2h/g) = √(2×'+phyFmt(d)+'/9.81)';
        label = 'Temps de chute';
    } else if (scenario === 'ec') {
        var v = d; // d réutilisé comme vitesse v
        result = 0.5*m*v*v; unit = 'J';
        formula = 'Ec = ½mv² = ½×'+phyFmt(m)+'×'+phyFmt(v)+'²';
        label = 'Énergie cinétique';
    } else if (scenario === 'ep') {
        result = m*G*d; unit = 'J';
        formula = 'Ep = mgh = '+phyFmt(m)+'×9.81×'+phyFmt(d);
        label = 'Énergie potentielle';
    } else if (scenario === 'em-conserv') {
        result = Math.sqrt(2*G*d); unit = 'm/s';
        formula = 'v = √(2gh) = √(2×9.81×'+phyFmt(d)+')';
        label = 'Vitesse finale (Em conservée)';
    } else { // newton-f
        result = m*a; unit = 'N';
        formula = 'F = ma = '+phyFmt(m)+'×'+phyFmt(a);
        label = 'Force résultante';
    }

    return {result:result, unit:unit, formula:formula, label:label};
}

function phyUpdatePreview() {
    var el = document.getElementById('phy-preview');
    if (!el) return;
    var r = phyCompute();
    var html = '<strong>' + r.label + '</strong> = <strong style="font-size:1.1em;">'
        + phyFmt(r.result) + ' ' + r.unit + '</strong>';
    html += '<br><small style="color:#6b7280;">' + r.formula + '</small>';
    el.innerHTML = html;
}
