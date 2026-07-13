// ── XML GENERATORS: ordonnancement ──

function genOrd(X) {
    var bareme  = parseFloat(v('ord-bareme')) || 1;
    var text    = richVal('ord-text');
    var rows    = document.querySelectorAll('#ord-items .ord-row');
    var isClone = document.getElementById('ord-clone').checked;

    if (rows.length < 2) throw new Error(I18N.t('ord.err_min'));

    var items = [];
    rows.forEach(function (r, i) {
        items.push({
            key:  'i' + (i + 1),
            text: r.querySelector('.ord-item-text').value.trim() || I18N.t('ord.item_fallback', {n: i + 1})
        });
    });

    var N = items.length;

    /* ── Question variables ── */
    var stepsList = items.map(function (it) {
        return '["' + it.key + '","' + rawEsc(it.text) + '"]';
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

    var fbOk    = wrapFb('<p>✅ <strong>' + I18N.t('ord.fb_ok') + '</strong></p>', true);
    var fbWrong = wrapFb('<p>❌ <strong>' + I18N.t('ord.fb_wrong_title') + '</strong> ' + I18N.t('ord.fb_wrong_detail') + '</p>', false);

    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'ord_check_' + X, tans: 'true',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOk,
        falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrong
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    /* ── Question text ── */
    var cloneAttr = isClone ? ' clone="true"' : '';
    var textFrag = '<div style="background:#be185d;border-left:5px solid #831843;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N.t('ord.banniere') + '</strong>'
        + '<span style="background:#831843;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '[[parsons input="ans' + X + '"' + cloneAttr + ']]\n'
        + '{ "steps": {# parsons_encode(ord_steps_' + X + ') #},\n'
        + '  "headers": ["' + I18N.t('ord.parsons_headers') + '"],\n'
        + '  "available_header": ["' + I18N.t('ord.parsons_available_header') + '"] }\n'
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
        generalFeedback: _mkFbGen('', v('ord-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]'
    };
}
