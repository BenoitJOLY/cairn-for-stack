// optique-ui.js — UI helpers for the Optique question type (6 scenarios)

var OPT_SCENARIO_INFO = {
    "lentille-image":
        "🔭 L'élève positionne l'image A'B' en faisant glisser le point B'."
        + " Validation par la relation de conjugaison <strong>1/OA' &minus; 1/OA = 1/f'</strong>.",
    "lentille-rayons":
        "✏️ L'élève trace les 3 rayons remarquables en déplaçant les extrémités des rayons émergents."
        + " Chaque rayon est validé par sa distance perpendiculaire à la droite théorique.",
    "lunette":
        "🔭 L'élève place l'image intermédiaire B₁ dans le plan focal commun."
        + " Les rayons émergents de L₂ s'affichent automatiquement &mdash; ils deviennent"
        + " <strong>parallèles</strong> quand B₁ est en F'₁.",
    "miroir-plan":
        "🪞 L'élève place l'image A'B' en faisant glisser B'. Validation par la symétrie par rapport"
        + " au miroir plan : A'B' est l'image <strong>virtuelle, droite, même taille</strong> de AB.",
    "miroir-spherique":
        "🪞 L'élève positionne l'image A'B' d'un miroir sphérique en faisant glisser B'."
        + " Validation par la relation <strong>1/SA' + 1/SA = 1/f'</strong>.",
    "telescope":
        "🔭 L'élève place le foyer image B₁ du miroir concave primaire."
        + " Les rayons réfléchis s'affichent dynamiquement &mdash; ils <strong>convergent</strong>"
        + " vers B₁ quand celui-ci est à la position correcte."
};

function optScenarioChange() {
    var sc = (document.getElementById("opt-scenario") || {}).value || "lentille-image";

    var infoEl = document.getElementById("opt-info-box");
    if (infoEl) infoEl.innerHTML = OPT_SCENARIO_INFO[sc] || "";

    var isLentille = (sc === "lentille-image" || sc === "lentille-rayons");

    var sectLentille = document.getElementById("opt-sect-lentille");
    if (sectLentille) sectLentille.style.display = isLentille ? "" : "none";

    var sectLunette = document.getElementById("opt-sect-lunette");
    if (sectLunette) sectLunette.style.display = (sc === "lunette") ? "" : "none";

    var sectMP = document.getElementById("opt-sect-miroir-plan");
    if (sectMP) sectMP.style.display = (sc === "miroir-plan") ? "" : "none";

    var sectMS = document.getElementById("opt-sect-miroir-spherique");
    if (sectMS) sectMS.style.display = (sc === "miroir-spherique") ? "" : "none";

    var sectTel = document.getElementById("opt-sect-telescope");
    if (sectTel) sectTel.style.display = (sc === "telescope") ? "" : "none";

    var tolImage = document.getElementById("opt-tol-image");
    if (tolImage) tolImage.style.display = (sc === "lentille-image") ? "" : "none";

    var tolRayons = document.getElementById("opt-tol-rayons");
    if (tolRayons) tolRayons.style.display = (sc === "lentille-rayons") ? "" : "none";

    var headEl = document.getElementById("opt-head-label");
    if (headEl) {
        var labels = {
            "lentille-image":     "Optique — Lentille (image)",
            "lentille-rayons":    "Optique — Rayons remarquables",
            "lunette":            "Optique — Lunette astronomique",
            "miroir-plan":        "Optique — Miroir plan",
            "miroir-spherique":   "Optique — Miroir sphérique",
            "telescope":          "Optique — Télescope"
        };
        headEl.textContent = labels[sc] || "Optique géométrique";
    }

    optUpdatePreview();
}

function optUpdatePreview() {
    var sc = (document.getElementById("opt-scenario") || {}).value || "lentille-image";
    if (sc === "lentille-image" || sc === "lentille-rayons") {
        _optPreviewLentille();
    } else if (sc === "lunette") {
        _optPreviewLunette();
    } else if (sc === "miroir-spherique") {
        _optPreviewMiroirSph();
    } else if (sc === "telescope") {
        _optPreviewTelescope();
    }
}

function _optPreviewLentille() {
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
    if (Math.abs(OA + f) < 0.01) {
        el.innerHTML = "⚠️ OA = −f' → image à l'infini"; el.style.color = "#dc2626"; return;
    }

    var OAp   = f * OA / (OA + f);
    var gamma = OAp / OA;
    var ABp   = gamma * AB;

    var typeImg  = OAp > 0 ? "📍 Réelle, renversée" : "👻 Virtuelle, droite";
    var colorImg = OAp > 0 ? "#0369a1" : "#7c3aed";
    el.style.color = colorImg;
    el.innerHTML = "<strong>" + typeImg + "</strong><br>"
        + "<span style=\"font-size:.75rem;\">"
        + "OA'&nbsp;=&nbsp;" + OAp.toFixed(1) + "&nbsp;cm,&nbsp;"
        + "A'B'&nbsp;=&nbsp;" + ABp.toFixed(1) + "&nbsp;cm,&nbsp;"
        + "γ&nbsp;=&nbsp;" + gamma.toFixed(2)
        + "</span>";
}

