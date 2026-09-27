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

// build-question-server.js — Interface fenêtrée (navigateur) pour
// scripts/build-question-xml.js, pour ceux qui ne veulent pas de ligne de
// commande. Double-clique sur "Lancer Cairn XML.bat" à la racine du dépôt :
// un serveur local démarre et ouvre automatiquement une fenêtre de
// navigateur avec un formulaire (coller/charger le JSON, cliquer sur
// "Générer", télécharger le XML). Aucune donnée ne quitte la machine : tout
// reste sur 127.0.0.1.

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { generateFromConfig, loadI18N, loadTagTree, loadFixedVocab } = require('./build-question-xml.js');
const { generateQuestionsFromMarkdown, buildAIPromptText, adaptPastedAIResponse } = require('./ai-question-client.js');
const { CONTENT_SCHEMAS } = require('./ai-question-adapter.js');
const { extractTextFromPdf, checkExtractionQuality } = require('./pdf-text-extract.js');

const PORT = process.env.CFS_BUILDER_PORT ? parseInt(process.env.CFS_BUILDER_PORT, 10) : 8891;
const EXAMPLE_PATH = path.join(__dirname, 'example-question-config.json');

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function pageHtml() {
  return '<!doctype html>\n'
    + '<html lang="fr">\n'
    + '<head>\n'
    + '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>Cairn for Stack — Générateur de XML authentique</title>\n'
    + '<style>\n'
    + 'body{font-family:system-ui,Segoe UI,Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:24px;}\n'
    + '.wrap{max-width:900px;margin:0 auto;}\n'
    + 'h1{font-size:1.3rem;margin:0 0 4px;}\n'
    + 'h2{font-size:1.05rem;margin:0 0 6px;}\n'
    + 'p.sub{color:#475569;margin:0 0 20px;font-size:.9rem;}\n'
    + 'p.hint{color:#64748b;margin:4px 0 0;font-size:.78rem;}\n'
    + '.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:16px;}\n'
    + 'details.card{padding:0;}\n'
    + 'details.card>summary{padding:18px;cursor:pointer;font-weight:700;font-size:1.05rem;list-style:none;}\n'
    + 'details.card>summary::-webkit-details-marker{display:none;}\n'
    + 'details.card>.inner{padding:0 18px 18px;}\n'
    + 'textarea{width:100%;box-sizing:border-box;font-family:Consolas,monospace;font-size:.82rem;padding:10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;}\n'
    + 'input[type=text],input[type=number],input[type=password],select{box-sizing:border-box;padding:7px 9px;border:1px solid #cbd5e1;border-radius:6px;font-size:.85rem;background:#fff;}\n'
    + '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px;}\n'
    + '.field{display:flex;flex-direction:column;gap:3px;}\n'
    + '.field label{font-size:.75rem;font-weight:700;color:#475569;}\n'
    + 'button{cursor:pointer;border:none;border-radius:8px;padding:9px 16px;font-size:.85rem;font-weight:700;}\n'
    + '.primary{background:#4c1d95;color:#fff;}\n'
    + '.primary:hover{background:#3b1470;}\n'
    + '.ghost{background:#e2e8f0;color:#334155;}\n'
    + '.ghost:hover{background:#cbd5e1;}\n'
    + '.success{background:#f0fdf4;border:1px solid #86efac;color:#166534;border-radius:8px;padding:12px 14px;font-size:.85rem;}\n'
    + '.error{background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;border-radius:8px;padding:12px 14px;font-size:.85rem;white-space:pre-wrap;}\n'
    + '.tag{display:inline-block;background:#ede9fe;color:#4c1d95;border-radius:20px;padding:2px 9px;font-size:.72rem;font-weight:700;margin:2px;}\n'
    + 'label.file{background:#e2e8f0;color:#334155;border-radius:8px;padding:9px 16px;font-size:.85rem;font-weight:700;cursor:pointer;}\n'
    + 'input[type=file]{display:none;}\n'
    + '#result{margin-top:14px;}\n'
    + '#result2{margin-top:14px;}\n'
    + '.bloomchk{display:inline-flex;align-items:center;gap:4px;font-size:.78rem;background:#f1f5f9;border-radius:14px;padding:3px 9px;margin:2px;}\n'
    + '</style>\n'
    + '</head>\n'
    + '<body>\n'
    + '<div class="wrap">\n'
    + '<h1>Cairn for Stack — Générateur de XML authentique</h1>\n'
    + '<p class="sub">Deux façons de garantir un XML STACK/Moodle avec les vrais bandeaux et les vrais tags de l\'appli, sans jamais rien inventer : générer depuis un cours (avec IA), ou coller un JSON déjà rédigé. Aucune donnée ne quitte cet ordinateur, sauf le contenu du cours envoyé à ton fournisseur IA si tu utilises la 1ère méthode.</p>\n'

    // ── Carte 1 : génération assistée par IA (une consigne par question) ───
    + '<div class="card">\n'
    + '<h2>1. Générer des questions avec l\'IA</h2>\n'
    + '<p class="hint">Pour chaque question : choisis le type, la difficulté, et décris en une phrase ce que tu veux (ex : « relier le nom d\'un changement d\'état à des composés correspondants »). Tu copies ensuite un prompt tout prêt vers l\'IA de ton choix (Claude, ChatGPT, ou toute autre — aucune clé API, aucun abonnement supplémentaire nécessaire), et tu colles sa réponse ici. L\'IA ne rédige que le contenu (énoncé, réponses, feedback) en respectant ta consigne — le bandeau coloré et les tags Moodle viennent toujours du vrai générateur de l\'appli. Le cours ci-dessous est facultatif : il aide seulement l\'IA à reprendre le vocabulaire vu en classe.</p>\n'

    + '<div class="row" style="margin-top:14px;">\n'
    + '<label class="file">Déposer des fichiers .md ou .pdf (facultatif)<input type="file" id="mdFiles" accept=".md,.markdown,text/markdown,.txt,.pdf,application/pdf" multiple></label>\n'
    + '<span id="mdFilesLabel" class="hint"></span>\n'
    + '</div>\n'
    + '<p class="hint">Pour un PDF, le texte est extrait automatiquement et ajouté ci-dessous : relis-le avant de générer, l\'extraction peut être imparfaite (PDF scanné, mise en page complexe...).</p>\n'
    + '<textarea id="mdInput" rows="6" placeholder="Contexte de cours facultatif (Markdown ou texte) : aide l\'IA à reprendre ton vocabulaire exact."></textarea>\n'

    + '<div class="row" style="margin-top:14px;">\n'
    + '<div class="field"><label>Matière</label><select id="tt-matiere"></select></div>\n'
    + '<div class="field"><label>Niveau</label><select id="tt-niveau"></select></div>\n'
    + '<div class="field"><label>Sous-matière</label><select id="tt-sousMatiere"></select></div>\n'
    + '<div class="field"><label>Chapitre</label><select id="tt-chapitre"></select></div>\n'
    + '</div>\n'
    + '<div class="row">\n'
    + '<div class="field"><label>Difficulté (tag Moodle de l\'exercice)</label><select id="tt-difficulte"></select></div>\n'
    + '<div class="field"><label>Nom de l\'exercice</label><input type="text" id="quizName" placeholder="ex: eau_molecules" style="width:200px;"></div>\n'
    + '</div>\n'
    + '<div class="field" style="margin-top:8px;"><label>Bloom (facultatif)</label><div id="tt-bloom"></div></div>\n'

    + '<h2 style="margin-top:18px;">Questions à générer</h2>\n'
    + '<div id="qReqList"></div>\n'
    + '<div class="row"><button class="ghost" type="button" id="btnAddReq">+ Ajouter une question</button></div>\n'
    + '<p class="hint">La difficulté indiquée par question ne guide que la rédaction de l\'IA ; le tag Moodle « difficulté » final (ci-dessus) est unique pour tout l\'exercice.</p>\n'

    + '<div class="row" style="margin-top:14px;"><button class="primary" type="button" id="btnBuildPrompt">1. Générer le prompt à copier</button></div>\n'
    + '<div id="promptBox" style="display:none;margin-top:10px;">\n'
    + '<p class="hint">Copie ce texte et colle-le dans ton IA habituelle (Claude, ChatGPT...), puis colle sa réponse dans le champ ci-dessous.</p>\n'
    + '<textarea id="promptOutput" rows="10" readonly></textarea>\n'
    + '<div class="row"><button class="ghost" type="button" id="btnCopyPrompt">Copier le prompt</button><span id="copyNotice" class="hint"></span></div>\n'
    + '</div>\n'

    + '<div class="field" style="margin-top:14px;"><label>2. Colle ici la réponse de l\'IA</label>\n'
    + '<textarea id="aiResponseInput" rows="8" placeholder="Colle ici tout ce que l\'IA a répondu (même entouré de texte ou de balises ```json : c\'est géré)."></textarea>\n'
    + '</div>\n'
    + '<div class="row"><button class="primary" type="button" id="btnImportResponse">3. Importer la réponse et générer le XML</button></div>\n'
    + '<div id="result"></div>\n'

    + '<details style="margin-top:16px;"><summary style="cursor:pointer;font-weight:700;font-size:.85rem;color:#4c1d95;">Ou : génération automatique avec une clé API personnelle (facultatif)</summary>\n'
    + '<div class="row">\n'
    + '<div class="field"><label>Clé API</label><input type="password" id="aiKey" placeholder="sk-..." style="width:220px;"></div>\n'
    + '<div class="field"><label>URL de base</label><input type="text" id="aiBaseUrl" placeholder="https://api.openai.com/v1" style="width:220px;"></div>\n'
    + '<div class="field"><label>Modèle</label><input type="text" id="aiModel" placeholder="gpt-4o-mini" style="width:160px;"></div>\n'
    + '</div>\n'
    + '<p class="hint">Ta clé personnelle reste sur cet ordinateur (mémorisée dans ce navigateur) : elle n\'est envoyée qu\'à ton fournisseur IA, jamais stockée par ce générateur. Réservé aux fournisseurs compatibles avec le format OpenAI (/chat/completions).</p>\n'
    + '<div class="row"><button class="ghost" type="button" id="btnGenerateAI">Générer automatiquement avec l\'IA</button></div>\n'
    + '<div id="resultAuto"></div>\n'
    + '</details>\n'
    + '</div>\n'

    // ── Carte 2 : mode manuel (JSON déjà rédigé) ────────────────────────────
    + '<details class="card">\n'
    + '<summary>2. Ou coller un JSON déjà rédigé (mode manuel)</summary>\n'
    + '<div class="inner">\n'
    + '<textarea id="cfgInput" rows="14" placeholder="Colle ici le JSON de configuration..."></textarea>\n'
    + '<div class="row">\n'
    + '<label class="file">Charger un fichier .json<input type="file" id="fileInput" accept="application/json,.json"></label>\n'
    + '<button class="ghost" id="btnExample">Voir un exemple</button>\n'
    + '<button class="primary" id="btnGenerate">Générer le XML</button>\n'
    + '</div>\n'
    + '<div id="result2"></div>\n'
    + '</div>\n'
    + '</details>\n'

    + '</div>\n'
    + '<script>\n'
    + 'function renderResult(container,data){\n'
    + '  if(!data.ok){ container.innerHTML="<div class=\\"error\\">"+data.error+"</div>"; return; }\n'
    + '  var lastXml=data.xml, lastName=data.qName||"exercice";\n'
    + '  var tagsHtml=(data.tags||[]).map(function(t){return "<span class=\\"tag\\">"+t+"</span>";}).join("");\n'
    + '  container.innerHTML="<div class=\\"success\\"><strong>OK</strong> \\u2014 "+data.nQuestions+" question(s), "+data.totalB+" pt au total.<br>"+tagsHtml+"</div>"\n'
    + '    +"<div class=\\"row\\"><button class=\\"primary\\" id=\\"btnDownload_"+container.id+"\\">T\\u00e9l\\u00e9charger le XML ("+lastName+".xml)</button></div>";\n'
    + '  document.getElementById("btnDownload_"+container.id).addEventListener("click",function(){\n'
    + '    var blob=new Blob([lastXml],{type:"text/xml;charset=utf-8"});\n'
    + '    var url=URL.createObjectURL(blob);\n'
    + '    var a=document.createElement("a");\n'
    + '    a.href=url; a.download=lastName+".xml";\n'
    + '    document.body.appendChild(a); a.click(); document.body.removeChild(a);\n'
    + '    URL.revokeObjectURL(url);\n'
    + '  });\n'
    + '}\n'

    // ── Mode manuel (identique à la version précédente) ──────────────────
    + 'var cfgInput=document.getElementById("cfgInput");\n'
    + 'var fileInput=document.getElementById("fileInput");\n'
    + 'var result2=document.getElementById("result2");\n'
    + 'fileInput.addEventListener("change",function(){\n'
    + '  var f=fileInput.files[0]; if(!f)return;\n'
    + '  var reader=new FileReader();\n'
    + '  reader.onload=function(){ cfgInput.value=reader.result; };\n'
    + '  reader.readAsText(f);\n'
    + '});\n'
    + 'document.getElementById("btnExample").addEventListener("click",function(){\n'
    + '  fetch("/example").then(function(r){return r.json();}).then(function(data){\n'
    + '    cfgInput.value=JSON.stringify(data,null,2);\n'
    + '  }).catch(function(e){ result2.innerHTML="<div class=\\"error\\">Impossible de charger l\\u2019exemple : "+e.message+"</div>"; });\n'
    + '});\n'
    + 'document.getElementById("btnGenerate").addEventListener("click",function(){\n'
    + '  result2.innerHTML="<p style=\\"color:#64748b;font-size:.85rem;\\">G\\u00e9n\\u00e9ration en cours...</p>";\n'
    + '  fetch("/generate",{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:cfgInput.value})\n'
    + '  .then(function(r){return r.json();})\n'
    + '  .then(function(data){ renderResult(result2,data); })\n'
    + '  .catch(function(e){ result2.innerHTML="<div class=\\"error\\">Erreur r\\u00e9seau : "+e.message+"</div>"; });\n'
    + '});\n'

    // ── Mode IA / documents ──────────────────────────────────────────────
    + 'var aiKey=document.getElementById("aiKey"), aiBaseUrl=document.getElementById("aiBaseUrl"), aiModel=document.getElementById("aiModel");\n'
    + '["aiKey","aiBaseUrl","aiModel"].forEach(function(id){\n'
    + '  var el=document.getElementById(id);\n'
    + '  try{ var saved=localStorage.getItem("cfs_"+id); if(saved)el.value=saved; }catch(e){}\n'
    + '  el.addEventListener("change",function(){ try{ localStorage.setItem("cfs_"+id, el.value); }catch(e){} });\n'
    + '});\n'
    + 'var mdInput=document.getElementById("mdInput");\n'
    + 'var mdFiles=document.getElementById("mdFiles");\n'
    + 'var mdFilesLabel=document.getElementById("mdFilesLabel");\n'
    + 'function isPdf(f){ return f.type==="application/pdf" || /\\.pdf$/i.test(f.name); }\n'
    + 'function readOneFile(f){\n'
    + '  if(isPdf(f)){\n'
    + '    return new Promise(function(resolve){ var r=new FileReader(); r.onload=function(){ resolve(r.result); }; r.readAsArrayBuffer(f); })\n'
    + '      .then(function(buf){\n'
    + '        return fetch("/extract-pdf?name="+encodeURIComponent(f.name),{method:"POST",headers:{"Content-Type":"application/pdf"},body:buf})\n'
    + '          .then(function(r){return r.json();})\n'
    + '          .then(function(data){\n'
    + '            if(!data.ok) return "\\n\\n# "+f.name+"\\n[Erreur d\\u2019extraction PDF : "+data.error+"]\\n";\n'
    + '            var warn=data.warning?("\\n> "+data.warning+"\\n"):"";\n'
    + '            return "\\n\\n# "+f.name+warn+"\\n"+data.text;\n'
    + '          });\n'
    + '      });\n'
    + '  }\n'
    + '  return new Promise(function(resolve){ var r=new FileReader(); r.onload=function(){resolve("\\n\\n# "+f.name+"\\n"+r.result);}; r.readAsText(f); });\n'
    + '}\n'
    + 'mdFiles.addEventListener("change",function(){\n'
    + '  var files=Array.prototype.slice.call(mdFiles.files);\n'
    + '  if(!files.length)return;\n'
    + '  mdFilesLabel.textContent=files.length+" fichier(s) en cours de lecture...";\n'
    + '  Promise.all(files.map(readOneFile)).then(function(parts){\n'
    + '    mdInput.value=(mdInput.value?mdInput.value+"\\n":"")+parts.join("");\n'
    + '    mdFilesLabel.textContent=files.length+" fichier(s) ajout\\u00e9(s) au cours ci-dessous.";\n'
    + '  }).catch(function(e){ mdFilesLabel.textContent="Erreur de lecture : "+e.message; });\n'
    + '});\n'

    + 'var ttData=null;\n'
    + 'var ttMatiere=document.getElementById("tt-matiere"), ttNiveau=document.getElementById("tt-niveau"),\n'
    + '    ttSousMatiere=document.getElementById("tt-sousMatiere"), ttChapitre=document.getElementById("tt-chapitre"),\n'
    + '    ttDifficulte=document.getElementById("tt-difficulte"), ttBloom=document.getElementById("tt-bloom"),\n'
    + '    qReqList=document.getElementById("qReqList");\n'
    + 'function fillSelect(sel,items){ sel.innerHTML=items.map(function(i){return "<option>"+i+"</option>";}).join(""); }\n'
    + 'function onMatiereChange(){ fillSelect(ttNiveau,Object.keys(ttData.tree[ttMatiere.value]||{})); onNiveauChange(); }\n'
    + 'function onNiveauChange(){ fillSelect(ttSousMatiere,Object.keys((ttData.tree[ttMatiere.value]||{})[ttNiveau.value]||{})); onSousMatiereChange(); }\n'
    + 'function onSousMatiereChange(){ var chaps=((ttData.tree[ttMatiere.value]||{})[ttNiveau.value]||{})[ttSousMatiere.value]||[]; fillSelect(ttChapitre,chaps); }\n'
    + 'ttMatiere.addEventListener("change",onMatiereChange);\n'
    + 'ttNiveau.addEventListener("change",onNiveauChange);\n'
    + 'ttSousMatiere.addEventListener("change",onSousMatiereChange);\n'

    // ── Liste dynamique "une consigne = une question" (type + difficulté +
    // mini-prompt libre décrivant ce que l\'enseignant veut). ────────────────
    + 'var reqCounter=0;\n'
    + 'function addReqRow(){\n'
    + '  var idx=reqCounter++;\n'
    + '  var div=document.createElement("div");\n'
    + '  div.className="row qreq"; div.dataset.idx=idx;\n'
    + '  div.style.border="1px solid #e2e8f0"; div.style.borderRadius="8px"; div.style.padding="10px"; div.style.marginTop="8px";\n'
    + '  var typeOpts=Object.keys(ttData.types).map(function(t){return "<option value=\\""+t+"\\">"+ttData.types[t]+"</option>";}).join("");\n'
    + '  var diffOpts=ttData.difficulte.map(function(d){return "<option>"+d+"</option>";}).join("");\n'
    + '  div.innerHTML="<div class=\\"field\\"><label>Type</label><select class=\\"qreq-type\\">"+typeOpts+"</select></div>"\n'
    + '    +"<div class=\\"field\\"><label>Difficult\\u00e9</label><select class=\\"qreq-diff\\">"+diffOpts+"</select></div>"\n'
    + '    +"<div class=\\"field\\" style=\\"flex:1;min-width:240px;\\"><label>Ce que tu veux comme question</label>"\n'
    + '    +"<input type=\\"text\\" class=\\"qreq-prompt\\" placeholder=\\"ex\\u00a0: relier le nom d\\u2019un changement d\\u2019\\u00e9tat \\u00e0 des compos\\u00e9s correspondants\\" style=\\"width:100%;\\"></div>"\n'
    + '    +"<button class=\\"ghost qreq-remove\\" type=\\"button\\" style=\\"align-self:flex-end;\\">Supprimer</button>";\n'
    + '  div.querySelector(".qreq-remove").addEventListener("click",function(){ div.remove(); });\n'
    + '  qReqList.appendChild(div);\n'
    + '}\n'
    + 'document.getElementById("btnAddReq").addEventListener("click",addReqRow);\n'

    + 'fetch("/tags-tree?lang=fr").then(function(r){return r.json();}).then(function(data){\n'
    + '  if(!data.ok){ document.getElementById("result").innerHTML="<div class=\\"error\\">Arbre de tags indisponible : "+data.error+"</div>"; return; }\n'
    + '  ttData=data;\n'
    + '  fillSelect(ttMatiere,Object.keys(data.tree)); onMatiereChange();\n'
    + '  fillSelect(ttDifficulte,data.difficulte);\n'
    + '  ttBloom.innerHTML=data.bloom.map(function(b){return "<label class=\\"bloomchk\\"><input type=\\"checkbox\\" value=\\""+b+"\\">"+b+"</label>";}).join("");\n'
    + '  addReqRow();\n'
    + '}).catch(function(e){ document.getElementById("result").innerHTML="<div class=\\"error\\">Impossible de joindre le serveur local : "+e.message+"</div>"; });\n'

    // ── Collecte commune des consignes (une ligne .qreq = une question),
    // et des tags/réglages de l\'exercice — réutilisée par les 3 modes. ──────
    + 'function collectRequests(){\n'
    + '  return Array.prototype.slice.call(document.querySelectorAll(".qreq")).map(function(row,i){\n'
    + '    return { id:i, type: row.querySelector(".qreq-type").value, difficulte: row.querySelector(".qreq-diff").value,\n'
    + '      prompt: row.querySelector(".qreq-prompt").value.trim() };\n'
    + '  }).filter(function(r){ return r.prompt; });\n'
    + '}\n'
    + 'function collectTags(){\n'
    + '  var bloom=Array.prototype.slice.call(document.querySelectorAll("#tt-bloom input:checked")).map(function(c){return c.value;});\n'
    + '  return { matiere: ttMatiere.value, niveau: ttNiveau.value, sousMatiere: ttSousMatiere.value, chapitre: ttChapitre.value, bloom: bloom, difficulte: ttDifficulte.value };\n'
    + '}\n'

    // ── Mode manuel copier/coller : étape 1 (construire le prompt, aucune
    // clé API), copier, puis étape 2 (importer la réponse collée). ─────────
    + 'var promptBox=document.getElementById("promptBox"), promptOutput=document.getElementById("promptOutput"),\n'
    + '    aiResponseInput=document.getElementById("aiResponseInput"), copyNotice=document.getElementById("copyNotice");\n'
    + 'document.getElementById("btnBuildPrompt").addEventListener("click",function(){\n'
    + '  var result=document.getElementById("result");\n'
    + '  var requests=collectRequests();\n'
    + '  if(!requests.length){ result.innerHTML="<div class=\\"error\\">Ajoute au moins une question (type + mini-consigne).</div>"; return; }\n'
    + '  fetch("/build-ai-prompt",{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},\n'
    + '    body:JSON.stringify({ markdown: mdInput.value, requests: requests, tags: collectTags() })})\n'
    + '  .then(function(r){return r.json();})\n'
    + '  .then(function(data){\n'
    + '    if(!data.ok){ result.innerHTML="<div class=\\"error\\">"+data.error+"</div>"; return; }\n'
    + '    promptBox.style.display="block"; promptOutput.value=data.prompt; copyNotice.textContent="";\n'
    + '    result.innerHTML="";\n'
    + '  })\n'
    + '  .catch(function(e){ result.innerHTML="<div class=\\"error\\">Erreur r\\u00e9seau : "+e.message+"</div>"; });\n'
    + '});\n'
    + 'document.getElementById("btnCopyPrompt").addEventListener("click",function(){\n'
    + '  promptOutput.select();\n'
    + '  (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(promptOutput.value) : Promise.reject())\n'
    + '  .then(function(){ copyNotice.textContent="Copi\\u00e9 !"; })\n'
    + '  .catch(function(){ try{ document.execCommand("copy"); copyNotice.textContent="Copi\\u00e9 !"; }catch(e){ copyNotice.textContent="S\\u00e9lectionne le texte et copie-le manuellement (Ctrl+C)."; } });\n'
    + '});\n'
    + 'document.getElementById("btnImportResponse").addEventListener("click",function(){\n'
    + '  var result=document.getElementById("result");\n'
    + '  var requests=collectRequests();\n'
    + '  if(!requests.length){ result.innerHTML="<div class=\\"error\\">Ajoute au moins une question (type + mini-consigne).</div>"; return; }\n'
    + '  if(!aiResponseInput.value.trim()){ result.innerHTML="<div class=\\"error\\">Colle la r\\u00e9ponse de l\\u2019IA avant d\\u2019importer.</div>"; return; }\n'
    + '  var payload={ lang:"fr", rawResponse: aiResponseInput.value, requests: requests,\n'
    + '    quizName: document.getElementById("quizName").value || "exercice_ia", tags: collectTags() };\n'
    + '  result.innerHTML="<p style=\\"color:#64748b;font-size:.85rem;\\">Import en cours...</p>";\n'
    + '  fetch("/import-ai-response",{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(payload)})\n'
    + '  .then(function(r){return r.json();})\n'
    + '  .then(function(data){ renderResult(result,data); })\n'
    + '  .catch(function(e){ result.innerHTML="<div class=\\"error\\">Erreur r\\u00e9seau : "+e.message+"</div>"; });\n'
    + '});\n'

    // ── Mode automatique (facultatif, nécessite une clé API compatible
    // OpenAI) — inchangé, juste réutilise collectRequests()/collectTags(). ──
    + 'document.getElementById("btnGenerateAI").addEventListener("click",function(){\n'
    + '  var resultAI=document.getElementById("resultAuto");\n'
    + '  var requests=collectRequests();\n'
    + '  if(!requests.length){ resultAI.innerHTML="<div class=\\"error\\">Ajoute au moins une question (type + mini-consigne).</div>"; return; }\n'
    + '  var payload={\n'
    + '    lang:"fr",\n'
    + '    markdown: mdInput.value,\n'
    + '    requests: requests,\n'
    + '    quizName: document.getElementById("quizName").value || "exercice_ia",\n'
    + '    tags: collectTags(),\n'
    + '    ai: { key: aiKey.value, baseUrl: aiBaseUrl.value, model: aiModel.value }\n'
    + '  };\n'
    + '  resultAI.innerHTML="<p style=\\"color:#64748b;font-size:.85rem;\\">G\\u00e9n\\u00e9ration en cours (l\\u2019IA lit le cours et r\\u00e9dige les questions, cela peut prendre quelques dizaines de secondes)...</p>";\n'
    + '  fetch("/generate-from-docs",{method:"POST",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(payload)})\n'
    + '  .then(function(r){return r.json();})\n'
    + '  .then(function(data){ renderResult(resultAI,data); })\n'
    + '  .catch(function(e){ resultAI.innerHTML="<div class=\\"error\\">Erreur r\\u00e9seau : "+e.message+"</div>"; });\n'
    + '});\n'
    + '</script>\n'
    + '</body>\n'
    + '</html>\n';
}

