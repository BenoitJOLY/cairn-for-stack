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

// ── XML GENERATORS: ordonnancement ──

async function genOrd(X) {
    var rows = document.querySelectorAll('#ord-items .ord-row');
    if (rows.length < 2) throw new Error(I18N.t('ord.err_min'));
    var p = {
        bareme:  parseFloat(v('ord-bareme')) || 1,
        text:    richVal('ord-text'),
        isClone: document.getElementById('ord-clone').checked,
        fbGenExtra: v('ord-fbgen'),
        itemTexts: Array.prototype.map.call(rows, function (r) {
            return r.querySelector('.ord-item-text').value.trim();
        })
    };
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'ord', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "ord", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "ord", repli sur le calcul local.', e); }
    return genOrdCore(X, p);
}

/* genOrdCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour le
   pattern (deps injectables pour les tests Node — test/unit/gen-ord.test.js). */
function genOrdCore(X, p, deps) {
    deps = deps || {};
    var I18N_D        = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D      = deps._mkFbGen || _mkFbGen;
    var rawEsc_D       = deps.rawEsc || rawEsc;
    var applyFbBox_D   = deps.applyFbBox || applyFbBox;
    var inferFbKind_D  = deps.inferFbKind || inferFbKind;

    var bareme  = p.bareme;
    var text    = p.text;
    var isClone = p.isClone;

    var items = [];
    p.itemTexts.forEach(function (t, i) {
        items.push({
            key:  'i' + (i + 1),
            text: t || I18N_D.t('ord.item_fallback', {n: i + 1})
        });
    });

    var N = items.length;

    /* ── Question variables ── */
    var stepsList = items.map(function (it) {
        return '["' + it.key + '","' + rawEsc_D(it.text) + '"]';
    }).join(',');
    var keysList = items.map(function (it) { return '"' + it.key + '"'; }).join(',');

    var vars = '/* Q' + X + ' : Ordonnancement (' + bareme + 'pt) */\n'
        + 'stack_include_contrib("prooflib.mac");\n'
        + 'ord_steps_' + X + ': [' + stepsList + '];\n'
        + 'ord_ta_' + X + ': proof(' + keysList + ');\n'
        + 'ord_steps_' + X + ': random_permutation(ord_steps_' + X + ');\n'
        + 'ord_tal_' + X + ': proof_alternatives(ord_ta_' + X + ');\n'
        + 'ord_tas_' + X + ': setify(map(proof_flatten, ord_tal_' + X + '));';

    /* ── Input XML ── */
    var inputXML = '    <input>\n'
        + '      <name>ans' + X + '</name>\n'
        + '      <type>parsons</type>\n'
        + '      <tans>[ord_ta_' + X + ', ord_steps_' + X + ']</tans>\n'
        + '      <boxsize>15</boxsize>\n'
        + '      <strictsyntax>1</strictsyntax>\n'
        + '      <insertstars>0</insertstars>\n'
        + '      <syntaxhint></syntaxhint>\n'
        + '      <syntaxattribute>0</syntaxattribute>\n'
        + '      <forbidwords></forbidwords>\n'
        + '      <allowwords></allowwords>\n'
        + '      <forbidfloat>1</forbidfloat>\n'
        + '      <requirelowestterms>0</requirelowestterms>\n'
        + '      <checkanswertype>0</checkanswertype>\n'
        + '      <mustverify>0</mustverify>\n'
        + '      <showvalidation>0</showvalidation>\n'
        + '      <options></options>\n'
        + '    </input>';

    /* ── PRT ── */
    var fbVars = 'ord_sa_' + X + ': parsons_decode(ans' + X + ');\n'
        + 'ord_check_' + X + ': elementp(ord_sa_' + X + ', ord_tas_' + X + ');';

    var fbOk    = '<p>✅ <strong>' + I18N_D.t('ord.fb_ok') + '</strong></p>';
    var fbWrong = '<p>❌ <strong>' + I18N_D.t('ord.fb_wrong_title') + '</strong> ' + I18N_D.t('ord.fb_wrong_detail') + '</p>';

    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'ord_check_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans
    // encadre, pour que l'edition manuelle du PRT ne montre jamais de HTML de
    // presentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
            falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    /* ── Question text ── */
    var cloneAttr = isClone ? ' clone="true"' : '';
    var textFrag = '<div style="background:#be185d;border-left:5px solid #831843;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('ord.banniere') + '</strong>'
        + '<span style="background:#831843;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '[[parsons input="ans' + X + '"' + cloneAttr + ']]\n'
        + '{ "steps": {# parsons_encode(ord_steps_' + X + ') #},\n'
        + '  "headers": ["' + I18N_D.t('ord.parsons_headers') + '"],\n'
        + '  "available_header": ["' + I18N_D.t('ord.parsons_available_header') + '"] }\n'
        + '[[/parsons]]\n'
        + '<div style="display:none">[[input:ans' + X + ']] [[validation:ans' + X + ']]</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           '{@ map(first, ord_steps_' + X + ') @}',
        textFrag:        textFrag,
        inputXML:        inputXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: applyFbBox_D('general', mkFbGen_D("", p.fbGenExtra)),
        feedbackRef:     '[[feedback:prt' + X + ']]'
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genOrd: genOrd, genOrdCore: genOrdCore };
}
