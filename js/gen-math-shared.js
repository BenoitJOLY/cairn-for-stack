/*
 * StackForge — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + `<p>${fbGen}</p>` : generalFeedback;
}

function _mkInput(o) {
    return `    <input>
      <name>${o.name}</name>
      <type>${o.type || 'algebraic'}</type>
      <tans>${o.tans}</tans>
      <boxsize>${o.boxsize || 15}</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint>${o.hint || ''}</syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords>${o.forbidwords || ''}</forbidwords>
      <allowwords>${o.allowwords || ''}</allowwords>
      <forbidfloat>${o.forbidfloat !== undefined ? o.forbidfloat : 1}</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>${o.checkanswertype || 0}</checkanswertype>
      <mustverify>${o.mustverify || 0}</mustverify>
      <showvalidation>${o.showvalidation !== undefined ? o.showvalidation : 2}</showvalidation>
      <options></options>
    </input>`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { _mkFbGen: _mkFbGen, _mkInput: _mkInput };
}

// ─── COMPLEXES ───────────────────────────────────────────────

