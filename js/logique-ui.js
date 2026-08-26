/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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

// logique-ui.js — Logique propositionnelle (tables de vérité, simplification, équivalence)
// Pas de préréglages : le "Type de question" pilote seul l'affichage des champs et l'aperçu.

function lgVars(nbVars) { return parseInt(nbVars) === 3 ? ['P', 'Q', 'R'] : ['P', 'Q']; }

function lgEval(exprStr, vals) {
    var e = exprStr
        .replace(/\bP\b/g, vals.P ? 'true' : 'false')
        .replace(/\bQ\b/g, vals.Q ? 'true' : 'false')
        .replace(/\bR\b/g, (vals.R !== undefined) ? (vals.R ? 'true' : 'false') : 'false');
    e = e
        .replace(/\bimplies\b/gi, '___impl___')
        .replace(/\bnand\b/gi, '___nand___')
        .replace(/\bnor\b/gi, '___nor___')
        .replace(/\bxor\b/gi, '!==')
        .replace(/\band\b/gi, '&&')
        .replace(/\bor\b/gi, '||')
        .replace(/\bnot\b\s*/gi, '!');
    e = e.replace(/(\S+)\s*___impl___\s*(\S+)/g, '(!$1||$2)');
    e = e.replace(/(\S+)\s*___nand___\s*(\S+)/g, '(!($1&&$2))');
    e = e.replace(/(\S+)\s*___nor___\s*(\S+)/g, '(!($1||$2))');
    try { return !!eval(e); } catch (err) { return null; }
}

function lgBuildRows(exprStr, nbVars) {
    var vars = lgVars(nbVars);
    var nRows = Math.pow(2, vars.length);
    var rows = [];
    for (var i = 0; i < nRows; i++) {
        var vals = {};
        for (var v = 0; v < vars.length; v++) vals[vars[v]] = !!((i >> (vars.length - 1 - v)) & 1);
        vals._result = lgEval(exprStr, vals);
        rows.push(vals);
    }
    return rows;
}

function lgFmt(b) { return b === null ? '?' : (b ? '1' : '0'); }

function lgHumanize(exprStr) {
    return (exprStr || '')
        .replace(/\bimplies\b/gi, '⇒')
        .replace(/\bnand\b/gi, 'NAND')
        .replace(/\bnor\b/gi, 'NOR')
        .replace(/\bxor\b/gi, '⊕')
        .replace(/\band\b/gi, '∧')
        .replace(/\bor\b/gi, '∨')
        .replace(/\bnot\s*/gi, '¬');
}

