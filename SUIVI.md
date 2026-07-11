# SUIVI ANTI-RÉGRESSION — HéStack V4
# Mise à jour : 2026-07-06
# LIRE AVANT TOUTE MODIFICATION

## RÈGLES ABSOLUES
1. Un seul fichier modifié à la fois
2. Lire le fichier COMPLET avant de modifier
3. Vérifier braces {open == close} après chaque Write JS
4. JAMAIS Edit sur fichiers UTF-8 avec accents/emojis → Write uniquement via Python script
5. JAMAIS toucher app.js / verif.js / editor.js sans accord explicite utilisateur
6. Décrire le changement exact AVANT de l'appliquer, attendre validation
7. Lire le XML de référence en entier AVANT d'écrire le générateur correspondant

---

## PROCÉDURE DE MODIFICATION AUTORISÉE

### Pour tout nouveau générateur (gen-math-X.js) :
1. Lire le XML de référence dans test/ (Read tool) — citer les passages exacts
2. Demander validation à l'utilisateur
3. Écrire le script Python dans scratchpad/write_X.py
4. Exécuter via PowerShell
5. Vérifier : braces open == close, lignes, fonctions présentes
6. Reporter dans ce fichier SUIVI.md
7. Commit git avec message descriptif

### Pour app.js / verif.js / editor.js :
1. Décrire le changement à l'utilisateur avec numéro de ligne précis
2. Attendre validation explicite
3. Lire le fichier (Read tool)
4. Appliquer avec Edit (ASCII pur) ou Python script (accents/emojis)
5. Reporter dans ce fichier SUIVI.md

---

## ÉTAT DES FICHIERS

### js/gen-math-complexe.js
- État : ✅ SAIN (réécrit 2026-06-26, committé)
- Braces : 83 open = 83 close
- Lignes : 304
- Fonctions : _cpxReplace() + genComplexe()
- Scénarios couverts : forme-alg (PRT 3 nœuds), module-arg (PRT 4 nœuds), equation-2deg (PRT 4 nœuds)
- generalFeedback : généré dans les 3 branches
- INTERDICTION : ne pas modifier sans réécriture complète via Python script

### js/app.js
- État : ✅ SAIN (modifié 2026-06-26, committé)
- Ligne 13 : regex moodleLatex → /(?<!\{)@(?!\})([^@]+?)@(?!\})/g  ← NE PAS CHANGER
- Lignes 84-94 : fallback vars (ta_conj, ta_arg_neg) ← NE PAS CHANGER
- Lignes 96-249 : fallback PRT (3 nœuds forme-alg, 4 nœuds module-arg/eq-2deg) ← NE PAS CHANGER
- Lignes 254-287 : fallback generalFeedback riche ← NE PAS CHANGER
- INTERDICTION : ne modifier que si bug confirmé ET sur lignes identifiées précisément

### js/verif.js
- État : ✅ SAIN (modifié 2026-06-26, committé)
- Ligne ~778 : const isComplexe = currentQData && currentQData.type === 'complexe';
- Ligne ~962 : branche else if (isComplexe) — UN seul bloc, tous les nœuds dedans
- Ligne ~1029 : hasSolutionOnly sans exclusion complexe → zone feedback vide comme les autres types
- Ligne ~1096 : affiche "Correction auto-générée" pour chips complexe → comportement VOULU
- INTERDICTION : ne plus toucher sauf accord explicite

### js/editor.js
- État : ✅ NON MODIFIÉ cette session
- INTERDICTION TOTALE : ne pas toucher

### js/gen-math-shared.js
- État : ✅ NON MODIFIÉ
- Contient _mkInput() utilisé par gen-math-complexe.js
- INTERDICTION TOTALE : ne pas toucher

---

## BUGS CONNUS NON CORRIGÉS

- [ ] Prévisualisation section 4 pour complexe : à reprendre (reporté — "On reprendra prévisualisation après")

---

## HISTORIQUE DES MODIFICATIONS

| Date | Fichier | Changement | Résultat |
|------|---------|-----------|---------|
| 2026-06-24 | gen-math-complexe.js | Réécriture PRT 3-4 nœuds | Fichier corrompu (Python) |
| 2026-06-24 | app.js | Fix regex moodleLatex | OK |
| 2026-06-25 | gen-math-complexe.js | Réécriture complète via Python script | OK — 83/83 braces |
| 2026-06-25 | app.js | Fallback generalFeedback → riche | OK |
| 2026-06-26 | verif.js | Branche isComplexe — 1 bloc groupé au lieu de N blocs | OK |
| 2026-06-26 | verif.js | Suppression exclusion complexe dans hasSolutionOnly — zone feedback vide comme les autres types | OK |
