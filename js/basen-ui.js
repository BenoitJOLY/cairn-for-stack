// basen-ui.js — UI helpers for Base-N conversion question type

function bnValueModeChange() {
    var mode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var fixeWrap = document.getElementById('bn-value-fixe-wrap');
    var aleaWrap = document.getElementById('bn-value-alea-wrap');
    if (fixeWrap) fixeWrap.style.display = (mode === 'fixe') ? '' : 'none';
    if (aleaWrap) aleaWrap.style.display = (mode === 'aleatoire') ? '' : 'none';
    bnFormChange();
}

// Vérifie que `str` ne contient que des chiffres valides pour `base` (0-9, A-Z).
// Retourne l'entier décimal correspondant, ou null si un chiffre est invalide.
function bnStrictParse(str, base) {
    var s = String(str == null ? '' : str).trim().toUpperCase();
    if (!s.length) return null;
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
    for (var i = 0; i < s.length; i++) {
        if (alphabet.indexOf(s[i]) === -1) return null;
    }
    return parseInt(s, base);
}

// bnLastInvalid mémorise si l'aperçu affiche actuellement une erreur de saisie
// (valeur impossible dans la base choisie, ou bornes aléatoires invalides) —
// utilisé pour bloquer l'enregistrement de la question tant que l'erreur persiste.
var bnLastInvalid = false;

function bnFormChange() {
    var fromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var toBase    = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var format    = (document.getElementById('bn-format') || {}).value || 'S';
    var valueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var valueBase = (document.getElementById('bn-value-base') || {}).value || 'depart';

    var lblVal  = document.getElementById('bn-lbl-value');
    if (lblVal) {
        if (valueMode === 'aleatoire') {
            lblVal.textContent = 'Valeur à convertir (bornes en décimal)';
        } else {
            var chosenBase = (valueBase === 'arrivee') ? toBase : fromBase;
            lblVal.textContent = 'Valeur à convertir (chiffres en base ' + chosenBase + ')';
        }
    }

    // La notation C n'a de sens que si la base d'arrivée (réponse attendue) est 2, 8 ou 16.
    var warnC = (format === 'C' && toBase !== 2 && toBase !== 8 && toBase !== 16);
    var formatSel = document.getElementById('bn-format');
    if (formatSel) {
        formatSel.style.borderColor = warnC ? '#dc2626' : '';
        formatSel.title = warnC ? 'La notation C (0b/0o/0x) n\'est disponible que pour les bases 2, 8 et 16. Passez en notation suffixe.' : '';
    }

    bnUpdatePreview();
}

function bnToBase(decVal, base) {
    if (base < 2 || base > 36) return '?';
    return decVal.toString(base).toUpperCase();
}

function bnSyntaxHint(format, toBase, fixedWidth) {
    if (toBase === 10) {
        return 'Notation attendue : uniquement le nombre entier résultat (sans espace).';
    }
    var widthNote = (fixedWidth > 0)
        ? (' Réponse attendue sur exactement <strong>' + fixedWidth + '</strong> chiffres : complétez avec des zéros devant si besoin.')
        : '';
    if (format === 'C') {
        if (toBase === 2)  return 'Notation attendue : préfixe 0b suivi des chiffres binaires en MAJUSCULES, sans espace (ex : 0b101010).' + widthNote;
        if (toBase === 8)  return 'Notation attendue : préfixe 0o suivi des chiffres octaux, sans espace (ex : 0o17).' + widthNote;
        if (toBase === 16) return 'Notation attendue : préfixe 0x suivi des chiffres hexadécimaux en MAJUSCULES, sans espace (ex : 0x1A).' + widthNote;
    }
    if (fixedWidth > 0) {
        return 'Notation attendue : chiffres ' + (toBase > 10 ? 'en MAJUSCULES, ' : '') + 'sans espace, sans préfixe.' + widthNote;
    }
    if (toBase > 10) {
        return 'Notation attendue : chiffres en MAJUSCULES, sans espace, sans préfixe, sans zéro inutile au début.';
    }
    return 'Notation attendue : chiffres uniquement, sans espace, sans préfixe, sans zéro inutile au début.';
}

