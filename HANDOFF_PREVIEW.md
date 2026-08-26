# Prompt de reprise — Prévisualisation élève (session suivante)

Colle ce prompt tel quel dans une nouvelle conversation Claude Code, dans le dossier `c:\Users\phy_j\Downloads\cairnforstackV4`.

---

## Contexte

Cairn for Stack V1 a un système de prévisualisation élève en iframe sandboxée (JSON state → `renderPreviewHTML_<type>(state)` dans `js/preview.js` → `mountPreviewIframe()`), déjà en place et VALIDÉ pour : `vf`, `checkbox` (`cb`), `radio` (`ra`), `dropdown` (`dd`).

Cette session en a ajouté 5 de plus (`algebraic`, `numerical`, `units`, `string`, `match`) mais le travail est **incomplet et a été fait trop vite** : il manque la largeur de modale uniforme, et la méthode utilisée risquait de zapper des onglets "Feedback général" sur les types suivants. Ne pas répéter cette erreur.

## Règle n°1 : ne jamais bâcler un type

Pour CHAQUE type, avant d'écrire `renderPreviewHTML_<type>`, faire dans l'ordre :

1. **Lister tous les onglets réels du panneau** : `grep "tab('<prefix>'," index.html`. Un panneau peut avoir : `cfg`, `fb` (correction/fbc-fbe), `fb-gen` (feedback général — souvent avec aperçu auto-généré + case "afficher le feedback" + zone de texte additionnelle), `help` (aide élève), `sol` (solution). **Ne pas supposer** qu'un type simple n'a que `cfg` — ex. `complexe` (`cpx`) a `cfg` + `fb` + `fb-gen`, alors qu'`algebraic`/`numerical`/`units`/`match` n'ont pas de `fb-gen` du tout. Il faut vérifier au cas par cas, jamais en lot.
2. **Vérifier `js/config-panel.js`** : relire précisément le `case '<type>':` dans `captureState()`, `restoreState()`, et le bloc reset/default, pour connaître EXACTEMENT les clés du state (ne jamais deviner un nom de champ).
3. **Représenter TOUS les onglets dans l'aperçu**, pas seulement `cfg`. Si un onglet `fb-gen` existe, l'aperçu doit montrer ce feedback général (avec son propre bloc visuel, comme c'est déjà fait pour `vf`/`cb`/`ra`/`dd` — voir leurs `renderPreviewHTML_*` dans `js/preview.js` comme référence de la bonne pratique).
4. **CSS — largeur de modale (ÉTAPE OBLIGATOIRE, oubliée cette session)** : dans `css/style.css` vers la ligne 2986, il y a :
   ```css
   #q-config-modal:has(#fp-checkbox[style*="display: block"]) .q-config-modal-box,
   #q-config-modal:has(#fp-radio[style*="display: block"]) .q-config-modal-box,
   #q-config-modal:has(#fp-dropdown[style*="display: block"]) .q-config-modal-box,
   #q-config-modal:has(#fp-vf[style*="display: block"]) .q-config-modal-box {
     width: min(1200px, 96vw);
   }
   @media (max-width: 1000px) {
     #fp-checkbox[style*="display: block"], #fp-radio[style*="display: block"], #fp-dropdown[style*="display: block"], #fp-vf[style*="display: block"] { display: block !important; }
     ...
   }
   ```
   **Chaque type qui reçoit un `hs-split-row` (aperçu 50/50) DOIT être ajouté dans CES DEUX listes de sélecteurs** (`#fp-<type>[style*="display: block"]`), sinon la modale garde sa largeur par défaut (trop étroite) et l'aperçu est écrasé/non uniforme par rapport à `checkbox`/`radio`/`dropdown`/`vf`.
   **Correctif rétroactif à faire en premier** : ajouter `algebraic`, `numerical`, `units`, `string`, `match` à ces deux listes (elles ont déjà leur `hs-split-row` dans `index.html` mais n'ont jamais été ajoutées ici).

## État réel actuel

- **Bon et validé** : `vf`, `checkbox`, `radio`, `dropdown` (onglet `fb-gen` géré correctement, largeur de modale correcte).
- **Ajoutés cette session mais à corriger/vérifier** : `algebraic`, `numerical`, `units`, `string`, `match`.
  - Ces 5 n'ont pas d'onglet `fb-gen` réel dans `index.html` (vérifié par grep) → pas de contenu manquant de ce côté.
  - MAIS leur `#fp-<type>` n'est pas dans les listes CSS de largeur de modale (§4 ci-dessus) → **à corriger en premier**.
  - Revérifier que l'onglet `sol` d'`algebraic` et l'onglet `fb` de `string` sont bien intégralement représentés dans l'aperçu (pas juste effleurés).
- **Pas commencé** (~29 types) :
  - Types avec un **aperçu maison déjà existant** (canvas, grille, JSXGraph, contenteditable) : `crossword`, `doi`, `chemical`, `chemical_topo`, `jxgdrop`, `oscilloscope`, `rvbcmj`, `glr`, `imgclick`, `optique`, `ord`. Décision à prendre (ne pas juste écraser leur système) : soit les laisser tels quels, soit les migrer vers le moteur standard avec un rendu STATIQUE de repli pour la partie interactive (JSXGraph/canvas), comme fait pour `match` cette session.
  - Types "thématiques" simples à vérifier un par un (PAS de raccourci générique en lot — `complexe` prouve qu'un type "simple" peut cacher un onglet `fb-gen`) : `redox`, `acide-base`, `basen`, `circuit`, `logique`, `complexe`, `calcul`, `statistiques`, `matrices`, `geometrie`, `suites`, `probabilites`, `trigonometrie`, `polynomes`, `limites`, `physique`, `inequation`, `thermo`, `diffraction`, `nuclear`, `composition`.
  - `expert` : panneau caché (`display:none`), fonctions `expertCaptureState`/`expertRestoreState` séparées — à investiguer avant de décider si un aperçu est pertinent.

## Consigne de méthode (rappel du fil précédent)

Travailler en continu, sans pause pour faire un rapport de statut ou poser des questions — mais **vérifier les onglets + CSS AVANT d'écrire le rendu** pour chaque type, pas après. Un type fait vite mais faux coûte plus cher à corriger qu'un type vérifié d'abord. Faire les corrections rétroactives (CSS des 5 types de cette session) en tout premier, puis continuer type par type avec la checklist ci-dessus.
