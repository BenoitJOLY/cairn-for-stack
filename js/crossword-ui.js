// ── CROSSWORD UI + CW PROMPT ────────────────────────────────────
// ═══ CROSSWORD LOGIC ═══
let currentPlacedWords = [];
let currentGridData = null;
var _cwDefCounter = 0;

function addCWRow(word, def) {
    word = word || '';
    def = def || '';
    var tbody = document.getElementById("cw-body");
    var row = document.createElement("div");
    row.className = "cw-row";
    var defId = 'cw-def-' + (++_cwDefCounter);
    row.innerHTML =
        '<input type="text" class="cw-input cw-word" placeholder="' + I18N.t('tpl.cw_mot') + '">' +
        '<div class="cw-def-wrap">' +
          '<div class="rich-preview rich-preview-sm cw-def-preview" id="prev-' + defId + '" data-ph="D\xe9finition…" onclick="openRich(\'' + defId + '\')"></div>' +
          '<textarea id="' + defId + '" class="cw-def" style="display:none"></textarea>' +
          '<button class="btn-rich" type="button" onclick="openRich(\'' + defId + '\')">' +
            '<svg class="hs-ico" aria-hidden="true"><use href="#ico-action-edit"></use></svg> \xc9diteur' +
          '</button>' +
        '</div>' +
        '<button class="cw-btn-del" type="button" onclick="this.parentElement.remove()" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>';
    tbody.appendChild(row);
    row.querySelector('.cw-word').value = word;
    var ta = row.querySelector('.cw-def');
    ta.value = def;
    if (def) row.querySelector('.cw-def-preview').innerHTML = def;
}

function getCWTableWords() {
    const rows = document.querySelectorAll("#cw-body .cw-row");
    const words = [];
    rows.forEach(row => {
        const w = row.querySelector(".cw-word").value.trim();
        const d = (row.querySelector(".cw-def") || {}).value || '';
        const dTrim = d.trim();
        if (w) words.push({ word: w.toUpperCase().replace(/[^A-ZÀ-ÿ]/g, ''), def: dTrim });
    });
    return words;
}

function generateCWMaximaString(word) { 
    let parts = []; 
    for (let i = 0; i < word.length; i++) parts.push(`ascii(${word.charCodeAt(i)})`); 
    return `sconcat(${parts.join(',')})`; 
}

function generateCWGrid() {
    let pool = getCWTableWords();
    let countInput = document.getElementById("cw-count").value;
    let count = countInput ? parseInt(countInput) : pool.length;
    if (count > pool.length) count = pool.length;
    if (count < 1) { toast(I18N.t('msg.cw_mots_valides')); return; }
    
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selectedWords = pool.slice(0, count);

    // Grid Generation
    const result = generateCrosswordLogic(selectedWords);
    
    if (result && result.placedWords.length > 0) {
    currentPlacedWords = result.placedWords; 
    currentGridData = result;
        
        // Render Preview
        const preview = document.getElementById("cw-grid-preview");
        const status = document.getElementById("cw-status-msg");
        document.getElementById("cw-preview-area").style.display = "flex";
        
        const html = renderCWGridHTML(result.grid, result.maxX, result.maxY);
        preview.innerHTML = html;
        
        if(result.placedWords.length < selectedWords.length) {
            status.textContent = I18N.t('msg.cw_mots_partiels', {placed: result.placedWords.length, total: selectedWords.length});
        } else {
            status.textContent = I18N.t('msg.cw_grille_ok', {n: result.placedWords.length});
        }
        toast(I18N.t('msg.grille_generee'));
        if (typeof captureState === 'function' && typeof renderPreviewHTML_cw === 'function' && typeof mountPreviewIframe === 'function') {
          try { mountPreviewIframe('cw-preview-container', renderPreviewHTML_cw(captureState())); } catch(e) { console.error('cw preview:', e); }
        }
    } else {
        toast(I18N.t('msg.impossible_de_generer_une_grille'));
    }
}
// ═══ CROSSWORD JSON IMPORT / EXPORT ═══
function exportCWJSON() {
    const words = getCWTableWords();
    if (words.length === 0) return toast(I18N.t('msg.aucun_mot_a_exporter'));
    // On utilise la fonction dlJSON déjà présente dans STACKFORGE
    dlJSON(words, "crossword_words.json");
}

