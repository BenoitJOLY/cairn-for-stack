// optique-ui.js — UI helpers for the Optique question type
// Scénarios cibles : lentille-convergente, lentille-divergente, miroir-concave,
// miroir-convexe (implémentés), miroir-plan, lunette-galilee, telescope-newton (à venir).

var OPT_SCENARIO_INFO = {
    "lentille-convergente":
        "✏️ L'élève trace au moins deux des trois rayons particuliers issus de B à l'aide de la barre d'outils"
        + " (rayon 2 clics, rayon // axe, rayon parallèle 3 clics), puis construit le point B' par intersection"
        + " des rayons émergents. Le statut réel/virtuel de chaque tronçon est corrigé automatiquement.",
    "lentille-divergente":
        "✏️ Comme pour la lentille convergente, mais l'image est <strong>toujours virtuelle</strong> : les rayons"
        + " émergents divergent après la lentille et doivent être prolongés en arrière (pointillés) pour construire B'.",
    "miroir-plan":
        "⏳ Scénario pas encore implémenté dans cette version.",
    "miroir-concave":
        "✏️ L'élève trace au moins deux des quatre rayons remarquables issus de B (// axe, par C, par F, vers S), les"
        + " fait se réfléchir sur le miroir, puis construit B' par intersection des rayons réfléchis. Selon la position"
        + " de l'objet (SA &lt; f ou SA &gt; f), l'image est virtuelle ou réelle — le statut réel/virtuel attendu de"
        + " chaque tronçon est corrigé automatiquement.",
    "miroir-convexe":
        "✏️ Comme pour le miroir concave, mais le foyer F et le centre C sont <strong>virtuels</strong> (derrière le"
        + " miroir) : l'image obtenue est toujours virtuelle, quelle que soit la position de l'objet.",
    "lunette-galilee":
        "⏳ Scénario pas encore implémenté dans cette version.",
    "telescope-newton":
        "⏳ Scénario pas encore implémenté dans cette version."
};

var OPT_SCENARIOS_LENTILLE = ["lentille-convergente", "lentille-divergente"];
var OPT_SCENARIOS_MIROIR   = ["miroir-concave", "miroir-convexe"];
var OPT_SCENARIOS_A_VENIR  = ["miroir-plan", "lunette-galilee", "telescope-newton"];

function optScenarioChange() {
    var sc = (document.getElementById("opt-scenario") || {}).value || "lentille-convergente";

    var infoEl = document.getElementById("opt-info-box");
    if (infoEl) infoEl.innerHTML = OPT_SCENARIO_INFO[sc] || "";

    var isLentille = OPT_SCENARIOS_LENTILLE.indexOf(sc) > -1;
    var isMiroir   = OPT_SCENARIOS_MIROIR.indexOf(sc) > -1;
    var isAVenir   = OPT_SCENARIOS_A_VENIR.indexOf(sc) > -1;

    var sectLentille = document.getElementById("opt-sect-lentille");
    if (sectLentille) sectLentille.style.display = isLentille ? "" : "none";

    var sectMiroir = document.getElementById("opt-sect-miroir");
    if (sectMiroir) sectMiroir.style.display = isMiroir ? "" : "none";

    var sectAVenir = document.getElementById("opt-sect-non-implemente");
    if (sectAVenir) sectAVenir.style.display = isAVenir ? "" : "none";

    var headEl = document.getElementById("opt-head-label");
    if (headEl) {
        var labels = {
            "lentille-convergente": "Optique — Lentille convergente",
            "lentille-divergente":  "Optique — Lentille divergente",
            "miroir-plan":          "Optique — Miroir plan (à venir)",
            "miroir-concave":       "Optique — Miroir concave",
            "miroir-convexe":       "Optique — Miroir convexe",
            "lunette-galilee":      "Optique — Lunette de Galilée (à venir)",
            "telescope-newton":     "Optique — Télescope de Newton (à venir)"
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
    }
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
