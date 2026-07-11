// thermo-ui.js — Thermodynamique : gaz parfaits (PV=nRT), chaleur sensible, lois de Mariotte/Charles

var R_GAZ = 8.314; // J/(mol·K)

var THY_PRESETS = [
    {scenario:'pression',   P:101325,  V:0.0224, n:1, T:273.15, m:1,    cp:4186, dT:10},
    {scenario:'volume',     P:101325,  V:0.0224, n:2, T:300,    m:1,    cp:4186, dT:10},
    {scenario:'temperature',P:101325,  V:0.0224, n:1, T:273.15, m:1,    cp:4186, dT:10},
    {scenario:'moles',      P:202650,  V:0.01,   n:1, T:298,    m:1,    cp:4186, dT:10},
    {scenario:'chaleur',    P:101325,  V:0.0224, n:1, T:273.15, m:1,    cp:4186, dT:10},
    {scenario:'mariotte',   P:101325,  V:0.022,  n:1, T:273.15, m:1,    cp:4186, dT:10},
    {scenario:'charles',    P:101325,  V:0.022,  n:1, T:273.15, m:1,    cp:4186, dT:50},
    {scenario:'moles',      P:101325,  V:0.01,   n:1, T:298,    m:1,    cp:4186, dT:10}
];

var THY_GROUPS = {
    'pression':    {gaz:true,  chal:false},
    'volume':      {gaz:true,  chal:false},
    'temperature': {gaz:true,  chal:false},
    'moles':       {gaz:true,  chal:false},
    'chaleur':     {gaz:false, chal:true},
    'mariotte':    {gaz:true,  chal:false},
    'charles':     {gaz:true,  chal:false}
};

function thyApplyPreset() {
    var sel = document.getElementById('thy-preset');
    if (!sel) return;
    var idx = parseInt(sel.value);
    if (isNaN(idx) || idx < 0 || idx >= THY_PRESETS.length) return;
    var p = THY_PRESETS[idx];
    var set = function(id,v){ var el=document.getElementById(id); if(el) el.value=String(v); };
    set('thy-scenario', p.scenario);
    set('thy-P', p.P); set('thy-V', p.V); set('thy-n', p.n); set('thy-T', p.T);
    set('thy-m', p.m); set('thy-cp', p.cp); set('thy-dT', p.dT);
    thyFormChange();
}

function thyFormChange() {
    var scenario = (document.getElementById('thy-scenario')||{}).value || 'pression';
    var g = THY_GROUPS[scenario] || {gaz:true, chal:false};
    var show = function(id,v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
    show('thy-row-gaz', g.gaz);
    show('thy-row-chaleur', g.chal);
    thyUpdatePreview();
}

function thyFmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '?';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    if (Math.abs(n) >= 1000 || Math.abs(n) < 0.001) {
        return n.toExponential(4).replace(/\.?0+e/, 'e');
    }
    return n.toFixed(6).replace(/\.?0+$/, '');
}

function thyCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('thy-scenario') || 'pression';
    var P  = parseFloat(gs('thy-P'))  || 101325;
    var V  = parseFloat(gs('thy-V'))  || 0.0224;
    var n  = parseFloat(gs('thy-n'))  || 1;
    var T  = parseFloat(gs('thy-T'))  || 273.15;
    var m  = parseFloat(gs('thy-m'))  || 1;
    var cp = parseFloat(gs('thy-cp')) || 4186;
    var dT = parseFloat(gs('thy-dT')) || 10;
    var R = R_GAZ;

    var result, unit, formula, label;

    if (scenario === 'pression') {
        result = n*R*T/V; unit = 'Pa';
        formula = 'P = nRT/V = '+thyFmt(n)+'×'+thyFmt(R)+'×'+thyFmt(T)+'/'+thyFmt(V);
        label = 'Pression P';
    } else if (scenario === 'volume') {
        result = n*R*T/P; unit = 'm³';
        formula = 'V = nRT/P = '+thyFmt(n)+'×'+thyFmt(R)+'×'+thyFmt(T)+'/'+thyFmt(P);
        label = 'Volume V';
    } else if (scenario === 'temperature') {
        result = P*V/(n*R); unit = 'K';
        formula = 'T = PV/(nR) = '+thyFmt(P)+'×'+thyFmt(V)+'/('+thyFmt(n)+'×'+thyFmt(R)+')';
        label = 'Température T';
    } else if (scenario === 'moles') {
        result = P*V/(R*T); unit = 'mol';
        formula = 'n = PV/(RT) = '+thyFmt(P)+'×'+thyFmt(V)+'/('+thyFmt(R)+'×'+thyFmt(T)+')';
        label = 'Quantité n';
    } else if (scenario === 'chaleur') {
        result = m*cp*dT; unit = 'J';
        formula = 'Q = m·cp·ΔT = '+thyFmt(m)+'×'+thyFmt(cp)+'×'+thyFmt(dT);
        label = 'Chaleur Q';
    } else if (scenario === 'mariotte') {
        // P1V1 = P2V2, P2 = 2*P1 → V2 = V1/2
        var P2 = 2*P;
        result = P*V/P2; unit = 'm³';
        formula = 'V₂ = P₁V₁/P₂ = '+thyFmt(P)+'×'+thyFmt(V)+'/'+thyFmt(P2)+' (avec P₂=2P₁)';
        label = 'Volume V₂ (Mariotte P₂=2P₁)';
    } else { // charles
        var T2 = T + dT;
        result = V*T2/T; unit = 'm³';
        formula = 'V₂ = V₁T₂/T₁ = '+thyFmt(V)+'×'+thyFmt(T2)+'/'+thyFmt(T)+' (ΔT='+thyFmt(dT)+'K)';
        label = 'Volume V₂ (Charles T₂=T₁+ΔT)';
    }

    return {result:result, unit:unit, formula:formula, label:label, scenario:scenario};
}

function thyUpdatePreview() {
    var el = document.getElementById('thy-preview');
    if (!el) return;
    var r = thyCompute();
    var html = '<strong>' + r.label + '</strong> = <strong style="font-size:1.1em;">'
        + thyFmt(r.result) + ' ' + r.unit + '</strong>';
    html += '<br><small style="color:#6b7280;">' + r.formula + '</small>';
    html += '<br><small style="color:#92400e;">R = 8.314 J/(mol·K)</small>';
    el.innerHTML = html;
}