// ── Lit le corps de la requête en JSON, avec un plafond de taille (le cours
// déposé peut être plus volumineux qu'une config manuelle — plafond relevé). ─
function readJsonBody(req, res, maxBytes, onOk) {
  let body = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > maxBytes) { tooBig = true; req.destroy(); }
  });
  req.on('end', () => {
    if (tooBig) return sendJson(res, 413, { ok: false, error: 'Requête trop volumineuse.' });
    let obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'JSON invalide : ' + e.message });
    }
    onOk(obj);
  });
}

// ── Lit le corps de la requête en Buffer brut (upload PDF binaire), avec un
// plafond de taille. ────────────────────────────────────────────────────
function readRawBody(req, res, maxBytes, onOk) {
  const chunks = [];
  let size = 0;
  let tooBig = false;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxBytes) { tooBig = true; req.destroy(); return; }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (tooBig) return sendJson(res, 413, { ok: false, error: 'Fichier trop volumineux.' });
    onOk(Buffer.concat(chunks));
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    const html = pageHtml();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
    res.end(html);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/example') {
    fs.readFile(EXAMPLE_PATH, 'utf8', (err, data) => {
      if (err) return sendJson(res, 500, { ok: false, error: "Fichier d'exemple introuvable." });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  // ── Arbre de tags + vocabulaire figé RÉELS (jamais inventés par l'IA ni
  // par la page) : sert à construire les listes déroulantes en cascade. ────
  if (req.method === 'GET' && url.pathname === '/tags-tree') {
    const lang = url.searchParams.get('lang') || 'fr';
    try {
      const tree = loadTagTree(lang);
      const fixedVocab = loadFixedVocab();
      const types = Object.fromEntries(Object.entries(CONTENT_SCHEMAS).map(([k, v]) => [k, v.label]));
      sendJson(res, 200, { ok: true, tree, bloom: fixedVocab.bloom, difficulte: fixedVocab.difficulte, types });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }
  if (req.method === 'POST' && url.pathname === '/generate') {
    readJsonBody(req, res, 5 * 1024 * 1024, (cfg) => {
      try {
        const result = generateFromConfig(cfg);
        sendJson(res, 200, {
          ok: true,
          xml: result.xml,
          totalB: result.totalB,
          qName: result.qName,
          nQuestions: result.nQuestions,
          tags: result.tags.map((t) => t.clean),
        });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }
  // ── Extraction de texte depuis un PDF déposé (voir pdf-text-extract.js :
  // extraction "maison" sans dépendance npm, limites connues sur les PDF
  // scannés ou aux polices ré-encodées — texte toujours relu par l'enseignant
  // dans la zone de texte avant génération). ───────────────────────────────
  if (req.method === 'POST' && url.pathname === '/extract-pdf') {
    readRawBody(req, res, 30 * 1024 * 1024, (buf) => {
      try {
        if (!buf.length) throw new Error('Fichier PDF vide.');
        const text = extractTextFromPdf(buf);
        const warning = checkExtractionQuality(text, buf.length);
        sendJson(res, 200, { ok: true, text, warning });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }
  // ── Génération IA à partir du Markdown déposé : l'IA ne rédige QUE le
  // contenu pédagogique (ai-question-adapter.js) ; le format XML final passe
  // ensuite par generateFromConfig(), donc bandeaux/tags restent garantis. ──
  if (req.method === 'POST' && url.pathname === '/generate-from-docs') {
    readJsonBody(req, res, 20 * 1024 * 1024, async (body) => {
      try {
        const lang = body.lang || 'fr';
        const I18N = loadI18N(lang);
        const questions = await generateQuestionsFromMarkdown({
          markdown: body.markdown,
          requests: body.requests,
          ai: body.ai,
          matiere: body.tags && body.tags.matiere,
          niveau: body.tags && body.tags.niveau,
          I18N,
        });
        const cfg = {
          lang,
          quizName: body.quizName,
          tags: body.tags,
          penalty: body.penalty,
          feedbackStyle: body.feedbackStyle,
          questions,
        };
        const result = generateFromConfig(cfg);
        sendJson(res, 200, {
          ok: true,
          xml: result.xml,
          totalB: result.totalB,
          qName: result.qName,
          nQuestions: result.nQuestions,
          tags: result.tags.map((t) => t.clean),
        });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }
  // ── Mode manuel copier/coller, étape 1 : construit juste le texte du
  // prompt (AUCUNE clé API, AUCUN appel réseau vers un fournisseur IA) —
  // l'enseignant le copie lui-même vers l'IA de son choix. ─────────────────
  if (req.method === 'POST' && url.pathname === '/build-ai-prompt') {
    readJsonBody(req, res, 20 * 1024 * 1024, (body) => {
      try {
        const { promptText, truncatedNotice } = buildAIPromptText({
          markdown: body.markdown,
          requests: body.requests,
          matiere: body.tags && body.tags.matiere,
          niveau: body.tags && body.tags.niveau,
        });
        sendJson(res, 200, { ok: true, prompt: promptText, truncatedNotice });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }
  // ── Mode manuel copier/coller, étape 2 : l'enseignant colle ici ce que
  // l'IA lui a répondu. Même garantie de format que les autres modes : l'IA
  // n'a rédigé que le contenu, le XML final passe par generateFromConfig(). ─
  if (req.method === 'POST' && url.pathname === '/import-ai-response') {
    readJsonBody(req, res, 5 * 1024 * 1024, (body) => {
      try {
        const lang = body.lang || 'fr';
        const I18N = loadI18N(lang);
        const questions = adaptPastedAIResponse({ rawText: body.rawResponse, requests: body.requests, I18N });
        const cfg = {
          lang,
          quizName: body.quizName,
          tags: body.tags,
          penalty: body.penalty,
          feedbackStyle: body.feedbackStyle,
          questions,
        };
        const result = generateFromConfig(cfg);
        sendJson(res, 200, {
          ok: true,
          xml: result.xml,
          totalB: result.totalB,
          qName: result.qName,
          nQuestions: result.nQuestions,
          tags: result.tags.map((t) => t.clean),
        });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: e.message });
      }
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + PORT + '/';
  console.log('Cairn for Stack — générateur de XML : ' + url);
  console.log('Laisse cette fenêtre ouverte pendant que tu utilises le générateur.');
  console.log('Pour arrêter le serveur : ferme cette fenêtre (ou Ctrl+C).');
  if (process.env.CFS_NO_OPEN) return;
  const openCmd = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(openCmd + ' ' + url, () => {});
});
