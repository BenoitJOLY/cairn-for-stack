/*
 * StackForge — générateur de questions STACK pour Moodle
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

const fs = require('fs');
const https = require('https');

const INPUT_FILE = 'fr.js';
const OUTPUT_FILE = 'nl.js';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function translateText(text) {
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=nl&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0].map(item => item[0]).join(''));
        } catch (e) {
          resolve(text); 
        }
      });
    }).on('error', () => resolve(text));
  });
}

async function main() {
  console.log(`Lecture de ${INPUT_FILE}...`);
  let content = fs.readFileSync(INPUT_FILE, 'utf8');
  const regex = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  
  let match, fullMatches = [], values = [];
  while ((match = regex.exec(content)) !== null) {
    fullMatches.push(match[0]);
    values.push(match[2]);
  }
  
  console.log(`Trouvé ${values.length} textes. Traduction Google en cours...`);

  let translatedValues = new Array(values.length).fill("");

  for (let i = 0; i < values.length; i++) {
    if (values[i].trim() !== "") {
      const translated = await translateText(values[i]);
      translatedValues[i] = translated.replace(/'/g, "\\'");
    }
    
    // On affiche l'avancement toutes les 100 lignes
    if ((i + 1) % 100 === 0) {
      console.log(`${i + 1} / ${values.length} traduits...`);
      await sleep(1000); // Pause d'1 seconde pour ne pas se faire bloquer par Google
    }
  }

  console.log("Application de la traduction dans le fichier...");
  for (let i = fullMatches.length - 1; i >= 0; i--) {
    const safeTranslation = translatedValues[i] ? translatedValues[i].replace(/\$/g, '$$$$') : "";
    const newStr = fullMatches[i].replace(values[i], safeTranslation);
    content = content.replace(fullMatches[i], newStr);
  }

  content = content.replace('I18N.add("fr"', 'I18N.add("nl"');

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`\nTERMINÉ ! Fichier ${OUTPUT_FILE} créé avec succès.`);
}

main().catch(err => console.error("ERREUR :", err.message));