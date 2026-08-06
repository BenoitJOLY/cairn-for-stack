// ── XML GENERATORS: mots croisés ──

async function genCrossword(X){
    if(!Array.isArray(currentPlacedWords)) currentPlacedWords = [...currentPlacedWords];
    if(!currentGridData || currentPlacedWords.length === 0) throw new Error(I18N.t('msg.err_cw_grille'));
    const p = {
        bareme: parseFloat(v('cw-bareme'))||1,
        placedWords: currentPlacedWords,
        gridData: currentGridData,
        fbGen: v('cw-fbgen')
    };
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'crossword', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "crossword", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "crossword", repli sur le calcul local.', e); }
    return genCrosswordCore(X, p);
}

function genCrosswordCore(X, p, deps){
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var generateCWMaximaString_D = deps.generateCWMaximaString || generateCWMaximaString;
    var renderCWGridHTML_D = deps.renderCWGridHTML || renderCWGridHTML;
    var renderCWGridHTMLEmpty_D = deps.renderCWGridHTMLEmpty || renderCWGridHTMLEmpty;

    const bareme = p.bareme;
    const currentPlacedWords = p.placedWords;
    const currentGridData = p.gridData;

    // Variables Maxima
    let inputsXML = "";
    let questionVariables = "";
    let maximaAnswersList = [];
    let ansNamesList = [];
    let cellMap = {};

    // Boucle sur les mots placés
    currentPlacedWords.forEach((w, index) => {
        // On utilise un préfixe propre pour éviter les conflits avec d'autres questions (ex: cw1_1 au lieu de ans1)
        const varName = `cw${X}_${index + 1}`;
        w.varName = varName;
        
        inputsXML += `    <input>\n      <name>${varName}</name>\n      <type>string</type>\n      <tans>${varName}_ta</tans>\n      <boxsize>15</boxsize>\n      <strictsyntax>1</strictsyntax>\n      <mustverify>0</mustverify>\n      <showvalidation>0</showvalidation>\n    </input>\n`;
            
        questionVariables += `${varName}_ta: ${generateCWMaximaString_D(w.word)};\n`;
        maximaAnswersList.push(`${varName}_ta`);
        ansNamesList.push(varName);
            
        for (let i = 0; i < w.word.length; i++) {
            const cx = w.direction === 'H' ? w.x + i : w.x;
            const cy = w.direction === 'H' ? w.y : w.y + i;
            const key = `${cx},${cy}`;
            if (!cellMap[key]) cellMap[key] = [];
            cellMap[key].push({ input: w.varName, index: i });
        }
    });

    questionVariables += `all_ta: [${maximaAnswersList.join(',')}];\n`;

    // Fonction Levenshtein Maxima (adaptee de gen-string.js)
    questionVariables += `levenshtein(s,t) := block(
  [m,n,prev,curr,i,j,c],
  if stringp(s)=false then s:string(s),
  if stringp(t)=false then t:string(t),
  m:slength(s), n:slength(t),
  if m=0 then return(n),
  if n=0 then return(m),
  if m>30 or n>30 then return(100),
  prev:makelist(i,i,0,n),
  for i:1 thru m do (
    curr:[i],
    for j:1 thru n do (
      if charat(s,i)=charat(t,j) then c:0 else c:1,
      curr:endcons(min(prev[j+1]+1,curr[j]+1,prev[j]+c),curr)
    ),
    prev:curr
  ),
  last(prev)
)$\n`;

    // HTML de la grille
    let gridHTML = `<div id="cw-grid" style="display:inline-grid; gap:0; border:2px solid #4095AD; background:#4095AD; grid-template-columns:repeat(${currentGridData.maxX + 1}, 30px); grid-template-rows:repeat(${currentGridData.maxY + 1}, 30px); margin-bottom: 20px;">`;
    for (let y = 0; y <= currentGridData.maxY; y++) {
        for (let x = 0; x <= currentGridData.maxX; x++) {
            const key = `${x},${y}`;
            if (currentGridData.grid[key]) {
                const numHTML = currentGridData.grid[key].number ? `<span style="position:absolute;top:1px;left:2px;font-size:10px;color:black;font-weight:normal;">${currentGridData.grid[key].number}</span>` : '';
                gridHTML += `<div style="width:30px;height:30px;display:flex;justify-content:center;align-items:center;font-weight:bold;text-transform:uppercase;position:relative;background:white;border:1px solid #999;"><span id="cw-${x}-${y}"></span>${numHTML}</div>`;
            } else { gridHTML += `<div style="width:30px;height:30px;background:#4095AD;"></div>`; }
        }
    }
    gridHTML += `</div>`;

    // Script JS pour remplir la grille
    let jsQuestionScript = `
    <script>
        (function() {
            const cellMap = ${JSON.stringify(cellMap)};
            function updateGrid() {
                Object.keys(cellMap).forEach(coord => {
                    const parts = coord.split(','); const x = parts[0]; const y = parts[1];
                    const cellSpan = document.getElementById('cw-' + x + '-' + y);
                    if(cellSpan) {
                        let letterFound = '';
                        for (let i = 0; i < cellMap[coord].length; i++) {
                            const mapping = cellMap[coord][i];
                            const inputEl = document.querySelector('input[name$="' + mapping.input + '"]');
                            if(inputEl) { const val = inputEl.value || ''; if(val.charAt(mapping.index)) { letterFound = val.charAt(mapping.index).toUpperCase(); break; } }
                        }
                        cellSpan.textContent = letterFound;
                    }
                });
            }
            document.addEventListener('input', function(e) { if (e.target.tagName === 'INPUT' && e.target.name) updateGrid(); });
            setTimeout(updateGrid, 500);
        })();
    <\/script>`;

    // Définitions HTML
    let definitionsHTML = `<div style="margin-top: 20px;">`;
    const horizWords = currentPlacedWords.filter(w => w.direction === 'H').sort((a,b)=>a.number-b.number);
    const vertWords = currentPlacedWords.filter(w => w.direction === 'V').sort((a,b)=>a.number-b.number);

    if(horizWords.length > 0) {
        definitionsHTML += `<h4>${I18N_D.t('cw.horizontal')}</h4><ul style="list-style-type: none; padding-left: 0;">`;
        horizWords.forEach(w => { definitionsHTML += `<li style="margin-bottom: 10px;"><strong>${w.number}.</strong> ${w.def}<br>[[input:${w.varName}]] [[validation:${w.varName}]]</li>`; });
        definitionsHTML += `</ul>`;
    }
    if(vertWords.length > 0) {
        definitionsHTML += `<h4>${I18N_D.t('cw.vertical')}</h4><ul style="list-style-type: none; padding-left: 0;">`;
        vertWords.forEach(w => { definitionsHTML += `<li style="margin-bottom: 10px;"><strong>${w.number}.</strong> ${w.def}<br>[[input:${w.varName}]] [[validation:${w.varName}]]</li>`; });
        definitionsHTML += `</ul>`;
    }
    definitionsHTML += `</div>`;

    // Assemblage du contenu HTML brut (Grille + Définitions + Script)
    let questionHTML = gridHTML + definitionsHTML + jsQuestionScript;
    
    // Feedback variables & PRT
    let wordCount = currentPlacedWords.length;
    let labelsList = currentPlacedWords.map(function(w){return '"'+w.number+'-'+w.direction+'"';});
    let prtFeedbackVariables = `all_ans_raw: [${ansNamesList.join(', ')}];
all_labels: [${labelsList.join(',')}];
score_cw: 0;
fb_ok: [];
fb_approx: [];
fb_wrong: [];
for i: 1 thru ${wordCount} do (
  block([d, ans_c, lbl],
    lbl: all_labels[i],
    if stringp(all_ans_raw[i]) then (
      ans_c: sdowncase(strim(" ", all_ans_raw[i])),
      d: levenshtein(ans_c, sdowncase(all_ta[i])),
      if d = 0 then (
        score_cw: score_cw + 1,
        fb_ok: endcons(lbl, fb_ok)
      ) else if d = 1 then (
        score_cw: score_cw + 1/2,
        fb_approx: endcons(sconcat(lbl, " : ", supcase(ans_c), " ", ${JSON.stringify(I18N_D.t('cw.label_instead_of'))}, " ", all_ta[i]), fb_approx)
      ) else
        fb_wrong: endcons(sconcat(lbl, " -> ", all_ta[i]), fb_wrong)
    ) else
      fb_wrong: endcons(sconcat(lbl, " (", ${JSON.stringify(I18N_D.t('cw.label_no_answer'))}, ") -> ", all_ta[i]), fb_wrong)
  )
);
score: score_cw / ${wordCount};
fb_html: "<div style='margin-top:8px;font-size:.9rem;'>";
if length(fb_ok) > 0 then (
  fb_html: sconcat(fb_html, "<p style='color:#166534;margin:4px 0;'><strong>&#9989; ", ${JSON.stringify(I18N_D.t('cw.label_corrects'))}, " (", string(length(fb_ok)), ") :</strong>"),
  for j: 1 thru length(fb_ok) do fb_html: sconcat(fb_html, " N&#176;", fb_ok[j]),
  fb_html: sconcat(fb_html, "</p>")
);
if length(fb_approx) > 0 then (
  fb_html: sconcat(fb_html, "<p style='color:#854d0e;margin:4px 0;'><strong>&#9888; ", ${JSON.stringify(I18N_D.t('cw.label_proches'))}, " (", string(length(fb_approx)), ") :</strong><ul style='margin:2px 0;padding-left:18px;'>"),
  for j: 1 thru length(fb_approx) do fb_html: sconcat(fb_html, "<li>N&#176;", fb_approx[j], "</li>"),
  fb_html: sconcat(fb_html, "</ul></p>")
);
if length(fb_wrong) > 0 then (
  fb_html: sconcat(fb_html, "<p style='color:#991b1b;margin:4px 0;'><strong>&#10060; ", ${JSON.stringify(I18N_D.t('cw.label_incorrects'))}, " (", string(length(fb_wrong)), ") :</strong><ul style='margin:2px 0;padding-left:18px;'>"),
  for j: 1 thru length(fb_wrong) do fb_html: sconcat(fb_html, "<li>N&#176;", fb_wrong[j], "</li>"),
  fb_html: sconcat(fb_html, "</ul></p>")
);
fb_html: sconcat(fb_html, "</div>");`;

    let prtMeta = { name: 'prt'+X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: prtFeedbackVariables+' ' };
    let canonicalNodes = [{
        name: '0', description: I18N_D.t('cw.node_desc_test_mots'), answertest: 'AlgEquiv', sans: 'score', tans: '1',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT-'+X+'-1-T', truefeedback: `<p><strong>${I18N_D.t('cw.fb_ok')}</strong></p>{#fb_html#} `,
        falsescoremode: '=', falsescore: 'score', falsepenalty: '0.1', falsenextnode: '-1',
        falseanswernote: 'PRT-'+X+'-1-F', falsefeedback: `<p>${I18N_D.t('cw.fb_wrong')}</p>{#fb_html#} `
    }];
    let prtXML = buildPrtXml_D(prtMeta, canonicalNodes);
    
    const cwEmptyGrid = (currentGridData && currentGridData.maxX !== undefined)
        ? renderCWGridHTMLEmpty_D(currentGridData.grid, currentGridData.maxX, currentGridData.maxY)
        : '';
    const cwFilledGrid = (currentGridData && currentGridData.maxX !== undefined)
        ? renderCWGridHTML_D(currentGridData.grid, currentGridData.maxX, currentGridData.maxY)
        : '';
    const cwDefinitionsOnly = definitionsHTML;

    // Feedback general : grille remplie + definitions avec reponses
    let letterMap = {};
    currentPlacedWords.forEach(function(w) {
        for (let i = 0; i < w.word.length; i++) {
            const cx = w.direction === 'H' ? w.x + i : w.x;
            const cy = w.direction === 'H' ? w.y : w.y + i;
            letterMap[cx + ',' + cy] = w.word[i];
        }
    });

    let fbGridHTML = `<div style="display:inline-grid;gap:0;border:2px solid #4095AD;background:#4095AD;grid-template-columns:repeat(${currentGridData.maxX + 1}, 28px);grid-template-rows:repeat(${currentGridData.maxY + 1}, 28px);margin-bottom:16px;">`;
    for (let fy = 0; fy <= currentGridData.maxY; fy++) {
        for (let fx = 0; fx <= currentGridData.maxX; fx++) {
            const fkey = fx + ',' + fy;
            if (currentGridData.grid[fkey]) {
                const fletter = letterMap[fkey] || '';
                const fnumHTML = currentGridData.grid[fkey].number
                    ? `<span style="position:absolute;top:1px;left:2px;font-size:9px;color:#555;">${currentGridData.grid[fkey].number}</span>`
                    : '';
                fbGridHTML += `<div style="width:28px;height:28px;display:flex;justify-content:center;align-items:center;font-weight:bold;text-transform:uppercase;font-size:14px;position:relative;background:white;border:1px solid #bbb;">${fnumHTML}${fletter}</div>`;
            } else {
                fbGridHTML += `<div style="width:28px;height:28px;background:#4095AD;"></div>`;
            }
        }
    }
    fbGridHTML += `</div>`;

    const horizFb = currentPlacedWords.filter(function(w){return w.direction==='H';}).sort(function(a,b){return a.number-b.number;});
    const vertFb  = currentPlacedWords.filter(function(w){return w.direction==='V';}).sort(function(a,b){return a.number-b.number;});
    let fbDefsHTML = `<div style="margin-top:12px;font-size:.92rem;">`;
    if (horizFb.length > 0) {
        fbDefsHTML += `<strong style="display:block;margin:4px 0;">${I18N_D.t('cw.horizontal')}</strong><ul style="list-style:none;padding:0;margin:0 0 8px 0;">`;
        horizFb.forEach(function(w) {
            fbDefsHTML += `<li style="margin-bottom:5px;"><strong>${w.number}.</strong> ${w.def} <span style="color:#166534;font-weight:bold;">→ ${w.word}</span></li>`;
        });
        fbDefsHTML += `</ul>`;
    }
    if (vertFb.length > 0) {
        fbDefsHTML += `<strong style="display:block;margin:4px 0;">${I18N_D.t('cw.vertical')}</strong><ul style="list-style:none;padding:0;margin:0;">`;
        vertFb.forEach(function(w) {
            fbDefsHTML += `<li style="margin-bottom:5px;"><strong>${w.number}.</strong> ${w.def} <span style="color:#166534;font-weight:bold;">→ ${w.word}</span></li>`;
        });
        fbDefsHTML += `</ul>`;
    }
    fbDefsHTML += `</div>`;

    const generalFeedbackContent = `<div style="padding:12px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;margin-bottom:8px;"><strong style="display:block;margin-bottom:10px;font-size:.95rem;">${I18N_D.t('cw.correction_title')}</strong>${fbGridHTML}${fbDefsHTML}</div>`;


    return{bareme,vars:questionVariables,qnote:`Mots Croisés`,
    textFrag:`
      <div style="background:#ea580c;border-left:5px solid #c2410c;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('cw.banniere')}</strong>
        <span style="background:#c2410c;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#c2410c;border:1px solid #c2410c;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('cw.badge_grille')}</span>
      </div>
      <!-- ENONCE-START --><!-- ENONCE-END -->
      ${questionHTML}
    `,
    inputXML:inputsXML,
    prtXML:prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    generalFeedback: mkFbGen_D(generalFeedbackContent, p.fbGen),
    feedbackRef:`[[feedback:prt${X}]]`,
    cwEmptyGrid,
    cwFilledGrid,
    cwDefinitionsOnly
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genCrossword: genCrossword, genCrosswordCore: genCrosswordCore };
}

// ══════════════════════════════════════════════════════
//  JXGDROP — Glisser-Déposer JSXGraph STACK
// ══════════════════════════════════════════════════════
