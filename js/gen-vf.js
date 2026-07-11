// ── XML GENERATORS: vrai/faux ──

function genVF(X) {
    var bareme = parseFloat(v('vf-bareme')) || 1;
    var text   = richVal('vf-text');
    var fbGen  = richVal('vf-fbgen');
    var rows   = document.querySelectorAll('#vf-props .vf-row');
    if (!rows.length) throw new Error(I18N.t('msg.err_props_vide'));
    if (!validateVFDraw()) throw new Error(I18N.t('msg.err_tirage_pool', {type: I18N.t('tpl.vf_banniere')}));

    var Xe     = Math.max(1, parseInt(document.getElementById('vf-xe')?.value) || rows.length);
    var modeXb = document.getElementById('vf-mode-xb')?.value || 'fixe';
    var Xb     = parseInt(document.getElementById('vf-xb')?.value) || 1;
    function pad(n) { return n < 10 ? '0' + n : String(n); }

    /* Banque : ["texte", bool, "feedback si l'élève coche Vrai", "feedback si l'élève coche Faux"] */
    var taAll = [];
    rows.forEach(function(r, i) {
        var expEl = r.querySelector('.vf-exp:checked');
        var isV   = !(expEl && expEl.value === 'f');
        taAll.push('["' + rawEsc(r.querySelector('.vf-ptext').value.trim() || ('Prop. ' + (i+1)))
            + '",' + isV
            + ',"' + rawEsc(r.querySelector('.vf-fb-ifvrai')?.value || '')
            + '","' + rawEsc(r.querySelector('.vf-fb-iffaux')?.value || '')
            + '"]');
    });

    var nbVExpr = (modeXb === 'alea')
        ? 'rand(min(length(listV_vf' + X + '),' + Xe + '-1))+1'
        : String(Xb);

    var vars = '/* Q' + X + ' : Vrai/Faux (' + bareme + 'pt) */\n'
        + 'ta_vf' + X + '_all:[' + taAll.join(',') + '];\n'
        + 'listV_vf' + X + ':sublist(ta_vf' + X + '_all,lambda([ex],second(ex)=true));\n'
        + 'listF_vf' + X + ':sublist(ta_vf' + X + '_all,lambda([ex],second(ex)=false));\n'
        + 'nbV_vf' + X + ':' + nbVExpr + ';\n'
        + 'nbF_vf' + X + ':min(length(listF_vf' + X + '),' + Xe + '-nbV_vf' + X + ');\n'
        + 'ta_vf' + X + ':random_permutation(append('
        +   'rand_selection(listV_vf' + X + ',nbV_vf' + X + '),'
        +   'rand_selection(listF_vf' + X + ',nbF_vf' + X + ')));';

    /* Un input radio par slot — tans Maxima dynamique (radio supporte les expressions) */
    var inputsXML = '';
    for (var i = 1; i <= Xe; i++) {
        var lblVrai = I18N.t('tpl.vf_vrai'), lblFaux = I18N.t('tpl.vf_faux');
        var tans = 'if second(ta_vf' + X + '[' + i + ']) '
            + 'then [[1,true,"' + lblVrai + '"],[2,false,"' + lblFaux + '"]] '
            + 'else [[1,false,"' + lblVrai + '"],[2,true,"' + lblFaux + '"]]';
        inputsXML += '    <input>\n'
            + '      <name>ans' + X + 'p' + pad(i) + '</name>\n'
            + '      <type>radio</type>\n'
            + '      <tans>' + tans + '</tans>\n'
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
            + '      <options>nonotanswered</options>\n'
            + '    </input>\n';
    }

    /* Feedbackvariables */
    var fbVarLines = [], okTerms = [];
    for (var i = 1; i <= Xe; i++) {
        var an = 'ans' + X + 'p' + pad(i);
        var ok = 'ok_vf' + X + '_p' + pad(i);
        fbVarLines.push(ok + ':is(' + an + '=(if second(ta_vf' + X + '[' + i + ']) then 1 else 2));');
        okTerms.push('(if ' + ok + ' then 1 else 0)');
    }
    fbVarLines.push('n_ok_vf' + X + ':' + okTerms.join('+') + ';');
    fbVarLines.push('sc_vf' + X + ':float(n_ok_vf' + X + '/' + Xe + ');');
    fbVarLines.push('pct_vf' + X + ':round(sc_vf' + X + '*100);');
    var fbVars = fbVarLines.join('\n');

    /* Feedback HTML */
    var fbHtml = '<p><strong>' + I18N.t('tpl.vf_score') + ' :</strong> {@pct_vf' + X + '@} %</p>\n<div class="vf-prt-items">\n';
    for (var i = 1; i <= Xe; i++) {
        var ok = 'ok_vf' + X + '_p' + pad(i);
        var an = 'ans' + X + 'p' + pad(i);
        var fbGiven = 'if is(' + an + '=1) then third(ta_vf' + X + '[' + i + ']) else fourth(ta_vf' + X + '[' + i + '])';
        fbHtml += '<div class="vf-fb-item">'
            + '<span class="vf-pi-num">' + i + '.</span> '
            + '<strong>{@first(ta_vf' + X + '[' + i + '])@}</strong> '
            + '[[if test="is(' + ok + '=true)"]]'
            + '<span style="color:#15803d;border-left:4px solid #16a34a;padding:1px 10px">'
            + '✅ {@' + fbGiven + '@}'
            + '</span>[[/if]]'
            + '[[if test="is(' + ok + '=false)"]]'
            + '<span style="color:#dc2626;border-left:4px solid #ef4444;padding:1px 10px">'
            + '❌ {@' + fbGiven + '@}'
            + ' <em>(' + I18N.t('tpl.vf_attendu') + ' : {@if second(ta_vf' + X + '[' + i + ']) then "' + lblVrai + '" else "' + lblFaux + '"@})</em>'
            + '</span>[[/if]]'
            + '</div>\n';
    }
    fbHtml += '</div>';
    if (fbGen) fbHtml += '<div style="margin-top:10px;">' + fbGen + '</div>';

    /* PRT JSON canonique (meme schema que prt-manager.js) */
    var prtMeta = { name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    var canonicalNodes = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'sc_vf' + X, tans: '1',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbHtml,
        falsescoremode: '=', falsescore: 'sc_vf' + X, falsepenalty: '0', falsenextnode: '-1',
        falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbHtml
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    /* Question text */
    var tableRows = '';
    for (var i = 1; i <= Xe; i++) {
        tableRows += '<tr>'
            + '<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">'
            + i + '. {@first(ta_vf' + X + '[' + i + '])@}</td>'
            + '<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">'
            + '[[input:ans' + X + 'p' + pad(i) + ']]</td>'
            + '</tr>\n';
    }
    var valRefs = '';
    for (var i = 1; i <= Xe; i++) valRefs += '[[validation:ans' + X + 'p' + pad(i) + ']]';

    var textFrag = '<div style="background:#4f46e5;border-left:5px solid #3730a3;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N.t('tpl.vf_banniere') + '</strong>'
        + '<span style="background:#3730a3;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + '</div>\n'
        + '<!-- ENONCE-START -->' + (text || '') + '<!-- ENONCE-END -->\n'
        + '<table style="border-collapse:collapse;width:100%;margin-top:8px;">\n'
        + '<thead><tr>'
        + '<th style="text-align:left;padding:6px 12px;background:#eef2ff;border-bottom:2px solid #4f46e5;">' + I18N.t('tpl.vf_colonne_proposition') + '</th>'
        + '<th style="text-align:center;padding:6px 12px;background:#eef2ff;border-bottom:2px solid #4f46e5;white-space:nowrap;">' + I18N.t('tpl.vf_banniere') + '</th>'
        + '</tr></thead>\n<tbody>\n'
        + tableRows + '</tbody></table>\n'
        + '<div style="display:none">' + valRefs + '</div>';

    return {
        bareme:          bareme,
        vars:            vars,
        qnote:           '{@map(first,ta_vf' + X + ')@}',
        textFrag:        textFrag,
        inputXML:        inputsXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: '',
        feedbackRef:     '[[feedback:prt' + X + ']]'
    };
}


// ══════════════════════════════════════════════════════
//  IMGCLICK — Image Interactive / Zone Cliquable
// ══════════════════════════════════════════════════════
