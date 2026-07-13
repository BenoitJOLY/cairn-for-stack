async function genChemicalTopo(X){
  const toML=(arr)=>`[${arr.map(x=>`"${x}"`).join(',')}]`;
  const toNL=(arr)=>`[${arr.map(x=>`${x}`).join(',')}]`;
  const parseSideJS=(txt)=>{
    if(!txt||txt.trim()==='') return {f:[],c:[],s:[]};
    const parts=txt.trim().split('+');let f=[],c=[],s=[];
    parts.forEach(p=>{
      if(!p.trim())return;
      const ps=p.trim().split(' ');let coef=parseInt(ps[0]);
      let smi=isNaN(coef)?p.trim():p.trim().substring(ps[0].length).trim();
      if(isNaN(coef))coef=1;
      f.push(smi);s.push(coef);
      c.push(smi.indexOf('-]')!==-1?-1:(smi.indexOf('+]')!==-1?1:0));
    });
    return {f,c,s};
  };

  const bareme=parseFloat(v('topo-bareme'))||2;
  const text=richVal('topo-text');
  const equation=document.getElementById('topo-editor').innerText.trim();
  if(!equation) throw new Error(I18N.t('msg.err_topo_eq_vide', {n: X}));

  // Scores depuis l'UI
  const w_prt1=(parseInt(document.getElementById('topo-w_prt1').value)||0)/100;
  const w_n0=(parseInt(document.getElementById('topo-w_n0').value)||0)/100;
  const w_n1=(parseInt(document.getElementById('topo-w_n1').value)||0)/100;
  const w_n2=(parseInt(document.getElementById('topo-w_n2').value)||0)/100;
  const w_n3=(parseInt(document.getElementById('topo-w_n3').value)||0)/100;
  const w_n4=(parseInt(document.getElementById('topo-w_n4').value)||0)/100;
  const w_n5=(parseInt(document.getElementById('topo-w_n5').value)||0)/100;

  const sep=equation.includes('<=>')?'<=>':equation.includes('->')?'->':'=';
  const sides=equation.split(sep);
  const r=parseSideJS(sides[0]||''), p=parseSideJS(sides[1]||'');
  const fctDefault=(document.getElementById('topo-fct-name')?.value||'').trim()||'aucune';
  const typeReac=(document.getElementById('topo-type-reac')?.value||'').trim()||'';

  // Noms des inputs (identiques à la référence)
  const iRf =`ans_reaformul${X}`, iRc=`ans_reacoef${X}`,  iRch=`ans_reacharge${X}`;
  const iPf =`ans_proformul${X}`, iPc=`ans_procoef${X}`,  iPch=`ans_procharge${X}`;
  const iFr =`ans_fct_rea${X}`,   iFp=`ans_fct_pro${X}`;
  const iAb =`ans_atombalance${X}`, iRaw=`ans_raw${X}`;
  // Variables Maxima prof
  const vRf=`tans_reaformul${X}`, vRc=`tans_reacoef${X}`, vRch=`tans_reacharge${X}`;
  const vPf=`tans_proformul${X}`, vPc=`tans_procoef${X}`, vPch=`tans_procharge${X}`;
  const vFr=`tans_fct_rea${X}`,   vFp=`tans_fct_pro${X}`;
  const vSep=`tans_arrow${X}`;

  // ── Variables Maxima (calquées sur la référence) ──
  const vars=`/* Q${X} Chimie Topo (${bareme}pt) */
${vSep}: "${sep}";
is_arrow_any${X}: false;
${vRf}: ${toML(r.f)};
${vRc}: ${toNL(r.s)};
${vRch}: ${toNL(r.c)};
${vPf}: ${toML(p.f)};
${vPc}: ${toNL(p.s)};
${vPch}: ${toNL(p.c)};
${vFr}: "";
${vFp}: "${fctDefault}";
type_reaction${X}: "${typeReac}";
nom_fct_attendue${X}: "${fctDefault}";
has_fct_pro${X}: is(${vFp} # "");
charge_rea_teacher${X}: sum(${vRc}[i]*${vRch}[i],i,1,length(${vRc}));
charge_pro_teacher${X}: sum(${vPc}[i]*${vPch}[i],i,1,length(${vPc}));
arrow_expl_fwd${X}: "une reaction TOTALE (irreversible)";
arrow_expl_eq${X}: "une reaction D EQUILIBRE (reversible)";
tans_arrow_expl${X}: if is(${vSep}="->") then arrow_expl_fwd${X} else arrow_expl_eq${X};
tans_arrow_other_expl${X}: if is(${vSep}="->") then arrow_expl_eq${X} else arrow_expl_fwd${X};
tans_arrow_symbol${X}: if is(${vSep}="->") then "->" else "<=>";
tans_arrow_wrong_symbol${X}: if is(${vSep}="->") then "<=>" else "->";`;

  // ── HTML + Script (calqué exactement sur la référence) ──
  const htmlBlock=`<div id="inst_{#qid#}" style="font-family: sans-serif; background: #fff; border: 1px solid #d1d8dd; border-radius: 8px; padding: 15px;">
<style>
#inst_{#qid#} .btn-stk{padding:8px 14px;border:none;border-radius:8px;background:#334155;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;transition:filter .15s,transform .1s;font-family:inherit;}
#inst_{#qid#} .btn-stk:hover{filter:brightness(1.12);}
#inst_{#qid#} .btn-stk:active{transform:translateY(1px);}
#inst_{#qid#} .jsme-modal-box{background:#fff;border-radius:14px;padding:22px;max-width:480px;width:95%;box-shadow:0 20px 50px rgba(15,23,42,.28);}
#inst_{#qid#} .jsme-modal-box h3{margin:0 0 14px;color:#1e293b;font-size:1.05rem;}
#inst_{#qid#} .jsme-canvas{width:420px;height:300px;margin:0 auto;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;}
</style>
<div id="jsme_modal_{#qid#}" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,.55); z-index: 9999; align-items: center; justify-content: center;">
<div class="jsme-modal-box">
<h3>${I18N.t('tpl.topo_jsme_modal_title')}</h3>
<div id="jsme_{#qid#}" class="jsme-canvas"></div>
<div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;"><button class="btn-stk" style="background: #94a3b8;" type="button" onclick="document.getElementById('jsme_modal_{#qid#}').style.display='none'">${I18N.t('tpl.topo_btn_cancel')}</button> <button class="btn-stk" style="background: #4338ca;" type="button" onclick="window['insertJsme_{#qid#}']()">${I18N.t('tpl.topo_btn_insert')}</button></div>
</div>
</div>
<div class="toolbar" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
<button class="btn-stk" type="button" onclick="window['api_{#qid#}'].ins('->')">${I18N.t('tpl.topo_btn_total')}</button>
<button class="btn-stk" type="button" onclick="window['api_{#qid#}'].ins('<=>')">${I18N.t('tpl.topo_btn_equilibrium')}</button>
<button class="btn-stk" type="button" onclick="window['api_{#qid#}'].ins('+')">${I18N.t('tpl.topo_btn_add')}</button>
<button class="btn-stk" style="background: #8e44ad;" type="button" onclick="window['openJsme_{#qid#}']()">${I18N.t('tpl.topo_btn_molecule')}</button>
</div>
<div id="ed_{#qid#}" style="border: 2px solid #3498db; min-height: 45px; font-size: 1.15rem; padding: 12px; outline: none; border-radius: 5px; margin-bottom: 15px; font-family: monospace; background: #fdfdfd;" contenteditable="true"></div>
<div id="viz_{#qid#}" style="background: #fcfcfc; border: 1px solid #eee; border-radius: 5px; padding: 12px; min-height: 100px; overflow-x: auto;">
<div id="render_area_{#qid#}" style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex-wrap: nowrap; min-width: min-content;"></div>
</div>
<div style="display: none;">
<span class="stk-reaf">[[input:${iRf}]] [[validation:${iRf}]]</span>
<span class="stk-reac">[[input:${iRch}]] [[validation:${iRch}]]</span>
<span class="stk-reas">[[input:${iRc}]] [[validation:${iRc}]]</span>
<span class="stk-prof">[[input:${iPf}]] [[validation:${iPf}]]</span>
<span class="stk-proc">[[input:${iPch}]] [[validation:${iPch}]]</span>
<span class="stk-pros">[[input:${iPc}]] [[validation:${iPc}]]</span>
<span class="stk-rea">[[input:${iFr}]] [[validation:${iFr}]]</span>
<span class="stk-pro">[[input:${iFp}]] [[validation:${iFp}]]</span>
<span class="stk-atbal">[[input:${iAb}]] [[validation:${iAb}]]</span>
[[input:${iRaw}]] [[validation:${iRaw}]]
</div>
</div>
<p>
<script src="https://unpkg.com/smiles-drawer@2.0.1/dist/smiles-drawer.min.js"></script>
<script type="text/javascript" src="https://jsme-editor.github.io/dist/jsme/jsme.nocache.js"></script>
<script>
(function() {
    var qId = "{#qid#}";
    var sfx = "${X}";
    var sd = null;
    var jsmeInst = null;
    var lastRange = null;

    window["openJsme_" + qId] = function() {
        document.getElementById("jsme_modal_" + qId).style.display = "flex";
        if (!jsmeInst && typeof JSApplet !== "undefined") {
            jsmeInst = new JSApplet.JSME("jsme_" + qId, "420px", "300px", {options:"query,hydrogens"});
        } else if (jsmeInst) { jsmeInst.reset(); }
    };

    window["insertJsme_" + qId] = function() {
        if (!jsmeInst) return;
        var smi = jsmeInst.smiles();
        if (smi) window["api_" + qId].ins(smi);
        document.getElementById("jsme_modal_" + qId).style.display = "none";
    };

    window["api_" + qId] = {
        ins: function(t) {
            var e = document.getElementById("ed_" + qId);
            e.focus();
            var sel = window.getSelection();
            var range = lastRange || document.createRange();
            if (!e.contains(range.commonAncestorContainer)) {
                range.selectNodeContents(e); range.collapse(false);
            }
            range.deleteContents();
            var node = document.createTextNode(t + " ");
            range.insertNode(node);
            range.setStartAfter(node); range.collapse(true);
            sel.removeAllRanges(); sel.addRange(range);
            lastRange = range;
            e.dispatchEvent(new Event("input", {bubbles:true}));
        }
    };

    function parseSide(txt) {
        if (!txt || txt.trim() === "") return {f:"[]",c:"[]",s:"[]"};
        var mols = txt.split("+"), f=[], c=[], s=[];
        mols.forEach(function(v) {
            v = v.trim(); if (!v) return;
            var parts = v.split(" ");
            var coef = parseInt(parts[0]);
            var smi = isNaN(coef) ? v : v.substring(parts[0].length).trim();
            f.push('"' + smi + '"');
            s.push(isNaN(coef) ? 1 : coef);
            c.push(smi.includes("-]") ? -1 : (smi.includes("+]") ? 1 : 0));
        });
        return {f:"["+f.join(",")+"]", c:"["+c.join(",")+"]", s:"["+s.join(",")+"]"};
    }

    function countHeavyAtoms(smi) {
        var counts={}, i=0;
        while (i < smi.length) {
            var ch = smi.charAt(i);
            if (ch === "[") {
                var j = i+1; while (j < smi.length && smi.charAt(j) !== "]") j++;
                var inner = smi.substring(i+1, j);
                var eMatch = inner.match(/^([A-Z][a-z]?)/);
                if (eMatch && eMatch[1] !== "H") counts[eMatch[1]] = (counts[eMatch[1]]||0)+1;
                i = j+1;
            } else if (ch >= "A" && ch <= "Z") {
                var sym = ch;
                if (i+1 < smi.length && smi.charAt(i+1) >= "a" && smi.charAt(i+1) <= "z") { sym += smi.charAt(i+1); i++; }
                counts[sym] = (counts[sym]||0)+1; i++;
            } else if ("cnos".indexOf(ch) !== -1) {
                counts[ch.toUpperCase()] = (counts[ch.toUpperCase()]||0)+1; i++;
            } else i++;
        }
        return counts;
    }

    function checkAtomBalance(val) {
        var sep = val.indexOf("<=>") !== -1 ? "<=>" : "->";
        var sides = val.split(sep);
        if (sides.length < 2) return "unknown";
        function sideCounts(side) {
            var total={};
            side.split("+").forEach(function(m) {
                m = m.trim(); if (!m) return;
                var parts = m.split(" "); var coef = parseInt(parts[0]);
                var smi = isNaN(coef) ? m : m.substring(parts[0].length).trim();
                var c = countHeavyAtoms(smi); var n = isNaN(coef) ? 1 : coef;
                for (var k in c) total[k] = (total[k]||0) + c[k]*n;
            });
            return total;
        }
        var rea=sideCounts(sides[0]), pro=sideCounts(sides[1]), allK={};
        for (var k in rea) allK[k]=1; for (var k in pro) allK[k]=1;
        for (var k in allK) { if ((rea[k]||0) !== (pro[k]||0)) return "false"; }
        return "true";
    }

    function core() {
        var ed = document.getElementById("ed_" + qId);
        var ct = document.getElementById("inst_" + qId);
        var ra = document.getElementById("render_area_" + qId);
        var rawInp = ct.querySelector("[name*=ans_raw]");
        function getI(cls) { return ct.querySelector("." + cls + " input"); }

        ed.addEventListener("blur", function() {
            var sel = window.getSelection();
            if (sel.rangeCount > 0) lastRange = sel.getRangeAt(0);
        });

        ed.addEventListener("input", function() {
            var val = ed.innerText.replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
            if (rawInp) {
                rawInp.value = val || " ";
                rawInp.dispatchEvent(new Event("input",{bubbles:true}));
                rawInp.dispatchEvent(new Event("change",{bubbles:true}));
            }
            var sep2 = val.indexOf("<=>") !== -1 ? "<=>" : "->";
            var parts = val.split(sep2);
            var rD = parseSide(parts[0]||""), pD = parseSide(parts[1]||"");
            var mapping = {
                "stk-reaf": rD.f, "stk-reac": rD.c, "stk-reas": rD.s,
                "stk-prof": pD.f, "stk-proc": pD.c, "stk-pros": pD.s
            };
            for (var cls in mapping) { var inp=getI(cls); if (inp) inp.value=mapping[cls]; }
            var abInp = getI("stk-atbal"); if (abInp) abInp.value = checkAtomBalance(val);
            var fctReaInp = getI("stk-rea"); if (fctReaInp) fctReaInp.value = "";
            var fctProInp = getI("stk-pro"); if (fctProInp) fctProInp.value = "${fctDefault}";

            ra.innerHTML = "";
            if (!val) return;
            if (!sd && typeof SmilesDrawer !== "undefined") sd = new SmilesDrawer.Drawer({width:110,height:80,compactDrawing:true});
            val.split(" ").forEach(function(t, idx) {
                t = t.trim(); if (!t) return;
                var el = document.createElement("div");
                el.style.flexShrink="0"; el.style.display="flex"; el.style.alignItems="center";
                if (t==="->"||t==="→") {
                    el.innerHTML='<span style="font-size:1.5rem;font-weight:bold;padding:0 8px;">→</span>';
                } else if (t==="<=>"||t==="⇌") {
                    el.innerHTML='<span style="font-size:1.5rem;font-weight:bold;padding:0 8px;">⇌</span>';
                } else if (t==="+") {
                    el.innerHTML='<span style="font-size:1.2rem;font-weight:bold;padding:0 10px;color:#666;">+</span>';
                } else if (!isNaN(t)) {
                    el.innerHTML='<span style="font-size:1.4rem;font-weight:bold;padding:0 5px;">'+t+'</span>';
                } else {
                    var cid="c_"+qId+"_"+idx;
                    el.innerHTML="<canvas id='"+cid+"' width='110' height='80' style='border:1px solid #eee;background:#fff;border-radius:4px;'></canvas>";
                    setTimeout(function(token,canvasId){
                        return function(){
                            if (typeof SmilesDrawer!=="undefined") {
                                SmilesDrawer.parse(token,function(tree){sd.draw(tree,canvasId,"light",false);},function(){
                                    var cv=document.getElementById(canvasId);
                                    if(cv) cv.parentElement.innerHTML='<span style="padding:10px;font-family:monospace;">'+token+'</span>';
                                });
                            }
                        };
                    }(t,cid),50);
                }
                ra.appendChild(el);
            });
        });

        if (rawInp && rawInp.value.trim() !== "") {
            ed.innerText = rawInp.value; ed.dispatchEvent(new Event("input"));
        }
    } // fin core()

    var wait = setInterval(function(){ if (document.getElementById("ed_"+qId)) { clearInterval(wait); core(); } }, 200);
})();
</script>
</p>`;

  // ── textFrag / previewFrag ────────────────────────
  const textFrag=`<div style="background:#B5464D;border-left:5px solid #8f2b33;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N.t('tpl.topo_title')}</strong> <span style="background:#8f2b33;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>
<!-- ENONCE-START -->
<div style="margin-bottom:12px;">${text||''}</div>
<!-- ENONCE-END -->
${htmlBlock}`;

  // Capturer le preview avec délai pour SmilesDrawer
  const capturedHtml = await new Promise(resolve => {
    const pa = document.getElementById('topo-preview-area');
    if (!pa) { resolve(''); return; }
    setTimeout(() => {
      const cl = pa.cloneNode(true);
      const canvases = pa.querySelectorAll('canvas');
      const cloneCanvases = cl.querySelectorAll('canvas');
      canvases.forEach((cv, i) => {
        try {
          const img = document.createElement('img');
          img.src = cv.toDataURL('image/png');
          img.width = cv.width; img.height = cv.height;
          cloneCanvases[i].replaceWith(img);
        } catch(e) {}
      });
      resolve(cl.innerHTML);
    }, 350);
  });

  const previewFrag=`<div style="background:#B5464D;border-left:5px solid #8f2b33;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} ${I18N.t('tpl.topo_title')}</strong> <span style="background:#8f2b33;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>
<!-- ENONCE-START --><div>${text||''}</div><!-- ENONCE-END -->
<div style="padding:10px;background:#f8f8f8;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">${capturedHtml}</div>`;

  // ── Inputs XML (calqués sur la référence) ─────────
  const mkInp=(name,type,tans,box)=>`    <input>
      <name>${name}</name>
      <type>${type}</type>
      <tans>${tans}</tans>
      <boxsize>${box||15}</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`;

  const inputXML=[
    mkInp(iAb,  'string',   '"true"', 10),
    mkInp(iFp,  'string',   vFp),
    mkInp(iFr,  'string',   '"" '),
    mkInp(iPch, 'algebraic', vPch),
    mkInp(iPc,  'algebraic', vPc),
    mkInp(iPf,  'algebraic', vPf),
    mkInp(iRaw, 'string',   '"" '),
    mkInp(iRch, 'algebraic', vRch),
    mkInp(iRc,  'algebraic', vRc),
    mkInp(iRf,  'algebraic', vRf),
  ].join('\n');

  // ── feedbackvariables (calquées sur la référence) ──
  const fbVars=`local_raw${X}: sconcat(${iRaw});
longueur_avant${X}: slength(local_raw${X});
longueur_apres${X}: slength(sremove("<",local_raw${X}));
is_equi${X}: is(longueur_avant${X} > longueur_apres${X});
is_tot${X}: false;
if (not is_equi${X}) then (
    if slength(local_raw${X}) > slength(sremove(">",local_raw${X})) then is_tot${X}: true
);
ans_arrow_det${X}: "absente";
if is_equi${X} then ans_arrow_det${X}: "<=>" else if is_tot${X} then ans_arrow_det${X}: "->";
is_arrow_ok${X}: is(ans_arrow_det${X} = ${vSep});
arrow_s_label${X}: if is_equi${X} then "la fleche d equilibre (<=>)" else if is_tot${X} then "la fleche totale (->)" else "aucune fleche";
arrow_t_label${X}: if is(${vSep}="->") then "la fleche totale (->)" else "la fleche d equilibre (<=)";
L_reac${X}: if listp(${iRch}) then ${iRch} else [];
L_reac_n${X}: if listp(${iRc}) then ${iRc} else [];
L_prod${X}: if listp(${iPch}) then ${iPch} else [];
L_prod_n${X}: if listp(${iPc}) then ${iPc} else [];
is_atoms_ok${X}: sequal(${iAb},"true");
charge_rea_s${X}: if length(L_reac${X})>0 and length(L_reac${X})=length(L_reac_n${X}) then sum(L_reac${X}[i]*L_reac_n${X}[i],i,1,length(L_reac${X})) else 0;
charge_pro_s${X}: if length(L_prod${X})>0 and length(L_prod${X})=length(L_prod_n${X}) then sum(L_prod${X}[i]*L_prod_n${X}[i],i,1,length(L_prod${X})) else 0;
charges_conserved${X}: is(charge_rea_s${X}=charge_pro_s${X});
nb_rea_s${X}: if listp(${iRf}) then length(${iRf}) else 0;
nb_pro_s${X}: if listp(${iPf}) then length(${iPf}) else 0;
nb_rea_t${X}: length(${vRf}); nb_pro_t${X}: length(${vPf});
rea_ok${X}: is(sort(if listp(${iRf}) then ${iRf} else [])=sort(${vRf}));
pro_ok${X}: is(sort(if listp(${iPf}) then ${iPf} else [])=sort(${vPf}));
formulas_ok${X}: rea_ok${X} and pro_ok${X};
fct_pro_ok${X}: sequal(${iFp},${vFp});
list_rea_s${X}: if listp(${iRf}) and listp(${iRc}) then map(lambda([f,c],[f,c]),${iRf},${iRc}) else [];
list_pro_s${X}: if listp(${iPf}) and listp(${iPc}) then map(lambda([f,c],[f,c]),${iPf},${iPc}) else [];
full_ans_map${X}: append(list_rea_s${X},list_pro_s${X});
list_rea_t${X}: map(lambda([f,c],[f,c]),${vRf},${vRc});
list_pro_t${X}: map(lambda([f,c],[f,c]),${vPf},${vPc});
full_tans_map${X}: append(list_rea_t${X},list_pro_t${X});
_common${X}: sublist(full_ans_map${X},lambda([pp],not is(assoc(pp[1],full_tans_map${X},"nf")="nf")));
k_ratio${X}: if length(_common${X})>0 then _common${X}[1][2]/assoc(_common${X}[1][1],full_tans_map${X},1) else 1;
coefs_ok${X}: is(sort(full_ans_map${X})=sort(full_tans_map${X}));
is_proportional${X}: if length(full_ans_map${X})=0 then false else is(length(sublist(full_ans_map${X},lambda([pp],is(pp[2]=assoc(pp[1],full_tans_map${X},0)*k_ratio${X}))))=length(full_ans_map${X}));`;

  // ── 7 Nœuds PRT (calqués sur la référence) ────────
  const mkCanonNode=(n,desc,test,sans,tans,ts,tn,fs,fn,tfb,ffb,tm,fm)=>({
    name:String(n), description:desc, answertest:test, sans:sans, tans:tans,
    testoptions:'', quiet:'0',
    truescoremode:tm||'+', truescore:String(ts), truepenalty:'', truenextnode:String(tn),
    trueanswernote:`prt${X}-${n}-T`, truefeedback:tfb,
    falsescoremode:fm||'-', falsescore:String(fs), falsepenalty:'', falsenextnode:String(fn),
    falseanswernote:`prt${X}-${n}-F`, falsefeedback:ffb
  });

  const canonicalNodes=[
    mkCanonNode(0,'Fleche','AlgEquiv',`is_arrow_ok${X}`,'true',w_prt1.toFixed(7),1,0,1,
      `<p><span style="color: green; font-weight: bold;">✓ Bonne flèche de réaction !</span></p>`,
      `<p><span style="color: red; font-weight: bold;">✗ Mauvaise flèche.</span> Détectée : {@ans_arrow_det${X}@}, attendue : {@${vSep}@}</p>`),
    mkCanonNode(1,'Bilan atomes','AlgEquiv',`is_atoms_ok${X}`,'true',w_n0.toFixed(7),2,0,2,
      `<p><span style="color: green; font-weight: bold;">✓ Votre réaction est équilibrée du point de vue des éléments chimiques !</span></p>`,
      `<p><span style="color: #cc2222; font-weight: bold;">✗ Votre réaction n'est pas équilibrée du point des éléments chimiques !</span></p>`),
    mkCanonNode(2,'Charges','AlgEquiv',`charges_conserved${X}`,'true',w_n1.toFixed(7),3,0,3,
      `<p><span style="color: green;">✓ Votre équation est équilibrée électriquement.</span></p>`,
      `<p><span style="color: red;">✗ Les charges ne sont pas conservées dans votre réaction.</span> Réactifs : {@charge_rea_s${X}@}, Produits : {@charge_pro_s${X}@}</p>`),
    mkCanonNode(3,'Formules','AlgEquiv',`formulas_ok${X}`,'true',w_n2.toFixed(7),5,0,4,
      `<p><span style="color: green;">✓ Vos formules sont correctes !</span></p>`,
      `<p><span style="color: red;">✗ Vos formules sont incorrectes.</span> Réactifs : {@nb_rea_s${X}@}/${r.f.length}, Produits : {@nb_pro_s${X}@}/${p.f.length}</p>`),
    mkCanonNode(4,'Groupes','AlgEquiv',`fct_pro_ok${X}`,'true',w_n3.toFixed(7),5,0,5,
      `<p><span style="color: orange;">⚠ Bonne compréhension du type de réaction.</span></p>`,
      `<p><span style="color: red;">✗ Groupes fonctionnels non reconnus.</span></p>`),
    mkCanonNode(5,'Coefficients','AlgEquiv',`coefs_ok${X}`,'true',w_n4.toFixed(7),-1,0,6,
      `<p><span style="color: green;">✓ Vos coefficients stœchiométriques sont corrects !</span></p>`,
      `<p><span style="color: #cc2222;">✗ Vos coefficients stœchiométriques sont incorrects !</span></p>`),
    mkCanonNode(6,'Coefs prop','AlgEquiv',`is_proportional${X}`,'true',w_n5.toFixed(7),-1,0,-1,
      `<p><span style="color: orange;">⚠ Coefficients proportionnels (k={@k_ratio${X}@}) mais non réduits.</span></p>`,
      `<p><span style="color: red;">✗ Coefficients non proportionnels.</span></p>`)
  ];
  const prtMeta = { name:`prt${X}`, value:'1.0000000', autosimplify:'1', feedbackstyle:'2', feedbackvariables: fbVars };
  const prtXML = buildPrtXml(prtMeta, canonicalNodes);

  return {
    bareme, vars,
    qnote:`Topo Q${X}: ${equation}`,
    textFrag, previewFrag,
    topoPreviewHtml: capturedHtml,
    inputXML,
    prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    generalFeedback: _mkFbGen('', v('topo-fbgen')),
    feedbackRef:`[[feedback:prt${X}]]`
  };
}
function genChemical(X){
  const bareme = parseFloat(v('chem-bareme')) || 2;
  const text   = richVal('chem-text');
  if(!text || !text.trim()) throw new Error(I18N.t('msg.err_chem_enonce_vide', {n: X}));
  const editorEl = document.getElementById('chem-editor-text');
  if(!editorEl || !editorEl.innerText.trim()) throw new Error(I18N.t('msg.err_chem_vide', {n: X}));
  const editorHTML  = editorEl.innerHTML;
  const editorPlain = editorEl.innerText.trim();

  // Normaliser subscripts Unicode → chiffres ASCII
  function normSub(s){ return s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x2080+48)); }

  // htmlToLatex : SUB collé, SUP exposant, → normalisé
  function htmlToLatex(html){
    const d=document.createElement('div'); d.innerHTML=html;
    function cv(n){ let r=''; for(let c of n.childNodes){ if(c.nodeType===3)r+=c.textContent; else if(c.nodeName==='SUB')r+=cv(c); else if(c.nodeName==='SUP')r+=`^{${cv(c)}}`; else r+=cv(c); } return r; }
    return normSub(cv(d).replace(/\u00a0/g,' ').replace(/→/g,'->').replace(/⇌/g,'<=>').trim());
  }

  // Parser une formule brute en composants [[n,"X"],...]
  // CO2 est EXCLU de FG ici — il doit être parsé comme C + 2O (atomes), pas comme groupe fonctionnel
  const FG=["CONH2","COOR","COOH","COO","CHO","CH3","C2H5","OH","NH2","NO2"];
  function parseStruct(mol){
    let comps=[], det=[];
    let c=normSub(mol).replace(/\^?\{([^}]+)\}/g,'$1').replace(/-/g,'');
    let hasC=/(^|[^a-z])C([^a-z]|$)/.test(c);
    for(let g of FG){
      let re=new RegExp(g+'(\\d*)','g'),m;
      while((m=re.exec(c))!==null){
        if(g==='OH'&&!hasC)break;
        let gn=(g==='CO2')?'COO':g; det.push(gn);
        comps.push([Number(m[1])||1,gn]);
        c=c.substring(0,m.index)+' '.repeat(m[0].length)+c.substring(m.index+m[0].length);
      }
    }
    let ar=/([A-Z][a-z]?)(\d*)/g,am;
    while((am=ar.exec(c))!==null){ if(am[1].trim()) comps.push([Number(am[2])||1,am[1]]); }
    return {comps, det:[...new Set(det)]};
  }
  function parseSide(s){
    let mols=[],ch=[],fcts=[],co=[];
    if(!s)return{mols,ch,fcts,co};
    s=normSub(s);
    for(let bl of s.split(/\s*\+\s*(?![^{]*\})/)){
      bl=bl.trim(); if(!bl)continue;
      let m=bl.match(/^(\d+)?\s*(.+)$/); if(!m)continue;
      co.push(m[1]?parseInt(m[1]):1);
      let mol=m[2];
      let cm=mol.match(/\^?\{([^}]+)\}/); let cv=0;
      if(cm){let c=cm[1].trim(); cv=(c==='+'||c==='1+')?1:(c==='-'||c==='1-')?-1:parseInt(c)*(c.includes('-')?-1:1);}
      ch.push(cv);
      let st=parseStruct(mol); mols.push(st.comps);
      for(let f of st.det){if(!fcts.includes(f))fcts.push(f);}
    }
    return{mols,ch,fcts,co};
  }

  const latex = htmlToLatex(editorHTML);
  const sides = latex.split(/->|<=>|<->/);
  const r = parseSide(sides[0]||'');
  const p = parseSide(sides[1]||'');
  const arrow = latex.indexOf('<=>') !== -1 ? '<=>'
              : latex.indexOf('<->') !== -1 ? '<->'
              : latex.indexOf('->') !== -1  ? '->'
              : 'none';

  // Sérialisation Maxima compacte
  const toML  = arr => `[${arr.map(x=>JSON.stringify(x)).join(',')}]`;
  const toMLL = arr => `[${arr.map(sub=>`[${sub.map(([n,s])=>`[${n},"${s}"]`).join(',')}]`).join(',')}]`;

  // Noms courts des inputs (≤15 chars avec suffixe X)
  // ans_rf1, ans_rc1, ans_rk1, ans_rg1  (rea: formul, charge, coef, groupe)
  // ans_pf1, ans_pc1, ans_pk1, ans_pg1  (pro: formul, charge, coef, groupe)
  // ans_raw, ans_arr (sans numéro — même interface que référence)
  const iRf =`ans_rf${X}`, iRc=`ans_rc${X}`, iRk=`ans_rk${X}`, iRg=`ans_rg${X}`;
  const iPf =`ans_pf${X}`, iPc=`ans_pc${X}`, iPk=`ans_pk${X}`, iPg=`ans_pg${X}`;
  const iRaw='ans_raw', iArr='ans_arr';

  // Refs JSXGraph
  const rRf=`rRf${X}`,rRc=`rRc${X}`,rRk=`rRk${X}`,rRg=`rRg${X}`;
  const rPf=`rPf${X}`,rPc=`rPc${X}`,rPk=`rPk${X}`,rPg=`rPg${X}`;
  const rRaw=`rRaw${X}`, rArr=`rArr${X}`;

  // Variables Maxima (noms courts)
  // tans${X} n'est PAS utilisé dans le PRT (comparaisons faites sur trf/trc/trk/trg/
  // tpf/... calculés côté JS) : il ne sert qu'à remplir ans_raw${X} quand l'enseignant/
  // Moodle clique "Remplir avec les bonnes réponses". On y met donc le HTML réel de
  // l'éditeur (avec vrais tags <sub>/<sup>), pas le latex aplati : le widget fait
  // editor.innerHTML = rawEl.value au chargement (ligne kbdRaw ~632), donc si on y met
  // le latex aplati ("H2O", "_{...}"/"^{...}" en texte brut), l'indice/exposant ne
  // s'affiche plus et l'enseignant doit tout refaire manuellement.
  const tansHtml = editorHTML.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  const vars=`/* Q${X} équation chimique (${bareme}pt) */
tans${X}:"${tansHtml}";
tarr${X}:"${arrow}";
tarrn${X}:${arrow==='->'?1:arrow==='<=>'?2:arrow==='<->'?3:0};
trf${X}:${toMLL(r.mols)};
trk${X}:[${r.co.join(',')}];
trc${X}:[${r.ch.join(',')}];
trg${X}:[${r.fcts.map(f=>JSON.stringify(f)).join(',')}];
tpf${X}:${toMLL(p.mols)};
tpk${X}:[${p.co.join(',')}];
tpc${X}:[${p.ch.join(',')}];
tpg${X}:[${p.fcts.map(f=>JSON.stringify(f)).join(',')}];
has_rg${X}:is(length(trg${X})>0);
has_pg${X}:is(length(tpg${X})>0);`;

  // JSXGraph — le JS brut (kbdRaw) n'est PAS inliné dans textFrag : stripMathDivs/
  // moodleLatex (js/app.js) fait un aller-retour DOM (div.innerHTML=html puis relecture)
  // qui échappe tout ">" en texte en "&gt;" (règle WHATWG de sérialisation des fragments
  // HTML). Inliné directement, ce JS brut — bourré de vrais ">" (comparateurs, la chaîne
  // ' -> ' du bouton Flèche, etc.) — ressortait corrompu, d'où le bug historique
  // "-&gt;" affiché à l'élève au lieu de "->" alors que le code source dit bien "->".
  // Fix : suivre la même convention que gen-imgclick.js/gen-jxgdrop.js — ne laisser que
  // les tags [[jsxgraph]]/[[/jsxgraph]] et le marqueur <!--HS-KBD:X--> dans textFrag,
  // et restituer le vrai JS via q.kbdRaw après coup (js/app.js ~L300, jamais touché par
  // stripMathDivs).
  const jsxOpen=`[[jsxgraph width="600px" height="300px" input-ref-${iRf}="${rRf}" input-ref-${iRc}="${rRc}" input-ref-${iRk}="${rRk}" input-ref-${iRg}="${rRg}" input-ref-${iPf}="${rPf}" input-ref-${iPc}="${rPc}" input-ref-${iPk}="${rPk}" input-ref-${iPg}="${rPg}" input-ref-${iRaw}="${rRaw}" input-ref-${iArr}="${rArr}"]]`;
  const kbdRaw=`
var FG = ["CONH2","COOR","COOH","COO","CHO","CH3","C2H5","OH","NH2","NO2"];
function parseStructure(molStr) {
  var components = [], detected = [];
  var clean = molStr.replace(/-/g,'').replace(/\\^\\{([^}]+)\\}/g,'');
  var hasC = /(^|[^a-z])C([^a-z]|$)/.test(clean);
  var i = 0;
  while (i !== FG.length) {
    var g = FG[i]; var reg = new RegExp(g + '(?:_\\\\{([^}]+)\\\\}|_([a-zA-Z0-9]+))?','g'); var m;
    while ((m = reg.exec(clean)) !== null) {
      if (g === "OH") { if (!hasC) { break; } }
      var gName = (g === "CO2") ? "COO" : g; detected.push(gName);
      var count = m[1] ? m[1] : (m[2] ? m[2] : "1");
      components.push([isNaN(count) ? count : Number(count), gName]);
      var sp = ''; var si = 0;
      while (si !== m[0].length) { sp += ' '; si++; }
      clean = clean.substring(0, m.index) + sp + clean.substring(m.index + m[0].length);
    }
    i++;
  }
  var atomReg = /([A-Z][a-z]?)(?:_\\{([^}]+)\\}|_([a-zA-Z0-9]+))?/g; var am;
  while ((am = atomReg.exec(clean)) !== null) {
    var cnt = am[2] ? am[2] : (am[3] ? am[3] : "1");
    components.push([isNaN(cnt) ? cnt : Number(cnt), am[1]]);
  }
  var uniq = []; var j = 0;
  while (j !== detected.length) { var found = false; var k = 0; while (k !== uniq.length) { if (uniq[k] === detected[j]) { found = true; } k++; } if (!found) { uniq.push(detected[j]); } j++; }
  return { components: components, detected: uniq };
}
function processSide(sideStr) {
  var mols = [], charges = [], fcts = [], coeffs = [];
  if (!sideStr) { return { mols: mols, charges: charges, fcts: fcts, coeffs: coeffs }; }
  var blocs = sideStr.split(/\\s*\\+\\s*(?![^{]*\\})/); var b = 0;
  while (b !== blocs.length) {
    var bloc = blocs[b].trim(); var match = bloc.match(/^(\\d+)?\\s*(.+)$/);
    if (match) {
      coeffs.push(match[1] ? parseInt(match[1]) : 1);
      var mol = match[2]; var cMatch = mol.match(/\\^\\{([^}]+)\\}/); var cv = 0;
      if (cMatch) { var c = cMatch[1].trim(); if (c === "+" || c === "1+") { cv = 1; } else if (c === "-" || c === "1-") { cv = -1; } else { cv = parseInt(c) * (c.indexOf('-') !== -1 ? -1 : 1); } }
      charges.push(cv);
      var s = parseStructure(mol); mols.push(s.components);
      var f = 0; while (f !== s.detected.length) { var already = false; var g2 = 0; while (g2 !== fcts.length) { if (fcts[g2] === s.detected[f]) { already = true; } g2++; } if (!already) { fcts.push(s.detected[f]); } f++; }
    }
    b++;
  }
  return { mols: mols, charges: charges, fcts: fcts, coeffs: coeffs };
}
function setRef(ref, value) { var el = document.getElementById(ref); if (el) { el.value = value; el.dispatchEvent(new Event('change')); } }
function htmlToLatex(html) {
  var div = document.createElement('div'); div.innerHTML = html;
  function convert(node) { var res = ''; var children = node.childNodes; var i = 0; while (i !== children.length) { var child = children[i]; if (child.nodeType === 3) { res += child.textContent; } else if (child.nodeName === 'SUB') { res += '_{' + convert(child) + '}'; } else if (child.nodeName === 'SUP') { res += '^{' + convert(child) + '}'; } else { res += convert(child); } i++; } return res; }
  return convert(div).replace(/\\u00a0/g, ' ').trim();
}
function htmlToPlain(html) { var div = document.createElement('div'); div.innerHTML = html; return (div.textContent || div.innerText || '').replace(/\\u00a0/g,' ').trim(); }

var styleEl = document.createElement('style');
styleEl.textContent = '#jxgbox sub{color:#e67e22;font-size:0.72em;} #jxgbox sup{color:#2980b9;font-size:0.72em;} .btn-active{outline:3px solid #f1c40f !important;box-shadow:inset 0 0 0 2px #fff;}';
document.head.appendChild(styleEl);
var box = document.getElementById('jxgbox');
box.style.cssText = 'border:none;background:#f5f6fa;padding:12px;border-radius:8px;height:auto;font-family:sans-serif;';
box.innerHTML = '';
var editor = document.createElement('div'); editor.setAttribute('contenteditable','true'); editor.setAttribute('spellcheck','false');
editor.style.cssText = 'width:100%;min-height:55px;padding:12px 15px;font-size:1.3rem;border:2px solid #34495e;border-radius:8px;background:#fff;box-sizing:border-box;line-height:1.7;outline:none;margin-bottom:8px;';
var toolbar = document.createElement('div'); toolbar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;';
var savedSel = null; var modeActive = 'none'; var modeNode = null;
editor.addEventListener('blur', function() { var sel = window.getSelection(); if (sel.rangeCount) { savedSel = sel.getRangeAt(0).cloneRange(); } });
function restoreSel() { editor.focus(); var sel = window.getSelection(); if (sel.rangeCount) { var range = sel.getRangeAt(0); if (!range.collapsed) { if (editor.contains(range.commonAncestorContainer)) { return; } } } if (savedSel) { sel.removeAllRanges(); sel.addRange(savedSel); } }
var btnSub = null; var btnSup = null;
function updateBtnStates() { if (!btnSub) { return; } if (modeActive === 'sub') { btnSub.classList.add('btn-active'); } else { btnSub.classList.remove('btn-active'); } if (modeActive === 'sup') { btnSup.classList.add('btn-active'); } else { btnSup.classList.remove('btn-active'); } }
// endMode : sort du mode indice/exposant. Le noeud <sub>/<sup> a ete cree des
// l'activation (voir startMode) : si rien n'a ete tape dedans on le supprime,
// sinon on repositionne le caret juste APRES lui - sans quoi le caret reste
// visuellement/logiquement a l'interieur du noeud et le navigateur continue
// d'inserer les frappes suivantes en indice/exposant meme apres avoir "desactive"
// le mode (bug remonte : deselectionner Exposant ne revenait pas en mode normal).
function endMode() {
  if (modeNode) {
    var range = document.createRange();
    if (modeNode.textContent === '') {
      var parent = modeNode.parentNode;
      if (parent) {
        range.setStartBefore(modeNode);
        range.collapse(true);
        parent.removeChild(modeNode);
      }
    } else {
      range.setStartAfter(modeNode);
      range.collapse(true);
    }
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  }
  modeActive = 'none'; modeNode = null; updateBtnStates();
  editor.focus();
}
// startMode : active le mode et cree tout de suite le noeud <sub>/<sup> (comme une
// parenthese ouvrante), caret place dedans - insertModeChar n'a alors qu'a inserer
// le texte, endMode ferme la "parenthese" (ou l'efface si rien n'a ete tape).
function startMode(kind, tag) {
  restoreSel();
  var sel = window.getSelection(); if (!sel.rangeCount) { editor.focus(); return; }
  var range = sel.getRangeAt(0); range.deleteContents();
  modeNode = document.createElement(tag);
  range.insertNode(modeNode);
  var r2 = document.createRange();
  r2.setStart(modeNode, 0); r2.collapse(true);
  sel.removeAllRanges(); sel.addRange(r2);
  modeActive = kind; updateBtnStates();
  editor.focus();
}
// activateSub/activateSup : deux flux distincts.
// 1) Vraie selection (texte tape puis surligne) -> execCommand direct, fiable
//    nativement sur une plage non vide (flux deja confirme fonctionnel).
// 2) Caret seul (bouton clique puis on tape) -> execCommand('subscript'/'superscript')
//    sur une selection VIDE ne "colle" pas de facon fiable a la frappe suivante
//    (confirme casse en usage reel pour '+'/'-' de charge ionique, meme apres un
//    premier correctif base sur execCommand+setTimeout). On bascule alors dans un
//    mode manuel (modeActive/modeNode) : chaque caractere tape est explicitement
//    insere dans un vrai noeud <sub>/<sup> cree a la main (insertModeChar), sans
//    dependre du comportement de execCommand sur une selection vide.
function activateSub() {
  restoreSel();
  var sel = window.getSelection();
  if (sel.rangeCount && !sel.getRangeAt(0).collapsed) { document.execCommand('subscript', false, null); if (modeActive !== 'none') { endMode(); } editor.focus(); editor.dispatchEvent(new Event('input')); return; }
  if (modeActive === 'sub') { endMode(); editor.dispatchEvent(new Event('input')); return; }
  if (modeActive === 'sup') { endMode(); }
  startMode('sub', 'sub');
}
function activateSup() {
  restoreSel();
  var sel = window.getSelection();
  if (sel.rangeCount && !sel.getRangeAt(0).collapsed) { document.execCommand('superscript', false, null); if (modeActive !== 'none') { endMode(); } editor.focus(); editor.dispatchEvent(new Event('input')); return; }
  if (modeActive === 'sup') { endMode(); editor.dispatchEvent(new Event('input')); return; }
  if (modeActive === 'sub') { endMode(); }
  startMode('sup', 'sup');
}
function makeBtn(html, fn, color) { var b = document.createElement('button'); b.type = 'button'; b.innerHTML = html; b.style.cssText = 'padding:5px 11px;cursor:pointer;background:' + (color ? color : '#34495e') + ';color:#fff;border:2px solid transparent;border-radius:4px;font-weight:bold;font-size:0.9rem;line-height:1.4;'; b.addEventListener('mousedown', function(e) { e.preventDefault(); var sel = window.getSelection(); if (sel.rangeCount) { savedSel = sel.getRangeAt(0).cloneRange(); } fn(); }); return b; }
function insertPlainText(text) { restoreSel(); var sel = window.getSelection(); if (sel.rangeCount) { var range = sel.getRangeAt(0); range.deleteContents(); var node = document.createTextNode(text); range.insertNode(node); range.setStartAfter(node); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); } editor.dispatchEvent(new Event('input')); }
function insertModeChar(tag, ch) {
  restoreSel();
  var sel = window.getSelection(); if (!sel.rangeCount) { return; }
  var range = sel.getRangeAt(0); range.deleteContents();
  var useExisting = modeNode && modeNode.isConnected && range.collapsed && modeNode.contains(range.startContainer);
  if (!useExisting) { modeNode = document.createElement(tag); range.insertNode(modeNode); range = document.createRange(); range.setStart(modeNode, 0); range.collapse(true); }
  var t = document.createTextNode(ch); range.insertNode(t);
  range.setStartAfter(t); range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);
  editor.dispatchEvent(new Event('input'));
}
var sep = document.createElement('span'); sep.style.cssText = 'border-left:1px solid #aaa;height:22px;display:inline-block;margin:0 3px;';
btnSub = makeBtn('x<sub style="color:#e67e22;font-size:0.75em">2</sub> Indice', activateSub, '#34495e');
btnSup = makeBtn('x<sup style="color:#2980b9;font-size:0.75em">n</sup> Exposant', activateSup, '#34495e');
toolbar.appendChild(btnSub); toolbar.appendChild(btnSup); toolbar.appendChild(sep);
toolbar.appendChild(makeBtn('→ Total', function() { insertPlainText(' -> '); }, '#27ae60'));
toolbar.appendChild(makeBtn('⇌ Équilibre', function() { insertPlainText(' <=> '); }, '#27ae60'));
toolbar.appendChild(makeBtn('↔ Mésomérie', function() { insertPlainText(' <-> '); }, '#27ae60'));
editor.addEventListener('keydown', function(e) {
  var key = e.key; if (key.length !== 1) { return; }
  if (modeActive === 'sub') { if (/^\\d$/.test(key)) { e.preventDefault(); insertModeChar('sub', key); return; } endMode(); return; }
  if (modeActive === 'sup') { if (/^\\d$/.test(key) || key === '+' || key === '-') { e.preventDefault(); insertModeChar('sup', key); if (key === '+' || key === '-') { endMode(); } return; } endMode(); return; }
});
var latexBar = document.createElement('input'); latexBar.type = 'text'; latexBar.readOnly = true; latexBar.placeholder = 'LaTeX genere automatiquement...';
latexBar.style.cssText = 'width:100%;font-family:Consolas,monospace;padding:7px;background:#eee;border:1px solid #ccc;color:#555;box-sizing:border-box;border-radius:4px;font-size:0.85rem;margin-bottom:8px;';
var imgBox = document.createElement('div'); imgBox.style.cssText = 'padding:12px;background:#fff;border:1px solid #ddd;border-radius:6px;min-height:55px;text-align:center;';
var img = document.createElement('img'); img.style.cssText = 'max-height:65px;'; img.src = 'https://latex.codecogs.com/svg.image?\\\\ce{...}'; imgBox.appendChild(img);
box.appendChild(toolbar); box.appendChild(editor); box.appendChild(latexBar); box.appendChild(imgBox);
var rawEl = document.getElementById(${rRaw}); if (rawEl) { if (rawEl.value !== '') { editor.innerHTML = rawEl.value; } }
var debTimer = null;
function update() {
  var html = editor.innerHTML; setRef(${rRaw}, html);
  var latex = htmlToLatex(html); var plain = htmlToPlain(html); latexBar.value = latex;
  var arrow = 'none';
  if (latex.indexOf('<=>') !== -1) { arrow = '<=>'; } else if (latex.indexOf('<->') !== -1) { arrow = '<->'; } else if (latex.indexOf('->') !== -1) { arrow = '->'; }
  var arrowCode = arrow === '->' ? 1 : (arrow === '<=>' ? 2 : (arrow === '<->' ? 3 : 0));
  setRef(${rArr}, String(arrowCode));
  clearTimeout(debTimer);
  debTimer = setTimeout(function() { var display = plain.trim(); img.src = display ? 'https://latex.codecogs.com/svg.image?\\\\ce{' + encodeURIComponent(display) + '}' : 'https://latex.codecogs.com/svg.image?\\\\ce{...}'; }, 600);
  var sides = latex.split(/->|<=>|<->/);
  var r = processSide(sides[0] ? sides[0] : ''); var p = processSide(sides[1] ? sides[1] : '');
  setRef(${rRf}, JSON.stringify(r.mols)); setRef(${rRc}, JSON.stringify(r.charges));
  setRef(${rRk}, JSON.stringify(r.coeffs)); setRef(${rRg}, JSON.stringify(r.fcts));
  setRef(${rPf}, JSON.stringify(p.mols)); setRef(${rPc}, JSON.stringify(p.charges));
  setRef(${rPk}, JSON.stringify(p.coeffs)); setRef(${rPg}, JSON.stringify(p.fcts));
}
editor.addEventListener('input', update);
if (editor.innerHTML !== '') { update(); }`;

  // ── textFrag / previewFrag ────────────────────────
  const textFrag=`<div style="background:#53B57C;border-left:5px solid #2F855E;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
  <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N.t('tpl.chem_title')}</strong>
  <span style="background:#2F855E;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
</div>
<!-- ENONCE-START --><div style="margin-bottom:12px;">${text||''}</div><!-- ENONCE-END -->
${jsxOpen}
<!--HS-KBD:${X}-->
[[/jsxgraph]]

<div style="position:absolute;left:-9999px;">
[[input:${iRaw}]]  [[validation:${iRaw}]]
[[input:${iArr}]]  [[validation:${iArr}]]
[[input:${iRf}]]   [[validation:${iRf}]]
[[input:${iRc}]]   [[validation:${iRc}]]
[[input:${iRk}]]   [[validation:${iRk}]]
[[input:${iRg}]]   [[validation:${iRg}]]
[[input:${iPf}]]   [[validation:${iPf}]]
[[input:${iPc}]]   [[validation:${iPc}]]
[[input:${iPk}]]   [[validation:${iPk}]]
[[input:${iPg}]]   [[validation:${iPg}]]
</div>`;

  const previewFrag=`<div style="background:#53B57C;border-left:5px solid #2F855E;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
  <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} ${I18N.t('tpl.chem_title_preview')}</strong>
  <span style="background:#2F855E;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
</div>
<!-- ENONCE-START --><div>${text||''}</div><!-- ENONCE-END -->
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;text-align:center;font-size:1.2rem;">${editorHTML}</div>`;

  // ── Inputs XML ────────────────────────────────────
  const mkInp=(name,type,tans)=>`    <input>
      <name>${name}</name><type>${type}</type><tans>${tans}</tans>
      <boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>
      <syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords><allowwords></allowwords>
      <forbidfloat>1</forbidfloat><requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype><mustverify>0</mustverify>
      <showvalidation>0</showvalidation><options></options>
    </input>`;
  const inputXML=[
    mkInp(iRaw,  'string',   `tans${X}`),
    mkInp(iArr,  'algebraic','0'),
    mkInp(iRf,   'algebraic',`trf${X}`),
    mkInp(iRc,   'algebraic',`trc${X}`),
    mkInp(iRk,   'algebraic',`trk${X}`),
    mkInp(iRg,   'json',     `trg${X}`),
    mkInp(iPf,   'algebraic',`tpf${X}`),
    mkInp(iPc,   'algebraic',`tpc${X}`),
    mkInp(iPk,   'algebraic',`tpk${X}`),
    mkInp(iPg,   'json',     `tpg${X}`),
  ].join('\n');

  // ── feedbackvariables (logique de référence, noms courts) ──
  const fbVars=`/* Flèche — comparaison sur tarrn${X}/${iArr} (entiers 0..3), pas sur des
   chaines : STACK tronque les inputs type:'string' via
   stack_string_input::maxima_to_response_array (substr($v,1,-1)) — voir
   feedback_stack_maxima_gotchas — d'ou "Flèche incorrecte" meme avec la bonne flèche.
   fleche_el_disp/fleche_att_disp reconvertissent en texte uniquement pour l'affichage. */
fleche_att${X}: tarrn${X};
fleche_el${X}: ${iArr};
vf${X}: if (fleche_el${X} = fleche_att${X}) then 1 else 0;
fleche_el_disp${X}: if fleche_el${X}=1 then "->" else if fleche_el${X}=2 then "<=>" else if fleche_el${X}=3 then "<->" else "aucune";
fleche_att_disp${X}: if fleche_att${X}=1 then "->" else if fleche_att${X}=2 then "<=>" else if fleche_att${X}=3 then "<->" else "aucune";
/* Comptages */
nb_rt${X}: length(trf${X}); nb_rs${X}: length(${iRf});
nb_pt${X}: length(tpf${X}); nb_ps${X}: length(${iPf});
/* Charges */
sch_rt${X}: sum(trk${X}[i]*trc${X}[i],i,1,length(trk${X}));
sch_pt${X}: sum(tpk${X}[i]*tpc${X}[i],i,1,length(tpk${X}));
sch_rs${X}: if listp(${iRk}) and listp(${iRc}) and length(${iRk})=length(${iRc}) and length(${iRk})>0 then sum(${iRk}[i]*${iRc}[i],i,1,length(${iRk})) else 99;
sch_ps${X}: if listp(${iPk}) and listp(${iPc}) and length(${iPk})=length(${iPc}) and length(${iPk})>0 then sum(${iPk}[i]*${iPc}[i],i,1,length(${iPk})) else 99;
/* Coefficients */
vcs${X}: if (trk${X}=${iRk}) and (tpk${X}=${iPk}) then 1 else 0;
k${X}: if listp(${iRk}) and length(${iRk})>0 and ${iRk}[1]#0 and trk${X}[1]#0 then ${iRk}[1]/trk${X}[1] else 1;
vcp${X}: if listp(${iRk}) and listp(${iPk}) then is(k${X}*trk${X}=${iRk}) and is(k${X}*tpk${X}=${iPk}) else false;
/* Groupes fonctionnels */
lrg${X}: if listp(stackjson_parse(${iRg})) then stackjson_parse(${iRg}) else [];
lpg${X}: if listp(stackjson_parse(${iPg})) then stackjson_parse(${iPg}) else [];
set_rgt${X}: setify(trg${X}); set_rgs${X}: setify(lrg${X});
set_pgt${X}: setify(tpg${X}); set_pgs${X}: setify(lpg${X});
mq_rg${X}: listify(setdifference(set_rgt${X},set_rgs${X}));
mq_pg${X}: listify(setdifference(set_pgt${X},set_pgs${X}));
ok_rg${X}: length(mq_rg${X})=0; ok_pg${X}: length(mq_pg${X})=0;
ok_g${X}: if ok_rg${X} and ok_pg${X} then 1 else 0;
/* Formules sécurisées pour EqualComAss */
srf${X}: if listp(${iRf}) and length(${iRf})>0 and listp(${iRf}[1]) then sort(map(sort,${iRf})) else [];
spf${X}: if listp(${iPf}) and length(${iPf})>0 and listp(${iPf}[1]) then sort(map(sort,${iPf})) else [];
strf${X}: sort(map(sort,trf${X}));
stpf${X}: sort(map(sort,tpf${X}));`;

  // ── Nœuds PRT (logique référence, noms adaptés) ──
  const mkCanonNode=(n,desc,test,sans,tans,ts,tn,fs,fn,tfb,ffb,tm,fm)=>({
    name:String(n), description:desc, answertest:test, sans:sans, tans:tans,
    testoptions:(test==='EqualComAss'||test==='NumRelative')?'0':'', quiet:'0',
    truescoremode:tm||'+', truescore:String(ts), truepenalty:'', truenextnode:String(tn),
    trueanswernote:`prt${X}-${n}-T`, truefeedback:tfb,
    falsescoremode:fm||'-', falsescore:String(fs), falsepenalty:'', falsenextnode:String(fn),
    falseanswernote:`prt${X}-${n}-F`, falsefeedback:ffb
  });

  const fb=`<div style="padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;margin-bottom:10px;">`;
  const fe=`<div style="padding:12px;background:#F9B3A9;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:10px;">`;

  const canonicalNodes=[
    mkCanonNode(0,'Flèche','AlgEquiv',`vf${X}`,'1',0,1,0,1,
  `${fb}<strong>✅ Flèche correcte</strong> — Le type de flèche correspond bien à la nature de la réaction.</div>`,
  `${fe}<strong>✗ Flèche incorrecte</strong> — La flèche utilisée ({@fleche_el_disp${X}@}) ne correspond pas au type de réaction attendu ({@fleche_att_disp${X}@}).</div>`),
    mkCanonNode(1,'Réactifs','EqualComAss',`srf${X}`,`strf${X}`,0.20,2,0,-1,
  `${fb}<strong>✅ Réactifs corrects</strong> — Vous avez bien identifié les {@nb_rs${X}@} réactifs.</div>`,
  `${fe}<strong>✗ Réactifs incorrects</strong> — Vous avez écrit {@nb_rs${X}@} réactif(s), {@nb_rt${X}@} sont attendus.</div>`),
    mkCanonNode(2,'Produits','EqualComAss',`spf${X}`,`stpf${X}`,0.20,3,0,-1,
  `${fb}<strong>✅ Produits corrects</strong> — Vous avez bien identifié les {@nb_ps${X}@} produits.</div>`,
  `${fe}<strong>✗ Produits incorrects</strong> — Vous avez écrit {@nb_ps${X}@} produit(s), {@nb_pt${X}@} sont attendus.</div>`),
    mkCanonNode(3,'Conservation charges','NumRelative',`sch_rs${X}`,`sch_ps${X}`,0.20,4,0,-1,
  `${fb}<strong>✅ Conservation des charges</strong> — Les charges sont bien équilibrées ({@sch_rs${X}@}).</div>`,
  `${fe}<strong>✗ Non-conservation des charges</strong> — Réactifs : {@sch_rs${X}@}, Produits : {@sch_ps${X}@}.</div>`),
    mkCanonNode(4,'Valeur charge','NumRelative',`sch_rs${X}`,`sch_rt${X}`,0.20,5,0,5,
  `${fb}<strong>✅ Valeur de charge correcte</strong> — La charge globale ({@sch_rs${X}@}) est celle attendue.</div>`,
  `${fe}<strong>✗ Valeur de charge incorrecte</strong> — Obtenue : {@sch_rs${X}@}, attendue : {@sch_rt${X}@}.</div>`),
    mkCanonNode(5,'Stœchio exacte','NumRelative',`vcs${X}`,'1',0.20,7,0,6,
  `${fb}<strong>✅ Coefficients corrects</strong> — Les coefficients stœchiométriques sont parfaitement ajustés.</div>`,
  ``),
    mkCanonNode(6,'Stœchio multiple','NumRelative',`vcp${X}`,'true',0,7,0,-1,
  `${fb}<strong>✅ Coefficients proportionnels</strong> — Corrects mais multipliés par {@k${X}@}. Pensez à simplifier.</div>`,
  `${fe}<strong>✗ Coefficients incorrects</strong> — L'équation n'est pas correctement équilibrée.</div>`),
    mkCanonNode(7,'Groupes fonctionnels','AlgEquiv',`ok_g${X}`,'1',0,-1,0,-1,
  `${fb}<strong>✅ Groupes caractéristiques corrects</strong> — Tous les groupes requis ont été trouvés.</div>`,
  `${fe}<strong>✗ Groupes caractéristiques incorrects</strong> — [[if test="not ok_rg${X}"]]\u26a0\ufe0f Réactifs, il manque : <strong>{#mq_rg${X}#}</strong>[[/if]] [[if test="not ok_pg${X}"]]\u26a0\ufe0f Produits, il manque : <strong>{#mq_pg${X}#}</strong>[[/if]]</div>`)
  ];
  const prtMeta = { name:`prt${X}`, value:'1.0000000', autosimplify:'1', feedbackstyle:'2', feedbackvariables: fbVars };
  const prtXML = buildPrtXml(prtMeta, canonicalNodes);

  // Tous les feedbacks des 8 nœuds, sans doublon avec les boîtes Ok/Faux génériques
  // de _hsPrtBoxes (qui prend déjà : truefeedback du nœud 0 comme "Ok",
  // falsefeedback du dernier nœud comme "Faux"). Pour chaque nœud intermédiaire,
  // le vrai ET le faux sont montrés (ce sont 2 messages distincts, ex: nœuds 5/6
  // Stœchio exacte/multiple ont chacun leur propre texte de succès). Sans cette
  // liste, la moitié des feedbacks (dont "Flèche incorrecte") restait invisible
  // dans l'aperçu de l'onglet Config.
  const diagNodes = [];
  canonicalNodes.forEach((n, i) => {
    const isFirst = i === 0, isLast = i === canonicalNodes.length - 1;
    if (!isFirst && n.truefeedback) diagNodes.push({ desc: n.description + ' (succès)', fb: n.truefeedback });
    if (!isLast && n.falsefeedback) diagNodes.push({ desc: n.description + ' (échec)', fb: n.falsefeedback });
  });

  // Encart "réponse attendue" injecté directement dans generalFeedback (pas seulement
  // dans l'aperçu Config) : l'agrégation faite par js/app.js (generalFeedbackContent,
  // ligne ~287) ne reprend que q.generalFeedback / q.solution de chaque question — le
  // "🔑 Réponses attendues" que construit js/verif.js n'est produit que par l'outil de
  // relecture "Vérification" séparé (verifBuildInterface), jamais par l'export direct.
  // Sans ce bloc, une question chimique sans commentaire manuel exportait un
  // <generalfeedback> totalement vide.
  // Rendu via l'image CodeCogs \ce{} (mhchem), pas le HTML brut de l'éditeur : \ce{}
  // normalise automatiquement l'espacement autour de la flèche/des "+", contrairement
  // à un simple dump de editorHTML qui reproduit tel quel un espacement imparfait si
  // l'enseignant a tapé/collé sans espace après la flèche (ex: "->H3O+" au lieu de
  // "-> H3O+") — déjà la même technique que l'aperçu Config (_chemHtmlToLatexDisplay).
  const chemAnswerBox = `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
    <span style="font-weight:bold;color:#1e293b;">${I18N.t('tpl.chem_title')}</span>
    <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t('chem.answerbox_expected')}</span>
    <div style="margin-top:8px;text-align:center;"><img src="https://latex.codecogs.com/svg.image?\\ce{${encodeURIComponent(latex)}}" alt="${I18N.t('chem.answerbox_alt')}" style="max-height:60px;max-width:100%;"></div>
  </div>`;

  return {bareme, vars, qnote:editorPlain, textFrag, previewFrag, inputXML, prtXML, kbdRaw,
    prt: { meta: prtMeta, nodes: canonicalNodes }, diagNodes,
    generalFeedback: _mkFbGen(chemAnswerBox, v('chem-fbgen')), feedbackRef:`[[feedback:prt${X}]]`};
}

