// Convertit la saisie brute de l'élève (notation crochets ]a;b[, [a;b], [a;b[, ]a;b],
// avec ∞/∪/U pour les unions) en expression Maxima comparable à q${X}_ta via AlgEquiv.
// N'utilise volontairement PAS parse_string (fonction interdite par le bac à sable
// de sécurité STACK, "globalyforbiddenfunction" dans security-map.json) : les bornes
// numériques sont converties chiffre par chiffre, et les intervalles construits par
// appel direct aux fonctions cc/co/oc/oo/union déjà chargées par STACK. Renvoie false
// si rien d'interprétable n'a été saisi — le noeud PRT traite alors la réponse comme fausse.
function ineqIntervalFeedbackVars(X) {
    return `_ir${X}:ans_ineq${X};
_ir${X}:ssubst("inf","∞",_ir${X});
_ir${X}:ssubst(" union ","∪",_ir${X});
_ir${X}:ssubst(" union ","U",_ir${X});
_ir${X}:strim(" ",_ir${X});
_inum${X}(_ns):=block([_neg:false,_i,_n,_v:0,_ch,_dp],
 _ns:strim(" ",_ns),
 if slength(_ns)=0 then return(false),
 if is(charat(_ns,1)="-") then (_neg:true,_ns:substring(_ns,2,slength(_ns)+1))
  elseif is(charat(_ns,1)="+") then _ns:substring(_ns,2,slength(_ns)+1),
 if is(_ns="inf") then return(if _neg then -inf else inf),
 _n:slength(_ns),
 if is(_n=0) then return(false),
 for _i:1 thru _n do (
  _ch:charat(_ns,_i),
  _dp:sposition(_ch,"0123456789"),
  if is(_dp=false) then return(false),
  _v:_v*10+ev(_dp-1,simp)
 ),
 if _neg then -_v else _v
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
 _s
);`;
}