function _optPreviewLunette() {
    var el = document.getElementById("opt-lunette-preview");
    if (!el) return;
    var f1    = parseFloat((document.getElementById("opt-f1")    || {}).value);
    var f2    = parseFloat((document.getElementById("opt-f2")    || {}).value);
    var theta = parseFloat((document.getElementById("opt-theta") || {}).value);

    if (isNaN(f1) || isNaN(f2) || isNaN(theta)) {
        el.innerHTML = "<em>Saisir les paramètres…</em>"; return;
    }
    if (f1 <= 0 || f2 <= 0) { el.innerHTML = "⚠️ f'₁ et f'₂ doivent être &gt; 0"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ θ doit être &gt; 0"; return; }

    var G   = -(f1 / f2);
    var yB1 = -(f1 * Math.tan(theta * Math.PI / 180));
    var d   = f1 + f2;
    var thp = Math.abs(G) * theta;

    el.innerHTML = "G' = −f'₁/f'₂ = <strong>" + G.toFixed(1) + "&times;</strong>"
        + "&nbsp;&nbsp;d = <strong>" + d.toFixed(0) + "&nbsp;cm</strong><br>"
        + "y(B₁) ≈ <strong>" + yB1.toFixed(2) + "&nbsp;cm</strong>"
        + "&nbsp;&nbsp;θ' ≈ <strong>" + thp.toFixed(1) + "&deg;</strong>";
}

function _optPreviewMiroirSph() {
    var el = document.getElementById("opt-ms-preview");
    if (!el) return;
    var f      = parseFloat((document.getElementById("opt-ms-f")  || {}).value);
    var SA     = parseFloat((document.getElementById("opt-ms-sa") || {}).value);
    var AB     = parseFloat((document.getElementById("opt-ms-ab") || {}).value);
    var msType = (document.getElementById("opt-ms-type") || {}).value || "concave";

    if (isNaN(f) || isNaN(SA) || isNaN(AB)) {
        el.innerHTML = "<em>Saisir les paramètres…</em>"; return;
    }
    if (f <= 0 || SA <= 0) { el.innerHTML = "⚠️ f' et SA doivent être &gt; 0"; return; }
    if (msType === "concave" && Math.abs(SA - f) < 0.01) {
        el.innerHTML = "⚠️ SA = f' → image à l'infini"; return;
    }

    // xF = focal point in diagram coords (negative = in front of mirror for concave)
    var xF  = (msType === "concave") ? -f : f;
    var xA  = -SA;
    var xAp = xF * xA / (xA - xF);
    var gam = -(xAp / xA);
    var ABp = gam * AB;
    var SAp = -xAp; // SA' in French convention

    var nature = xAp < 0 ? "réelle, renversée" : "virtuelle, droite";
    el.innerHTML = "SA' = <strong>" + SAp.toFixed(1) + "&nbsp;cm</strong>"
        + " (" + nature + ")<br>"
        + "A'B' = <strong>" + ABp.toFixed(1) + "&nbsp;cm</strong>"
        + "&nbsp;&nbsp;γ = <strong>" + gam.toFixed(2) + "</strong>";
}

function _optPreviewTelescope() {
    var el = document.getElementById("opt-tel-preview");
    if (!el) return;
    var f1    = parseFloat((document.getElementById("opt-tel-f1")    || {}).value);
    var theta = parseFloat((document.getElementById("opt-tel-theta") || {}).value);

    if (isNaN(f1) || isNaN(theta)) { el.innerHTML = "<em>Saisir les paramètres…</em>"; return; }
    if (f1 <= 0) { el.innerHTML = "⚠️ f'₁ doit être &gt; 0"; return; }
    if (theta <= 0) { el.innerHTML = "⚠️ θ doit être &gt; 0"; return; }

    var tanT = Math.tan(theta * Math.PI / 180);
    var yB1  = -f1 * tanT;

    el.innerHTML = "B₁ attendu : x = <strong>−f'₁ = " + (-f1).toFixed(0) + "&nbsp;cm</strong>"
        + ", y = <strong>" + yB1.toFixed(2) + "&nbsp;cm</strong><br>"
        + "<span style=\"font-size:.78rem;\">Les rayons réfléchis convergent vers B₁.</span>";
}
