// geogebra-ui.js — Panneau de configuration du type "GeoGebra"

/* ── Modèles préréglés "tracé de courbe" ──────────────────────────────
   Contrat GeoGebra générique partagé par les 4 modèles : l'activité de
   l'enseignant pousse les coefficients (set=) dans des objets GeoGebra de
   même nom, et expose des objets de DIAGNOSTIC (watch=) calculés à partir
   de g (la courbe tracée à main levée par l'élève) via les commandes
   symboliques de GeoGebra elles-mêmes (Root, Extremum, pente par différence
   finie) plutôt qu'un simple échantillonnage de points : on vérifie ainsi
   si l'élève a trouvé les bonnes racines/le bon extremum, et si le sens de
   variation (signe de la pente) est correct ou inversé. La comparaison aux
   valeurs théoriques (issues des coefficients) se fait côté PRT Maxima.
   Chaque diagnostic doit être calculé dans le bouton "Valider mon tracé"
   du .ggb via SetValue[nomSortie, If(IsDefined(g), <ggbExpr>, 0)], et tous
   les objets (coefficients + diagnostics) doivent être MASQUÉS dans le
   .ggb (show object="false") pour ne jamais révéler la réponse à l'élève :
   aucune couleur ni indication de réussite ne doit apparaître côté
   GeoGebra, seul le bouton "Vérifier" de STACK donne un retour noté. */
/* Chaque coefficient est décrit par des bornes/pas par défaut (pas une
   expression Maxima) : l'enseignant choisit "valeur fixe" ou "min/max/pas"
   dans le panneau, StackForge construit l'expression rand() correspondante
   lui-même (voir ggbCoeffExpr). unitSuffix est ajouté tel quel après le
   nombre tiré (utile pour exprimer un angle en multiples de π/4 par ex.). */
var GGB_MODELS = {
  deg2: {
    coeffs: [
      {name: 'a', label: 'a (ouverture)', min: -4, max: 4, step: 1},
      {name: 'h', label: 'h (abscisse du sommet)', min: -3, max: 3, step: 1},
      {name: 'k', label: 'k (ordonnée du sommet)', min: -3, max: 3, step: 1}
    ],
    texFx: 'f(x)={@a@}(x-({@h@}))^2+{@k@}',
    materialId: 'mnna2zk5',
    diagnostics: [
      {ggbName: 'gVx', ggbExpr: 'x(Extremum(g,h-3,h+3))', expected: 'h', tol: '0.5'},
      {ggbName: 'gVy', ggbExpr: 'y(Extremum(g,h-3,h+3))', expected: 'k', tol: '0.5'},
      {ggbName: 'gSlopeSign', ggbExpr: 'sign((g(h+2)-g(h+1.6))/0.4)', expected: 'signum(a)', compareMode: 'sign'}
    ]
  },
  deg3: {
    coeffs: [
      {name: 'a', label: 'a (coefficient dominant)', min: -2, max: 2, step: 1},
      {name: 'r1', label: 'r1 (1ère racine)', min: -4, max: -2, step: 1},
      {name: 'r2', label: 'r2 (2e racine)', min: -1, max: 1, step: 1},
      {name: 'r3', label: 'r3 (3e racine)', min: 2, max: 4, step: 1}
    ],
    texFx: 'f(x)={@a@}(x-({@r1@}))(x-({@r2@}))(x-({@r3@}))',
    materialId: 'jtchsntt',
    diagnostics: [
      {ggbName: 'gR1', ggbExpr: 'x(Root(g,r1-0.8,r1+0.8))', expected: 'r1', tol: '0.5'},
      {ggbName: 'gR2', ggbExpr: 'x(Root(g,r2-0.8,r2+0.8))', expected: 'r2', tol: '0.5'},
      {ggbName: 'gR3', ggbExpr: 'x(Root(g,r3-0.8,r3+0.8))', expected: 'r3', tol: '0.5'},
      {ggbName: 'gSlopeSign', ggbExpr: 'sign((g(r3+2)-g(r3+1.6))/0.4)', expected: 'signum(a)', compareMode: 'sign'}
    ]
  },
  trig: {
    coeffs: [
      {name: 'A', label: 'A (amplitude)', min: 1, max: 3, step: 1},
      {name: 'B', label: 'B (pulsation)', min: 1, max: 2, step: 1},
      {name: 'C', label: 'C (déphasage, en × π/4)', min: 0, max: 3, step: 1, unitSuffix: '*%pi/4', unitLabel: '× π/4'},
      {name: 'D', label: 'D (décalage vertical)', min: -2, max: 2, step: 1}
    ],
    texFx: 'f(x)={@A@}\\sin({@B@}x+{@C@})+{@D@}',
    materialId: 'k6kh93du',
    diagnostics: [
      {ggbName: 'gMaxY', ggbExpr: 'Max(Sequence(g(t),t,-1,7,0.05))', expected: 'D+A', tol: '0.5'},
      {ggbName: 'gMinY', ggbExpr: 'Min(Sequence(g(t),t,-1,7,0.05))', expected: 'D-A', tol: '0.5'},
      {ggbName: 'gSlopeSign', ggbExpr: 'sign((g(0.2)-g(-0.2))/0.4)', expected: 'signum(A*B*cos(C))', compareMode: 'sign'}
    ]
  },
  exp: {
    coeffs: [
      {name: 'A', label: 'A (facteur)', min: 1, max: 3, step: 1},
      {name: 'B', label: 'B (taux, ± si décroissant)', min: -1, max: 1, step: 0.2},
      {name: 'C', label: 'C (décalage vertical)', min: -2, max: 2, step: 1}
    ],
    texFx: 'f(x)={@A@}e^{ {@B@}x }+{@C@}',
    materialId: 'shxtffzc',
    diagnostics: [
      {ggbName: 'gAtMinus2', ggbExpr: 'g(-2)', expected: 'A*exp(-2*B)+C', tol: '2'},
      {ggbName: 'gAtPlus2', ggbExpr: 'g(2)', expected: 'A*exp(2*B)+C', tol: '2'},
      {ggbName: 'gSlopeSign', ggbExpr: 'sign((g(0.2)-g(-0.2))/0.4)', expected: 'signum(A*B)', compareMode: 'sign'}
    ]
  }
};

