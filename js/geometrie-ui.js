// geometrie-ui.js — Géométrie analytique
// Pas de préréglages : le "Type de question" (+ Dimension, + Valeurs) pilote l'affichage des champs et l'aperçu.

var GEO_DIM_SCENARIOS = { distance: 1, milieu: 1, norme: 1, aire: 1 };

function geoFormChange() {
    var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var scenario = gs('geo-scenario') || 'distance';
    var mode = gs('geo-mode') || 'aleatoire';
    var dimSel = gs('geo-dim') || '2d';

    var show = function (id, vis) { var e = document.getElementById(id); if (e) e.style.display = vis ? '' : 'none'; };
    var lbl = function (id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };

    var hasDimToggle = !!GEO_DIM_SCENARIOS[scenario];
    show('geo-field-dim', hasDimToggle);
    // pente et ordonnée n'ont pas de bascule 2D/3D : pente reste toujours en 3D
    // (point + vecteur directeur avec projection), ordonnée n'a que 3 coefficients.
    var is3d = hasDimToggle ? (dimSel === '3d') : (scenario === 'pente' || scenario === 'ordonnee');

    if (mode === 'fixe') {
        if (scenario === 'norme') {
            lbl('geo-lbl-p1', 'Vecteur u');
            lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y');
            show('geo-row-p1', true); show('geo-row-p1z', is3d);
            show('geo-row-p2', false); show('geo-row-p3', false);
        } else if (scenario === 'ordonnee') {
            lbl('geo-lbl-p1', 'Coefficients (a ; b ; c) — ax+by+c=0');
            lbl('geo-lbl-p1x', 'a'); lbl('geo-lbl-p1y', 'b'); lbl('geo-lbl-p1z', 'c');
            show('geo-row-p1', true); show('geo-row-p1z', true);
            show('geo-row-p2', false); show('geo-row-p3', false);
        } else if (scenario === 'pente') {
            lbl('geo-lbl-p1', 'Point A'); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', 'Vecteur directeur u'); lbl('geo-lbl-p2x', 'a'); lbl('geo-lbl-p2y', 'b'); lbl('geo-lbl-p2z', 'c');
            show('geo-row-p1', true); show('geo-row-p1z', true);
            show('geo-row-p2', true); show('geo-row-p2z', true);
            show('geo-row-p3', false);
        } else if (scenario === 'aire') {
            lbl('geo-lbl-p1', 'Point A'); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', 'Point B'); lbl('geo-lbl-p2x', 'x'); lbl('geo-lbl-p2y', 'y'); lbl('geo-lbl-p2z', 'z');
            show('geo-row-p1', true); show('geo-row-p1z', is3d);
            show('geo-row-p2', true); show('geo-row-p2z', is3d);
            show('geo-row-p3', true); show('geo-row-p3z', is3d);
        } else {
            // distance / milieu
            lbl('geo-lbl-p1', 'Point A'); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', 'Point B'); lbl('geo-lbl-p2x', 'x'); lbl('geo-lbl-p2y', 'y'); lbl('geo-lbl-p2z', 'z');
            show('geo-row-p1', true); show('geo-row-p1z', is3d);
            show('geo-row-p2', true); show('geo-row-p2z', is3d);
            show('geo-row-p3', false);
        }
        show('geo-fixe-zone', true);
    } else {
        show('geo-fixe-zone', false);
    }

    geoUpdatePreview();
}

function geoUpdatePreview() {
    var el = document.getElementById('geo-preview');
    if (!el) return;
    var gs = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    var scenario = gs('geo-scenario') || 'distance';
    var mode = gs('geo-mode') || 'aleatoire';
    var dimSel = gs('geo-dim') || '2d';
    var hasDimToggle = !!GEO_DIM_SCENARIOS[scenario];
    var is3d = hasDimToggle ? (dimSel === '3d') : (scenario === 'pente' || scenario === 'ordonnee');

    var descs = {
        'distance': 'Distance AB entre deux points A, B — réponse numérique arrondie à 10⁻².',
        'milieu': 'Milieu I du segment [AB] — réponse matrix([x],[y]' + (is3d ? ',[z]' : '') + '), valeurs exactes acceptées.',
        'norme': "Norme d'un vecteur u — réponse numérique arrondie à 10⁻².",
        'pente': "Pente de la projection d'une droite de l'espace (vecteur directeur u(a ; b ; c)) — réponse algébrique exacte (fraction).",
        'ordonnee': "Ordonnée à l'origine d'une droite ax+by+c=0 — réponse algébrique exacte.",
        'aire': 'Aire du triangle ABC' + (is3d ? " dans l'espace (produit vectoriel)" : ' (formule des aires 2D)') + ' — réponse numérique arrondie à 10⁻².'
    };
    var dimLabel = hasDimToggle ? (is3d ? ' [3D]' : ' [2D]') : (is3d ? ' [3D]' : '');

    var modeTxt = mode === 'fixe'
        ? 'Valeurs fixes saisies par l\'enseignant — même énoncé pour tous les étudiants.'
        : 'Coefficients générés par Maxima — valeurs différentes à chaque étudiant.';

    el.innerHTML = '<small style="color:#6b7280;">' + modeTxt + ' ' + (descs[scenario] || scenario) + dimLabel
        + ' PRT diagnostique détectant les erreurs types.</small>';
}
