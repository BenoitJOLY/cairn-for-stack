/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// ── XML GENERATORS: checkbox ──

// Lecture DOM → shape attendue par genCheckboxCore(). Extraite de genCheckbox()
// pour être réutilisée par l'aperçu réel (preview-checkbox.js), qui a besoin des
// mêmes paramètres pour construire un XML autonome sans dupliquer cette lecture.
function _cbReadFormParams(){
  const rows=document.querySelectorAll('#cb-props .prop-row');
  if(!rows.length)throw new Error(I18N.t('msg.err_props_vide'));
  return {
    bareme: parseFloat(v('cb-bareme'))||1,
    text: richVal('cb-text'),
    Xe: v('cb-xe'), mXb: v('cb-mode-xb'), Xb: v('cb-xb'),
    props: Array.prototype.map.call(rows, r => ({
      bool: r.querySelector('.p-bool').value,
      text: r.querySelector('.p-text').value,
      fb: r.querySelector('.p-fb').value,
      fb2: r.querySelector('.p-fb2')?.value || ''
    })),
    showOubli: document.getElementById('cb-show-oubli')?.checked||false,
    cbFbGen: resolveFb('cb-fbgen', ''),
    cbFbGenShowFb: document.getElementById('cb-fbgen-showfb')?.checked || false
  };
}

async function genCheckbox(X){
 if(!validateCBDraw()){throw new Error(I18N.t('msg.err_tirage_cb'));}
  const p=_cbReadFormParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'checkbox', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "checkbox", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "checkbox", repli sur le calcul local.', e); }
  return genCheckboxCore(X, p);
}

/* genCheckboxCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour le
   pattern (deps injectables pour les tests Node — test/unit/gen-checkbox.test.js). */