/* Construit l'expression Maxima d'un coefficient à partir de sa config
   {mode:'fixed', value} ou {mode:'random', min, max, step}. */
function ggbCoeffExpr(cfg, unitSuffix) {
  var suf = unitSuffix || '';
  if (!cfg || cfg.mode === 'fixed') {
    var v = (cfg && cfg.value !== undefined && cfg.value !== '') ? parseFloat(cfg.value) : 0;
    if (!isFinite(v)) v = 0;
    return (v < 0 ? '(' + v + ')' : String(v)) + suf;
  }
  var min = parseFloat(cfg.min), max = parseFloat(cfg.max), step = parseFloat(cfg.step);
  if (!isFinite(min)) min = 0;
  if (!isFinite(max) || max < min) max = min;
  if (!isFinite(step) || step <= 0) step = 1;
  var n = Math.max(1, Math.round((max - min) / step) + 1);
  var base = (min < 0 ? '(' + min + ')' : String(min)) + '+' + step + '*rand(' + n + ')';
  return base + suf;
}

/* Reconstruit st.inputs (coefficients + x0..x3) à partir de st.coeffCfg
   et du modèle actif. Appelée à chaque modification d'un coefficient. */
function ggbRecomputeInputsFromCoeffCfg() {
  var st = window._ggbState;
  var m = st && GGB_MODELS[st.model];
  if (!m) return;
  st.inputs = m.coeffs.map(function (c) {
    var cfg = (st.coeffCfg || {})[c.name] || {mode: 'random', min: c.min, max: c.max, step: c.step};
    return {ggbName: c.name, expr: ggbCoeffExpr(cfg, c.unitSuffix)};
  });
}

function ggbDefaultState() {
  return {
    model: 'expert', materialId: '', width: 700, height: 500, showToolbar: false,
    inputs: [], outputs: [{ggbName: '', type: 'numerical', tans: '', tol: '0.01'}],
    remember: ''
  };
}

/* Applique un modèle préréglé : remplace entrées/sorties par le contrat
   coefficients + x0..x3 -> gX0..gX3 du modèle choisi. 'expert' ne touche
   pas aux entrées/sorties existantes (édition libre). */
