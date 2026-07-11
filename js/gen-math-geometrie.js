// ── GÉOMÉTRIE ANALYTIQUE ──
// Refonte : plus de préréglage, le "Type de question" pilote seul le
// scénario. Choix 2D/3D (distance, milieu, norme, aire) et valeurs
// aléatoires (Maxima) ou fixes (saisies par l'enseignant). Constructions
// reconstruites à partir des exemples validés Moodle de
// test/mise à jour/Math/Geometrie/*.xml : mêmes variables Maxima, mêmes
// formules, et PRT diagnostiques séquentiels détectant les erreurs types
// (avec feedback dédié pour chacune) suivis d'un feedback général détaillé.

function _geoBox(kind, html) {
    var s = kind === 'ok' ? { c: '#15803d', bg: '#f0fdf4' }
        : kind === 'warn' ? { c: '#f97316', bg: '#fff7ed' }
        : { c: '#dc2626', bg: '#fff0f0' };
    var icon = kind === 'ok' ? '✅' : kind === 'warn' ? '🚨' : '❌';
    return '<div style="border-left:4px solid ' + s.c + ';padding:10px 14px;background:' + s.bg + ';border-radius:4px;">' + icon + ' ' + html + '</div>';
}

function _geoGenFbBox(bodyHtml) {
    return '<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">'
        + '<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction détaillée</div>'
        + '<div style="font-size:.9rem;">' + bodyHtml + '</div></div>';
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
function _geoSeqPrt(X, bareme, specs) {
    var nodes = specs.map(function (spec, idx) { return _geoSeqNode(X, idx, idx === specs.length - 1, spec); });
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, nodes) };
}

// Noeuds de diagnostic intermediaires (entre le noeud "reponse correcte" et le
// noeud generique final) : leur feedback ne rentre pas dans le gabarit standard
// a 2 boites Ok/Faux de l'apercu, donc on les expose a part (cf. genBaseN /
// diagNodes) pour que rien ne reste invisible dans l'onglet Config.
function _geoDiagNodes(specs) {
    return specs.slice(1, -1).map(function (s) { return { desc: s.description, fb: s.feedback }; });
}

