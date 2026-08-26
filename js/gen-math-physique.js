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

// ─── PHYSIQUE — MÉCANIQUE ────────────────────────────────

// Wrapper DOM-couplé : lit les champs du panneau et délègue à genPhysiqueCore()
// (fonction pure, testable hors navigateur — voir test/unit/gen-math-physique.test.js).
function genPhysique(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var p = {
        scenario: gs('phy-scenario') || 'mrua-vitesse',
        v0: parseFloat(gs('phy-v0')) || 0,
        a:  parseFloat(gs('phy-a'))  || 0,
        t:  parseFloat(gs('phy-t'))  || 0,
        m:  parseFloat(gs('phy-m'))  || 1,
        d:  parseFloat(gs('phy-d'))  || 0,
        bareme: parseFloat(gs('phy-bareme')) || 1,
        custText: (typeof richVal === 'function') ? richVal('phy-text') : gs('phy-text'),
        fbOk: gs('phy-fb-ok').trim(), fbWrong: gs('phy-fb-wrong').trim(), fbGen: gs('phy-fbgen')
    };
    return genPhysiqueCore(X, p);
}

/* genPhysiqueCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour
   le pattern (deps injectables — test/unit/gen-math-physique.test.js).
   Les 8 scénarios reprennent exactement les formules de physique-ui.js::phyCompute()
   (aperçu config déjà existant côté JS), mais calculées ici en Maxima pour être
   réellement exportées dans le XML (l'ancienne version était un stub : tans:0,
   feedback = icône seule sans texte — voir mémoire "PLAN.md" / échange du
   2026-08-06 pour le contexte de cette réécriture). */
function genPhysiqueCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var scenario = p.scenario, bareme = p.bareme, custText = p.custText || '';
    var fbOk = p.fbOk, fbWrong = p.fbWrong;
    var v0 = 'q'+X+'_v0', a = 'q'+X+'_a', t = 'q'+X+'_t', m = 'q'+X+'_m', h = 'q'+X+'_h', v = 'q'+X+'_v', ta = 'q'+X+'_ta';

    var vars, enonceKey, enonceVars, formuleKey, formuleVars, unit;

    if (scenario === 'mrua-vitesse') {
        vars = `q${X}_v0:${p.v0};q${X}_a:${p.a};q${X}_t:${p.t};\nq${X}_ta:q${X}_v0+q${X}_a*q${X}_t;`;
        enonceKey = 'phy.enonce_mrua_vitesse'; enonceVars = {v0:v0, a:a, t:t};
        formuleKey = 'phy.formule_mrua_vitesse'; formuleVars = {v0:v0, a:a, t:t, ta:ta};
        unit = 'm/s';
    } else if (scenario === 'mrua-position') {
        vars = `q${X}_v0:${p.v0};q${X}_a:${p.a};q${X}_t:${p.t};\nq${X}_ta:q${X}_v0*q${X}_t+q${X}_a*q${X}_t^2/2;`;
        enonceKey = 'phy.enonce_mrua_position'; enonceVars = {v0:v0, a:a, t:t};
        formuleKey = 'phy.formule_mrua_position'; formuleVars = {v0:v0, a:a, t:t, ta:ta};
        unit = 'm';
    } else if (scenario === 'chute-h') {
        vars = `q${X}_g:9.81;q${X}_t:${p.t};\nq${X}_ta:q${X}_g*q${X}_t^2/2;`;
        enonceKey = 'phy.enonce_chute_h'; enonceVars = {t:t};
        formuleKey = 'phy.formule_chute_h'; formuleVars = {t:t, ta:ta};
        unit = 'm';
    } else if (scenario === 'chute-t') {
        vars = `q${X}_g:9.81;q${X}_h:${p.d};\nq${X}_ta:sqrt(2*q${X}_h/q${X}_g);`;
        enonceKey = 'phy.enonce_chute_t'; enonceVars = {h:h};
        formuleKey = 'phy.formule_chute_t'; formuleVars = {h:h, ta:ta};
        unit = 's';
    } else if (scenario === 'ec') {
        vars = `q${X}_m:${p.m};q${X}_v:${p.d};\nq${X}_ta:q${X}_m*q${X}_v^2/2;`;
        enonceKey = 'phy.enonce_ec'; enonceVars = {m:m, v:v};
        formuleKey = 'phy.formule_ec'; formuleVars = {m:m, v:v, ta:ta};
        unit = 'J';
    } else if (scenario === 'ep') {
        vars = `q${X}_m:${p.m};q${X}_g:9.81;q${X}_h:${p.d};\nq${X}_ta:q${X}_m*q${X}_g*q${X}_h;`;
        enonceKey = 'phy.enonce_ep'; enonceVars = {m:m, h:h};
        formuleKey = 'phy.formule_ep'; formuleVars = {m:m, h:h, ta:ta};
        unit = 'J';
    } else if (scenario === 'em-conserv') {
        vars = `q${X}_g:9.81;q${X}_h:${p.d};\nq${X}_ta:sqrt(2*q${X}_g*q${X}_h);`;
        enonceKey = 'phy.enonce_em_conserv'; enonceVars = {h:h};
        formuleKey = 'phy.formule_em_conserv'; formuleVars = {h:h, ta:ta};
        unit = 'm/s';
    } else { // newton-f
        vars = `q${X}_m:${p.m};q${X}_a:${p.a};\nq${X}_ta:q${X}_m*q${X}_a;`;
        enonceKey = 'phy.enonce_newton_f'; enonceVars = {m:m, a:a};
        formuleKey = 'phy.formule_newton_f'; formuleVars = {m:m, a:a, ta:ta};
        unit = 'N';
    }

    var enonceHTML = I18N_D.t(enonceKey, enonceVars);
    var HDR = `<div style="background:#7f1d1d;border-left:5px solid #450a0a;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('phy.title')}</strong> <span style="background:#450a0a;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    var textFrag = `${HDR}${custText}<p>${enonceHTML}</p>