function genCheckboxCore(X, p, deps){
  deps = deps || {};
  const I18N_D = deps.I18N || I18N;
  const buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  const escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;

  const bareme = p.bareme, text = p.text;
  const Xe = p.Xe, mXb = p.mXb, Xb = p.Xb;
  const showOubli = p.showOubli;
  const cbFbGen = p.cbFbGen, cbFbGenShowFb = p.cbFbGenShowFb;
  let taAll=[],fbAll=[],fbOubliAll=[];
  p.props.forEach((r,i)=>{const id=String(i+1),b=r.bool;taAll.push(`["${id}",${b},"${escapeMaximaString_D(r.text)}"]`);fbAll.push(`["${id}","${escapeMaximaString_D(r.fb)}"]`);fbOubliAll.push(`["${id}","${escapeMaximaString_D(r.fb2)}"]`);});
  // mXb==='fixe' : le nombre de bonnes réponses cochées est figé à Xb (borné à ce qui
  // est réellement disponible) — avant ce correctif, `nbV` ignorait totalement Xb/mXb
  // et restait toujours aléatoire, rendant le mode "fixe" sans aucun effet.
  const nbVExpr=mXb==='alea'?`rand(min(length(listV${X}), ${Xe}-1)) + 1`:`max(1,min(${Xb},min(length(listV${X}),${Xe}-1)))`;

  const oubliVar=showOubli?`\nfb_oubli${X}:[${fbOubliAll.join(',')}];`:'';

  // 3) textes_vrais dans les variables
  const vars=`/* Q${X} : Cases à cocher (${bareme}pt) */
ta${X}_all:[${taAll.join(',')}];
listV${X}:sublist(ta${X}_all,lambda([ex],second(ex)=true));
listF${X}:sublist(ta${X}_all,lambda([ex],second(ex)=false));
nbV${X}:${nbVExpr};
nbF${X}:min(length(listF${X}),${Xe} - nbV${X});
ta${X}:random_permutation(append(rand_selection(listV${X},nbV${X}),rand_selection(listF${X},nbF${X})));
fb${X}:[${fbAll.join(',')}];${oubliVar}
/* Liste HTML des propositions vraies avec puces */
textes_vrais${X}: sconcat("<ul style='margin:4px 0 0 0;padding-left:1.4em;'>", simplode(map(lambda([ex], ${cbFbGenShowFb ? `sconcat("<li>", third(ex), "<br/><span style='color:#4b5563;font-size:.92em;'>", assoc(first(ex),fb${X}), "</span></li>")` : `sconcat("<li>", third(ex), "</li>")`}), sublist(ta${X},lambda([ex],second(ex)=true))), ""), "</ul>");`;

  const oubliVars=showOubli?`\n/* Feedback des vraies NON cochées */\nmanques${X}:listify(setdifference(setify(bons${X}), setify(idx${X})));\nfbl_oubli${X}: if length(manques${X})>0 then makelist(block([id,lab,ft],id:manques${X}[n],lab:assoc(id,map(lambda([x],[x[1],x[3]]),ta${X}_all)),ft:assoc(id,fb_oubli${X}),sconcat("<div style='color:#92400e;background:#fffbeb;border-left:4px solid #f59e0b;padding:7px;margin:3px 0'><b>&#9888;&#65039; ${I18N_D.t('tpl.checkbox_oubli_label')} : </b>",lab,"<br/>",ft,"</div>")),n,1,length(manques${X})) else [];`:'';

  const fbVars=`idx${X}:flatten([ans${X}]);bons${X}:map(first,sublist(ta${X},lambda([ex],second(ex)=true)));nv${X}:cardinality(intersection(setify(idx${X}),setify(bons${X})));nf${X}:cardinality(intersection(setify(idx${X}),setify(map(first,sublist(ta${X},lambda([ex],second(ex)=false))))));den${X}:length(bons${X});sc${X}:if den${X}>0 then max(0,float((nv${X}-nf${X})/den${X})) else 0;pct${X}:floor(sc${X}*100);fbl${X}:makelist(block([id,lab,ok,ft,col],id:idx${X}[n],lab:assoc(id,map(lambda([x],[x[1],x[3]]),ta${X}_all)),ok:assoc(id,map(lambda([x],[x[1],x[2]]),ta${X}_all)),ft:assoc(id,fb${X}),col:if ok=true then "green" else "red",sconcat("<div style='color:",col,";border-left:4px solid ",col,";padding:7px;margin:3px 0'><b>",lab,"</b><br/>",ft,"</div>")),n,1,length(idx${X}));all_correct${X}:is(nv${X}=den${X} and nf${X}=0);has_bon${X}:is(nv${X}>0);${oubliVars}`;

  const qnote=`{@map(first,ta${X})@}`;

  const prtMeta={name:`prt${X}`, value:'1.0000000', autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbVars};
  const canonicalNodes=[
    {
      name:'0', description:I18N_D.t('tpl.checkbox_desc_node0'), answertest:'AlgEquiv',
      sans:`all_correct${X}`, tans:'true', testoptions:'', quiet:'0',
      truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
      trueanswernote:`PRT-${X}-1-T`,
      truefeedback:`<div style="padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac"><strong>✅ ${I18N_D.t('tpl.checkbox_score')} : 100%</strong>[[foreach item="fbl${X}"]]{@item@}[[/foreach]]</div>`,
      falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'1',
      falseanswernote:`PRT-${X}-1-F`, falsefeedback:''
    },
    {
      name:'1', description:I18N_D.t('tpl.checkbox_desc_node1'), answertest:'AlgEquiv',
      sans:`has_bon${X}`, tans:'true', testoptions:'', quiet:'0',
      truescoremode:'=', truescore:`sc${X}`, truepenalty:'', truenextnode:'-1',
      trueanswernote:`PRT-${X}-2-T`,
      truefeedback:`<div style="padding:12px;background:#F9F2BB;border-radius:8px;border:1px solid #EDB465">🔶 <strong>${I18N_D.t('tpl.checkbox_score')} : {@pct${X}@}%</strong>[[foreach item="fbl${X}"]]{@item@}[[/foreach]]${showOubli?`[[if test="manques${X} # []"]]<div style="padding:10px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-top:8px;"><strong style="color:#92400e;">${I18N_D.t('tpl.checkbox_oublis_titre')}</strong>[[foreach item="fbl_oubli${X}"]]{@item@}[[/foreach]]</div>[[/if]]`:''}</div>`,
      falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:`PRT-${X}-2-F`,
      falsefeedback:`<div style="padding:12px;background:#F9B3A9;border-radius:8px;border:1px solid #e2e8f0">${I18N_D.t('tpl.checkbox_aucune_bonne')}</div>`
    }
  ];
  const prtXML=buildPrtXml_D(prtMeta, canonicalNodes);

  return{bareme,vars,qnote,
    textFrag: `<div style="background:#7c3aed;border-left:5px solid #4c1d95;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tpl.checkbox_banniere')}</strong>
        <span style="background:#4c1d95;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#4c1d95;border:1px solid #4c1d95;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('tpl.checkbox_plusieurs_choix')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      <p>[[input:ans${X}]] [[validation:ans${X}]]</p>`,
    inputXML:`    <input>
      <name>ans${X}</name>
      <type>checkbox</type>
      <tans>ta${X}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
    prtXML,
  generalFeedback: `<p><strong>${I18N_D.t('tpl.checkbox_bonnes_reponses')}</strong> {@textes_vrais${X}@}</p>${cbFbGen ? `<p>${cbFbGen}</p>` : ''}`,
  feedbackRef:`[[feedback:prt${X}]]`,prt:{meta:prtMeta,nodes:canonicalNodes}};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genCheckbox: genCheckbox, genCheckboxCore: genCheckboxCore };
}
