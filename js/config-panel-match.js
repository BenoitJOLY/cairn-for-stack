// config-panel-match.js — capture/restore/reset pour le type "match"
// Extrait mécaniquement de config-panel.js (découpage par type, cf. preview-match.js).

function captureState_match() {
  var s = { type: 'match' };
      s.bareme=v('match-bareme');s.text=richVal('match-text');
      s.left=JSON.parse(JSON.stringify(matchState.left));
      s.right=JSON.parse(JSON.stringify(matchState.right));
      s.connections=JSON.parse(JSON.stringify(matchState.connections));
      s.fbGen=v('match-fbgen');
  return s;
}

function restoreState_match(s) {
      document.getElementById('match-bareme').value=s.bareme;setRichVal('match-text',s.text);
      matchState.left=JSON.parse(JSON.stringify(s.left));
      matchState.right=JSON.parse(JSON.stringify(s.right));
      matchState.connections=JSON.parse(JSON.stringify(s.connections));
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchFbGen=document.getElementById('match-fbgen');if(_matchFbGen)_matchFbGen.value=s.fbGen||'';
}

function resetForm_match() {
      matchState={left:[],right:[],connections:[],selectedLeft:null};
      setRichVal('match-text','');
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchfbGen=document.getElementById('match-fbgen');if(_matchfbGen)_matchfbGen.value='';
}