function importCWJSON() {
  // Au lieu d'ouvrir le sélecteur de fichier, on ouvre la modale partagée
  openJsonModal('CW');
}
function generateCrosswordLogic(words) {
    if (words.length === 0) return null;
    const grid = {};
    const placedWords = [];
    const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length);
    const firstWord = sortedWords[0];
    for (let i = 0; i < firstWord.word.length; i++) grid[`${0},${i}`] = { letter: firstWord.word[i], number: null };
    placedWords.push({ ...firstWord, x: 0, y: 0, direction: 'V' });

    for (let i = 1; i < sortedWords.length; i++) {
        const currentWord = sortedWords[i];
        const lastDirection = placedWords[placedWords.length - 1].direction;
        const preferedDirection = lastDirection === 'V' ? 'H' : 'V';
        let bestPlacement = null;
        let maxScore = -1;

        const searchPlacements = (targetDir) => {
            for (const pWord of placedWords) {
                if (pWord.direction === targetDir) continue; 
                for (let j = 0; j < currentWord.word.length; j++) {
                    for (let k = 0; k < pWord.word.length; k++) {
                        if (currentWord.word[j] === pWord.word[k]) {
                            let x, y;
                            if (targetDir === 'H') { x = pWord.x - j; y = pWord.y + k; } 
                            else { x = pWord.x + k; y = pWord.y - j; }
                            if (cwCanPlace(grid, currentWord.word, x, y, targetDir)) {
                                let score = cwCountIntersections(grid, currentWord.word, x, y, targetDir);
                                let distToCenter = Math.abs(x) + Math.abs(y);
                                let adjustedScore = (score * 1000) - distToCenter; 
                                if (adjustedScore > maxScore) {
                                    maxScore = adjustedScore;
                                    bestPlacement = { word: currentWord, x, y, direction: targetDir };
                                }
                            }
                        }
                    }
                }
            }
        };

        searchPlacements(preferedDirection);
        if (!bestPlacement) searchPlacements(lastDirection);
        if (bestPlacement) {
            cwPlaceWord(grid, bestPlacement.word.word, bestPlacement.x, bestPlacement.y, bestPlacement.direction);
            placedWords.push({ ...bestPlacement.word, x: bestPlacement.x, y: bestPlacement.y, direction: bestPlacement.direction });
        }
    }

    let num = 1;
    placedWords.sort((a,b) => a.y - b.y || a.x - b.x);
    const numberedSpots = new Set();
    for(const pw of placedWords) {
        const key = `${pw.x},${pw.y}`;
        if(!numberedSpots.has(key)) { grid[key].number = num; pw.number = num; numberedSpots.add(key); num++; } 
        else { pw.number = grid[key].number; }
    }

    // Normalize
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (let key in grid) { 
        const [x, y] = key.split(',').map(Number); 
        minX = Math.min(minX, x); minY = Math.min(minY, y); 
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); 
    }
    const finalGrid = {};
    const finalWords = placedWords.map(pw => {
        const nx = pw.x - minX;
        const ny = pw.y - minY;
        return { ...pw, x: nx, y: ny };
    });

    for(let y=minY; y<=maxY; y++){
        for(let x=minX; x<=maxX; x++){
            const k=`${x},${y}`;
            if(grid[k]){
                const nk=`${x-minX},${y-minY}`;
                finalGrid[nk]=grid[k];
            }
        }
    }

    return { grid: finalGrid, placedWords: finalWords, maxX: maxX-minX, maxY: maxY-minY };
}

function cwCountIntersections(grid, word, x, y, direction) { let count = 0; for (let i = 0; i < word.length; i++) { const cx = direction === 'H' ? x + i : x; const cy = direction === 'H' ? y : y + i; if (grid[`${cx},${cy}`]) count++; } return count; }

function cwCanPlace(grid, word, x, y, direction) {
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
        const cx = direction === 'H' ? x + i : x; const cy = direction === 'H' ? y : y + i; const key = `${cx},${cy}`;
        if (grid[key]) { if (grid[key].letter !== word[i]) return false; intersections++; } 
        else { if (direction === 'H') { if (grid[`${cx},${y-1}`] || grid[`${cx},${y+1}`]) return false; } else { if (grid[`${x-1},${cy}`] || grid[`${x+1},${cy}`]) return false; } }
    }
    if (intersections === 0) return false;
    const beforeKey = direction === 'H' ? `${x-1},${y}` : `${x},${y-1}`;
    const afterKey = direction === 'H' ? `${x+word.length},${y}` : `${x},${y+word.length}`;
    if (grid[beforeKey] || grid[afterKey]) return false;
    return true;
}

