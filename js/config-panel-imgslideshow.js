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

// config-panel-imgslideshow.js — capture/restore/reset pour le type "imgslideshow"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-imgslideshow.js).

function captureState_imgslideshow() {
  var s = { type: 'imgslideshow' };
      s.bareme=v('imsl-bareme');
      s.text=richVal('imsl-text');
      s.fbOk=v('imsl-fb-ok');s.fbWrong=v('imsl-fb-wrong');s.fbGen=v('imsl-fbgen');
      s.interval=v('imsl-interval');s.timeLimit=v('imsl-timelimit');
      var imslst=window._imslState||{};
      s.images=JSON.parse(JSON.stringify(imslst.images||[]));
      s.nextImageId=imslst.nextImageId||1;
      s.props=[];
      document.querySelectorAll('#imsl-props-items .imsl-prop-row').forEach(function(r){
        var radio=r.querySelector('.imsl-prop-correct');
        s.props.push({text:r.querySelector('.imsl-prop-text').value,correct:!!(radio&&radio.checked)});
      });
  return s;
}

function restoreState_imgslideshow(s) {
      document.getElementById('imsl-bareme').value=s.bareme||1;
      setRichVal('imsl-text',s.text||'');
      document.getElementById('imsl-fb-ok').value=s.fbOk||'';document.getElementById('imsl-fb-wrong').value=s.fbWrong||'';
      var _imslFbGen=document.getElementById('imsl-fbgen');if(_imslFbGen)_imslFbGen.value=s.fbGen||'';
      document.getElementById('imsl-interval').value=s.interval||2;
      document.getElementById('imsl-timelimit').value=s.timeLimit||15;
      if(typeof imslRestoreState==='function')imslRestoreState({
        images:s.images,nextImageId:s.nextImageId,props:s.props
      });
}

function resetForm_imgslideshow() {
      setRichVal('imsl-text','');
      document.getElementById('imsl-fb-ok').value='';document.getElementById('imsl-fb-wrong').value='';
      var _imslfbGen=document.getElementById('imsl-fbgen');if(_imslfbGen)_imslfbGen.value='';
      document.getElementById('imsl-bareme').value=1;
      document.getElementById('imsl-interval').value=2;
      document.getElementById('imsl-timelimit').value=15;
      if(typeof imslReset==='function')imslReset();
}