// ══════════════════════════════════════════════════════
//  ÉQUATION CHIMIQUE — ÉDITEUR (panneau Config, côté enseignant)
//  Miroir de htmlToLatex/htmlToPlain utilisés par genChemical() ci-dessus,
//  pour que l'aperçu affiché à l'enseignant pendant la saisie corresponde
//  exactement à ce que verra l'élève dans le XML exporté.
// ══════════════════════════════════════════════════════
var _chemMode = 'none';
var _chemModeNode = null;
var _chemSavedSel = null;
var _chemImgTimer = null;

function _chemEditor() { return document.getElementById('chem-editor-text'); }

// Verrouille la zone de saisie de l'équation (éditeur + boutons Indice/Exposant/
// Flèche/Équilibre/Mésomérie) tant que l'énoncé (chem-text) est vide — l'énoncé est
// obligatoire (voir validation dans genChemical) donc il n'y a aucune raison de
// laisser l'enseignant saisir l'équation avant de l'avoir rédigé.
function chemUpdateLock() {
  const editor = _chemEditor();
  const toolbar = document.querySelector('#fp-chemical .chem-toolbar');
  const hint = document.getElementById('chem-lock-hint');
  const hasText = !!(typeof richVal === 'function' && richVal('chem-text').trim());
  if (editor) {
    editor.setAttribute('contenteditable', hasText ? 'true' : 'false');
    editor.style.opacity = hasText ? '1' : '.5';
    editor.style.pointerEvents = hasText ? '' : 'none';
    editor.title = hasText ? '' : I18N.t('chem.tooltip_write_first');
  }
  if (toolbar) toolbar.querySelectorAll('button').forEach(b => { b.disabled = !hasText; });
  if (hint) hint.style.display = hasText ? 'none' : 'block';
}
document.addEventListener('DOMContentLoaded', function () {
  if (typeof chemUpdateLock === 'function') chemUpdateLock();
});

