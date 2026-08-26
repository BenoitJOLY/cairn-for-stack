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

// config-panel-image-mesure.js — capture/restore/reset pour le type "image-mesure"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-image-mesure.js).

function captureState_image_mesure() {
  var s = { type: 'image-mesure' };
      s.bareme=v('imm-bareme');s.text=richVal('imm-text');
      s.imageData=v('imm-image-data');s.imgW=v('imm-img-w');s.imgH=v('imm-img-h');
      s.r1x=v('imm-r1x');s.r1y=v('imm-r1y');s.r1v=v('imm-r1v');s.r1desc=v('imm-r1desc');
      s.r2x=v('imm-r2x');s.r2y=v('imm-r2y');s.r2v=v('imm-r2v');s.r2desc=v('imm-r2desc');
      s.unit=v('imm-unit');s.tol=v('imm-tol');s.mode=v('imm-mode');
      s.fbOk=v('imm-fb-ok');s.fbWrong=v('imm-fb-wrong');s.fbGen=v('imm-fbgen');
      s.targets=[];
      document.querySelectorAll('.imm-target-row').forEach(function(row){
        var typeSel=row.querySelector('.imm-t-type');
        s.targets.push({desc:row.querySelector('.imm-t-desc').value,val:row.querySelector('.imm-t-val').value,type:typeSel?typeSel.value:'position',px:row.dataset.px,py:row.dataset.py,px2:row.dataset.px2,py2:row.dataset.py2});
      });
  return s;
}

function restoreState_image_mesure(s) {
      document.getElementById('imm-bareme').value=s.bareme||2;
      setRichVal('imm-text',s.text||'');
      document.getElementById('imm-img-w').value=s.imgW||'';
      document.getElementById('imm-img-h').value=s.imgH||'';
      document.getElementById('imm-r1x').value=s.r1x||'';
      document.getElementById('imm-r1y').value=s.r1y||'';
      document.getElementById('imm-r1v').value=s.r1v||'';
      document.getElementById('imm-r1desc').value=s.r1desc||'';
      document.getElementById('imm-r2x').value=s.r2x||'';
      document.getElementById('imm-r2y').value=s.r2y||'';
      document.getElementById('imm-r2v').value=s.r2v||'';
      document.getElementById('imm-r2desc').value=s.r2desc||'';
      document.getElementById('imm-unit').value=s.unit||'nm';
      document.getElementById('imm-tol').value=s.tol||5;
      var _immMode=document.getElementById('imm-mode');if(_immMode)_immMode.value=s.mode||'guide';
      document.getElementById('imm-fb-ok').value=s.fbOk||'';
      document.getElementById('imm-fb-wrong').value=s.fbWrong||'';
      var _immFbGen=document.getElementById('imm-fbgen');if(_immFbGen)_immFbGen.value=s.fbGen||'';
      if(s.imageData){
        document.getElementById('imm-image-data').value=s.imageData;
        var immImg=document.getElementById('imm-img');
        immImg.src=s.imageData;
        document.getElementById('imm-preview-wrap').style.display='';
        if(typeof immUpdateOverlay==='function')immUpdateOverlay();
      }
      document.getElementById('imm-targets').innerHTML='';
      (s.targets||[]).forEach(function(t){
        if(typeof immAddTarget!=='function')return;
        immAddTarget(t.desc,t.val);
        var _immRows=document.querySelectorAll('#imm-targets .imm-target-row');
        var _immLast=_immRows[_immRows.length-1];
        if(_immLast){
          var _immTypeSel=_immLast.querySelector('.imm-t-type');
          if(_immTypeSel)_immTypeSel.value=t.type||'position';
          if(t.px!==undefined&&t.px!==''&&t.px!==null){_immLast.dataset.px=t.px;_immLast.dataset.py=t.py;}
          if(t.px2!==undefined&&t.px2!==''&&t.px2!==null){_immLast.dataset.px2=t.px2;_immLast.dataset.py2=t.py2;}
        }
      });
      if(typeof immUpdateOverlay==='function')immUpdateOverlay();
}

function resetForm_image_mesure() {
      setRichVal('imm-text','');
      document.getElementById('imm-bareme').value=2;
      document.getElementById('imm-image-data').value='';
      document.getElementById('imm-img-w').value='';
      document.getElementById('imm-img-h').value='';
      document.getElementById('imm-preview-wrap').style.display='none';
      var _immFnReset=document.getElementById('imm-filename');if(_immFnReset)_immFnReset.textContent='';
      document.getElementById('imm-r1x').value='';
      document.getElementById('imm-r1y').value='';
      document.getElementById('imm-r1v').value='';
      document.getElementById('imm-r1desc').value='';
      document.getElementById('imm-r2x').value='';
      document.getElementById('imm-r2y').value='';
      document.getElementById('imm-r2v').value='';
      document.getElementById('imm-r2desc').value='';
      document.getElementById('imm-unit').value='nm';
      document.getElementById('imm-tol').value=5;
      var _immModeReset=document.getElementById('imm-mode');if(_immModeReset)_immModeReset.value='guide';
      document.getElementById('imm-fb-ok').value='';
      document.getElementById('imm-fb-wrong').value='';
      var _immfbGen=document.getElementById('imm-fbgen');if(_immfbGen)_immfbGen.value='';
      document.getElementById('imm-targets').innerHTML='';
      if(typeof immAddTarget==='function')immAddTarget();
}