function ggbApplyModel(key) {
  var st = window._ggbState || ggbDefaultState();
  st.model = key;
  var m = GGB_MODELS[key];
  if (m) {
    if (!st.coeffCfg || st._coeffCfgModel !== key) {
      st.coeffCfg = {};
      m.coeffs.forEach(function (c) {
        st.coeffCfg[c.name] = {mode: 'random', min: c.min, max: c.max, step: c.step, value: c.min};
      });
      st._coeffCfgModel = key;
      /* Les noms de coefficients ('A','B'...) sont réutilisés d'un modèle à
         l'autre avec des significations différentes : on efface les valeurs
         de test de l'aperçu pour éviter qu'une ancienne valeur ne s'applique
         par erreur au nouveau modèle. */
      window._ggbPreviewOverrides = {};
    }
    ggbRecomputeInputsFromCoeffCfg();
    st.outputs = m.diagnostics.map(function (d) {
      var o = {ggbName: d.ggbName, type: 'numerical', tans: d.expected, tol: d.tol || '0.5'};
      if (d.compareMode) o.compareMode = d.compareMode;
      return o;
    });
    /* La barre d'outils GeoGebra doit rester visible : l'élève en a besoin
       pour accéder à l'outil "Fonction à main levée". */
    st.showToolbar = true;
    /* Sélectionne d'office l'identifiant de matériel geogebra.org officiel
       du modèle choisi ; l'enseignant peut toujours le remplacer ensuite
       par le sien dans le champ (activité personnalisée). */
    if (m.materialId) st.materialId = m.materialId;
    st.remember = m.remember || '';
  } else {
    st.remember = '';
  }
  window._ggbState = st;
  var sel = document.getElementById('ggb-model');
  if (sel) sel.value = key;
  var matEl = document.getElementById('ggb-material-id');
  if (matEl) matEl.value = st.materialId || '';
  var tb = document.getElementById('ggb-show-toolbar');
  if (tb) { tb.checked = st.showToolbar; tb.disabled = !!m; }
  ggbRenderInputs();
  ggbRenderOutputs();
  ggbUpdateModelUI();
}

/* ── Coefficients (mode préréglé) : UI "fixe" ou "min/max/pas" ────────
   Remplace l'édition libre d'expression Maxima par des champs numériques
   simples, accessibles sans connaître la syntaxe Maxima/rand(). */
function ggbRenderCoeffs() {
  var c = document.getElementById('ggb-inputs-list'); if (!c) return;
  var st = window._ggbState || ggbDefaultState();
  var m = GGB_MODELS[st.model];
  if (!m) return;
  c.innerHTML = m.coeffs.map(function (co) {
    var cfg = (st.coeffCfg || {})[co.name] || {mode: 'random', min: co.min, max: co.max, step: co.step};
    var isFixed = cfg.mode === 'fixed';
    var unit = co.unitLabel ? ' <span class="hint">(' + attrEsc(co.unitLabel) + ')</span>' : '';
    return '<div class="ggb-coeff-row">'
      + '<label class="ggb-coeff-name">' + attrEsc(co.label || co.name) + unit + '</label>'
      + '<div class="ggb-coeff-fields">'
      + '<select class="hs-input ggb-coeff-mode" onchange="ggbUpdateCoeffMode(\'' + co.name + '\',this.value)">'
      + '<option value="random"' + (!isFixed ? ' selected' : '') + '>' + I18N.t('ggb.coeff_mode_random') + '</option>'
      + '<option value="fixed"' + (isFixed ? ' selected' : '') + '>' + I18N.t('ggb.coeff_mode_fixed') + '</option>'
      + '</select>'
      + (isFixed
        ? '<input type="number" step="any" class="hs-input ggb-coeff-val" placeholder="' + I18N.t('ggb.coeff_value_ph') + '" value="' + attrEsc(cfg.value != null ? cfg.value : '') + '" onchange="ggbUpdateCoeffField(\'' + co.name + '\',\'value\',this.value)">'
        : '<input type="number" step="any" class="hs-input ggb-coeff-val" placeholder="' + I18N.t('ggb.coeff_min_ph') + '" value="' + attrEsc(cfg.min != null ? cfg.min : co.min) + '" onchange="ggbUpdateCoeffField(\'' + co.name + '\',\'min\',this.value)">'
          + '<input type="number" step="any" class="hs-input ggb-coeff-val" placeholder="' + I18N.t('ggb.coeff_max_ph') + '" value="' + attrEsc(cfg.max != null ? cfg.max : co.max) + '" onchange="ggbUpdateCoeffField(\'' + co.name + '\',\'max\',this.value)">'
          + '<input type="number" step="any" min="0" class="hs-input ggb-coeff-val" placeholder="' + I18N.t('ggb.coeff_step_ph') + '" value="' + attrEsc(cfg.step != null ? cfg.step : co.step) + '" onchange="ggbUpdateCoeffField(\'' + co.name + '\',\'step\',this.value)">')
      + '</div></div>';
  }).join('');
}
function ggbUpdateCoeffMode(name, mode) {
  var st = window._ggbState; if (!st || !st.coeffCfg || !st.coeffCfg[name]) return;
  st.coeffCfg[name].mode = mode;
  ggbRecomputeInputsFromCoeffCfg();
  ggbRenderCoeffs();
}
function ggbUpdateCoeffField(name, field, val) {
  var st = window._ggbState; if (!st || !st.coeffCfg || !st.coeffCfg[name]) return;
  st.coeffCfg[name][field] = val;
  ggbRecomputeInputsFromCoeffCfg();
}

