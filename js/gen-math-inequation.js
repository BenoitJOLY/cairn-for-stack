// Convertit la saisie brute de l'élève (notation crochets ]a;b[, [a;b], [a;b[, ]a;b],
// avec ∞/∪/U pour les unions) en expression Maxima comparable à q${X}_ta via AlgEquiv.
// N'utilise volontairement PAS parse_string (fonction interdite par le bac à sable
// de sécurité STACK, "globalyforbiddenfunction" dans security-map.json) : les bornes
// numériques sont converties chiffre par chiffre (entiers, ou fractions p/q — les
// scénarios "linéaire"/"valeur absolue" en mode aléatoire calculent des solutions par
// division qui ne tombent pas toujours sur un entier), et les intervalles construits
// par appel direct aux fonctions cc/co/oc/oo/union déjà chargées par STACK. Renvoie
// false si rien d'interprétable n'a été saisi — le noeud PRT traite alors la réponse
// comme fausse.
function ineqIntervalFeedbackVars(X) {
    return `_ir${X}:ans_ineq${X};
_ir${X}:ssubst("inf","∞",_ir${X});
_ir${X}:ssubst(" union ","∪",_ir${X});
_ir${X}:ssubst(" union ","U",_ir${X});
_ir${X}:strim(" ",_ir${X});
_ir${X}:ssubst("","(",_ir${X});
_ir${X}:ssubst("",")",_ir${X});
_idig${X}(_ns):=block([_i,_n,_v:0,_ch,_dp],
 _n:slength(_ns),
 if is(_n=0) then return(false),
 for _i:1 thru _n do (
  _ch:charat(_ns,_i),
  _dp:sposition(_ch,"0123456789"),
  if is(_dp=false) then return(false),
  _v:_v*10+ev(_dp-1,simp)
 ),
 _v
)$
_inum${X}(_ns):=block([_neg:false,_sp,_a,_b],
 _ns:strim(" ",_ns),
 if slength(_ns)=0 then return(false),
 if is(charat(_ns,1)="-") then (_neg:true,_ns:substring(_ns,2,slength(_ns)+1))
  elseif is(charat(_ns,1)="+") then _ns:substring(_ns,2,slength(_ns)+1),
 if is(_ns="inf") then return(if _neg then -inf else inf),
 _sp:sposition("/",_ns),
 if is(_sp=false) then (
  _a:_idig${X}(_ns),
  if is(_a=false) then return(false),
  if _neg then -_a else _a
 ) else (
  _a:_idig${X}(substring(_ns,1,_sp)),
  _b:_idig${X}(substring(_ns,_sp+1,slength(_ns)+1)),
  if is(_a=false) or is(_b=false) or is(_b=0) then return(false),
  if _neg then -_a/_b else _a/_b
 )
)$
_iseg${X}(_seg):=block([_lob,_hib,_mid,_isp,_lo,_hi,_fn,_nlo,_nhi],
 _seg:strim(" ",_seg),
 if slength(_seg)<5 then return(false),
 _lob:charat(_seg,1),
 _hib:charat(_seg,slength(_seg)),
 if not(is(_lob="]") or is(_lob="[")) then return(false),
 if not(is(_hib="]") or is(_hib="[")) then return(false),
 _mid:substring(_seg,2,slength(_seg)),
 _isp:sposition(";",_mid),
 if is(_isp=false) then _isp:sposition(",",_mid),
 if is(_isp=false) then return(false),
 _lo:substring(_mid,1,_isp),
 _hi:substring(_mid,_isp+1,slength(_mid)+1),
 _nlo:_inum${X}(_lo),
 _nhi:_inum${X}(_hi),
 if is(_nlo=false) or is(_nhi=false) then return(false),
 _fn:if is(_lob="[") and is(_hib="]") then "cc" elseif is(_lob="[") and is(_hib="[") then "co" elseif is(_lob="]") and is(_hib="]") then "oc" else "oo",
 if is(_fn="cc") then cc(_nlo,_nhi) elseif is(_fn="co") then co(_nlo,_nhi) elseif is(_fn="oc") then oc(_nlo,_nhi) else oo(_nlo,_nhi)
)$
_ic${X}:block([_isg,_iout,_ii,_in,_ires],
 _isg:split(_ir${X}," union "),
 _iout:[],
 _in:length(_isg),
 for _ii:1 thru _in do (
  _ires:_iseg${X}(_isg[_ii]),
  if is(_ires=false) then return(false),
  _iout:append(_iout,[_ires])
 ),
 if is(length(_iout)#_in) then false
 elseif is(length(_iout)=1) then first(_iout)
 else interval_tidy(apply('%union,_iout))
);
/* Normalise cc/co/oc/oo (ou union de ceux-ci) en oo(...) uniquement, pour
   comparer les bornes indépendamment de l'inclusion/exclusion (crochets). */
_ibnorm${X}(_e):=if is(_e=false) then false
 elseif safe_op(_e)="%union" then apply('%union,map(lambda([_p],oo(first(_p),second(_p))),args(_e)))
 else oo(first(_e),second(_e));
/* Complémentaire (dans RR, bornes normalisées) d'un intervalle simple ou d'une
   union de 2 demi-droites — sert à détecter l'erreur "bon intervalle, mauvais
   côté" (signe oublié en divisant par un négatif, signe de a mal évalué, etc.).
   Renvoie false si la forme n'est pas l'une des 2 formes attendues (jamais
   comparé à rien de valide, donc sans danger pour le test PRT). */
_icompl${X}(_e):=block([_norm,_args,_a,_b],
 _norm:_ibnorm${X}(_e),
 if is(_norm=false) then false
 elseif safe_op(_norm)="%union" then (
  _args:args(_norm),
  if is(length(_args)#2) then false
  else (_a:second(_args[1]),_b:first(_args[2]),oo(_a,_b))
 ) else (
  _a:first(_norm),_b:second(_norm),
  if is(_a=-inf) then oo(_b,inf)
  elseif is(_b=inf) then oo(-inf,_a)
  else %union(oo(-inf,_a),oo(_b,inf))
 )
);`;
}