function cwPlaceWord(grid, word, x, y, direction) { for (let i = 0; i < word.length; i++) { const cx = direction === 'H' ? x + i : x; const cy = direction === 'H' ? y : y + i; const key = `${cx},${cy}`; if (!grid[key]) grid[key] = { letter: word[i], number: null }; } }

function renderCWGridHTML(grid, maxX, maxY) {
    if (!grid) return "<p>Erreur</p>";
    let html = `<div class="crossword-grid" style="grid-template-columns: repeat(${maxX + 1}, 30px); grid-template-rows: repeat(${maxY + 1}, 30px);">`;
    for (let y = 0; y <= maxY; y++) { 
        for (let x = 0; x <= maxX; x++) { 
            const key = `${x},${y}`; 
            if (grid[key]) { 
                const numHtml = grid[key].number ? `<span class="crossword-num">${grid[key].number}</span>` : ''; 
                html += `<div class="crossword-cell">${numHtml}${grid[key].letter}</div>`; 
            } else { 
                html += `<div class="crossword-cell empty"></div>`; 
            } 
        } 
    }
    html += "</div>"; 
    return html;
}
function renderCWGridHTMLEmpty(grid, maxX, maxY) {
    if (!grid || maxX === undefined || maxY === undefined) return '';
    const BLUE = '#4095AD';
    // On utilise un <table> car display:grid est ignoré dans les div contenteditable
    let html = `<table style="border-collapse:collapse;border:2px solid ${BLUE};background:${BLUE};display:inline-table;line-height:1;border-spacing:0;">`;
    html += '<tbody>';
    for (let y = 0; y <= maxY; y++) {
        html += '<tr>';
        for (let x = 0; x <= maxX; x++) {
            const key = `${x},${y}`;
            if (grid[key]) {
                const num = grid[key].number || '';
                const numHtml = num
                    ? `<span style="position:absolute;top:1px;left:2px;font-size:9px;color:#333;font-weight:normal;line-height:1;font-family:Arial,sans-serif;">${num}</span>`
                    : '';
                html += `<td style="width:30px;height:30px;min-width:30px;background:#fff;border:1px solid #999;padding:0;position:relative;">${numHtml}</td>`;
            } else {
                html += `<td style="width:30px;height:30px;min-width:30px;background:${BLUE};border:none;padding:0;"></td>`;
            }
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}
// ══════════════════════════════════════════════════════
//  LOGIQUE PROMPT MOTS CROISÉS (IA)
// ══════════════════════════════════════════════════════
function openCWPromptModal() {
  // Réinitialiser les valeurs par défaut
  document.getElementById('cw-pb-theme').value = '';
  document.getElementById('cw-pb-count').value = 15;
  document.getElementById('cw-pb-matter').value = 'Physique-Chimie';
  document.getElementById('cw-pb-level').value = '2nde';
  { const e=document.getElementById('cw-pb-sous'); if(e) e.value=''; }
  { const e=document.getElementById('cw-pb-chap'); if(e) e.value=''; }
  document.getElementById('cw-pb-lang').value = 'Français';

  // Initialiser les boutons dynamiques
  initCWSubjectUI();

  // Générer le prompt initial
  buildCWPrompt();
  
  // Afficher la modale
  const modal = document.getElementById('cwPromptModal');
  if(modal) {
    modal.style.display = 'flex';
    FocusTrap.trap(modal, closeCWPromptModal);
  }
}

function closeCWPromptModal() {
  document.getElementById('cwPromptModal').style.display = 'none';
  FocusTrap.release();
}

// Initialisation des boutons matière (au chargement de la modale)
function initCWSubjectUI() {
    const matterContainer = document.getElementById('cw-pb-matter-buttons');
    const levelContainer = document.getElementById('cw-pb-level-buttons');
    
    if(!matterContainer || !levelContainer) return;

    // 1. Générer les boutons MATIÈRE
    matterContainer.innerHTML = '';
    const matters = Object.keys(tagsArbre || {});
    matters.forEach(mat => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn'; 
        btn.textContent = mat;
        btn.onclick = () => selectCWMatter(mat, btn);
        matterContainer.appendChild(btn);
    });

    // 2. Générer les boutons NIVEAU (initialisés avec Physique-Chimie par défaut)
    updateCWLevelButtons('Physique-Chimie');
    // 3. Générer les boutons SOUS-MATIÈRE pour le couple matière/niveau par défaut
    updateCWSousButtons();
}

// Boutons SOUS-MATIÈRE selon la matière + le niveau courants
function updateCWSousButtons() {
    const cont = document.getElementById('cw-pb-sous-buttons');
    if(!cont) return;
    cont.innerHTML = '';
    const mat = (document.getElementById('cw-pb-matter') || {}).value || '';
    const niv = (document.getElementById('cw-pb-level') || {}).value || '';
    const sousObj = (((tagsArbre || {})[mat]) || {})[niv] || {};
    Object.keys(sousObj).forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = s.replace(/_/g, ' ');
        btn.onclick = () => selectCWSous(s, btn);
        cont.appendChild(btn);
    });
}
function selectCWSous(sousKey, btnElement) {
    const input = document.getElementById('cw-pb-sous');
    if(input) input.value = sousKey.replace(/_/g, ' ');
    document.getElementById('cw-pb-sous-buttons').querySelectorAll('button')
        .forEach(b => b.classList.toggle('active', b === btnElement));
    updateCWChapButtons(sousKey);
    buildCWPrompt();
}
// Boutons CHAPITRE selon la sous-matière choisie
function updateCWChapButtons(sousKey) {
    const cont = document.getElementById('cw-pb-chap-buttons');
    if(!cont) return;
    cont.innerHTML = '';
    const mat = (document.getElementById('cw-pb-matter') || {}).value || '';
    const niv = (document.getElementById('cw-pb-level') || {}).value || '';
    const chaps = ((((tagsArbre || {})[mat]) || {})[niv] || {})[sousKey] || [];
    chaps.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = c;
        btn.onclick = () => selectCWChap(c, btn);
        cont.appendChild(btn);
    });
}
function selectCWChap(chap, btnElement) {
    const input = document.getElementById('cw-pb-chap');
    if(input) input.value = chap;
    document.getElementById('cw-pb-chap-buttons').querySelectorAll('button')
        .forEach(b => b.classList.toggle('active', b === btnElement));
    buildCWPrompt();
}