function ggbUpdateModelUI() {
  var st = window._ggbState || ggbDefaultState();
  var isExpert = !st.model || st.model === 'expert';
  var hint = document.getElementById('ggb-model-hint');
  if (hint) hint.textContent = isExpert
    ? I18N.t('ggb.model_hint_expert')
    : I18N.t('ggb.model_hint_preset');
  ['ggb-add-input-btn', 'ggb-add-output-btn'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.style.display = isExpert ? '' : 'none';
  });
  var tb = document.getElementById('ggb-show-toolbar');
  if (tb) tb.disabled = !isExpert;
  var inLbl = document.getElementById('ggb-inputs-label');
  if (inLbl) inLbl.textContent = isExpert ? I18N.t('ggb.inputs_lbl') : I18N.t('ggb.coeffs_lbl');
  var outField = document.getElementById('ggb-outputs-field');
  if (outField) outField.style.display = isExpert ? '' : 'none';
}

function ggbReset() {
  window._ggbState = ggbDefaultState();
  window._ggbPreviewOverrides = {};
  ggbRenderInputs();
  ggbRenderOutputs();
  document.getElementById('ggb-material-id').value = '';
  document.getElementById('ggb-width').value = 700;
  document.getElementById('ggb-height').value = 500;
  if (document.getElementById('ggb-show-toolbar')) document.getElementById('ggb-show-toolbar').checked = false;
  if (document.getElementById('ggb-model')) document.getElementById('ggb-model').value = 'expert';
  ggbUpdateModelUI();
  var prev = document.getElementById('ggb-preview-container');
  if (prev) prev.innerHTML = '';
  var ov = document.getElementById('ggb-preview-overrides');
  if (ov) { ov.innerHTML = ''; ov.style.display = 'none'; }
}

function ggbRestoreState(s) {
  window._ggbState = {
    model: s.model || 'expert',
    materialId: s.materialId || '', width: s.width || 700, height: s.height || 500,
    showToolbar: !!s.showToolbar,
    inputs: JSON.parse(JSON.stringify(s.inputs || [])),
    outputs: JSON.parse(JSON.stringify(s.outputs && s.outputs.length ? s.outputs : ggbDefaultState().outputs)),
    coeffCfg: JSON.parse(JSON.stringify(s.coeffCfg || {})),
    _coeffCfgModel: s.model || 'expert'
  };
  document.getElementById('ggb-material-id').value = window._ggbState.materialId;
  document.getElementById('ggb-width').value = window._ggbState.width;
  document.getElementById('ggb-height').value = window._ggbState.height;
  if (document.getElementById('ggb-show-toolbar')) document.getElementById('ggb-show-toolbar').checked = window._ggbState.showToolbar;
  if (document.getElementById('ggb-model')) document.getElementById('ggb-model').value = window._ggbState.model;
  ggbRenderInputs();
  ggbRenderOutputs();
  ggbUpdateModelUI();
  if (typeof ggbRefreshPreview === 'function') ggbRefreshPreview();
}

