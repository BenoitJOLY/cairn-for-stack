# HéStack V4 — Feuille de route : Institutionnalisation

> Document de suivi à utiliser en début de session Claude Code.
> Cocher chaque item au fur et à mesure de l'avancement.

---

## 1. Stabilité technique

- [x] **Tests de non-régression**
  - `test/regression.html` — page de test dans le navigateur, sans dépendance externe
  - 8 types couverts : checkbox, radio, dropdown, arithmétique, algébrique, unité, string, match
  - Snapshots stockés dans localStorage ; bouton « Enregistrer » / « Lancer »
  - Restant : chimie topo, DOI, ordonnancement (à valider plus tard)

- [x] **Versioning sémantique**
  - `VERSION` → `4.1.0`
  - Version affichée dans le header (badge gris) et le footer (`id="footer-version"`)
  - `js/version.js` — source unique runtime
  - `CHANGELOG.md` créé

- [x] **Audit des erreurs console** — **TERMINÉ 2026-06-21**
  - Passage complet DevTools : 0 erreur JS/CSS sur tous les types de questions

---

## 2. Accessibilité (RGAA / WCAG 2.1 AA)

Obligatoire pour les établissements publics français.

- [x] **Contraste des couleurs ≥ 4.5:1** — 4 rounds axe DevTools corrigés
  - Fichiers modifiés : `css/style.css`, `css/assistant.css`, `js/verif.js`, `js/help.js`, `js/options.js`, `js/assistant.js`, `js/prt-manager.js`, `js/ai-docs.js`, `index.html`
  - Contrastes corrigés : boutons `.btn-ins`, `.btn-jxg-insert`, `.sv-t-bool`, `.sv-t-str`, `.tm-diff`, `.prt-leg-*`, `.field label`, `.hs-options-link`, labels options, hints, placeholders
  - Hiérarchie titres : tous les `<h3>` de modales → `<h2>` (link, latex, jxg, sv, tag, verif, prt, help, options, assistant)
  - Dialogs nommés : `aria-labelledby` ajouté sur `#jsonImportModal`, `#helpModal`, `#prt-manager-modal`, `#hs-opt-modal`
- [x] Navigation clavier complète (Tab, Shift+Tab, Entrée, **Échap**) sur toutes les modales
  - `focus-trap.js` amélioré : Échap → appelle le callback de fermeture
  - Tous les `FocusTrap.trap()` mis à jour avec leur fonction `close` (18 appels)
  - `openConfigPanel` et `openPrtManager` intégrés à FocusTrap
  - `topoOpenJsme` / `topoCloseJsme` intégrés à FocusTrap
- [x] Attributs `aria-label` / `aria-labelledby` sur les boutons icône et modales
  - `initModals()` auto-détecte le premier titre dans chaque `.modal-backdrop` → `aria-labelledby`
  - `role="dialog"` + `aria-modal="true"` ajoutés à toutes les modales (y.c. `jsme_generator_modal`)
  - Boutons ✕ dynamiques (prop-rows, doi, match-ui, crossword) : `aria-label` i18n
  - Boutons ✏️ icon-seul convertis en `✏️ Éditeur`
  - Boutons fermer inline : `data-i18n-aria="btn.fermer"` ajouté
- [x] `role` et `aria-*` corrects sur les modales dynamiques — voir ci-dessus
- [x] **Labels formulaires** — `a11y-init.js` étendu (4 étapes) + `aria-label` HTML direct
  - 38 champs sans label identifiés et corrigés (matrices, modales, IA docs, textareas éditeur riche)
  - File inputs cachés labellisés ; textareas `display:none` couverts par Step 1 étendu et Step 4 catch-all
- [x] **Test avec lecteur d'écran NVDA + Firefox** — structure valide (Insert+F7 : h1 HéStack, h2 Mode assistant, navigation cohérente)
- [x] **Audit Lighthouse accessibilité : 97%** (objectif ≥ 90 atteint)
  - Touch targets : header V4 → 60px, boutons/input → min-height 48px
  - Footer links → min-height 24px avec padding
  - 3% restant : boutons V4 en simulation mobile 360px (interface desktop-first, non bloquant)

---

## 3. Hébergement institutionnel

- [ ] Choisir la cible : serveur Apache/Nginx de l'établissement **ou** hébergement statique (Netlify, GitLab Pages…)
- [ ] Vérifier que tout fonctionne en `https://` (pas seulement `file://`)
  - Tester le chargement JSME, KaTeX, SmilesDrawer depuis le serveur
  - Vérifier les CSP (Content Security Policy) si elles existent
- [ ] Mettre en place une URL stable communiquée aux enseignants
- [ ] Définir la procédure de mise à jour (pull + rechargement serveur)

---

## 4. Intégration Moodle

- [ ] **Test sur instance Moodle réelle**
  - Importer un XML de chaque type de question
  - Vérifier le rendu étudiant (formules KaTeX, clavier virtuel, JSME)
  - Vérifier le PRT (arbre de réponses) et les feedbacks
- [ ] **Import direct via API Moodle** *(optionnel, amélioration majeure)*
  - Authentification via token Moodle (REST API)
  - Endpoint : `core_course_get_categories` + `qbank_*`
  - Ajouter un bouton "Publier dans Moodle" dans l'export
