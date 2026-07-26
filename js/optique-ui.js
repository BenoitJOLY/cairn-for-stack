// optique-ui.js — UI helpers for the Optique question type
// Scénarios cibles : lentille-convergente, lentille-divergente, miroir-concave,
// miroir-convexe, miroir-plan, lunette-galilee, telescope-newton, microscope (tous implémentés).

var OPT_SCENARIO_INFO_KEY = {
    "lentille-convergente": "opt.info_lentille_convergente",
    "lentille-divergente":  "opt.info_lentille_divergente",
    "miroir-plan":          "opt.info_miroir_plan",
    "miroir-concave":       "opt.info_miroir_concave",
    "miroir-convexe":       "opt.info_miroir_convexe",
    "lunette-galilee":      "opt.info_lunette_galilee",
    "telescope-newton":     "opt.info_telescope_newton",
    "microscope":           "opt.info_microscope"
};

var OPT_SCENARIOS_LENTILLE = ["lentille-convergente", "lentille-divergente"];
var OPT_SCENARIOS_MIROIR   = ["miroir-concave", "miroir-convexe"];
var OPT_SCENARIOS_MIROIR_PLAN = ["miroir-plan"];
var OPT_SCENARIOS_LUNETTE  = ["lunette-galilee"];
var OPT_SCENARIOS_TELESCOPE = ["telescope-newton"];
var OPT_SCENARIOS_MICROSCOPE = ["microscope"];
var OPT_SCENARIOS_A_VENIR  = [];

function optScenarioChange() {
    var sc = (document.getElementById("opt-scenario") || {}).value || "lentille-convergente";

    var infoEl = document.getElementById("opt-info-box");
    if (infoEl) infoEl.innerHTML = OPT_SCENARIO_INFO_KEY[sc] ? I18N.t(OPT_SCENARIO_INFO_KEY[sc]) : "";

    var isLentille   = OPT_SCENARIOS_LENTILLE.indexOf(sc) > -1;
    var isMiroir     = OPT_SCENARIOS_MIROIR.indexOf(sc) > -1;
    var isMiroirPlan = OPT_SCENARIOS_MIROIR_PLAN.indexOf(sc) > -1;
    var isLunette    = OPT_SCENARIOS_LUNETTE.indexOf(sc) > -1;
    var isAVenir     = OPT_SCENARIOS_A_VENIR.indexOf(sc) > -1;

    var sectLentille = document.getElementById("opt-sect-lentille");
    if (sectLentille) sectLentille.style.display = isLentille ? "" : "none";

    var sectMiroir = document.getElementById("opt-sect-miroir");
    if (sectMiroir) sectMiroir.style.display = isMiroir ? "" : "none";

    var sectMiroirPlan = document.getElementById("opt-sect-miroir-plan");
    if (sectMiroirPlan) sectMiroirPlan.style.display = isMiroirPlan ? "" : "none";

    var sectLunette = document.getElementById("opt-sect-lunette");
    if (sectLunette) sectLunette.style.display = isLunette ? "" : "none";

    var isTelescope = OPT_SCENARIOS_TELESCOPE.indexOf(sc) > -1;
    var sectTelescope = document.getElementById("opt-sect-telescope");
    if (sectTelescope) sectTelescope.style.display = isTelescope ? "" : "none";

    var isMicroscope = OPT_SCENARIOS_MICROSCOPE.indexOf(sc) > -1;
    var sectMicroscope = document.getElementById("opt-sect-microscope");
    if (sectMicroscope) sectMicroscope.style.display = isMicroscope ? "" : "none";

    var sectAVenir = document.getElementById("opt-sect-non-implemente");
    if (sectAVenir) sectAVenir.style.display = isAVenir ? "" : "none";

    var headEl = document.getElementById("opt-head-label");
    if (headEl) {
        var labels = {
            "lentille-convergente": I18N.t('opt.head_lentille_convergente'),
            "lentille-divergente":  I18N.t('opt.head_lentille_divergente'),
            "miroir-plan":          I18N.t('opt.head_miroir_plan'),
            "miroir-concave":       I18N.t('opt.head_miroir_concave'),
            "miroir-convexe":       I18N.t('opt.head_miroir_convexe'),
            "lunette-galilee":      I18N.t('opt.head_lunette_galilee'),
            "telescope-newton":     I18N.t('opt.head_telescope_newton'),
            "microscope":           I18N.t('opt.head_microscope')
        };
        headEl.textContent = labels[sc] || I18N.t('opt.head_default');
    }

    optUpdatePreview();
}