<p>${I18N_D.t('phy.reponse_lbl')} [[input:ans_phy${X}]] [[validation:ans_phy${X}]] ${unit}</p>`;

    var inputXML = mkInput_D({name:`ans_phy${X}`, type:'numerical', tans:ta, boxsize:10, forbidfloat:0, mustverify:0, showvalidation:2});

    var prtMeta = {name:`prt${X}`, value:bareme.toFixed(7), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
    // Tolérance absolue unique (0.05) pour les 8 scénarios : certains résultats sont
    // irrationnels (chute-t, em-conserv, racines carrées) donc une tolérance relative
    // se comporterait mal près de 0 ; une tolérance absolue fixe reste simple et
    // couvre l'arrondi normal d'une réponse tapée par l'élève (cf. gen-cinematique.js).
    var canonicalNodes = [{
        name:'0', description:I18N_D.t('phy.node_reponse'), answertest:'NumAbsolute',
        sans:`ans_phy${X}`, tans:ta, testoptions:'0.05', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`PRT-${X}-OK`, truefeedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`, fbKind:'true',
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`PRT-${X}-NOK`, falsefeedback: fbWrong || `<strong>${I18N_D.t('phy.fb_wrong_generic')}</strong>`, falseFbKind:'false'
    }];
    // canonicalNodes (exposé via prt.nodes pour l'édition/aperçu) reste brut, sans
    // encadré : xmlNodes n'est qu'une copie avec l'encadré appliqué, réservée à
    // l'export XML final — voir js/fb-box.js.
    var xmlNodes = canonicalNodes.map(function(n){
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(n.fbKind, n.truefeedback),
            falsefeedback: applyFbBox_D(n.falseFbKind, n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var generalFeedback = applyFbBox_D('general', mkFbGen_D(I18N_D.t(formuleKey, formuleVars), p.fbGen));

    return {type:'physique', bareme, vars, qnote:`Q${X} physique (${scenario}) = {@${ta}@}`, textFrag, inputXML, prtXML,
        prt:{meta:prtMeta, nodes:canonicalNodes},
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genPhysique: genPhysique, genPhysiqueCore: genPhysiqueCore };
}
