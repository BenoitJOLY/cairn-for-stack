// matrices-ui.js — Matrices et systèmes linéaires (génération Maxima)

function matFormChange() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('mat-scenario') || 'produit-2x2';
    var isSys = (scenario === 'systeme-2x2');

    var rr = document.getElementById('mat-rand-range');
    var ri = document.getElementById('mat-rand-info');
    if (rr) rr.style.display = isSys ? 'none' : '';
    if (ri) {
        if (isSys) {
            ri.textContent = 'Coefficients non nuls tirés dans [−4 ; 4], solution entière dans [−4 ; 4].';
            ri.style.display = '';
        } else {
            ri.style.display = 'none';
        }
    }
    matUpdatePreview();
}

function matUpdatePreview() {
    var el = document.getElementById('mat-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('mat-scenario') || 'produit-2x2';
    var rmin = gs('mat-rand-min') || '-3';
    var rmax = gs('mat-rand-max') || '3';

    var labels = {
        'produit-2x2':     'Produit A×B (2×2)',
        'det-2x2':         'Déterminant 2×2',
        'det-3x3':         'Déterminant 3×3 (Sarrus)',
        'trace-3x3':       'Trace 3×3',
        'transpose-3x3':   'Transposée 3×3',
        'systeme-2x2':     'Système linéaire 2×2 → (x, y)'
    };
    var label = labels[scenario] || scenario;

    var html = '<strong>' + label + '</strong>';
    if (scenario === 'systeme-2x2') {
        html += '<br><small style="color:#6b7280;">Coefficients non nuls dans [−4 ; 4] — solution entière aléatoire.</small>';
    } else {
        html += '<br><small style="color:#6b7280;">Coefficients générés par Maxima dans ['
            + rmin + ' ; ' + rmax + '] — différents à chaque étudiant.</small>';
    }
    el.innerHTML = html;
}
