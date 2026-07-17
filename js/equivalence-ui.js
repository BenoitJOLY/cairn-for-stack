// equivalence-ui.js — Raisonnement par équivalence

function eqFormChange() { eqToggleEtapeBlock(); eqToggleScenarioBlocks(); eqUpdatePreview(); }

function eqOnScenarioChange() { eqToggleScenarioBlocks(); eqFormChange(); }

function eqToggleScenarioBlocks() {
    var scenario = (document.getElementById('eq-scenario')||{}).value || 'developpement';
    var varBlock = document.getElementById('eq-variable-block');
    var varsBlock = document.getElementById('eq-variables-block');
    if (varBlock) varBlock.style.display = scenario === 'equation' ? '' : 'none';
    if (varsBlock) varsBlock.style.display = scenario === 'systeme' ? '' : 'none';
}

function eqToggleEtapeBlock() {
    var checked = !!(document.getElementById('eq-etape-check')||{}).checked;
    var block = document.getElementById('eq-etape-block');
    if (block) block.style.display = checked ? '' : 'none';
}

var EQ_SCENARIO_LABELS = {
    developpement: 'Développement et simplification',
    equation: 'Résolution d’équation',
    factorisation: 'Factorisation',
    systeme: 'Résolution de système d’équations'
};

function eqUpdatePreview() {
    var el = document.getElementById('eq-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('eq-scenario') || 'developpement';
    var formule = gs('eq-formule').trim();
    var etapeChecked = !!(document.getElementById('eq-etape-check')||{}).checked;
    var etapeVal = gs('eq-etape-val').trim();
    var resultat = gs('eq-resultat').trim();

    if (!formule) {
        el.innerHTML = '<em style="color:#dc2626;">⚠ Saisissez une formule de départ (expression Maxima).</em>';
        return;
    }
    var html = '<strong>' + (EQ_SCENARIO_LABELS[scenario] || scenario) + '</strong><br>';
    html += 'Donnée de départ : <code>' + formule + '</code><br>';
    if (scenario === 'equation') {
        html += 'Inconnue : <code>' + (gs('eq-variable').trim() || 'x') + '</code><br>';
    } else if (scenario === 'systeme') {
        html += 'Inconnues : <code>' + (gs('eq-variables').trim() || 'x,y') + '</code><br>';
    }
    html += resultat
        ? 'Résultat final (imposé) : <code>' + resultat + '</code><br>'
        : '<em style="color:#6b7280;">Résultat final calculé automatiquement par Maxima (expand/factor/solve selon le type).</em><br>';
    if (etapeChecked && etapeVal) {
        html += 'Étape intermédiaire imposée : <code>' + etapeVal + '</code>';
    } else if (etapeChecked) {
        html += '<em style="color:#dc2626;">⚠ Cochez et renseignez l’étape intermédiaire attendue.</em>';
    }
    el.innerHTML = html;
}
