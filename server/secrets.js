const crypto = require('crypto');

// Secrets institutionnels/personnels (jeton GitHub, clé API IA) sont les
// premiers secrets réversibles stockés par StackForge — jusqu'ici seuls des
// hachages bcrypt irréversibles (mots de passe) touchaient le disque. Chiffrés
// avec une clé dérivée de SECRETS_KEY (variable d'env, même esprit que
// SESSION_SECRET dans server.js) plutôt que stockés en clair dans
// server/data/*.json.
function getKey() {
  const raw = process.env.SECRETS_KEY;
  if (!raw) {
    throw new Error(
      "SECRETS_KEY manquant : impossible de chiffrer/déchiffrer un secret institutionnel. " +
      "Définissez la variable d'environnement SECRETS_KEY avant de configurer un jeton ou une clé API."
    );
  }
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), data: data.toString('base64') };
}

function decrypt(payload) {
  if (!payload) return null;
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const data = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]);
  return data.toString('utf8');
}

module.exports = { encrypt, decrypt };