function genInequation(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('ineq-bareme')) || 1;
    var scenario = gs('ineq-scenario') || 'lineaire';
    var mode = (document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value || gs('ineq-mode') || 'aleatoire';
    var fbOk = gs('ineq-fb-ok').trim(), fbWrong = gs('ineq-fb-wrong').trim();
    var custText = gs('ineq-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    function ineqNode(falseFb) {
        return {
            name: '0', description: 'Solution correcte ?', answertest: 'AlgEquiv', sans: `_ic${X}`, tans: `q${X}_ta`,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: fbWrong || falseFb
        };
    }

    var HDR = `<div style="background:#8b5cf6;border-left:5px solid #7c3aed;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — In\xe9quations</strong> <span style="background:#7c3aed;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;
    var NOTE = `<p><em>Ensemble solution : ]a;b[ (ouvert), [a;b] (ferm\xe9), [a;b[ ou ]a;b] (semi-ouvert), inf pour l'infini (ex. ]3;inf[). Plusieurs intervalles : ]a;b[ U ]c;d[.</em></p>`;

    if (mode === 'fixe') {
        var fa = gs('ineq-a').trim() || '2', fb = gs('ineq-b').trim() || '-6', fc = gs('ineq-c').trim() || '0';
        var op = gs('ineq-op') || '>';
        var tans = (gs('ineq-tans').trim() || 'oo(3,inf)').replace(/(?<!%)\bunion\(/g, '%union(');
        if (scenario === 'lineaire') {
            vars = `/* Q${X} In\xe9q — Degr\xe9 1 (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_op:"${op}";
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `{@q${X}_a@}x+{@q${X}_b@}{@q${X}_op@}0, sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_a@}x + {@q${X}_b@} {@q${X}_op@} 0 \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        } else if (scenario === 'trinome') {
            vars = `/* Q${X} In\xe9q — Degr\xe9 2 (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};q${X}_op:"${op}";
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_poly@} {@q${X}_op@} 0 \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        } else { /* valeur-abs */
            vars = `/* Q${X} In\xe9q — Valeur absolue (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};q${X}_op:"${op}";
q${X}_ta:${tans};${ineqPrettyVarStmt(X)}`;
            qnote = `|{@q${X}_a@}x+{@q${X}_b@}|{@q${X}_op@}{@q${X}_c@}, sol={@q${X}_ta@}`;
            textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( |{@q${X}_a@}x + {@q${X}_b@}| {@q${X}_op@} {@q${X}_c@} \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        }
        inputXML = _mkInput({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = [ineqNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Solution : {@q${X}_ta@}.</div>`;

    } else if (scenario === 'lineaire') {
        vars = `/* Q${X} In\xe9q — Degr\xe9 1 */
ri(a,b):=a+rand(b-a+1);
q${X}_a_pool:[2,-2,3,-3,4,-4];
q${X}_a:q${X}_a_pool[1+rand(6)];
q${X}_b:ri(-6,6);
q${X}_ops:[">",">=","<","<="];
q${X}_op:q${X}_ops[1+rand(4)];
q${X}_sol:-q${X}_b/q${X}_a;
q${X}_ta:if q${X}_op=">" then (if q${X}_a>0 then oo(q${X}_sol,inf) else oo(-inf,q${X}_sol))
     elseif q${X}_op=">=" then (if q${X}_a>0 then cc(q${X}_sol,inf) else cc(-inf,q${X}_sol))
     elseif q${X}_op="<" then (if q${X}_a>0 then oo(-inf,q${X}_sol) else oo(q${X}_sol,inf))
     else (if q${X}_a>0 then cc(-inf,q${X}_sol) else cc(q${X}_sol,inf));${ineqPrettyVarStmt(X)}`;
        qnote = `{@q${X}_a@}x+{@q${X}_b@}{@q${X}_op@}0, sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_a@}x + {@q${X}_b@} {@q${X}_op@} 0 \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = _mkInput({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = [ineqNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Isoler \\(x\\) (attention au signe si on divise par un n\xe9gatif). R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\({@q${X}_a@}x {@q${X}_op@} -{@q${X}_b@}\\)<br>\\(x {@q${X}_op@} \\frac{-({@q${X}_b@})}{{@q${X}_a@}}={@q${X}_sol@}\\) (attention au signe si a &lt; 0).<br>Solution : {@q${X}_ta@}.</div>`;

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
q${X}_ops:[">",">=","<","<="];
q${X}_op:q${X}_ops[1+rand(4)];
q${X}_ta:if q${X}_a>0 then (if q${X}_op=">" or q${X}_op=">=" then %union(oo(-inf,q${X}_x1),oo(q${X}_x2,inf)) else oo(q${X}_x1,q${X}_x2))
     else (if q${X}_op="<" or q${X}_op="<=" then %union(oo(-inf,q${X}_x1),oo(q${X}_x2,inf)) else oo(q${X}_x1,q${X}_x2));${ineqPrettyVarStmt(X)}`;
        qnote = `sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( {@q${X}_poly@} {@q${X}_op@} 0 \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = _mkInput({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = [ineqNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Racines : \\(x_1={@q${X}_x1@}\\), \\(x_2={@q${X}_x2@}\\). Signe de \\(a={@q${X}_a@}\\). R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Racines : \\(x_1={@q${X}_x1@}\\), \\(x_2={@q${X}_x2@}\\)<br>Signe de \\(a={@q${X}_a@}\\) d\xe9termine la solution : {@q${X}_ta@}.</div>`;

    } else { /* valeur-abs */
        vars = `/* Q${X} In\xe9q — Valeur absolue */
ri(a,b):=a+rand(b-a+1);
q${X}_a_pool:[1,-1,2,-2,3,-3];
q${X}_a:q${X}_a_pool[1+rand(6)];
q${X}_b:rand([-5,-4,-3,-2,-1,0,1,2,3,4,5]);
q${X}_c:rand([1,2,3,4,5]);
q${X}_ops:[">",">=","<","<="];
q${X}_op:q${X}_ops[1+rand(4)];
q${X}_s1:(-q${X}_c-q${X}_b)/q${X}_a;
q${X}_s2:(q${X}_c-q${X}_b)/q${X}_a;
q${X}_sl:min(q${X}_s1,q${X}_s2);q${X}_su:max(q${X}_s1,q${X}_s2);
q${X}_ta:if q${X}_op=">" or q${X}_op=">=" then %union(oo(-inf,q${X}_sl),oo(q${X}_su,inf))
     else oo(q${X}_sl,q${X}_su);${ineqPrettyVarStmt(X)}`;
        qnote = `|{@q${X}_a@}x+{@q${X}_b@}|{@q${X}_op@}{@q${X}_c@}, sol={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>R\xe9soudre dans \\(\\mathbb{R}\\) :</p>
<div style="text-align:center;margin:15px 0;font-size:1.1rem;">\\( |{@q${X}_a@}x + {@q${X}_b@}| {@q${X}_op@} {@q${X}_c@} \\)</div>
<p>Ensemble solution : [[input:ans_ineq${X}]] [[validation:ans_ineq${X}]]</p>
${NOTE}`;
        inputXML = _mkInput({name:`ans_ineq${X}`,type:'string',tans:`q${X}_tastr`,boxsize:28,mustverify:0,showvalidation:2});
        canonicalNodes = [ineqNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(|u|\\leq c\\Leftrightarrow -c\\leq u\\leq c\\), \\(|u|>c\\Leftrightarrow u<-c\\) ou \\(u>c\\). R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(|{@q${X}_a@}x+{@q${X}_b@}|{@q${X}_op@}{@q${X}_c@}\\)<br>Solution : {@q${X}_ta@}.</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: ineqIntervalFeedbackVars(X) };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    generalFeedback = _mkFbGen(generalFeedback, gs('ineq-fbgen'));

    return {type:'inequation', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: []};
}

// ─── THERMO (stub) ───────────────────────────────────────────