/* ── Variables d'entrée (Maxima → objet GeoGebra) ─────────────────── */
function ggbRenderInputs() {
  var st = window._ggbState || ggbDefaultState();
  if (GGB_MODELS[st.model]) { ggbRenderCoeffs(); return; }
  var c = document.getElementById('ggb-inputs-list'); if (!c) return;
  var rows = st.inputs || [];
  c.innerHTML = rows.map(function (r, i) {
    return '<div class="ggb-row">'
      + '<input class="hs-input ggb-mono" placeholder="' + I18N.t('ggb.ph_ggb_obj') + '" value="' + attrEsc(r.ggbName || '') + '" '
      + 'onchange="ggbUpdateInput(' + i + ',\'ggbName\',this.value)">'
      + '<span class="ggb-arrow">←</span>'
      + '<input class="hs-input ggb-mono" placeholder="' + I18N.t('ggb.ph_maxima_expr') + '" value="' + attrEsc(r.expr || '') + '" '
      + 'onchange="ggbUpdateInput(' + i + ',\'expr\',this.value)">'
      + '<button type="button" class="ggb-row-del" onclick="ggbRemoveInput(' + i + ')" title="' + I18N.t('common.supprimer') + '">✕</button>'
      + '</div>';
  }).join('') || '<div class="ggb-empty">' + I18N.t('ggb.no_inputs') + '</div>';
}
function ggbAddInput() {
  window._ggbState.inputs.push({ggbName: '', expr: ''});
  ggbRenderInputs();
}
function ggbRemoveInput(i) {
  window._ggbState.inputs.splice(i, 1);
  ggbRenderInputs();
}
function ggbUpdateInput(i, field, val) {
  if (!window._ggbState.inputs[i]) return;
  window._ggbState.inputs[i][field] = val;
}

/* ── Variables de sortie (objet GeoGebra → input STACK noté) ──────── */
function ggbRenderOutputs() {
  var c = document.getElementById('ggb-outputs-list'); if (!c) return;
  var rows = (window._ggbState || ggbDefaultState()).outputs || [];
  c.innerHTML = rows.map(function (r, i) {
    var t = r.type || 'numerical';
    var typeOpts = ['numerical', 'boolean', 'string'].map(function (x) {
      return '<option value="' + x + '"' + (t === x ? ' selected' : '') + '>' + I18N.t('ggb.type_' + x) + '</option>';
    }).join('');
    return '<div class="ggb-row ggb-row-out">'
      + '<input class="hs-input ggb-mono" placeholder="' + I18N.t('ggb.ph_ggb_obj') + '" value="' + attrEsc(r.ggbName || '') + '" '
      + 'onchange="ggbUpdateOutput(' + i + ',\'ggbName\',this.value)">'
      + '<select class="hs-input" onchange="ggbUpdateOutput(' + i + ',\'type\',this.value)">' + typeOpts + '</select>'
      + '<input class="hs-input ggb-mono" placeholder="' + I18N.t('ggb.ph_tans') + '" value="' + attrEsc(r.tans || '') + '" '
      + 'onchange="ggbUpdateOutput(' + i + ',\'tans\',this.value)">'
      + (t === 'numerical'
        ? '<input type="number" step="any" min="0" class="hs-input ggb-tol" placeholder="±" value="' + attrEsc(r.tol || '0.01') + '" '
          + 'onchange="ggbUpdateOutput(' + i + ',\'tol\',this.value)">'
        : '<span class="ggb-tol-spacer"></span>')
      + '<button type="button" class="ggb-row-del" onclick="ggbRemoveOutput(' + i + ')" title="' + I18N.t('common.supprimer') + '">✕</button>'
      + '</div>';
  }).join('');
}
function ggbAddOutput() {
  window._ggbState.outputs.push({ggbName: '', type: 'numerical', tans: '', tol: '0.01'});
  ggbRenderOutputs();
}
function ggbRemoveOutput(i) {
  if (window._ggbState.outputs.length <= 1) { toast(I18N.t('ggb.err_no_outputs')); return; }
  window._ggbState.outputs.splice(i, 1);
  ggbRenderOutputs();
}
function ggbUpdateOutput(i, field, val) {
  if (!window._ggbState.outputs[i]) return;
  window._ggbState.outputs[i][field] = val;
  if (field === 'type') ggbRenderOutputs();
}

/* ── Capture depuis le formulaire live ─────────────────────────────── */
function ggbCaptureFromForm() {
  var st = window._ggbState || ggbDefaultState();
  st.materialId = document.getElementById('ggb-material-id').value || '';
  st.width = document.getElementById('ggb-width').value || 700;
  st.height = document.getElementById('ggb-height').value || 500;
  st.showToolbar = document.getElementById('ggb-show-toolbar') ? document.getElementById('ggb-show-toolbar').checked : false;
  window._ggbState = st;
  return st;
}

