const fs = require('fs');
const https = require('https');

// MET TA CLE API DEEPL ICI (gratuite sur deepl.com/pro-api)
const API_KEY = '398b4a26-b800-4028-8210-382f0b94f162:fx'; 
const INPUT_FILE = 'fr.js';
const OUTPUT_FILE = 'es.js';

function translateBatch(texts) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      auth_key: API_KEY,
      text: texts,
      target_lang: 'ES',
      source_lang: 'FR',
      split_sentences: '0'
    });
    const req = https.get(`https://api-free.deepl.com/v2/translate?${params.toString()}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data).translations.map(t => t.text));
        else reject(new Error(`Erreur API: ${res.statusCode} - ${data}`));
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  console.log(`Lecture de ${INPUT_FILE}...`);
  let content = fs.readFileSync(INPUT_FILE, 'utf8');
  const regex = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  
  let match, keys = [], values = [];
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
    values.push(match[2]);
  }
  console.log(`Trouvé ${values.length} textes. Traduction en cours...`);

  let translatedValues = [];
  // On envoie par paquets de 50 pour être sûr de ne pas faire planter l'API
  for (let i = 0; i < values.length; i += 50) {
    const batch = values.slice(i, i + 50);
    const translated = await translateBatch(batch);
    translatedValues.push(...translated);
    console.log(`${Math.min(i + 50, values.length)} / ${values.length} fait(s)...`);
  }

  // On remplace les valeurs une par une (à l'envers pour ne pas décaler les index)
  for (let i = keys.length - 1; i >= 0; i--) {
    const originalStr = `"${keys[i]}": "${values[i]}"`;
    const translatedStr = `"${keys[i]}": "${translatedValues[i]}"`;
    content = content.replace(originalStr, translatedStr);
  }

  // Change le nom de la clé I18N
  content = content.replace('I18N.add("fr"', 'I18N.add("de"');

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`\nTERMINÉ ! Fichier ${OUTPUT_FILE} créé.`);
}

main().catch(err => console.error("ERREUR :", err.message));