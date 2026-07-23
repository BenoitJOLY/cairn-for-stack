const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const { verifyPassword } = require('./accounts');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();

// Le proxy inversé DSM termine le HTTPS et transmet en HTTP en interne ;
// 'trust proxy' est nécessaire pour que le cookie de session 'secure' se
// pose correctement malgré ça (voir en-tête X-Forwarded-Proto).
app.set('trust proxy', 1);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get('/healthz', (req, res) => res.send('ok'));

app.get('/login.html', (req, res) => res.sendFile(path.join(ROOT, 'login.html')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !verifyPassword(username, password)) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }
  req.session.username = username;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

function requireAuth(req, res, next) {
  if (req.session && req.session.username) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Non authentifié.' });
  return res.redirect('/login.html');
}

app.use(requireAuth);

// Le reste (app statique) n'est servi qu'après authentification — voir
// PLAN.md, chantier "Backend auto-hébergé NAS", décision "toute l'app
// derrière le login".
const PUBLIC_DIRS = ['js', 'css', 'lang', 'lib', 'assets'];
for (const dir of PUBLIC_DIRS) {
  app.use('/' + dir, express.static(path.join(ROOT, dir)));
}

const PUBLIC_FILES = ['index.html', 'depot.html'];
for (const file of PUBLIC_FILES) {
  app.get('/' + file, (req, res) => res.sendFile(path.join(ROOT, file)));
}

app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => {
  console.log(`StackForge server listening on port ${PORT}`);
});
