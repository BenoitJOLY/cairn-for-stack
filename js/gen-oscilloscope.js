/* ══════════════════════════════════════════════════════════════
   HÉSTACK — Générateur Oscilloscope (JSXGraph, thème clair)
   Basé sur les exports Moodle de référence (test/mise à jour/Physique-chimie/Oscilloscope)
   Écran : 10×8 divisions  x∈[-5,5]  y∈[-4,4] — vrais boutons, curseurs togglables,
   réponses en 2 champs "units" (grandeur + unité), PRT diagnostique multi-nœuds.
   ══════════════════════════════════════════════════════════════ */

/* ── Listes de sensibilités (identiques au GeoGebra d'origine) ── */
var OSC_SV = [0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
var OSC_SH = [5e-7,1e-6,2e-6,5e-6,1e-5,2e-5,5e-5,
              1e-4,2e-4,5e-4,1e-3,2e-3,5e-3,
              1e-2,2e-2,5e-2,0.1,0.2,0.5];

/* ── UI helpers (appelés par le panel) ── */
function oscModeChange(){
  var mode = document.getElementById('osc-mode').value;
  document.getElementById('osc-pf-params').style.display     = (mode==='periode_frequence') ? '' : 'none';
  document.getElementById('osc-rc-params').style.display     = (mode==='rc_charge'||mode==='rc_decharge') ? '' : 'none';
  document.getElementById('osc-retard-params').style.display  = (mode==='retard') ? '' : 'none';
  oscUpdateShSvAuto();
}

function oscFreqModeChange(){
  var fm = document.getElementById('osc-freq-mode').value;
  document.getElementById('osc-freq-fixed-row').style.display = (fm==='fixed') ? '' : 'none';
  oscUpdateShSvAuto();
}

function oscAutoToggle(which){
  var ck  = document.getElementById('osc-'+which+'-auto');
  var sel = document.getElementById('osc-'+which+'-idx');
  if(!ck||!sel) return;
  sel.disabled = ck.checked;
  if(ck.checked) oscUpdateShSvAuto();
}

function oscUpdateShSvAuto(){
  var mode   = document.getElementById('osc-mode').value;
  var autoSH = document.getElementById('osc-sh-auto') && document.getElementById('osc-sh-auto').checked;
  var autoSV = document.getElementById('osc-sv-auto') && document.getElementById('osc-sv-auto').checked;
  if(!autoSH && !autoSV) return;

  var shIdx, svIdx;
  if(mode==='rc_charge'||mode==='rc_decharge'){
    var tauBase = parseFloat(document.getElementById('osc-tau-base').value)||1000;
    var tau_s   = tauBase/1e6;
    var evBase  = parseFloat(document.getElementById('osc-evolt-base').value)||2000;
    var ev_v    = evBase/1000;
    var tgt=tau_s/2; shIdx=12;
    for(var i=0;i<OSC_SH.length;i++) if(OSC_SH[i]<=tgt) shIdx=i;
    tgt=ev_v/3; svIdx=7;
    for(var i=0;i<OSC_SV.length;i++) if(OSC_SV[i]<=tgt) svIdx=i;
  } else if(mode==='retard'){
    var fc = parseFloat(document.getElementById('osc-fcarrier').value)||4000000;
    var T=1/fc, tgt=T/2; shIdx=2;
    for(var i=0;i<OSC_SH.length;i++) if(OSC_SH[i]<=tgt) shIdx=i;
    svIdx=6;
  } else {
    var fm   = document.getElementById('osc-freq-mode').value;
    var fHz  = (fm==='alea') ? 500 : (parseFloat(document.getElementById('osc-ffreq').value)||500);
    var umax = parseFloat(document.getElementById('osc-umax').value)||3;
    var T=1/fHz, tgt=T/4; shIdx=10;
    for(var i=0;i<OSC_SH.length;i++) if(OSC_SH[i]<=tgt) shIdx=i;
    tgt=umax/3; svIdx=7;
    for(var i=0;i<OSC_SV.length;i++) if(OSC_SV[i]<=tgt) svIdx=i;
  }
  if(autoSH){
    var selSH = document.getElementById('osc-sh-idx');
    if(selSH) selSH.value = shIdx;
  }
  if(autoSV){
    var selSV = document.getElementById('osc-sv-idx');
    if(selSV) selSV.value = svIdx;
  }
}

/* ══════════════════════════════════════════════════════════════
   Fond d'écran clair + grille (identique aux 4 familles de référence)
   ══════════════════════════════════════════════════════════════ */
function _oscLightBoardJS(){
  return 'var bd=JXG.JSXGraph.initBoard(divid,{\n'
  + '  boundingbox:[-5.4,4.5,5.4,-4.8],\n'
  + '  axis:false,grid:false,\n'
  + '  showNavigation:false,showCopyright:false,\n'
  + '  pan:{enabled:false},zoom:{enabled:false}\n'
  + '});\n'
  + 'bd.create("polygon",[[-5,-4],[5,-4],[5,4],[-5,4]],\n'
  + '  {fillColor:"#ffffff",fillOpacity:1,strokeWidth:0,\n'
  + '  fixed:true,layer:0,highlight:false, vertices:{visible:false, fixed:true}, borders:{visible:false}});\n'
  + 'bd.create("segment",[[-5,-4],[5,-4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});\n'
  + 'bd.create("segment",[[5,-4],[5,4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});\n'
  + 'bd.create("segment",[[5,4],[-5,4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});\n'
  + 'bd.create("segment",[[-5,4],[-5,-4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});\n'
  + 'var gs={strokeColor:"#e5e7eb",strokeWidth:0.8,fixed:true,layer:1,highlight:false};\n'
  + 'var gc={strokeColor:"#d1d5db",strokeWidth:1.2,fixed:true,layer:1,highlight:false};\n'
  + 'var ts={strokeColor:"#9ca3af",strokeWidth:0.55,fixed:true,layer:1,highlight:false};\n'
  + 'for(var xi=-4;xi<=4;xi++) bd.create("segment",[[xi,-4],[xi,4]],xi===0?gc:gs);\n'
  + 'for(var yi=-3;yi<=3;yi++) bd.create("segment",[[-5,yi],[5,yi]],yi===0?gc:gs);\n'
  + 'bd.create("segment",[[-5,0],[5,0]],gc);\n'
  + 'bd.create("segment",[[0,-4],[0,4]],gc);\n'
  + 'for(var xt=-5;xt<=5.01;xt+=0.2)\n'
  + '  if(Math.abs(xt%1)>0.05) bd.create("segment",[[xt,-0.07],[xt,0.07]],ts);\n'
  + 'for(var yt=-4;yt<=4.01;yt+=0.2)\n'
  + '  if(Math.abs(yt%1)>0.05) bd.create("segment",[[-0.07,yt],[0.07,yt]],ts);\n';
}

/* Curseurs violets (X, temps) + rouges (Y, tension) — cachés, togglables via boutons */
function _oscCursorsJS(){
  return 'var cA=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var cB=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var segPA=bd.create("segment",[function(){return[cA.X(),-4];},function(){return[cA.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segPB=bd.create("segment",[function(){return[cB.X(),-4];},function(){return[cB.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtP=bd.create("text",[0,3.6,function(){\n'
  + '  var dx=Math.abs(cB.X()-cA.X()),dts=dx*SH();\n'
  + '  return "\\u0394t="+fT(dts);\n'
  + '}],{fixed:false,color:"#7c3aed",fontSize:14,anchorX:"middle",layer:6,highlight:false, visible:false});\n'
  + 'var cD=bd.create("point",[0,0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var cE=bd.create("point",[0,0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var segRD=bd.create("segment",[function(){return[-5,cD.Y()];},function(){return[5,cD.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segRE=bd.create("segment",[function(){return[-5,cE.Y()];},function(){return[5,cE.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtR=bd.create("text",[4.5,3.2,function(){\n'
  + '  var dy=Math.abs(cD.Y()-cE.Y()),dv=dy*SV_R();\n'
  + '  return "\\u0394V="+fV(dv);\n'
  + '}],{fixed:false,color:"#dc2626",fontSize:14,anchorX:"right",layer:6,highlight:false, visible:false});\n'
  + 'function toggleGroup(arr) {\n'
  + '  var isVisible = arr[0].getAttribute("visible");\n'
  + '  arr.forEach(function(obj) { obj.setAttribute({visible: !isVisible}); });\n'
  + '}\n'
  + 'var purpleGroup = [cA, cB, segPA, segPB, txtP];\n'
  + 'var redGroup = [cD, cE, segRD, segRE, txtR];\n';
}

/* Style + fabrique de boutons (identique à la référence) */
function _oscCtrlStyleJS(){
  return 'var _oscStyle=document.createElement("style");\n'
  + '_oscStyle.textContent=\'.osc-btn{background:#ffffff;color:#374151;border:2px solid #6b7280;padding:5px 12px;cursor:pointer;border-radius:4px;font-size:15px;font-family:monospace;font-weight:bold;margin:0 2px;box-shadow: 0 1px 2px rgba(0,0,0,0.05);}.osc-btn:hover{background:#f3f4f6;border-color:#374151;}\';\n'
  + 'document.head.appendChild(_oscStyle);\n'
  + 'var ctrl=document.createElement("div");\n'
  + 'ctrl.style.cssText="position:absolute; bottom:0; left:0; width:100%; box-sizing:border-box; display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:8px 12px; background:rgba(255,255,255,0.95); border-top:2px solid #4b5563; z-index:100; user-select:none; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);";\n'
  + 'function mkL(t,c,w){ var s=document.createElement("span"); s.textContent=t; s.style.cssText="color:"+(c||"#374151")+";font-size:14px;font-family:monospace;font-weight:bold;display:inline-block;"+(w?"min-width:"+w+"px;text-align:center;":""); return s; }\n'
  + 'function mkS(){ var s=document.createElement("span"); s.style.cssText="border-left:1px solid #d1d5db;height:24px;display:inline-block;margin:0 6px;"; return s; }\n'
  + 'function mkB(t,c,fn){ var b=document.createElement("button"); b.className="osc-btn"; b.textContent=t; if(c){b.style.color=c; b.style.borderColor=c;} if(fn) b.addEventListener("click", fn); return b; }\n';
}

function _oscMountCtrlJS(){
  return 'var boardContainer=document.getElementById(divid);\n'
  + 'boardContainer.style.position="relative";\n'
  + 'boardContainer.appendChild(ctrl);\n';
}

/* ══════════════════════════════════════════════════════════════
   MODE 1 : Période / Fréquence (forme + fréquence paramétrables)
   cfg : {X, si, ti, um, freqExpr, typeExpr}
   ══════════════════════════════════════════════════════════════ */
function buildOscJSXCode_PeriodeFrequence(cfg){
  var SHL = JSON.stringify(OSC_SH), SVL = JSON.stringify(OSC_SV);
  return '[[jsxgraph width="775px" height="550px"]]\n'
  + '(function(){\n'
  + 'var lSH='+SHL+';\nvar lSV='+SVL+';\n'
  + 'var si='+cfg.si+',ti='+cfg.ti+',xp=0,yp=0;\n'
  + 'var fq=parseFloat("'+cfg.freqExpr+'");\n'
  + 'var um=parseFloat("'+cfg.umExpr+'");\n'
  + 'var typeCourbe=parseInt("'+cfg.typeExpr+'");\n'
  + 'function SV(){return lSV[si];}\nfunction SH(){return lSH[ti];}\nfunction SV_R(){return lSV[si];}\n'
  + 'function fV(v){return v<0.05?(v*1e3).toPrecision(3)+" mV":v+" V";}\n'
  + 'function fT(s){return s<5e-5?(s*1e6).toPrecision(3)+" \\u00B5s":s<0.05?(s*1e3).toPrecision(3)+" ms":s.toPrecision(3)+" s";}\n'
  + _oscLightBoardJS()
  + 'var phase=Math.random()*2*Math.PI;\n'
  + 'function phi0(){var T=fq>0?1/fq:0;return T>0?Math.PI/2+10*Math.PI*SH()/T:0;}\n'
  + 'function sinSig(xd){\n'
  + '  var T=fq>0?1/fq:0,s=SH(),sv=SV();\n  if(T<=0) return 0;\n'
  + '  var y=um/sv*Math.cos(2*Math.PI*s*(xd-xp)/T-phi0()+phase)+yp;\n'
  + '  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function carreSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td)%1+1)%1;\n'
  + '  var y=(ph<0.5?um:-um)/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function triSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td+0.25)%1+1)%1;\n'
  + '  var raw=ph<0.5?(-um+4*um*ph):(3*um-4*um*ph);\n'
  + '  var y=raw/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function carreRealSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td)%1+1)%1;\n'
  + '  var raw=um*Math.tanh(6*Math.sin(2*Math.PI*ph))/Math.tanh(6);\n'
  + '  var y=raw/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function triangleRealSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td+0.25)%1+1)%1;\n'
  + '  var tri=ph<0.5?(-um+4*um*ph):(3*um-4*um*ph);\n'
  + '  var raw=um*Math.tanh(2*tri/um)/Math.tanh(2);\n'
  + '  var y=raw/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function harmSig(xd){\n'
  + '  var T=fq>0?1/fq:0,s=SH(),sv=SV();\n  if(T<=0) return 0;\n'
  + '  var w=2*Math.PI*s*(xd-xp)/T-phi0()+phase;\n'
  + '  var raw=Math.cos(w)+0.30*Math.cos(3*w+Math.PI/6)+0.15*Math.cos(5*w+Math.PI/3);\n'
  + '  var y=um*raw/1.45/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function sawSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td)%1+1)%1;\n'
  + '  var raw=-um+2*um*ph;\n'
  + '  var y=raw/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'var paliersLevels=null;\n'
  + 'function getPaliersLevels(){\n'
  + '  if(!paliersLevels){\n'
  + '    var n=5+Math.floor(Math.random()*4);\n'
  + '    paliersLevels=[];\n'
  + '    for(var i=0;i<n;i++) paliersLevels.push(-um+Math.random()*2*um);\n'
  + '  }\n'
  + '  return paliersLevels;\n'
  + '}\n'
  + 'function paliersSig(xd){\n'
  + '  var s=SH(),sv=SV(),T=fq>0?1/fq:0;\n  if(T<=0) return yp;\n'
  + '  var Td=T/s, ph=(((xd-xp)/Td)%1+1)%1;\n'
  + '  var lv=getPaliersLevels();\n'
  + '  var idx=Math.min(lv.length-1, Math.floor(ph*lv.length));\n'
  + '  var y=lv[idx]/sv+yp;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'var sigFunc;\nif(typeCourbe===1) sigFunc=sinSig; else if(typeCourbe===2) sigFunc=carreSig; else if(typeCourbe===3) sigFunc=triSig; else if(typeCourbe===4) sigFunc=carreRealSig; else if(typeCourbe===5) sigFunc=triangleRealSig; else if(typeCourbe===6) sigFunc=harmSig; else if(typeCourbe===7) sigFunc=sawSig; else sigFunc=paliersSig;\n'
  + 'bd.create("functiongraph",[sigFunc,-5,5],\n'
  + '  {strokeColor:"#2563eb",strokeWidth:3,layer:3,highlight:false,fixed:true, numberPoints:4000, doAdvancedPlot:false});\n'
  + 'var lbSH=bd.create("text",[4.9,3.6,function(){return fT(SH())+"/div";}],\n'
  + '  {fixed:true,color:"#1f2937",fontSize:13,anchorX:"right",layer:4,highlight:false});\n'
  + 'var lbSV=bd.create("text",[-4.7,3.6,function(){return fV(SV())+"/div";}],\n'
  + '  {fixed:true,color:"#1f2937",fontSize:13,layer:4,highlight:false});\n'
  + _oscCursorsJS()
  + _oscCtrlStyleJS()
  + 'var lblV=mkL("","#374151","65px"), lblT=mkL("","#374151","75px");\n'
  + 'ctrl.appendChild(mkL("V/div","#dc2626","45px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#dc2626",function(){si=Math.max(0,si-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblV);\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#dc2626",function(){si=Math.min(lSV.length-1,si+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("t/div","#2563eb","45px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#2563eb",function(){ti=Math.max(0,ti-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblT);\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#2563eb",function(){ti=Math.min(lSH.length-1,ti+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("XPOS","#7c3aed","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#7c3aed",function(){xp=Math.max(-5,parseFloat((xp-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#7c3aed",function(){xp=Math.min(5,parseFloat((xp+0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("YPOS","#d97706","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#d97706",function(){yp=Math.max(-4,parseFloat((yp-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#d97706",function(){yp=Math.min(4,parseFloat((yp+0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkB("\\u25A0 X","#7c3aed",function(){ toggleGroup(purpleGroup); }));\n'
  + 'ctrl.appendChild(mkB("\\u25A0 Y","#dc2626",function(){ toggleGroup(redGroup); }));\n'
  + _oscMountCtrlJS()
  + 'var _ou=bd.update.bind(bd);\n'
  + 'bd.update=function(){_ou();lblV.textContent=fV(SV());lblT.textContent=fT(SH());};\n'
  + 'bd.update();\n'
  + '})();\n[[/jsxgraph]]';
}

/* ══════════════════════════════════════════════════════════════
   MODE 2/3 : Charge / Décharge RC
   cfg : {si, ti, evExpr, tauExpr, decharge:bool}
   ══════════════════════════════════════════════════════════════ */
function buildOscJSXCode_RC(cfg){
  var SHL = JSON.stringify(OSC_SH), SVL = JSON.stringify(OSC_SV);
  var sigBody = cfg.decharge
    ? 'var y = t>=0 ? ev/sv*(Math.exp(-t/ta))+yp : ev/sv+yp;'
    : 'var y = t>=0 ? ev/sv*(1-Math.exp(-t/ta))+yp : 0+yp;';
  return '[[jsxgraph width="775px" height="550px"]]\n'
  + '(function(){\n'
  + 'var lSH='+SHL+';\nvar lSV='+SVL+';\n'
  + 'var si='+cfg.si+', ti='+cfg.ti+', yp=0, xp=0;\n'
  + 'var ev=parseFloat("'+cfg.evExpr+'")/1000;\n'
  + 'var ta=parseFloat("'+cfg.tauExpr+'")/1000000;\n'
  + 'function SV(){return lSV[si];}\nfunction SH(){return lSH[ti];}\nfunction SV_R(){return lSV[si];}\n'
  + 'function fV(v){return v<0.05?(v*1e3).toPrecision(3)+" mV":v+" V";}\n'
  + 'function fT(s){return s<5e-5?(s*1e6).toPrecision(3)+" \\u00B5s":s<0.05?(s*1e3).toPrecision(3)+" ms":s.toPrecision(3)+" s";}\n'
  + _oscLightBoardJS()
  + 'function rcSig(xd){var t=(xd+5-xp)*SH(),sv=SV(); '+sigBody+' return y>4?4:y<-4?-4:y;}\n'
  + 'bd.create("functiongraph",[rcSig,-5,5],{strokeColor:"#2563eb",strokeWidth:3,layer:3,highlight:false,fixed:true, numberPoints:150, doAdvancedPlot:false});\n'
  + 'var lbSH=bd.create("text",[4.9,3.6,function(){return fT(SH())+"/div";}],{fixed:true,color:"#1f2937",fontSize:13,anchorX:"right",layer:4,highlight:false});\n'
  + 'var lbSV=bd.create("text",[-4.7,3.6,function(){return fV(SV())+"/div";}],{fixed:true,color:"#1f2937",fontSize:13,layer:4,highlight:false});\n'
  + 'var cA=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var cB=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var segPA=bd.create("segment",[function(){return[cA.X(),-4];},function(){return[cA.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segPB=bd.create("segment",[function(){return[cB.X(),-4];},function(){return[cB.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtP=bd.create("text",[0,3.4,function(){var dx=Math.abs(cB.X()-cA.X()),dts=dx*SH(); return "\\u0394t="+fT(dts);}],{fixed:false,color:"#7c3aed",fontSize:14,anchorX:"middle",layer:6,highlight:false, visible:false});\n'
  + 'var cD=bd.create("point",[0, 0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var cE=bd.create("point",[0, 0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var segRD=bd.create("segment",[function(){return[-5,cD.Y()];},function(){return[5,cD.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segRE=bd.create("segment",[function(){return[-5,cE.Y()];},function(){return[5,cE.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtR=bd.create("text",[4.5,3.2,function(){var dy=Math.abs(cD.Y()-cE.Y()),dv=dy*SV(); return "\\u0394V="+fV(dv);}],{fixed:false,color:"#dc2626",fontSize:14,anchorX:"right",layer:6,highlight:false, visible:false});\n'
  + 'function toggleGroup(arr) {var isVisible = arr[0].getAttribute("visible"); arr.forEach(function(obj) { obj.setAttribute({visible: !isVisible}); });}\n'
  + 'var purpleGroup = [cA, cB, segPA, segPB, txtP];\nvar redGroup = [cD, cE, segRD, segRE, txtR];\n'
  + _oscCtrlStyleJS()
  + 'var lblV=mkL("","#374151","65px"), lblT=mkL("","#374151","75px");\n'
  + 'ctrl.appendChild(mkL("V/div","#dc2626","45px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#dc2626",function(){si=Math.max(0,si-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblV);\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#dc2626",function(){si=Math.min(lSV.length-1,si+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("t/div","#2563eb","45px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#2563eb",function(){ti=Math.max(0,ti-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblT);\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#2563eb",function(){ti=Math.min(lSH.length-1,ti+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkL("XPOS","#7c3aed","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#7c3aed",function(){xp=Math.max(-5,parseFloat((xp-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#7c3aed",function(){xp=Math.min(5,parseFloat((xp+0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("YPOS","#d97706","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#d97706",function(){yp=Math.max(-4,parseFloat((yp-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#d97706",function(){yp=Math.min(4,parseFloat((yp+0.5).toFixed(1)));bd.update();}));\n'
  + 'var spacer=document.createElement("div"); spacer.style.cssText="flex-grow:1;"; ctrl.appendChild(spacer);\n'
  + 'ctrl.appendChild(mkB("\\u25A0 X","#7c3aed",function(){ toggleGroup(purpleGroup); }));\n'
  + 'ctrl.appendChild(mkB("\\u25A0 Y","#dc2626",function(){ toggleGroup(redGroup); }));\n'
  + _oscMountCtrlJS()
  + 'var _ou=bd.update.bind(bd);\nbd.update=function(){ _ou(); lblV.textContent=fV(SV()); lblT.textContent=fT(SH()); };\nbd.update();\n'
  + '})();\n[[/jsxgraph]]';
}

/* ══════════════════════════════════════════════════════════════
   MODE 4 : Retard ultrasonore (2 voies, salves)
   cfg : {siA, siB, ti, fcExpr, dtExpr}
   ══════════════════════════════════════════════════════════════ */
function buildOscJSXCode_Retard(cfg){
  var SHL = JSON.stringify(OSC_SH), SVL = JSON.stringify(OSC_SV);
  return '[[jsxgraph width="775px" height="550px"]]\n'
  + '(function(){\n'
  + 'var lSH='+SHL+';\nvar lSV='+SVL+';\n'
  + 'var siA='+cfg.siA+', siB='+cfg.siB+', ti='+cfg.ti+', xp=0, ypA=0, ypB=0;\n'
  + 'var fc=parseFloat("'+cfg.fcExpr+'");\n'
  + 'var dt=parseFloat("'+cfg.dtExpr+'");\n'
  + 'var a1=0.7, a2=0.2;\n'
  + 'function SV_A(){return lSV[siA];}\nfunction SV_B(){return lSV[siB];}\nfunction SH(){return lSH[ti];}\n'
  + 'function fV(v){return v<0.05?(v*1e3).toPrecision(3)+" mV":v+" V";}\n'
  + 'function fT(s){return s<5e-5?(s*1e6).toPrecision(3)+" \\u00B5s":s<0.05?(s*1e3).toPrecision(3)+" ms":s.toPrecision(3)+" s";}\n'
  + _oscLightBoardJS()
  + 'var nc=6;\nvar tBurst=nc/fc;\nvar t0_ch1=-tBurst*0.25;\n'
  + 'function burst(t){\n'
  + '  var halfT=tBurst*0.6;\n  if(Math.abs(t)>halfT) return 0;\n'
  + '  var env=Math.cos(Math.PI*t/halfT);\n  return env*env;\n}\n'
  + 'function ch1Sig(xd){\n'
  + '  var s=SH(), sv=SV_A();\n  var t=(xd-xp)*s-t0_ch1;\n'
  + '  var y=a1*burst(t)*Math.sin(2*Math.PI*fc*t)/sv+ypA;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'function ch2Sig(xd){\n'
  + '  var s=SH(), sv=SV_B();\n  var t=(xd-xp)*s-t0_ch1-dt;\n'
  + '  var y=a2*burst(t)*Math.sin(2*Math.PI*fc*t)/sv+ypB;\n  return y>4?4:y<-4?-4:y;\n}\n'
  + 'bd.create("functiongraph",[ch1Sig,-5,5],{strokeColor:"#2563eb",strokeWidth:2.5,layer:3,highlight:false,fixed:true, numberPoints:8000, doAdvancedPlot:false});\n'
  + 'bd.create("functiongraph",[ch2Sig,-5,5],{strokeColor:"#dc2626",strokeWidth:2.5,layer:3,highlight:false,fixed:true, numberPoints:8000, doAdvancedPlot:false});\n'
  + 'var lbSH=bd.create("text",[4.9,3.6,function(){return fT(SH())+"/div";}],{fixed:true,color:"#1f2937",fontSize:13,anchorX:"right",layer:4,highlight:false});\n'
  + 'var lbSV_A=bd.create("text",[-4.7,3.6,function(){return fV(SV_A())+"/div";}],{fixed:true,color:"#2563eb",fontSize:13,layer:4,highlight:false});\n'
  + 'var lbSV_B=bd.create("text",[-4.7,3.2,function(){return fV(SV_B())+"/div";}],{fixed:true,color:"#dc2626",fontSize:13,layer:4,highlight:false});\n'
  + 'var cA=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var cB=bd.create("point",[-4.5,0],{size:7,fillColor:"#a855f7",strokeColor:"#a855f7",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["x"]});\n'
  + 'var segPA=bd.create("segment",[function(){return[cA.X(),-4];},function(){return[cA.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segPB=bd.create("segment",[function(){return[cB.X(),-4];},function(){return[cB.X(),4];}],{strokeColor:"#a855f7",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtP=bd.create("text",[0,3.6,function(){\n'
  + '  var dx=Math.abs(cB.X()-cA.X()),dts=dx*SH();\n  return "\\u0394t="+fT(dts);\n'
  + '}],{fixed:false,color:"#7c3aed",fontSize:14,anchorX:"middle",layer:6,highlight:false, visible:false});\n'
  + 'var cD=bd.create("point",[0,0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var cE=bd.create("point",[0,0],{size:7,fillColor:"#ef4444",strokeColor:"#ef4444",name:"",layer:5,showInfobox:false,label:{visible:false}, visible:false, drag: ["y"]});\n'
  + 'var segRD=bd.create("segment",[function(){return[-5,cD.Y()];},function(){return[5,cD.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var segRE=bd.create("segment",[function(){return[-5,cE.Y()];},function(){return[5,cE.Y()];}],{strokeColor:"#ef4444",strokeWidth:1.5,dash:3,layer:5,highlight:false, visible:false});\n'
  + 'var txtR=bd.create("text",[4.5,3.2,function(){\n'
  + '  var dy=Math.abs(cD.Y()-cE.Y()),dv=dy*SV_A();\n  return "\\u0394V="+fV(dv);\n'
  + '}],{fixed:false,color:"#dc2626",fontSize:14,anchorX:"right",layer:6,highlight:false, visible:false});\n'
  + 'function toggleGroup(arr) {\n  var isVisible=arr[0].getAttribute("visible");\n  arr.forEach(function(obj) { obj.setAttribute({visible: !isVisible}); });\n}\n'
  + 'var purpleGroup=[cA, cB, segPA, segPB, txtP];\nvar redGroup=[cD, cE, segRD, segRE, txtR];\n'
  + _oscCtrlStyleJS()
  + 'var lblVA=mkL("","#2563eb","65px");\n'
  + 'ctrl.appendChild(mkL("V/div A","#2563eb","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#2563eb",function(){siA=Math.max(0,siA-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblVA);\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#2563eb",function(){siA=Math.min(lSV.length-1,siA+1);bd.update();}));\n'
  + 'var lblVB=mkL("","#dc2626","65px");\n'
  + 'ctrl.appendChild(mkL("V/div B","#dc2626","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#dc2626",function(){siB=Math.max(0,siB-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblVB);\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#dc2626",function(){siB=Math.min(lSV.length-1,siB+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'var lblT=mkL("","#374151","75px");\n'
  + 'ctrl.appendChild(mkL("t/div","#2563eb","45px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#2563eb",function(){ti=Math.max(0,ti-1);bd.update();}));\n'
  + 'ctrl.appendChild(lblT);\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#2563eb",function(){ti=Math.min(lSH.length-1,ti+1);bd.update();}));\n'
  + 'ctrl.appendChild(mkL("XPOS","#7c3aed","50px"));\n'
  + 'ctrl.appendChild(mkB("\\u25C4","#7c3aed",function(){xp=Math.max(-5,parseFloat((xp-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25BA","#7c3aed",function(){xp=Math.min(5,parseFloat((xp+0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkS());\n'
  + 'ctrl.appendChild(mkL("Y A","#2563eb","35px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#2563eb",function(){ypA=Math.max(-4,parseFloat((ypA-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#2563eb",function(){ypA=Math.min(4,parseFloat((ypA+0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkL("Y B","#dc2626","35px"));\n'
  + 'ctrl.appendChild(mkB("\\u25BC","#dc2626",function(){ypB=Math.max(-4,parseFloat((ypB-0.5).toFixed(1)));bd.update();}));\n'
  + 'ctrl.appendChild(mkB("\\u25B2","#dc2626",function(){ypB=Math.min(4,parseFloat((ypB+0.5).toFixed(1)));bd.update();}));\n'
  + 'var spacer=document.createElement("div"); spacer.style.cssText="flex-grow:1;"; ctrl.appendChild(spacer);\n'
  + 'ctrl.appendChild(mkB("X","#a855f7",function(){ toggleGroup(purpleGroup); }));\n'
  + 'ctrl.appendChild(mkB("V","#ef4444",function(){ toggleGroup(redGroup); }));\n'
  + _oscMountCtrlJS()
  + 'var _ou=bd.update.bind(bd);\n'
  + 'bd.update=function(){\n  _ou();\n  lblVA.textContent=fV(SV_A());\n  lblVB.textContent=fV(SV_B());\n  lblT.textContent=fT(SH());\n};\n'
  + 'bd.update();\n'
  + '})();\n[[/jsxgraph]]';
}

/* ── Encart de conseils de saisie (units) ── */
function _oscInputHintsHTML(exList){
  return '<div style="background:#f8f9fa;border:1px solid #dee2e6;padding:15px;border-radius:8px;margin:15px 0;">'
    + '<strong>Conseils pour la saisie :</strong>'
    + '<ul style="margin:8px 0 0 20px;line-height:1.7">'
    + '<li>La virgule se note avec un point (ex : <code>1.32</code>).</li>'
    + '<li><strong>Lier nombre et unité</strong> : reliez-les par <code>*</code> (ex : '+exList+').</li>'
    + '<li><strong>Unités usuelles</strong> : <code>s</code>, <code>ms</code>, <code>us</code> pour µs, <code>Hz</code>, <code>kHz</code>, <code>V</code>, <code>mV</code>.</li>'
    + '</ul></div>';
}

/* ── Bandeau titre (identique norme UI HéStack) ── */
function _oscHeader(X, bareme, title, tagBg, tagIcon, tagLabel){
  return '<div style="background:'+tagBg.bg+';border-left:5px solid '+tagBg.accent+';border-radius:0 8px 8px 0;'
    + 'padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q'+X+' — '+title+'</strong>'
    + '<span style="background:'+tagBg.accent+';color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ '+bareme+' pt</span>'
    + '<span style="background:#ffffff;color:'+tagBg.accent+';border:1px solid '+tagBg.accent+';padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">'+tagIcon+' '+tagLabel+'</span>'
    + '</div>';
}

/* ── Nœud PRT canonique (schéma buildPrtXml) ── */
function _oscNode(name, desc, test, sans, tans, testopt, tScoreMode, tScore, tNext, tNote, tFb, fScoreMode, fScore, fNext, fNote, fFb){
  return {
    name: name, description: desc, answertest: test, sans: sans, tans: tans,
    testoptions: testopt, quiet: '0',
    truescoremode: tScoreMode, truescore: String(tScore), truepenalty: '', truenextnode: String(tNext),
    trueanswernote: tNote, truefeedback: tFb,
    falsescoremode: fScoreMode, falsescore: String(fScore), falsepenalty: '', falsenextnode: String(fNext),
    falseanswernote: fNote, falsefeedback: fFb
  };
}
function _oscOk(txt){ return '<div style="border-left:4px solid #15803d;padding:8px 12px;background:#f0fdf4;border-radius:4px;margin-bottom:10px;">✅ '+txt+'</div>'; }
function _oscKo(txt){ return '<div style="border-left:4px solid #dc2626;padding:8px 12px;background:#fef2f2;border-radius:4px;margin-bottom:10px;">❌ '+txt+'</div>'; }
function _oscTrap(txt){ return '<div style="border-left:4px solid #ca8a04;padding:8px 12px;background:#fefce8;border-radius:4px;margin-bottom:10px;">🔶 '+txt+'</div>'; }

/* Structure simplifiée (Autonome/Expert) : 2 nœuds indépendants, un par grandeur,
   sans décomposition unité/piège. neutral=true (Expert) => feedback d'échec sans indice. */
function _oscSimplePair(idPrefix, q1, q2, neutral){
  var neutralFb = _oscKo('<p>Faux. Refaites votre mesure et votre calcul sur le brouillon.</p>');
  var fb1ok   = _oscOk('<strong>'+q1.label+' :</strong> Correcte.');
  var fb2ok   = _oscOk('<strong>'+q2.label+' :</strong> Correcte.');
  var fb1fail = neutral ? neutralFb : _oscKo('<strong>'+q1.label+' :</strong> Incorrecte. Vérifiez votre unité et votre valeur.');
  var fb2fail = neutral ? neutralFb : _oscKo('<strong>'+q2.label+' :</strong> Incorrecte. Vérifiez votre unité et votre valeur.');
  return [
    _oscNode('0','Vérification '+q1.label,'UnitsRelative',q1.sans,q1.tans,q1.testopt,'+',0.5,1,idPrefix+'-0-T',fb1ok,'-',0,1,idPrefix+'-0-F',fb1fail),
    _oscNode('1','Vérification '+q2.label,'UnitsRelative',q2.sans,q2.tans,q2.testopt,'+',0.5,-1,idPrefix+'-1-T',fb2ok,'-',0,-1,idPrefix+'-1-F',fb2fail)
  ];
}

/* ══════════════════════════════════════════════════════════════
   GÉNÉRATEUR PRINCIPAL — genOscilloscope(X)
   ══════════════════════════════════════════════════════════════ */
function genOscilloscope(X){
  var mode    = v('osc-mode') || 'periode_frequence';
  var pedMode = v('osc-ped-mode') || 'guide';
  var bareme = parseFloat(v('osc-bareme')) || 1;
  var text   = richVal('osc-text');
  var fbGen  = v('osc-fbgen');
  var shIdx  = parseInt(document.getElementById('osc-sh-idx').value);
  var svIdx  = parseInt(document.getElementById('osc-sv-idx').value);

  var vars='', jsx='', textFrag='', previewFrag='', inputXML='', qnote='', genFb='', canonicalNodes=[], prtValue=bareme;

  if(mode==='periode_frequence'){
    var forme    = v('osc-forme') || 'aleatoire';
    var freqMode = v('osc-freq-mode') || 'fixed';
    var ffreq    = parseFloat(v('osc-ffreq')) || 500;
    var umax     = parseFloat(v('osc-umax'))  || 3;

    var typeExpr, typeTextExpr;
    if(forme==='sinus'){ typeExpr='1'; }
    else if(forme==='carre'){ typeExpr='2'; }
    else if(forme==='triangle'){ typeExpr='3'; }
    else if(forme==='carre_reel'){ typeExpr='4'; }
    else if(forme==='triangle_reel'){ typeExpr='5'; }
    else if(forme==='harmoniques'){ typeExpr='6'; }
    else if(forme==='dents_scie'){ typeExpr='7'; }
    else if(forme==='paliers'){ typeExpr='8'; }
    else { typeExpr='1+rand(8)'; }

    vars = '/* Q'+X+' : Oscilloscope — Période/Fréquence ('+bareme+'pt) */\n'
      + 'ta'+X+'_type_val: '+typeExpr+';\n'
      + 'ta'+X+'_type_text: if ta'+X+'_type_val=1 then "sinusoïdale" else (if ta'+X+'_type_val=2 then "carrée" else (if ta'+X+'_type_val=3 then "triangulaire" else (if ta'+X+'_type_val=4 then "carrée (réaliste)" else (if ta'+X+'_type_val=5 then "triangulaire (réaliste)" else (if ta'+X+'_type_val=6 then "déformée (harmoniques)" else (if ta'+X+'_type_val=7 then "en dents de scie" else "complexe à paliers"))))));\n'
      + (freqMode==='alea'
          ? 'ta'+X+'_liste_fq: [100, 200, 250, 500, 1000, 2000];\nta'+X+'_f: ta'+X+'_liste_fq[rand(length(ta'+X+'_liste_fq))+1];\n'
          : 'ta'+X+'_f: '+ffreq+';\n')
      + 'ta'+X+'_um: '+umax+';\n'
      + 'ta'+X+'_fq: stackunits(ta'+X+'_f, Hz);\n'
      + 'ta'+X+'_fq_unit: stack_units_units(ta'+X+'_fq);\n'
      + 'ta'+X+'_fq_nums: stack_units_nums(ta'+X+'_fq);\n'
      + 'ta'+X+'_T_unit: stack_unit_si_to_si_base(1/ta'+X+'_fq_unit);\n'
      + 'ta'+X+'_T_nums: 1/ta'+X+'_fq_nums;\n'
      + 'ta'+X+'_T: stackunits(ta'+X+'_T_nums, ta'+X+'_T_unit);\n'
      + 'ta'+X+'_precision_T: 0.05;\n';

    jsx = buildOscJSXCode_PeriodeFrequence({
      si: svIdx, ti: shIdx,
      freqExpr: '{#ta'+X+'_f#}', umExpr: '{#ta'+X+'_um#}', typeExpr: '{#ta'+X+'_type_val#}'
    });

    var header = _oscHeader(X, bareme, 'Oscilloscope — Période et Fréquence', {bg:'#0c4a6e',accent:'#0369a1'}, '📏', 'Grandeur physique');
    textFrag = header
      + '<!-- ENONCE-START --><div style="margin-bottom:14px;">'
      + '<p><strong>Consigne :</strong> À l\'aide des curseurs (boutons <span style="color:#a855f7;font-weight:bold;">■ X</span> et <span style="color:#ef4444;font-weight:bold;">■ Y</span>), mesurez la période \\(T\\) de la tension <strong>{@ta'+X+'_type_text@}</strong>, puis en déduire sa fréquence \\(f\\).</p>'
      + (text||'') + '</div><!-- ENONCE-END -->\n'
      + '<div><!--HS-KBD:'+X+'--></div>\n'
      + _oscInputHintsHTML('<code>10*ms</code>')
      + '<p>1. Période \\(T\\) mesurée : [[input:ans_T'+X+']] [[validation:ans_T'+X+']]</p>\n'
      + '<p>2. Fréquence \\(f\\) déduite : [[input:ans_F'+X+']] [[validation:ans_F'+X+']]</p>';

    previewFrag = header
      + '<!-- ENONCE-START --><div style="margin-bottom:10px;">'+(text||'')+'</div><!-- ENONCE-END -->\n'
      + '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:20px;text-align:center;color:#1e3a5f;font-family:monospace;font-size:.85rem;">'
      + '📡 Oscilloscope JSXGraph (thème clair)<br>Forme : '+forme+' | Fréquence : '+(freqMode==='alea'?'aléatoire (liste)':ffreq+' Hz')
      + '</div>';

    inputXML = _oscUnitsInput('ans_T'+X, '1.0*ta'+X+'_T')
      + '\n' + _oscUnitsInput('ans_F'+X, 'ta'+X+'_fq');

    var fbv = '/* --- Traitement Période T --- */\n'
      + 'stud_si_T'+X+' : stack_unit_si_to_si_base(ans_T'+X+');\n'
      + 'teach_si_T'+X+' : ta'+X+'_T_unit;\n'
      + 'v_pure_e_T'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_T'+X+')), stud_si_T'+X+');\n'
      + 'v_pure_t_T'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_T'+X+')), teach_si_T'+X+');\n'
      + 'eleve_unit_T'+X+' : 2 * stud_si_T'+X+' / v_pure_e_T'+X+';\n'
      + 'teacher_unit_T'+X+' : 2 * teach_si_T'+X+' / v_pure_t_T'+X+';\n'
      + '/* --- Traitement Fréquence f --- */\n'
      + 'stud_si_F'+X+' : stack_unit_si_to_si_base(ans_F'+X+');\n'
      + 'teach_si_F'+X+' : ta'+X+'_fq_unit;\n'
      + 'v_pure_e_F'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_F'+X+')), stud_si_F'+X+');\n'
      + 'v_pure_t_F'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_F'+X+')), teach_si_F'+X+');\n'
      + 'eleve_unit_F'+X+' : 2 * stud_si_F'+X+' / v_pure_e_F'+X+';\n'
      + 'teacher_unit_F'+X+' : 2 * teach_si_F'+X+' / v_pure_t_F'+X+';\n';

    if(pedMode==='guide'){
      canonicalNodes = [
        _oscNode('0','Vérification de l\'unité de T','UnitsAbsolute','eleve_unit_T'+X,'teacher_unit_T'+X,'0','+',0.25,1,'prt'+X+'-0-T','','-',0,-1,'prt'+X+'-0-F',_oscKo('<strong>Période :</strong> Votre période est incorrecte car elle n\'a pas la bonne unité. L\'unité attendue en base SI était {@teacher_unit_T'+X+'/2@}.')),
        _oscNode('1','Vérification de la valeur de T (conversion unité)','UnitsRelative','ans_T'+X,'ta'+X+'_T','ta'+X+'_precision_T','+',0.25,2,'prt'+X+'-1-T',_oscOk('<strong>Période :</strong> Votre période est correcte'),'-',0,4,'prt'+X+'-1-F',_oscKo('<strong>Période :</strong> La valeur numérique ou la précision de votre période est incorrecte.')),
        _oscNode('2','Vérification de l\'unité de f','UnitsAbsolute','eleve_unit_F'+X,'teacher_unit_F'+X,'0','+',0.25,3,'prt'+X+'-2-T','','-',0,-1,'prt'+X+'-2-F',_oscKo('L\'unité de votre fréquence n\'est pas une unité admise. L\'unité attendue était : {@teacher_unit_F'+X+'/2@}.')),
        _oscNode('3','Vérification de la valeur de f','UnitsRelative','ans_F'+X,'ta'+X+'_fq','0.05','+',0.25,-1,'prt'+X+'-3-T',_oscOk('<strong>Bravo</strong> Votre fréquence est parfaitement exacte'),'-',0,-1,'prt'+X+'-3-F',_oscKo('La valeur numérique (ou la précision) de votre fréquence est incorrecte, vous avez dû faire une erreur de calcul.')),
        _oscNode('4','Unité de f dans le cas où T est faux','UnitsRelative','ans_F'+X,'ta'+X+'_fq','0','+',0,5,'prt'+X+'-4-T','','-',0,-1,'prt'+X+'-4-F',_oscKo('Votre unité de fréquence n\'est pas cohérente, elle ne correspond pas à une fréquence.')),
        _oscNode('5','Cohérence f = 1/T (réponse élève)','UnitsRelative','ans_F'+X,'1/ans_T'+X,'0.05','+',0,-1,'prt'+X+'-5-T',_oscTrap('Votre fréquence est cohérente par rapport à votre réponse sur la période mais ce n\'était pas la réponse attendue.'),'-',0,-1,'prt'+X+'-5-F',_oscKo('Votre fréquence n\'est pas logique par rapport à votre réponse précédente \\( f= \\frac {1}{T} \\)'))
      ];
    } else {
      canonicalNodes = _oscSimplePair('prt'+X,
        {label:'Période',   sans:'ans_T'+X, tans:'ta'+X+'_T',  testopt:'ta'+X+'_precision_T'},
        {label:'Fréquence', sans:'ans_F'+X, tans:'ta'+X+'_fq', testopt:'0.05'},
        pedMode==='expert');
    }

    qnote = 'Type: {@ta'+X+'_type_text@} | f={@ta'+X+'_f@} Hz, T={@ta'+X+'_T@}, f={@ta'+X+'_fq@}';
    genFb = '<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px;">'
      + '<div style="font-weight:bold; color:#0c4a6e; margin-bottom:10px;">🔑 Réponses attendues</div>'
      + '<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">'
      + '<span style="font-weight:bold;color:#0c4a6e;">Q1 Période :</span> <p>La période est le temps que met un phénomène cyclique à se reproduire à l\'identique. Sur cette tension {@ta'+X+'_type_text@}, avec les curseurs de temps on trouve T = {@1.0*ta'+X+'_T@}</p></div>'
      + '<div style="margin-bottom:8px;font-size:.9rem;">'
      + '<span style="font-weight:bold;color:#0c4a6e;">Q2 Fréquence :</span> <p>La fréquence est le nombre de fois qu\'un phénomène se reproduit par seconde, on la calcule avec \\[ f = \\frac{1}{T} \\]</p>'
      + '<p>On a donc \\[ f= \\frac {1}{ {@1.0*ta'+X+'_T@} }= {@ta'+X+'_fq@} \\]</p></div></div>';

    var prtMeta = { name:'prt'+X, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbv };
    return _oscFinalize(X, bareme, vars, qnote, textFrag, previewFrag, inputXML, prtMeta, canonicalNodes, genFb, fbGen, jsx);
  }

  if(mode==='rc_charge' || mode==='rc_decharge'){
    var decharge = (mode==='rc_decharge');
    var evBase  = parseFloat(v('osc-evolt-base')) || 2000;
    var evRange = parseFloat(v('osc-evolt-range')) || 1000;
    var tauBase = parseFloat(v('osc-tau-base')) || 1000;
    var tauRange= parseFloat(v('osc-tau-range')) || 1000;

    vars = '/* Q'+X+' : Oscilloscope — '+(decharge?'Décharge':'Charge')+' RC ('+bareme+'pt) */\n'
      + 'ta'+X+'_ev_val: '+evBase+' + rand('+evRange+');\n'
      + 'ta'+X+'_tau_val: '+tauBase+' + rand('+tauRange+');\n'
      + 'ta'+X+'_E: stackunits(ta'+X+'_ev_val, mV);\n'
      + 'ta'+X+'_tau: stackunits(ta'+X+'_tau_val, us);\n'
      + 'ta'+X+'_tau_unit: stack_units_units(ta'+X+'_tau);\n'
      + 'ta'+X+'_E_unit: stack_units_units(ta'+X+'_E);\n'
      + 'ta'+X+'_precision_q: 0.1;\n';

    jsx = buildOscJSXCode_RC({ si: svIdx, ti: shIdx, evExpr:'{#ta'+X+'_ev_val#}', tauExpr:'{#ta'+X+'_tau_val#}', decharge: decharge });

    var titre = decharge ? 'Oscilloscope — Décharge d\'un condensateur (RC)' : 'Oscilloscope — Charge d\'un condensateur (RC)';
    var header2 = _oscHeader(X, bareme, titre, {bg:'#0c4a6e',accent:'#0369a1'}, '📏', 'Grandeur physique');
    var consigneY = decharge
      ? 'Avec <span style="color:#ef4444;font-weight:bold;">■ Y</span>, mesurez l\'amplitude de la tension initiale \\(E\\) (entre le palier et la ligne du bas).'
      : 'Avec <span style="color:#ef4444;font-weight:bold;">■ Y</span>, mesurez l\'amplitude de la tension finale \\(E\\) (entre le palier et la ligne du bas).';
    var consigneTau = decharge
      ? 'Avec <span style="color:#a855f7;font-weight:bold;">■ X</span>, mesurez la constante de temps \\(\\tau\\) (entre l\'instant \\(t=0\\) et le point correspondant à 36,8% de \\(E\\)).'
      : 'Avec <span style="color:#a855f7;font-weight:bold;">■ X</span>, mesurez la constante de temps \\(\\tau\\) (entre l\'instant \\(t=0\\) et le point correspondant à 63,2% de \\(E\\)).';

    textFrag = header2
      + '<!-- ENONCE-START --><div style="margin-bottom:14px;">'
      + '<p>On visualise sur l\'oscilloscope la tension \\(u_C(t)\\) aux bornes d\'un condensateur lors de sa '+(decharge?'décharge':'charge')+'.</p>'
      + '<p><strong>Consigne :</strong><ul><li>'+consigneY+'</li><li>'+consigneTau+'</li></ul></p>'
      + (text||'') + '</div><!-- ENONCE-END -->\n'
      + '<div><!--HS-KBD:'+X+'--></div>\n'
      + _oscInputHintsHTML('<code>1500*us</code> pour µs')
      + '<p>1. Constante de temps \\( \\tau \\) du circuit : [[input:ans_tau'+X+']] [[validation:ans_tau'+X+']]</p>\n'
      + '<p>2. Tension '+(decharge?'initiale':'finale')+' \\( E \\) du générateur : [[input:ans_E'+X+']] [[validation:ans_E'+X+']]</p>';

    previewFrag = header2
      + '<!-- ENONCE-START --><div style="margin-bottom:10px;">'+(text||'')+'</div><!-- ENONCE-END -->\n'
      + '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:20px;text-align:center;color:#1e3a5f;font-family:monospace;font-size:.85rem;">'
      + '📡 Oscilloscope RC '+(decharge?'décharge':'charge')+' (thème clair)</div>';

    inputXML = _oscUnitsInput('ans_E'+X, 'ta'+X+'_E') + '\n' + _oscUnitsInput('ans_tau'+X, 'ta'+X+'_tau');

    var fbv2 = 'stud_si_tau'+X+' : stack_unit_si_to_si_base(ans_tau'+X+');\n'
      + 'teach_si_tau'+X+' : stack_unit_si_to_si_base(ta'+X+'_tau_unit);\n'
      + 'v_pure_e_tau'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_tau'+X+')), stud_si_tau'+X+');\n'
      + 'v_pure_t_tau'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_tau'+X+')), teach_si_tau'+X+');\n'
      + 'eleve_unit_tau'+X+' : 2 * stud_si_tau'+X+' / v_pure_e_tau'+X+';\n'
      + 'teacher_unit_tau'+X+' : 2 * teach_si_tau'+X+' / v_pure_t_tau'+X+';\n'
      + '/* --- Traitement E --- */\n'
      + 'stud_si_E'+X+' : stack_unit_si_to_si_base(ans_E'+X+');\n'
      + 'teach_si_E'+X+' : stack_unit_si_to_si_base(ta'+X+'_E_unit);\n'
      + 'v_pure_e_E'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_E'+X+')), stud_si_E'+X+');\n'
      + 'v_pure_t_E'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_E'+X+')), teach_si_E'+X+');\n'
      + 'eleve_unit_E'+X+' : 2 * stud_si_E'+X+' / v_pure_e_E'+X+';\n'
      + 'teacher_unit_E'+X+' : 2 * teach_si_E'+X+' / v_pure_t_E'+X+';\n';

    if(pedMode==='guide'){
      canonicalNodes = [
        _oscNode('0','Vérification de l\'unité de tau','UnitsAbsolute','eleve_unit_tau'+X,'teacher_unit_tau'+X,'0','+',0.25,1,'prt'+X+'-0-T','','-',0,-1,'prt'+X+'-0-F',_oscKo('<strong>Constante de temps :</strong> L\'unité est incorrecte (attendue en base SI : {@teacher_unit_tau'+X+'/2@}).')),
        _oscNode('1','Vérification de la valeur de tau','UnitsRelative','ans_tau'+X,'ta'+X+'_tau','ta'+X+'_precision_q','+',0.25,3,'prt'+X+'-1-T',_oscOk('<strong>Constante de temps :</strong> Correcte.'),'-',0,2,'prt'+X+'-1-F',''),
        _oscNode('2','Piège Tau — A-t-il mis E ?','UnitsRelative','ans_tau'+X,'ta'+X+'_E','ta'+X+'_precision_q','-',0,-1,'prt'+X+'-2-T',_oscTrap('<strong>Constante de temps :</strong> Vous avez entré la valeur de la tension \\(E\\) au lieu de la constante de temps \\(\\tau\\).'),'-',0,-1,'prt'+X+'-2-F',_oscKo('<strong>Constante de temps :</strong> La valeur numérique ou la précision est incorrecte. Mesurez précisément l\'abscisse correspondant à '+(decharge?'36,8%':'63,2%')+' de la tension.')),
        _oscNode('3','Vérification de l\'unité de E','UnitsAbsolute','eleve_unit_E'+X,'teacher_unit_E'+X,'0','+',0.25,4,'prt'+X+'-3-T','','-',0,-1,'prt'+X+'-3-F',_oscKo('<strong>Tension :</strong> L\'unité est incorrecte (attendue en base SI : {@teacher_unit_E'+X+'/2@}).')),
        _oscNode('4','Vérification de la valeur de E','UnitsRelative','ans_E'+X,'ta'+X+'_E','0.05','+',0.25,-1,'prt'+X+'-4-T',_oscOk('<strong>Tension :</strong> Correcte.'),'-',0,5,'prt'+X+'-4-F',''),
        _oscNode('5','Piège E — A-t-il mis tau ?','UnitsRelative','ans_E'+X,'ta'+X+'_tau','ta'+X+'_precision_q','-',0,-1,'prt'+X+'-5-T',_oscTrap('<strong>Tension :</strong> Vous avez entré la valeur de la constante de temps \\(\\tau\\) au lieu de la tension \\(E\\).'),'-',0,-1,'prt'+X+'-5-F',_oscKo('<strong>Tension :</strong> La valeur numérique ou la précision est incorrecte. Mesurez l\'écart entre le palier et la ligne du bas avec les curseurs Y.'))
      ];
    } else {
      canonicalNodes = _oscSimplePair('prt'+X,
        {label:'Constante de temps', sans:'ans_tau'+X, tans:'ta'+X+'_tau', testopt:'ta'+X+'_precision_q'},
        {label:'Tension',            sans:'ans_E'+X,   tans:'ta'+X+'_E',   testopt:'0.05'},
        pedMode==='expert');
    }

    qnote = 'E={@ta'+X+'_E@} | tau={@ta'+X+'_tau@}';
    genFb = '<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px;">'
      + '<div style="font-weight:bold; color:#0f766e; margin-bottom:10px;">🔑 Réponses attendues</div>'
      + '<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">'
      + '<span style="font-weight:bold;color:#0f766e;">Q1 Constante de temps :</span> <p>En mesurant entre \\(t=0\\) et le point correspondant à '+(decharge?'36,8%':'63,2%')+' de la tension, on trouve \\(\\tau\\) = {@ta'+X+'_tau@}.</p></div>'
      + '<div style="margin-bottom:8px;font-size:.9rem;">'
      + '<span style="font-weight:bold;color:#0f766e;">Q2 Tension '+(decharge?'initiale':'finale')+' :</span> <p>En mesurant le palier de tension avec les curseurs Y, on trouve \\(E\\) = {@ta'+X+'_E@}.</p></div></div>';

    var prtMeta2 = { name:'prt'+X, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbv2 };
    return _oscFinalize(X, bareme, vars, qnote, textFrag, previewFrag, inputXML, prtMeta2, canonicalNodes, genFb, fbGen, jsx);
  }

  /* mode === 'retard' */
  var fCarrier = parseFloat(v('osc-fcarrier')) || 4000000;
  var fMod     = parseFloat(v('osc-fmod'))     || 2000;
  var dtMin    = parseFloat(v('osc-dt-min'))   || 4;
  var dtMax    = parseFloat(v('osc-dt-max'))   || 8;

  vars = '/* Q'+X+' : Oscilloscope — Retard ultrasonore ('+bareme+'pt) */\n'
    + 'ta'+X+'_f_carrier_val: '+fCarrier+';\n'
    + 'ta'+X+'_f_mod_val: '+fMod+';\n'
    + 'ta'+X+'_dt_val: rand_with_step('+dtMin+', '+dtMax+', 1) * 0.000001;\n'
    + 'ta'+X+'_fc: stackunits(ta'+X+'_f_carrier_val, Hz);\n'
    + 'ta'+X+'_dt: stackunits(ta'+X+'_dt_val, s);\n'
    + 'ta'+X+'_fm: stackunits(ta'+X+'_f_mod_val, Hz);\n'
    + 'ta'+X+'_err_periode: stackunits(1/ta'+X+'_f_carrier_val, s);\n'
    + 'ta'+X+'_err_demi_periode: stackunits(1/(2*ta'+X+'_f_carrier_val), s);\n'
    + 'ta'+X+'_precision_q: 0.1;\n'
    + 'ta'+X+'_fc_unit: stack_units_units(ta'+X+'_fc);\n'
    + 'ta'+X+'_dt_unit: stack_units_units(ta'+X+'_dt);\n';

  jsx = buildOscJSXCode_Retard({ siA: svIdx, siB: Math.min(OSC_SV.length-1, svIdx+1), ti: shIdx, fcExpr:'{#ta'+X+'_f_carrier_val#}', dtExpr:'{#ta'+X+'_dt_val#}' });

  var header3 = _oscHeader(X, bareme, 'Oscilloscope — Propagation des Ultrasons', {bg:'#0f766e',accent:'#14b8a6'}, '📡', 'Ondes mécaniques');
  textFrag = header3
    + '<!-- ENONCE-START --><div style="margin-bottom:14px;">'
    + '<p><strong>Consigne :</strong> On visualise le signal de l\'émetteur (Voie A, <span style="color:#2563eb;font-weight:bold;">Bleu</span>) et le signal du récepteur (Voie B, <span style="color:#dc2626;font-weight:bold;">Rouge</span>).</p>'
    + '<p>À l\'aide des curseurs temporels (■ X), déterminez :</p>'
    + '<ol style="margin-left:20px;line-height:2;"><li>La fréquence des ultrasons émis \\(f\\).</li><li>Le retard temporel \\(\\Delta t\\) entre l\'émission et la réception.</li></ol>'
    + (text||'') + '</div><!-- ENONCE-END -->\n'
    + '<div><!--HS-KBD:'+X+'--></div>\n'
    + _oscInputHintsHTML('<code>25*us</code> pour µs')
    + '<p>1. Fréquence des ultrasons \\(f\\) : [[input:ans_fc'+X+']] [[validation:ans_fc'+X+']]</p>\n'
    + '<p>2. Retard temporel \\(\\Delta t\\) : [[input:ans_dt'+X+']] [[validation:ans_dt'+X+']]</p>';

  previewFrag = header3
    + '<!-- ENONCE-START --><div style="margin-bottom:10px;">'+(text||'')+'</div><!-- ENONCE-END -->\n'
    + '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:20px;text-align:center;color:#0f766e;font-family:monospace;font-size:.85rem;">📡 Oscilloscope — Retard ultrasonore (2 voies)</div>';

  inputXML = _oscUnitsInput('ans_dt'+X, 'ta'+X+'_dt') + '\n' + _oscUnitsInput('ans_fc'+X, 'ta'+X+'_fc');

  var fbv3 = '/* --- Traitement Fréquence f --- */\n'
    + 'stud_si_f'+X+' : stack_unit_si_to_si_base(ans_fc'+X+');\n'
    + 'teach_si_f'+X+' : ta'+X+'_fc_unit;\n'
    + 'v_pure_e_f'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_f'+X+')), stud_si_f'+X+');\n'
    + 'v_pure_t_f'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_f'+X+')), teach_si_f'+X+');\n'
    + 'eleve_unit_f'+X+' : 2 * stud_si_f'+X+' / v_pure_e_f'+X+';\n'
    + 'teacher_unit_f'+X+' : 2 * teach_si_f'+X+' / v_pure_t_f'+X+';\n'
    + '/* --- Traitement Retard dt --- */\n'
    + 'stud_si_dt'+X+' : stack_unit_si_to_si_base(ans_dt'+X+');\n'
    + 'teach_si_dt'+X+' : ta'+X+'_dt_unit;\n'
    + 'v_pure_e_dt'+X+' : subst(map(lambda([u], u=1), listofvars(stud_si_dt'+X+')), stud_si_dt'+X+');\n'
    + 'v_pure_t_dt'+X+' : subst(map(lambda([u], u=1), listofvars(teach_si_dt'+X+')), teach_si_dt'+X+');\n'
    + 'eleve_unit_dt'+X+' : 2 * stud_si_dt'+X+' / v_pure_e_dt'+X+';\n'
    + 'teacher_unit_dt'+X+' : 2 * teach_si_dt'+X+' / v_pure_t_dt'+X+';\n';

  if(pedMode==='guide'){
    canonicalNodes = [
      _oscNode('0','Vérification de l\'unité de f','UnitsAbsolute','eleve_unit_f'+X,'teacher_unit_f'+X,'0','+',0.25,1,'prt'+X+'-0-T','','-',0,-1,'prt'+X+'-0-F',_oscKo('<strong>Fréquence :</strong> L\'unité est incorrecte (attendue en base SI : {@teacher_unit_f'+X+'/2@}).')),
      _oscNode('1','Vérification de la valeur de f','UnitsRelative','ans_fc'+X,'ta'+X+'_fc','ta'+X+'_precision_q','+',0.75,3,'prt'+X+'-1-T',_oscOk('<strong>Fréquence :</strong> Correcte.'),'-',0,2,'prt'+X+'-1-F',''),
      _oscNode('2','Piège — Mesure de la fréquence de la salve','UnitsRelative','ans_fc'+X,'ta'+X+'_fm','ta'+X+'_precision_q','-',0,-1,'prt'+X+'-2-T',_oscTrap('<strong>Fréquence :</strong> Vous avez mesuré la période de la salve (l\'enveloppe globale), pas la période du signal ultrasonore haute fréquence.'),'-',0,-1,'prt'+X+'-2-F',_oscKo('<strong>Fréquence :</strong> La valeur numérique ou la précision est incorrecte. Mesurez précisément la distance d\'UNE petite oscillation.')),
      _oscNode('3','Vérification de l\'unité du retard','UnitsAbsolute','eleve_unit_dt'+X,'teacher_unit_dt'+X,'0','+',0.25,4,'prt'+X+'-3-T','','-',0,-1,'prt'+X+'-3-F',_oscKo('<strong>Retard :</strong> L\'unité est incorrecte (attendue en base SI : {@teacher_unit_dt'+X+'/2@}).')),
      _oscNode('4','Vérification de la valeur du retard','UnitsRelative','ans_dt'+X,'ta'+X+'_dt','0.05','+',0.75,-1,'prt'+X+'-4-T',_oscOk('<strong>Retard :</strong> Correct.'),'-',0,5,'prt'+X+'-4-F',''),
      _oscNode('5','Piège Retard — A-t-il mis la période du signal ?','UnitsRelative','ans_dt'+X,'ta'+X+'_err_periode','0.05','-',0,-1,'prt'+X+'-5-T',_oscTrap('<strong>Retard :</strong> Vous avez calculé et entré la période du signal ultrasonore (\\(T = 1/f\\)) au lieu du décalage temporel entre l\'émission et la réception.'),'-',0,6,'prt'+X+'-5-F',''),
      _oscNode('6','Piège Retard — A-t-il mis T/2 ?','UnitsRelative','ans_dt'+X,'ta'+X+'_err_demi_periode','0.05','-',0,-1,'prt'+X+'-6-T',_oscTrap('<strong>Retard :</strong> Vous avez calculé la moitié de la période du signal (\\(T/2\\)) au lieu du décalage temporel entre les salves.'),'-',0,-1,'prt'+X+'-6-F',_oscKo('<strong>Retard :</strong> La valeur numérique ou la précision est incorrecte. Placez un curseur sur le début de la salve bleue (émission) et l\'autre sur le début de la salve rouge (réception).'))
    ];
  } else {
    canonicalNodes = _oscSimplePair('prt'+X,
      {label:'Fréquence', sans:'ans_fc'+X, tans:'ta'+X+'_fc', testopt:'ta'+X+'_precision_q'},
      {label:'Retard',    sans:'ans_dt'+X, tans:'ta'+X+'_dt', testopt:'0.05'},
      pedMode==='expert');
  }

  qnote = 'f={@ta'+X+'_f_carrier_val@} Hz | dt={@ta'+X+'_dt@}';
  genFb = '<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px;">'
    + '<div style="font-weight:bold; color:#0f766e; margin-bottom:10px;">🔑 Réponses attendues</div>'
    + '<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">'
    + '<span style="font-weight:bold;color:#0f766e;">Q1 Fréquence :</span> <p>En mesurant UNE période du signal haute fréquence (les petites oscillations), on trouve \\(f\\) = {@ta'+X+'_fc@}.</p></div>'
    + '<div style="margin-bottom:8px;font-size:.9rem;">'
    + '<span style="font-weight:bold;color:#0f766e;">Q2 Retard temporel :</span> <p>En plaçant un curseur sur le début de la salve bleue et l\'autre sur le début de la salve rouge, on mesure \\(\\Delta t\\) = {@ta'+X+'_dt@}.</p></div></div>';

  var prtMeta3 = { name:'prt'+X, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbv3 };
  return _oscFinalize(X, bareme, vars, qnote, textFrag, previewFrag, inputXML, prtMeta3, canonicalNodes, genFb, fbGen, jsx);
}