function optUpdatePreview() {
    var sc = (document.getElementById("opt-scenario") || {}).value || "lentille-convergente";
    if (OPT_SCENARIOS_LENTILLE.indexOf(sc) > -1) {
        _optPreviewLentille(sc);
    } else if (OPT_SCENARIOS_MIROIR.indexOf(sc) > -1) {
        _optPreviewMiroir(sc);
    } else if (OPT_SCENARIOS_MIROIR_PLAN.indexOf(sc) > -1) {
        _optPreviewMiroirPlan(sc);
    } else if (OPT_SCENARIOS_LUNETTE.indexOf(sc) > -1) {
        _optPreviewLunette(sc);
    } else if (OPT_SCENARIOS_TELESCOPE.indexOf(sc) > -1) {
        _optPreviewTelescope(sc);
    } else if (OPT_SCENARIOS_MICROSCOPE.indexOf(sc) > -1) {
        _optPreviewMicroscope(sc);
    }
}

function _optPreviewMiroirPlan(sc) {
    var el = document.getElementById("opt-mp-preview");
    if (!el) return;
    var SA = parseFloat((document.getElementById("opt-mp-sa") || {}).value);
    var AB = parseFloat((document.getElementById("opt-mp-ab") || {}).value);

    if (isNaN(SA) || isNaN(AB)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (SA <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_sa_positive'); el.style.color = "#dc2626"; return; }

    el.style.color = "#7c3aed";
    el.innerHTML = "<strong>👻 " + I18N.t('opt.mp_type') + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "SA'&nbsp;=&nbsp;" + SA.toFixed(2) + "&nbsp;cm,&nbsp;"
        + "A'B'&nbsp;=&nbsp;" + AB.toFixed(2) + "&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;1.00"
        + "</span>";
}

function _optPreviewLunette(sc) {
    var el = document.getElementById("opt-lu-preview");
    if (!el) return;
    var f1    = parseFloat((document.getElementById("opt-f1")      || {}).value);
    var f2    = parseFloat((document.getElementById("opt-f2")      || {}).value);
    var theta = parseFloat((document.getElementById("opt-theta")   || {}).value);
    var beamH = parseFloat((document.getElementById("opt-beam-h")  || {}).value);

    if (isNaN(f1) || isNaN(f2) || isNaN(theta) || isNaN(beamH)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f1_positive'); el.style.color = "#dc2626"; return; }
    if (f2 <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f2_positive'); el.style.color = "#dc2626"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_theta_positive'); el.style.color = "#dc2626"; return; }
    if (beamH <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_h_positive'); el.style.color = "#dc2626"; return; }

    var d = f1 + f2;
    var grossissement = f1 / f2;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔭 " + I18N.t('opt.lu_type') + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "d&nbsp;=&nbsp;" + d.toFixed(1) + "&nbsp;cm,&nbsp;"
        + "G&nbsp;=&nbsp;" + grossissement.toFixed(2)
        + "</span>";
}

function _optPreviewTelescope(sc) {
    var el = document.getElementById("opt-tel-preview");
    if (!el) return;
    var f1    = parseFloat((document.getElementById("opt-tel-f1")     || {}).value);
    var theta = parseFloat((document.getElementById("opt-tel-theta")  || {}).value);
    var beamH = parseFloat((document.getElementById("opt-tel-beam-h") || {}).value);

    if (isNaN(f1) || isNaN(theta) || isNaN(beamH)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f1_positive'); el.style.color = "#dc2626"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_theta_positive'); el.style.color = "#dc2626"; return; }
    if (beamH <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_h_positive'); el.style.color = "#dc2626"; return; }

    var tanT = Math.tan(theta * Math.PI / 180);
    var yB1  = -f1 * tanT;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔭 " + I18N.t('opt.tel_type') + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "B&#8321;&nbsp;=&nbsp;(&minus;" + f1.toFixed(1) + "&nbsp;;&nbsp;" + yB1.toFixed(2) + ")&nbsp;cm"
        + "</span>";
}

function _optPreviewMicroscope(sc) {
    var el = document.getElementById("opt-mic-preview");
    if (!el) return;
    var f1 = parseFloat((document.getElementById("opt-mic-f1") || {}).value);
    var f2 = parseFloat((document.getElementById("opt-mic-f2") || {}).value);
    var xA = parseFloat((document.getElementById("opt-mic-oa") || {}).value);
    var AB = parseFloat((document.getElementById("opt-mic-ab") || {}).value);

    if (isNaN(f1) || isNaN(f2) || isNaN(xA) || isNaN(AB)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f1_positive'); el.style.color = "#dc2626"; return; }
    if (f2 <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f2_positive'); el.style.color = "#dc2626"; return; }
    if (xA >= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_oa_negative'); el.style.color = "#dc2626"; return; }
    if (Math.abs(xA) <= f1) { el.innerHTML = "⚠️ " + I18N.t('opt.err_oa_lt_f1_microscope'); el.style.color = "#dc2626"; return; }

    var xA1 = f1 * xA / (xA + f1);
    var gam = xA1 / xA;
    var ABp = gam * AB;
    var d   = xA1 + f2;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔬 " + I18N.t('opt.mic_type') + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "B&#8321;&nbsp;=&nbsp;(" + xA1.toFixed(2) + "&nbsp;;&nbsp;" + ABp.toFixed(3) + ")&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;" + gam.toFixed(2) + ",&nbsp;"
        + "d&nbsp;=&nbsp;O&#8321;O&#8322;&nbsp;=&nbsp;" + d.toFixed(2) + "&nbsp;cm"
        + "</span>";
}

function _optPreviewLentille(sc) {
    var el = document.getElementById("opt-image-preview");
    if (!el) return;
    var f  = parseFloat((document.getElementById("opt-f")  || {}).value);
    var OA = parseFloat((document.getElementById("opt-oa") || {}).value);
    var AB = parseFloat((document.getElementById("opt-ab") || {}).value);

    if (isNaN(f) || isNaN(OA) || isNaN(AB)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (f <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f_positive'); el.style.color = "#dc2626"; return; }
    if (OA >= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_oa_negative'); el.style.color = "#dc2626"; return; }

    var xA = OA;
    var xAp, gamma;
    if (sc === "lentille-divergente") {
        var xFp = -f;
        if (Math.abs(xA) < 0.01) { el.innerHTML = "⚠️ " + I18N.t('opt.err_oa_nul'); el.style.color = "#dc2626"; return; }
        xAp = 1 / ((1 / xFp) + (1 / xA));
    } else {
        if (Math.abs(xA + f) < 0.01) {
            el.innerHTML = "⚠️ " + I18N.t('opt.err_oa_eq_f_s1'); el.style.color = "#dc2626"; return;
        }
        xAp = f * xA / (xA + f);
    }
    gamma = xAp / xA;
    var ABp = gamma * AB;

    var typeImg  = xAp >= 0 ? I18N.t('opt.type_reelle_renversee') : I18N.t('opt.type_virtuelle_droite');
    var colorImg = xAp >= 0 ? "#0369a1" : "#7c3aed";
    el.style.color = colorImg;
    el.innerHTML = "<strong>" + typeImg + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "OA'&nbsp;=&nbsp;" + xAp.toFixed(1) + "&nbsp;cm,&nbsp;"
        + "A'B'&nbsp;=&nbsp;" + ABp.toFixed(1) + "&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;" + gamma.toFixed(2)
        + "</span>";
}

function _optPreviewMiroir(sc) {
    var el = document.getElementById("opt-mir-preview");
    if (!el) return;
    var f  = parseFloat((document.getElementById("opt-mir-f")  || {}).value);
    var SA = parseFloat((document.getElementById("opt-mir-sa") || {}).value);
    var AB = parseFloat((document.getElementById("opt-mir-ab") || {}).value);
    var convexe = (sc === "miroir-convexe");

    if (isNaN(f) || isNaN(SA) || isNaN(AB)) {
        el.innerHTML = "<em>" + I18N.t('opt.saisir_parametres') + "</em>"; el.style.color = "#6b7280"; return;
    }
    if (f <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_f_positive'); el.style.color = "#dc2626"; return; }
    if (SA <= 0) { el.innerHTML = "⚠️ " + I18N.t('opt.err_sa_positive'); el.style.color = "#dc2626"; return; }
    if (!convexe && Math.abs(SA - f) < 0.01) {
        el.innerHTML = "⚠️ " + I18N.t('opt.err_sa_eq_f'); el.style.color = "#dc2626"; return;
    }
    if (!convexe && Math.abs(SA - 2 * f) < 0.01) {
        el.innerHTML = "⚠️ " + I18N.t('opt.err_sa_eq_2f'); el.style.color = "#dc2626"; return;
    }

    var xF  = convexe ? f : -f;
    var xA  = -SA;
    var xAp = xF * xA / (xA - xF);
    var gamma = -(xAp / xA);
    var ABp = gamma * AB;

    var typeImg  = xAp > 0 ? I18N.t('opt.type_virtuelle_droite') : I18N.t('opt.type_reelle_renversee');
    var colorImg = xAp > 0 ? "#7c3aed" : "#0369a1";
    el.style.color = colorImg;
    el.innerHTML = "<strong>" + typeImg + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "SA'&nbsp;=&nbsp;" + (-xAp).toFixed(2) + "&nbsp;cm,&nbsp;"
        + "A'B'&nbsp;=&nbsp;" + ABp.toFixed(2) + "&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;" + gamma.toFixed(2)
        + "</span>";
}