// Sélection d'une matière
function selectCWMatter(matterName, btnElement) {
    const input = document.getElementById('cw-pb-matter');
    if(input) input.value = matterName;

    // 1. Mise à jour visuelle des boutons matière
    const buttons = document.getElementById('cw-pb-matter-buttons').querySelectorAll('button');
    buttons.forEach(b => {
        if(b === btnElement) b.classList.add('active');
        else b.classList.remove('active');
    });

    // 2. Mettre à jour les boutons de niveau correspondants
    updateCWLevelButtons(matterName);

    // 3. Sélectionner automatiquement le premier niveau
    const levelContainer = document.getElementById('cw-pb-level-buttons');
    const firstLevelBtn = levelContainer.querySelector('button');
    
    if(firstLevelBtn) {
        firstLevelBtn.click(); 
    } else {
        const lvlInput = document.getElementById('cw-pb-level');
        if(lvlInput) lvlInput.value = "";
    }

    buildCWPrompt();
}

// Mise à jour des boutons de niveau selon la matière choisie
function updateCWLevelButtons(matterName) {
    const container = document.getElementById('cw-pb-level-buttons');
    if(!container) return;
    container.innerHTML = '';

    // Chercher les niveaux dans tagsArbre
    let levels = [];
    if(tagsArbre && tagsArbre[matterName]) {
        levels = Object.keys(tagsArbre[matterName]);
    } else {
        // Fallback si matière inconnue
        levels = ["2nde", "1ere", "Term", "1STL", "1STMG", "TSTL", "TSTMG"];
    }

    levels.forEach(lvl => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = lvl === '1ere' ? '1ère' : lvl;
        btn.onclick = () => selectCWLevel(lvl, btn);
        container.appendChild(btn);
    });
}

