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

var EQ_SCENARIO_KEYS = {
    developpement: 'equiv.scenario_developpement',
    equation: 'equiv.scenario_equation',
    factorisation: 'equiv.scenario_factorisation',
    systeme: 'equiv.scenario_systeme'
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
        el.innerHTML = '<em style="color:#dc2626;">' + I18N.t('equiv.preview_err') + '</em>';
        return;
    }
    var html = '<strong>' + I18N.t(EQ_SCENARIO_KEYS[scenario] || scenario) + '</strong><br>';
    html += I18N.t('equiv.preview_depart') + '<code>' + formule + '</code><br>';
    if (scenario === 'equation') {
        html += I18N.t('equiv.preview_inconnue') + '<code>' + (gs('eq-variable').trim() || 'x') + '</code><br>';
    } else if (scenario === 'systeme') {
        html += I18N.t('equiv.preview_inconnues') + '<code>' + (gs('eq-variables').trim() || 'x,y') + '</code><br>';
    }
    html += resultat
        ? I18N.t('equiv.preview_resultat_impose') + '<code>' + resultat + '</code><br>'
        : '<em style="color:#6b7280;">' + I18N.t('equiv.preview_resultat_auto') + '</em><br>';
    if (etapeChecked && etapeVal) {
        html += I18N.t('equiv.preview_etape_impose') + '<code>' + etapeVal + '</code>';
    } else if (etapeChecked) {
        html += '<em style="color:#dc2626;">' + I18N.t('equiv.preview_etape_manque') + '</em>';
    }
    el.innerHTML = html;
}
