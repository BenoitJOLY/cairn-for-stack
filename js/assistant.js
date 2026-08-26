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

/* ════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — MODE ASSISTANT (autonome)
   Lit l'état global (currentType, questions, editingId, nameLocked) ;
   ne modifie aucun fichier existant.
   À charger EN DERNIER, après app.js :
     <script src="js/assistant.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var STORE_KEY = "cairnforstack_assistant";
  var STORE_W   = "cairnforstack_assistant_w";
  var STORE_H   = "cairnforstack_assistant_h";
  var DEFAULT_NAME = "Exercice sans titre";
  var DIM_SELECTOR =
    ".quiz-name-bar, .q-list-box, .type-grid, .form-panel, .action-bar";

  /* ── Accès au contenu localisé (lang/assistant.fr.js / .en.js) ── */
  function L(){
    var lang = (window.I18N && I18N.getLang) ? I18N.getLang() : "fr";
    var bank = window.ASSIST_LANG || {};
    return bank[lang] || bank.fr || {};
  }
  function tpl(str, vars){
    return String(str||"").replace(/\{(\w+)\}/g, function(_,k){
      return (vars && vars[k]!=null) ? vars[k] : "";
    });
  }
  function TYPE_LABEL(){ return L().TYPE_LABEL || {}; }
  function STEP3(){ return L().STEP3 || {}; }

  var lastSig = "";

  /* ── Détection V4 ── */
  function isV4(){ return !!document.getElementById("v4-editor"); }

  /* ── Lecture sûre de l'état ── */
  function nameSet(){
    try{ if(typeof nameLocked!=="undefined" && nameLocked) return true; }catch(e){}
    var el=document.getElementById("quiz-name");
    if(!el) return false;
    var v=(el.value||"").trim();
    return v!=="" && v!==DEFAULT_NAME;
  }
  function getType(){ try{return currentType;}catch(e){return null;} }
  function getQuestions(){
    try{
      if(isV4()){ return typeof questions==="object"&&questions!==null ? Object.values(questions).filter(Boolean) : []; }
      return Array.isArray(questions)?questions:[];
    }catch(e){return [];}
  }
  function getEditingId(){
    try{
      if(isV4()){ return (typeof _activeQid!=="undefined"&&_activeQid!==null)?_activeQid:null; }
      return (editingId!==null&&editingId!==undefined)?editingId:null;
    }catch(e){return null;}
  }

  function detectStep(){
    var qn=isV4()
      ? document.querySelectorAll("#v4-editor .q-chip").length
      : getQuestions().length;
    var t=getType(), edit=getEditingId(), step;
    if(!nameSet())          step=1;
    else if(edit!==null)    step=3;
    else if(qn===0)         step= t ? 3 : 2;
    else                    step=4;
    return {step:step, qn:qn, type:t, edit:edit};
  }

  function focusTargets(ctx){
    if(isV4()){
      switch(ctx.step){
        case 1: return ["#quiz-name"];
        case 2: return ["#palette-zone"];
        case 3: return ["#q-config-modal"];
        case 4: return [".v4-subbar"];
        default:return [];
      }
    }
    switch(ctx.step){
      case 1: return [".quiz-name-bar"];
      case 2: return [".type-grid"];
      case 3: return [".form-panel.active", ".action-bar"];
      case 4: return [".action-bar", ".q-list-box"];
      default:return [];
    }
  }

  /* La notation (barème) est dans le bandeau jaune, hors des champs :
     on l'ajoute systématiquement en tête, pour TOUS les types.        */
  function fieldItems(g){
    var arr=(g.fields||[]).filter(function(f){ return !/Barème|Marking/.test(f); });
    return [L().notation||""].concat(arr);
  }
  function fieldsHTML(g){
    return "<ol class='hs-sub'>"+fieldItems(g).map(function(f){return "<li>"+f+"</li>";}).join("")+"</ol>";
  }

  /* ── Contenu du panneau ── */
  function buildExplain(ctx){
    var d=L();
    if(ctx.step===1){
      var s1=d.step1||{};
      return {cls:"", title:s1.title||"", body:
        "<div class='hs-explain-text'>"+(s1.explain||"")+"</div>" +
        (s1.tip?"<div class='hs-tip'>💡 "+s1.tip+"</div>":"")};
    }
    if(ctx.step===2){
      var s2=(isV4()&&d.step2_v4)||d.step2||{};
      return {cls:"", title:s2.title||"", body:
        "<div class='hs-explain-text'>"+(s2.explain||"")+"</div>" +
        (s2.tip?"<div class='hs-tip'>💡 "+s2.tip+"</div>":"")};
    }
    if(ctx.step===3){
      var t=ctx.type;
      var s3=(isV4()&&d.step3_v4)||d.step3||{};
      var label=(TYPE_LABEL()[t])||t||"Question";
      if(ctx.edit!==null){
        var g0=STEP3()[t];
        var fieldsE = g0 ? fieldsHTML(g0) : "";
        return {cls:"edit", title:tpl(s3.editTitle,{n:ctx.edit,label:label}), body:
          "<div class='hs-explain-text'>"+tpl(s3.editExplain,{n:ctx.edit})+"</div>"+
          fieldsE+
          "<div class='hs-do'>💾 "+tpl(s3.editDo,{n:ctx.edit})+"</div>"};
      }
      var g=STEP3()[t];
      if(!g){
        return {cls:"", title:tpl(s3.title,{label:label}), body:
          "<div class='hs-explain-text'>"+(s3.noGuideExplain||"")+"</div>"+
          "<div class='hs-do'>➕ "+(s3.noGuideDo||"")+"</div>"};
      }
      var fields=fieldsHTML(g);
      var done = ctx.qn>0
        ? "<div class='hs-tip'>✅ "+tpl(s3.done,{qn:ctx.qn})+"</div>"
        : "";
      return {cls:"", title:tpl(s3.title,{label:label}), body:
        "<div class='hs-intro'>"+g.intro+"</div>"+
        fields+
        "<div class='hs-do'>➕ "+(s3.do||"")+"</div>"+
        (g.tip?"<div class='hs-tip'>💡 "+g.tip+"</div>":"")+
        done};
    }
    /* step 4 */
    var s4=(isV4()&&d.step4_v4)||d.step4||{};
    return {cls:"", title:s4.title||"", body:
      "<div class='hs-explain-text'>"+tpl(s4.explain,{qn:ctx.qn})+"</div>"+
      (s4.tip?"<div class='hs-tip'>💡 "+s4.tip+"</div>":"")};
  }

  function stepsListHTML(ctx){
    var qn=ctx.qn;
    var done={1:nameSet(), 2:(!!ctx.type||qn>0), 3:qn>0, 4:false};
    var d=L();
    var ls=(isV4()&&d.stepsList_v4)||d.stepsList||[];
    var labels={1:ls[0]||"", 2:ls[1]||"", 3:ls[2]||"", 4:ls[3]||""};
    var html='<ul class="hs-steps">';
    for(var i=1;i<=4;i++){
      var cls=[];
      if(i===ctx.step) cls.push("current");
      else if(done[i]) cls.push("done");
      var num=(done[i]&&i!==ctx.step)?"✓":i;
      html+='<li class="'+cls.join(" ")+'"><span class="hs-num">'+num+'</span><span>'+labels[i]+'</span></li>';
    }
    return html+"</ul>";
  }

  var DIM_SELECTOR_V4 = "#quiz-name, #palette-zone, #q-config-modal, .v4-subbar";

  function applyFocus(ctx){
    var sel=isV4() ? DIM_SELECTOR_V4 : DIM_SELECTOR;
    document.querySelectorAll(sel).forEach(function(el){ el.classList.remove("hs-focus"); });
    focusTargets(ctx).forEach(function(s){
      document.querySelectorAll(s).forEach(function(el){ el.classList.add("hs-focus"); });
    });
  }

  function refresh(){
    if(!document.body.classList.contains("hs-assist-on")) return;
    var ctx=detectStep();
    applyFocus(ctx);
    var sig=ctx.step+"|"+ctx.qn+"|"+(ctx.edit===null?"":ctx.edit)+"|"+(ctx.type||"");
    if(sig===lastSig) return;
    lastSig=sig;
    var body=document.getElementById("hs-panel-body");
    if(!body) return;
    var ex=buildExplain(ctx);
    body.innerHTML=
      stepsListHTML(ctx)+
      '<div class="hs-explain '+ex.cls+'">'+
        '<div class="hs-explain-title">👉 '+ex.title+'</div>'+
        ex.body+
      '</div>';
  }

  /* ── Guide injecté dans les fenêtres « Prompt IA » ──────────────
     Ces fenêtres recouvrent le panneau latéral : on glisse donc un
     bandeau d'aide directement en haut de la fenêtre ouverte.        */
  var PROMPT_MODALS = ["promptModal", "matchPromptModal", "cwPromptModal"];
  function promptBanner(id){
    var p=(L().prompt)||{};
    var steps=(p.steps||[]).map(function(li){return "<li>"+li+"</li>";}).join("");
    var note = id==="promptModal" && p.note ? '<div class="hs-pb-note">'+p.note+'</div>' : "";
    return '<div class="hs-pb-guide" data-hs-guide="1">'+
      '<div class="hs-pb-guide-title">'+(p.title||"")+'</div>'+
      '<ol class="hs-pb-steps">'+steps+'</ol>'+
      note+
    '</div>';
  }

  function isVisible(el){
    if(!el) return false;
    if(window.getComputedStyle(el).display==="none") return false;
    return el.getClientRects().length>0;
  }

  function syncPromptBanners(){
    var on=document.body.classList.contains("hs-assist-on");
    PROMPT_MODALS.forEach(function(id){
      var modal=document.getElementById(id);
      if(!modal) return;
      var bodyEl=modal.querySelector(".pb-body");
      if(!bodyEl) return;
      var existing=bodyEl.querySelector('[data-hs-guide="1"]');
      if(on && isVisible(modal)){
        if(!existing){
          bodyEl.insertAdjacentHTML("afterbegin", promptBanner(id));
        }
      }else if(existing){
        existing.remove();
      }
    });
  }

  function setActive(on, persist){
    document.body.classList.toggle("hs-assist-on", on);
    var tog=document.getElementById("hs-assist-toggle");
    if(tog){ tog.classList.toggle("on", on); tog.setAttribute("aria-checked", on ? "true" : "false"); }
    if(!on){
      document.querySelectorAll(".hs-focus").forEach(function(el){ el.classList.remove("hs-focus"); });
    }else{
      lastSig=""; refresh();
    }
    syncPromptBanners();
    if(persist){ try{ localStorage.setItem(STORE_KEY, on?"1":"0"); }catch(e){} }
  }

  function injectToggle(){
    var target=document.querySelector(".app-header");
    if(!target||document.getElementById("hs-assist-toggle")) return;
    var t=document.createElement("div");
    t.id="hs-assist-toggle"; t.className="hs-assist-toggle"; t.setAttribute("role","switch"); t.setAttribute("aria-checked","false");
    t.title=L().toggleTitle||"";
    t.innerHTML='<span class="hs-switch"></span><span>Mode assistant</span>';
    t.addEventListener("click", function(){
      setActive(!document.body.classList.contains("hs-assist-on"), true);
    });
    target.appendChild(t);
  }

  function injectPanel(){
    if(document.getElementById("hs-panel")) return;
    var p=document.createElement("aside");
    p.id="hs-panel"; p.className="hs-panel";
    p.innerHTML=
      '<div class="hs-resize" id="hs-resize" title="Glisser pour redimensionner"></div>'+
      '<div class="hs-panel-head"><h2>'+(L().panelTitle||'')+'</h2>'+
        '<button class="hs-panel-off" id="hs-panel-off">'+(L().disable||'')+'</button></div>'+
      '<div class="hs-panel-body" id="hs-panel-body" tabindex="0"></div>';
    document.body.appendChild(p);
    p.querySelector("#hs-panel-off").addEventListener("click", function(){ setActive(false, true); });
    setupResize(p.querySelector("#hs-resize"));
  }

  /* ── Redimensionnement (largeur en bureau, hauteur en tiroir) ── */
  function setupResize(handle){
    if(!handle) return;
    var vertical=false;
    function onMove(e){
      var root=document.documentElement;
      if(vertical){
        var h=window.innerHeight - e.clientY;
        h=Math.max(180, Math.min(window.innerHeight*0.8, h));
        root.style.setProperty("--hs-panel-h", h+"px");
      }else{
        var w=window.innerWidth - e.clientX;
        w=Math.max(280, Math.min(640, w));
        root.style.setProperty("--hs-panel-w", w+"px");
      }
    }
    function onUp(e){
      document.body.classList.remove("hs-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try{
        var root=document.documentElement;
        localStorage.setItem(STORE_W, root.style.getPropertyValue("--hs-panel-w")||"");
        localStorage.setItem(STORE_H, root.style.getPropertyValue("--hs-panel-h")||"");
      }catch(e2){}
    }
    handle.addEventListener("pointerdown", function(e){
      vertical = window.matchMedia("(max-width:1100px)").matches;
      document.body.classList.add("hs-resizing");
      e.preventDefault();
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  function loadSizes(){
    try{
      var root=document.documentElement;
      var w=localStorage.getItem(STORE_W), h=localStorage.getItem(STORE_H);
      if(w) root.style.setProperty("--hs-panel-w", w);
      if(h) root.style.setProperty("--hs-panel-h", h);
    }catch(e){}
  }

  function wrap(name){
    var orig=window[name];
    if(typeof orig!=="function"||orig.__hsWrapped) return;
    window[name]=function(){
      var r=orig.apply(this, arguments);
      setTimeout(refresh, 0);
      return r;
    };
    window[name].__hsWrapped=true;
  }

  function init(){
    loadSizes();
    injectToggle();
    injectPanel();
    ["selectType","updateUI","editQuestion","cancelEdit","removeQuestion"].forEach(wrap);
    if(isV4()){
      ["openConfigPanel","closeConfigPanel","saveConfig","renumberChips","removeChip"].forEach(wrap);
    }
    var nameEl=document.getElementById("quiz-name");
    if(nameEl){ nameEl.addEventListener("input", refresh); nameEl.addEventListener("change", refresh); }
    setInterval(function(){ refresh(); syncPromptBanners(); }, 800);
    document.addEventListener("i18n:changed", function(){
      var tog=document.getElementById("hs-assist-toggle");
      if(tog){ tog.title=L().toggleTitle||""; var lab=tog.querySelector("span:last-child"); if(lab) lab.textContent=L().toggle||""; }
      var h=document.querySelector("#hs-panel .hs-panel-head h2");
      if(h){ h.innerHTML=""+(L().panelTitle||""); }
      var off=document.getElementById("hs-panel-off"); if(off) off.textContent=L().disable||"";
      lastSig=""; refresh(); syncPromptBanners();
    });
    var pref="1";
    try{ var s=localStorage.getItem(STORE_KEY); if(s!==null) pref=s; }catch(e){}
    setActive(pref==="1", false);
  }

  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", init); }
  else{ init(); }
})();
