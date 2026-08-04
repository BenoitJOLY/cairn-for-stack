const { createAccount, VALID_ROLES } = require('./accounts');

const [, , username, password, role] = process.argv;

if (!username || !password) {
  console.error(`Usage : node create-account.js <identifiant> <mot-de-passe> [${VALID_ROLES.join('|')}]`);
  process.exit(1);
}

try {
  createAccount(username, password, { role: role || null });
  console.log(`Compte "${username}" créé avec succès.` + (role ? ` (rôle: ${role})` : ''));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