function _chemRestoreSel() {
  const editor = _chemEditor();
  if (!editor) return;
  editor.focus();
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    if (!range.collapsed && editor.contains(range.commonAncestorContainer)) return;
  }
  if (_chemSavedSel) { sel.removeAllRanges(); sel.addRange(_chemSavedSel); }
}

function _chemUpdateBtnStates() {
  const btnSub = document.getElementById('chem-btn-sub');
  const btnSup = document.getElementById('chem-btn-sup');
  if (btnSub) btnSub.classList.toggle('sub-mode', _chemMode === 'sub');
  if (btnSup) btnSup.classList.toggle('sup-mode', _chemMode === 'sup');
}

// _chemEndMode : sort du mode indice/exposant. Le nœud <sub>/<sup> a été créé dès
// l'activation (voir _chemStartMode) : si rien n'a été tapé dedans on le supprime,
// sinon on repositionne le caret juste APRÈS lui — sans quoi le caret reste
// logiquement à l'intérieur du nœud et la frappe suivante continue en indice/
// exposant même après avoir "désactivé" le mode (bug remonté : désélectionner
// Exposant ne revenait pas en mode normal).
function _chemEndMode() {
  const editor = _chemEditor();
  if (_chemModeNode) {
    const range = document.createRange();
    if (_chemModeNode.textContent === '') {
      const parent = _chemModeNode.parentNode;
      if (parent) {
        range.setStartBefore(_chemModeNode);
        range.collapse(true);
        parent.removeChild(_chemModeNode);
      }
    } else {
      range.setStartAfter(_chemModeNode);
      range.collapse(true);
    }
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  }
  _chemMode = 'none'; _chemModeNode = null; _chemUpdateBtnStates();
  if (editor) editor.focus();
}

