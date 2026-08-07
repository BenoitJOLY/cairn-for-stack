const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const {
  verifyPassword, createAccount, isSelfRegistered, deleteAccount, getRole, setRole, loadAccounts,
  setAiKey, clearAiKey, hasAiKey, setAiProvider,
} = require('./accounts');
const { isUnderQuota, recordUsage, deleteUsage, WEEKLY_LIMIT } = require('./usage');

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
app.get('/register.html', (req, res) => res.sendFile(path.join(ROOT, 'register.html')));

// Servi avant le gate d'authentification : login.html en a besoin pour son
// fond d'écran, et ce dossier ne contient que des images/icônes, pas la
// logique métier protégée (contrairement à js/, gardé derrière requireAuth).
app.use('/assets', express.static(path.join(ROOT, 'assets')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !verifyPassword(username, password)) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }
  req.session.username = username;
  res.json({ ok: true });
});

// Auto-inscription publique — voir PLAN.md, section accès/auto-inscription.
// Comptes marqués selfRegistered pour être soumis au quota hebdomadaire
// (server/usage.js), contrairement aux comptes créés via create-account.js.
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
  }
  const u = username.trim();
  if (u.length < 3) {
    return res.status(400).json({ error: 'Identifiant trop court (3 caractères minimum).' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum).' });
  }
  try {
    createAccount(u, password, { selfRegistered: true });
  } catch (err) {
    return res.status(409).json({ error: err.message });
  }
  req.session.username = u;
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

// 'admin' est un sur-ensemble de 'validateur' (voir plan) : un admin contrôle
// déjà le jeton GitHub institutionnel utilisé par la promotion, lui interdire
// l'accès à la file de validation n'apporterait aucune barrière réelle.
function requireRole(role) {
  return function (req, res, next) {
    const r = getRole(req.session.username);
    if (r === 'admin' || r === role) return next();
    if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'Accès réservé.' });
    return res.redirect('/index.html');
  };
}

app.get('/api/whoami', (req, res) => {
  res.json({ username: req.session.username, role: getRole(req.session.username) });
});

const instanceConfig = require('./instance-config');

// Champs non-secrets consommés par tout compte connecté : câblage de la zone
// de mutualisation (js/app.js, depositForReview) et du serveur Maxima/JSmol
// par défaut (js/maxima-client.js) — voir plan §6/§7.
app.get('/api/config/public', (req, res) => {
  const cfg = instanceConfig.getPublicConfig();
  res.json({ mutualisation: cfg.mutualisation, maximaUrl: cfg.maximaUrl, legal: cfg.legal });
});

app.get('/api/admin/config', requireRole('admin'), (req, res) => {
  res.json(instanceConfig.getPublicConfig());
});

app.post('/api/admin/config', requireRole('admin'), (req, res) => {
  const { mutualisation, maximaUrl, ai, legal } = req.body || {};
  if (mutualisation && typeof mutualisation === 'object') {
    instanceConfig.setMutualisationConfig(mutualisation);
  }
  if (typeof maximaUrl === 'string') {
    instanceConfig.setMaximaUrl(maximaUrl);
  }
  if (ai && typeof ai === 'object') {
    instanceConfig.setAiProviderConfig(ai);
  }
  if (legal && typeof legal === 'object') {
    // Défense en profondeur : la validation côté client (admin.html) peut être
    // contournée par un appel direct à l'API — le responsable de traitement et
    // l'autorité de contrôle sont fixes par instance et doivent être nommés
    // explicitement, jamais laissés vides pour retomber sur un texte générique.
    const missing = ['responsableNom', 'responsableEmail', 'autoriteNom']
      .filter((k) => !String(legal[k] || '').trim());
    if (missing.length) {
      return res.status(400).json({ error: `Champs obligatoires manquants : ${missing.join(', ')}` });
    }
    instanceConfig.setLegalConfig(legal);
  }
  res.json(instanceConfig.getPublicConfig());
});

const SECRET_NAMES = new Set(['ghToken', 'aiKey']);