- [ ] Tester la compatibilité avec Moodle 4.x et STACK 4.x

---

## 5. Documentation

- [x] **Guide enseignant** — `doc/guide-enseignant.html`
  - Pas à pas pour 10 types (QCM, algébrique, numérique, unités, texte, relier, mots croisés, ordonnancement, image, chimie)
  - Aide-mémoire syntaxe Maxima complet (tableau opérateurs, variables, tests STACK)
  - FAQ 10 questions (erreurs courantes, import Moodle, LaTeX, PRT, fractions)
  - Section export vers Moodle + sauvegarde JSON

- [ ] **Guide administrateur**
  - Installation (copie des fichiers sur le serveur)
  - Mise à jour (procédure git pull ou remplacement de dossier)
  - Sauvegardes (localStorage, export JSON)

- [x] **Compléter `lang/help.fr.js` et `lang/help.en.js`**
  - 4 types ajoutés (FR + EN) : `ord`, `imgclick`, `glr`, `rvbcmj`
  - `doi` et `cw` (crossword) étaient déjà présents

---

## 6. Gouvernance

- [ ] Nommer un **responsable maintenance** (nom + contact)
- [ ] Ouvrir un dépôt officiel (GitHub ou GitLab institutionnel)
  - Ajouter `.gitignore` adapté
  - Protéger la branche `main`
- [ ] Définir un canal de signalement de bugs pour les utilisateurs (formulaire, email, ticket)
- [ ] Planifier une revue technique semestrielle

---

## 7. Fonctionnalités à finaliser (bugs connus)

Issues identifiées lors du développement V4 :

- [x] Import image — `_richInsertHtml` uniforme pour tous les types via `v4HandleImage` + `handleRichImage` : rien à corriger
- [x] JSME chimie topo — `topoOpenJsme` robustifié : reset qui plante → ré-init au lieu de sortir silencieusement
- [x] `moodleLatex` — regex corrigée : `[^@{}]+?` → `[^@]+?` pour autoriser `{` `}` dans les expressions Maxima (`x^{2}`, `x_{n}`, `solve({...},x)`)
- [x] Correcteur orthographique — `spellcheck="true"` déjà en place sur `#rich-editor` et `#v4-editor`, aucune interférence CSS : fonctionnalité native OK
- [ ] Valider l'export XML sur Moodle pour les questions avec **clavier virtuel activé** (unités + algébrique) — **reporter quand Moodle sera de nouveau disponible**
- [x] **Montage chimie retiré du projet** — 2026-06-21
  - Fichiers supprimés : `js/gen-montage-chimie.js`, `js/chem-pieces.js`, `assets/chem-symbols.svg`
  - Références nettoyées dans `index.html`, `js/config-panel.js`, `js/editor.js`, `js/data.js`
  - Dossier `chimie-svg/` (69 SVG Inkscape) conservé pour une future version
- [x] **Palette réorganisée** — 2026-06-21
  - RVB/CMJN déplacé de "Interactif / Visuel" → "Physique-Chimie"
  - Nouvelle catégorie "Réponse textuelle" créée avec string + composition
- [x] **Mode assistant — bug layout corrigé** — 2026-06-21
  - Le champ quiz-name dépassait sous le panneau assistant en mode desktop
  - CSS fixé dans `assistant.css` : `padding-right` sur `.v4-header`, `margin-right` sur `.v4-main`
- [x] **gen-diffraction.js — encodage corrigé** — 2026-06-21
  - Fichier entier en double encodage UTF-8/CP1252 (mojibake)
  - Correction complète : chaînes visibles élèves (sous-questions, feedbacks STACK, DIFF_INFO), aperçu enseignant, commentaires développeur
- [x] **Matrices — bug affichage 1×4 au lieu de 2×2 corrigé** — 2026-06-21
  - `show()` effaçait `display:grid` des grilles inline → `showGrid()` restaure `'grid'` explicitement
  - Double attribut `style` sur `mat-grid-a3` corrigé dans `index.html`

---

## 8. Internationalisation

- [x] Compléter `lang/en.js` — **déjà complet** : 603 clés FR = 603 clés EN, 0 manquant (vérifié 2026-06-20)
- [ ] Ajouter une troisième langue si besoin (ex. `lang/es.js`)
- [x] Tester le rendu complet en anglais — **corrections faites 2026-06-20**
  - `i18n-walk.js` étendu : +350 entrées (catégories palette, labels de types, en-têtes de panels, labels de champs, exemples de préréglages)
  - `confirm()` traduits : `msg.confirm_effacer/del_q/del_node/apply_anyway` dans fr.js + en.js
  - 66 exemples de préréglages mathématiques (option values) conservés en français (contenu pédagogique, pas UI)

---

## Contacts et ressources

| Élément | Valeur |
|---|---|
| Projet | HéStack V4 |
| Répertoire local | `c:\Users\phy_j\Downloads\hestackV4` |
| Contact développeur | b_joly@orange.fr |
| Dépôt GitHub | https://github.com/BJ44-phy/H-stack.git |
| Documentation STACK | https://docs.stack-assessment.org |

---

*Dernière mise à jour : 2026-06-21 — Axe 1 complet (audit console OK) ; bugs corrigés : matrices 2×2, mode assistant, diffraction encodage ; palette réorganisée ; montage chimie retiré*