// _chemStartMode : active le mode et crée tout de suite le nœud <sub>/<sup> (comme
// une parenthèse ouvrante), caret placé dedans — _chemInsertModeChar n'a alors qu'à
// insérer le texte, _chemEndMode ferme la "parenthèse" (ou l'efface si rien n'a été
// tapé).
function _chemStartMode(kind, tag) {
  _chemRestoreSel();
  const editor = _chemEditor();
  const sel = window.getSelection(); if (!sel.rangeCount) { if (editor) editor.focus(); return; }
  let range = sel.getRangeAt(0); range.deleteContents();
  _chemModeNode = document.createElement(tag);
  range.insertNode(_chemModeNode);
  const r2 = document.createRange();
  r2.setStart(_chemModeNode, 0); r2.collapse(true);
  sel.removeAllRanges(); sel.addRange(r2);
  _chemMode = kind; _chemUpdateBtnStates();
  if (editor) editor.focus();
}

// chemToggleSub/chemToggleSup : deux flux distincts (miroir du widget exporté,
// voir kbdRaw dans genChemical() : execCommand sur une vraie sélection est fiable,
// mais execCommand sur une sélection vide ("clic bouton puis on tape") ne colle pas
// de façon fiable à la frappe suivante — bug confirmé en usage réel sur '+'/'-' de
// charge ionique. On bascule alors dans un mode manuel : chaque caractère tapé est
// explicitement inséré dans un vrai nœud <sub>/<sup> créé à la main (voir
// _chemInsertModeChar dans _chemWireEditor), sans dépendre de execCommand.
function chemToggleSub() {
  _chemRestoreSel();
  const sel = window.getSelection();
  if (sel.rangeCount && !sel.getRangeAt(0).collapsed) { document.execCommand('subscript', false, null); if (_chemMode !== 'none') { _chemEndMode(); } const ed=_chemEditor(); if(ed){ed.focus();ed.dispatchEvent(new Event('input',{bubbles:true}));} return; }
  if (_chemMode === 'sub') { _chemEndMode(); const ed=_chemEditor(); if(ed) ed.dispatchEvent(new Event('input',{bubbles:true})); return; }
  if (_chemMode === 'sup') { _chemEndMode(); }
  _chemStartMode('sub', 'sub');
}