app.post('/api/admin/config/secret/:name', requireRole('admin'), (req, res) => {
  if (!SECRET_NAMES.has(req.params.name)) return res.status(404).json({ error: 'Secret inconnu.' });
  const { value } = req.body || {};
  if (typeof value !== 'string' || !value.trim()) {
    return res.status(400).json({ error: 'Valeur requise.' });
  }
  try {
    instanceConfig.setSecret(req.params.name, value.trim());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  res.json({ configured: true });
});

app.delete('/api/admin/config/secret/:name', requireRole('admin'), (req, res) => {
  if (!SECRET_NAMES.has(req.params.name)) return res.status(404).json({ error: 'Secret inconnu.' });
  instanceConfig.clearSecret(req.params.name);
  res.json({ configured: false });
});

// Gestion des rôles — décision actée : panneau in-app dès cette itération,
// pas uniquement CLI (voir server/set-role.js pour l'équivalent SSH).
app.get('/api/admin/accounts', requireRole('admin'), (req, res) => {
  const accounts = loadAccounts().map((a) => ({
    username: a.username,
    role: a.role || null,
    selfRegistered: !!a.selfRegistered,
  }));
  res.json({ accounts });
});

app.post('/api/admin/accounts/:username/role', requireRole('admin'), (req, res) => {
  const { role } = req.body || {};
  const normalized = role === 'none' || !role ? null : role;
  try {
    setRole(req.params.username, normalized);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  res.json({ ok: true, role: normalized });
});

app.get('/admin.html', requireRole('admin'), (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));

// Workflow validateur — relecture faite sur un Moodle réel, hors StackForge
// (pas de prévisualisation in-app pour le moment) ; la promotion utilise le
// jeton institutionnel exclusivement côté serveur (server/gh-validation.js).
const ghValidation = require('./gh-validation');

app.get('/api/validation/deposits', requireRole('validateur'), async (req, res) => {
  try {
    res.json({ deposits: await ghValidation.listDeposits() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/validation/deposits/raw', requireRole('validateur'), async (req, res) => {
  const p = req.query.path;
  if (typeof p !== 'string' || !p) return res.status(400).json({ error: 'Paramètre path requis.' });
  try {
    const file = await ghValidation.getRawFile(p);
    res.type('text/xml').send(file.content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/validation/deposits/valider', requireRole('validateur'), async (req, res) => {
  const { path: p } = req.body || {};
  if (typeof p !== 'string' || !p) return res.status(400).json({ error: 'Paramètre path requis.' });
  try {
    await ghValidation.promoteDeposit(p);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/validation/deposits/rejeter', requireRole('validateur'), async (req, res) => {
  const { path: p } = req.body || {};
  if (typeof p !== 'string' || !p) return res.status(400).json({ error: 'Paramètre path requis.' });
  try {
    await ghValidation.rejectDeposit(p);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/validation.html', requireRole('validateur'), (req, res) => res.sendFile(path.join(ROOT, 'validation.html')));

const { generate } = require('./generate');

// Un type de question migré à la fois — voir PLAN.md, chantier
// "Backend auto-hébergé NAS", étape 3. Chemin local (js/gen-*.js côté
// client) gardé en parallèle tant qu'un type n'est pas validé ici.
app.post('/api/generate', (req, res) => {
  const { type, X, params } = req.body || {};
  if (typeof type !== 'string' || typeof X === 'undefined') {
    return res.status(400).json({ error: 'Requête invalide.' });
  }
  const username = req.session.username;
  const limited = isSelfRegistered(username);
  if (limited && !isUnderQuota(username)) {
    return res.status(429).json({
      error: `Quota hebdomadaire atteint (${WEEKLY_LIMIT} questions/semaine pour un compte auto-inscrit). Réessaie la semaine prochaine.`,
    });
  }
  try {
    const parts = generate(type, X, params || {});
    if (limited) recordUsage(username);
    res.json({ ok: true, parts });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
  }
});

// Droit à l'effacement (RGPD) — auto-service, voir index.html modale
// "Mentions légales". Redemande le mot de passe (le cookie de session seul ne
// suffit pas à confirmer une action destructive) avant de purger accounts.json
// ET usage.json, puis détruit la session en cours.
app.post('/api/account/delete', (req, res) => {
  const username = req.session.username;
  const { password } = req.body || {};
  if (typeof password !== 'string' || !verifyPassword(username, password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }
  deleteAccount(username);
  deleteUsage(username);
  req.session.destroy(() => res.json({ ok: true }));
});

// Génération IA (RA/DD uniquement) — cascade institutionnelle → personnelle →
// fallback vers le flux manuel copier/coller déjà en place (js/prompt.js,
// aiGenerateAndImport). Voir server/ai-generate.js pour la cascade complète.
const aiGenerate = require('./ai-generate');

app.get('/api/ai/status', (req, res) => {
  res.json(aiGenerate.status(req.session.username));
});

app.post('/api/ai/generate', async (req, res) => {
  const { prompt, targetType } = req.body || {};
  try {
    const result = await aiGenerate.generate(req.session.username, prompt, targetType);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
  }
});

// Clé IA personnelle — write-only, surfacée dans #copyModal (index.html),
// même contrat que les secrets d'instance (jamais renvoyée en clair).
app.post('/api/account/ai-key', (req, res) => {
  const { key, baseUrl, model } = req.body || {};
  if (typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({ error: 'Clé requise.' });
  }
  try {
    setAiKey(req.session.username, key.trim());
    if (typeof baseUrl === 'string' || typeof model === 'string') {
      setAiProvider(req.session.username, { baseUrl, model });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  res.json({ configured: true });
});

app.delete('/api/account/ai-key', (req, res) => {
  clearAiKey(req.session.username);
  res.json({ configured: false });
});

app.get('/api/account/ai-key', (req, res) => {
  res.json({ configured: hasAiKey(req.session.username) });
});

// Relais interne vers stack-api (conteneur "maxima-stack-api-1", réseau Docker
// partagé "maxima_default", port interne 80 — voir docker-compose.yml). Le
// navigateur n'appelle jamais bjoly.synology.me:8443 directement : ça évite le
// blocage CORS (origine différente à cause du port) puisque tout transite par
// la même origine que le reste de l'appli. Liste blanche de routes pour ne pas
// exposer stack-api comme proxy ouvert vers le réseau interne.
const STACK_API_ROUTES = new Set(['render', 'grade', 'validate', 'diff']);

app.post('/stack-api/:route', async (req, res) => {
  if (!STACK_API_ROUTES.has(req.params.route)) {
    return res.status(404).json({ error: 'Route stack-api inconnue.' });
  }
  try {
    const upstream = await fetch(`http://maxima-stack-api-1/${req.params.route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const text = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    res.status(502).json({ error: 'stack-api injoignable : ' + err.message });
  }
});

// Le reste (app statique) n'est servi qu'après authentification — voir
// PLAN.md, chantier "Backend auto-hébergé NAS", décision "toute l'app
// derrière le login".
const PUBLIC_DIRS = ['js', 'css', 'lang', 'lib'];
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
