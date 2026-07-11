// trigonometrie-ui.js — Valeurs exactes et identités trigonométriques

// Table des valeurs exactes remarquables (angle en Maxima → valeur en Maxima)
// Utilisée uniquement pour l'aperçu enseignant local (mode Fixe) ; le tirage
// aléatoire réel est calculé côté Maxima.
var TRIG_TABLE = {
    'sin': {
        '0':'0', '%pi/6':'1/2', '%pi/4':'sqrt(2)/2', '%pi/3':'sqrt(3)/2',
        '%pi/2':'1', '2*%pi/3':'sqrt(3)/2', '3*%pi/4':'sqrt(2)/2',
        '5*%pi/6':'1/2', '%pi':'0', '-%pi/6':'-1/2', '-%pi/4':'-sqrt(2)/2',
        '-%pi/3':'-sqrt(3)/2', '-%pi/2':'-1'
    },
    'cos': {
        '0':'1', '%pi/6':'sqrt(3)/2', '%pi/4':'sqrt(2)/2', '%pi/3':'1/2',
        '%pi/2':'0', '2*%pi/3':'-1/2', '3*%pi/4':'-sqrt(2)/2',
        '5*%pi/6':'-sqrt(3)/2', '%pi':'-1', '-%pi/6':'sqrt(3)/2',
        '-%pi/4':'sqrt(2)/2', '-%pi/3':'1/2', '-%pi/2':'0'
    },
    'tan': {
        '0':'0', '%pi/6':'1/sqrt(3)', '%pi/4':'1', '%pi/3':'sqrt(3)',
        '-%pi/6':'-1/sqrt(3)', '-%pi/4':'-1', '-%pi/3':'-sqrt(3)',
        '2*%pi/3':'-sqrt(3)', '3*%pi/4':'-1', '5*%pi/6':'-1/sqrt(3)'
    }
};

// Simplified display of angles for humans
var TRIG_ANGLE_DISPLAY = {
    '0':'0', '%pi/6':'π/6', '%pi/4':'π/4', '%pi/3':'π/3',
    '%pi/2':'π/2', '2*%pi/3':'2π/3', '3*%pi/4':'3π/4',
    '5*%pi/6':'5π/6', '%pi':'π', '-%pi/6':'-π/6', '-%pi/4':'-π/4',
    '-%pi/3':'-π/3', '-%pi/2':'-π/2'
};

// Identités connues → forme simplifiée (aperçu local uniquement ; le mode
// Fixe réel simplifie via trigreduce/trigsimp côté Maxima)
var TRIG_IDENTITIES = {
    'sin(x)^2 + cos(x)^2':  '1',
    'cos(x)^2 + sin(x)^2':  '1',
    '1 - cos(x)^2':         'sin(x)^2',
    '1 - sin(x)^2':         'cos(x)^2',
    '2*sin(x)*cos(x)':      'sin(2*x)',
    'cos(x)^2 - sin(x)^2':  'cos(2*x)',
    '1 - 2*sin(x)^2':       'cos(2*x)',
    '2*cos(x)^2 - 1':       'cos(2*x)',
    '(1 - cos(2*x))/2':     'sin(x)^2',
    '(1 + cos(2*x))/2':     'cos(x)^2'
};

function trigFormChange() {
    var scenario = (document.getElementById('trig-scenario')||{}).value || 'valeur-exacte';
    var mode = (document.querySelector('input[name="trig-mode-r"]:checked')||{}).value || 'aleatoire';
    var show = function(id,v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
    show('trig-row-valeur', scenario === 'valeur-exacte' && mode === 'fixe');
    show('trig-row-expr',   scenario === 'identite' && mode === 'fixe');
    trigUpdatePreview();
}

function trigGetTans() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('trig-scenario') || 'valeur-exacte';
    if (scenario === 'valeur-exacte') {
        var fn    = gs('trig-fn') || 'sin';
        var angle = gs('trig-angle') || '%pi/6';
        var table = TRIG_TABLE[fn] || {};
        return table[angle] || fn + '(' + angle + ')';
    } else {
        var expr = gs('trig-expr') || '';
        return TRIG_IDENTITIES[expr.trim()] || null;
    }
}

function trigUpdatePreview() {
    var el = document.getElementById('trig-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('trig-scenario') || 'valeur-exacte';
    var mode = (document.querySelector('input[name="trig-mode-r"]:checked')||{}).value || 'aleatoire';
    var html = '';

    if (mode !== 'fixe') {
        if (scenario === 'valeur-exacte') {
            html = 'Valeur exacte <em style="color:#6b7280;">— tirée aléatoirement à chaque essai : une fonction parmi ' +
                '<code>sin, cos, tan</code> appliquée à un angle parmi ' +
                '<code>π/6, 5π/6, 7π/6, 11π/6, π/4, 3π/4, 5π/4, 7π/4, π/3, 2π/3</code>.</em>';
        } else {
            html = 'Identité trigonométrique <em style="color:#6b7280;">— tirée aléatoirement à chaque essai parmi les 4 formules de linéarisation (dites de Simpson), ' +
                'avec deux angles distincts p, q tirés parmi <code>π/6, π/4, π/3</code> :</em>' +
                '<ul style="margin:6px 0 0 18px;padding:0;color:#374151;">' +
                '<li><code>cos(p+q) + cos(p-q) = 2cos(p)cos(q)</code></li>' +
                '<li><code>cos(p+q) - cos(p-q) = -2sin(p)sin(q)</code></li>' +
                '<li><code>sin(p+q) + sin(p-q) = 2sin(p)cos(q)</code></li>' +
                '<li><code>sin(p+q) - sin(p-q) = 2cos(p)sin(q)</code></li>' +
                '</ul>';
        }
        el.innerHTML = html;
        return;
    }

    if (scenario === 'valeur-exacte') {
        var fn    = gs('trig-fn') || 'sin';
        var angle = gs('trig-angle') || '%pi/6';
        var disp  = TRIG_ANGLE_DISPLAY[angle] || angle;
        var tans  = trigGetTans();
        html = fn + '(' + disp + ') = <strong>' + tans + '</strong>';
        html += ' &nbsp;<small style="color:#6b7280;">Maxima : <code>' + tans + '</code></small>';
    } else {
        var expr  = gs('trig-expr') || '';
        var tans2 = TRIG_IDENTITIES[expr.trim()];
        if (tans2) {
            html = '<code>' + expr + '</code> = <strong>' + tans2 + '</strong>';
            html += ' <small style="color:#15803d;">✅ identité connue</small>';
        } else {
            html = '<code>' + expr + '</code><br>';
            html += '<em style="color:#b45309;">⚠️ Formule hors des 10 identités connues (ou variable différente de x) : Maxima calculera la forme simplifiée (une seule fonction de x) au moment de l\'export vers Moodle — le résultat exact n\'est pas prévisualisable ici, à vérifier après import.</em>';
        }
    }
    el.innerHTML = html;
}
