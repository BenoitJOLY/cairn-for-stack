'use strict';
// Clavier virtuel : rangée « Lettres grecques » (syntaxe Maxima) réservée aux questions algébriques.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

global.I18N = global.I18N || { t: (k) => k };
const { buildKbdStackHTML, maximaToLatex, KBD_GREEK, addVarToList, formatVarsHelp } = require(path.join('..', '..', 'js', 'keyboard.js'));

test('clavier élève : rangée grecque seulement avec opts.greek', () => {
  const sans = buildKbdStackHTML('1');
  const avec = buildKbdStackHTML('1', { greek: true });
  assert.ok(!sans.includes('data-val="alpha"'));
  assert.ok(avec.includes('modal.latex_grecques'));
  for (const g of KBD_GREEK) assert.ok(avec.includes(`data-val="${g.v}"`), g.v);
});

test('lettres grecques insérées en Maxima, jamais en LaTeX', () => {
  for (const g of KBD_GREEK) assert.ok(/^[A-Za-z]+$/.test(g.v), g.v);
  assert.ok(!KBD_GREEK.some((g) => g.v === 'pi'), 'π est déjà présent sous forme %pi');
});

test('aperçu enseignant : alpha, Delta… rendus en LaTeX', () => {
  assert.equal(maximaToLatex('2*Delta*theta'), String.raw`2 \cdot \Delta \cdot \theta`);
  assert.equal(maximaToLatex('beta/lambda'), String.raw`\frac{\beta}{\lambda}`);
});

test('aperçu enseignant : lettre grecque indicée (rho_0, rho1) rendue comme STACK', () => {
  assert.equal(maximaToLatex('rho_0'), String.raw`\rho_{0}`);
  assert.equal(maximaToLatex('rho1'), String.raw`\rho_{1}`);
  assert.equal(maximaToLatex('rho_eau*V'), String.raw`\rho_{eau} \cdot V`);
  assert.equal(maximaToLatex('x_rho'), 'x_rho', 'rho en indice d\'un autre nom : inchangé');
  assert.equal(maximaToLatex('rhombus'), 'rhombus', 'nom contenant rho : inchangé');
});

test('champ Variables : lettre grecque ajoutée à la liste, sans doublon', () => {
  assert.equal(addVarToList('x, y', 'alpha'), 'x, y, alpha');
  assert.equal(addVarToList('x, alpha', 'alpha'), 'x, alpha');
  assert.equal(addVarToList('', 'theta'), 'theta');
  assert.equal(addVarToList('x,y,', 'Delta'), 'x, y, Delta');
});

test('aide élève : variable grecque affichée en lettre grecque + nom à taper', () => {
  assert.equal(formatVarsHelp('x, rho'), '<code>x</code>, <strong>ρ</strong> (<code>rho</code>)');
  assert.equal(formatVarsHelp('rho_0'), '<strong>ρ<sub>0</sub></strong> (<code>rho_0</code>)');
  assert.equal(formatVarsHelp('Delta'), '<strong>Δ</strong> (<code>Delta</code>)');
  assert.equal(formatVarsHelp('rhombus'), '<code>rhombus</code>');
});

test('clavier élève : seuls les groupes choisis par l\'enseignant sont inclus', () => {
  const h = (g) => buildKbdStackHTML('1', { groups: g });
  const greekOnly = h({ greek: true });
  assert.ok(greekOnly.includes('data-val="rho"'));
  assert.ok(!greekOnly.includes('data-val="sqrt()"'));
  assert.ok(!greekOnly.includes('data-val="%pi"'));
  const fnOnly = h({ fn: true });
  assert.ok(fnOnly.includes('data-val="sqrt()"') && !fnOnly.includes('data-val="*10^"') && !fnOnly.includes('data-val="rho"'));
  const height = (s) => Number(s.match(/height="(\d+)px"/)[1]);
  assert.ok(height(h({ ops: true })) < height(h({ ops: true, fn: true })), 'iframe plus petite avec moins de groupes');
  assert.equal(height(buildKbdStackHTML('1')), 230, 'défaut num/units inchangé');
});
