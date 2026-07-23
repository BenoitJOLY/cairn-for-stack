const path = require('path');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();

// Étape 1 du chantier "Backend auto-hébergé NAS" (voir PLAN.md) : sert l'app
// telle quelle, sans authentification ni protection du code des générateurs.
// But unique : valider que Docker + reverse proxy + HTTPS fonctionnent avant
// de toucher au code applicatif.
const PUBLIC_DIRS = ['js', 'css', 'lang', 'lib', 'assets'];
for (const dir of PUBLIC_DIRS) {
  app.use('/' + dir, express.static(path.join(ROOT, dir)));
}

const PUBLIC_FILES = ['index.html', 'depot.html'];
for (const file of PUBLIC_FILES) {
  app.get('/' + file, (req, res) => res.sendFile(path.join(ROOT, file)));
}

app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.get('/healthz', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`StackForge server listening on port ${PORT}`);
});
