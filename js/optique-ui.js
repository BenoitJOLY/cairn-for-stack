// optique-ui.js — UI helpers for the Optique question type
// Scénarios cibles : lentille-convergente, lentille-divergente, miroir-concave,
// miroir-convexe, miroir-plan, lunette-galilee, telescope-newton, microscope (tous implémentés).

var OPT_SCENARIO_INFO = {
    "lentille-convergente":
        "✏️ L'élève trace au moins deux des trois rayons particuliers issus de B à l'aide de la barre d'outils"
        + " (rayon 2 clics, rayon // axe, rayon parallèle 3 clics), puis construit le point B' par intersection"
        + " des rayons émergents. Le statut réel/virtuel de chaque tronçon est corrigé automatiquement.",
    "lentille-divergente":
        "✏️ Comme pour la lentille convergente, mais l'image est <strong>toujours virtuelle</strong> : les rayons"
        + " émergents divergent après la lentille et doivent être prolongés en arrière (pointillés) pour construire B'.",
    "miroir-plan":
        "✏️ L'élève trace les deux rayons remarquables issus de B (incidence normale, et rayon arrivant en S), les fait se"
        + " réfléchir sur le miroir plan, puis construit B' par intersection des rayons réfléchis prolongés. L'image est"
        + " <strong>toujours virtuelle et de même taille</strong> que l'objet.",
    "miroir-concave":
        "✏️ L'élève trace au moins deux des quatre rayons remarquables issus de B (// axe, par C, par F, vers S), les"
        + " fait se réfléchir sur le miroir, puis construit B' par intersection des rayons réfléchis. Selon la position"
        + " de l'objet (SA &lt; f ou SA &gt; f), l'image est virtuelle ou réelle — le statut réel/virtuel attendu de"
        + " chaque tronçon est corrigé automatiquement.",
    "miroir-convexe":
        "✏️ Comme pour le miroir concave, mais le foyer F et le centre C sont <strong>virtuels</strong> (derrière le"
        + " miroir) : l'image obtenue est toujours virtuelle, quelle que soit la position de l'objet.",
    "lunette-galilee":
        "✏️ L'élève construit quatre rayons remarquables : deux rayons incidents parallèles (l'un par le centre de"
        + " l'objectif) qui convergent en B&#8321; dans le plan focal commun, puis deux rayons issus de B&#8321; vers"
        + " l'oculaire, qui ressortent parallèles (système afocal, image à l'infini). Le point B&#8321; est construit"
        + " par l'outil « Intersection ».",
    "telescope-newton":
        "✏️ L'élève construit deux rayons incidents parallèles inclinés de θ (l'un touchant le sommet S du miroir"
        + " primaire, l'autre décalé de h) et leurs rayons réfléchis correspondants (utiliser « Symétrique / axe »"
        + " pour le rayon réfléchi au sommet), qui convergent au point image B&#8321; dans le plan focal du miroir."
        + " Le point B&#8321; est construit par l'outil « Intersection ».",
    "microscope":
        "✏️ L'élève trace au moins deux des trois rayons remarquables issus de B à travers l'objectif L&#8321;, qui"
        + " convergent en B&#8321; (image réelle intermédiaire, construite par « Intersection »), puis les deux rayons"
        + " issus de B&#8321; à travers l'oculaire L&#8322;, placé de sorte que B&#8321; soit exactement dans son plan"
        + " focal objet (réglage pour un œil normal) : le faisceau émergent ressort parallèle (image finale à l'infini)."
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
    if (infoEl) infoEl.innerHTML = OPT_SCENARIO_INFO[sc] || "";

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
            "lentille-convergente": "Optique — Lentille convergente",
            "lentille-divergente":  "Optique — Lentille divergente",
            "miroir-plan":          "Optique — Miroir plan",
            "miroir-concave":       "Optique — Miroir concave",
            "miroir-convexe":       "Optique — Miroir convexe",
            "lunette-galilee":      "Optique — Lunette astronomique",
            "telescope-newton":     "Optique — Télescope, miroir primaire",
            "microscope":           "Optique — Microscope, objectif + oculaire"
        };
        headEl.textContent = labels[sc] || "Optique géométrique";
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (SA <= 0) { el.innerHTML = "⚠️ SA doit être &gt; 0"; el.style.color = "#dc2626"; return; }

    el.style.color = "#7c3aed";
    el.innerHTML = "<strong>👻 Virtuelle, droite, même taille</strong><br>"
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ f'&#8321; doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (f2 <= 0) { el.innerHTML = "⚠️ f'&#8322; doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ θ doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (beamH <= 0) { el.innerHTML = "⚠️ h doit être &gt; 0"; el.style.color = "#dc2626"; return; }

    var d = f1 + f2;
    var grossissement = f1 / f2;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔭 Système afocal (image à l'infini)</strong><br>"
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ f'&#8321; doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ θ doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (beamH <= 0) { el.innerHTML = "⚠️ h doit être &gt; 0"; el.style.color = "#dc2626"; return; }

    var tanT = Math.tan(theta * Math.PI / 180);
    var yB1  = -f1 * tanT;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔭 Image dans le plan focal</strong><br>"
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (f1 <= 0) { el.innerHTML = "⚠️ f'&#8321; doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (f2 <= 0) { el.innerHTML = "⚠️ f'&#8322; doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (xA >= 0) { el.innerHTML = "⚠️ OA doit être &lt; 0"; el.style.color = "#dc2626"; return; }
    if (Math.abs(xA) <= f1) { el.innerHTML = "⚠️ |OA| doit être &gt; f'&#8321;"; el.style.color = "#dc2626"; return; }

    var xA1 = f1 * xA / (xA + f1);
    var gam = xA1 / xA;
    var ABp = gam * AB;
    var d   = xA1 + f2;

    el.style.color = "#0369a1";
    el.innerHTML = "<strong>🔬 Image intermédiaire réelle, puis système afocal</strong><br>"
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (f <= 0) { el.innerHTML = "⚠️ f' doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (OA >= 0) { el.innerHTML = "⚠️ OA doit être &lt; 0"; el.style.color = "#dc2626"; return; }

    var xA = OA;
    var xAp, gamma;
    if (sc === "lentille-divergente") {
        var xFp = -f;
        if (Math.abs(xA) < 0.01) { el.innerHTML = "⚠️ OA ne peut pas être nul"; el.style.color = "#dc2626"; return; }
        xAp = 1 / ((1 / xFp) + (1 / xA));
    } else {
        if (Math.abs(xA + f) < 0.01) {
            el.innerHTML = "⚠️ OA = −f' → image à l'infini"; el.style.color = "#dc2626"; return;
        }
        xAp = f * xA / (xA + f);
    }
    gamma = xAp / xA;
    var ABp = gamma * AB;

    var typeImg  = xAp >= 0 ? "📍 Réelle, renversée" : "👻 Virtuelle, droite";
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
        el.innerHTML = "<em>Saisir les paramètres…</em>"; el.style.color = "#6b7280"; return;
    }
    if (f <= 0) { el.innerHTML = "⚠️ f doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (SA <= 0) { el.innerHTML = "⚠️ SA doit être &gt; 0"; el.style.color = "#dc2626"; return; }
    if (!convexe && Math.abs(SA - f) < 0.01) {
        el.innerHTML = "⚠️ SA = f → image à l'infini"; el.style.color = "#dc2626"; return;
    }
    if (!convexe && Math.abs(SA - 2 * f) < 0.01) {
        el.innerHTML = "⚠️ SA = 2f → objet au centre C (rayon par C indéfini)"; el.style.color = "#dc2626"; return;
    }

    var xF  = convexe ? f : -f;
    var xA  = -SA;
    var xAp = xF * xA / (xA - xF);
    var gamma = -(xAp / xA);
    var ABp = gamma * AB;

    var typeImg  = xAp > 0 ? "👻 Virtuelle, droite" : "📍 Réelle, renversée";
    var colorImg = xAp > 0 ? "#7c3aed" : "#0369a1";
    el.style.color = colorImg;
    el.innerHTML = "<strong>" + typeImg + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "SA'&nbsp;=&nbsp;" + (-xAp).toFixed(2) + "&nbsp;cm,&nbsp;"
        + "A'B'&nbsp;=&nbsp;" + ABp.toFixed(2) + "&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;" + gamma.toFixed(2)
        + "</span>";
}