function bnUpdatePreview() {
    var el = document.getElementById('bn-preview');
    if (!el) return;

    var fromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var toBase    = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var format    = (document.getElementById('bn-format') || {}).value || 'S';
    var valueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var valueBase = (document.getElementById('bn-value-base') || {}).value || 'depart';
    var fixedWidth = parseInt((document.getElementById('bn-fixed-width') || {}).value || '');

    var baseName = function(b) {
        return b === 2 ? 'binaire' : b === 8 ? 'octal' : b === 10 ? 'décimal' : b === 16 ? 'hexadécimal' : 'base ' + b;
    };

    // La notation choisie ne s'applique qu'à la représentation en base d'arrivée
    // (c'est la réponse attendue) ; la donnée de départ est toujours affichée en
    // simple suite de chiffres, sans préfixe ni indice (comme dans les XML réels).
    var formatDst = function(n) {
        if (toBase === 10) return '<code>' + n + '</code>';
        var s = bnToBase(n, toBase).toUpperCase();
        if (fixedWidth > 0 && s.length < fixedWidth) s = '0'.repeat(fixedWidth - s.length) + s;
        if (format === 'C') {
            if (toBase === 2)  return '<code>0b' + s + '</code>';
            if (toBase === 8)  return '<code>0o' + s + '</code>';
            if (toBase === 16) return '<code>0x' + s + '</code>';
        }
        return '<code>' + s + '</code>';
    };
    var formatSrc = function(n) {
        if (fromBase === 10) return '<code>' + n + '</code>';
        return '<code>' + bnToBase(n, fromBase).toUpperCase() + '</code>';
    };

    var html = '';

    if (valueMode === 'aleatoire') {
        var min = parseInt((document.getElementById('bn-value-min') || {}).value || '10');
        var max = parseInt((document.getElementById('bn-value-max') || {}).value || '99');
        if (isNaN(min) || isNaN(max) || min > max) {
            bnLastInvalid = true;
            el.innerHTML = '<em style="color:#dc2626;">Bornes invalides (min doit être ≤ max).</em>';
            return;
        }
        if (fixedWidth > 0 && toBase !== 10) {
            var neededMax = bnToBase(max, toBase).length;
            if (neededMax > fixedWidth) {
                bnLastInvalid = true;
                el.innerHTML = '<em style="color:#dc2626;">⚠ Largeur fixe impossible : la borne max (' + max + ') nécessite au moins ' + neededMax + ' chiffres en ' + baseName(toBase) + ', mais la largeur imposée n\'est que de ' + fixedWidth + '.</em>';
                return;
            }
        }
        var sample = min + Math.floor(Math.random() * (max - min + 1));
        html = 'Valeur tirée aléatoirement par Moodle entre <strong>' + min + '</strong> et <strong>' + max + '</strong> (décimal).'
             + ' Exemple : ' + formatSrc(sample) + ' (' + baseName(fromBase) + ') → ' + formatDst(sample) + ' (' + baseName(toBase) + ')';
    } else {
        var valRaw = (document.getElementById('bn-value') || {}).value || '42';
        var chosenBase = (valueBase === 'arrivee') ? toBase : fromBase;
        var parsed = bnStrictParse(valRaw, chosenBase);
        if (parsed === null) {
            bnLastInvalid = true;
            el.innerHTML = '<em style="color:#dc2626;">⚠ Valeur impossible : « ' + valRaw + ' » n\'est pas un nombre valide en base ' + chosenBase + '.</em>';
            return;
        }
        if (fixedWidth > 0 && toBase !== 10) {
            var neededFixe = bnToBase(parsed, toBase).length;
            if (neededFixe > fixedWidth) {
                bnLastInvalid = true;
                el.innerHTML = '<em style="color:#dc2626;">⚠ Largeur fixe impossible : ' + parsed + ' (décimal) nécessite au moins ' + neededFixe + ' chiffres en ' + baseName(toBase) + ', mais la largeur imposée n\'est que de ' + fixedWidth + '.</em>';
                return;
            }
        }
        html = 'Donnée : ' + formatSrc(parsed) + ' (' + baseName(fromBase) + ')'
             + ' &nbsp;→&nbsp; Réponse attendue : ' + formatDst(parsed) + ' (' + baseName(toBase) + ')';
    }

    bnLastInvalid = false;

    if (fromBase === toBase) {
        html += ' <span style="color:#dc2626">⚠ Base source = base cible</span>';
    }
    if (format === 'C' && toBase !== 2 && toBase !== 8 && toBase !== 16) {
        html += ' <span style="color:#dc2626">⚠ Notation C incompatible avec la base ' + toBase + '</span>';
    }
    if (fixedWidth > 0 && toBase === 10) {
        html += ' <span style="color:#dc2626">⚠ Largeur fixe ignorée (base d\'arrivée = décimal)</span>';
    }

    html += '<div style="margin-top:6px;font-style:italic;color:#1e3a8a;">' + bnSyntaxHint(format, toBase, fixedWidth) + '</div>';

    el.innerHTML = html;
}
