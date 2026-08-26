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

// _modele.js — MODÈLE pour ajouter le référentiel de tags d'un nouveau pays.
// Ce fichier n'est PAS chargé par index.html (préfixe "_"). Pour créer un
// nouveau pays :
//   1. Copier ce fichier vers js/tags-data/<code>.js (ex: uk.js, ca.js, de.js).
//   2. Remplacer 'xx' par le code pays (ISO 639-1 ou convention interne) et
//      'Nom du pays' par le libellé affiché aux enseignants.
//   3. Adapter l'arborescence Matière → Niveau → Sous-matière → [Chapitres]
//      au système éducatif du pays visé (les clés peuvent être en anglais,
//      allemand, etc. — ce sont ces libellés qui deviendront les tags
//      exportés, ex: matiere:maths, niveau:year_12...).
//   4. Ajouter <script src="js/tags-data/<code>.js"></script> dans index.html,
//      juste après js/tags-data/fr.js.
//   5. Le nouveau pays apparaît automatiquement dans le sélecteur des Options
//      (js/options.js) — aucun autre changement de code nécessaire.
//
// Structure attendue : { Matiere: { Niveau: { SousMatiere: [Chapitre, ...] } } }
registerCountryTags('xx', 'Nom du pays', {
  "Maths": {
    "Niveau_Exemple": {
      "Sous_Matiere_Exemple": [
        "Chapitre_Exemple_1",
        "Chapitre_Exemple_2"
      ],
      "A_Definir": [
        "A_Definir"
      ]
    }
  }
});
