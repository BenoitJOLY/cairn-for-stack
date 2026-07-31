// ── GÉOMÉTRIE ANALYTIQUE ──
// Refonte : plus de préréglage, le "Type de question" pilote seul le
// scénario. Choix 2D/3D (distance, milieu, norme, aire) et valeurs
// aléatoires (Maxima) ou fixes (saisies par l'enseignant). Constructions
// reconstruites à partir des exemples validés Moodle de
// test/mise à jour/Math/Geometrie/*.xml : mêmes variables Maxima, mêmes
// formules, et PRT diagnostiques séquentiels détectant les erreurs types
// (avec feedback dédié pour chacune) suivis d'un feedback général détaillé.

// ── _geoKindMap : correspondance kind local ('ok'/'warn'/'bad') → kind partagé
// js/fb-box.js ('true'/'partial'/'false'). Le HTML de présentation (bordure,
// fond, icône) n'est plus baké ici : le contenu reste en texte brut (édité par
// prt-manager.js) et n'est habillé qu'aux points d'affichage/export via
// applyFbBox() — voir _geoSeqPrt ci-dessous, même pattern que js/gen-basen.js.
var _GEO_KIND_MAP = { ok: 'true', warn: 'partial', bad: 'false' };

function _geoGenFbBox(bodyHtml, deps) {
    var I18N_D = (deps && deps.I18N) || I18N;
    return '<div style="font-weight:bold;margin-bottom:10px;">' + I18N_D.t('calc.correction_detaillee_lbl') + '</div>'
        + '<div style="font-size:.9rem;">' + bodyHtml + '</div>';
}

// Point/vecteur en LaTeX, avec ou sans composante z selon la dimension.
function _geoPointTex(X, sx, sy, sz, d3) {
    var x = `{@q${X}_${sx}@}`, y = `{@q${X}_${sy}@}`, z = `{@q${X}_${sz}@}`;
    return d3 ? `\\left(${x}\\;;\\;${y}\\;;\\;${z}\\right)` : `\\left(${x}\\;;\\;${y}\\right)`;
}
function _geoVecTex(X, sx, sy, sz, d3) {
    var x = `{@q${X}_${sx}@}`, y = `{@q${X}_${sy}@}`, z = `{@q${X}_${sz}@}`;
    return d3 ? `\\begin{pmatrix}${x}\\\\${y}\\\\${z}\\end{pmatrix}` : `\\begin{pmatrix}${x}\\\\${y}\\end{pmatrix}`;
}