function _oscUnitsInput(name, tans){
  return '    <input>\n'
    + '      <name>'+name+'</name>\n'
    + '      <type>units</type>\n'
    + '      <tans>'+tans+'</tans>\n'
    + '      <boxsize>15</boxsize>\n'
    + '      <strictsyntax>1</strictsyntax>\n'
    + '      <insertstars>0</insertstars>\n'
    + '      <syntaxhint></syntaxhint>\n'
    + '      <syntaxattribute>0</syntaxattribute>\n'
    + '      <forbidwords></forbidwords>\n'
    + '      <allowwords></allowwords>\n'
    + '      <forbidfloat>1</forbidfloat>\n'
    + '      <requirelowestterms>0</requirelowestterms>\n'
    + '      <checkanswertype>0</checkanswertype>\n'
    + '      <mustverify>0</mustverify>\n'
    + '      <showvalidation>0</showvalidation>\n'
    + '      <options></options>\n'
    + '    </input>';
}

function _oscFinalize(X, bareme, vars, qnote, textFrag, previewFrag, inputXML, prtMeta, canonicalNodes, genFb, fbGen, kbdRaw){
  var prtXML = buildPrtXml(prtMeta, canonicalNodes);
  return {
    bareme: bareme, vars: vars, qnote: qnote, textFrag: textFrag, previewFrag: previewFrag,
    inputXML: inputXML, prtXML: prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    generalFeedback: _mkFbGen(genFb, fbGen),
    feedbackRef: '[[feedback:'+prtMeta.name+']]',
    kbdRaw: kbdRaw
  };
}