// ── Rendu HTML de la table de vérité ─────────────────────────────────────────
function lgRenderTable(exprStr, nbVars, blankRows) {
    var vars = lgVars(nbVars);
    var rows = lgBuildRows(exprStr, nbVars);
    var exprShort = exprStr.length > 30 ? exprStr.substring(0, 28) + '…' : exprStr;
    blankRows = blankRows || {};

    var h = '<table style="border-collapse:collapse;font-family:monospace;font-size:.88rem;">';
    h += '<thead><tr style="background:#ede9fe;">';
    vars.forEach(function (v) {
        h += '<th style="padding:4px 10px;border:1px solid #c4b5fd;text-align:center;">' + v + '</th>';
    });
    h += '<th style="padding:4px 10px;border:1px solid #c4b5fd;text-align:center;color:#7c3aed;">' + exprShort + '</th>';
    h += '</tr></thead><tbody>';

    rows.forEach(function (r, i) {
        var isBlank = !!blankRows[i];
        var bg = isBlank ? 'background:#fefce8;' : (i % 2 === 0 ? '' : 'background:#f9fafb;');
        h += '<tr style="' + bg + '">';
        vars.forEach(function (v) {
            h += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + lgFmt(r[v]) + '</td>';
        });
        if (isBlank) {
            h += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;color:#d97706;font-size:1.1em;">?</td>';
        } else {
            h += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + lgFmt(r._result) + '</td>';
        }
        h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
}

function lgAreEquiv(expr1, expr2, nbVars) {
    var vars = lgVars(nbVars);
    var nRows = Math.pow(2, vars.length);
    for (var i = 0; i < nRows; i++) {
        var vals = {};
        for (var v = 0; v < vars.length; v++) vals[vars[v]] = !!((i >> (vars.length - 1 - v)) & 1);
        if (lgEval(expr1, vals) !== lgEval(expr2, vals)) return false;
    }
    return true;
}

// ── Mise à jour du canvas (aperçu visuel dans l'onglet Config) ───────────────
function lgUpdateCanvas() {
    var el = document.getElementById('lg-canvas');
    if (!el) return;
    var scenario = (document.getElementById('lg-scenario') || {}).value || 'table';
    var nbVars = (document.getElementById('lg-nb-vars') || {}).value || '2';
    var expr = (document.getElementById('lg-expr') || {}).value || '';
    var expr2 = (document.getElementById('lg-expr2') || {}).value || '';
    var expr3 = (document.getElementById('lg-expr3') || {}).value || '';
    var expr4 = (document.getElementById('lg-expr4') || {}).value || '';
    var subexpr1 = (document.getElementById('lg-subexpr1') || {}).value || '';
    var subexpr2 = (document.getElementById('lg-subexpr2') || {}).value || '';
    var tans = (document.getElementById('lg-tans') || {}).value || '';
    var nbBlanks = parseInt((document.getElementById('lg-nb-blanks') || {}).value || '2');
    var nRows = Math.pow(2, lgVars(nbVars).length);

    if (!expr) { el.innerHTML = ''; return; }

    if (scenario === 'table') {
        el.innerHTML = lgRenderTable(expr, nbVars, {});
    } else if (scenario === 'cases') {
        var blanks = {};
        for (var i = Math.max(0, nRows - nbBlanks); i < nRows; i++) blanks[i] = true;
        el.innerHTML = lgRenderTable(expr, nbVars, blanks);
    } else if (scenario === 'identifier') {
        var choices = [expr, expr2, expr3, expr4].filter(Boolean);
        var html = lgRenderTable(expr, nbVars, {});
        html += '<div style="margin-top:8px;font-size:.85rem;">';
        choices.forEach(function (c, i) {
            var letter = String.fromCharCode(65 + i);
            html += '<div>' + letter + '. <code>' + lgHumanize(c) + '</code>' + (i === 0 ? ' <strong style="color:#15803d;">' + I18N.t('log.bonne_reponse') + '</strong>' : '') + '</div>';
        });
        html += '</div>';
        el.innerHTML = html;
    } else if (scenario === 'equivalence') {
        var equiv = expr && expr2 ? lgAreEquiv(expr, expr2, nbVars) : null;
        var html2 = '<div style="display:flex;gap:16px;flex-wrap:wrap;">'
            + '<div>' + lgRenderTable(expr, nbVars, {}) + '</div>';
        if (expr2) html2 += '<div>' + lgRenderTable(expr2, nbVars, {}) + '</div>';
        html2 += '</div>';
        if (expr && expr2) {
            html2 += '<div style="font-weight:bold;color:' + (equiv ? '#15803d' : '#dc2626') + ';margin-top:8px;">'
                + (equiv ? I18N.t('log.preview_equivalentes') : I18N.t('log.preview_non_equivalentes')) + '</div>';
        }
        el.innerHTML = html2;
    } else if (scenario === 'intermediaire') {
        var se1 = subexpr1 || '(P and Q)';
        var se2 = subexpr2 || 'not(P)';
        var vars = lgVars(nbVars);
        var h3 = '<table style="border-collapse:collapse;font-family:monospace;font-size:.88rem;"><thead><tr style="background:#ede9fe;">';
        vars.forEach(function (v) { h3 += '<th style="padding:4px 10px;border:1px solid #c4b5fd;">' + v + '</th>'; });
        h3 += '<th style="padding:4px 10px;border:1px solid #bfdbfe;background:#dbeafe;">' + se1 + '</th>'
            + '<th style="padding:4px 10px;border:1px solid #bfdbfe;background:#dbeafe;">' + se2 + '</th>'
            + '<th style="padding:4px 10px;border:1px solid #c4b5fd;color:#7c3aed;">' + expr + '</th></tr></thead><tbody>';
        for (var i2 = 0; i2 < nRows; i2++) {
            var vals = {};
            for (var v2 = 0; v2 < vars.length; v2++) vals[vars[v2]] = !!((i2 >> (vars.length - 1 - v2)) & 1);
            h3 += '<tr style="' + (i2 % 2 ? 'background:#f9fafb;' : '') + '">';
            vars.forEach(function (v) { h3 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (vals[v] ? 1 : 0) + '</td>'; });
            h3 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + lgFmt(lgEval(se1, vals)) + '</td>'
                + '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + lgFmt(lgEval(se2, vals)) + '</td>'
                + '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + lgFmt(lgEval(expr, vals)) + '</td></tr>';
        }
        h3 += '</tbody></table>';
        el.innerHTML = h3;
    } else if (scenario === 'simplif') {
        var html4 = '<div style="margin:6px 0;">';
        html4 += '<strong>' + I18N.t('log.preview_expr_a_simplifier') + '</strong> <code style="background:#ede9fe;padding:2px 6px;border-radius:4px;">' + expr + '</code>';
        if (tans) html4 += '<br><strong>' + I18N.t('log.preview_reponse_attendue') + '</strong> <code style="background:#d1fae5;padding:2px 6px;border-radius:4px;">' + tans + '</code>';
        html4 += '</div>';
        if (tans) {
            var ok = lgAreEquiv(expr, tans, nbVars);
            html4 += ok
                ? '<div style="color:#15803d;font-size:.82rem;">' + I18N.t('log.preview_simplif_ok') + '</div>'
                : '<div style="color:#dc2626;font-size:.82rem;">' + I18N.t('log.preview_simplif_warn') + '</div>';
        }
        html4 += '<br><strong>' + I18N.t('log.preview_table_complete') + '</strong><br>' + lgRenderTable(expr, nbVars, {});
        el.innerHTML = html4;
    }
}

// ── lgFormChange ──────────────────────────────────────────────────────────────
function lgFormChange() {
    var scenario = (document.getElementById('lg-scenario') || {}).value || 'table';
    var setVis = function (id, show) {
        var el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none';
    };
    setVis('lg-field-expr2', scenario === 'equivalent2' || scenario === 'equivalence');
    setVis('lg-field-expr3', scenario === 'identifier');
    setVis('lg-field-expr4', scenario === 'identifier');
    setVis('lg-field-subexpr', scenario === 'intermediaire');
    setVis('lg-field-tans', scenario === 'simplif');
    setVis('lg-field-nb-blanks', scenario === 'cases');

    var lblExpr = document.getElementById('lg-lbl-expr');
    if (lblExpr) {
        lblExpr.textContent = scenario === 'equivalence' ? I18N.t('log.lbl_premiere_expr')
            : scenario === 'identifier' ? I18N.t('log.lbl_expr_correcte')
            : scenario === 'simplif' ? I18N.t('log.lbl_expr_a_simplifier')
            : scenario === 'intermediaire' ? I18N.t('log.lbl_expr_finale')
            : I18N.t('log.expr_lbl');
    }
    var lblExpr2 = document.getElementById('lg-lbl-expr2');
    if (lblExpr2) lblExpr2.textContent = scenario === 'identifier' ? I18N.t('log.lbl_distracteur_b') : I18N.t('log.expr2_lbl');

    lgUpdateCanvas();

    var prev = document.getElementById('lg-preview');
    if (!prev) return;
    var expr = (document.getElementById('lg-expr') || {}).value || '';
    var nbVars = (document.getElementById('lg-nb-vars') || {}).value || '2';
    if (scenario === 'table') {
        prev.innerHTML = expr ? I18N.t('log.preview_table_desc') : '';
    } else if (scenario === 'cases') {
        var nbBlanks = parseInt((document.getElementById('lg-nb-blanks') || {}).value || '2');
        prev.innerHTML = expr ? I18N.t('log.preview_cases_desc', {n: nbBlanks}) : '';
    } else if (scenario === 'identifier') {
        prev.innerHTML = expr ? I18N.t('log.preview_identifier_desc') : '';
    } else if (scenario === 'equivalence') {
        var expr2 = (document.getElementById('lg-expr2') || {}).value || '';
        if (expr && expr2) {
            var equiv = lgAreEquiv(expr, expr2, nbVars);
            prev.innerHTML = I18N.t('log.preview_equiv_reponse', {val: equiv ? 'true' : 'false'});
        } else prev.innerHTML = I18N.t('log.preview_equiv_entrer');
    } else if (scenario === 'intermediaire') {
        prev.innerHTML = expr ? I18N.t('log.preview_intermediaire_desc') : '';
    } else if (scenario === 'simplif') {
        var tans = (document.getElementById('lg-tans') || {}).value || '';
        prev.innerHTML = I18N.t('log.preview_simplif_desc')
            + (tans ? I18N.t('log.preview_reponse_modele', {tans: tans}) : '');
    }
}
