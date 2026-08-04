const { setRole, VALID_ROLES } = require('./accounts');

const [, , username, role] = process.argv;

if (!username || !role) {
  console.error(`Usage : node set-role.js <identifiant> <${VALID_ROLES.join('|')}|none>`);
  process.exit(1);
}

try {
  setRole(username, role === 'none' ? null : role);
  console.log(`Rôle de "${username}" mis à jour : ${role}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