// Reconstruit q${X}_ta (expression cc/oo/co/oc ou %union de celles-ci) en une
// vraie chaine Maxima en notation crochets (ex. "]3;+inf["), pour servir de tans
// au champ <input> (type string). Necessaire car stack_string_input::maxima_to_response_array
// fait un substr($v,1,-1) qui suppose que $v est deja une chaine Maxima entre guillemets ;
// utiliser directement q${X}_ta (expression non quotee) tronquait ses premier/dernier caracteres.
function ineqPrettyVarStmt(X) {
    return `
q${X}_tastr:block([_parts,_i,_n,_s,_op,_lo,_hi,_lb,_rb],
 if safe_op(q${X}_ta)="%union" then _parts:args(q${X}_ta) else _parts:[q${X}_ta],
 _n:length(_parts),
 _s:"",
 for _i:1 thru _n do (
  _op:safe_op(_parts[_i]),
  _lo:first(_parts[_i]),
  _hi:second(_parts[_i]),
  _lb:if is(_op="cc") or is(_op="co") then "[" else "]",
  _rb:if is(_op="cc") or is(_op="oc") then "]" else "[",
  if _i>1 then _s:sconcat(_s," U "),
  _s:sconcat(_s,_lb,if is(_lo=-inf) then "-inf" else _lo,";",if is(_hi=inf) then "+inf" else _hi,_rb)
 ),
 _s:ssubst("","(",_s),
 _s:ssubst("",")",_s),
 _s
);`;
}

// Symbole d'affichage pour l'énoncé : ">=" et "<=" ASCII ne rendent pas les
// signes ≥/≤ en LaTeX (l'élève ne les tape jamais, ils n'apparaissent que
// dans l'énoncé) — on les transforme donc en \geq / \leq pour MathJax.
// (2 backslashs en Maxima -> Maxima les réduit à 1 seul dans la chaîne finale,
// donné à MathJax comme \geq ; vérifié empiriquement contre le vrai serveur.)
function ineqOpSymLine(X) {
    return `q${X}_opsym:if q${X}_op=">=" then "\\\\geq" elseif q${X}_op="<=" then "\\\\leq" else q${X}_op;`;
}

