const fs = require('fs');
const https = require('https');

// MET TA CLE API DEEPL ICI (gratuite sur deepl.com/pro-api)
const API_KEY = '398b4a26-b800-4028-8210-382f0b94f162:fx'; 
const INPUT_FILE = 'fr.js';
const OUTPUT_FILE = 'es.js';

function translateBatch(texts) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      text: texts,
      target_lang: 'ES',
      source_lang: 'FR',
      split_sentences: '0'
    }).toString();

    const options = {
      hostname: 'api-free.deepl.com',
      path: '/v2/translate',
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data).translations.map(t => t.text));
        else reject(new Error(`Erreur API: ${res.statusCode} - ${data}`));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function processFile(fileInfo) {
  console.log(`\n--- Traitement de ${fileInfo.input} ---`);
  let content = fs.readFileSync(fileInfo.input, 'utf8');
  const regex = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  
  let match, keys = [], values = [];
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
    values.push(match[2]);
  }
  console.log(`Trouvé ${values.length} textes. Traduction...`);

  let translatedValues = [];
  for (let i = 0; i < values.length; i += 50) {
    const batch = values.slice(i, i + 50);
    const translated = await translateBatch(batch);
    translatedValues.push(...translated);
    console.log(`${Math.min(i + 50, values.length)} / ${values.length} fait(s)...`);
  }

  for (let i = keys.length - 1; i >= 0; i--) {
    const originalStr = `"${keys[i]}": "${values[i]}"`;
    const translatedStr = `"${keys[i]}": "${translatedValues[i]}"`;
    content = content.replace(originalStr, translatedStr);
  }

  content = content.replace('I18N.add("fr"', 'I18N.add("de"');
  fs.writeFileSync(fileInfo.output, content, 'utf8');
  console.log(`Fichier ${fileInfo.output} créé.`);
}

async function main() {
  for (const file of FILES) {
    await processFile(file);
  }
  console.log('\nTOUS LES FICHIERS ONT ÉTÉ TRADUITS.');
}

main().catch(err => console.error("ERREUR :", err.message));