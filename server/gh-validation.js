// Promotion des dépôts "à valider" vers la banque de questions validées, via
// l'API GitHub Contents, exclusivement côté serveur (jeton institutionnel,
// jamais envoyé au navigateur — voir plan §9). Contrairement au dépôt initial
// (js/app.js, ghApi/ghGetToken, PAT personnel côté client, inchangé), ce
// module ne sert que le rôle validateur.
const instanceConfig = require('./instance-config');

function repoConfig() {
  const cfg = instanceConfig.getPublicConfig();
  const m = cfg.mutualisation;
  if (!m.ghOwner || !m.ghRepo || !m.ghReviewBranch || !m.ghReviewFolder || !m.ghBanqueBranch || !m.ghBanqueFolder) {
    throw new Error('Zone de mutualisation incomplète (voir réglages admin).');
  }
  const token = instanceConfig.getSecret('ghToken');
  if (!token) throw new Error('Jeton GitHub institutionnel non configuré.');
  return {
    token, owner: m.ghOwner, repo: m.ghRepo,
    reviewBranch: m.ghReviewBranch, reviewFolder: m.ghReviewFolder,
    banqueBranch: m.ghBanqueBranch, banqueFolder: m.ghBanqueFolder,
  };
}

function encodePath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

// Un validateur ne doit pouvoir agir que sur des chemins sous le dossier de
// relecture configuré — même s'il a un accès valide à l'API, on ne veut pas
// qu'un `path` arbitraire dans le corps de la requête touche le reste du dépôt.
function assertUnderReviewFolder(rc, p) {
  if (p !== rc.reviewFolder && !p.startsWith(rc.reviewFolder + '/')) {
    throw new Error('Chemin hors de la zone de relecture.');
  }
}

async function ghApi(rc, apiPath, opts) {
  return fetch(`https://api.github.com/repos/${rc.owner}/${rc.repo}${apiPath}`, Object.assign({
    headers: { 'Authorization': 'Bearer ' + rc.token, 'Accept': 'application/vnd.github+json' },
  }, opts || {}));
}

// Sous-dossiers pays sous ghReviewFolder, puis fichiers .xml par pays — même
// arborescence que celle produite par depositForReview() (js/app.js).
async function listDeposits() {
  const rc = repoConfig();
  const topRes = await ghApi(rc, `/contents/${encodePath(rc.reviewFolder)}?ref=${encodeURIComponent(rc.reviewBranch)}`);
  if (topRes.status === 404) return [];
  if (!topRes.ok) throw new Error(`Impossible de lister ${rc.reviewFolder} (HTTP ${topRes.status}).`);
  const topEntries = await topRes.json();
  const deposits = [];
  for (const entry of topEntries) {
    if (entry.type !== 'dir') continue;
    const subRes = await ghApi(rc, `/contents/${encodePath(entry.path)}?ref=${encodeURIComponent(rc.reviewBranch)}`);
    if (!subRes.ok) continue;
    const subEntries = await subRes.json();
    for (const f of subEntries) {
      if (f.type === 'file' && f.name.endsWith('.xml')) {
        deposits.push({ path: f.path, name: f.name, pays: entry.name, size: f.size });
      }
    }
  }
  return deposits;
}

async function getRawFile(p) {
  const rc = repoConfig();
  assertUnderReviewFolder(rc, p);
  const res = await ghApi(rc, `/contents/${encodePath(p)}?ref=${encodeURIComponent(rc.reviewBranch)}`);
  if (!res.ok) throw new Error(`Fichier introuvable (HTTP ${res.status}).`);
  const data = await res.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf8'), name: data.name };
}

// Promotion = PUT sous la banque puis DELETE de l'original, seulement si le PUT
// a réussi. Un échec du DELETE après un PUT réussi laisse un doublon inoffensif
// (remonté comme erreur explicite) plutôt qu'un rollback complexe — décision
// actée dans le plan.
async function promoteDeposit(p) {
  const rc = repoConfig();
  assertUnderReviewFolder(rc, p);
  const getRes = await ghApi(rc, `/contents/${encodePath(p)}?ref=${encodeURIComponent(rc.reviewBranch)}`);
  if (!getRes.ok) throw new Error(`Dépôt introuvable (HTTP ${getRes.status}).`);
  const data = await getRes.json();
  const banquePath = `${rc.banqueFolder}/${data.name}`;
  const putRes = await ghApi(rc, `/contents/${encodePath(banquePath)}`, {
    method: 'PUT',
    body: JSON.stringify({ message: `Validation : ${data.name}`, content: data.content, branch: rc.banqueBranch }),
  });
  if (!putRes.ok) {
    const errBody = await putRes.json().catch(() => ({}));
    throw new Error(errBody.message || `Échec de la promotion vers la banque (HTTP ${putRes.status}).`);
  }
  const delRes = await ghApi(rc, `/contents/${encodePath(p)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: `Validation (suppression après promotion) : ${data.name}`, sha: data.sha, branch: rc.reviewBranch }),
  });
  if (!delRes.ok) {
    throw new Error(`Promu vers la banque, mais suppression de l'original échouée (HTTP ${delRes.status}) — réessayez ou nettoyez manuellement.`);
  }
}

async function rejectDeposit(p) {
  const rc = repoConfig();
  assertUnderReviewFolder(rc, p);
  const getRes = await ghApi(rc, `/contents/${encodePath(p)}?ref=${encodeURIComponent(rc.reviewBranch)}`);
  if (!getRes.ok) throw new Error(`Dépôt introuvable (HTTP ${getRes.status}).`);
  const data = await getRes.json();
  const delRes = await ghApi(rc, `/contents/${encodePath(p)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: `Rejet : ${data.name}`, sha: data.sha, branch: rc.reviewBranch }),
  });
  if (!delRes.ok) {
    const errBody = await delRes.json().catch(() => ({}));
    throw new Error(errBody.message || `Échec du rejet (HTTP ${delRes.status}).`);
  }
}

module.exports = { listDeposits, getRawFile, promoteDeposit, rejectDeposit };