// Nœud d'un PRT diagnostique séquentiel : si le test échoue, on enchaîne
// sur le nœud suivant (falsenextnode) jusqu'au nœud générique final.
function _geoSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv', sans: spec.sans, tans: spec.tans,
        testoptions: spec.testoptions || '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: ''
    };
}
function _geoSeqPrt(X, bareme, specs, deps) {
    var buildPrtXml_D = (deps && deps.buildPrtXml) || buildPrtXml;
    var applyFbBox_D = (deps && deps.applyFbBox) || applyFbBox;
    var nodes = specs.map(function (spec, idx) { return _geoSeqNode(X, idx, idx === specs.length - 1, spec); });
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
    // nodes (canonicalNodes, exposé via prt.nodes pour prt-manager.js) reste en texte
    // brut, sans encadré. Voir js/fb-box.js (applyFbBox).
    var xmlNodes = nodes.map(function (n, idx) {
        var kind = _GEO_KIND_MAP[specs[idx].kind] || 'false';
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(kind, n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml_D(prtMeta, xmlNodes) };
}

// Noeuds de diagnostic intermediaires (entre le noeud "reponse correcte" et le
// noeud generique final) : leur feedback ne rentre pas dans le gabarit standard
// a 2 boites Ok/Faux de l'apercu, donc on les expose a part (cf. genBaseN /
// diagNodes) pour que rien ne reste invisible dans l'onglet Config.
function _geoDiagNodes(specs) {
    return specs.slice(1, -1).map(function (s) { return { desc: s.description, fb: s.feedback }; });
}

function _geoBuildParams() {
    var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var gnRaw = function (id) { return parseFloat(gs(id)); };
    return {
        bareme: parseFloat(gs('geo-bareme')) || 1,
        scenario: gs('geo-scenario') || 'distance',
        mode: gs('geo-mode') || 'aleatoire',
        dimSel: gs('geo-dim') || '2d',
        fbOk: gs('geo-fb-ok'), fbWrong: gs('geo-fb-wrong'),
        custText: gs('geo-text').trim(),
        fbGenRaw: gs('geo-fbgen'),
        p1x: gnRaw('geo-p1x'), p1y: gnRaw('geo-p1y'), p1z: gnRaw('geo-p1z'),
        p2x: gnRaw('geo-p2x'), p2y: gnRaw('geo-p2y'), p2z: gnRaw('geo-p2z'),
        p3x: gnRaw('geo-p3x'), p3y: gnRaw('geo-p3y'), p3z: gnRaw('geo-p3z')
    };
}

async function genGeometrie(X) {
    var p = _geoBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'geometrie', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "geometrie", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "geometrie", repli sur le calcul local.', e); }
    return genGeometrieCore(X, p);
}

function genGeometrieCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var geoSeqPrt_D = deps._geoSeqPrt || _geoSeqPrt;
    var geoGenFbBox_D = deps._geoGenFbBox || _geoGenFbBox;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var gn = function (v, def) { return isNaN(v) ? def : v; };
    var bareme = p.bareme, scenario = p.scenario, mode = p.mode, dimSel = p.dimSel;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, prtMeta, diagNodes;

    var HDR = `<div style="background:#059669;border-left:5px solid #047857;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('geo.banniere')}</strong> <span style="background:#047857;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'distance' || scenario === 'milieu') {
        var d3dm = dimSel === '3d';
        var repere = d3dm ? I18N_D.t('geo.repere_espace') : I18N_D.t('geo.repere_plan');
        var declA, declB;
        if (mode === 'fixe') {
            declA = `q${X}_xa:${gn(p.p1x, 1)};q${X}_ya:${gn(p.p1y, 2)};q${X}_za:${d3dm ? gn(p.p1z, 0) : 0};`;
            declB = `q${X}_xb:${gn(p.p2x, 4)};q${X}_yb:${gn(p.p2y, 6)};q${X}_zb:${d3dm ? gn(p.p2z, 1) : 0};`;
        } else {
            declA = `q${X}_xa:ri(-5,5);q${X}_ya:ri(-5,5);q${X}_za:${d3dm ? 'ri(-5,5)' : '0'};`;
            declB = `q${X}_xb:ri(-5,5);q${X}_yb:ri(-5,5);q${X}_zb:${d3dm ? 'ri(-5,5)' : '0'};\n`
                + `while q${X}_xa=q${X}_xb and q${X}_ya=q${X}_yb and q${X}_za=q${X}_zb do (q${X}_xb:ri(-5,5),q${X}_yb:ri(-5,5)${d3dm ? `,q${X}_zb:ri(-5,5)` : ''});`;
        }

        if (scenario === 'distance') {
            vars = `/* Q${X} Géométrie — Distance entre deux points${d3dm ? ' (3D)' : ''} */
ri(a,b):=a+rand(b-a+1);
${declA}
${declB}
q${X}_dx:q${X}_xb-q${X}_xa;q${X}_dy:q${X}_yb-q${X}_ya;q${X}_dz:q${X}_zb-q${X}_za;
q${X}_somme:q${X}_dx^2+q${X}_dy^2+q${X}_dz^2;
q${X}_ta:1.0*round(float(sqrt(q${X}_somme))*100)/100;
q${X}_err_nosqrt:q${X}_somme;
q${X}_err_manhattan:abs(q${X}_dx)+abs(q${X}_dy)+abs(q${X}_dz);
q${X}_err_origine:abs(sqrt(q${X}_xb^2+q${X}_yb^2+q${X}_zb^2)-sqrt(q${X}_xa^2+q${X}_ya^2+q${X}_za^2));`;
            qnote = `A=${d3dm ? '(x,y,z)' : '(x,y)'}, B=${d3dm ? '(x,y,z)' : '(x,y)'}, AB={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.dist_enonce1', {repere: repere, A: _geoPointTex(X, 'xa', 'ya', 'za', d3dm), B: _geoPointTex(X, 'xb', 'yb', 'zb', d3dm)})}</p>
<p>${I18N_D.t('geo.dist_enonce2')}</p>
<p>${I18N_D.t('geo.dist_ab_lbl')} [[input:ans_dist${X}]] [[validation:ans_dist${X}]]</p>`;
            inputXML = mkInput_D({ name: `ans_dist${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

            var specsDist = [
                { description: I18N_D.t('geo.node_reponse_correcte_tol'), answertest: 'NumAbsolute', sans: `ans_dist${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1, kind: 'ok',
                    feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.dist_ok_desc')}` },
                { description: I18N_D.t('geo.node_err_racine'), sans: `ans_dist${X}`, tans: `q${X}_err_nosqrt`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.oubli_racine_title')}</strong> ${I18N_D.t('geo.dist_racine_desc')}` },
                { description: I18N_D.t('geo.node_err_manhattan_dist'), sans: `ans_dist${X}`, tans: `q${X}_err_manhattan`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.mauvaise_formule_title')}</strong> ${I18N_D.t('geo.dist_manhattan_desc')}` },
                { description: I18N_D.t('geo.node_err_origine'), sans: `ans_dist${X}`, tans: `q${X}_err_origine`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.erreur_methode_title')}</strong> ${I18N_D.t('geo.dist_origine_desc')}` },
                { description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
                    feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('geo.dist_fallback_desc', {zterm: d3dm ? '+(z_B-z_A)^2' : ''})}` }
            ];
            diagNodes = _geoDiagNodes(specsDist);
            var builtDist = geoSeqPrt_D(X, bareme, specsDist, deps);
            prtMeta = builtDist.prtMeta; canonicalNodes = builtDist.canonicalNodes; prtXML = builtDist.prtXML;
            generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(I18N_D.t('geo.dist_correction_desc', {
                repere: repere, zterm: d3dm ? '+(z_B-z_A)^2' : '',
                dx: `{@q${X}_dx@}`, dy: `{@q${X}_dy@}`, dzterm: d3dm ? `+{@q${X}_dz@}^2` : '',
                somme: `{@q${X}_somme@}`, ta: `{@q${X}_ta@}`
            }), deps), p.fbGenRaw));

        } else { // milieu
            var mat2or3 = function (x, y, z) { return d3dm ? `matrix([${x}],[${y}],[${z}])` : `matrix([${x}],[${y}])`; };
            var errNodiv = d3dm ? mat2or3(`q${X}_xm`, `q${X}_ym`, `q${X}_sz`) : mat2or3(`q${X}_xm`, `q${X}_sy`, '');
            vars = `/* Q${X} Géométrie — Milieu d'un segment${d3dm ? ' (3D)' : ''} */
ri(a,b):=a+rand(b-a+1);
${declA}
${declB}
q${X}_sx:q${X}_xa+q${X}_xb;q${X}_sy:q${X}_ya+q${X}_yb;q${X}_sz:q${X}_za+q${X}_zb;
q${X}_xm:q${X}_sx/2;q${X}_ym:q${X}_sy/2;q${X}_zm:q${X}_sz/2;
q${X}_ta:${mat2or3(`q${X}_xm`, `q${X}_ym`, `q${X}_zm`)};
q${X}_err_swap:${mat2or3(`q${X}_ym`, `q${X}_xm`, `q${X}_zm`)};
q${X}_err_diff:${mat2or3(`(q${X}_xa-q${X}_xb)/2`, `(q${X}_ya-q${X}_yb)/2`, `(q${X}_za-q${X}_zb)/2`)};
q${X}_err_nodiv:${errNodiv};`;
            qnote = `A=${d3dm ? '(x,y,z)' : '(x,y)'}, B=${d3dm ? '(x,y,z)' : '(x,y)'}, I={@q${X}_ta@}`;
            var hintMid = d3dm ? 'matrix([x],[y],[z])' : 'matrix([x],[y])';
            textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.dist_enonce1', {repere: repere, A: _geoPointTex(X, 'xa', 'ya', 'za', d3dm), B: _geoPointTex(X, 'xb', 'yb', 'zb', d3dm)})}</p>
<p>${I18N_D.t('geo.milieu_enonce2')}</p>
<p style="font-size:.85rem;color:#64748b;">${I18N_D.t('geo.milieu_hint_desc', {hint: hintMid})}</p>
<p>${I18N_D.t('geo.milieu_i_open')} [[input:ans_mid${X}]] [[validation:ans_mid${X}]] ${I18N_D.t('geo.milieu_i_close')}</p>`;
            inputXML = mkInput_D({ name: `ans_mid${X}`, tans: `q${X}_ta`, type: 'matrix', boxsize: 15, hint: hintMid, mustverify: 0, showvalidation: 2 });

            var specsMid = [
                { description: I18N_D.t('geo.node_reponse_correcte'), sans: `ans_mid${X}`, tans: `q${X}_ta`, score: 1, kind: 'ok',
                    feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.milieu_ok_desc')}` },
                { description: I18N_D.t('geo.node_err_swap_xy'), sans: `ans_mid${X}`, tans: `q${X}_err_swap`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.milieu_swap_title')}</strong> ${I18N_D.t('geo.milieu_swap_desc')}` },
                { description: I18N_D.t('geo.node_err_diff'), sans: `ans_mid${X}`, tans: `q${X}_err_diff`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.erreur_signe_title')}</strong> ${I18N_D.t('geo.milieu_diff_desc')}` },
                { description: I18N_D.t('geo.node_err_nodiv'), sans: `ans_mid${X}`, tans: `q${X}_err_nodiv`, score: 0, kind: 'warn',
                    feedback: `<strong>${I18N_D.t('geo.calcul_incomplet_title')}</strong> ${I18N_D.t('geo.milieu_nodiv_desc')}` },
                { description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
                    feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('geo.milieu_fallback_desc', {zterm: d3dm ? '\\;;\\;\\frac{z_A+z_B}{2}' : ''})}` }
            ];
            diagNodes = _geoDiagNodes(specsMid);
            var builtMid = geoSeqPrt_D(X, bareme, specsMid, deps);
            prtMeta = builtMid.prtMeta; canonicalNodes = builtMid.canonicalNodes; prtXML = builtMid.prtXML;
            generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(I18N_D.t('geo.milieu_correction_desc', {
                zterm1: d3dm ? '\\;;\\;\\frac{z_A+z_B}{2}' : '',
                xa: `{@q${X}_xa@}`, xb: `{@q${X}_xb@}`, xm: `{@q${X}_xm@}`,
                ya: `{@q${X}_ya@}`, yb: `{@q${X}_yb@}`, ym: `{@q${X}_ym@}`,
                zterm2: d3dm ? `<br>\\[z_I=\\frac{{@q${X}_za@}+({@q${X}_zb@})}{2}={@q${X}_zm@}\\]` : '',
                I: _geoPointTex(X, 'xm', 'ym', 'zm', d3dm)
            }), deps), p.fbGenRaw));
        }

    } else if (scenario === 'norme') {
        var d3n = dimSel === '3d';
        var repereN = d3n ? I18N_D.t('geo.repere_espace') : I18N_D.t('geo.repere_plan');
        var declU;
        if (mode === 'fixe') {
            declU = `q${X}_ux:${gn(p.p1x, 3)};q${X}_uy:${gn(p.p1y, 4)};q${X}_uz:${d3n ? gn(p.p1z, 0) : 0};`;
        } else {
            declU = `q${X}_ux:ri(-5,5);q${X}_uy:ri(-5,5);q${X}_uz:${d3n ? 'ri(-5,5)' : '0'};\n`
                + `while q${X}_ux=0 and q${X}_uy=0 and q${X}_uz=0 do (q${X}_ux:ri(-5,5),q${X}_uy:ri(-5,5)${d3n ? `,q${X}_uz:ri(-5,5)` : ''});`;
        }
        vars = `/* Q${X} Géométrie — Norme d'un vecteur${d3n ? ' (3D)' : ''} */
ri(a,b):=a+rand(b-a+1);
${declU}
q${X}_somme:q${X}_ux^2+q${X}_uy^2+q${X}_uz^2;
q${X}_ta:1.00*(round(float(sqrt(q${X}_somme))*100)/100);
q${X}_err_nosqrt:q${X}_somme;
q${X}_err_manhattan:abs(q${X}_ux)+abs(q${X}_uy)+abs(q${X}_uz);
q${X}_err_sub:${d3n ? `sqrt(abs(q${X}_ux^2+q${X}_uy^2-q${X}_uz^2))` : `sqrt(abs(q${X}_ux^2-q${X}_uy^2))`};`;
        qnote = `u=${d3n ? '(x,y,z)' : '(x,y)'}, ||u||={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.norme_enonce1', {repere: repereN, uvec: _geoVecTex(X, 'ux', 'uy', 'uz', d3n)})}</p>
<p>${I18N_D.t('geo.norme_enonce2')}</p>
<p>${I18N_D.t('geo.norme_lbl')} [[input:ans_norm${X}]] [[validation:ans_norm${X}]]</p>`;
        inputXML = mkInput_D({ name: `ans_norm${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

        var specsNorm = [
            { description: I18N_D.t('geo.node_reponse_correcte_tol'), answertest: 'NumAbsolute', sans: `ans_norm${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1, kind: 'ok',
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.norme_ok_desc')}` },
            { description: I18N_D.t('geo.node_err_racine'), sans: `ans_norm${X}`, tans: `q${X}_err_nosqrt`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.oubli_racine_title')}</strong> ${I18N_D.t('geo.norme_racine_desc')}` },
            { description: I18N_D.t('geo.node_err_manhattan_norm'), sans: `ans_norm${X}`, tans: `q${X}_err_manhattan`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.mauvaise_formule_title')}</strong> ${I18N_D.t('geo.norme_manhattan_desc')}` },
            { description: I18N_D.t('geo.node_err_sub_carres'), sans: `ans_norm${X}`, tans: `q${X}_err_sub`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.norme_sub_title')}</strong> ${I18N_D.t('geo.norme_sub_desc')}` },
            { description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
                feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('geo.norme_fallback_desc', {zterm: d3n ? '+z^2' : ''})}` }
        ];
        diagNodes = _geoDiagNodes(specsNorm);
        var builtNorm = geoSeqPrt_D(X, bareme, specsNorm, deps);
        prtMeta = builtNorm.prtMeta; canonicalNodes = builtNorm.canonicalNodes; prtXML = builtNorm.prtXML;
        generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(I18N_D.t('geo.norme_correction_desc', {
            zterm1: d3n ? '+z^2' : '',
            ux: `{@q${X}_ux@}`, uy: `{@q${X}_uy@}`,
            zterm2: d3n ? `+{@q${X}_uz@}^2` : '',
            somme: `{@q${X}_somme@}`, ta: `{@q${X}_ta@}`
        }), deps), p.fbGenRaw));

    } else if (scenario === 'pente') {
        var declPente;
        if (mode === 'fixe') {
            declPente = `q${X}_xa:${gn(p.p1x, 0)};q${X}_ya:${gn(p.p1y, 0)};q${X}_za:${gn(p.p1z, 0)};
q${X}_a:${gn(p.p2x, 2)};q${X}_b:${gn(p.p2y, 3)};q${X}_c:${gn(p.p2z, 1)};
if q${X}_a=0 then q${X}_a:1;`;
        } else {
            declPente = `q${X}_xa:ri(-4,4);q${X}_ya:ri(-4,4);q${X}_za:ri(-4,4);
q${X}_a:rnz(-4,4);q${X}_b:rnz(-4,4);q${X}_c:ri(-4,4);`;
        }
        vars = `/* Q${X} Géométrie 3D — Pente d'une droite */
ri(a,b):=a+rand(b-a+1);rnz(a,b):=block([v],v:ri(a,b),if v=0 then rnz(a,b) else v);
${declPente}
q${X}_ta:q${X}_b/q${X}_a;
q${X}_err_inv:q${X}_a/q${X}_b;
q${X}_err_z:q${X}_c/q${X}_a;
q${X}_err_moins:-q${X}_b/q${X}_a;`;
        qnote = `A=({@q${X}_xa@},{@q${X}_ya@},{@q${X}_za@}), u=({@q${X}_a@},{@q${X}_b@},{@q${X}_c@}), pente={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.pente_enonce1', {xa: `{@q${X}_xa@}`, ya: `{@q${X}_ya@}`, za: `{@q${X}_za@}`, a: `{@q${X}_a@}`, b: `{@q${X}_b@}`, c: `{@q${X}_c@}`})}</p>
<p>${I18N_D.t('geo.pente_enonce2')}</p>
<p style="font-size:.85rem;color:#64748b;">${I18N_D.t('geo.pente_hint_desc')}</p>
<p>${I18N_D.t('geo.pente_lbl')} [[input:ans_pente${X}]] [[validation:ans_pente${X}]]</p>`;
        inputXML = mkInput_D({ name: `ans_pente${X}`, tans: `q${X}_ta`, type: 'algebraic', boxsize: 10, forbidfloat: 1, mustverify: 0, showvalidation: 2 });

        var specsPente = [
            { description: I18N_D.t('geo.node_reponse_correcte'), sans: `ans_pente${X}`, tans: `q${X}_ta`, score: 1, kind: 'ok',
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.pente_ok_desc')}` },
            { description: I18N_D.t('geo.node_err_fraction_inv'), sans: `ans_pente${X}`, tans: `q${X}_err_inv`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.pente_inv_title')}</strong> ${I18N_D.t('geo.pente_inv_desc')}` },
            { description: I18N_D.t('geo.node_err_compo_z'), sans: `ans_pente${X}`, tans: `q${X}_err_z`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.pente_z_title')}</strong> ${I18N_D.t('geo.pente_z_desc')}` },
            { description: I18N_D.t('geo.node_err_signe'), sans: `ans_pente${X}`, tans: `q${X}_err_moins`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.erreur_signe_title')}</strong> ${I18N_D.t('geo.pente_moins_desc')}` },
            { description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
                feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('geo.pente_fallback_desc')}` }
        ];
        diagNodes = _geoDiagNodes(specsPente);
        var builtPente = geoSeqPrt_D(X, bareme, specsPente, deps);
        prtMeta = builtPente.prtMeta; canonicalNodes = builtPente.canonicalNodes; prtXML = builtPente.prtXML;
        generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(I18N_D.t('geo.pente_correction_desc', {
            xa: `{@q${X}_xa@}`, ya: `{@q${X}_ya@}`, za: `{@q${X}_za@}`,
            a: `{@q${X}_a@}`, b: `{@q${X}_b@}`, c: `{@q${X}_c@}`, ta: `{@q${X}_ta@}`
        }), deps), p.fbGenRaw));

    } else if (scenario === 'ordonnee') {
        var declOao;
        if (mode === 'fixe') {
            declOao = `q${X}_a:${gn(p.p1x, 2)};q${X}_b:${gn(p.p1y, -3)};q${X}_c:${gn(p.p1z, 6)};
if q${X}_b=0 then q${X}_b:1;`;
        } else {
            declOao = `q${X}_a:rnz(-5,5);q${X}_b:rnz(-5,5);q${X}_c:ri(-5,5);`;
        }
        vars = `/* Q${X} Géométrie — Ordonnée à l'origine d'une droite */
ri(a,b):=a+rand(b-a+1);rnz(a,b):=block([v],v:ri(a,b),if v=0 then rnz(a,b) else v);
${declOao}
q${X}_ta:-q${X}_c/q${X}_b;
q${X}_err_const:q${X}_c;
q${X}_err_sansmoins:q${X}_c/q${X}_b;
q${X}_err_pente:-q${X}_a/q${X}_b;
q${X}_err_absc:-q${X}_c/q${X}_a;`;
        qnote = `Eq: {@q${X}_a@}x+{@q${X}_b@}y+{@q${X}_c@}=0, OAO={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.ordonnee_enonce1', {eq: `{@q${X}_a*x+q${X}_b*y+q${X}_c@}`})}</p>
<p>${I18N_D.t('geo.ordonnee_enonce2')}</p>
<p style="font-size:.85rem;color:#64748b;">${I18N_D.t('geo.ordonnee_hint_desc')}</p>
<p>${I18N_D.t('geo.ordonnee_lbl')} [[input:ans_oao${X}]] [[validation:ans_oao${X}]]</p>`;
        inputXML = mkInput_D({ name: `ans_oao${X}`, tans: `q${X}_ta`, type: 'algebraic', boxsize: 10, forbidfloat: 1, mustverify: 0, showvalidation: 2 });

        var specsOao = [
            { description: I18N_D.t('geo.node_reponse_correcte'), sans: `ans_oao${X}`, tans: `q${X}_ta`, score: 1, kind: 'ok',
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.ordonnee_ok_desc')}` },
            { description: I18N_D.t('geo.node_err_const_c'), sans: `ans_oao${X}`, tans: `q${X}_err_const`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.ordonnee_const_title')}</strong> ${I18N_D.t('geo.ordonnee_const_desc')}` },
            { description: I18N_D.t('geo.node_err_sans_moins'), sans: `ans_oao${X}`, tans: `q${X}_err_sansmoins`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.erreur_signe_title')}</strong> ${I18N_D.t('geo.ordonnee_sansmoins_desc')}` },
            { description: I18N_D.t('geo.node_err_pente'), sans: `ans_oao${X}`, tans: `q${X}_err_pente`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.ordonnee_pente_title')}</strong> ${I18N_D.t('geo.ordonnee_pente_desc')}` },
            { description: I18N_D.t('geo.node_err_absc'), sans: `ans_oao${X}`, tans: `q${X}_err_absc`, score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.ordonnee_axe_title')}</strong> ${I18N_D.t('geo.ordonnee_axe_desc')}` },
            { description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
                feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('geo.ordonnee_fallback_desc')}` }
        ];
        diagNodes = _geoDiagNodes(specsOao);
        var builtOao = geoSeqPrt_D(X, bareme, specsOao, deps);
        prtMeta = builtOao.prtMeta; canonicalNodes = builtOao.canonicalNodes; prtXML = builtOao.prtXML;
        generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(I18N_D.t('geo.ordonnee_correction_desc', {
            eq: `{@q${X}_a*x+q${X}_b*y+q${X}_c@}`,
            a: `{@q${X}_a@}`, b: `{@q${X}_b@}`, c: `{@q${X}_c@}`, ta: `{@q${X}_ta@}`
        }), deps), p.fbGenRaw));

    } else { /* aire */
        var d3a = dimSel === '3d';
        var repereA = d3a ? I18N_D.t('geo.repere_espace') : I18N_D.t('geo.repere_plan');
        var declTri;
        if (mode === 'fixe') {
            declTri = `q${X}_xa:${gn(p.p1x, 0)};q${X}_ya:${gn(p.p1y, 0)};q${X}_za:${d3a ? gn(p.p1z, 0) : 0};
q${X}_xb:${gn(p.p2x, 3)};q${X}_yb:${gn(p.p2y, 0)};q${X}_zb:${d3a ? gn(p.p2z, 0) : 0};
q${X}_xc:${gn(p.p3x, 0)};q${X}_yc:${gn(p.p3y, 4)};q${X}_zc:${d3a ? gn(p.p3z, 0) : 0};`;
        } else {
            declTri = `q${X}_xa:ri(-3,3);q${X}_ya:ri(-3,3);q${X}_za:${d3a ? 'ri(-3,3)' : '0'};
q${X}_xb:ri(-3,3);q${X}_yb:ri(-3,3);q${X}_zb:${d3a ? 'ri(-3,3)' : '0'};
q${X}_xc:ri(-3,3);q${X}_yc:ri(-3,3);q${X}_zc:${d3a ? 'ri(-3,3)' : '0'};`;
        }
        vars = `/* Q${X} Géométrie${d3a ? ' 3D' : ''} — Aire d'un triangle */
ri(a,b):=a+rand(b-a+1);
${declTri}
q${X}_ux:q${X}_xb-q${X}_xa;q${X}_uy:q${X}_yb-q${X}_ya;q${X}_uz:q${X}_zb-q${X}_za;
q${X}_vx:q${X}_xc-q${X}_xa;q${X}_vy:q${X}_yc-q${X}_ya;q${X}_vz:q${X}_zc-q${X}_za;
q${X}_cx:q${X}_uy*q${X}_vz-q${X}_uz*q${X}_vy;q${X}_cy:q${X}_uz*q${X}_vx-q${X}_ux*q${X}_vz;q${X}_cz:q${X}_ux*q${X}_vy-q${X}_uy*q${X}_vx;
q${X}_normc:q${X}_cx^2+q${X}_cy^2+q${X}_cz^2;
${mode === 'aleatoire' ? `while q${X}_normc=0 do (
    q${X}_xb:ri(-3,3),q${X}_yb:ri(-3,3),${d3a ? `q${X}_zb:ri(-3,3),` : ''}
    q${X}_xc:ri(-3,3),q${X}_yc:ri(-3,3),${d3a ? `q${X}_zc:ri(-3,3),` : ''}
    q${X}_ux:q${X}_xb-q${X}_xa,q${X}_uy:q${X}_yb-q${X}_ya,q${X}_uz:q${X}_zb-q${X}_za,
    q${X}_vx:q${X}_xc-q${X}_xa,q${X}_vy:q${X}_yc-q${X}_ya,q${X}_vz:q${X}_zc-q${X}_za,
    q${X}_cx:q${X}_uy*q${X}_vz-q${X}_uz*q${X}_vy,q${X}_cy:q${X}_uz*q${X}_vx-q${X}_ux*q${X}_vz,q${X}_cz:q${X}_ux*q${X}_vy-q${X}_uy*q${X}_vx,
    q${X}_normc:q${X}_cx^2+q${X}_cy^2+q${X}_cz^2
);` : ''}
q${X}_ta:1.00*(round(float(sqrt(q${X}_normc)/2)*100)/100);
q${X}_sqrt_arr:round(float(sqrt(q${X}_normc))*100)/100;
q${X}_err_para:q${X}_sqrt_arr;
q${X}_err_norac:round(float(q${X}_normc/2)*100)/100;
q${X}_aire2d:abs(q${X}_ux*q${X}_vy-q${X}_uy*q${X}_vx)/2;
q${X}_err_2d:round(float(q${X}_aire2d)*100)/100;`;
        qnote = `A${d3a ? '(x,y,z)' : '(x,y)'}, B${d3a ? '(x,y,z)' : '(x,y)'}, C${d3a ? '(x,y,z)' : '(x,y)'}, Aire={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('geo.aire_enonce1', {repere: repereA, A: _geoPointTex(X, 'xa', 'ya', 'za', d3a), B: _geoPointTex(X, 'xb', 'yb', 'zb', d3a), C: _geoPointTex(X, 'xc', 'yc', 'zc', d3a)})}</p>
<p>${I18N_D.t('geo.aire_enonce2')}</p>
<p>${I18N_D.t('geo.aire_lbl')} [[input:ans_aire${X}]] [[validation:ans_aire${X}]]</p>`;
        inputXML = mkInput_D({ name: `ans_aire${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

        var specsAire = [
            { description: I18N_D.t('geo.node_reponse_correcte'), answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1, kind: 'ok',
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('geo.aire_ok_desc')}` },
            { description: I18N_D.t('geo.node_err_para'), answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_para`, testoptions: '0.005', score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.aire_para_title')}</strong> ${I18N_D.t('geo.aire_para_desc')}` },
            { description: I18N_D.t('geo.node_err_racine'), answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_norac`, testoptions: '0.005', score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.oubli_racine_title')}</strong> ${I18N_D.t('geo.aire_norac_desc')}` }
        ];
        if (d3a) {
            specsAire.push({ description: I18N_D.t('geo.node_err_2d'), answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_2d`, testoptions: '0.005', score: 0, kind: 'warn',
                feedback: `<strong>${I18N_D.t('geo.aire_2d_title')}</strong> ${I18N_D.t('geo.aire_2d_desc')}` });
        }
        specsAire.push({ description: I18N_D.t('geo.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'bad',
            feedback: fbWrong || `<strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${d3a ? I18N_D.t('geo.aire_fallback_3d_desc') : I18N_D.t('geo.aire_fallback_2d_desc')}` });
        diagNodes = _geoDiagNodes(specsAire);
        var builtAire = geoSeqPrt_D(X, bareme, specsAire, deps);
        prtMeta = builtAire.prtMeta; canonicalNodes = builtAire.canonicalNodes; prtXML = builtAire.prtXML;
        generalFeedback = applyFbBox_D('general', mkFbGen_D(geoGenFbBox_D(d3a
            ? I18N_D.t('geo.aire_correction_3d', {
                ux: `{@q${X}_ux@}`, uy: `{@q${X}_uy@}`, uz: `{@q${X}_uz@}`,
                vx: `{@q${X}_vx@}`, vy: `{@q${X}_vy@}`, vz: `{@q${X}_vz@}`,
                cx: `{@q${X}_cx@}`, cy: `{@q${X}_cy@}`, cz: `{@q${X}_cz@}`,
                sqrt_arr: `{@q${X}_sqrt_arr@}`, ta: `{@q${X}_ta@}`
              })
            : I18N_D.t('geo.aire_correction_2d', {
                ux: `{@q${X}_ux@}`, uy: `{@q${X}_uy@}`,
                vx: `{@q${X}_vx@}`, vy: `{@q${X}_vy@}`, ta: `{@q${X}_ta@}`
              }), deps), p.fbGenRaw));
    }

    return {
        type: 'geometrie', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef: `[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genGeometrie: genGeometrie, genGeometrieCore: genGeometrieCore };
}

// ─── SUITES ──────────────────────────────────────────────────