function genGeometrie(X) {
    var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var gn = function (id, def) { var v = parseFloat(gs(id)); return isNaN(v) ? def : v; };
    var bareme = parseFloat(gs('geo-bareme')) || 1;
    var scenario = gs('geo-scenario') || 'distance';
    var mode = gs('geo-mode') || 'aleatoire';
    var dimSel = gs('geo-dim') || '2d';
    var fbOk = gs('geo-fb-ok'), fbWrong = gs('geo-fb-wrong');
    var custText = gs('geo-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, prtMeta, diagNodes;

    var HDR = `<div style="background:#059669;border-left:5px solid #047857;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Géométrie</strong> <span style="background:#047857;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'distance' || scenario === 'milieu') {
        var d3dm = dimSel === '3d';
        var repere = d3dm ? "Dans un repère orthonormé de l'espace" : 'Dans un repère orthonormé';
        var declA, declB;
        if (mode === 'fixe') {
            declA = `q${X}_xa:${gn('geo-p1x', 1)};q${X}_ya:${gn('geo-p1y', 2)};q${X}_za:${d3dm ? gn('geo-p1z', 0) : 0};`;
            declB = `q${X}_xb:${gn('geo-p2x', 4)};q${X}_yb:${gn('geo-p2y', 6)};q${X}_zb:${d3dm ? gn('geo-p2z', 1) : 0};`;
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
            textFrag = `${HDR}${custText}<p>${repere}, on considère les points \\(A${_geoPointTex(X, 'xa', 'ya', 'za', d3dm)}\\) et \\(B${_geoPointTex(X, 'xb', 'yb', 'zb', d3dm)}\\).</p>
<p><strong>1.</strong> Calculer la longueur du segment \\([AB]\\). <em>(Arrondir le résultat à \\(10^{-2}\\) près.)</em></p>
<p>\\(AB=\\) [[input:ans_dist${X}]] [[validation:ans_dist${X}]]</p>`;
            inputXML = _mkInput({ name: `ans_dist${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

            var specsDist = [
                { description: 'Réponse correcte (tolérance arrondi)', answertest: 'NumAbsolute', sans: `ans_dist${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1,
                    feedback: fbOk || _geoBox('ok', '<strong>Parfait !</strong> La distance est correctement calculée et arrondie.') },
                { description: "Erreur : a oublié la racine carrée", sans: `ans_dist${X}`, tans: `q${X}_err_nosqrt`, score: 0,
                    feedback: _geoBox('warn', "<strong>Oubli de la racine carrée !</strong> Vous avez calculé la somme des carrés des écarts. D'après le théorème de Pythagore, il faut en prendre la <strong>racine carrée</strong> pour obtenir la distance.") },
                { description: 'Erreur : distance de Manhattan (somme des écarts)', sans: `ans_dist${X}`, tans: `q${X}_err_manhattan`, score: 0,
                    feedback: _geoBox('warn', "<strong>Mauvaise formule !</strong> Vous avez additionné les valeurs absolues des écarts de coordonnées. Il faut appliquer le <strong>théorème de Pythagore</strong> (somme des carrés puis racine).") },
                { description: "Erreur : soustraction des distances à l'origine", sans: `ans_dist${X}`, tans: `q${X}_err_origine`, score: 0,
                    feedback: _geoBox('warn', "<strong>Erreur de méthode !</strong> Vous avez soustrait les distances des points à l'origine. Il faut utiliser la formule avec les coordonnées de \\(A\\) et \\(B\\).") },
                { description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                    feedback: fbWrong || _geoBox('bad', '<strong>Incorrect.</strong> Appliquez la formule du cours :<br>\\(AB=\\sqrt{(x_B-x_A)^2+(y_B-y_A)^2' + (d3dm ? '+(z_B-z_A)^2' : '') + '}\\)') }
            ];
            diagNodes = _geoDiagNodes(specsDist);
            var builtDist = _geoSeqPrt(X, bareme, specsDist);
            prtMeta = builtDist.prtMeta; canonicalNodes = builtDist.canonicalNodes; prtXML = builtDist.prtXML;
            generalFeedback = _mkFbGen(_geoGenFbBox(`${repere}, la formule de la distance entre deux points est :<br><br>
\\[AB=\\sqrt{(x_B-x_A)^2+(y_B-y_A)^2${d3dm ? '+(z_B-z_A)^2' : ''}}\\]<br>
<strong>Application :</strong><br><br>
\\[AB=\\sqrt{{@q${X}_dx@}^2+{@q${X}_dy@}^2${d3dm ? `+{@q${X}_dz@}^2` : ''}}=\\sqrt{{@q${X}_somme@}}\\]
\\[AB\\approx{@q${X}_ta@}\\]`), gs('geo-fbgen'));

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
            textFrag = `${HDR}${custText}<p>${repere}, on considère les points \\(A${_geoPointTex(X, 'xa', 'ya', 'za', d3dm)}\\) et \\(B${_geoPointTex(X, 'xb', 'yb', 'zb', d3dm)}\\).</p>
<p><strong>1.</strong> Déterminer les coordonnées du milieu \\(I\\) du segment \\([AB]\\).</p>
<p style="font-size:.85rem;color:#64748b;"><em>Saisir sous la forme <code>${hintMid}</code> (les valeurs exactes comme 3/2 sont acceptées).</em></p>
<p>\\(I\\left(\\right.\\) [[input:ans_mid${X}]] [[validation:ans_mid${X}]] \\(\\left.\\right)\\)</p>`;
            inputXML = _mkInput({ name: `ans_mid${X}`, tans: `q${X}_ta`, type: 'matrix', boxsize: 15, hint: hintMid, mustverify: 0, showvalidation: 2 });

            var specsMid = [
                { description: 'Réponse correcte', sans: `ans_mid${X}`, tans: `q${X}_ta`, score: 1,
                    feedback: fbOk || _geoBox('ok', '<strong>Parfait !</strong> Les coordonnées du milieu sont correctes.') },
                { description: 'Erreur : inversion de x et y', sans: `ans_mid${X}`, tans: `q${X}_err_swap`, score: 0,
                    feedback: _geoBox('warn', "<strong>Coordonnées inversées !</strong> Vous avez mis la moyenne des \\(y\\) en abscisse et la moyenne des \\(x\\) en ordonnée. Attention à l'ordre des coordonnées.") },
                { description: 'Erreur : différence au lieu de la somme', sans: `ans_mid${X}`, tans: `q${X}_err_diff`, score: 0,
                    feedback: _geoBox('warn', '<strong>Erreur de signe !</strong> Vous avez calculé \\(\\frac{x_A-x_B}{2}\\) au lieu de \\(\\frac{x_A+x_B}{2}\\). Pour le milieu, il faut <strong>additionner</strong> les coordonnées.') },
                { description: 'Erreur : oubli de la division par 2 sur la dernière coordonnée', sans: `ans_mid${X}`, tans: `q${X}_err_nodiv`, score: 0,
                    feedback: _geoBox('warn', "<strong>Calcul incomplet !</strong> Une des coordonnées est correcte, mais vous avez oublié de <strong>diviser par 2</strong> sur une autre.") },
                { description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                    feedback: fbWrong || _geoBox('bad', '<strong>Incorrect.</strong> Appliquez la formule du milieu :<br>\\(I\\left(\\frac{x_A+x_B}{2}\\;;\\;\\frac{y_A+y_B}{2}' + (d3dm ? '\\;;\\;\\frac{z_A+z_B}{2}' : '') + '\\right)\\)') }
            ];
            diagNodes = _geoDiagNodes(specsMid);
            var builtMid = _geoSeqPrt(X, bareme, specsMid);
            prtMeta = builtMid.prtMeta; canonicalNodes = builtMid.canonicalNodes; prtXML = builtMid.prtXML;
            generalFeedback = _mkFbGen(_geoGenFbBox(`Les coordonnées du milieu d'un segment sont données par la <strong>moyenne arithmétique</strong> des coordonnées des extrémités :<br><br>
\\[I\\left(\\frac{x_A+x_B}{2}\\;;\\;\\frac{y_A+y_B}{2}${d3dm ? '\\;;\\;\\frac{z_A+z_B}{2}' : ''}\\right)\\]<br>
<strong>Application :</strong><br><br>
\\[x_I=\\frac{{@q${X}_xa@}+({@q${X}_xb@})}{2}={@q${X}_xm@}\\]
\\[y_I=\\frac{{@q${X}_ya@}+({@q${X}_yb@})}{2}={@q${X}_ym@}\\]${d3dm ? `<br>\\[z_I=\\frac{{@q${X}_za@}+({@q${X}_zb@})}{2}={@q${X}_zm@}\\]` : ''}<br>
Donc \\(I${_geoPointTex(X, 'xm', 'ym', 'zm', d3dm)}\\).`), gs('geo-fbgen'));
        }

    } else if (scenario === 'norme') {
        var d3n = dimSel === '3d';
        var repereN = d3n ? "Dans un repère orthonormé de l'espace" : 'Dans un repère orthonormé';
        var declU;
        if (mode === 'fixe') {
            declU = `q${X}_ux:${gn('geo-p1x', 3)};q${X}_uy:${gn('geo-p1y', 4)};q${X}_uz:${d3n ? gn('geo-p1z', 0) : 0};`;
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
        textFrag = `${HDR}${custText}<p>${repereN}, on considère le vecteur \\(\\vec{u}${_geoVecTex(X, 'ux', 'uy', 'uz', d3n)}\\).</p>
<p><strong>1.</strong> Calculer la norme du vecteur \\(\\vec{u}\\). <em>(Arrondir le résultat à \\(10^{-2}\\) près.)</em></p>
<p>\\(\\|\\vec{u}\\|=\\) [[input:ans_norm${X}]] [[validation:ans_norm${X}]]</p>`;
        inputXML = _mkInput({ name: `ans_norm${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

        var specsNorm = [
            { description: 'Réponse correcte (tolérance arrondi)', answertest: 'NumAbsolute', sans: `ans_norm${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1,
                feedback: fbOk || _geoBox('ok', '<strong>Parfait !</strong> La norme du vecteur est correctement calculée et arrondie.') },
            { description: "Erreur : a oublié la racine carrée", sans: `ans_norm${X}`, tans: `q${X}_err_nosqrt`, score: 0,
                feedback: _geoBox('warn', "<strong>Oubli de la racine carrée !</strong> Vous avez calculé la somme des carrés des coordonnées, c'est le <strong>carré</strong> de la norme. Il faut en prendre la racine carrée.") },
            { description: 'Erreur : somme des valeurs absolues', sans: `ans_norm${X}`, tans: `q${X}_err_manhattan`, score: 0,
                feedback: _geoBox('warn', "<strong>Mauvaise formule !</strong> Vous avez additionné les valeurs absolues des coordonnées. Dans un repère orthonormé, la norme est la racine de la <strong>somme des carrés</strong>.") },
            { description: 'Erreur : soustraction des carrés sous la racine', sans: `ans_norm${X}`, tans: `q${X}_err_sub`, score: 0,
                feedback: _geoBox('warn', "<strong>Erreur de signe sous le radical !</strong> Avec Pythagore, il faut <strong>additionner</strong> les carrés des coordonnées, jamais les soustraire.") },
            { description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _geoBox('bad', '<strong>Incorrect.</strong> Appliquez la formule du cours issue de Pythagore :<br>\\(\\|\\vec{u}\\|=\\sqrt{x^2+y^2' + (d3n ? '+z^2' : '') + '}\\)') }
        ];
        diagNodes = _geoDiagNodes(specsNorm);
        var builtNorm = _geoSeqPrt(X, bareme, specsNorm);
        prtMeta = builtNorm.prtMeta; canonicalNodes = builtNorm.canonicalNodes; prtXML = builtNorm.prtXML;
        generalFeedback = _mkFbGen(_geoGenFbBox(`La norme d'un vecteur \\(\\vec{u}\\) correspond à sa "longueur", calculée avec la formule déduite du théorème de Pythagore :<br><br>
\\[\\|\\vec{u}\\|=\\sqrt{x^2+y^2${d3n ? '+z^2' : ''}}\\]<br>
<strong>Application :</strong><br><br>
\\[\\|\\vec{u}\\|=\\sqrt{{@q${X}_ux@}^2+{@q${X}_uy@}^2${d3n ? `+{@q${X}_uz@}^2` : ''}}=\\sqrt{{@q${X}_somme@}}\\approx{@q${X}_ta@}\\]`), gs('geo-fbgen'));

    } else if (scenario === 'pente') {
        var declPente;
        if (mode === 'fixe') {
            declPente = `q${X}_xa:${gn('geo-p1x', 0)};q${X}_ya:${gn('geo-p1y', 0)};q${X}_za:${gn('geo-p1z', 0)};
q${X}_a:${gn('geo-p2x', 2)};q${X}_b:${gn('geo-p2y', 3)};q${X}_c:${gn('geo-p2z', 1)};
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
        textFrag = `${HDR}${custText}<p>Dans un repère orthonormé de l'espace, on considère la droite \\((d)\\) passant par \\(A\\left({@q${X}_xa@}\\;;\\;{@q${X}_ya@}\\;;\\;{@q${X}_za@}\\right)\\) et de vecteur directeur \\(\\vec{u}\\begin{pmatrix}{@q${X}_a@}\\\\{@q${X}_b@}\\\\{@q${X}_c@}\\end{pmatrix}\\).</p>
<p><strong>1.</strong> Calculer la pente de la droite \\((d)\\), c'est-à-dire la pente de sa projection orthogonale dans le plan horizontal \\((O;\\vec{i},\\vec{j})\\).</p>
<p style="font-size:.85rem;color:#64748b;"><em>Saisir le résultat sous forme de fraction exacte (ex : 3/2 ou -4/5).</em></p>
<p>\\(p=\\) [[input:ans_pente${X}]] [[validation:ans_pente${X}]]</p>`;
        inputXML = _mkInput({ name: `ans_pente${X}`, tans: `q${X}_ta`, type: 'algebraic', boxsize: 10, forbidfloat: 1, mustverify: 0, showvalidation: 2 });

        var specsPente = [
            { description: 'Réponse correcte', sans: `ans_pente${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _geoBox('ok', "<strong>Parfait !</strong> Vous avez bien identifié que la pente correspond au rapport des variations en \\(y\\) sur celles en \\(x\\).") },
            { description: 'Erreur : fraction inversée', sans: `ans_pente${X}`, tans: `q${X}_err_inv`, score: 0,
                feedback: _geoBox('warn', "<strong>Fraction inversée !</strong> Vous avez calculé \\(\\frac{a}{b}\\) au lieu de \\(\\frac{b}{a}\\). La pente est toujours l'élévation (\\(\\Delta y\\)) divisée par l'avancement horizontal (\\(\\Delta x\\)).") },
            { description: 'Erreur : a utilisé la composante z', sans: `ans_pente${X}`, tans: `q${X}_err_z`, score: 0,
                feedback: _geoBox('warn', "<strong>Mauvaise composante !</strong> Vous avez utilisé la coordonnée en \\(z\\) au lieu de \\(y\\). La pente dans le plan horizontal se calcule uniquement avec \\(x\\) et \\(y\\) : \\(\\frac{b}{a}\\).") },
            { description: 'Erreur : erreur de signe', sans: `ans_pente${X}`, tans: `q${X}_err_moins`, score: 0,
                feedback: _geoBox('warn', '<strong>Erreur de signe !</strong> Le calcul des numérateurs/dénominateurs est bon, mais le signe final est incorrect.') },
            { description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _geoBox('bad', "<strong>Incorrect.</strong> La pente est égale au rapport de la composante en \\(y\\) sur la composante en \\(x\\) du vecteur directeur :<br>\\(p=\\frac{b}{a}\\)") }
        ];
        diagNodes = _geoDiagNodes(specsPente);
        var builtPente = _geoSeqPrt(X, bareme, specsPente);
        prtMeta = builtPente.prtMeta; canonicalNodes = builtPente.canonicalNodes; prtXML = builtPente.prtXML;
        generalFeedback = _mkFbGen(_geoGenFbBox(`Le plan horizontal \\((O;\\vec{i},\\vec{j})\\) est le plan \\((xOy)\\). La projection de \\((d)\\) dans ce plan est une droite 2D dont le coefficient directeur est la pente cherchée.<br><br>
Représentation paramétrique de \\((d)\\) : \\(x={@q${X}_xa@}+{@q${X}_a@}t\\), \\(y={@q${X}_ya@}+{@q${X}_b@}t\\), \\(z={@q${X}_za@}+{@q${X}_c@}t\\).<br><br>
Le coefficient directeur (la pente) est donc le quotient des coordonnées du vecteur directeur :<br><br>
\\[p=\\frac{{@q${X}_b@}}{{@q${X}_a@}}={@q${X}_ta@}\\]
<em style="color:#64748b;">Remarque : la composante en \\(z\\) ({@q${X}_c@}) n'intervient pas dans le calcul de la pente "2D" de la droite.</em>`), gs('geo-fbgen'));

    } else if (scenario === 'ordonnee') {
        var declOao;
        if (mode === 'fixe') {
            declOao = `q${X}_a:${gn('geo-p1x', 2)};q${X}_b:${gn('geo-p1y', -3)};q${X}_c:${gn('geo-p1z', 6)};
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
        textFrag = `${HDR}${custText}<p>Soit \\((d)\\) la droite dont l'équation cartésienne est \\({@q${X}_a*x+q${X}_b*y+q${X}_c@}=0\\).</p>
<p><strong>1.</strong> Déterminer l'ordonnée à l'origine de la droite \\((d)\\).</p>
<p style="font-size:.85rem;color:#64748b;"><em>Saisir la valeur exacte (ex : 3/2 ou -4).</em></p>
<p>L'ordonnée à l'origine est : [[input:ans_oao${X}]] [[validation:ans_oao${X}]]</p>`;
        inputXML = _mkInput({ name: `ans_oao${X}`, tans: `q${X}_ta`, type: 'algebraic', boxsize: 10, forbidfloat: 1, mustverify: 0, showvalidation: 2 });

        var specsOao = [
            { description: 'Réponse correcte', sans: `ans_oao${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _geoBox('ok', "<strong>Parfait !</strong> C'est bien la valeur de \\(y\\) lorsque \\(x=0\\).") },
            { description: 'Erreur : a juste lu la constante c', sans: `ans_oao${X}`, tans: `q${X}_err_const`, score: 0,
                feedback: _geoBox('warn', "<strong>Confusion avec la constante !</strong> Vous avez donné la valeur de \\(c\\). Ici, il faut isoler \\(y\\) pour trouver l'ordonnée, ou poser \\(x=0\\).") },
            { description: 'Erreur : oubli du signe moins', sans: `ans_oao${X}`, tans: `q${X}_err_sansmoins`, score: 0,
                feedback: _geoBox('warn', "<strong>Erreur de signe !</strong> Vous avez calculé \\(\\frac{c}{b}\\). En isolant \\(y\\), n'oubliez pas que le signe moins passe au numérateur : \\(y=\\frac{-c}{b}\\).") },
            { description: 'Erreur : a calculé le coefficient directeur', sans: `ans_oao${X}`, tans: `q${X}_err_pente`, score: 0,
                feedback: _geoBox('warn', "<strong>Confusion pente / ordonnée !</strong> Vous avez calculé le coefficient directeur \\(-\\frac{a}{b}\\). L'ordonnée à l'origine est le point où la droite coupe l'axe vertical (quand \\(x=0\\)).") },
            { description: "Erreur : a calculé l'abscisse à l'origine", sans: `ans_oao${X}`, tans: `q${X}_err_absc`, score: 0,
                feedback: _geoBox('warn', "<strong>Axe faux !</strong> Vous avez calculé l'abscisse à l'origine (quand \\(y=0\\)). On vous demande l'ordonnée à l'origine, la valeur de \\(y\\) quand \\(x=0\\).") },
            { description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _geoBox('bad', "<strong>Incorrect.</strong> Pour trouver l'ordonnée à l'origine, il faut remplacer \\(x\\) par \\(0\\) dans l'équation et résoudre pour \\(y\\).") }
        ];
        diagNodes = _geoDiagNodes(specsOao);
        var builtOao = _geoSeqPrt(X, bareme, specsOao);
        prtMeta = builtOao.prtMeta; canonicalNodes = builtOao.canonicalNodes; prtXML = builtOao.prtXML;
        generalFeedback = _mkFbGen(_geoGenFbBox(`L'ordonnée à l'origine correspond à la valeur de \\(y\\) lorsque la droite coupe l'axe des ordonnées, c'est-à-dire lorsque \\(x=0\\).<br><br>
On remplace \\(x\\) par \\(0\\) dans l'équation \\({@q${X}_a*x+q${X}_b*y+q${X}_c@}=0\\) :<br><br>
\\[{@q${X}_a@}(0)+{@q${X}_b@}y+{@q${X}_c@}=0\\]
\\[{@q${X}_b@}y+{@q${X}_c@}=0\\implies{@q${X}_b@}y=-{@q${X}_c@}\\implies y=\\frac{-{@q${X}_c@}}{{@q${X}_b@}}\\]
\\[y={@q${X}_ta@}\\]<br>
L'ordonnée à l'origine de la droite est donc {@q${X}_ta@}.`), gs('geo-fbgen'));

    } else { /* aire */
        var d3a = dimSel === '3d';
        var repereA = d3a ? "Dans un repère orthonormé de l'espace" : 'Dans un repère orthonormé';
        var declTri;
        if (mode === 'fixe') {
            declTri = `q${X}_xa:${gn('geo-p1x', 0)};q${X}_ya:${gn('geo-p1y', 0)};q${X}_za:${d3a ? gn('geo-p1z', 0) : 0};
q${X}_xb:${gn('geo-p2x', 3)};q${X}_yb:${gn('geo-p2y', 0)};q${X}_zb:${d3a ? gn('geo-p2z', 0) : 0};
q${X}_xc:${gn('geo-p3x', 0)};q${X}_yc:${gn('geo-p3y', 4)};q${X}_zc:${d3a ? gn('geo-p3z', 0) : 0};`;
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
        textFrag = `${HDR}${custText}<p>${repereA}, on considère les points \\(A${_geoPointTex(X, 'xa', 'ya', 'za', d3a)}\\), \\(B${_geoPointTex(X, 'xb', 'yb', 'zb', d3a)}\\) et \\(C${_geoPointTex(X, 'xc', 'yc', 'zc', d3a)}\\).</p>
<p><strong>1.</strong> Calculer l'aire du triangle \\(ABC\\). <em>(Arrondir le résultat à \\(10^{-2}\\) près.)</em></p>
<p>\\(\\mathcal{A}(ABC)=\\) [[input:ans_aire${X}]] [[validation:ans_aire${X}]]</p>`;
        inputXML = _mkInput({ name: `ans_aire${X}`, tans: `q${X}_ta`, type: 'numerical', boxsize: 10, forbidfloat: 0, mustverify: 0, showvalidation: 2 });

        var specsAire = [
            { description: 'Réponse correcte', answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_ta`, testoptions: '0.005', score: 1,
                feedback: fbOk || _geoBox('ok', "<strong>Parfait !</strong> L'aire du triangle est correctement calculée.") },
            { description: 'Erreur : aire du parallélogramme (oubli du /2)', answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_para`, testoptions: '0.005', score: 0,
                feedback: _geoBox('warn', "<strong>Aire du parallélogramme !</strong> Vous avez calculé la norme du produit vectoriel \\(\\vec{AB}\\times\\vec{AC}\\), l'aire du parallélogramme. Un triangle en représente la <strong>moitié</strong>.") },
            { description: 'Erreur : a oublié la racine carrée', answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_norac`, testoptions: '0.005', score: 0,
                feedback: _geoBox('warn', "<strong>Oubli de la racine carrée !</strong> Vous avez calculé \\(\\frac{x^2+y^2+z^2}{2}\\). La norme d'un vecteur est \\(\\sqrt{x^2+y^2+z^2}\\), il ne faut pas oublier ce radical.") }
        ];
        if (d3a) {
            specsAire.push({ description: "Erreur : a calculé l'aire en 2D (projection)", answertest: 'NumAbsolute', sans: `ans_aire${X}`, tans: `q${X}_err_2d`, testoptions: '0.005', score: 0,
                feedback: _geoBox('warn', "<strong>Calcul en 2D !</strong> Vous avez ignoré la coordonnée en \\(z\\). En 3D, il faut utiliser le <strong>produit vectoriel</strong> dans l'espace pour prendre en compte la profondeur.") });
        }
        specsAire.push({ description: 'Erreur générique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
            feedback: fbWrong || _geoBox('bad', d3a
                ? "<strong>Incorrect.</strong> Appliquez la formule :<br>\\(\\mathcal{A}=\\frac{1}{2}\\|\\vec{AB}\\times\\vec{AC}\\|\\)<br>en n'oubliant pas le produit vectoriel complet (3 coordonnées) et la racine carrée pour la norme."
                : "<strong>Incorrect.</strong> Appliquez la formule de l'aire d'un triangle à partir des coordonnées :<br>\\(\\mathcal{A}=\\frac{1}{2}|x_{\\vec{AB}}y_{\\vec{AC}}-y_{\\vec{AB}}x_{\\vec{AC}}|\\)") });
        diagNodes = _geoDiagNodes(specsAire);
        var builtAire = _geoSeqPrt(X, bareme, specsAire);
        prtMeta = builtAire.prtMeta; canonicalNodes = builtAire.canonicalNodes; prtXML = builtAire.prtXML;
        generalFeedback = _mkFbGen(_geoGenFbBox(d3a
            ? `Dans l'espace, l'aire d'un triangle est la moitié de la norme du produit vectoriel de deux de ses côtés :<br><br>
\\[\\mathcal{A}(ABC)=\\frac{1}{2}\\|\\vec{AB}\\times\\vec{AC}\\|\\]<br>
<strong>1. Vecteurs :</strong> \\(\\vec{AB}\\begin{pmatrix}{@q${X}_ux@}\\\\{@q${X}_uy@}\\\\{@q${X}_uz@}\\end{pmatrix}\\), \\(\\vec{AC}\\begin{pmatrix}{@q${X}_vx@}\\\\{@q${X}_vy@}\\\\{@q${X}_vz@}\\end{pmatrix}\\)<br><br>
<strong>2. Produit vectoriel :</strong> \\(\\vec{AB}\\times\\vec{AC}\\begin{pmatrix}{@q${X}_cx@}\\\\{@q${X}_cy@}\\\\{@q${X}_cz@}\\end{pmatrix}\\)<br><br>
<strong>3. Norme et aire :</strong><br>
\\[\\|\\vec{AB}\\times\\vec{AC}\\|=\\sqrt{{@q${X}_cx@}^2+{@q${X}_cy@}^2+{@q${X}_cz@}^2}\\approx{@q${X}_sqrt_arr@}\\]
\\[\\mathcal{A}(ABC)=\\frac{1}{2}\\times{@q${X}_sqrt_arr@}\\approx{@q${X}_ta@}\\]`
            : `Dans le plan, l'aire d'un triangle se calcule à partir des vecteurs \\(\\vec{AB}\\) et \\(\\vec{AC}\\) :<br><br>
\\[\\mathcal{A}(ABC)=\\frac{1}{2}|x_{\\vec{AB}}\\,y_{\\vec{AC}}-y_{\\vec{AB}}\\,x_{\\vec{AC}}|\\]<br>
<strong>1. Vecteurs :</strong> \\(\\vec{AB}\\begin{pmatrix}{@q${X}_ux@}\\\\{@q${X}_uy@}\\end{pmatrix}\\), \\(\\vec{AC}\\begin{pmatrix}{@q${X}_vx@}\\\\{@q${X}_vy@}\\end{pmatrix}\\)<br><br>
<strong>2. Calcul :</strong><br>
\\[\\mathcal{A}(ABC)=\\frac{1}{2}|{@q${X}_ux@}\\times{@q${X}_vy@}-{@q${X}_uy@}\\times{@q${X}_vx@}|\\approx{@q${X}_ta@}\\]`), gs('geo-fbgen'));
    }

    return {
        type: 'geometrie', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef: `[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []
    };
}

// ─── SUITES ──────────────────────────────────────────────────

