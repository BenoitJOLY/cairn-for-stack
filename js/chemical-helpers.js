// ── CHEMICAL HELPERS (chemHtmlToMaxima, chemParseStructure) ─────
// ══════════════════════════════════════════════════════
//  LOGIQUE CHIMIE (Parsing & Helpers)
// ══════════════════════════════════════════════════════

// Liste des groupes fonctionnels reconnus
const FG_CHEM = ["CONH2","COOR","COOH","CO2","COO","CHO","CH3","C2H5","OH","NH2","NO2"];

function chemParseStructure(molStr) {
  var components = [], detected = [];
  var clean = molStr.replace(/-/g,'').replace(/^\{([^}]+)\}/g,'');
  var hasC = /(^|[^a-z])C([^a-z]|$)/.test(clean);
  var i = 0;
  while (i !== FG_CHEM.length) {
    var g = FG_CHEM[i];
    var reg = new RegExp(g + '(?:_\\{([^}]+)\\}|_([a-zA-Z0-9]+))?','g');
    var m;
    while ((m = reg.exec(clean)) !== null) {
      if (g === "OH") { if (!hasC) { break; } }
      var gName = (g === "CO2") ? "COO" : g;
      detected.push(gName);
      var count = m[1] ? m[1] : (m[2] ? m[2] : "1");
      components.push([isNaN(count) ? count : Number(count), gName]);
      var sp = ''; var si = 0;
      while (si !== m[0].length) { sp += ' '; si++; }
      clean = clean.substring(0, m.index) + sp + clean.substring(m.index + m[0].length);
    }
    i++;
  }
  var atomReg = /([A-Z][a-z]?)(?:_\{([^}]+)\}|_([a-zA-Z0-9]+))?/g;
  var am;
  while ((am = atomReg.exec(clean)) !== null) {
    var cnt = am[2] ? am[2] : (am[3] ? am[3] : "1");
    components.push([isNaN(cnt) ? cnt : Number(cnt), am[1]]);
  }
  return { components: components, detected: detected };
}

// Convertit HTML <sub>...</sub> en notation Maxima/LaTeX simple
function chemHtmlToMaxima(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  function convert(node) {
    var res = ''; var children = node.childNodes; var i = 0;
    while (i !== children.length) {
      var child = children[i];
      if (child.nodeType === 3) { res += child.textContent; }
      else if (child.nodeName === 'SUB') { res += '_{' + convert(child) + '}'; }
      else if (child.nodeName === 'SUP') { res += '^{' + convert(child) + '}'; }
      else { res += convert(child); }
      i++;
    }
    return res;
  }
  return convert(div).replace(/\u00a0/g, ' ').trim();
}
// ══════════════════════════════════════════════════════