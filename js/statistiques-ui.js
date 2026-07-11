// statistiques-ui.js — Statistiques descriptives

// ── Calculs statistiques ──────────────────────────────────────────────────────
function statParseData(str) {
    return str.split(',').map(function(s){ return parseFloat(s.trim()); }).filter(function(n){ return !isNaN(n); });
}

function statMean(arr) {
    if (!arr.length) return NaN;
    return arr.reduce(function(s,v){ return s+v; }, 0) / arr.length;
}

function statMedian(arr) {
    if (!arr.length) return NaN;
    var s = arr.slice().sort(function(a,b){ return a-b; });
    var n = s.length;
    if (n % 2 === 1) return s[Math.floor(n/2)];
    return (s[n/2 - 1] + s[n/2]) / 2;
}

function statVariance(arr) {
    var m = statMean(arr);
    if (isNaN(m)) return NaN;
    return arr.reduce(function(s,v){ return s + (v-m)*(v-m); }, 0) / arr.length;
}

function statQ1(arr) {
    var s = arr.slice().sort(function(a,b){ return a-b; });
    var n = s.length;
    var lo = s.slice(0, Math.floor(n/2));
    return statMedian(lo);
}

function statQ3(arr) {
    var s = arr.slice().sort(function(a,b){ return a-b; });
    var n = s.length;
    var hi = s.slice(Math.ceil(n/2));
    return statMedian(hi);
}

function statMoyPond(vals, effs) {
    if (!vals.length || vals.length !== effs.length) return NaN;
    var sumNx = 0, sumN = 0;
    for (var i = 0; i < vals.length; i++) { sumNx += vals[i]*effs[i]; sumN += effs[i]; }
    return sumN > 0 ? sumNx / sumN : NaN;
}

function statCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('stat-scenario') || 'moyenne';
    var round    = parseInt(gs('stat-round')) || 2;

    if (scenario === 'moy-pond') {
        var vals = statParseData(gs('stat-vals'));
        var effs = statParseData(gs('stat-effs'));
        return {scenario:scenario, result: statMoyPond(vals, effs), n: vals.length, round:round, vals:vals, effs:effs};
    }

    var data = statParseData(gs('stat-data'));
    var result;
    if      (scenario === 'moyenne')    result = statMean(data);
    else if (scenario === 'mediane')    result = statMedian(data);
    else if (scenario === 'variance')   result = statVariance(data);
    else if (scenario === 'ecart-type') result = Math.sqrt(statVariance(data));
    else if (scenario === 'etendue')    { var s=data.slice().sort(function(a,b){return a-b;}); result = s[s.length-1]-s[0]; }
    else if (scenario === 'q1')         result = statQ1(data);
    else if (scenario === 'q3')         result = statQ3(data);
    else result = NaN;

    return {scenario:scenario, result:result, n:data.length, data:data, round:round};
}

function statFmtN(n, d) {
    if (isNaN(n)) return '?';
    var f = parseFloat(n.toFixed(d));
    return String(f);
}

function statModeChange(mode) {
    var el = document.getElementById('stat-mode');
    if (el) el.value = mode;
    var rz  = document.getElementById('stat-rand-zone');
    var fd  = document.getElementById('stat-field-data');
    var fp  = document.getElementById('stat-field-pond');
    var isAlea = (mode === 'aleatoire');
    if (rz) rz.style.display = isAlea ? '' : 'none';
    statFormChange();
}

function statDisplayChange(mode) {
    var el = document.getElementById('stat-display');
    if (el) el.value = mode;
    statUpdatePreview();
}

function openStatRandModal() {
    var m = document.getElementById('stat-rand-modal');
    if (m) m.style.display = 'flex';
}

function closeStatRandModal() {
    var m = document.getElementById('stat-rand-modal');
    if (m) m.style.display = 'none';
    statUpdateRandSummary();
    statUpdatePreview();
}

function statUpdateRandSummary() {
    var el = document.getElementById('stat-rand-summary');
    if (!el) return;
    var n   = document.getElementById('stat-rand-n');
    var mn  = document.getElementById('stat-rand-min');
    var mx  = document.getElementById('stat-rand-max');
    var nv  = n  ? n.value  : '6';
    var mnv = mn ? mn.value : '1';
    var mxv = mx ? mx.value : '20';
    el.textContent = 'n = ' + nv + ', plage [' + mnv + ' ; ' + mxv + ']';
}

function statFormChange() {
    var gs = function(id){ var el=document.getElementById(id); return el?el.value:''; };
    var scenario = gs('stat-scenario') || 'moyenne';
    var mode     = gs('stat-mode') || 'fixe';
    var isPond   = (scenario === 'moy-pond');
    var isAlea   = (mode === 'aleatoire');
    var fd  = document.getElementById('stat-field-data');
    var fp  = document.getElementById('stat-field-pond');
    var rz  = document.getElementById('stat-rand-zone');
    var dr  = document.getElementById('stat-display-row');
    if (rz) rz.style.display = isAlea ? '' : 'none';
    if (fd) fd.style.display = (!isAlea && !isPond) ? '' : 'none';
    if (fp) fp.style.display = (!isAlea && isPond)  ? '' : 'none';
    if (dr) dr.style.display = isPond ? 'none' : '';
    statUpdateRandSummary();
    statUpdatePreview();
}

function statUpdatePreview() {
    var el = document.getElementById('stat-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var mode = gs('stat-mode') || 'fixe';
    if (mode === 'aleatoire') {
        var n   = gs('stat-rand-n')   || '6';
        var mn  = gs('stat-rand-min') || '1';
        var mx  = gs('stat-rand-max') || '20';
        el.innerHTML = '<em style="color:#0f766e;">Mode aléatoire — Maxima génère '
            + n + ' valeurs dans [' + mn + ' ; ' + mx + '] à chaque affichage. '
            + 'Chaque élève reçoit une série différente.</em>';
        return;
    }
    var r = statCompute();
    var labels = {
        'moyenne':'Moyenne x̄', 'mediane':'Médiane Me', 'variance':'Variance V',
        'ecart-type':'Écart-type σ', 'etendue':'Étendue', 'q1':'Quartile Q₁',
        'q3':'Quartile Q₃', 'moy-pond':'Moyenne pondérée x̄'
    };
    var label = labels[r.scenario] || r.scenario;
    var val   = statFmtN(r.result, r.round);

    var html = '<strong>' + label + '</strong> = <strong style="font-size:1.1em;">' + val + '</strong>';
    if (r.data) {
        var sorted = r.data.slice().sort(function(a,b){return a-b;});
        var display = gs('stat-display') || 'liste';
        if (display === 'tableau') {
            var cells = sorted.map(function(v){ return '<td style="padding:4px 10px;border:1px solid #99f6e4;">' + v + '</td>'; }).join('');
            html += '<br><small style="color:#6b7280;">n = ' + r.n + ' valeurs — série triée :</small>'
                  + '<table style="border-collapse:collapse;margin-top:4px;"><tr>' + cells + '</tr></table>';
        } else {
            html += '<br><small style="color:#6b7280;">n = ' + r.n + ' valeurs — série triée : ' + sorted.join(', ') + '</small>';
        }
    }
    if (r.vals) {
        html += '<br><small style="color:#6b7280;">Σnᵢxᵢ / Σnᵢ — effectif total : ' + r.effs.reduce(function(s,v){return s+v;},0) + '</small>';
    }
    el.innerHTML = html;
}