/* ── Aperçu "test de paramètres" (modèles préréglés) ──────────────────
   {#expr#} dans ggbBuildEmbedHtml() est une expression Maxima (rand()...)
   qu'on ne peut pas évaluer côté navigateur : par défaut on la remplaçait
   par "1" partout, ce qui affichait toujours la même courbe triviale quel
   que soit le paramétrage choisi par l'enseignant. On permet ici de fixer
   une valeur de test par coefficient (mémorisée dans window._ggbPreviewOverrides),
   utilisée à la fois pour l'injection réelle dans l'applet et pour l'affichage
   de la formule, afin que l'aperçu montre une courbe cohérente avec l'équation. */
function ggbPreviewOverrideVal(name, coeffCfgEntry) {
  var ov = window._ggbPreviewOverrides || {};
  if (ov[name] !== undefined && ov[name] !== '') {
    var n = parseFloat(ov[name]);
    if (isFinite(n)) return n;
  }
  if (coeffCfgEntry && coeffCfgEntry.mode === 'fixed' && coeffCfgEntry.value !== undefined && coeffCfgEntry.value !== '') {
    var nf = parseFloat(coeffCfgEntry.value);
    if (isFinite(nf)) return nf;
  }
  if (coeffCfgEntry) {
    var min = parseFloat(coeffCfgEntry.min), max = parseFloat(coeffCfgEntry.max);
    if (isFinite(min) && isFinite(max)) return (min + max) / 2;
  }
  return 1;
}
function ggbSetPreviewOverride(name, val) {
  window._ggbPreviewOverrides = window._ggbPreviewOverrides || {};
  window._ggbPreviewOverrides[name] = val;
  ggbRefreshPreview();
}
function ggbRenderPreviewOverrides() {
  var c = document.getElementById('ggb-preview-overrides');
  if (!c) return;
  var st = window._ggbState || ggbDefaultState();
  var m = GGB_MODELS[st.model];
  if (!m || !(st.inputs || []).length) { c.innerHTML = ''; c.style.display = 'none'; return; }
  c.style.display = '';
  c.innerHTML = '<div class="hint" style="margin-bottom:4px;">' + I18N.t('ggb.preview_override_hint') + '</div>'
    + (st.inputs || []).map(function (r) {
      var val = ggbPreviewOverrideVal(r.ggbName, (st.coeffCfg || {})[r.ggbName]);
      return '<label style="display:inline-flex;align-items:center;gap:4px;margin:0 10px 6px 0;font-size:.82rem;">'
        + '<code>' + attrEsc(r.ggbName) + '</code>'
        + '<input type="number" step="any" class="hs-input" style="width:80px;" value="' + attrEsc(val) + '" '
        + 'onchange="ggbSetPreviewOverride(\'' + r.ggbName.replace(/'/g, "\\'") + '\',this.value)">'
        + '</label>';
    }).join('');
}

/* ── Aperçu live réel (vraie applet GeoGebra, iframe scriptée) ─────── */
function ggbRefreshPreview() {
  var st = ggbCaptureFromForm();
  ggbRenderPreviewOverrides();
  if (!st.materialId.trim()) {
    var c = document.getElementById('ggb-preview-container');
    if (c) c.innerHTML = '<div class="ggb-preview-hint">' + I18N.t('ggb.preview_hint_no_id') + '</div>';
    return;
  }
  var modelPreset = GGB_MODELS[st.model];
  var isPreset = !!modelPreset;

  /* Injecte les valeurs de test (ou "1" en mode Expert, où les expressions
     Maxima libres ne sont de toute façon pas évaluables côté navigateur). */
  var previewSt = st;
  if (isPreset) {
    var previewInputs = (st.inputs || []).map(function (r) {
      var n = ggbPreviewOverrideVal(r.ggbName, (st.coeffCfg || {})[r.ggbName]);
      return {ggbName: r.ggbName, expr: String(n)};
    });
    previewSt = Object.assign({}, st, {inputs: previewInputs});
  }
  var focusFbGen = false;
  try {
    var onPane0 = document.querySelector('#fp-geogebra .mpane.on');
    focusFbGen = !!(onPane0 && onPane0.id === 'ggb-fb-gen');
  } catch (e) {}

  var built = ggbBuildEmbedHtml('prev', previewSt, {preview: true, isPreset: isPreset, focusFbGen: focusFbGen});
  var appletHtml = isPreset
    ? built.containerHtml.replace(/\{#([^#]*)#\}/g, function (_, inner) {
      var n = parseFloat(inner);
      return isFinite(n) ? String(n) : '1';
    })
    : built.containerHtml.replace(/\{#[^#]*#\}/g, '1');

  var instruction = (typeof richVal === 'function') ? richVal('ggb-text') : '';
  var formulaHtml = '';
  if (modelPreset && modelPreset.texFx) {
    var tex = modelPreset.texFx;
    modelPreset.coeffs.forEach(function (c) {
      var n = ggbPreviewOverrideVal(c.name, (st.coeffCfg || {})[c.name]);
      var re = new RegExp('\\{@' + c.name + '@\\}', 'g');
      tex = tex.replace(re, (n < 0 ? '(' + n + ')' : String(n)));
    });
    formulaHtml = '<p>' + I18N.t('ggb.tracez_courbe_lbl') + ' \\[' + tex + '\\]</p>';
  }

  var outputs = (st.outputs || []).filter(function (o) { return o.ggbName; });
  var fb = (outputs.length && typeof ggbBuildFeedbackHtml === 'function')
    ? ggbBuildFeedbackHtml(outputs, 'apercu') : {trueFb: '', falseFb: ''};

  var fbGenExtra = (typeof richVal === 'function') ? richVal('ggb-fbgen') : '';

  var html = '<!doctype html><html><head><meta charset="utf-8">'
    + '<link rel="stylesheet" href="lib/katex/katex.min.css">'
    + '<style>'
    + 'body{margin:0;padding:12px 14px;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1f2937;}'
    + '.hs-preview-text{margin-bottom:10px;}'
    + '.hs-fb-section-title{margin-top:18px;padding-top:9px;border-top:1px dashed #cbd5e1;font-size:.8rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.02em;}'
    + 'body.hs-focus-fbgen .hs-main-block{display:none;}'
    + 'body:not(.hs-focus-fbgen) .hs-fbgen-block{display:none;}'
    + '</style></head>'
    + '<body class="' + (focusFbGen ? 'hs-focus-fbgen' : '') + '">'
    + '<div class="hs-preview-text">' + _hsRenderMath((instruction || '') + formulaHtml) + '</div>'
    + appletHtml
    + '<div class="hs-main-block">'
    + '<div class="hs-fb-section-title">' + I18N.t('ggb.preview_fb_title') + '</div>'
    + wrapFb(_hsRenderMath(fb.trueFb), true)
    + wrapFb(_hsRenderMath(fb.falseFb), false)
    + '<p style="font-size:.82rem;color:#6b7280;margin-top:6px;">' + I18N.t('ggb.preview_freeze_note') + '</p>'
    + '</div>'
    + '<div class="hs-fbgen-block">'
    + '<div class="hs-fb-section-title">' + I18N.t('common.tab_fbgen') + '</div>'
    + '<div style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">'
    + I18N.t('ggb.fbgen_auto_note')
    + (fbGenExtra ? '<div style="margin-top:8px;">' + _hsRenderMath(fbGenExtra) + '</div>' : '')
    + '</div></div>'
    + '</body></html>';

  mountPreviewIframeScripted('ggb-preview-container', html);
}

/* ── Bascule légère Config/Feedback général sans reconstruire l'applet ──
   Rebuilder l'iframe à chaque clic d'onglet ferait perdre le tracé en
   cours de l'enseignant dans l'aperçu ; la sandbox reste "allow-same-origin"
   donc on peut simplement basculer une classe CSS sur le document déjà monté. */
function ggbUpdatePreviewFocus() {
  var container = document.getElementById('ggb-preview-container');
  var iframe = container && container.querySelector('iframe.hs-preview-iframe');
  if (!iframe) return;
  try {
    var onPane = document.querySelector('#fp-geogebra .mpane.on');
    var isFbGen = !!(onPane && onPane.id === 'ggb-fb-gen');
    iframe.contentWindow.document.body.classList.toggle('hs-focus-fbgen', isFbGen);
    /* Les modèles préréglés exposent un objet booléen "afficherCorrige" qui
       pilote la visibilité de la courbe de référence f (cf. .ggb des presets) :
       on la révèle uniquement dans l'onglet Feedback général, pour que
       l'enseignant puisse comparer visuellement le tracé attendu. */
    var api = iframe.contentWindow['ggbApplet_prev'];
    if (api && typeof api.setValue === 'function') {
      api.setValue('afficherCorrige', isFbGen ? 1 : 0);
    }
  } catch (e) {}
}
