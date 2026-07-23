const { createAccount } = require('./accounts');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Usage : node create-account.js <identifiant> <mot-de-passe>');
  process.exit(1);
}

try {
  createAccount(username, password);
  console.log(`Compte "${username}" créé avec succès.`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