function chemToggleSup() {
  _chemRestoreSel();
  const sel = window.getSelection();
  if (sel.rangeCount && !sel.getRangeAt(0).collapsed) { document.execCommand('superscript', false, null); if (_chemMode !== 'none') { _chemEndMode(); } const ed=_chemEditor(); if(ed){ed.focus();ed.dispatchEvent(new Event('input',{bubbles:true}));} return; }
  if (_chemMode === 'sup') { _chemEndMode(); const ed=_chemEditor(); if(ed) ed.dispatchEvent(new Event('input',{bubbles:true})); return; }
  if (_chemMode === 'sub') { _chemEndMode(); }
  _chemStartMode('sup', 'sup');
}

function _chemInsertPlainText(text) {
  _chemRestoreSel();
  const editor = _chemEditor();
  if (!editor) return;
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
  } else {
    editor.appendChild(document.createTextNode(text));
  }
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function chemInsert(text) { _chemInsertPlainText(text); }

function _chemInsertModeChar(tag, ch) {
  _chemRestoreSel();
  const editor = _chemEditor();
  if (!editor) return;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  let range = sel.getRangeAt(0);
  range.deleteContents();
  const useExisting = _chemModeNode && _chemModeNode.isConnected && range.collapsed && _chemModeNode.contains(range.startContainer);
  if (!useExisting) {
    _chemModeNode = document.createElement(tag);
    range.insertNode(_chemModeNode);
    range = document.createRange();
    range.setStart(_chemModeNode, 0); range.collapse(true);
  }
  const t = document.createTextNode(ch);
  range.insertNode(t);
  range.setStartAfter(t); range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function _chemWireEditor(editor) {
  if (editor.__chemWired) return;
  editor.__chemWired = true;
  editor.addEventListener('blur', function () {
    const sel = window.getSelection();
    if (sel.rangeCount) _chemSavedSel = sel.getRangeAt(0).cloneRange();
  });
  editor.addEventListener('keydown', function (e) {
    const key = e.key;
    if (key.length !== 1) return;
    if (_chemMode === 'sub') {
      if (/^\d$/.test(key)) { e.preventDefault(); _chemInsertModeChar('sub', key); return; }
      _chemEndMode();
      return;
    }
    if (_chemMode === 'sup') {
      if (/^\d$/.test(key) || key === '+' || key === '-') {
        e.preventDefault(); _chemInsertModeChar('sup', key);
        if (key === '+' || key === '-') { _chemEndMode(); }
        return;
      }
      _chemEndMode();
    }
  });
}

// Copie de htmlToPlain définie dans genChemical() ci-dessus (dupliquée ici
// volontairement : l'une tourne au moment de l'export XML, l'autre en continu
// pendant la saisie — même logique, contextes d'exécution différents).
function _chemHtmlToPlain(html) {
  const div = document.createElement('div'); div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/ /g, ' ').trim();
}