// Sélection d'un niveau
function selectCWLevel(levelName, btnElement) {
    const input = document.getElementById('cw-pb-level');
    if(input) input.value = levelName;

    const buttons = document.getElementById('cw-pb-level-buttons').querySelectorAll('button');
    buttons.forEach(b => {
        if(b === btnElement) b.classList.add('active');
        else b.classList.remove('active');
    });

    // Réinitialiser sous-matière + chapitre, puis régénérer les boutons sous-matière
    { const e = document.getElementById('cw-pb-sous'); if(e) e.value = ''; }
    { const e = document.getElementById('cw-pb-chap'); if(e) e.value = ''; }
    { const e = document.getElementById('cw-pb-chap-buttons'); if(e) e.innerHTML = ''; }
    updateCWSousButtons();

    buildCWPrompt();
}

// Construction du prompt avec votre modèle personnalisé
function buildCWPrompt() {
  const theme = document.getElementById('cw-pb-theme').value.trim() || "[INSÉREZ VOTRE THÈME ICI]";
  const matter = document.getElementById('cw-pb-matter').value.trim() || "[INSÉREZ VOTRE matière ICI]";
  const level = document.getElementById('cw-pb-level').value.trim() || "[INSÉREZ VOTRE classe ICI]";
  const sous = (document.getElementById('cw-pb-sous')?.value || '').trim();
  const chap = (document.getElementById('cw-pb-chap')?.value || '').trim();
  let ctx = `${matter} en classe de ${level}`;
  if(sous) ctx += `, sous-matière « ${sous} »`;
  if(chap) ctx += `, chapitre « ${chap} »`;
  const count = document.getElementById('cw-pb-count').value || "[INSÉREZ VOTRE nombre ICI]";
  const lang = document.getElementById('cw-pb-lang').value || "Français";

  // ══════════════════════════════════════════════════
  // CONFIGURATION DES RÈGLES PAR LANGUE
  // ══════════════════════════════════════════════════
  const letterRules = {
    "Français": "1. LES LETTRES COMMUNES SONT OBLIGATOIRES : Les mots DOIVENT partager beaucoup de lettres populaires (E, A, S, I, T, R, N, L, O, U) pour pouvoir se croiser. Évite les mots avec des lettres rares (W, X, Z, K) sauf si beaucoup d'autres mots partagent ces lettres.",
    "Anglais": "1. COMMON LETTERS ARE MANDATORY: Words MUST share many popular letters (E, T, A, O, I, N, S, R, H, L, D) to be able to cross. Avoid words with rare letters (Z, Q, X, J, K, V) unless many other words share these letters.",
    "Espagnol": "1. LAS LETRAS COMUNES SON OBLIGATORIAS: Las palabras DEBEN compartir muchas letras populares (E, A, O, S, N, R, I, L, U, D) para poder cruzarse. Evita las palabras con letras raras (W, K, X, H, J) a menos que muchas otras palabras compartan estas letras.",
    "Allemand": "1. ALLGEMEINE BUCHSTABEN SIND PFLICHT: Wörter MÜSSEN viele beliebte Buchstaben teilen (E, N, I, S, R, A, T, D, H, U), um sich kreuzen zu können. Vermeiden Sie Wörter mit seltenen Buchstaben (J, Q, X, Y, V), es sei denn, viele andere Wörter teilen diese Buchstaben."
  };

  // Sélectionne la règle correspondante, ou le français par défaut si la langue n'est pas listée
  const rule1 = letterRules[lang] || letterRules["Français"];

  // ══════════════════════════════════════════════════
  // GÉNÉRATION DU PROMPT
  // ══════════════════════════════════════════════════
  const prompt = `Tu es un créateur de mots croisés expert et un enseignant pédagogue de ${ctx} . Génère une liste de mots et leurs définitions pour créer une grille de mots croisés.

Thème demandé : ${theme}
Nombre de mots à générer : ${count}
Langue : ${lang}

Règles strictes d'interconnexion :
 ${rule1}
2. VÉRIFICATION CROISÉE : Avant de lister un mot, assure-toi qu'il partage AU MOINS une lettre avec au moins 2 autres mots de ta liste.
3. Les mots doivent contenir entre 4 et 10 lettres. Évite les mots de 2 ou 3 lettres qui bloquent la grille.
4. Les définitions doivent être courtes, claires et au style typique des mots croisés.
5. Écris les mots en MAJUSCULES sans accents pour le champ "word" (ex: "ECOLE" et non "École"). Tu peux mettre des accents dans les définitions.
6. INTERDICTION ABSOLUE : la définition ne doit JAMAIS contenir le mot à trouver, ni un mot de la même famille (même racine). Par exemple, pour le mot "RÉACTION", la définition ne doit contenir ni "réaction", ni "réagir", ni "réactif".
7. NATURE DES MOTS : chaque mot doit être un NOM COMMUN au SINGULIER. Pas de noms propres, pas de pluriels, pas de verbes conjugués, pas de mots composés (ni espace ni trait d'union).

Génère UNIQUEMENT un tableau JSON valide, sans aucun texte supplémentaire avant ou après, en utilisant exactement cette structure :
[
  {
    "word": "MOT",
    "def": "Définition du mot ici"
  }
]

CONTRÔLE FINAL (à vérifier avant de répondre) :
- Le tableau JSON est syntaxiquement valide (virgules, guillemets, crochets corrects).
- Tout antislash éventuel est doublé (\\\\) et tout guillemet interne est échappé (\\") pour rester un JSON valide.
- Aucune définition ne contient son propre mot (règle 6) ; tous les mots sont des noms communs au singulier (règle 7).
- Aucun texte, commentaire ou balise markdown en dehors du tableau.
Si tu ne peux pas respecter ces contraintes, renvoie un tableau vide [].`;

  document.getElementById('cw-pb-result').value = prompt;
}