function _ineqBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    return {
        bareme: parseFloat(gs('ineq-bareme')) || 1,
        scenario: gs('ineq-scenario') || 'lineaire',
        mode: (document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value || gs('ineq-mode') || 'aleatoire',
        fbOk: gs('ineq-fb-ok').trim(),
        fbWrong: gs('ineq-fb-wrong').trim(),
        custText: gs('ineq-text').trim(),
        fa: gs('ineq-a').trim() || '2',
        fb: gs('ineq-b').trim() || '-6',
        fc: gs('ineq-c').trim() || '0',
        fop: gs('ineq-op') || '>',
        ftans: gs('ineq-tans').trim() || 'oo(3,inf)',
        fbGen: gs('ineq-fbgen')
    };
}

async function genInequation(X) {
    var p = _ineqBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'inequation', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "inequation", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "inequation", repli sur le calcul local.', e); }
    return genInequationCore(X, p);
}

/* genInequationCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-inequation.test.js). */
function genInequationCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    // trig.correction_title porte un 🔑 intégré au texte (repris tel quel par les
    // gen-*.js pas encore migrés vers applyFbBox) ; ici l'icône est déjà fournie
    // par applyFbBox_D('general', ...) plus bas, d'où le retrait pour éviter le doublon.
    var correctionTitle = I18N_D.t('trig.correction_title').replace(/^\S+\s*/, '');

    var bareme = p.bareme, scenario = p.scenario, mode = p.mode;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    // PRT en 4 nœuds pour un retour pédagogique plus précis qu'un simple ✅/❌ :
    //  0. Garde : la réponse a-t-elle été reconnue comme notation d'intervalle
    //     par notre parseur _ic${X} ? Si non (_ic${X}=false — texte non
    //     reconnu, crochets mal formés, etc.), on route directement vers un
    //     message dédié SANS jamais comparer ce `false` à q_ta via AlgEquiv.
    //     Comparer un booléen à un objet "ensemble" (cc/oo/%union) déclenche
    //     le message natif STACK "Your answer should be a subset of the real
    //     numbers..." — vérifié par appel réel à /grade le 2026-07-28 (avec
    //     réponses "abc", "3", "", "]3;" ce message apparaît 1x par nœud
    //     AlgEquiv qui tente la comparaison ; ce nœud de garde évite qu'il
    //     apparaisse 3 fois en le court-circuitant en amont).
    //  1. Comparaison stricte (bornes + inclusion/exclusion) — 1 pt si exact.
    //  2. Bornes identiques mais crochets ouvert/fermé différents — 0.5 pt,
    //     message dédié (erreur d'inclusion, pas de calcul).
    //  3. Bornes = le complémentaire de la bonne réponse (bon calcul, mauvais
    //     côté — signe oublié en divisant par un négatif, signe de a mal
    //     évalué, formule |u|≤c / |u|>c inversée...) — 0.5 pt, message dédié.
    //  Sinon : réponse considérée comme fausse (0 pt), message générique.
    // Les truefeedback/falsefeedback restent du texte brut, SANS encadré coloré :
    // l'encadré (couleur/fond configurables via la modale Options) n'est appliqué
    // qu'au moment de l'export XML (xmlNodes ci-dessous) et de l'aperçu
    // (preview-inequation.js), jamais stocké dans le contenu édité — voir js/fb-box.js.
    function ineqNodes(falseFb, signFb) {
        return [
            {
                name: '0', description: I18N_D.t('ineq.node_format'), answertest: 'AlgEquiv', sans: `is(_ic${X}=false)`, tans: 'true',
                testoptions: '', quiet: '0',
                truescoremode: '=', truescore: '0', truepenalty: '', truenextnode: '-1',
                trueanswernote: 'PRT-'+X+'-FORMAT', truefeedback: I18N_D.t('ineq.fb_format_invalide', {tavar:'q'+X+'_tastr'}), fbKind: 'false',
                falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
                falseanswernote: 'PRT-'+X+'-BOUNDS', falsefeedback: ''
            },
            {
                name: '1', description: I18N_D.t('ineq.node_solution'), answertest: 'AlgEquiv', sans: `_ic${X}`, tans: `q${X}_ta`,
                testoptions: '', quiet: '0',
                truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
                trueanswernote: 'PRT-'+X+'-OK', truefeedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`, fbKind: 'true',
                falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '2',
                falseanswernote: 'PRT-'+X+'-INCLCHK', falsefeedback: ''
            },
            {
                name: '2', description: I18N_D.t('ineq.node_bornes_inclusion'), answertest: 'AlgEquiv', sans: `_ibnorm${X}(_ic${X})`, tans: `_ibnorm${X}(q${X}_ta)`,
                testoptions: '', quiet: '0',
                truescoremode: '=', truescore: '0.5', truepenalty: '', truenextnode: '-1',
                trueanswernote: 'PRT-'+X+'-INCL', truefeedback: I18N_D.t('ineq.fb_bounds_ok_inclusion_wrong', {tavar:'q'+X+'_tastr'}), fbKind: 'partial',
                falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '3',
                falseanswernote: 'PRT-'+X+'-SIGN', falsefeedback: ''
            },
            {
                name: '3', description: I18N_D.t('ineq.node_signe'), answertest: 'AlgEquiv', sans: `_ibnorm${X}(_ic${X})`, tans: `_icompl${X}(q${X}_ta)`,
                testoptions: '', quiet: '0',
                truescoremode: '=', truescore: '0.5', truepenalty: '', truenextnode: '-1',
                trueanswernote: 'PRT-'+X+'-DIR', truefeedback: signFb, fbKind: 'partial',
                falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
                falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: fbWrong || falseFb, falseFbKind: 'false'
            }
        ];
    }

    var HDR = `<div style="background:#8b5cf6;border-left:5px solid #7c3aed;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('ineq.banniere')}</strong> <span style="background:#7c3aed;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
    var NOTE = `<p><em>${I18N_D.t('ineq.note_notation')}</em></p>`;

    if (mode === 'fixe') {
        var fa = p.fa, fb = p.fb, fc = p.fc;
        var op = p.fop;
        var tans = p.ftans.replace(/(?<!%)\bunion\(/g, '%union(');
        if (scenario === 'lineaire') {
            vars = `/* Q${X} In\xe9q — Degr\xe9 1 (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_op:"${op}";
${ineqOpSymLine(X)}
q${X}_lhs:q${X}_a*x+q${X}_b;
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `{@q${X}_lhs@}{@q${X}_op@}0, sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_lhs@} {@q${X}_opsym@} 0 \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        } else if (scenario === 'trinome') {
            vars = `/* Q${X} In\xe9q — Degr\xe9 2 (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};q${X}_op:"${op}";
${ineqOpSymLine(X)}
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_poly@} {@q${X}_opsym@} 0 \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        } else { /* valeur-abs */
            vars = `/* Q${X} In\xe9q — Valeur absolue (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};q${X}_op:"${op}";
${ineqOpSymLine(X)}
q${X}_lhs:q${X}_a*x+q${X}_b;
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `|{@q${X}_lhs@}|{@q${X}_op@}{@q${X}_c@}, sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( |{@q${X}_lhs@}| {@q${X}_opsym@} {@q${X}_c@} \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        }
        inputXML = mkInput_D({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = ineqNodes(
            I18N_D.t('ineq.fb_wrong_reponse', {tavar:'q'+X+'_tastr'}),
            I18N_D.t('ineq.fb_sign_generic', {tavar:'q'+X+'_tastr'})
        );
        generalFeedback = `<strong>${correctionTitle}</strong><br>${I18N_D.t('ineq.fbgen_fixe', {tavar:'q'+X+'_tastr'})}`;

    } else if (scenario === 'lineaire') {
        vars = `/* Q${X} In\xe9q — Degr\xe9 1 */
ri(a,b):=a+rand(b-a+1);
q${X}_a_pool:[2,-2,3,-3,4,-4];
q${X}_a:q${X}_a_pool[1+rand(6)];
q${X}_b:ri(-6,6);
q${X}_op:"${p.fop}";
${ineqOpSymLine(X)}
q${X}_lhs:q${X}_a*x+q${X}_b;
q${X}_sol:-q${X}_b/q${X}_a;
q${X}_ta:if q${X}_op=">" then (if q${X}_a>0 then oo(q${X}_sol,inf) else oo(-inf,q${X}_sol))
     elseif q${X}_op=">=" then (if q${X}_a>0 then co(q${X}_sol,inf) else oc(-inf,q${X}_sol))
     elseif q${X}_op="<" then (if q${X}_a>0 then oo(-inf,q${X}_sol) else oo(q${X}_sol,inf))
     else (if q${X}_a>0 then oc(-inf,q${X}_sol) else co(q${X}_sol,inf));${ineqPrettyVarStmt(X)}`;
        qnote = `{@q${X}_lhs@}{@q${X}_op@}0, sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_lhs@} {@q${X}_opsym@} 0 \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = mkInput_D({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = ineqNodes(
            I18N_D.t('ineq.fb_wrong_lineaire', {tavar:'q'+X+'_tastr'}),
            I18N_D.t('ineq.fb_sign_lineaire', {tavar:'q'+X+'_tastr'})
        );
        generalFeedback = `<strong>${correctionTitle}</strong><br>${I18N_D.t('ineq.fbgen_lineaire', {avar:'q'+X+'_a', opvar:'q'+X+'_op', bvar:'q'+X+'_b', solvar:'q'+X+'_sol', tavar:'q'+X+'_tastr'})}`;

    } else if (scenario === 'trinome') {
        vars = `/* Q${X} In\xe9q — Degr\xe9 2 */
ri(a,b):=a+rand(b-a+1);
q${X}_a_pool:[1,-1,2,-2];
q${X}_a:q${X}_a_pool[1+rand(4)];
q${X}_x1:rand([-5,-4,-3,-2,-1]);
q${X}_x2:rand([1,2,3,4,5]);
q${X}_b:-q${X}_a*(q${X}_x1+q${X}_x2);
q${X}_c:q${X}_a*q${X}_x1*q${X}_x2;
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_op:"${p.fop}";
${ineqOpSymLine(X)}
q${X}_ta:if q${X}_a>0 then (if q${X}_op=">" then %union(oo(-inf,q${X}_x1),oo(q${X}_x2,inf))
      elseif q${X}_op=">=" then %union(oc(-inf,q${X}_x1),co(q${X}_x2,inf))
      elseif q${X}_op="<" then oo(q${X}_x1,q${X}_x2)
      else cc(q${X}_x1,q${X}_x2))
     else (if q${X}_op="<" then %union(oo(-inf,q${X}_x1),oo(q${X}_x2,inf))
      elseif q${X}_op="<=" then %union(oc(-inf,q${X}_x1),co(q${X}_x2,inf))
      elseif q${X}_op=">" then oo(q${X}_x1,q${X}_x2)
      else cc(q${X}_x1,q${X}_x2));${ineqPrettyVarStmt(X)}`;
        qnote = `sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_poly@} {@q${X}_opsym@} 0 \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = mkInput_D({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = ineqNodes(
            I18N_D.t('ineq.fb_wrong_trinome', {x1var:'q'+X+'_x1', x2var:'q'+X+'_x2', avar:'q'+X+'_a', tavar:'q'+X+'_tastr'}),
            I18N_D.t('ineq.fb_sign_trinome', {avar:'q'+X+'_a', tavar:'q'+X+'_tastr'})
        );
        generalFeedback = `<strong>${correctionTitle}</strong><br>${I18N_D.t('ineq.fbgen_trinome', {x1var:'q'+X+'_x1', x2var:'q'+X+'_x2', avar:'q'+X+'_a', tavar:'q'+X+'_tastr'})}`;

    } else { /* valeur-abs */
        vars = `/* Q${X} In\xe9q — Valeur absolue */
ri(a,b):=a+rand(b-a+1);
q${X}_a_pool:[1,-1,2,-2,3,-3];
q${X}_a:q${X}_a_pool[1+rand(6)];
q${X}_b:rand([-5,-4,-3,-2,-1,0,1,2,3,4,5]);
q${X}_c:rand([1,2,3,4,5]);
q${X}_op:"${p.fop}";
${ineqOpSymLine(X)}
q${X}_lhs:q${X}_a*x+q${X}_b;
q${X}_s1:(-q${X}_c-q${X}_b)/q${X}_a;
q${X}_s2:(q${X}_c-q${X}_b)/q${X}_a;
q${X}_sl:min(q${X}_s1,q${X}_s2);q${X}_su:max(q${X}_s1,q${X}_s2);
q${X}_ta:if q${X}_op=">" then %union(oo(-inf,q${X}_sl),oo(q${X}_su,inf))
     elseif q${X}_op=">=" then %union(oc(-inf,q${X}_sl),co(q${X}_su,inf))
     elseif q${X}_op="<" then oo(q${X}_sl,q${X}_su)
     else cc(q${X}_sl,q${X}_su);${ineqPrettyVarStmt(X)}`;
        qnote = `|{@q${X}_lhs@}|{@q${X}_op@}{@q${X}_c@}, sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('ineq.resoudre_reel')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( |{@q${X}_lhs@}| {@q${X}_opsym@} {@q${X}_c@} \\)</div>
<p>${I18N_D.t('ineq.ensemble_solution_lbl')}[[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = mkInput_D({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = ineqNodes(
            I18N_D.t('ineq.fb_wrong_valeur_abs', {tavar:'q'+X+'_tastr'}),
            I18N_D.t('ineq.fb_sign_valeur_abs', {tavar:'q'+X+'_tastr'})
        );
        generalFeedback = `<strong>${correctionTitle}</strong><br>${I18N_D.t('ineq.fbgen_valeur_abs', {avar:'q'+X+'_a', bvar:'q'+X+'_b', opvar:'q'+X+'_op', cvar:'q'+X+'_c', tavar:'q'+X+'_tastr'})}`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: ineqIntervalFeedbackVars(X) };
    // canonicalNodes (exposé via prt.nodes pour l'édition/aperçu) reste brut, sans
    // encadré : xmlNodes n'est qu'une copie avec l'encadré appliqué, réservée à
    // l'export XML final — voir js/fb-box.js.
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: n.truefeedback ? applyFbBox_D(n.fbKind || 'true', n.truefeedback) : n.truefeedback,
            falsefeedback: n.falsefeedback ? applyFbBox_D(n.falseFbKind || 'false', n.falsefeedback) : n.falsefeedback
        });
    });
    prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    generalFeedback = applyFbBox_D('general', mkFbGen_D(generalFeedback, p.fbGen));

    // canonicalNodes = [0:garde format, 1:exact, 2:bornes ok/inclusion fausse (0.5pt),
    // 3:mauvais cote (0.5pt) / fallback totalement faux (0pt)]. _hsPrtBoxes() (aperçu)
    // prend le nœud[0] comme "bonne réponse" et le dernier comme "sinon" — ici on lui
    // passe nodes.slice(1) (voir preview-inequation.js) pour que ce soit bien le nœud 1
    // (exact) qui joue ce rôle, pas le nœud de garde, et le falsefeedback du nœud 3
    // (0pt, totalement faux) qui joue le rôle de "sinon". Les paliers à 0.5pt (nœuds 2
    // et 3-vrai) et le nœud de garde n'ont sinon aucune boîte d'aperçu : diagNodes les expose.
    var diagNodes = [canonicalNodes[0], canonicalNodes[2], canonicalNodes[3]].map(function (n) {
        return { desc: n.description, fb: n.truefeedback, kind: n.fbKind };
    });

    return {type:'inequation', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genInequation: genInequation, genInequationCore: genInequationCore, ineqIntervalFeedbackVars: ineqIntervalFeedbackVars, ineqPrettyVarStmt: ineqPrettyVarStmt };
}

