// ════════════════════════════════════════════════════════════════
//  AIDE CONTEXTUELLE PAR TYPE DE QUESTION
//  Fichier autonome : injecte sa propre fenêtre modale, ses styles
//  et un bouton « ❓ Aide » dans l'en-tête de chaque module.
//  Pour ajouter/modifier une aide : éditez lang/help.fr.js (et créez help.xx.js par langue).
// ════════════════════════════════════════════════════════════════

// Petit utilitaire de mise en forme pour garder le contenu lisible.
// Contenu d'aide chargé depuis lang/help.<lang>.js (repli FR).
function HELP_DATA(){
  var L = window.HELP_LANG || {};
  var lang = (window.I18N && I18N.getLang) ? I18N.getLang() : "fr";
  return L[lang] || L.fr || {};
}


// ─────────────────────────────────────────────────────────────────
//  AFFICHAGE DE LA MODALE
// ─────────────────────────────────────────────────────────────────
function showHelp(type){
  const data = HELP_DATA()[type];
  const modal = document.getElementById('helpModal');
  if(!data || !modal) return;
  document.getElementById('help-title').innerHTML = data.title;
  document.getElementById('help-body').innerHTML = data.body;
  document.getElementById('help-body').scrollTop = 0;
  modal.style.display = 'flex';
}
function closeHelp(){
  const m = document.getElementById('helpModal');
  if(m) m.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────────
//  INJECTION (modale + styles + boutons) AU CHARGEMENT
// ─────────────────────────────────────────────────────────────────
(function initHelp(){
  function build(){
    // 1) Styles
    if(!document.getElementById('help-styles')){
      const st = document.createElement('style');
      st.id = 'help-styles';
      st.textContent = `
        .btn-help{padding:5px 11px;border:1px solid rgba(255,255,255,.7);border-radius:6px;background:rgba(255,255,255,.92);color:#1e293b;font-size:.75rem;font-weight:700;cursor:pointer;line-height:1;}
        .btn-help:hover{background:#fff;}
        #helpModal{position:fixed;top:0;right:0;height:100%;width:420px;max-width:95vw;z-index:9900;display:none;flex-direction:column;background:#fff;box-shadow:-6px 0 32px rgba(0,0,0,.22);border-left:1px solid #e2e8f0;}
        #helpModal .help-head{background:#1e3a5f;color:#fff;padding:13px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
        #helpModal .help-head h2{font-size:1rem;font-weight:700;margin:0;}
        #helpModal .help-body{padding:18px 22px;overflow-y:auto;font-size:.88rem;color:#334155;line-height:1.6;flex:1;}
        #helpModal .help-body p{margin:0 0 10px 0;}
        #helpModal .help-h{margin:16px 0 7px 0;font-size:.92rem;color:#1e3a5f;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:4px;}
        #helpModal .help-body h3.help-h:first-child{margin-top:0;}
        #helpModal .help-ul{margin:0 0 10px 0;padding-left:20px;}
        #helpModal .help-ul li{margin-bottom:5px;}
        #helpModal .help-body code{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px;font-size:.82em;color:#0f172a;}
        #helpModal .help-common{margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:11px 14px;font-size:.84rem;color:#1e40af;}
        #helpModal .help-common strong{display:block;margin-bottom:5px;}
        #helpModal .help-foot{padding:11px 18px;border-top:1px solid #e2e8f0;text-align:right;flex-shrink:0;background:#f8fafc;}
        #helpModal .help-foot button{background:#1e3a5f;color:#fff;border:none;border-radius:7px;padding:8px 18px;font-weight:700;font-size:.85rem;cursor:pointer;}
        #helpModal .help-foot button:hover{background:#15273f;}
      `;
      document.head.appendChild(st);
    }

    // 2) Modale
    if(!document.getElementById('helpModal')){
      const wrap = document.createElement('div');
      wrap.id = 'helpModal';
      wrap.role = 'dialog';
      wrap.setAttribute('aria-modal', 'true');
      wrap.setAttribute('aria-labelledby', 'help-title');
      wrap.innerHTML = `
        <div class="help-head">
          <h2 id="help-title">Aide</h2>
          <button class="rich-head-close" onclick="closeHelp()" aria-label="Fermer">×</button>
        </div>
        <div class="help-body" id="help-body" tabindex="0"></div>
        <div class="help-foot"><button onclick="closeHelp()">J'ai compris</button></div>`;
      document.body.appendChild(wrap);
    }

    // 3) Un bouton « ❓ Aide » dans chaque en-tête de module
    document.querySelectorAll('.form-panel').forEach(panel=>{
      const type = (panel.id||'').replace('fp-','');
      if(!HELP_DATA()[type]) return;
      const head = panel.querySelector('.form-panel-head');
      if(!head || head.querySelector('.btn-help')) return; // déjà présent

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-help';
      btn.innerHTML = I18N.t('tpl.help_btn');
      btn.title = I18N.t('tpl.help_btn_title');
      btn.addEventListener('click', e=>{ e.preventDefault(); showHelp(type); });

      // S'il existe un groupe de boutons (JSON/IA), on l'y intègre ; sinon on le pose à droite.
      const grp = head.querySelector('.json-btns');
      if(grp){
        grp.insertBefore(btn, grp.firstChild);
      }else{
        btn.style.marginLeft = 'auto';
        head.appendChild(btn);
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', build);
  }else{
    build();
  }

  // Fermeture avec la touche Échap
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){
      const m = document.getElementById('helpModal');
      if(m && m.style.display === 'flex') closeHelp();
    }
  });
})();
