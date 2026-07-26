// ── XML GENERATORS: changement de base ──
// Logique et PRT alignes sur les exports reels valides Moodle
// (test/mise a jour/Informatique/Conversion base N/*.xml) : conversion
// via liste de chiffres + methode de Horner (base -> decimal) et divisions
// successives (decimal -> base), generalisees a une base source et une
// base cible quelconques (2 a 36), avec diagnostics d'erreurs frequentes.

// Extrait dans sa propre fonction (aucun accès DOM au-delà de la lecture) pour que
// js/preview.js puisse reconstruire p et appeler genBasenCore() directement en
// synchrone (l'aperçu élève a besoin du vrai résultat du générateur immédiatement,
// il ne peut pas attendre un aller-retour /api/generate) — voir renderPreviewHTML_basen.
function genBasenParams() {
    var gv = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };

    var format     = gv('bn-format')   || 'S';
    var fromBase   = parseInt(gv('bn-from-base')) || 10;
    var toBase     = parseInt(gv('bn-to-base'))   || 2;
    var valueMode  = gv('bn-value-mode') || 'fixe';
    var valueBase  = gv('bn-value-base') || 'depart';
    var bareme     = parseFloat(gv('bn-bareme'))   || 1;
    var fbOk       = gv('bn-fb-ok');
    var fbWrong    = gv('bn-fb-wrong');
    var text       = richVal('bn-text');

    // Largeur fixe (nombre de chiffres imposé, complete de zeros devant) : n'a de sens
    // que si la reponse attendue est dans une autre base que 10 (sinon ignoree).
    var fixedWidthRaw = parseInt(gv('bn-fixed-width'));
    var fixedWidth = (toBase !== 10 && fixedWidthRaw > 0) ? fixedWidthRaw : 0;

    return {
        format: format, fromBase: fromBase, toBase: toBase,
        valueMode: valueMode, valueBase: valueBase, bareme: bareme,
        fbOk: fbOk, fbWrong: fbWrong, text: text, fixedWidth: fixedWidth,
        valueMin: parseInt(gv('bn-value-min')), valueMax: parseInt(gv('bn-value-max')),
        valueRaw: gv('bn-value'),
        fbGen: gv('bn-fbgen')
    };
}

async function genBasen(X) {
    var p = genBasenParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'basen', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "basen", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "basen", repli sur le calcul local.', e); }
    return genBasenCore(X, p);
}

function genBasenCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var bnStrictParse_D = deps.bnStrictParse || bnStrictParse;
    var bnSyntaxHint_D = deps.bnSyntaxHint || (typeof bnSyntaxHint === 'function' ? bnSyntaxHint : null);
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var format = p.format, fromBase = p.fromBase, toBase = p.toBase;
    var valueMode = p.valueMode, valueBase = p.valueBase, bareme = p.bareme;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, text = p.text, fixedWidth = p.fixedWidth;

    var baseName = function(b) {
        return b===2?I18N_D.t('bn.basename_binaire'):b===8?I18N_D.t('bn.basename_octal'):b===10?I18N_D.t('bn.basename_decimal'):b===16?I18N_D.t('bn.basename_hexadecimal'):I18N_D.t('bn.basename_generic',{b:String(b)});
    };

    // La notation ne concerne que la base d'arrivee (c'est la reponse attendue de l'eleve) :
    // la valeur de depart est toujours affichee en notation suffixe simple.
    var toBaseFormat = (format === 'C' && (toBase === 2 || toBase === 8 || toBase === 16)) ? 'C' : 'S';
    var prefix = (toBaseFormat === 'C') ? (toBase === 2 ? '0b' : toBase === 8 ? '0o' : '0x') : '';

    var vVal  = 'q' + X + '_val';
    var vSym  = 'q' + X + '_sym';
    var vDigitFn  = 'q' + X + '_digitlist';
    var vListFn   = 'q' + X + '_liststr';
    var vHornerFn = 'q' + X + '_horner';
    var vSrcDigits = 'q' + X + '_srcdigits';
    var vSrcStr    = 'q' + X + '_srcstr';
    var vDstDigits = 'q' + X + '_dstdigits';
    var vDstRaw    = 'q' + X + '_dstraw';
    var vDstStr    = 'q' + X + '_dststr';
    var vDstStrRev = 'q' + X + '_dststrrev';
    var vLower     = 'q' + X + '_lower';
    var vHasSpace  = 'q' + X + '_hasspace';
    var vHasPrefix = 'q' + X + '_hasprefix';
    var vHasLetters= 'q' + X + '_hasletters';
    var vLeadZero  = 'q' + X + '_leadzero';
    var vValidChars= 'q' + X + '_validchars';

    var vMisread10 = 'q' + X + '_misread10';
    var vSrcRevVal = 'q' + X + '_srcrevval';

    // Expression Maxima de la valeur decimale de base (vVal) : litteral fixe ou tirage aleatoire.
    var valExpr;
    if (valueMode === 'aleatoire') {
        var bnMin = p.valueMin;
        var bnMax = p.valueMax;
        if (isNaN(bnMin)) bnMin = 0;
        if (isNaN(bnMax)) bnMax = bnMin + 1;
        if (bnMax < bnMin) { var bnTmp = bnMin; bnMin = bnMax; bnMax = bnTmp; }
        valExpr = bnMin + '+rand(' + (bnMax - bnMin + 1) + ')';
    } else {
        var chosenBase = (valueBase === 'arrivee') ? toBase : fromBase;
        var parsedVal = bnStrictParse_D(p.valueRaw, chosenBase);
        valExpr = String(parsedVal === null ? 42 : parsedVal);
    }

    var qvars = vSym + ': charlist("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");\n'
        + vDigitFn + '(qval, qbase) := block([q: qval, res: []],\n'
        + '    if q = 0 then return([0]),\n'
        + '    while q > 0 do (\n'
        + '        res: cons(mod(q, qbase), res),\n'
        + '        q: quotient(q, qbase)\n'
        + '    ),\n'
        + '    res\n'
        + ');\n'
        + vListFn + '(lst) := simplode(map(lambda([d], ' + vSym + '[d+1]), lst));\n'
        + vHornerFn + '(lst, qbase) := block([res: 0], for d in lst do res: res*qbase + d, res);\n'
        + vVal + ': ' + valExpr + ';\n';

    // ── Representation de la valeur de depart (affichee a l eleve) ──
    if (fromBase === 10) {
        qvars += vSrcStr + ': string(' + vVal + ');\n';
    } else {
        qvars += vSrcDigits + ': ' + vDigitFn + '(' + vVal + ', ' + fromBase + ');\n'
            + vSrcStr + ': ' + vListFn + '(' + vSrcDigits + ');\n';
    }

    // ── Representation de la reponse attendue (base d arrivee) ──
    // Charset des caracteres valides, calcule cote JS (base connue a la generation) :
    // utilise plus bas pour construire les diagnostics (feedbackvariables), sans jamais
    // passer par une regex Maxima reconstruite au runtime (charlist/makelist/sconcat
    // produisait une classe de caracteres avec doublons -- source du bug ou une reponse
    // valide, ex. "101011" en base 2, etait signalee comme "caracteres invalides").
    var charsetList = (toBase !== 10)
        ? ('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, toBase) + '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, toBase))
        : '';
    var charsetListLiteral = '[' + charsetList.split('').map(function(c){ return '"' + c + '"'; }).join(',') + ']';

    if (toBase === 10) {
        qvars += vDstStr + ': string(' + vVal + ');\n';
    } else {
        qvars += vDstDigits + ': ' + vDigitFn + '(' + vVal + ', ' + toBase + ');\n'
            + vDstRaw + ': ' + vListFn + '(' + vDstDigits + ');\n';
        if (fixedWidth > 0) {
            // Complete la reponse attendue avec des zeros devant pour atteindre la largeur imposee.
            qvars += vDstRaw + ': sconcat(smake(max(0, ' + fixedWidth + ' - slength(' + vDstRaw + ')), "0"), ' + vDstRaw + ');\n';
        }
        qvars += vDstStr + ': sconcat("' + prefix + '", ' + vDstRaw + ');\n'
            + vDstStrRev + ': sconcat("' + prefix + '", sreverse(' + vDstRaw + '));\n'
            + vLower + ': sdowncase(' + vDstStr + ');\n';
    }

    // ── Pieges classiques utilises seulement quand la base d arrivee est 10 ──
    if (toBase === 10 && fromBase !== 10) {
        qvars += vMisread10 + ': ' + vHornerFn + '(' + vSrcDigits + ', 10);\n'
            + vSrcRevVal + ': ' + vHornerFn + '(reverse(' + vSrcDigits + '), ' + fromBase + ');\n';
    }

    // ── Rappel du format de saisie attendu (toujours affiche a l eleve) ──
    // Reutilise bnSyntaxHint (basen-ui.js) : source unique du texte, partagee avec
    // l'apercu de l'onglet Config pour eviter que les deux textes divergent.
    var syntaxHint = bnSyntaxHint_D
        ? bnSyntaxHint_D(format, toBase, fixedWidth)
        : I18N_D.t('bn.syntaxhint_fallback');
    // Affiche en texte simple juste AVANT la zone de saisie (qui doit rester la
    // toute derniere chose avant le feedback) : le champ <syntaxhint> du STACK
    // <input> reste vide (sinon STACK pre-remplit la zone de reponse avec ce
    // texte, que l'eleve doit effacer avant de taper sa reponse).
    var conseilsHTML = '<p style="font-size:.85em;color:#374151;">' + syntaxHint + '</p>';

    var HDR = '<div style="background:#1e3a8a;border-left:5px solid #1d4ed8;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">' + I18N_D.t('bn.banniere', {base: baseName(toBase)}) + '</strong>'
        + ' <span style="background:#1d4ed8;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
        + ' <span style="background:#ffffff;color:#1d4ed8;border:1px solid #1d4ed8;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">🔢 ' + I18N_D.t('bn.base_badge', {toBase: String(toBase)}) + '</span></div>';

    var widthUnit = (toBase === 2) ? I18N_D.t('bn.unit_bit') : I18N_D.t('bn.unit_chiffre');
    var fromPart = (fromBase !== 10) ? I18N_D.t('bn.frompart', {fromBase: String(fromBase)}) : '';
    var widthPart = (fixedWidth > 0) ? I18N_D.t('bn.widthpart', {width: String(fixedWidth), unit: widthUnit + (fixedWidth > 1 ? 's' : '')}) : '';
    var instrText = HDR + (text || ('<p>' + I18N_D.t('bn.default_question', {
        val: '{@' + vSrcStr + '@}', fromPart: fromPart, toName: baseName(toBase), toBase: String(toBase), widthPart: widthPart
    }) + '</p>'));

    // ── Feedback general automatique, mirroring des exports reels ──
    var autoFb;
    if (toBase === 10) {
        autoFb = '<p>' + I18N_D.t('bn.fbgen_to_decimal', {val: '{@' + vSrcStr + '@}', fromBase: String(fromBase)}) + '</p>'
            + '<p>' + I18N_D.t('bn.fbgen_to_decimal_result', {val: '{@' + vSrcStr + '@}', fromBase: String(fromBase), valDec: '{@' + vVal + '@}'}) + '</p>';
    } else {
        autoFb = '<p>' + I18N_D.t('bn.fbgen_to_base', {val: '{@' + vSrcStr + '@}', toBase: String(toBase)}) + '</p>'
            + '<p>' + I18N_D.t('bn.fbgen_to_base_result', {val: '{@' + vSrcStr + '@}', fromBase: String(fromBase), valDst: '{@' + vDstStr + '@}', toBase: String(toBase)}) + '</p>';
    }

    // ── Type et tans de l input ──
    var inputType, tansMaxima;
    if (toBase === 10) {
        inputType = 'algebraic';
        tansMaxima = vVal;
    } else {
        inputType = 'string';
        tansMaxima = vDstStr;
    }

    var inputXML = '<input><name>ans' + X + '</name>'
        + '<type>' + inputType + '</type><tans>' + tansMaxima + '</tans>'
        + '<boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>1</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>1</showvalidation><options></options></input>';

    // ── Construction des noeuds du PRT ──
    var nodes = [];
    var fbVars = '';
    var fbOkFinal = fbOk || ('<strong>' + I18N_D.t('mat.fb_ok_correct') + '</strong> ' + I18N_D.t('bn.fb_ok_desc'));
    var fbWrongFinal = fbWrong || ('<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> '
        + I18N_D.t('bn.fb_wrong_resultat', {val: '{@' + (toBase === 10 ? vVal : vDstStr) + '@}'}));

    if (toBase === 10) {
        nodes.push({ desc: 'Reponse exacte', test: 'EqualComAss', tans: vVal, fb: fbOkFinal, fbKind: 'true', isCorrect: true });
        if (fromBase !== 10) {
            nodes.push({
                desc: 'Lecture comme un nombre decimal', test: 'EqualComAss', tans: vMisread10,
                fb: '<strong>' + I18N_D.t('bn.fb_err_base_title') + '</strong> ' + I18N_D.t('bn.fb_err_base_desc', {fromBase: String(fromBase)}), fbKind: 'false'
            });
            nodes.push({
                desc: 'Poids des chiffres inverses', test: 'EqualComAss', tans: vSrcRevVal,
                fb: '<strong>' + I18N_D.t('bn.fb_err_sens_title') + '</strong> ' + I18N_D.t('bn.fb_err_sens_desc', {fromBase: String(fromBase)}), fbKind: 'false'
            });
        }
        // Noeud "attrape-tout" toujours vrai (EqualComAss 1=1) : pas besoin de regex ici,
        // ce noeud ne sert qu'a afficher le feedback generique quand aucun autre noeud
        // au-dessus n'a matche.
        nodes.push({ desc: 'Erreur de calcul generique', test: 'EqualComAss', sans: '1', tans: '1', fb: fbWrongFinal, fbKind: 'false', isFinal: true });
    } else {
        // ── Diagnostics de format calcules en Maxima (feedbackvariables), pas en RegExp ──
        // Chaque diagnostic est un booleen precalcule via des fonctions de chaine simples
        // (ssearch/charlist/member/sublist), teste ensuite par un noeud EqualComAss contre
        // "true". On evite ainsi toute regex reconstruite au runtime (source du bug ou une
        // reponse valide, ex. "101011" en base 2, etait signalee comme invalide).
        var ansVar = 'ans' + X;
        fbVars += vHasSpace + ': is(ssearch(" ", ' + ansVar + ') # false);\n';
        if (toBaseFormat === 'S') {
            fbVars += vHasPrefix + ': is(ssearch("0b", sdowncase(' + ansVar + ')) = 1 or ssearch("0x", sdowncase(' + ansVar + ')) = 1 or ssearch("0o", sdowncase(' + ansVar + ')) = 1);\n';
            if (toBase <= 10) {
                fbVars += vHasLetters + ': is(sublist(charlist(' + ansVar + '), lambda([c], member(c, append(charlist("abcdefghijklmnopqrstuvwxyz"), charlist("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))))) # []);\n';
            }
            // Zeros inutiles au debut : diagnostic desactive quand une largeur fixe est imposee,
            // puisque les zeros de tete sont alors exiges (et non plus une erreur).
            if (!fixedWidth) {
                fbVars += vLeadZero + ': if slength(' + ansVar + ') > 1 then is(first(charlist(' + ansVar + ')) = "0") else false;\n';
            }
        }
        fbVars += vValidChars + ': is(sublist(charlist(' + ansVar + '), lambda([c], not member(c, ' + charsetListLiteral + '))) = []);\n';

        nodes.push({ desc: 'Reponse exacte', test: 'String', tans: vDstStr, fb: fbOkFinal, fbKind: 'true', isCorrect: true });
        nodes.push({
            desc: 'Espaces detectes', test: 'EqualComAss', sans: vHasSpace, tans: 'true',
            fb: '<strong>' + I18N_D.t('bn.fb_format_incorrect') + '</strong> ' + I18N_D.t('bn.fb_err_espaces_desc'), fbKind: 'partial'
        });
        if (toBaseFormat === 'S') {
            nodes.push({
                desc: 'Prefixe interdit detecte', test: 'EqualComAss', sans: vHasPrefix, tans: 'true',
                fb: '<strong>' + I18N_D.t('bn.fb_format_incorrect') + '</strong> ' + I18N_D.t('bn.fb_err_prefixe_desc'), fbKind: 'false'
            });
            if (toBase <= 10) {
                nodes.push({
                    desc: 'Lettres interdites detectees', test: 'EqualComAss', sans: vHasLetters, tans: 'true',
                    fb: '<strong>' + I18N_D.t('bn.fb_format_incorrect') + '</strong> ' + I18N_D.t('bn.fb_err_lettres_desc', {toBase: String(toBase)}), fbKind: 'false'
                });
            } else {
                nodes.push({
                    desc: 'Minuscules utilisees', test: 'String', tans: vLower,
                    fb: '<strong>' + I18N_D.t('bn.fb_presque_correct') + '</strong> ' + I18N_D.t('bn.fb_err_minuscules_desc'), fbKind: 'partial'
                });
            }
            if (!fixedWidth) {
                nodes.push({
                    desc: 'Zeros inutiles au debut', test: 'EqualComAss', sans: vLeadZero, tans: 'true',
                    fb: '<strong>' + I18N_D.t('bn.fb_presque_correct') + '</strong> ' + I18N_D.t('bn.fb_err_zeros_desc'), fbKind: 'partial'
                });
            }
        }
        nodes.push({
            desc: 'Recopie de la valeur de depart', test: 'String', tans: vSrcStr,
            fb: '<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + I18N_D.t('bn.fb_err_recopie_desc', {toBase: String(toBase)}), fbKind: 'false'
        });
        nodes.push({
            desc: 'Restes lus a l\'envers', test: 'String', tans: vDstStrRev,
            fb: '<strong>' + I18N_D.t('bn.fb_err_lecture_title') + '</strong> ' + I18N_D.t('bn.fb_err_lecture_desc'), fbKind: 'false'
        });
        nodes.push({
            desc: 'Caracteres valides pour la base ' + toBase, test: 'EqualComAss', sans: vValidChars, tans: 'true',
            fb: fbWrongFinal, fbKind: 'false',
            isFinal: true,
            falseFb: '<strong>' + I18N_D.t('bn.fb_err_carac_title') + '</strong> ' + I18N_D.t('bn.fb_err_carac_desc', {toBase: String(toBase)}), falseFbKind: 'false'
        });
    }

    // ── Noeuds PRT au format JSON canonique (meme schema que prt-manager.js) ──
    // Le PRT manager edite un objet {meta, nodes} en memoire, jamais du XML brut ;
    // buildPrtXml_D() (prt-manager.js) est le SEUL serialiseur XML, partage par tous
    // les types migres. Ainsi la structure editee et la structure exportee sont
    // toujours la meme representation, sans aller-retour XML fragile.
    var canonicalNodes = nodes.map(function(nd, i) {
        var isLast = (i === nodes.length - 1);
        var trueScoreMode = nd.isCorrect ? '+' : '-';
        var trueScore = nd.isCorrect ? String(bareme) : '0';
        return {
            name: String(i),
            description: nd.desc,
            answertest: nd.test,
            sans: nd.sans || ('ans' + X),
            tans: nd.tans,
            testoptions: '',
            quiet: '0',
            truescoremode: trueScoreMode,
            truescore: trueScore,
            truepenalty: '',
            truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-' + i + '-T',
            truefeedback: nd.fb,
            falsescoremode: '-',
            falsescore: '0',
            falsepenalty: '',
            falsenextnode: isLast ? '-1' : String(i + 1),
            falseanswernote: 'PRT' + X + '-' + i + '-F',
            falsefeedback: nd.falseFb || ''
        };
    });
    var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVars };
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (ci-dessus, expose via prt.nodes pour prt-manager.js) reste brut,
    // sans encadre, pour que l'edition manuelle du PRT ne montre jamais de HTML de
    // presentation. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = canonicalNodes.map(function(n, i) {
        var nd = nodes[i];
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(nd.fbKind, n.truefeedback),
            falsefeedback: applyFbBox_D(nd.falseFbKind || 'false', n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var questionText = instrText
        + conseilsHTML
        + '[[input:ans' + X + ']][[validation:ans' + X + ']]';

    // ── Diagnostics intermediaires (tous les noeuds sauf le 1er "reponse exacte") ──
    // Expose pour l'apercu : le PRT reel enchaine plusieurs noeuds de diagnostic
    // (espaces, prefixe interdit, minuscules, zeros inutiles, recopie, ordre inverse...)
    // qui ne rentrent pas dans le gabarit generique "2 boites Ok/Faux" utilise par les
    // autres types (eux n'ont qu'un seul noeud PRT). Sans cette liste, ces feedbacks
    // resteraient invisibles dans l'apercu de l'onglet Config.
    var diagNodes = [];
    for (var di = 1; di < nodes.length; di++) {
        var dn = nodes[di];
        var isLastDiag = (di === nodes.length - 1);
        // Le dernier noeud avant fin reutilise fbWrongFinal (= la boite "Feedback si FAUX"
        // standard) : on ne le reaffiche pas ici pour eviter un doublon dans l'apercu.
        if (dn.fb && !(isLastDiag && dn.fb === fbWrongFinal)) diagNodes.push({ desc: dn.desc, fb: dn.fb, kind: dn.fbKind });
        if (dn.falseFb) diagNodes.push({ desc: dn.desc + ' (caracteres invalides)', fb: dn.falseFb, kind: dn.falseFbKind });
    }

    return {
        type:            'basen',
        bareme:          bareme,
        vars:            qvars,
        qnote:           'BaseN Q' + X + ' val={@' + vVal + '@} ' + baseName(fromBase) + '->' + baseName(toBase),
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        prt:             { meta: prtMeta, nodes: canonicalNodes },
        // Encadre "general" applique ici (export final ET apercu partagent ce meme champ) :
        // pas de risque de round-trip brut, le texte reellement edite par l'enseignant
        // (p.fbGen / bn-fbgen) est stocke a part (state.fbGen, config-panel-basen.js),
        // jamais reparse depuis generalFeedback.
        generalFeedback: applyFbBox_D('general', mkFbGen_D(autoFb, p.fbGen)),
        feedbackRef:     '[[feedback:prt' + X + ']]',
        diagNodes:       diagNodes
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genBasen: genBasen, genBasenCore: genBasenCore, genBasenParams: genBasenParams };
}
// ==============================================================
//  genCircuit -- Circuits electriques (loi d Ohm, serie, parallele)
// ==============================================================
