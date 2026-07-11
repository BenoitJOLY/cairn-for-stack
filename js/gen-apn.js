// ── XML GENERATOR: APN (appareil photo numérique — triangle d'exposition) ──
// Logique alignée sur les 7 exports réels validés Moodle
// (test/mise a jour/Physique-chimie/APN/*.xml) : constante d'exposition
// K = V*I/D_reel^2 (D_reel = ouverture réelle, puissances de racine(2)),
// généralisée aux 9 combinaisons logiques {inconnue V|D|I} x {1 ou 2 des 2
// autres paramètres modifiés}, les 7 references n'en couvrant que 7.

// Empêche de cocher comme « modifié » le paramètre choisi comme inconnue
// (il n'a pas de sens de le modifier puisque c'est justement lui qu'on calcule).
function apnUnknownChange() {
    var unk = document.getElementById('apn-unknown').value;
    ['D', 'V', 'I'].forEach(function(k) {
        var cb = document.getElementById('apn-changed-' + k);
        if (!cb) return;
        if (k === unk) { cb.checked = false; cb.disabled = true; }
        else { cb.disabled = false; }
    });
    if (typeof apnRefreshPreview === 'function') apnRefreshPreview();
}

function genApn(X) {
    var gv = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var gc = function(id) { var el = document.getElementById(id); return !!el && el.checked; };

    var bareme  = parseFloat(gv('apn-bareme')) || 1;
    var text    = richVal('apn-text');
    var fbOk    = gv('apn-fb-ok');
    var fbWrong = gv('apn-fb-wrong');

    // 'V' (vitesse), 'D' (diaphragme) ou 'I' (ISO)
    var unknown = gv('apn-unknown') || 'V';
    if (unknown !== 'V' && unknown !== 'D' && unknown !== 'I') unknown = 'V';

    var changed = {
        D: unknown !== 'D' && gc('apn-changed-D'),
        V: unknown !== 'V' && gc('apn-changed-V'),
        I: unknown !== 'I' && gc('apn-changed-I')
    };
    var nChanged = (changed.D ? 1 : 0) + (changed.V ? 1 : 0) + (changed.I ? 1 : 0);
    if (nChanged < 1) throw new Error('APN : sélectionnez au moins un paramètre modifié (en plus du paramètre inconnu).');

    var P = 'q' + X + '_'; // préfixe Maxima : évite toute collision entre plusieurs questions APN du même document

    var unknownLabel = unknown === 'V' ? "vitesse d'obturation" : unknown === 'D' ? 'ouverture (diaphragme)' : 'sensibilité ISO';
    var cibleDisplay = unknown === 'V' ? ('{@' + P + 'V2@} s') : unknown === 'D' ? ('f/{@' + P + 'D2a@}') : ('{@' + P + 'I2@} ISO');

    // ── Listes fixes (identiques aux exports validés) ──
    var qvars = P + 'lv: [1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1,2];\n'
        + P + 'lda: [1,1.4,2,2.8,4,5.6,8,11,16,22];\n'
        + P + 'ldr: [1,sqrt(2),2,2*sqrt(2),4,4*sqrt(2),8,8*sqrt(2),16,16*sqrt(2)];\n'
        + P + 'li: [100,200,400,800,1600,3200,6400,12800];\n\n';

    qvars += P + 'valid: false;\n'
        + 'while not ' + P + 'valid do (\n'
        + '  ' + P + 'idxD1: rand(length(' + P + 'lda))+1,\n'
        + '  ' + P + 'D1a: ' + P + 'lda[' + P + 'idxD1],\n'
        + '  ' + P + 'D1r: ' + P + 'ldr[' + P + 'idxD1],\n'
        + '  ' + P + 'V1: rand(' + P + 'lv),\n'
        + '  ' + P + 'I1: rand(' + P + 'li),\n'
        + '  ' + P + 'K: float(' + P + 'V1*' + P + 'I1/' + P + 'D1r^2),\n';

    // ── Diaphragme : tiré (si modifié) ou reconduit (si ni modifié ni inconnu) ──
    if (unknown !== 'D') {
        if (changed.D) {
            qvars += '  ' + P + 'idxD2: rand(delete(' + P + 'idxD1, makelist(i,i,1,length(' + P + 'lda)))),\n'
                + '  ' + P + 'D2a: ' + P + 'lda[' + P + 'idxD2],\n'
                + '  ' + P + 'D2r: ' + P + 'ldr[' + P + 'idxD2],\n';
        } else {
            qvars += '  ' + P + 'D2a: ' + P + 'D1a,\n'
                + '  ' + P + 'D2r: ' + P + 'D1r,\n';
        }
    }
    // ── Vitesse : tirée (si modifiée) ou reconduite ──
    if (unknown !== 'V') {
        qvars += changed.V
            ? ('  ' + P + 'V2: rand(delete(' + P + 'V1,' + P + 'lv)),\n')
            : ('  ' + P + 'V2: ' + P + 'V1,\n');
    }
    // ── ISO : tiré (si modifié) ou reconduit ──
    if (unknown !== 'I') {
        qvars += changed.I
            ? ('  ' + P + 'I2: rand(delete(' + P + 'I1,' + P + 'li)),\n')
            : ('  ' + P + 'I2: ' + P + 'I1,\n');
    }

    // ── Calcul de la valeur théorique de l'inconnue + recherche de la valeur standard la plus proche ──
    var tol = (nChanged === 1) ? 0.1 : 0.5;
    if (unknown === 'V') {
        qvars += '  ' + P + 'theo: ' + P + 'K*' + P + 'D2r^2/' + P + 'I2,\n'
            + '  ' + P + 'diffs: map(lambda([x], abs(float(x)-float(' + P + 'theo))), ' + P + 'lv),\n'
            + '  ' + P + 'mindiff: lmin(' + P + 'diffs),\n'
            + '  ' + P + 'V2: first(sublist(' + P + 'lv, lambda([x], abs(float(x)-float(' + P + 'theo))=' + P + 'mindiff))),\n'
            + '  ' + P + 'ratiodiff: ' + P + 'mindiff/abs(float(' + P + 'theo)),\n';
        var guardV = (nChanged === 2) ? (' and ' + P + 'theo>1/4000 and ' + P + 'theo<4') : '';
        qvars += '  if (' + P + 'ratiodiff<' + tol + guardV + ' and ' + P + 'V2#' + P + 'V1) then ' + P + 'valid: true\n';
    } else if (unknown === 'D') {
        qvars += '  ' + P + 'theor: sqrt(float(' + P + 'V2*' + P + 'I2/' + P + 'K)),\n'
            + '  ' + P + 'diffs: map(lambda([x], abs(float(x)-' + P + 'theor)), ' + P + 'ldr),\n'
            + '  ' + P + 'mindiff: lmin(' + P + 'diffs),\n'
            + '  ' + P + 'idxD2: first(sublist(makelist(i,i,1,length(' + P + 'ldr)), lambda([i], abs(float(' + P + 'ldr[i])-' + P + 'theor)=' + P + 'mindiff))),\n'
            + '  ' + P + 'D2a: ' + P + 'lda[' + P + 'idxD2],\n'
            + '  ' + P + 'D2r: ' + P + 'ldr[' + P + 'idxD2],\n'
            + '  ' + P + 'ratiodiff: ' + P + 'mindiff/abs(' + P + 'theor),\n';
        qvars += '  if (' + P + 'ratiodiff<' + tol + ' and ' + P + 'idxD2#' + P + 'idxD1) then ' + P + 'valid: true\n';
    } else { // unknown === 'I'
        qvars += '  ' + P + 'theo: ' + P + 'K*' + P + 'D2r^2/' + P + 'V2,\n'
            + '  ' + P + 'diffs: map(lambda([x], abs(float(x)-float(' + P + 'theo))), ' + P + 'li),\n'
            + '  ' + P + 'mindiff: lmin(' + P + 'diffs),\n'
            + '  ' + P + 'I2: first(sublist(' + P + 'li, lambda([x], abs(float(x)-float(' + P + 'theo))=' + P + 'mindiff))),\n'
            + '  ' + P + 'ratiodiff: ' + P + 'mindiff/abs(float(' + P + 'theo)),\n';
        qvars += '  if (' + P + 'ratiodiff<' + tol + ' and ' + P + 'I2#' + P + 'I1) then ' + P + 'valid: true\n';
    }
    qvars += ');\n\n';

    // ── Valeur cible + options du bouton radio ──
    if (unknown === 'V') {
        qvars += P + 'cible: ' + P + 'V2;\n'
            + P + 'ta: map(lambda([x], [x, is(x=' + P + 'cible), sconcat(x," s")]), ' + P + 'lv);\n';
    } else if (unknown === 'I') {
        qvars += P + 'cible: ' + P + 'I2;\n'
            + P + 'ta: map(lambda([x], [x, is(x=' + P + 'cible), sconcat(x," ISO")]), ' + P + 'li);\n';
    } else { // D
        qvars += P + 'cible: ' + P + 'D2a;\n'
            + P + 'ta: map(lambda([x], [string(x), is(x=' + P + 'cible), sconcat("f/",x)]), ' + P + 'lda);\n';
    }

    // ── Diagnostics de feedback (booléens + ratios), toujours calculés : neutres
    // (change=false) quand le paramètre correspondant n'a ni changé ni été l'inconnue ──
    qvars += P + 'dchange: if ' + P + 'D2a # ' + P + 'D1a then true else false;\n'
        + P + 'dferme: if ' + P + 'D2a > ' + P + 'D1a then true else false;\n'
        + P + 'ichange: if ' + P + 'I2 # ' + P + 'I1 then true else false;\n'
        + P + 'iaug: if ' + P + 'I2 > ' + P + 'I1 then true else false;\n'
        + P + 'vchange: if ' + P + 'V2 # ' + P + 'V1 then true else false;\n'
        + P + 'vlent: if ' + P + 'V2 > ' + P + 'V1 then true else false;\n'
        + P + 'napf: (' + P + 'D1r/' + P + 'D2r)^2;\n'
        + P + 'napo: (' + P + 'D2r/' + P + 'D1r)^2;\n'
        + P + 'nisou: ' + P + 'I2/' + P + 'I1;\n'
        + P + 'nisod: ' + P + 'I1/' + P + 'I2;\n'
        + P + 'nvR_exact: if ' + P + 'V2>' + P + 'V1 then ' + P + 'V2/' + P + 'V1 else ' + P + 'V1/' + P + 'V2;\n'
        + P + 'nvR: 2^round(log(' + P + 'nvR_exact)/log(2));\n';

    // ── Énoncé (bandeau + texte enseignant ou paragraphe par défaut) ──
    var HDR = '<div style="background:#1e3a8a;border-left:5px solid #1d4ed8;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Photographie — Triangle d\'exposition</strong>'
        + ' <span style="background:#1d4ed8;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>';

    var dPart = unknown === 'D' ? '?' : ('f/{@' + P + 'D2a@}');
    var vPart = unknown === 'V' ? '?' : ('{@' + P + 'V2@} s');
    var iPart = unknown === 'I' ? '?' : ('{@' + P + 'I2@} ISO');

    var defaultText = '<p>Une prise de vue est réalisée avec les réglages suivants :</p>'
        + '<ul><li>Diaphragme : <strong>f/{@' + P + 'D1a@}</strong></li>'
        + '<li>Vitesse : <strong>{@' + P + 'V1@} s</strong></li>'
        + '<li>Sensibilité : <strong>{@' + P + 'I1@} ISO</strong></li></ul>'
        + '<p>Vous modifiez les réglages pour passer à : diaphragme ' + dPart + ', vitesse ' + vPart + ', ISO ' + iPart + '.</p>'
        + '<p>Quelle ' + unknownLabel + ' devez-vous régler pour conserver une exposition identique ?</p>';

    var instrText = HDR + (text || defaultText);

    var questionText = instrText + '[[input:ans' + X + ']][[validation:ans' + X + ']]';

    // ── Feedback général automatique (analyse des changements, castext [[if]]) ──
    var autoFb = '<p>Configuration initiale : f/{@' + P + 'D1a@}, {@' + P + 'V1@} s, {@' + P + 'I1@} ISO<br>'
        + 'Configuration cible : f/{@' + P + 'D2a@}, {@' + P + 'V2@} s, {@' + P + 'I2@} ISO<br>'
        + 'Réponse correcte : <strong>' + cibleDisplay + '</strong></p>'
        + '[[if test="' + P + 'dchange"]]<p><strong>Diaphragme :</strong> f/{@' + P + 'D1a@} → f/{@' + P + 'D2a@}<br>'
        + '[[if test="' + P + 'dferme"]]Vous fermez le diaphragme : cela laisse entrer {@' + P + 'napf@} fois moins de lumière.[[else]]Vous ouvrez le diaphragme : cela laisse entrer {@' + P + 'napo@} fois plus de lumière.[[/if]]</p>[[/if]]'
        + '[[if test="' + P + 'ichange"]]<p><strong>Sensibilité ISO :</strong> {@' + P + 'I1@} → {@' + P + 'I2@} ISO<br>'
        + '[[if test="' + P + 'iaug"]]La sensibilité augmente : le capteur devient {@' + P + 'nisou@} fois plus sensible.[[else]]La sensibilité diminue : le capteur devient {@' + P + 'nisod@} fois moins sensible.[[/if]]</p>[[/if]]'
        + '[[if test="' + P + 'vchange"]]<p><strong>Vitesse d\'obturation :</strong> {@' + P + 'V1@} s → {@' + P + 'V2@} s<br>'
        + '[[if test="' + P + 'vlent"]]Le temps de pose est {@' + P + 'nvR@} fois plus long (obturation plus lente).[[else]]Le temps de pose est {@' + P + 'nvR@} fois plus court (obturation plus rapide).[[/if]]</p>[[/if]]'
        + '<p>Pour conserver une exposition équivalente (même quantité de lumière reçue par le capteur), la valeur correcte est <strong>' + cibleDisplay + '</strong>.</p>';

    // ── Input : bouton radio, options calculées côté Maxima ──
    var inputXML = '<input><name>ans' + X + '</name><type>radio</type><tans>' + P + 'ta</tans>'
        + '<boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';

    // ── PRT : un seul nœud AlgEquiv (comme les 7 références) ──
    var fbOkFinal = fbOk || '<div style="border-left:4px solid #15803d;padding:8px 12px;background:#f0fdf4;border-radius:4px;margin-bottom:10px;">✅ <strong>Correct !</strong> Cette valeur permet de conserver la même exposition.</div>';
    var fbWrongFinal = fbWrong || ('<div style="border-left:4px solid #dc2626;padding:8px 12px;background:#fef2f2;border-radius:4px;margin-bottom:10px;">❌ <strong>Incorrect.</strong> La valeur correcte était <code>' + cibleDisplay + '</code>.</div>');

    // Comparaison sur chaîne de caractères pour l'inconnue "diaphragme" (les valeurs
    // d'affichage comme 1.4/2.8 doivent matcher exactement la chaîne soumise par le
    // bouton radio, cf. pattern des references : d_cible: string(D2_affichage)).
    var prtFeedbackVars = (unknown === 'D') ? (P + 'cible: string(' + P + 'D2a);') : '';

    var canonicalNodes = [{
        name: '0',
        description: '',
        answertest: 'AlgEquiv',
        sans: 'ans' + X,
        tans: P + 'cible',
        testoptions: '',
        quiet: '0',
        truescoremode: '=',
        truescore: String(bareme),
        truepenalty: '',
        truenextnode: '-1',
        trueanswernote: 'prt' + X + '-1-T',
        truefeedback: fbOkFinal,
        falsescoremode: '=',
        falsescore: '0',
        falsepenalty: '',
        falsenextnode: '-1',
        falseanswernote: 'prt' + X + '-1-F',
        falsefeedback: fbWrongFinal
    }];
    var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: prtFeedbackVars };
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    return {
        type:            'apn',
        bareme:          bareme,
        vars:            qvars,
        qnote:           'APN Q' + X + ' inconnue=' + unknown + ' modifie(s)=' + Object.keys(changed).filter(function(k){return changed[k];}).join('+'),
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: _mkFbGen(autoFb, gv('apn-fbgen')),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        diagNodes:       []
    };
}