function copyCWPrompt() {
  const textArea = document.getElementById('cw-pb-result');
  if(!textArea) return;
  textArea.select();
  textArea.setSelectionRange(0, 99999); 
  navigator.clipboard.writeText(textArea.value).then(() => {
    const btn = document.getElementById('cw-pb-copy-btn');
    if(btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = I18N.t('tpl.copie');
      btn.style.background = "#059669";
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = "#ea580c"; }, 2000);
    }
  }).catch(e => { alert("Erreur copie"); });
}
// ═══════════════════════════════════════════════════════════════════
// LOGIQUE PROMPT IA POUR "RELIER" (MATCH)
// ═══════════════════════════════════════════════════════════════════

function openMatchPrompt() {
  // Reset Inputs
  const subInp = document.getElementById('match-pb-subject');
  const matInp = document.getElementById('match-pb-matter');
  const lvlInp = document.getElementById('match-pb-level');
  const langSel = document.getElementById('match-pb-lang-select');
  const langCust = document.getElementById('match-pb-lang-custom');

  if(subInp) subInp.value = '';
  if(matInp) matInp.value = 'Physique-Chimie';
  if(lvlInp) lvlInp.value = '2nde';
  { const e=document.getElementById('match-pb-sous'); if(e) e.value=''; }
  { const e=document.getElementById('match-pb-chap'); if(e) e.value=''; }
  if(langSel) langSel.value = 'Français';
  if(langCust) { langCust.value = ''; langCust.style.display = 'none'; }

  // Initialiser les boutons dynamiques
  initMatchPromptUI();

  // Générer le prompt initial
  updateMatchPrompt();
  
  // Afficher la modale
  const modal = document.getElementById('matchPromptModal');
  if(modal) {
    modal.style.display = 'flex';
    FocusTrap.trap(modal, closeMatchPromptBuilder);
  }
}

function closeMatchPromptBuilder() {
  const modal = document.getElementById('matchPromptModal');
  if(modal) modal.style.display = 'none';
  FocusTrap.release();
}