// Miroir de htmlToLatex() du widget embarqué dans le XML exporté (SUB -> _{...},
// SUP -> ^{...}) : nécessaire pour que \ce{} (mhchem) rende les exposants (charges
// ioniques). _chemHtmlToPlain() aplatit tout en texte brut et perd cette distinction
// -> exposants absents de l'aperçu Config alors que corrects dans Feedback général
// (qui réutilise editorHTML brut via previewFrag, jamais aplati).
function _chemHtmlToLatexDisplay(html) {
  const div = document.createElement('div'); div.innerHTML = html;
  function cv(n) {
    let r = '';
    for (const c of n.childNodes) {
      if (c.nodeType === 3) r += c.textContent;
      else if (c.nodeName === 'SUB') r += '_{' + cv(c) + '}';
      else if (c.nodeName === 'SUP') r += '^{' + cv(c) + '}';
      else r += cv(c);
    }
    return r;
  }
  return cv(div).trim();
}

function chemOnInput() {
  const editor = _chemEditor();
  const out = document.getElementById('chem-render-output');
  if (!editor || !out) return;
  _chemWireEditor(editor);
  const plain = _chemHtmlToPlain(editor.innerHTML);
  clearTimeout(_chemImgTimer);
  if (!plain) { out.innerHTML = '<p style="color:#94a3b8;font-style:italic;">' + I18N.t('chem.preview_placeholder') + '</p>'; return; }
  const display = _chemHtmlToLatexDisplay(editor.innerHTML);
  _chemImgTimer = setTimeout(function () {
    out.innerHTML = `<img src="https://latex.codecogs.com/svg.image?\\ce{${encodeURIComponent(display)}}" alt="${I18N.t('chem.answerbox_alt')}" style="max-height:70px;max-width:100%;">`;
  }, 500);
}

