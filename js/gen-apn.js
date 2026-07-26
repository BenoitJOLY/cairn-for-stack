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
        var label = cb.closest('label');
        if (k === unk) {
            cb.checked = false; cb.disabled = true;
            if (label) label.style.display = 'none';
        } else {
            cb.disabled = false;
            if (label) label.style.display = '';
        }
    });
    if (typeof apnRefreshPreview === 'function') apnRefreshPreview();
}

function genApnParams() {
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
    if (nChanged < 1) throw new Error(I18N.t('msg.err_apn_param_modifie'));

    return {
        bareme: bareme, text: text, fbOk: fbOk, fbWrong: fbWrong,
        unknown: unknown, changed: changed, nChanged: nChanged,
        fbGen: gv('apn-fbgen')
    };
}

async function genApn(X) {
    var p = genApnParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'apn', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "apn", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "apn", repli sur le calcul local.', e); }
    return genApnCore(X, p);
}

function genApnCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var bareme = p.bareme, text = p.text, fbOk = p.fbOk, fbWrong = p.fbWrong;
    var unknown = p.unknown, changed = p.changed, nChanged = p.nChanged;

    var P = 'q' + X + '_'; // préfixe Maxima : évite toute collision entre plusieurs questions APN du même document

    var unknownLabel = unknown === 'V' ? I18N_D.t('apn.lbl_vitesse_mid') : unknown === 'D' ? I18N_D.t('apn.lbl_diaphragme_mid') : I18N_D.t('apn.lbl_iso_mid');
    var cibleDisplay = unknown === 'V' ? ('{@' + P + 'V2@} s') : unknown === 'D' ? ('f/{@' + P + 'D2a@}') : ('{@' + P + 'I2@} ISO');

    // ── Listes fixes (identiques aux exports validés) ──
    var qvars = P + 'lv: [1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1,2];\n'
        + P + 'lda: [1,1.4,2,2.8,4,5.6,8,11,16,22];\n'
        + P + 'ldr: [1,sqrt(2),2,2*sqrt(2),4,4*sqrt(2),8,8*sqrt(2),16,16*sqrt(2)];\n'
        + P + 'li: [100,200,400,800,1600,3200,6400,12800];\n\n';

    // D1/V1/I1 tirés une seule fois (vraies variables de question) : seule la
    // recherche de la cible (ci-dessous) est répétée en cas d'échec de tolérance.
    qvars += P + 'idxD1: rand(length(' + P + 'lda))+1;\n'
        + P + 'D1a: ' + P + 'lda[' + P + 'idxD1];\n'
        + P + 'D1r: ' + P + 'ldr[' + P + 'idxD1];\n'
        + P + 'V1: rand(' + P + 'lv);\n'
        + P + 'I1: rand(' + P + 'li);\n'
        + P + 'K: float(' + P + 'V1*' + P + 'I1/' + P + 'D1r^2);\n\n';

    qvars += P + 'valid: false;\n'
        + P + 'attempt: 0;\n'
        + 'while not ' + P + 'valid and ' + P + 'attempt<200 do (\n'
        + '  ' + P + 'attempt: ' + P + 'attempt+1,\n';

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
        + P + 'napf: (' + P + 'D2r/' + P + 'D1r)^2;\n'
        + P + 'napo: (' + P + 'D1r/' + P + 'D2r)^2;\n'
        + P + 'nisou: ' + P + 'I2/' + P + 'I1;\n'
        + P + 'nisod: ' + P + 'I1/' + P + 'I2;\n'
        + P + 'nvR_exact: if ' + P + 'V2>' + P + 'V1 then ' + P + 'V2/' + P + 'V1 else ' + P + 'V1/' + P + 'V2;\n'
        + P + 'nvR: 2^round(log(' + P + 'nvR_exact)/log(2));\n';

    // ── Valeurs "pièges" pour le PRT pédagogique multi-nœuds : recherche de la
    // valeur standard la plus proche (même technique que pour la vraie cible),
    // pour 2 erreurs classiques (sens de compensation inversé, paramètre changé
    // ignoré), afin de donner un feedback ciblé plutôt qu'un simple "faux". ──
    var snapList = function(listVar, exprStr, outName) {
        return P + 'diffs_' + outName + ': map(lambda([x], abs(float(x)-float(' + exprStr + '))), ' + listVar + ');\n'
            + P + 'md_' + outName + ': lmin(' + P + 'diffs_' + outName + ');\n'
            + P + outName + ': first(sublist(' + listVar + ', lambda([x], abs(float(x)-float(' + exprStr + '))=' + P + 'md_' + outName + ')));\n';
    };
    var snapAperture = function(exprStr, outName) {
        return P + 'diffs_' + outName + ': map(lambda([x], abs(float(x)-float(' + exprStr + '))), ' + P + 'ldr);\n'
            + P + 'md_' + outName + ': lmin(' + P + 'diffs_' + outName + ');\n'
            + P + 'idx_' + outName + ': first(sublist(makelist(i,i,1,length(' + P + 'ldr)), lambda([i], abs(float(' + P + 'ldr[i])-float(' + exprStr + '))=' + P + 'md_' + outName + ')));\n'
            + P + outName + ': ' + P + 'lda[' + P + 'idx_' + outName + '];\n';
    };

    if (unknown === 'V') {
        qvars += snapList(P + 'lv', P + 'V1*(' + P + 'I2/' + P + 'I1)*(' + P + 'D1r/' + P + 'D2r)^2', 'winv');
        if (nChanged === 2) {
            qvars += snapList(P + 'lv', P + 'V1*(' + P + 'I2/' + P + 'I1)', 'wig1'); // diaphragme ignoré
            qvars += snapList(P + 'lv', P + 'V1*(' + P + 'D2r/' + P + 'D1r)^2', 'wig2'); // ISO ignoré
        }
    } else if (unknown === 'D') {
        qvars += snapAperture(P + 'D1r*sqrt(float((' + P + 'V1/' + P + 'V2)*(' + P + 'I1/' + P + 'I2)))', 'winv');
        if (nChanged === 2) {
            qvars += snapAperture(P + 'D1r*sqrt(float(' + P + 'I2/' + P + 'I1))', 'wig1'); // vitesse ignorée
            qvars += snapAperture(P + 'D1r*sqrt(float(' + P + 'V2/' + P + 'V1))', 'wig2'); // ISO ignoré
        }
    } else { // I
        qvars += snapList(P + 'li', P + 'I1*(' + P + 'D1r/' + P + 'D2r)^2*(' + P + 'V2/' + P + 'V1)', 'winv');
        if (nChanged === 2) {
            qvars += snapList(P + 'li', P + 'I1*(' + P + 'V1/' + P + 'V2)', 'wig1'); // diaphragme ignoré
            qvars += snapList(P + 'li', P + 'I1*(' + P + 'D2r/' + P + 'D1r)^2', 'wig2'); // vitesse ignorée
        }
    }

    // ── Énoncé (bandeau + texte enseignant ou paragraphe par défaut) ──
    var HDR = '<div style="background:#1e3a8a;border-left:5px solid #1d4ed8;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">' + I18N_D.t('apn.banniere') + '</strong>'
        + ' <span style="background:#1d4ed8;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>';

    var dPart = unknown === 'D' ? '?' : ('f/{@' + P + 'D2a@}');
    var vPart = unknown === 'V' ? '?' : ('{@' + P + 'V2@} s');
    var iPart = unknown === 'I' ? '?' : ('{@' + P + 'I2@} ISO');

    var defaultText = '<p>' + I18N_D.t('apn.default_intro') + '</p>'
        + '<ul><li>' + I18N_D.t('apn.default_diaphragme_lbl') + ' <strong>f/{@' + P + 'D1a@}</strong></li>'
        + '<li>' + I18N_D.t('apn.default_vitesse_lbl') + ' <strong>{@' + P + 'V1@} s</strong></li>'
        + '<li>' + I18N_D.t('apn.default_iso_lbl') + ' <strong>{@' + P + 'I1@} ISO</strong></li></ul>'
        + '<p>' + I18N_D.t('apn.default_modif', {dPart: dPart, vPart: vPart, iPart: iPart}) + '</p>'
        + '<p>' + I18N_D.t('apn.default_question', {label: unknownLabel}) + '</p>';

    var instrText = HDR + (text || defaultText);

    var questionText = instrText + '[[input:ans' + X + ']][[validation:ans' + X + ']]';

    // ── Feedback général automatique (analyse des changements, castext [[if]]) ──
    var autoFb = '<p>' + I18N_D.t('apn.fbgen_config_initiale') + ' f/{@' + P + 'D1a@}, {@' + P + 'V1@} s, {@' + P + 'I1@} ISO<br>'
        + I18N_D.t('apn.fbgen_config_cible') + ' f/{@' + P + 'D2a@}, {@' + P + 'V2@} s, {@' + P + 'I2@} ISO<br>'
        + I18N_D.t('apn.fbgen_reponse_correcte') + ' <strong>' + cibleDisplay + '</strong></p>'
        + '[[if test="' + P + 'dchange"]]<p><strong>' + I18N_D.t('apn.fbgen_diaphragme_lbl') + '</strong> f/{@' + P + 'D1a@} → f/{@' + P + 'D2a@}<br>'
        + '[[if test="' + P + 'dferme"]]' + I18N_D.t('apn.fbgen_diaphragme_ferme', {napf: P + 'napf'}) + '[[else]]' + I18N_D.t('apn.fbgen_diaphragme_ouvre', {napo: P + 'napo'}) + '[[/if]]</p>[[/if]]'
        + '[[if test="' + P + 'ichange"]]<p><strong>' + I18N_D.t('apn.fbgen_iso_lbl') + '</strong> {@' + P + 'I1@} → {@' + P + 'I2@} ISO<br>'
        + '[[if test="' + P + 'iaug"]]' + I18N_D.t('apn.fbgen_iso_aug', {nisou: P + 'nisou'}) + '[[else]]' + I18N_D.t('apn.fbgen_iso_dim', {nisod: P + 'nisod'}) + '[[/if]]</p>[[/if]]'
        + '[[if test="' + P + 'vchange"]]<p><strong>' + I18N_D.t('apn.fbgen_vitesse_lbl') + '</strong> {@' + P + 'V1@} s → {@' + P + 'V2@} s<br>'
        + '[[if test="' + P + 'vlent"]]' + I18N_D.t('apn.fbgen_vitesse_lent', {nvR: P + 'nvR'}) + '[[else]]' + I18N_D.t('apn.fbgen_vitesse_rapide', {nvR: P + 'nvR'}) + '[[/if]]</p>[[/if]]'
        + '<p>' + I18N_D.t('apn.fbgen_conclusion', {cible: cibleDisplay}) + '</p>';

    // ── Input : bouton radio, options calculées côté Maxima ──
    var inputXML = '<input><name>ans' + X + '</name><type>radio</type><tans>' + P + 'ta</tans>'
        + '<boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';

    // ── PRT : plusieurs nœuds de diagnostic (valeur non recalculée, sens de
    // compensation inversé, paramètre changé ignoré), puis nœud générique final ──
    var fbOkFinal = fbOk || ('<strong>' + I18N_D.t('apn.fb_ok_title') + '</strong> ' + I18N_D.t('apn.fb_ok_desc'));
    var fbWrongFinal = fbWrong || ('<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + I18N_D.t('apn.fb_wrong_correction', {cible: cibleDisplay}));

    // Comparaison sur chaîne de caractères pour l'inconnue "diaphragme" (les valeurs
    // d'affichage comme 1.4/2.8 doivent matcher exactement la chaîne soumise par le
    // bouton radio).
    var tansOf = function(expr) { return (unknown === 'D') ? ('string(' + expr + ')') : expr; };

    var oldValueVar = unknown === 'V' ? (P + 'V1') : unknown === 'D' ? (P + 'D1a') : (P + 'I1');
    var ignoredLabels = unknown === 'V'
        ? { wig1: I18N_D.t('apn.lbl_diaphragme_art'), wig2: I18N_D.t('apn.lbl_iso_art') }
        : unknown === 'D'
        ? { wig1: I18N_D.t('apn.lbl_vitesse_art'), wig2: I18N_D.t('apn.lbl_iso_art') }
        : { wig1: I18N_D.t('apn.lbl_diaphragme_art'), wig2: I18N_D.t('apn.lbl_vitesse_art') };

    var fbBox = function(msg) {
        return '<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + msg + ' ' + I18N_D.t('apn.fb_wrong_correction', {cible: cibleDisplay});
    };

    var nodes = [];
    nodes.push({
        desc: 'Réponse correcte', test: 'AlgEquiv', tans: tansOf(P + 'cible'),
        fb: fbOkFinal, fbKind: 'true', isCorrect: true
    });
    nodes.push({
        desc: 'Valeur non recalculée', test: 'AlgEquiv', tans: tansOf(oldValueVar),
        fb: fbBox(I18N_D.t('apn.msg_valeur_non_recalculee', {label: unknownLabel})), fbKind: 'false'
    });
    nodes.push({
        desc: 'Sens de compensation inversé', test: 'AlgEquiv', tans: tansOf(P + 'winv'),
        fb: fbBox(I18N_D.t('apn.msg_sens_inverse', {label: unknownLabel})), fbKind: 'false'
    });
    if (nChanged === 2) {
        nodes.push({
            desc: 'Paramètre 1 ignoré', test: 'AlgEquiv', tans: tansOf(P + 'wig1'),
            fb: fbBox(I18N_D.t('apn.msg_parametre_ignore', {label: ignoredLabels.wig1})), fbKind: 'false'
        });
        nodes.push({
            desc: 'Paramètre 2 ignoré', test: 'AlgEquiv', tans: tansOf(P + 'wig2'),
            fb: fbBox(I18N_D.t('apn.msg_parametre_ignore', {label: ignoredLabels.wig2})), fbKind: 'false'
        });
    }
    // Pas de nœud générique séparé (test toujours vrai EqualComAss(1,1)) : le
    // dernier nœud de diagnostic devient le nœud terminal, son message par
    // défaut (fbWrongFinal) passant en falsefeedback plutôt que d'être un nœud
    // à part dont la branche fausse est de toute façon inatteignable.
    nodes[nodes.length - 1].falseFb = fbWrongFinal;

    var canonicalNodes = nodes.map(function(nd, i) {
        var isLast = (i === nodes.length - 1);
        return {
            name: String(i),
            description: nd.desc,
            answertest: nd.test,
            sans: nd.sans || ('ans' + X),
            tans: nd.tans,
            testoptions: '',
            quiet: '0',
            truescoremode: '=',
            truescore: nd.isCorrect ? String(bareme) : '0',
            truepenalty: '',
            truenextnode: '-1',
            trueanswernote: 'prt' + X + '-' + i + '-T',
            truefeedback: nd.fb,
            falsescoremode: '=',
            falsescore: '0',
            falsepenalty: '',
            falsenextnode: isLast ? '-1' : String(i + 1),
            falseanswernote: 'prt' + X + '-' + i + '-F',
            falsefeedback: isLast ? (nd.falseFb || '') : ''
        };
    });
    var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: '' };
    // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
    // canonicalNodes (exposé via prt.nodes pour prt-manager.js) reste brut, sans
    // encadré, pour que l'édition manuelle du PRT n'affiche jamais de HTML de
    // présentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function(n, i) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(nodes[i].fbKind, n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var diagNodes = [];
    for (var di = 1; di < nodes.length; di++) {
        diagNodes.push({ desc: nodes[di].desc, fb: nodes[di].fb, kind: nodes[di].fbKind });
    }

    return {
        type:            'apn',
        bareme:          bareme,
        vars:            qvars,
        qnote:           'APN Q' + X + ' inconnue=' + unknown + ' modifie(s)=' + Object.keys(changed).filter(function(k){return changed[k];}).join('+')
            + ' D={@' + P + 'D1a@}->{@' + P + 'D2a@} V={@' + P + 'V1@}->{@' + P + 'V2@} I={@' + P + 'I1@}->{@' + P + 'I2@}',
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: applyFbBox_D('general', mkFbGen_D(autoFb, p.fbGen)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        diagNodes:       diagNodes
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genApn: genApn, genApnCore: genApnCore, genApnParams: genApnParams };
}
