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
            lbl('geo-lbl-p1', I18N.t('geo.field_vecteur_u'));
            lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y');
            show('geo-row-p1', true); show('geo-row-p1z', is3d);
            show('geo-row-p2', false); show('geo-row-p3', false);
        } else if (scenario === 'ordonnee') {
            lbl('geo-lbl-p1', I18N.t('geo.field_coeffs_abc'));
            lbl('geo-lbl-p1x', 'a'); lbl('geo-lbl-p1y', 'b'); lbl('geo-lbl-p1z', 'c');
            show('geo-row-p1', true); show('geo-row-p1z', true);
            show('geo-row-p2', false); show('geo-row-p3', false);
        } else if (scenario === 'pente') {
            lbl('geo-lbl-p1', I18N.t('geo.field_point_a')); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', I18N.t('geo.field_vecteur_directeur_u')); lbl('geo-lbl-p2x', 'a'); lbl('geo-lbl-p2y', 'b'); lbl('geo-lbl-p2z', 'c');
            show('geo-row-p1', true); show('geo-row-p1z', true);
            show('geo-row-p2', true); show('geo-row-p2z', true);
            show('geo-row-p3', false);
        } else if (scenario === 'aire') {
            lbl('geo-lbl-p1', I18N.t('geo.field_point_a')); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', I18N.t('geo.field_point_b')); lbl('geo-lbl-p2x', 'x'); lbl('geo-lbl-p2y', 'y'); lbl('geo-lbl-p2z', 'z');
            show('geo-row-p1', true); show('geo-row-p1z', is3d);
            show('geo-row-p2', true); show('geo-row-p2z', is3d);
            show('geo-row-p3', true); show('geo-row-p3z', is3d);
        } else {
            // distance / milieu
            lbl('geo-lbl-p1', I18N.t('geo.field_point_a')); lbl('geo-lbl-p1x', 'x'); lbl('geo-lbl-p1y', 'y'); lbl('geo-lbl-p1z', 'z');
            lbl('geo-lbl-p2', I18N.t('geo.field_point_b')); lbl('geo-lbl-p2x', 'x'); lbl('geo-lbl-p2y', 'y'); lbl('geo-lbl-p2z', 'z');
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
        'distance': I18N.t('geo.desc_distance'),
        'milieu': I18N.t('geo.desc_milieu', {z: is3d ? ',[z]' : ''}),
        'norme': I18N.t('geo.desc_norme'),
        'pente': I18N.t('geo.desc_pente'),
        'ordonnee': I18N.t('geo.desc_ordonnee'),
        'aire': I18N.t('geo.desc_aire', {suffix: is3d ? I18N.t('geo.desc_aire_3d_suffix') : I18N.t('geo.desc_aire_2d_suffix')})
    };
    var dimLabel = hasDimToggle ? (is3d ? ' [3D]' : ' [2D]') : (is3d ? ' [3D]' : '');

    var modeTxt = mode === 'fixe'
        ? I18N.t('geo.mode_txt_fixe')
        : I18N.t('geo.mode_txt_aleatoire');

    el.innerHTML = '<small style="color:#6b7280;">' + modeTxt + ' ' + (descs[scenario] || scenario) + dimLabel
        + ' ' + I18N.t('geo.preview_prt_suffix') + '</small>';
}