function updateMatchPrompt() {
    const subInp = document.getElementById('match-pb-subject');
    const matInp = document.getElementById('match-pb-matter');
    const lvlInp = document.getElementById('match-pb-level');
    const langSel = document.getElementById('match-pb-lang-select');
    const langCust = document.getElementById('match-pb-lang-custom');
    const resInp = document.getElementById('match-pb-result');

    // Sécurité : on sort si les éléments n'existent pas
    if(!subInp || !resInp) return;

    const subject = subInp.value.trim() || "[INSÉRER LE SUJET ICI]";
    const matter = matInp ? matInp.value.trim() : "Physique-Chimie";
    const level = lvlInp ? lvlInp.value.trim() : "2nde";
    const sous = (document.getElementById('match-pb-sous')?.value || '').trim();
    const chap = (document.getElementById('match-pb-chap')?.value || '').trim();
    let ctx = `${matter} de niveau ${level}`;
    if(sous) ctx += `, sous-matière « ${sous} »`;
    if(chap) ctx += `, chapitre « ${chap} »`;
    
    // Logique pour la langue
    let lang = "Français";
    if(langSel) {
        lang = langSel.value;
        if(lang === 'Autre' && langCust) {
            // Si c'est "Autre", on prend ce qui est tapé, ou "Autre" si vide
            const customVal = langCust.value.trim();
            lang = customVal ? customVal : "Autre";
        }
    }

 const prompt = `### RÔLE
Tu es un ingénieur pédagogique expert en conception d'évaluations interactives (Matching Questions). Ta mission est de générer un exercice de mise en relation de concepts structuré en JSON.

### CONSIGNE
Génère un exercice de type "Appariement" sur le sujet suivant : ${subject} pour un exercice en ${ctx}.
- La colonne de gauche (leftItems) contient des concepts, des exemples précis, des valeurs ou des cas concrets.
- La colonne de droite (rightItems) contient des catégories générales, des définitions, des propriétés ou des seuils.
- CONTRAINTE PÉDAGOGIQUE OBLIGATOIRE (NON 1-à-1) : L'exercice ne doit PAS être une simple correspondance linéaire. Conçois l'exercice pour qu'un élément de droite soit lié à plusieurs éléments de gauche (relation Plusieurs-à-Un), ou qu'un élément de gauche soit associé à plusieurs propriétés à droite (Plusieurs-à-Plusieurs).
- La langue à utiliser est ${lang}.

### CONTRAINTES TECHNIQUES STRICTES
1. FORMAT DE SORTIE : JSON pur uniquement (pas de blabla, pas de balises markdown de code block, juste l'objet JSON).
2. STRUCTURE DES ITEMS : Chaque objet dans "leftItems" et "rightItems" doit obligatoirement avoir cette structure exacte :
   {
     "id": <number>,
     "html": "<p>Texte avec balises HTML si nécessaire</p>",
     "text": "Texte brut sans balises"
   }
3. STRUCTURE DES CONNECTIONS : Le tableau "connections" doit être un tableau de paires d'indices numériques (commençant à 0). Exemple : [[0, 0], [1, 2], [2, 2]]. Ne pas utiliser d'objets avec des clés leftId/rightId.
4. ASYMÉTRIE : Le nombre d'éléments à gauche et à droite doit être différent. Un même index de droite DOIT apparaître plusieurs fois dans le tableau "connections" pour valider la structure non linéaire.
5. ÉCHAPPEMENT JSON : à l'intérieur des chaînes, double tout antislash (\\\\) et échappe les guillemets internes (\\"). Échappe correctement les guillemets dans les attributs HTML. Le JSON doit être valide tel quel.

### EXEMPLE DE STRUCTURE ATTENDUE (Modèle asymétrique Plusieurs-à-Un)
{
  "leftItems": [
    { "id": 0, "html": "<p>Chien</p>", "text": "Chien" },
    { "id": 1, "html": "<p>Aigle</p>", "text": "Aigle" },
    { "id": 2, "html": "<p>Chat</p>", "text": "Chat" }
  ],
  "rightItems": [
    { "id": 0, "html": "<p>Mammifères</p>", "text": "Mammifères" },
    { "id": 1, "html": "<p>Oiseaux</p>", "text": "Oiseaux" }
  ],
  "connections": [
    [0, 0],
    [1, 1],
    [2, 0]
  ]
}

### CONTRÔLE FINAL (avant de répondre)
Vérifie que : (1) le JSON est syntaxiquement valide ; (2) tous les antislashes sont doublés et les guillemets internes échappés ; (3) la structure (id/html/text, connections en paires d'indices) est respectée ; (4) l'asymétrie est présente ; (5) aucun texte hors du bloc JSON. Si tu ne peux pas respecter ces contraintes, renvoie un objet JSON vide {}.

### TÂCHE
Génère maintenant le JSON final pour le sujet : ${subject}`;

resInp.value = prompt;
}

function copyMatchPrompt() {
  const textarea = document.getElementById('match-pb-result');
  if(!textarea) return;
  textarea.select();
  textarea.setSelectionRange(0, 99999); 
  navigator.clipboard.writeText(textarea.value).then(() => {
    const btn = document.getElementById('match-pb-copy-btn');
    if(btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = I18N.t('tpl.copie');
      btn.style.background = "#059669";
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ""; }, 2000);
    }
  }).catch(e => { alert("Erreur copie"); });
}