function chemParseAndPreview() {
  const editor = _chemEditor();
  if (editor) { _chemWireEditor(editor); chemOnInput(); }
  if (typeof chemRefreshPreview === 'function') chemRefreshPreview();
}

(function () {
  function _chemInit() {
    const editor = _chemEditor();
    if (editor) { _chemWireEditor(editor); chemOnInput(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _chemInit);
  else _chemInit();
})();

// ── JSME modal (teacher panel) ────────────────────────────────────────────
var _jsmeGenApplet = null;

function topoOpenJsme() {
  var modal = document.getElementById('jsme_generator_modal');
  modal.style.display = 'flex';
  if (typeof FocusTrap !== 'undefined') FocusTrap.trap(modal, topoCloseJsme);
  if (_jsmeGenApplet) {
    try { _jsmeGenApplet.reset(); return; } catch(e) { _jsmeGenApplet = null; }
  }
  function _labelJsmeIframe() {
    var container = document.getElementById('jsme_gen_container');
    if (!container) return;
    var f = container.querySelector('iframe');
    if (f && !f.title) f.title = I18N.t('topo.jsme_iframe_title');
  }
  function _watchJsmeIframe() {
    var container = document.getElementById('jsme_gen_container');
    if (!container) return;
    var obs = new MutationObserver(function() { _labelJsmeIframe(); });
    obs.observe(container, { childList: true, subtree: true });
    setTimeout(function(){ obs.disconnect(); }, 5000);
  }
  function _initJsme() {
    _watchJsmeIframe();
    if (typeof JSApplet !== 'undefined') {
      try { _jsmeGenApplet = new JSApplet.JSME('jsme_gen_container', '460px', '340px', {options: 'query,hydrogens'}); } catch(e) {}
    } else {
      var t = setInterval(function() {
        if (typeof JSApplet !== 'undefined') {
          clearInterval(t);
          try { _jsmeGenApplet = new JSApplet.JSME('jsme_gen_container', '460px', '340px', {options: 'query,hydrogens'}); } catch(e) {}
        }
      }, 200);
    }
  }
  _initJsme();
}

function topoInsertSmiles() {
  if (!_jsmeGenApplet) return;
  var smi = _jsmeGenApplet.smiles();
  if (smi) {
    var ed = document.getElementById('topo-editor');
    ed.focus();
    var sel = window.getSelection();
    if (sel && sel.rangeCount && ed.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      var range = sel.getRangeAt(0);
      range.deleteContents();
      var node = document.createTextNode(' ' + smi);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      ed.innerText = (ed.innerText + ' ' + smi).trim();
    }
    ed.dispatchEvent(new Event('input', {bubbles: true}));
  }
  topoCloseJsme();
}

function topoCloseJsme() {
  document.getElementById('jsme_generator_modal').style.display = 'none';
  if (typeof FocusTrap !== 'undefined') FocusTrap.release();
}
